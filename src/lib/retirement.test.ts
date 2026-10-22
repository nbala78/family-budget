import { describe, expect, it } from "vitest";
import { project, type Assumptions } from "./retirement";

const base: Assumptions = {
  currentAge: 40, retireAge: 41, lifeExpectancy: 45, annualSpendingUsd: 0,
  usInflationPct: 0, inInflationPct: 0, withdrawalTaxPct: 0, otherIncomeUsd: 0, otherIncomeStartAge: 99, inrPerUsd: 80,
};

describe("retirement projection", () => {
  it("grows balances and adds contributions until retirement", () => {
    const p = project([{ kind: "ROTH_IRA", currency: "USD", balance: 1000, monthlyContribution: 100, expectedReturnPct: 10 }], base);
    expect(p.atRetirementNominalUsd).toBeCloseTo(1000 * 1.1 + 1200);
  });

  it("converts INR accounts at today's rate when inflation is equal", () => {
    const p = project([{ kind: "PPF", currency: "INR", balance: 800_000, monthlyContribution: 0, expectedReturnPct: 0 }], { ...base, retireAge: 40 });
    expect(p.atRetirementNominalUsd).toBeCloseTo(10_000);
  });

  it("weakens INR in dollar terms when Indian inflation is higher", () => {
    const p = project([{ kind: "PPF", currency: "INR", balance: 800_000, monthlyContribution: 0, expectedReturnPct: 0 }],
      { ...base, retireAge: 41, inInflationPct: 5 });
    expect(p.atRetirementNominalUsd).toBeCloseTo(10_000 / 1.05);
  });

  it("detects when money runs out", () => {
    const p = project([{ kind: "BROKERAGE", currency: "USD", balance: 25_000, monthlyContribution: 0, expectedReturnPct: 0 }],
      { ...base, retireAge: 40, annualSpendingUsd: 10_000 });
    expect(p.runsOutAt).toBe(42);
    expect(p.years.find((y) => y.age === 41)!.nominalUsd).toBeCloseTo(5_000);
  });

  it("grosses up withdrawals from pre-tax accounts", () => {
    const p = project([{ kind: "RETIREMENT_401K", currency: "USD", balance: 100_000, monthlyContribution: 0, expectedReturnPct: 0 }],
      { ...base, retireAge: 40, annualSpendingUsd: 8_000, withdrawalTaxPct: 20 });
    expect(p.years[0].withdrawalUsd).toBeCloseTo(10_000);
  });

  it("offsets spending with other income once it starts", () => {
    const p = project([{ kind: "BROKERAGE", currency: "USD", balance: 100_000, monthlyContribution: 0, expectedReturnPct: 0 }],
      { ...base, retireAge: 40, annualSpendingUsd: 10_000, otherIncomeUsd: 10_000, otherIncomeStartAge: 42 });
    expect(p.years.map((y) => y.withdrawalUsd)).toEqual([10_000, 10_000, 0, 0, 0, 0]);
  });
});
