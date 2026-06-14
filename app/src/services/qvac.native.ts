/**
 * Native (device) implementation of the QVAC service: on-device MedPsy with manual
 * delegate→local fallback. Mirrors the verified shared/ reasoning service + the spike's
 * mobile SDK usage (loadModel device:"gpu" → streamed completion → split <think>).
 *
 * Default model is the registry LLAMA-1B that the spike already verified on the iPhone
 * (TTFT 432ms · 44.6 tok/s · gpu); pass `opts.modelSrc = MEDPSY_1_7B_SRC` to use MedPsy
 * once its on-device download is verified. Delegated runs target laptop MedPsy-4B.
 */
import { loadModel, completion, unloadModel, LLAMA_3_2_1B_INST_Q4_0 } from "@qvac/sdk";
import { buildExplainHistory, buildFollowUpHistory, splitThink, type ChatMessage } from "./reasoning";
import { formatFindings, type ParsedLab } from "./labparse";
import type { DelegateConfig, ExplainOptions, ExplainOutcome, HealthRecord, QvacService } from "./types";

/** MedPsy-1.7B GGUF (Qwen3-Thinking base). Swap in via opts.modelSrc after device-verifying the download. */
export const MEDPSY_1_7B_SRC =
  "https://huggingface.co/qvac/MedPsy-1.7B-GGUF/resolve/main/medpsy-1.7b-q4_k_m-imat.gguf";

/** modelSrc accepts a registry model descriptor (object) or a URL/path string. */
type ModelSrc = string | typeof LLAMA_3_2_1B_INST_Q4_0;
const DEFAULT_MODEL_SRC: ModelSrc = LLAMA_3_2_1B_INST_Q4_0;
const DELEGATE_TIMEOUT_MS = 120_000; // SDK's own delegate timeout — aligned with the wall guard below
// Hard wall-clock guards. The SDK's delegate.timeout does NOT reliably fire on iOS, so a
// failed/slow P2P link can hang forever and deadlock the UI (analyzing never resets). We race
// every run against a wall clock; on timeout a delegated run gracefully falls back on-device.
// Delegated completions stream token-by-token over a blind relay and can be slow, so the wall
// is generous — too short and we'd abort a slow-but-working stream. (Delegate crux: day1 E1.)
const DELEGATE_WALL_MS = 120_000; // generous: relayed P2P streaming can be slow; don't abort early
const LOCAL_WALL_MS = 90_000; // on-device load+inference is seconds; a never-hit safety net
const CTX_SIZE = 8192; // thinking models overflow the default ctx → set explicitly

/** Reject if `p` doesn't settle within `ms`. On a delegated run ANY rejection (timeout,
 *  transport drop, provider error) triggers the on-device fallback, so no error code is needed. */
function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  // If we time out we abandon `p`; swallow any late rejection so it can't surface as an
  // unhandled-rejection RedBox. (A late RESOLVE is harmless — runOnce unloads in its finally.)
  p.catch(() => undefined);
  return new Promise<T>((resolve, reject) => {
    const id = setTimeout(() => {
      reject(new Error(`operation timed out after ${ms}ms`));
    }, ms);
    p.then(
      (v) => {
        clearTimeout(id);
        resolve(v);
      },
      (e) => {
        clearTimeout(id);
        reject(e);
      },
    );
  });
}

function labelFor(modelSrc: ModelSrc): string {
  return modelSrc === MEDPSY_1_7B_SRC ? "MedPsy-1.7B" : "Llama-3.2-1B";
}

interface RunResult {
  contentText: string;
  thinkingText?: string;
  stats?: { timeToFirstToken?: number; tokensPerSecond?: number; backendDevice?: string };
  tokens: number;
  loadMs: number;
}

async function runOnce(
  history: ChatMessage[],
  modelSrc: ModelSrc,
  delegate: DelegateConfig | undefined,
): Promise<RunResult> {
  const t0 = Date.now();
  const modelId = await loadModel({
    modelSrc,
    modelType: "llm",
    modelConfig: { device: "gpu", ctx_size: CTX_SIZE },
    ...(delegate
      ? { delegate: { providerPublicKey: delegate.providerPublicKey, timeout: delegate.timeout ?? DELEGATE_TIMEOUT_MS } }
      : {}),
  });
  const loadMs = Date.now() - t0;
  try {
    const run = completion({ modelId, history, stream: true });
    void run.final.catch(() => undefined); // absorb a possible rejection if the stream errors first
    let tokens = 0;
    for await (const _tok of run.tokenStream) tokens++;
    const final = await run.final;
    return {
      contentText: final.contentText ?? "",
      thinkingText: final.thinkingText,
      stats: final.stats,
      tokens,
      loadMs,
    };
  } finally {
    await unloadModel({ modelId }).catch(() => undefined); // always free the model
  }
}

const EMPTY_FALLBACK =
  "The model didn't return a readable explanation. Please try again, or pair a laptop for a deeper read. This is health education, not a diagnosis.";

async function runReasoning(history: ChatMessage[], opts?: ExplainOptions): Promise<ExplainOutcome> {
  const modelSrc: ModelSrc = opts?.modelSrc ?? DEFAULT_MODEL_SRC;
  const delegate = opts?.delegate;
  let servedBy: ExplainOutcome["servedBy"] = delegate ? "delegated" : "local";
  let fellBackToLocal = false;

  let res: RunResult;
  try {
    res = delegate
      ? await withTimeout(runOnce(history, modelSrc, delegate), DELEGATE_WALL_MS)
      : await withTimeout(runOnce(history, modelSrc, undefined), LOCAL_WALL_MS);
  } catch (err) {
    // Delegation is best-effort: ANY failure (timeout, ETIMEDOUT, transport drop, provider
    // error) falls back to an on-device run so the user still gets their explanation.
    if (delegate) {
      servedBy = "local";
      fellBackToLocal = true;
      res = await withTimeout(runOnce(history, modelSrc, undefined), LOCAL_WALL_MS);
    } else {
      throw err;
    }
  }

  // ALWAYS strip <think> — some models leave it in contentText.
  const split = splitThink(res.contentText.trim());
  const thinking = res.thinkingText?.trim() || split.thinking;
  const engine = servedBy === "delegated" ? "MedPsy-4B (delegated)" : labelFor(modelSrc);
  return {
    summary: split.answer.trim() || EMPTY_FALLBACK, // never persist a blank summary
    thinking,
    servedBy,
    engine,
    fellBackToLocal,
    stats: {
      ttftMs: res.stats?.timeToFirstToken,
      tokensPerSec: res.stats?.tokensPerSecond,
      backend: res.stats?.backendDevice,
      tokens: res.tokens,
      loadMs: res.loadMs,
    },
  };
}

export const isOnDevice = true;

export async function explain(
  reportText: string,
  parsed: ParsedLab,
  opts?: ExplainOptions,
): Promise<ExplainOutcome> {
  return runReasoning(buildExplainHistory(reportText, formatFindings(parsed)), opts);
}

export async function followUp(
  question: string,
  records: ReadonlyArray<Pick<HealthRecord, "ts" | "reportText" | "summary">>,
  opts?: ExplainOptions,
): Promise<ExplainOutcome> {
  const prior = records.map((r) => ({ ts: r.ts, reportText: r.reportText, answer: r.summary }));
  return runReasoning(buildFollowUpHistory(question, prior), opts);
}

const service: QvacService = { isOnDevice, explain, followUp };
export default service;
