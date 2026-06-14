import { describe, it, expect } from "vitest";
import { lookupMarker, markerNote, normalizeName } from "./knowledge";

describe("knowledge base", () => {
  it("normalizes names to a comparable key", () => {
    expect(normalizeName("LDL Cholesterol")).toBe("ldlcholesterol");
    expect(normalizeName("  Fasting-Glucose ")).toBe("fastingglucose");
  });

  it("looks up known markers", () => {
    expect(lookupMarker("Hemoglobin")?.about).toMatch(/oxygen/i);
    expect(lookupMarker("TSH")?.about).toMatch(/thyroid/i);
  });

  it("resolves aliases", () => {
    expect(lookupMarker("LDL")).toBe(lookupMarker("LDL Cholesterol"));
    expect(lookupMarker("WBC")).toBe(lookupMarker("White Blood Cells"));
    expect(lookupMarker("A1C")).toBe(lookupMarker("HbA1c"));
  });

  it("returns null for unknown markers", () => {
    expect(lookupMarker("Zorbinase")).toBeNull();
  });

  it("gives a specific note for a known marker + tone", () => {
    expect(markerNote("Hemoglobin", "low", "13.5-17.5")).toMatch(/iron|tired/i);
  });

  it("falls back to a deterministic generic note with the range", () => {
    const note = markerNote("Zorbinase", "high", "1-2");
    expect(note).toContain("above");
    expect(note).toContain("1-2");
  });
});
