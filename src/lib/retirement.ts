import type { AccountKind, Currency } from "@prisma/client";

export type TaxTreatment = "PRE_TAX" | "TAX_FREE" | "TAXABLE";

// How withdrawals are taxed, simplified. EPF/PPF and Roth/HSA (for medical use) are tax-free;
// 401k, traditional IRA and NPS annuity income are taxed as income.
export const TAX_TREATMENT: Record<AccountKind, TaxTreatment> = {
  RETIREMENT_401K: "PRE_TAX", IRA: "PRE_TAX", NPS: "PRE_TAX",
  ROTH_IRA: "TAX_FREE", HSA: "TAX_FREE", EPF: "TAX_FREE", PPF: "TAX_FREE",
  CHECKING: "TAXABLE", SAVINGS: "TAXABLE", CREDIT_CARD: "TAXABLE", CASH: "TAXABLE",
  BROKERAGE: "TAXABLE", FIXED_DEPOSIT: "TAXABLE", OTHER: "TAXABLE",
};

export const RETIREMENT_KINDS: AccountKind[] = ["RETIREMENT_401K", "IRA", "ROTH_IRA", "HSA", "EPF", "PPF", "NPS"];

export const KIND_LABEL: Record<AccountKind, string> = {
  CHECKING: "Checking", SAVINGS: "Savings", CREDIT_CARD: "Credit card", CASH: "Cash", BROKERAGE: "Brokerage",
  RETIREMENT_401K: "401(k)", IRA: "Traditional IRA", ROTH_IRA: "Roth IRA", HSA: "HSA",
  EPF: "EPF", PPF: "PPF", NPS: "NPS", FIXED_DEPOSIT: "Fixed deposit", OTHER: "Other",
};

export type ProjectionAccount = {
  kind: AccountKind;
  currency: Currency;
  balance: number;
  monthlyContribution: number;
  expectedReturnPct: number;
};

export type Assumptions = {
  currentAge: number;
  retireAge: number;
  lifeExpectancy: number;
  annualSpendingUsd: number; // today's dollars
  usInflationPct: number;
  inInflationPct: number;
  withdrawalTaxPct: number;
  otherIncomeUsd: number; // today's dollars per year
  otherIncomeStartAge: number;
  inrPerUsd: number; // today's rate
};

export type YearRow = { age: number; nominalUsd: number; realUsd: number; withdrawalUsd: number };

export type Projection = {
  years: YearRow[];
  atRetirementRealUsd: number;
  atRetirementNominalUsd: number;
  /** First age at which savings can't cover spending, or null if they last. */
  runsOutAt: number | null;
  /** 4% of the real balance at retirement: a common rule of thumb for a sustainable first-year withdrawal. */
  safeWithdrawalRealUsd: number;
};

/**
 * Year-by-year projection, reported in USD.
 * INR balances grow in INR; the INR/USD rate drifts by the inflation gap (purchasing-power parity),
 * so a higher Indian inflation assumption makes INR savings worth less in dollars over time.
 */
export function project(accounts: ProjectionAccount[], a: Assumptions): Projection {
  const usInf = a.usInflationPct / 100;
  const fxDrift = (1 + a.inInflationPct / 100) / (1 + usInf);
  const balances = accounts.map((x) => x.balance);
  const years: YearRow[] = [];
  let runsOutAt: number | null = null;
  let atRetirementNominalUsd = 0;
  let atRetirementRealUsd = 0;

  const toUsdAt = (i: number, y: number, amount: number) =>
    accounts[i].currency === "INR" ? amount / (a.inrPerUsd * fxDrift ** y) : amount;

  for (let y = 0; a.currentAge + y <= a.lifeExpectancy; y++) {
    const age = a.currentAge + y;
    const priceLevel = (1 + usInf) ** y;

    if (y > 0) {
      accounts.forEach((acc, i) => {
        balances[i] = balances[i] * (1 + acc.expectedReturnPct / 100);
        if (age <= a.retireAge) balances[i] += acc.monthlyContribution * 12;
      });
    }

    const totalUsd = () => balances.reduce((s, b, i) => s + toUsdAt(i, y, b), 0);

    if (age === a.retireAge) {
      atRetirementNominalUsd = totalUsd();
      atRetirementRealUsd = atRetirementNominalUsd / priceLevel;
    }

    let withdrawalUsd = 0;
    if (age >= a.retireAge) {
      const other = age >= a.otherIncomeStartAge ? a.otherIncomeUsd : 0;
      const needUsd = Math.max(0, a.annualSpendingUsd - other) * priceLevel;
      const pool = totalUsd();
      if (pool > 0 && needUsd > 0) {
        // Gross up for tax on the pre-tax share, then withdraw proportionally from every account.
        const preTaxShare = balances.reduce((s, b, i) => s + (TAX_TREATMENT[accounts[i].kind] === "PRE_TAX" ? toUsdAt(i, y, b) : 0), 0) / pool;
        const grossUsd = needUsd / (1 - (a.withdrawalTaxPct / 100) * preTaxShare);
        const fraction = Math.min(1, grossUsd / pool);
        balances.forEach((b, i) => (balances[i] = b * (1 - fraction)));
        withdrawalUsd = Math.min(grossUsd, pool);
        if (grossUsd > pool && runsOutAt === null) runsOutAt = age;
      } else if (needUsd > 0 && runsOutAt === null) {
        runsOutAt = age;
      }
    }

    const nominalUsd = totalUsd();
    years.push({ age, nominalUsd, realUsd: nominalUsd / priceLevel, withdrawalUsd });
  }

  return { years, atRetirementNominalUsd, atRetirementRealUsd, runsOutAt, safeWithdrawalRealUsd: atRetirementRealUsd * 0.04 };
}
