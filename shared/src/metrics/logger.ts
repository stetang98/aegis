/**
 * Build the hackathon evidence bundle (model load + inference performance) as structured rows.
 * Load timing comes from the SDK `profiler` snapshot; completion metrics (TTFT, tok/s, tokens,
 * cpu/gpu) come from the SDK's authoritative per-call `CompletionStats` (resolved from the
 * completion's `final`). Token/prompt sizes fall back to caller-counted values when stats omit them.
 */

export interface ProfilerAggregate {
  count: number;
  min: number;
  max: number;
  avg: number;
  sum: number;
  last: number;
}

export interface ProfilerSnapshot {
  aggregates: Record<string, ProfilerAggregate>;
}

/** Mirror of @qvac/sdk CompletionStats (the fields we record). */
export interface CompletionStatsLike {
  timeToFirstToken?: number;
  tokensPerSecond?: number;
  promptTokens?: number;
  generatedTokens?: number;
  backendDevice?: "cpu" | "gpu";
}

export interface RunContext {
  /** ISO-8601 timestamp for the row (caller supplies; Date is fine in the host runtime). */
  isoTime: string;
  model: string;
  device: string;
  delegated: boolean;
  promptChars: number;
  /** Caller-counted stream chunks (approximate fallback only; prefer stats.generatedTokens). */
  tokensOut: number;
}

export interface EvidenceRow {
  ts: string;
  event: "loadModel" | "completion";
  model: string;
  device: string;
  delegated: boolean;
  backend: "cpu" | "gpu" | "";
  prompt_chars: number | "";
  tokens_out: number | "";
  ttft_ms: number | "";
  tok_per_s: number | "";
  duration_ms: number | "";
}

const KEY_LOAD = "loadModel";

function lastOf(snapshot: ProfilerSnapshot, key: string): number | undefined {
  return snapshot.aggregates[key]?.last;
}

const round1 = (n: number): number => Math.round(n * 10) / 10;
/** Round to integer ms, or "" for non-finite values (NaN/Infinity must not pollute the CSV). */
const safeMs = (n: number): number | "" => (Number.isFinite(n) ? Math.round(n) : "");

/** Derive evidence rows: a loadModel row from the profiler snapshot + a completion row from stats. */
export function toEvidenceRows(
  snapshot: ProfilerSnapshot,
  stats: CompletionStatsLike | undefined,
  ctx: RunContext,
): EvidenceRow[] {
  const rows: EvidenceRow[] = [];

  const loadMs = lastOf(snapshot, KEY_LOAD);
  if (loadMs !== undefined) {
    rows.push({
      ts: ctx.isoTime,
      event: "loadModel",
      model: ctx.model,
      device: ctx.device,
      delegated: ctx.delegated,
      backend: "",
      prompt_chars: "",
      tokens_out: "",
      ttft_ms: "",
      tok_per_s: "",
      duration_ms: safeMs(loadMs),
    });
  }

  if (stats) {
    const tps = stats.tokensPerSecond;
    const gen = stats.generatedTokens ?? ctx.tokensOut;
    const durationMs = tps !== undefined && tps > 0 && gen > 0 ? Math.round((gen / tps) * 1000) : undefined;
    rows.push({
      ts: ctx.isoTime,
      event: "completion",
      model: ctx.model,
      device: ctx.device,
      delegated: ctx.delegated,
      backend: stats.backendDevice ?? "",
      prompt_chars: stats.promptTokens ?? ctx.promptChars,
      tokens_out: gen,
      ttft_ms: stats.timeToFirstToken !== undefined ? safeMs(stats.timeToFirstToken) : "",
      tok_per_s: tps !== undefined ? round1(tps) : "",
      duration_ms: durationMs ?? "",
    });
  }

  return rows;
}

const CSV_COLUMNS: (keyof EvidenceRow)[] = [
  "ts",
  "event",
  "model",
  "device",
  "delegated",
  "backend",
  "prompt_chars",
  "tokens_out",
  "ttft_ms",
  "tok_per_s",
  "duration_ms",
];

function csvCell(value: string | number | boolean): string {
  const s = String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Serialize evidence rows to CSV (stable header, quoted-cell escaping, LF row separator). */
export function toCsv(rows: EvidenceRow[]): string {
  const header = CSV_COLUMNS.join(",");
  const lines = rows.map((r) => CSV_COLUMNS.map((c) => csvCell(r[c])).join(","));
  return [header, ...lines].join("\n");
}
