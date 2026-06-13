import { test, expect, describe } from "vitest";
import {
  toEvidenceRows,
  toCsv,
  type ProfilerSnapshot,
  type RunContext,
  type CompletionStatsLike,
} from "../src/metrics/logger";

const agg = (last: number) => ({ count: 1, min: last, max: last, avg: last, sum: last, last });
const loadSnap: ProfilerSnapshot = { aggregates: { loadModel: agg(2708) } };
const emptySnap: ProfilerSnapshot = { aggregates: {} };

const stats: CompletionStatsLike = {
  timeToFirstToken: 651,
  tokensPerSecond: 50,
  promptTokens: 80,
  generatedTokens: 100,
  backendDevice: "gpu",
};

const ctx: RunContext = {
  isoTime: "2026-06-13T12:00:00.000Z",
  model: "MedPsy-4B",
  device: "laptop-M4",
  delegated: true,
  promptChars: 320,
  tokensOut: 100,
};

describe("toEvidenceRows", () => {
  test("produces a loadModel row and a completion row", () => {
    expect(toEvidenceRows(loadSnap, stats, ctx).map((r) => r.event)).toEqual(["loadModel", "completion"]);
  });

  test("loadModel row carries load duration only", () => {
    const [load] = toEvidenceRows(loadSnap, stats, ctx);
    expect(load.duration_ms).toBe(2708);
    expect(load.ttft_ms).toBe("");
    expect(load.tokens_out).toBe("");
    expect(load.backend).toBe("");
  });

  test("completion row carries SDK stats: TTFT, tok/s, tokens, backend, derived duration", () => {
    const completion = toEvidenceRows(loadSnap, stats, ctx)[1];
    expect(completion.ttft_ms).toBe(651);
    expect(completion.tok_per_s).toBe(50);
    expect(completion.tokens_out).toBe(100);
    expect(completion.backend).toBe("gpu");
    expect(completion.prompt_chars).toBe(80); // stats.promptTokens preferred
    expect(completion.duration_ms).toBe(2000); // 100 tokens / 50 tok-s
    expect(completion.delegated).toBe(true);
  });

  test("load-only (no stats) yields just the loadModel row", () => {
    const rows = toEvidenceRows(loadSnap, undefined, ctx);
    expect(rows).toHaveLength(1);
    expect(rows[0].event).toBe("loadModel");
  });

  test("stats-only (no load aggregate) yields just the completion row", () => {
    const rows = toEvidenceRows(emptySnap, stats, ctx);
    expect(rows).toHaveLength(1);
    expect(rows[0].event).toBe("completion");
  });

  test("no data yields no rows", () => {
    expect(toEvidenceRows(emptySnap, undefined, ctx)).toEqual([]);
  });

  test("falls back to caller counts when stats omit token/prompt fields", () => {
    const partial: CompletionStatsLike = { timeToFirstToken: 500 };
    const completion = toEvidenceRows(emptySnap, partial, ctx)[0];
    expect(completion.tokens_out).toBe(ctx.tokensOut);
    expect(completion.prompt_chars).toBe(ctx.promptChars);
    expect(completion.tok_per_s).toBe(""); // no tokensPerSecond
    expect(completion.duration_ms).toBe(""); // cannot derive without rate
  });

  test("non-finite load timing becomes a blank cell", () => {
    expect(toEvidenceRows({ aggregates: { loadModel: agg(Number.NaN) } }, undefined, ctx)[0].duration_ms).toBe("");
  });
});

describe("toCsv", () => {
  test("emits a stable header including backend", () => {
    expect(toCsv([])).toBe(
      "ts,event,model,device,delegated,backend,prompt_chars,tokens_out,ttft_ms,tok_per_s,duration_ms",
    );
  });

  test("quotes cells with commas and doubles embedded quotes", () => {
    const rows = toEvidenceRows(loadSnap, undefined, { ...ctx, model: 'Med,Psy "X"' });
    const dataLine = toCsv(rows).split("\n")[1];
    expect(dataLine).toContain('"Med,Psy ""X"""');
  });
});
