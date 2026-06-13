/**
 * Aegis laptop CLI — exercises the full product core end-to-end on the laptop:
 *   --report : report file -> injection-safe prompt -> MedPsy -> answer + evidence (+ persist if --store)
 *   --ask    : cross-history question over the encrypted record store -> answer + evidence
 *
 * Usage:
 *   tsx src/cli.ts --model <gguf> --report <file> [--store <file> --passphrase <pw>] [--delegate <key>]
 *   tsx src/cli.ts --model <gguf> --ask "<question>" --store <file> --passphrase <pw> [--delegate <key>]
 *
 * NOTE: prints the model's PHI-derived answer to stdout — do not pipe to persistent logs in regulated use.
 */
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { explainReport, answerFollowUp, type DelegateConfig, type ExplainResult } from "./reasoning/service";
import { createQvacClient, profiler } from "./sdk/client";
import { HealthRecordStore } from "./records/store";

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  const val = i >= 0 ? process.argv[i + 1] : undefined;
  return val === undefined || val.startsWith("--") ? undefined : val;
}

const modelSrc = arg("model");
const reportPath = arg("report");
const question = arg("ask");
const storePath = arg("store");
const passphrase = arg("passphrase") ?? process.env.AEGIS_PASSPHRASE;
const device = arg("device") ?? "laptop";
const delegateKey = arg("delegate");
const delegate: DelegateConfig | undefined = delegateKey ? { providerPublicKey: delegateKey } : undefined;

if (!modelSrc || (!reportPath && !question)) {
  console.error("usage: tsx src/cli.ts --model <gguf> (--report <file> | --ask <question>) [--store <file> --passphrase <pw>] [--delegate <key>]");
  process.exit(1);
}

function show(title: string, r: ExplainResult): void {
  console.log(`\n=== ${title} ===\n${r.answer}`);
  if (r.thinking) console.log(`\n[reasoning: ${r.thinking.length} chars hidden]`);
  console.log(`[servedBy=${r.servedBy}]`);
  console.log("=== EVIDENCE ===");
  console.table(r.evidence);
}

if (arg("passphrase")) {
  console.error("[warn] --passphrase is visible in process args; prefer the AEGIS_PASSPHRASE env var");
}

const client = createQvacClient();
try {
  profiler.enable({ mode: "verbose" });
  const model = modelSrc.split("/").pop() ?? modelSrc;

  if (reportPath) {
    const reportText = await readFile(reportPath, "utf8");
    const result = await explainReport({ reportText, client, modelSrc, model, device, delegate, isoTime: new Date().toISOString() });
    show("ANSWER (report explanation)", result);
    if (storePath && passphrase) {
      await new HealthRecordStore(storePath, passphrase).add({
        id: randomUUID(),
        ts: new Date().toISOString(),
        reportText,
        answer: result.answer,
        model,
      });
      console.log("\n[stored to encrypted health record]");
    }
  }

  if (question) {
    if (!storePath || !passphrase) {
      console.error("--ask requires --store <file> and --passphrase (or AEGIS_PASSPHRASE)");
      process.exit(1);
    }
    const records = await new HealthRecordStore(storePath, passphrase).list();
    console.log(`\n[loaded ${records.length} prior record(s) from the encrypted store]`);
    const result = await answerFollowUp({ question, records, client, modelSrc, model, device, delegate, isoTime: new Date().toISOString() });
    show("ANSWER (cross-history)", result);
  }
} catch (err) {
  console.error("error:", err instanceof Error ? err.message : String(err));
  process.exitCode = 1;
} finally {
  profiler.disable();
}
