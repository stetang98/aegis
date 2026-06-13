import { test, expect, describe } from "vitest";
import {
  explainReport,
  answerFollowUp,
  type LlmClient,
  type CompletionStream,
  type ExplainParams,
  type FollowUpParams,
} from "../src/reasoning/service";
import type { ProfilerSnapshot, CompletionStatsLike } from "../src/metrics/logger";
import type { ChatMessage, PriorRecord } from "../src/reasoning/prompt";

const agg = (last: number) => ({ count: 1, min: last, max: last, avg: last, sum: last, last });
const SNAP: ProfilerSnapshot = { aggregates: { loadModel: agg(2000) } };
const STATS: CompletionStatsLike = {
  timeToFirstToken: 600,
  tokensPerSecond: 30,
  generatedTokens: 50,
  backendDevice: "gpu",
};

interface MockOpts {
  raw: string;
  contentText?: string;
  thinkingText?: string;
  stats?: CompletionStatsLike;
  failDelegateLoadCode?: number;
  failCompletion?: unknown;
  failFinal?: unknown;
  snapshotThrows?: boolean;
}

class MockClient implements LlmClient {
  loads: Array<{ src: string; delegate?: { providerPublicKey: string } }> = [];
  unloads: string[] = [];
  lastHistory: ChatMessage[] | null = null;
  constructor(private opts: MockOpts) {}

  async loadLLM(o: { src: string; delegate?: { providerPublicKey: string } }): Promise<string> {
    this.loads.push(o);
    if (o.delegate && this.opts.failDelegateLoadCode !== undefined) {
      const e = new Error("delegate connection failed") as Error & { code: number };
      e.code = this.opts.failDelegateLoadCode;
      throw e;
    }
    return `model-${this.loads.length}`;
  }

  streamCompletion(_modelId: string, history: ChatMessage[]): CompletionStream {
    this.lastHistory = history;
    const { raw, contentText, thinkingText, stats, failCompletion } = this.opts;
    return {
      tokenStream: (async function* () {
        for (const t of [...raw]) yield t;
        if (failCompletion) throw failCompletion;
      })(),
      final:
        this.opts.failFinal !== undefined
          ? Promise.reject(this.opts.failFinal)
          : Promise.resolve({ contentText: contentText ?? "", thinkingText, rawText: raw, stats }),
    };
  }

  async unload(id: string): Promise<void> {
    this.unloads.push(id);
  }

  snapshot(): ProfilerSnapshot {
    if (this.opts.snapshotThrows) throw new Error("snapshot boom");
    return SNAP;
  }
}

const KEY = "a".repeat(64);
const params = (client: LlmClient, extra: Partial<ExplainParams> = {}): ExplainParams => ({
  reportText: "Hemoglobin 11.2 (ref 13.5-17.5)",
  client,
  modelSrc: "/models/medpsy-4b.gguf",
  model: "MedPsy-4B",
  device: "laptop-M4",
  isoTime: "2026-06-13T12:00:00.000Z",
  ...extra,
});

