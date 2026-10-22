import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

// AES-256-GCM field encryption for sensitive columns (account details, notes).
// This sits on top of the database provider's at-rest encryption.
// Format: v1.<iv>.<tag>.<ciphertext>, each part base64url.

const VERSION = "v1";

function loadKey(raw = process.env.FIELD_ENCRYPTION_KEY): Buffer {
  if (!raw) throw new Error("FIELD_ENCRYPTION_KEY is not set");
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) throw new Error("FIELD_ENCRYPTION_KEY must be 32 bytes, base64-encoded");
  return key;
}

export function encrypt(plaintext: string, rawKey?: string): string {
  const key = loadKey(rawKey);
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [VERSION, iv, tag, ct].map((p) => (typeof p === "string" ? p : p.toString("base64url"))).join(".");
}

export function decrypt(payload: string, rawKey?: string): string {
  const [version, iv, tag, ct] = payload.split(".");
  if (version !== VERSION || !iv || !tag || ct === undefined) throw new Error("Malformed encrypted value");
  const decipher = createDecipheriv("aes-256-gcm", loadKey(rawKey), Buffer.from(iv, "base64url"));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(ct, "base64url")), decipher.final()]).toString("utf8");
}

export function encryptOptional(value: string | null | undefined): string | null {
  return value ? encrypt(value) : null;
}

export function decryptOptional(value: string | null | undefined): string | null {
  return value ? decrypt(value) : null;
}
