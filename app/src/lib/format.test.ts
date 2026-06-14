import { describe, it, expect } from "vitest";
import { formatDate, formatDateTime } from "./format";

describe("date formatting", () => {
  it("formats a valid ISO date", () => {
    const s = formatDate("2026-06-14T10:00:00.000Z");
    expect(s).toMatch(/Jun/);
    expect(s).toMatch(/1[34]/); // 13 or 14 depending on local tz
  });

  it("includes time in formatDateTime", () => {
    expect(formatDateTime("2026-06-14T10:00:00.000Z")).toMatch(/Jun/);
  });

  it("returns empty string for invalid input", () => {
    expect(formatDate("not-a-date")).toBe("");
    expect(formatDateTime("")).toBe("");
  });
});
