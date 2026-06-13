/**
 * Day-1 spike E (laptop↔laptop) — consumer delegates inference to the provider process.
 * Proves the delegation RPC end-to-end on Node, isolating the remaining mobile-runtime question
 * for the real phone test. Usage: PROVIDER_PUBLIC_KEY=<key> tsx src/consumer-delegate.ts
 */
import { loadModel, completion, unloadModel } from "@qvac/sdk";
// @ts-expect-error — model constants are runtime exports not surfaced in the package .d.ts (see spikes/day1-findings.md).
import { LLAMA_3_2_1B_INST_Q4_0 } from "@qvac/sdk";

const providerPublicKey = process.env.PROVIDER_PUBLIC_KEY;
if (!providerPublicKey || !/^[0-9a-f]{64}$/i.test(providerPublicKey)) {
  console.error("set PROVIDER_PUBLIC_KEY to a 64-char hex string (from the provider output)");
  process.exit(1);
}

let modelId: string | undefined;
try {
  const t0 = performance.now();
  modelId = await loadModel({
    modelSrc: LLAMA_3_2_1B_INST_Q4_0,
    modelType: "llm",
    delegate: { providerPublicKey, timeout: 60_000 },
  });
  console.log(`delegated loadModel ok in ${Math.round(performance.now() - t0)}ms (modelId=${modelId})`);

  let tokens = 0;
  const run = completion({
    modelId,
    history: [{ role: "user", content: "Reply 'delegated hello' and nothing else." }],
    stream: true,
  });
  for await (const tok of run.tokenStream) {
    tokens++;
    process.stdout.write(String(tok));
  }
  console.log(`\ndelegated completion streamed ${tokens} tokens — DELEGATION WORKS.`);
} catch (err) {
  console.error("delegation FAILED:", err);
  process.exitCode = 1;
} finally {
  if (modelId) await unloadModel({ modelId }).catch((e: unknown) => console.error("unload failed:", e));
}
