/**
 * Day-1 spike B2 — does @qvac/sdk install + run on this Mac at all?
 * Loads a tiny built-in model and streams a completion locally.
 * NOTE: symbols are from docs (docs.qvac.tether.io/quickstart). First run = verification.
 * First run also downloads the model, so it may take a while.
 */
import { loadModel, completion, unloadModel } from "@qvac/sdk";
// @ts-expect-error — @qvac/sdk@0.12.2 exports built-in model constants at runtime, but its
// .d.ts does not surface them through the package entry (verified present via runtime introspection).
// Plan 2 will add a typed models wrapper instead of suppressing per-import.
import { LLAMA_3_2_1B_INST_Q4_0 } from "@qvac/sdk";

const t0 = performance.now();
let modelId: string | undefined;
try {
  modelId = await loadModel({
    modelSrc: LLAMA_3_2_1B_INST_Q4_0,
    modelType: "llm",
    onProgress: (p: unknown) => console.log("load progress:", p),
  });
  console.log(`loaded modelId=${modelId} in ${Math.round(performance.now() - t0)}ms`);

  const tReq = performance.now();
  let firstTokenAt = 0;
  let tokenCount = 0;
  const run = completion({
    modelId,
    history: [{ role: "user", content: "Reply with one short sentence confirming you are running locally." }],
    stream: true,
  });
  for await (const tok of run.tokenStream) {
    if (firstTokenAt === 0) firstTokenAt = performance.now();
    tokenCount++;
    process.stdout.write(String(tok));
  }
  const done = performance.now();

  console.log("\n--- metrics ---");
  if (tokenCount === 0) {
    console.warn("No tokens streamed — verify the completion() API shape against the docs.");
  } else {
    const ttftMs = Math.round(firstTokenAt - tReq);
    const genMs = Math.max(1, Math.round(done - firstTokenAt)); // guard against div-by-zero on 1-token replies
    const tps = (tokenCount / (genMs / 1000)).toFixed(1);
    console.log(`TTFT: ${ttftMs}ms | tokens: ${tokenCount} | gen: ${genMs}ms | ~${tps} tok/s`);
  }
  console.log("SDK smoke OK.");
} catch (err) {
  console.error("SDK smoke FAILED:", err);
  process.exitCode = 1;
} finally {
  if (modelId) {
    await unloadModel({ modelId }).catch((e: unknown) => console.error("unloadModel failed:", e));
    console.log("unloaded.");
  }
}
