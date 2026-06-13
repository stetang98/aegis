import { test, expect, describe } from "vitest";
import { toEvidenceRows, toCsv, type ProfilerSnapshot, type RunContext } from "../src/metrics/logger";

const agg = (last: number) => ({ count: 1, min: last, max: last, avg: last, sum: last, last });

const fullSnapshot: ProfilerSnapshot = {
  aggregates: {
    loadModel: agg(2708),
    "completionStream.ttfb": agg(651),
    "completionStream.streamDuration": agg(2000),
  },
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
    const rows = toEvidenceRows(fullSnapshot, ctx);
    expect(rows.map((r) => r.event)).toEqual(["loadModel", "completion"]);
  });

  test("loadModel row carries load duration, no inference fields", () => {
    const [load] = toEvidenceRows(fullSnapshot, ctx);
    expect(load.duration_ms).toBe(2708);
    expect(load.ttft_ms).toBe("");
    expect(load.tokens_out).toBe("");
  });

  test("completion row carries TTFT, duration, prompt/tokens and computed tok/s", () => {
    const completion = toEvidenceRows(fullSnapshot, ctx)[1];
    expect(completion.ttft_ms).toBe(651);
    expect(completion.duration_ms).toBe(2000);
    expect(completion.prompt_chars).toBe(320);
    expect(completion.tokens_out).toBe(100);
    expect(completion.tok_per_s).toBe(50); // 100 tokens / 2.0s
    expect(completion.delegated).toBe(true);
  });

  test("load-only snapshot yields just the loadModel row", () => {
    const rows = toEvidenceRows({ aggregates: { loadModel: agg(1500) } }, ctx);
    expect(rows).toHaveLength(1);
    expect(rows[0].event).toBe("loadModel");
  });

  test("no usable aggregates yields no rows", () => {
    expect(toEvidenceRows({ aggregates: {} }, ctx)).toEqual([]);
  });

  test("tok/s is blank when generation duration or token count is zero", () => {
    const snap: ProfilerSnapshot = { aggregates: { "completionStream.ttfb": agg(500), "completionStream.streamDuration": agg(0) } };
    expect(toEvidenceRows(snap, ctx)[0].tok_per_s).toBe("");
  });

  test("tok/s blank when tokensOut is zero, but tokens_out is still recorded", () => {
    const snap: ProfilerSnapshot = { aggregates: { "completionStream.ttfb": agg(500), "completionStream.streamDuration": agg(2000) } };
    const r = toEvidenceRows(snap, { ...ctx, tokensOut: 0 })[0];
    expect(r.tok_per_s).toBe("");
    expect(r.tokens_out).toBe(0);
  });

  test("non-finite timings become blank cells, not NaN/Infinity", () => {
    const snap: ProfilerSnapshot = { aggregates: { loadModel: agg(Number.NaN) } };
    expect(toEvidenceRows(snap, ctx)[0].duration_ms).toBe("");
  });
});

describe("toCsv", () => {
  test("emits a stable header", () => {
    const csv = toCsv([]);
    expect(csv).toBe("ts,event,model,device,delegated,prompt_chars,tokens_out,ttft_ms,tok_per_s,duration_ms");
  });

  test("serializes rows and quotes cells containing commas", () => {
    const rows = toEvidenceRows({ aggregates: { loadModel: agg(2708) } }, { ...ctx, model: "Med,Psy 4B" });
    const csv = toCsv(rows);
    const dataLine = csv.split("\n")[1];
    expect(dataLine).toContain('"Med,Psy 4B"');
    expect(dataLine.startsWith("2026-06-13T12:00:00.000Z,loadModel,")).toBe(true);
  });

  test("doubles embedded quotes per RFC-4180 quoting", () => {
    const rows = toEvidenceRows({ aggregates: { loadModel: agg(1000) } }, { ...ctx, model: 'Model "X"' });
    expect(toCsv(rows).split("\n")[1]).toContain('"Model ""X"""');
  });
});
