/**
 * Day-1 spike D — start a QVAC provider that serves a locally-loaded model and prints its public key.
 * Uses cached LLAMA-1B for the mechanism test (MedPsy-4B in production). Stays alive to serve consumers.
 * Consumers connect via dht.connect(publicKey); the keypair can be pinned with QVAC_HYPERSWARM_SEED.
 */
import { loadModel, startQVACProvider, stopQVACProvider, unloadModel } from "@qvac/sdk";
// @ts-expect-error — model constants are runtime exports not surfaced in the package .d.ts (see spikes/day1-findings.md).
import { LLAMA_3_2_1B_INST_Q4_0 } from "@qvac/sdk";

let modelId: string | undefined;

const shutdown = async (): Promise<void> => {
  try {
    await stopQVACProvider();
    if (modelId) await unloadModel({ modelId });
  } catch (e: unknown) {
    console.error("shutdown error:", e);
  }
  process.exit(0);
};

try {
  modelId = await loadModel({ modelSrc: LLAMA_3_2_1B_INST_Q4_0, modelType: "llm" });
  const res = await startQVACProvider();
  if (!res.success) {
    console.error("provider failed to start:", res.error);
    if (modelId) await unloadModel({ modelId }).catch((e: unknown) => console.error("unload failed:", e));
    process.exit(1);
  }
  console.log("PROVIDER_PUBLIC_KEY=" + (res.publicKey ?? "(none)"));
  console.log("provider serving; Ctrl-C to stop.");
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
  process.stdin.resume();
} catch (e: unknown) {
  console.error("provider startup failed:", e);
  if (modelId) await unloadModel({ modelId }).catch((err: unknown) => console.error("unload failed:", err));
  process.exit(1);
}
