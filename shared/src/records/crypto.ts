/**
 * Authenticated encryption for the local health-record store (PHI must never sit in plaintext on disk).
 * AES-256-GCM with a per-seal random salt + IV; key derived from a passphrase via scrypt. The KDF
 * parameters are stored in the envelope so future cost bumps can still open old data. GCM's auth tag
 * means tampering or a wrong passphrase fails loudly on open(). Pure node:crypto, nothing leaves device.
 *
 * The passphrase should come from secure device storage (keychain / user PIN) in production; the demo
 * may pass a fixed one.
 */
import { randomBytes, createCipheriv, createDecipheriv, scryptSync, timingSafeEqual } from "node:crypto";

const ALGO = "aes-256-gcm";
const KEY_LEN = 32;
const IV_LEN = 12;
const SALT_LEN = 16;
/** scrypt cost: N=16384,r=8 keeps 128*N*r=16MiB under Node's 32MiB default maxmem; p=4 ~quadruples CPU cost. */
const SCRYPT_PARAMS = { N: 16384, r: 8, p: 4 } as const;

export interface KdfParams {
  N: number;
  r: number;
  p: number;
}

export interface Sealed {
  v: 1;
  kdf: KdfParams;
  salt: string; // base64
  iv: string; // base64
  tag: string; // base64
  ct: string; // base64
}

function deriveKey(passphrase: string, salt: Buffer, params: KdfParams): Buffer {
  return scryptSync(passphrase, salt, KEY_LEN, params);
}

/** Encrypt UTF-8 plaintext under a passphrase. Each call uses a fresh random salt + IV. */
export function seal(plaintext: string, passphrase: string): Sealed {
  const salt = randomBytes(SALT_LEN);
  const iv = randomBytes(IV_LEN);
  const key = deriveKey(passphrase, salt, SCRYPT_PARAMS);
  const cipher = createCipheriv(ALGO, key, iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    v: 1,
    kdf: { ...SCRYPT_PARAMS },
    salt: salt.toString("base64"),
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    ct: ct.toString("base64"),
  };
}

/** Decrypt a sealed blob. Throws if the passphrase is wrong or the ciphertext/tag was tampered with. */
export function open(sealed: Sealed, passphrase: string): string {
  if (sealed.v !== 1) {
    throw new Error(`unsupported sealed version: ${String(sealed.v)}`);
  }
  if (!sealed.kdf || typeof sealed.kdf.N !== "number") {
    throw new Error("sealed blob missing KDF parameters");
  }
  const salt = Buffer.from(sealed.salt, "base64");
  const iv = Buffer.from(sealed.iv, "base64");
  const tag = Buffer.from(sealed.tag, "base64");
  const ct = Buffer.from(sealed.ct, "base64");
  const key = deriveKey(passphrase, salt, sealed.kdf);
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString("utf8");
}

/** Constant-time string compare (for any future token checks). Pads to equal length to avoid a timing leak. */
export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  const len = Math.max(ab.length, bb.length);
  const pa = Buffer.alloc(len);
  const pb = Buffer.alloc(len);
  ab.copy(pa);
  bb.copy(pb);
  return timingSafeEqual(pa, pb) && ab.length === bb.length;
}
