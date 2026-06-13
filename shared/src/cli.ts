/**
 * Aegis laptop CLI — exercises the full product core end-to-end on the laptop:
 *   report file -> injection-safe prompt -> MedPsy (local or delegated) -> strip <think>
 *   -> plain-language answer + profiler-sourced evidence rows.
 *
 * Usage:
 *   tsx src/cli.ts --report <file> --model <gguf-path> [--delegate <providerPublicKey>] [--device <name>]
 */
import { readFile } from "node:fs/promises";
import { explainReport } from "./reasoning/service";
import { createQvacClient, profiler } from "./sdk/client";

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  const val = i >= 0 ? process.argv[i + 1] : undefined;
  return val === undefined || val.startsWith("--") ? undefined : val;
}

const reportPath = arg("report");
const modelSrc = arg("model");
const delegateKey = arg("delegate");
const device = arg("device") ?? "laptop";

if (!reportPath || !modelSrc) {
  console.error("usage: tsx src/cli.ts --report <file> --model <gguf-path> [--delegate <key>] [--device <name>]");
  process.exit(1);
}

const reportText = await readFile(reportPath, "utf8");
const client = createQvacClient();
try {
  profiler.enable({ mode: "verbose" });
  const result = await explainReport({
    reportText,
    client,
    modelSrc,
    model: modelSrc.split("/").pop() ?? modelSrc,
    device,
    delegate: delegateKey ? { providerPublicKey: delegateKey } : undefined,
    isoTime: new Date().toISOString(),
  });

  console.log("\n=== ANSWER ===\n" + result.answer);
  if (result.thinking) console.log(`\n[reasoning: ${result.thinking.length} chars hidden]`);
  console.log(`[servedBy=${result.servedBy}]`);
  console.log("\n=== EVIDENCE ===");
  console.table(result.evidence);
} finally {
  profiler.disable();
}
