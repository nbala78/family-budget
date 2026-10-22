import { describe, expect, it } from "vitest";
import { randomBytes } from "node:crypto";
import { decrypt, encrypt } from "./crypto";

const key = randomBytes(32).toString("base64");

describe("field encryption", () => {
  it("round-trips text", () => {
    const secret = "Chase checking ••1234 — ₹ notes";
    const enc = encrypt(secret, key);
    expect(enc).not.toContain("1234");
    expect(decrypt(enc, key)).toBe(secret);
  });

  it("uses a fresh IV each time", () => {
    expect(encrypt("same", key)).not.toBe(encrypt("same", key));
  });

  it("rejects tampered ciphertext", () => {
    const parts = encrypt("hello", key).split(".");
    parts[3] = Buffer.from("jello").toString("base64url");
    expect(() => decrypt(parts.join("."), key)).toThrow();
  });

  it("rejects the wrong key", () => {
    expect(() => decrypt(encrypt("hello", key), randomBytes(32).toString("base64"))).toThrow();
  });

  it("requires a 32-byte key", () => {
    expect(() => encrypt("x", Buffer.from("short").toString("base64"))).toThrow(/32 bytes/);
  });
});
