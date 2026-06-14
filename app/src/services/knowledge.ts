/**
 * Curated, non-diagnostic education for common lab markers. Deterministic and offline —
 * so per-value explanations are ACCURATE (never model-hallucinated). The on-device model
 * adds the holistic summary on top; this fills the per-flag "what does this mean" note.
 *
 * Content is general health education, not medical advice. Matched by a normalized name
 * with common aliases; unknown markers fall back to a generic range note.
 */

export interface MarkerInfo {
  /** Friendly canonical label (optional override of the parsed name). */
  label?: string;
  /** One-line "what it is". */
  about: string;
  low?: string;
  high?: string;
}

/** Lowercase, strip non-alphanumerics — so "LDL Cholesterol" and "ldl-cholesterol" match. */
export function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

const KB: Record<string, MarkerInfo> = {
  hemoglobin: {
    about: "Hemoglobin carries oxygen in your red blood cells.",
    low: "Slightly low hemoglobin can cause tiredness or shortness of breath, and is often linked to low iron.",
    high: "High hemoglobin can occur with dehydration, smoking, or living at altitude — worth a recheck.",
  },
  whitebloodcells: {
    about: "White blood cells are part of your immune system.",
    low: "A low white-cell count can follow some infections or medications.",
    high: "A high white-cell count often reflects an infection or inflammation.",
  },
  platelets: {
    about: "Platelets help your blood clot.",
    low: "Low platelets can mean easier bruising or bleeding.",
    high: "High platelets can follow inflammation or iron deficiency.",
  },
  glucose: {
    label: "Fasting glucose",
    about: "Blood glucose is your blood sugar level.",
    low: "Low glucose can cause shakiness or lightheadedness, especially before meals.",
    high: "Above the typical fasting range can point toward prediabetes; a repeat test is usually advised.",
  },
  hba1c: {
    about: "HbA1c reflects your average blood sugar over ~3 months.",
    high: "A higher HbA1c suggests higher average blood sugar — discuss prediabetes/diabetes screening.",
  },
  creatinine: {
    about: "Creatinine is a waste product your kidneys filter out.",
    low: "Low creatinine is usually not concerning and can relate to low muscle mass.",
    high: "High creatinine can signal the kidneys are working harder than usual — worth following up.",
  },
  ldlcholesterol: {
    label: "LDL cholesterol",
    about: "LDL is the 'bad' cholesterol that can build up in arteries.",
    high: "Higher than ideal LDL is tied to heart risk over time; diet, exercise, and follow-up help.",
  },
  hdlcholesterol: {
    label: "HDL cholesterol",
    about: "HDL is the 'good' cholesterol that helps clear LDL.",
    low: "Low HDL offers less heart protection; exercise tends to raise it.",
  },
  cholesterol: {
    about: "Total cholesterol sums the cholesterol in your blood.",
    high: "High total cholesterol is a heart-risk factor worth discussing with your doctor.",
  },
  triglycerides: {
    about: "Triglycerides are a type of fat in your blood.",
    high: "High triglycerides relate to diet, alcohol, and metabolic health.",
  },
  tsh: {
    about: "TSH reflects how hard your body is signaling the thyroid.",
    low: "Low TSH can suggest an overactive thyroid.",
    high: "High TSH can suggest an underactive thyroid (slowed metabolism, fatigue).",
  },
  alt: {
    about: "ALT is a liver enzyme.",
    high: "Elevated ALT can reflect liver stress; recheck and context matter.",
  },
  ast: {
    about: "AST is an enzyme found in the liver and muscle.",
    high: "Elevated AST can reflect liver or muscle stress.",
  },
  vitamind: {
    about: "Vitamin D supports bones and immunity.",
    low: "Low vitamin D is common and often corrected with sunlight or supplements.",
  },
  ferritin: {
    about: "Ferritin reflects your body's iron stores.",
    low: "Low ferritin points to low iron stores, a common cause of fatigue.",
    high: "High ferritin can reflect inflammation or iron overload.",
  },
};

const ALIASES: Record<string, string> = {
  wbc: "whitebloodcells",
  rbc: "hemoglobin",
  fastingglucose: "glucose",
  bloodglucose: "glucose",
  ldl: "ldlcholesterol",
  hdl: "hdlcholesterol",
  totalcholesterol: "cholesterol",
  thyroidstimulatinghormone: "tsh",
  hemoglobina1c: "hba1c",
  a1c: "hba1c",
  trig: "triglycerides",
};

export function lookupMarker(name: string): MarkerInfo | null {
  const key = normalizeName(name);
  return KB[key] ?? KB[ALIASES[key] ?? ""] ?? null;
}

/** A plain-language note for a flagged value, or a deterministic generic fallback. */
export function markerNote(name: string, tone: "low" | "high", rangeText: string): string {
  const info = lookupMarker(name);
  const specific = info ? info[tone] : undefined;
  if (specific) return specific;
  const dir = tone === "high" ? "above" : "below";
  return `This value is ${dir} the reference range (${rangeText}). Consider discussing it with your doctor.`;
}
