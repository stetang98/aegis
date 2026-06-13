import { test, expect, describe } from "vitest";
import { seal, open, safeEqual } from "../src/records/crypto";

describe("seal/open", () => {
  test("round-trips plaintext", () => {
    const pw = "correct horse battery staple";
    expect(open(seal("Hemoglobin 11.2", pw), pw)).toBe("Hemoglobin 11.2");
  });

  test("ciphertext does not contain the plaintext", () => {
    const sealed = seal("SECRET-PHI-VALUE", "pw");
    const ctText = Buffer.from(sealed.ct, "base64").toString("latin1");
    expect(ctText).not.toContain("SECRET-PHI-VALUE");
    expect(JSON.stringify(sealed)).not.toContain("SECRET-PHI-VALUE");
  });

  test("wrong passphrase throws", () => {
    expect(() => open(seal("x", "right"), "wrong")).toThrow();
  });

  test("tampered ciphertext throws (GCM auth)", () => {
    const sealed = seal("hello world", "pw");
    const ct = Buffer.from(sealed.ct, "base64");
    ct[0] ^= 0xff;
    expect(() => open({ ...sealed, ct: ct.toString("base64") }, "pw")).toThrow();
  });

  test("each seal uses a fresh salt + iv (non-deterministic)", () => {
    const a = seal("same", "pw");
    const b = seal("same", "pw");
    expect(a.iv).not.toBe(b.iv);
    expect(a.salt).not.toBe(b.salt);
    expect(a.ct).not.toBe(b.ct);
  });

  test("unsupported version throws", () => {
    const sealed = seal("x", "pw");
    expect(() => open({ ...sealed, v: 2 as unknown as 1 }, "pw")).toThrow();
  });

  test("safeEqual compares correctly", () => {
    expect(safeEqual("abc", "abc")).toBe(true);
    expect(safeEqual("abc", "abd")).toBe(false);
    expect(safeEqual("abc", "ab")).toBe(false);
  });
});
