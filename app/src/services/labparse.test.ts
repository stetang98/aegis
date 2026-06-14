import { describe, it, expect } from "vitest";
import { parseLabReport } from "./labparse";
import { SAMPLE_REPORT } from "../lib/sample";

describe("parseLabReport — sample report", () => {
  const r = parseLabReport(SAMPLE_REPORT);

  it("extracts every value and counts flags correctly", () => {
    expect(r.values).toHaveLength(8);
    expect(r.flaggedCount).toBe(3);
    expect(r.inRangeCount).toBe(5);
  });

  it("assigns the right tone to each marker", () => {
    const byName = Object.fromEntries(r.values.map((v) => [v.name, v.tone]));
    expect(byName["Hemoglobin"]).toBe("low");
    expect(byName["Fasting Glucose"]).toBe("high");
    expect(byName["LDL Cholesterol"]).toBe("high"); // marker names keep the report's case (acronyms stay caps)
    expect(byName["TSH"]).toBe("normal");
    expect(byName["HDL Cholesterol"]).toBe("normal");
  });

  it("parses value, unit and range text exactly", () => {
    const hb = r.values.find((v) => v.name === "Hemoglobin")!;
    expect(hb.value).toBe(11.2);
    expect(hb.valueText).toBe("11.2");
    expect(hb.unit).toBe("g/dL");
    expect(hb.range).toEqual({ low: 13.5, high: 17.5, text: "13.5-17.5" });
  });

  it("keeps every marker position within the drawable band", () => {
    for (const v of r.values) {
      expect(v.pos).toBeGreaterThanOrEqual(0.04);
      expect(v.pos).toBeLessThanOrEqual(0.96);
      expect(Number.isFinite(v.pos)).toBe(true);
    }
  });
});

describe("parseLabReport — range kinds", () => {
  it("handles two-sided ranges (in/low/high)", () => {
    expect(parseLabReport("X .... 5 u (ref 1-10)").values[0].tone).toBe("normal");
    expect(parseLabReport("X .... 0.5 u (ref 1-10)").values[0].tone).toBe("low");
    expect(parseLabReport("X .... 99 u (ref 1-10)").values[0].tone).toBe("high");
  });

  it("handles upper-only ranges (< x)", () => {
    expect(parseLabReport("LDL .... 2 u (ref < 3.0)").values[0].tone).toBe("normal");
    expect(parseLabReport("LDL .... 4 u (ref < 3.0)").values[0].tone).toBe("high");
  });

  it("handles lower-only ranges (> x)", () => {
    expect(parseLabReport("HDL .... 1.4 u (ref > 1.0)").values[0].tone).toBe("normal");
    expect(parseLabReport("HDL .... 0.8 u (ref > 1.0)").values[0].tone).toBe("low");
  });
});

describe("parseLabReport — robustness on untrusted input", () => {
  it("returns nothing for empty / non-report text", () => {
    expect(parseLabReport("").values).toHaveLength(0);
    expect(parseLabReport("just a sentence with no labs").values).toHaveLength(0);
  });

  it("skips malformed numbers (no NaN bounds leak)", () => {
    const r = parseLabReport("Junk .... 1.2.3 stuff (ref 1-2)\nGlucose .... 9 u (ref 3-5)");
    expect(r.values).toHaveLength(1);
    expect(r.values[0].name).toBe("Glucose");
  });

  it("does not hang on adversarial input (ReDoS guard)", () => {
    const evil = "X " + ".".repeat(40) + " 1.0 " + "(".repeat(8000) + "\nGlucose .... 9 mmol/L (ref 3-5)";
    const t0 = Date.now();
    const r = parseLabReport(evil);
    expect(Date.now() - t0).toBeLessThan(500);
    expect(r.values).toHaveLength(1);
  });

  it("strips a trailing dot from the unit", () => {
    expect(parseLabReport("X .... 5 mg/dL. (ref 1-10)").values[0].unit).toBe("mg/dL");
  });
});
