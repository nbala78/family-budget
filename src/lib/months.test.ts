import { describe, expect, it } from "vitest";
import { monthRange, parseMonth } from "./months";

describe("months", () => {
  it("parses YYYY-MM", () => expect(parseMonth("2026-01").toISOString()).toBe("2026-01-01T00:00:00.000Z"));
  it("wraps across years", () => {
    const r = monthRange(parseMonth("2026-01"));
    expect([r.prev, r.next, r.label]).toEqual(["2025-12", "2026-02", "January 2026"]);
    expect(r.end.toISOString()).toBe("2026-02-01T00:00:00.000Z");
  });
});
