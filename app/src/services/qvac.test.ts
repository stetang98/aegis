import { describe, it, expect } from "vitest";
import { explain, followUp, isOnDevice } from "./qvac";
import { parseLabReport } from "./labparse";
import { SAMPLE_REPORT } from "../lib/sample";

describe("qvac web/preview service", () => {
  it("is not on-device on web", () => {
    expect(isOnDevice).toBe(false);
  });

  it("summarizes flagged values", async () => {
    const parsed = parseLabReport(SAMPLE_REPORT);
    const out = await explain(SAMPLE_REPORT, parsed);
    expect(out.servedBy).toBe("preview");
    expect(out.summary).toMatch(/3 are outside|outside it/i);
    expect(out.summary).toMatch(/not a diagnosis/i);
  });

  it("reports the all-clear case", async () => {
    const parsed = parseLabReport("Glucose .... 4.5 mmol/L (ref 3.9-5.5)");
    const out = await explain("x", parsed);
    expect(out.summary).toMatch(/within their reference ranges/i);
  });

  it("answers follow-ups with a preview message", async () => {
    const out = await followUp("any trends?", [
      { ts: "2026-01-01", reportText: "Hb 10", summary: "low" },
    ]);
    expect(out.servedBy).toBe("preview");
    expect(out.summary).toContain("any trends?");
  });

  it("handles a follow-up with no records", async () => {
    const out = await followUp("hello?", []);
    expect(out.summary).toMatch(/add a report first/i);
  });
});
