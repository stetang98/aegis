/**
 * Encrypted, local-only personal health-record store. Each explained report is appended and the whole
 * collection is sealed with AES-256-GCM (see crypto.ts) before touching disk — PHI is never written in
 * plaintext. Writes are atomic (temp file + rename) and serialized through an in-process mutex so a
 * crash or a concurrent add() can never corrupt or drop records. Source of truth for cross-history
 * follow-up. Nothing leaves the device.
 */
import { readFile, writeFile, rename, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { randomBytes } from "node:crypto";
import { seal, open, type Sealed } from "./crypto";

export interface HealthRecord {
  id: string;
  /** ISO-8601 timestamp of when the report was explained. */
  ts: string;
  reportText: string;
  answer: string;
  model: string;
}

function isSealed(x: unknown): x is Sealed {
  if (!x || typeof x !== "object") return false;
  const s = x as Record<string, unknown>;
  return (
    s["v"] === 1 &&
    typeof s["salt"] === "string" &&
    typeof s["iv"] === "string" &&
    typeof s["tag"] === "string" &&
    typeof s["ct"] === "string" &&
    typeof s["kdf"] === "object" &&
    s["kdf"] !== null
  );
}

export class HealthRecordStore {
  /** Serializes all writes: each add() chains onto the previous so read-modify-write can't race. */
  private writeLock: Promise<void> = Promise.resolve();

  constructor(
    private readonly filePath: string,
    private readonly passphrase: string,
  ) {}

  /** Decrypt and return all records. Returns [] only when the store does not exist yet. */
  async list(): Promise<HealthRecord[]> {
    let raw: string;
    try {
      raw = await readFile(this.filePath, "utf8");
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === "ENOENT") return [];
      throw e; // surface real read errors instead of silently losing data
    }
    const parsed: unknown = JSON.parse(raw);
    if (!isSealed(parsed)) {
      throw new Error("health-record store is corrupt or in an unrecognized format");
    }
    return JSON.parse(open(parsed, this.passphrase)) as HealthRecord[];
  }

  /** Append a record and persist the whole collection re-encrypted (atomic, serialized). */
  async add(record: HealthRecord): Promise<void> {
    const next = this.writeLock.then(() => this.addUnsafe(record));
    // Keep the chain alive even if this add rejects, so later adds still run.
    this.writeLock = next.catch(() => undefined);
    return next;
  }

  private async addUnsafe(record: HealthRecord): Promise<void> {
    if (!/^\d{4}-\d{2}-\d{2}T/.test(record.ts)) {
      throw new Error("record.ts must be a full ISO-8601 datetime (with time component)");
    }
    const records = await this.list();
    records.push(record);
    await mkdir(dirname(this.filePath), { recursive: true });
    const sealed = seal(JSON.stringify(records), this.passphrase);
    await this.writeAtomic(JSON.stringify(sealed));
  }

  /** Write to a sibling temp file then rename — atomic on POSIX/APFS, so a crash never truncates the store. */
  private async writeAtomic(data: string): Promise<void> {
    const tmp = `${this.filePath}.${randomBytes(6).toString("hex")}.tmp`;
    await writeFile(tmp, data, "utf8");
    await rename(tmp, this.filePath);
  }
}
