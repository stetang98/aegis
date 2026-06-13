import { test, expect, describe, afterEach } from "vitest";
import { HealthRecordStore, type HealthRecord } from "../src/records/store";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { rm, readFile, writeFile } from "node:fs/promises";

const PW = "test-pass";
const rec = (id: string, reportText: string): HealthRecord => ({
  id,
  ts: "2026-06-13T00:00:00.000Z",
  reportText,
  answer: `answer ${id}`,
  model: "MedPsy-4B",
});

describe("HealthRecordStore", () => {
  let path = "";
  function newPath(): string {
    path = join(tmpdir(), `aegis-store-${Date.now()}-${Math.random().toString(36).slice(2)}.json`);
    return path;
  }
  afterEach(async () => {
    if (path) await rm(path, { force: true });
  });

  test("a non-existent store lists nothing", async () => {
    expect(await new HealthRecordStore(newPath(), PW).list()).toEqual([]);
  });

  test("add then list round-trips records in order", async () => {
    const s = new HealthRecordStore(newPath(), PW);
    await s.add(rec("1", "Hemoglobin 11.2"));
    await s.add(rec("2", "Glucose 7.8"));
    const all = await s.list();
    expect(all.map((r) => r.id)).toEqual(["1", "2"]);
    expect(all[0].reportText).toBe("Hemoglobin 11.2");
  });

  test("the on-disk file is ciphertext — no plaintext PHI", async () => {
    const p = newPath();
    await new HealthRecordStore(p, PW).add(rec("1", "Hemoglobin 11.2 SECRET-PHI"));
    const raw = await readFile(p, "utf8");
    expect(raw).not.toContain("SECRET-PHI");
    expect(raw).not.toContain("Hemoglobin");
  });

  test("a wrong passphrase cannot read the store", async () => {
    const p = newPath();
    await new HealthRecordStore(p, "right-pass").add(rec("1", "x"));
    await expect(new HealthRecordStore(p, "wrong-pass").list()).rejects.toThrow();
  });

  test("records persist across store instances", async () => {
    const p = newPath();
    await new HealthRecordStore(p, PW).add(rec("1", "first"));
    expect(await new HealthRecordStore(p, PW).list()).toHaveLength(1);
  });

  test("corrupt JSON on disk throws (not a silent empty store)", async () => {
    const p = newPath();
    await writeFile(p, '{"v":1,"salt":"AA==","iv":"BB==","tag":"CC==","ct":', "utf8");
    await expect(new HealthRecordStore(p, PW).list()).rejects.toThrow();
  });

  test("structurally invalid envelope throws", async () => {
    const p = newPath();
    await writeFile(p, JSON.stringify({ v: 1, salt: "AA==" }), "utf8");
    await expect(new HealthRecordStore(p, PW).list()).rejects.toThrow(/corrupt|unrecognized/);
  });

  test("concurrent adds preserve every record (mutex)", async () => {
    const s = new HealthRecordStore(newPath(), PW);
    await Promise.all([s.add(rec("1", "a")), s.add(rec("2", "b")), s.add(rec("3", "c"))]);
    expect((await s.list()).map((r) => r.id).sort()).toEqual(["1", "2", "3"]);
  });

  test("rejects a record with a non-ISO timestamp", async () => {
    const s = new HealthRecordStore(newPath(), PW);
    await expect(s.add({ ...rec("1", "x"), ts: "not-a-date" })).rejects.toThrow(/ISO-8601/);
  });
});
