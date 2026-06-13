/**
 * Reasoning service: report -> explanation, and cross-history question -> answer. Both build an
 * injection-safe history, run a (delegated or local) MedPsy completion with manual graceful fallback
 * (SDK codes 53701/53702 -> retry on-device), guarantee `<think>` is stripped from the answer, and
 * produce profiler/stats evidence. The LLM is injected via LlmClient so this is fully unit-testable.
 */
import { buildExplainHistory, buildFollowUpHistory, type ChatMessage, type PriorRecord } from "./prompt";
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
  contentText: string;
  thinkingText?: string;
  rawText: string;
  stats?: CompletionStatsLike;
}

export interface CompletionStream {
  tokenStream: AsyncIterable<string>;
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

export interface ExplainResult {
  answer: string;
  thinking: string | null;
  servedBy: "delegated" | "local";
  evidence: EvidenceRow[];
}

export interface ExplainParams {
  reportText: string;
  client: LlmClient;
  modelSrc: string;
  model: string;
  device: string;
  delegate?: DelegateConfig;
  isoTime: string;
}

export interface FollowUpParams {
  question: string;
  records: PriorRecord[];
  client: LlmClient;
  modelSrc: string;
  model: string;
  device: string;
  delegate?: DelegateConfig;
  isoTime: string;
}

interface ReasoningCommon {
  client: LlmClient;
  modelSrc: string;
  model: string;
  device: string;
  delegate?: DelegateConfig;
  isoTime: string;
  promptChars: number;
}

/** SDK delegate-failure codes (see spikes/day1-findings.md). */
const DELEGATE_FAILURE_CODES = new Set([53701, 53702]);

function isDelegateFailure(err: unknown): boolean {
  const code = (err as { code?: unknown } | null | undefined)?.code;
  return typeof code === "number" && DELEGATE_FAILURE_CODES.has(code);
}

async function runOnce(
  common: ReasoningCommon,
  delegate: DelegateConfig | undefined,
  history: ChatMessage[],
): Promise<{ outcome: CompletionOutcome; tokens: number; modelId: string }> {
  const modelId = await common.client.loadLLM({ src: common.modelSrc, delegate });
  try {
    const run = common.client.streamCompletion(modelId, history);
    void run.final.catch(() => undefined); // absorb a possible rejection if the stream errors first
    let tokens = 0;
    for await (const _tok of run.tokenStream) {
      tokens++;
    }
    const outcome = await run.final;
    return { outcome, tokens, modelId };
  } catch (err) {
    await common.client.unload(modelId).catch(() => undefined);
    throw err;
  }
}

async function runReasoning(common: ReasoningCommon, history: ChatMessage[]): Promise<ExplainResult> {
  let servedBy: "delegated" | "local" = common.delegate ? "delegated" : "local";
  let run: { outcome: CompletionOutcome; tokens: number; modelId: string };
  try {
    run = await runOnce(common, common.delegate, history);
  } catch (err) {
    if (common.delegate && isDelegateFailure(err)) {
      servedBy = "local"; // graceful fallback: provider unreachable -> run on-device
      run = await runOnce(common, undefined, history);
    } else {
      throw err;
    }
  }

  // ALWAYS run our tested think-stripper: some models leave the <think> block in contentText.
  const parsed = splitThink(run.outcome.contentText.trim() || run.outcome.rawText);
  const answer = parsed.answer;
  const sdkThinking = run.outcome.thinkingText?.trim();
  const thinking = sdkThinking && sdkThinking.length > 0 ? sdkThinking : parsed.thinking;

  const ctx: RunContext = {
    isoTime: common.isoTime,
    model: common.model,
    device: common.device,
    delegated: servedBy === "delegated",
    promptChars: common.promptChars,
    tokensOut: run.tokens,
  };
  // Unload before snapshotting so the model is freed even if snapshot()/toEvidenceRows throws.
  await common.client.unload(run.modelId);
  const evidence = toEvidenceRows(common.client.snapshot(), run.outcome.stats, ctx);
  return { answer, thinking, servedBy, evidence };
}

function commonOf(p: ExplainParams | FollowUpParams, promptChars: number): ReasoningCommon {
  return {
    client: p.client,
    modelSrc: p.modelSrc,
    model: p.model,
    device: p.device,
    delegate: p.delegate,
    isoTime: p.isoTime,
    promptChars,
  };
}

/** Explain a single lab report in plain language with evidence. */
export async function explainReport(params: ExplainParams): Promise<ExplainResult> {
  const history = buildExplainHistory(params.reportText);
  return runReasoning(commonOf(params, history[1].content.length), history);
}

/** Answer a cross-history follow-up question using the patient's prior records as context. */
export async function answerFollowUp(params: FollowUpParams): Promise<ExplainResult> {
  const history = buildFollowUpHistory(params.question, params.records);
  return runReasoning(commonOf(params, history[1].content.length), history);
}
