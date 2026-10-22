import { describe, expect, it, vi } from "vitest";
import { convert, fetchUsdInr, ratesOn, toUsd } from "./fx";

const rates = { USD: 1, INR: 83.25 };

describe("convert", () => {
  it("converts INR to USD", () => expect(toUsd(8325, "INR", rates)).toBe(100));
  it("converts USD to INR", () => expect(convert(10, "USD", "INR", rates)).toBe(832.5));
  it("leaves same currency alone", () => expect(convert(12.345, "USD", "USD", rates)).toBe(12.345));
  it("rounds to cents", () => expect(toUsd(1000, "INR", rates)).toBe(12.01));
});

describe("fetchUsdInr", () => {
  const json = (body: unknown, ok = true) => ({ ok, status: ok ? 200 : 500, json: async () => body }) as Response;

  it("uses the first source that works", async () => {
    const f = vi.fn().mockResolvedValueOnce(json({ rates: { INR: 84.1 } }));
    expect(await fetchUsdInr(f)).toEqual({ rate: 84.1, source: "frankfurter" });
  });

  it("falls back when the first source fails", async () => {
    const f = vi.fn().mockResolvedValueOnce(json({}, false)).mockResolvedValueOnce(json({ rates: { INR: 84.2 } }));
    expect(await fetchUsdInr(f)).toEqual({ rate: 84.2, source: "open.er-api" });
  });

  it("throws when every source fails", async () => {
    const f = vi.fn().mockRejectedValue(new Error("offline"));
    await expect(fetchUsdInr(f)).rejects.toThrow(/All FX sources failed/);
  });
});

describe("ratesOn", () => {
  const h = [
    { date: new Date("2026-01-01"), inr: 80 },
    { date: new Date("2026-02-01"), inr: 82 },
  ];
  it("uses the latest rate on or before the date", () => expect(ratesOn(new Date("2026-01-15"), h).INR).toBe(80));
  it("uses the exact day's rate", () => expect(ratesOn(new Date("2026-02-01"), h).INR).toBe(82));
  it("falls back to the earliest rate for older dates", () => expect(ratesOn(new Date("2025-06-01"), h).INR).toBe(80));
});
