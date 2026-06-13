/**
 * Day-1 spike F2 — verify the SDK profiler as the evidence-bundle source.
 * Uses the already-cached LLAMA_3_2_1B model (no download). Writes evidence/profiler-sample.{json,txt}.
 */
import { loadModel, completion, unloadModel, profiler } from "@qvac/sdk";
// @ts-expect-error — model constants are runtime exports not surfaced in the package .d.ts (see spikes/day1-findings.md).
import { LLAMA_3_2_1B_INST_Q4_0 } from "@qvac/sdk";
import { writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const EVIDENCE_DIR = join(here, "..", "..", "evidence");

let modelId: string | undefined;
try {
  profiler.enable({ mode: "verbose" });
  modelId = await loadModel({ modelSrc: LLAMA_3_2_1B_INST_Q4_0, modelType: "llm" });

  const run = completion({
    modelId,
    history: [{ role: "user", content: "Name three primary colors." }],
    stream: true,
  });
  for await (const tok of run.tokenStream) process.stdout.write(String(tok));
  console.log();

  const table = profiler.exportTable();
  console.log("\n=== profiler table ===\n" + table);

  const json = profiler.exportJSON({ includeRecentEvents: true });
  await mkdir(EVIDENCE_DIR, { recursive: true });
  await writeFile(join(EVIDENCE_DIR, "profiler-sample.json"), JSON.stringify(json, null, 2));
  await writeFile(join(EVIDENCE_DIR, "profiler-sample.txt"), table);
  console.log(`\nwrote evidence/profiler-sample.json (${JSON.stringify(json).length} bytes) + .txt`);
  console.log("aggregate operation keys:", Object.keys(profiler.getAggregates()).join(", "));
} catch (err) {
  console.error("profiler probe FAILED:", err);
  process.exitCode = 1;
} finally {
  if (modelId) await unloadModel({ modelId }).catch((e: unknown) => console.error("unload failed:", e));
  profiler.disable();
}
