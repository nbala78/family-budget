import { describe, expect, it } from "vitest";
import { incomeUsd, spendingBy } from "./summary";

const history = [{ date: new Date("2026-01-01"), inr: 80 }];
const t = (amount: number, currency: "USD" | "INR", categoryId: string | null) =>
  ({ date: new Date("2026-03-01"), amount, currency, categoryId, userId: "u" });

describe("summaries", () => {
  const txns = [t(10, "USD", "food"), t(800, "INR", "food"), t(5, "USD", null), t(-1600, "INR", "salary")];
  it("totals spending per category in USD", () => {
    const m = spendingBy(txns, history, (x) => x.categoryId ?? "none");
    expect(m.get("food")).toBe(20);
    expect(m.get("none")).toBe(5);
    expect(m.has("salary")).toBe(false);
  });
  it("totals income in USD", () => expect(incomeUsd(txns, history)).toBe(20));
});
