/**
 * Day-1 spike C1 — does MedPsy load from a local GGUF and reason CORRECTLY on a lab report?
 * Defaults to MedPsy-4B (the authoritative brain); override with MEDPSY_MODEL=<abs path> to test the 1.7B.
 * ctx_size is raised to fit the Qwen3-Thinking <think>+answer (the default window overflowed on 1.7B).
 * Note: output may contain a <think>…</think> block (strip/handle in Plan 2).
 */
import { loadModel, completion, unloadModel } from "@qvac/sdk";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const DEFAULT_MODEL = join(here, "..", "models", "medpsy-4b-q4_k_m-imat.gguf");
const MODEL_PATH = process.env.MEDPSY_MODEL ?? DEFAULT_MODEL;

const SAMPLE_REPORT = `Complete Blood Count & Metabolic Panel:
- Hemoglobin: 11.2 g/dL (ref 13.5-17.5)
- Fasting glucose: 7.8 mmol/L (ref 3.9-5.5)
- LDL cholesterol: 4.1 mmol/L (ref < 3.0)
- TSH: 2.1 mIU/L (ref 0.4-4.0)`;

let modelId: string | undefined;
try {
  const t0 = performance.now();
  modelId = await loadModel({
    modelSrc: MODEL_PATH,
    modelType: "llm",
    modelConfig: { ctx_size: 8192, gpu_layers: 999 },
    onProgress: (p: unknown) => console.log("load:", p),
  });
  console.log(`loaded ${MODEL_PATH.split("/").pop()} in ${Math.round(performance.now() - t0)}ms`);

  const tReq = performance.now();
  let firstTokenAt = 0;
  let tokenCount = 0;
  const run = completion({
    modelId,
    history: [
      {
        role: "system",
        content:
          "You are a health education assistant (not a doctor; education only). Explain lab reports in plain language, flag out-of-range values, and suggest questions for the doctor.",
      },
      { role: "user", content: `Explain this lab report:\n\n${SAMPLE_REPORT}` },
    ],
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
    console.warn("No tokens streamed.");
  } else {
    const ttftMs = Math.round(firstTokenAt - tReq);
    const genMs = Math.max(1, Math.round(done - firstTokenAt));
    console.log(`TTFT: ${ttftMs}ms | tokens: ${tokenCount} | ~${(tokenCount / (genMs / 1000)).toFixed(1)} tok/s`);
  }
  console.log("MedPsy spike OK.");
} catch (err) {
  console.error("MedPsy spike FAILED:", err);
  process.exitCode = 1;
} finally {
  if (modelId) await unloadModel({ modelId }).catch((e: unknown) => console.error("unloadModel failed:", e));
  console.log("unloaded.");
}
