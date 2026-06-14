/**
 * Deterministic lab-value parser. Extracts {name, value, unit, reference range, tone}
 * from report text so the UI shows EXACT numbers and ranges — never a model-hallucinated
 * value (critical for a health app). MedPsy adds the plain-language explanation on top.
 *
 * Targets the common "Name .... value unit (ref RANGE)" layout (dotted/aligned columns).
 * Ranges: "13.5-17.5" (two-sided), "< 3.0" (upper), "> 1.0" (lower). Lines that don't
 * match are skipped; an empty result lets the caller fall back to prose-only output.
 */

export type Tone = "low" | "high" | "normal";

export interface RefRange {
  low?: number;
  high?: number;
  text: string;
}

export interface LabValue {
  name: string;
  value: number;
  valueText: string;
  unit: string;
  range: RefRange;
  tone: Tone;
  /** Marker position 0..1 for the range bar (normal band sits ~0.3–0.7). */
  pos: number;
}

export interface ParsedLab {
  values: LabValue[];
  flaggedCount: number;
  inRangeCount: number;
}

// name (lazy)  ....(2+ dots)  value  unit(no parens)  (ref RANGE)
// Number tokens are strict (\d+(?:\.\d+)?) so Number() can never yield NaN from "1.2.3",
// and unit/range use negated classes (no `(`/`)`) to avoid backtracking on untrusted input.
const NUM = "\\d+(?:\\.\\d+)?";
const LINE_RE = new RegExp(
  // value must be a complete number (negative lookahead rejects malformed "1.2.3")
  `^\\s*([A-Za-z][A-Za-z0-9 /+%-]*?)\\s*\\.{2,}\\s*(${NUM})(?![\\d.])\\s*([^(]+?)\\s*\\(\\s*ref\\.?\\s*([^)]+)\\)`,
  "i",
);

const TWO_SIDED = new RegExp(`^(${NUM})\\s*[-–—]\\s*(${NUM})$`);
const UPPER_ONLY = new RegExp(`^[<≤]\\s*(${NUM})$`);
const LOWER_ONLY = new RegExp(`^[>≥]\\s*(${NUM})$`);

/** OCR lines are never legitimately this long; cap to bound regex work on adversarial input. */
const MAX_LINE_LEN = 512;

function parseRange(text: string): RefRange | null {
  const t = text.trim();
  let m = TWO_SIDED.exec(t);
  if (m) return { low: Number(m[1]), high: Number(m[2]), text: t };
  m = UPPER_ONLY.exec(t);
  if (m) return { high: Number(m[1]), text: t };
  m = LOWER_ONLY.exec(t);
  if (m) return { low: Number(m[1]), text: t };
  return null;
}

function toneOf(value: number, range: RefRange): Tone {
  if (range.low !== undefined && value < range.low) return "low";
  if (range.high !== undefined && value > range.high) return "high";
  return "normal";
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

/** Map a value to a 0..1 marker position; the normal band is visually centred at 0.3–0.7. */
function markerPos(value: number, range: RefRange): number {
  const { low, high } = range;
  if (low !== undefined && high !== undefined && high > low) {
    return clamp(0.3 + ((value - low) / (high - low)) * 0.4, 0.04, 0.96);
  }
  if (high !== undefined && low === undefined && high > 0) {
    return clamp(0.1 + (value / high) * 0.6, 0.04, 0.96); // "< high": normal is left
  }
  if (low !== undefined && high === undefined && low > 0) {
    return clamp(0.3 + ((value - low) / low) * 0.4, 0.04, 0.96); // "> low": below low is left
  }
  return 0.5;
}

function titleCase(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

/** Parse a lab report's text into structured, range-checked values. */
export function parseLabReport(text: string): ParsedLab {
  const values: LabValue[] = [];
  for (const rawLine of text.split(/\r?\n/)) {
    if (rawLine.length > MAX_LINE_LEN) continue;
    const m = LINE_RE.exec(rawLine);
    if (!m) continue;
    const value = Number(m[2]);
    if (!Number.isFinite(value)) continue;
    const range = parseRange(m[4].trim());
    if (!range) continue;
    values.push({
      name: titleCase(m[1]),
      value,
      valueText: m[2],
      unit: m[3].trim().replace(/\.$/, ""),
      range,
      tone: toneOf(value, range),
      pos: markerPos(value, range),
    });
  }
  const flaggedCount = values.filter((v) => v.tone !== "normal").length;
  return { values, flaggedCount, inRangeCount: values.length - flaggedCount };
}

/**
 * Render parsed values as an AUTHORITATIVE findings block for the model prompt. The small
 * model tends to re-judge normal/abnormal from raw numbers and gets it wrong (e.g. calling an
 * out-of-range glucose "normal"); feeding it our deterministic classifications keeps the prose
 * summary consistent with the flag cards. Returns "" when nothing parsed (caller omits it).
 */
export function formatFindings(parsed: ParsedLab): string {
  if (parsed.values.length === 0) return "";
  // Safe to embed unsanitized in the prompt: name/valueText/unit/range come from LINE_RE
  // capture groups (no '(' , and the per-line split bounds each field to a single line), so a
  // crafted report can't smuggle a newline, forge a [[PATIENT_REPORT]] marker, or inject an
  // instruction line through these values. Keep this guarantee if the parser regex changes.
  const dirOf: Record<Tone, string> = {
    low: "BELOW range (low)",
    high: "ABOVE range (high)",
    normal: "within range (normal)",
  };
  const lines = parsed.values.map(
    (v) => `- ${v.name}: ${v.valueText} ${v.unit} (reference ${v.range.text}) — ${dirOf[v.tone]}`,
  );
  return (
    "AUTHORITATIVE findings, computed deterministically from the report. Use these exact " +
    "classifications — do NOT re-judge whether a value is normal or abnormal:\n" +
    lines.join("\n")
  );
}
