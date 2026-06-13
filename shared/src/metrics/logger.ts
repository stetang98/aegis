/**
 * Turn a QVAC SDK `profiler.exportJSON()` snapshot + run context into structured evidence rows
 * (the hackathon evidence bundle: model load + inference performance — prompt, tokens, TTFT, tok/s).
 * Timings come from the SDK profiler (authoritative); token/prompt counts come from the caller.
 * NOTE: completion timings (TTFT/streamDuration) are only present if the caller awaited the
 * completion's `final` before exporting — otherwise only a loadModel row is produced.
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

export interface RunContext {
  /** ISO-8601 timestamp for the row (caller supplies; Date is fine in the host runtime). */
  isoTime: string;
  model: string;
  device: string;
  delegated: boolean;
  promptChars: number;
  tokensOut: number;
}

export interface EvidenceRow {
  ts: string;
  event: "loadModel" | "completion";
  model: string;
  device: string;
  delegated: boolean;
  prompt_chars: number | "";
  tokens_out: number | "";
  ttft_ms: number | "";
  tok_per_s: number | "";
  duration_ms: number | "";
}

const KEY_LOAD = "loadModel";
const KEY_TTFT = "completionStream.ttfb";
const KEY_GEN = "completionStream.streamDuration";

// Reads `.last`; the caller enables the profiler fresh per run (which resets aggregates), so each
// op has count === 1 and `.last` is that run's single measurement.
function lastOf(snapshot: ProfilerSnapshot, key: string): number | undefined {
  return snapshot.aggregates[key]?.last;
}

const round1 = (n: number): number => Math.round(n * 10) / 10;
/** Round to integer ms, or "" for non-finite values (NaN/Infinity must not pollute the CSV). */
const safeMs = (n: number): number | "" => (Number.isFinite(n) ? Math.round(n) : "");

/** Derive evidence rows (loadModel and/or completion) from a profiler snapshot + run context. */
export function toEvidenceRows(snapshot: ProfilerSnapshot, ctx: RunContext): EvidenceRow[] {
  const rows: EvidenceRow[] = [];

  const loadMs = lastOf(snapshot, KEY_LOAD);
  if (loadMs !== undefined) {
    rows.push({
      ts: ctx.isoTime,
      event: "loadModel",
      model: ctx.model,
      device: ctx.device,
      delegated: ctx.delegated,
      prompt_chars: "",
      tokens_out: "",
      ttft_ms: "",
      tok_per_s: "",
      duration_ms: safeMs(loadMs),
    });
  }

  const ttft = lastOf(snapshot, KEY_TTFT);
  const gen = lastOf(snapshot, KEY_GEN);
  if (ttft !== undefined || gen !== undefined) {
    const canRate = gen !== undefined && gen > 0 && ctx.tokensOut > 0;
    rows.push({
      ts: ctx.isoTime,
      event: "completion",
      model: ctx.model,
      device: ctx.device,
      delegated: ctx.delegated,
      prompt_chars: ctx.promptChars,
      tokens_out: ctx.tokensOut,
      ttft_ms: ttft !== undefined ? safeMs(ttft) : "",
      tok_per_s: canRate ? round1(ctx.tokensOut / (gen / 1000)) : "",
      duration_ms: gen !== undefined ? safeMs(gen) : "",
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
