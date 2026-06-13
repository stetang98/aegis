/**
 * explainReport — the product core: report text -> injection-safe history -> (delegated or local)
 * MedPsy completion -> answer (+ hidden reasoning) -> profiler/stats evidence. Includes manual
 * graceful fallback: if a delegated run fails to reach the provider (SDK codes 53701/53702), it
 * transparently retries locally.
 *
 * The LLM is injected via the `LlmClient` interface so this orchestration is fully unit-testable with a
 * mock; the real @qvac/sdk-backed client implements the same interface.
 */
import { buildExplainHistory, type ChatMessage } from "./prompt";
import { splitThink } from "./think";
import {
  toEvidenceRows,
  type ProfilerSnapshot,
  type RunContext,
  type EvidenceRow,
  type CompletionStatsLike,
} from "../metrics/logger";

/** What a completion resolves to (mapped from the SDK's CompletionFinal). */
export interface CompletionOutcome {
  /** SDK answer with `<think>` already stripped. */
  contentText: string;
  thinkingText?: string;
  /** Full raw text including any `<think>` block — used as a fallback for answer/thinking. */
  rawText: string;
  stats?: CompletionStatsLike;
}

export interface CompletionStream {
  tokenStream: AsyncIterable<string>;
  /** Resolves when the completion fully finishes (answer text, reasoning, and stats). */
  final: Promise<CompletionOutcome>;
}

export interface DelegateConfig {
  providerPublicKey: string;
  timeout?: number;
}

export interface LlmClient {
  loadLLM(opts: { src: string; delegate?: DelegateConfig }): Promise<string>;
  streamCompletion(modelId: string, history: ChatMessage[]): CompletionStream;
  unload(modelId: string): Promise<void>;
  snapshot(): ProfilerSnapshot;
}

export interface ExplainParams {
  reportText: string;
  client: LlmClient;
  /** Path or descriptor for the model to load. */
  modelSrc: string;
  /** Clean display name for evidence (e.g. "MedPsy-4B"). */
  model: string;
  device: string;
  delegate?: DelegateConfig;
  /** ISO-8601 timestamp for evidence rows (caller supplies). */
  isoTime: string;
}

export interface ExplainResult {
  answer: string;
  thinking: string | null;
  servedBy: "delegated" | "local";
  evidence: EvidenceRow[];
}

/** SDK delegate-failure codes (see spikes/day1-findings.md). */
const DELEGATE_FAILURE_CODES = new Set([53701, 53702]);

function isDelegateFailure(err: unknown): boolean {
  const code = (err as { code?: unknown } | null | undefined)?.code;
  return typeof code === "number" && DELEGATE_FAILURE_CODES.has(code);
}

async function runOnce(
  params: ExplainParams,
  delegate: DelegateConfig | undefined,
): Promise<{ outcome: CompletionOutcome; tokens: number; modelId: string }> {
  const history = buildExplainHistory(params.reportText);
  const modelId = await params.client.loadLLM({ src: params.modelSrc, delegate });
  try {
    const run = params.client.streamCompletion(modelId, history);
    void run.final.catch(() => undefined); // absorb a possible rejection if the stream errors first
    let tokens = 0;
    for await (const _tok of run.tokenStream) {
      tokens++;
    }
    const outcome = await run.final; // authoritative answer text + reasoning + stats
    return { outcome, tokens, modelId };
  } catch (err) {
    await params.client.unload(modelId).catch(() => undefined);
    throw err;
  }
}

export async function explainReport(params: ExplainParams): Promise<ExplainResult> {
  let servedBy: "delegated" | "local" = params.delegate ? "delegated" : "local";
  let run: { outcome: CompletionOutcome; tokens: number; modelId: string };
  try {
    run = await runOnce(params, params.delegate);
  } catch (err) {
    if (params.delegate && isDelegateFailure(err)) {
      servedBy = "local"; // graceful fallback: provider unreachable -> run on-device
      run = await runOnce(params, undefined);
    } else {
      throw err;
    }
  }

  // ALWAYS run our tested think-stripper over the SDK's answer text: some models leave the
  // <think> block in contentText, and the answer surface must never contain reasoning.
  const parsed = splitThink(run.outcome.contentText.trim() || run.outcome.rawText);
  const answer = parsed.answer;
  const sdkThinking = run.outcome.thinkingText?.trim();
  const thinking = sdkThinking && sdkThinking.length > 0 ? sdkThinking : parsed.thinking;

  const ctx: RunContext = {
    isoTime: params.isoTime,
    model: params.model,
    device: params.device,
    delegated: servedBy === "delegated",
    promptChars: params.reportText.length,
    tokensOut: run.tokens,
  };
  // Unload before snapshotting: the profiler snapshot is accumulative and does not need the model
  // loaded, and this guarantees the model is freed even if snapshot()/toEvidenceRows throws.
  await params.client.unload(run.modelId);
  const evidence = toEvidenceRows(params.client.snapshot(), run.outcome.stats, ctx);
  return { answer, thinking, servedBy, evidence };
}
