/**
 * Real @qvac/sdk-backed implementation of the LlmClient interface used by the reasoning service.
 * Applies our defaults (raised context window, full GPU offload) and exposes the profiler snapshot
 * as the evidence source. Local vs delegated is a single `delegate` flag — the SDK makes the
 * remoting transparent.
 */
import { loadModel, unloadModel, completion, profiler } from "@qvac/sdk";
import type { LlmClient, CompletionStream } from "../reasoning/service";
import type { ProfilerSnapshot } from "../metrics/logger";

export interface QvacClientOptions {
  ctxSize?: number;
  gpuLayers?: number;
}

export function createQvacClient(opts: QvacClientOptions = {}): LlmClient {
  const ctx_size = opts.ctxSize ?? 8192;
  const gpu_layers = opts.gpuLayers ?? 999;

  return {
    async loadLLM({ src, delegate }) {
      return loadModel({
        modelSrc: src,
        modelType: "llm",
        modelConfig: { ctx_size, gpu_layers },
        ...(delegate
          ? { delegate: { providerPublicKey: delegate.providerPublicKey, timeout: delegate.timeout ?? 60_000 } }
          : {}),
      });
    },

    streamCompletion(modelId, history): CompletionStream {
      const run = completion({ modelId, history, stream: true });
      return {
        tokenStream: run.tokenStream,
        final: run.final.then((f) => ({
          contentText: f.contentText,
          thinkingText: f.thinkingText,
          rawText: f.raw.fullText,
          stats: f.stats,
        })),
      };
    },

    async unload(modelId) {
      await unloadModel({ modelId });
    },

    snapshot(): ProfilerSnapshot {
      const raw = profiler.exportJSON({ includeRecentEvents: false }) as unknown;
      if (!raw || typeof raw !== "object" || !("aggregates" in raw)) {
        return { aggregates: {} }; // SDK shape mismatch -> empty evidence rather than throw (no model leak)
      }
      return raw as ProfilerSnapshot;
    },
  };
}

export { profiler };
