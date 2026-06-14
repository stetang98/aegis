import { describe, it, expect } from "vitest";
import { analyzeReport, deriveTitle } from "./analyze";
import { SAMPLE_REPORT } from "../lib/sample";

describe("deriveTitle", () => {
  it("title-cases a single section heading", () => {
    expect(deriveTitle("COMPLETE BLOOD COUNT\n  Hb .... 11 g (ref 1-2)")).toBe("Complete blood count");
  });

  it("uses the honest 'Lab panel' for multi-panel reports", () => {
    expect(deriveTitle("COMPLETE BLOOD COUNT\nLIPIDS\n  LDL .... 4 u (ref < 3)")).toBe("Lab panel");
  });

  it("skips patient/admin lines and falls back to 'Lab report'", () => {
    expect(deriveTitle("PATIENT: Jane\nCOLLECTED: 2026")).toBe("Lab report");
    expect(deriveTitle("nothing capitalized here")).toBe("Lab report");
  });
});

describe("analyzeReport (web/preview service)", () => {
  it("returns parsed values, a summary and a title", async () => {
    const a = await analyzeReport(SAMPLE_REPORT);
    expect(a.parsed.values).toHaveLength(8);
    expect(a.parsed.flaggedCount).toBe(3);
    expect(a.title).toBe("Lab panel");
    expect(a.outcome.summary.length).toBeGreaterThan(0);
    expect(a.outcome.servedBy).toBe("preview");
  });
});
