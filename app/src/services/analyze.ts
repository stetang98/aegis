/**
 * Orchestrates report analysis: deterministic value parsing + platform-appropriate
 * holistic summary (MedPsy on device, templated on web). Platform-agnostic — it imports
 * the platform-split `./qvac` service, which Metro resolves per platform.
 */
import * as qvac from "./qvac";
import { parseLabReport, type ParsedLab } from "./labparse";
import type { ExplainOptions, ExplainOutcome } from "./types";

export interface Analysis {
  parsed: ParsedLab;
  outcome: ExplainOutcome;
  title: string;
}

const HEADING_RE = /^[A-Z][A-Z0-9 /&()-]{3,}$/;
const HEADING_SKIP = /^(PATIENT|COLLECTED|SYNTHETIC|LAB[: ]|DOB|SEX|NAME)/;

/**
 * Title from the report's section headings. A single panel → that panel's name
 * (title-cased); multiple panels → the honest "Lab panel" (don't name a multi-panel
 * report after only its first section); none → "Lab report".
 */
export function deriveTitle(text: string): string {
  const headings: string[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const l = raw.trim();
    if (l.length < 4 || l.length > 60) continue;
    if (HEADING_RE.test(l) && !HEADING_SKIP.test(l)) headings.push(l);
  }
  if (headings.length === 0) return "Lab report";
  if (headings.length > 1) return "Lab panel";
  return headings[0].charAt(0) + headings[0].slice(1).toLowerCase();
}

export async function analyzeReport(text: string, opts?: ExplainOptions): Promise<Analysis> {
  const parsed = parseLabReport(text);
  const outcome = await qvac.explain(text, parsed, opts);
  return { parsed, outcome, title: deriveTitle(text) };
}

export const isOnDevice: boolean = qvac.isOnDevice;