describe("explainReport", () => {
  test("uses the SDK's contentText/thinkingText and records completion evidence from stats", async () => {
    const mock = new MockClient({
      raw: "<think>reasoning</think>Your hemoglobin is low.",
      contentText: "Your hemoglobin is low.",
      thinkingText: "reasoning",
      stats: STATS,
    });
    const r = await explainReport(params(mock));
    expect(r.answer).toBe("Your hemoglobin is low.");
    expect(r.thinking).toBe("reasoning");
    expect(r.servedBy).toBe("local");
    const completion = r.evidence.find((row) => row.event === "completion");
    expect(completion?.ttft_ms).toBe(600);
    expect(completion?.backend).toBe("gpu");
    expect(mock.unloads).toHaveLength(1);
  });

  test("falls back to splitThink when the SDK omits contentText", async () => {
    const mock = new MockClient({ raw: "<think>r</think>The answer.", stats: STATS });
    const r = await explainReport(params(mock));
    expect(r.answer).toBe("The answer.");
    expect(r.thinking).toBe("r");
  });

  test("strips a <think> block even when the SDK leaves it in contentText", async () => {
    const leaked = "<think>secret reasoning</think>The answer.";
    const mock = new MockClient({ raw: leaked, contentText: leaked, thinkingText: "secret reasoning", stats: STATS });
    const r = await explainReport(params(mock));
    expect(r.answer).toBe("The answer.");
    expect(r.answer).not.toContain("secret reasoning");
    expect(r.answer.toLowerCase()).not.toContain("<think>");
  });

  test("delegated run marks evidence delegated", async () => {
    const mock = new MockClient({ raw: "ans", contentText: "ans", stats: STATS });
    const r = await explainReport(params(mock, { delegate: { providerPublicKey: KEY } }));
    expect(r.servedBy).toBe("delegated");
    expect(r.evidence.find((row) => row.event === "completion")?.delegated).toBe(true);
  });

  test("falls back to local when the delegate connection fails (53701)", async () => {
    const mock = new MockClient({ raw: "local answer", contentText: "local answer", failDelegateLoadCode: 53701 });
    const r = await explainReport(params(mock, { delegate: { providerPublicKey: KEY } }));
    expect(r.servedBy).toBe("local");
    expect(r.answer).toBe("local answer");
    expect(mock.loads).toHaveLength(2);
    expect(mock.loads[0].delegate).toBeDefined();
    expect(mock.loads[1].delegate).toBeUndefined();
    expect(mock.unloads).toHaveLength(1);
  });

  test("does NOT fall back on a non-delegate error, and cleans up the loaded model", async () => {
    const mock = new MockClient({ raw: "partial", failCompletion: new Error("boom") });
    await expect(explainReport(params(mock))).rejects.toThrow("boom");
    expect(mock.unloads).toHaveLength(1);
  });

  test("history sent to the model is injection-safe (system + wrapped user data)", async () => {
    const mock = new MockClient({ raw: "ok", contentText: "ok" });
    await explainReport(params(mock));
    expect(mock.lastHistory?.[0].role).toBe("system");
    expect(mock.lastHistory?.[1].role).toBe("user");
    expect(mock.lastHistory?.[1].content).toContain("Hemoglobin 11.2");
  });

  test("propagates a final-promise rejection and still unloads the model", async () => {
    const mock = new MockClient({ raw: "ans", contentText: "ans", failFinal: new Error("final boom") });
    await expect(explainReport(params(mock))).rejects.toThrow("final boom");
    expect(mock.unloads).toHaveLength(1);
  });

  test("unloads the model even if snapshot() throws", async () => {
    const mock = new MockClient({ raw: "ans", contentText: "ans", stats: STATS, snapshotThrows: true });
    await expect(explainReport(params(mock))).rejects.toThrow();
    expect(mock.unloads).toHaveLength(1);
  });
});

describe("answerFollowUp", () => {
  const records: PriorRecord[] = [
    { ts: "2026-01-01", reportText: "LDL 4.1", answer: "LDL elevated" },
    { ts: "2026-06-01", reportText: "LDL 3.2", answer: "improving" },
  ];
  const fparams = (client: LlmClient, extra: Partial<FollowUpParams> = {}): FollowUpParams => ({
    question: "How is my LDL trending?",
    records,
    client,
    modelSrc: "/models/medpsy-4b.gguf",
    model: "MedPsy-4B",
    device: "laptop-M4",
    isoTime: "2026-06-13T12:00:00.000Z",
    ...extra,
  });

  test("answers a cross-history question, think-stripped, with evidence", async () => {
    const mock = new MockClient({
      raw: "<think>r</think>Your LDL is trending down.",
      contentText: "Your LDL is trending down.",
      thinkingText: "r",
      stats: STATS,
    });
    const r = await answerFollowUp(fparams(mock));
    expect(r.answer).toBe("Your LDL is trending down.");
    expect(r.thinking).toBe("r");
    expect(r.servedBy).toBe("local");
    expect(r.evidence.find((row) => row.event === "completion")).toBeDefined();
    expect(mock.unloads).toHaveLength(1);
  });

  test("sends prior records + the question to the model", async () => {
    const mock = new MockClient({ raw: "ok", contentText: "ok" });
    await answerFollowUp(fparams(mock));
    expect(mock.lastHistory?.[0].role).toBe("system");
    expect(mock.lastHistory?.[1].content).toContain("LDL 4.1");
    expect(mock.lastHistory?.[1].content).toContain("How is my LDL trending?");
  });

  test("falls back to local on delegate failure (53701)", async () => {
    const mock = new MockClient({ raw: "ans", contentText: "ans", failDelegateLoadCode: 53701 });
    const r = await answerFollowUp(fparams(mock, { delegate: { providerPublicKey: KEY } }));
    expect(r.servedBy).toBe("local");
    expect(mock.loads).toHaveLength(2);
  });
});
