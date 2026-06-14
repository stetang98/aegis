/**
 * Web/preview implementation of the QVAC service. There is no on-device model on web, so
 * this produces a deterministic, templated holistic summary from the already-parsed values.
 * The native build (qvac.native.ts) runs MedPsy / delegated MedPsy-4B instead — Metro picks
 * the right file per platform. This keeps the whole flow demoable in a browser.
 */
import type { ParsedLab } from "./labparse";
import type { ExplainOptions, ExplainOutcome, HealthRecord, QvacService } from "./types";

const PREVIEW_DELAY_MS = 650; // brief, so the "analyzing" state is visible in the web demo

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const DISCLAIMER = "This is health education, not a diagnosis.";

function summarize(parsed: ParsedLab): string {
  if (parsed.values.length === 0) {
    return `I couldn't read structured values from this text. On a device, MedPsy reads the full report and explains it in plain language. ${DISCLAIMER}`;
  }
  const flagged = parsed.values.filter((v) => v.tone !== "normal");
  if (flagged.length === 0) {
    return `Good news — all ${parsed.values.length} values are within their reference ranges. Keep up your routine and re-test as your doctor advises. ${DISCLAIMER}`;
  }
  const names = flagged
    .map((v) => `${v.name.toLowerCase()} (${v.tone === "high" ? "high" : "low"})`)
    .join(", ");
  const lead =
    flagged.length === parsed.values.length
      ? `${flagged.length} of your values are outside the usual range`
      : `Most of your values are within range, but ${flagged.length} are outside it`;
  return `${lead}: ${names}. None is an emergency, but they're worth raising with your doctor. ${DISCLAIMER}`;
}

export const isOnDevice = false;

export async function explain(
  _reportText: string,
  parsed: ParsedLab,
  _opts?: ExplainOptions,
): Promise<ExplainOutcome> {
  await delay(PREVIEW_DELAY_MS);
  return { summary: summarize(parsed), servedBy: "preview", engine: "Preview (browser)" };
}

export async function followUp(
  question: string,
  records: ReadonlyArray<Pick<HealthRecord, "ts" | "reportText" | "summary">>,
  _opts?: ExplainOptions,
): Promise<ExplainOutcome> {
  await delay(PREVIEW_DELAY_MS);
  const n = records.length;
  const summary =
    n === 0
      ? `You asked: "${question.trim()}". On a device, MedPsy answers from your encrypted history — add a report first. ${DISCLAIMER}`
      : `You asked: "${question.trim()}". On a device, MedPsy reads your ${n} stored report${n > 1 ? "s" : ""} and answers with trends over time. This browser preview shows the flow; the real answer runs on-device. ${DISCLAIMER}`;
  return { summary, servedBy: "preview", engine: "Preview (browser)" };
}

const service: QvacService = { isOnDevice, explain, followUp };
export default service;
