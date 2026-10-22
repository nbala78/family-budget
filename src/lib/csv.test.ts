import { describe, expect, it } from "vitest";
import { parseAmount, parseCsv, parseDate, parseStatement } from "./csv";

const d = (s: string) => new Date(s + "T00:00:00Z");

describe("parseCsv", () => {
  it("handles quotes, commas and CRLF", () => {
    expect(parseCsv('a,"b, c","say ""hi"""\r\n1,2,3\r\n')).toEqual([["a", "b, c", 'say "hi"'], ["1", "2", "3"]]);
  });
});

describe("parseDate", () => {
  it("reads ISO", () => expect(parseDate("2026-03-04", "DMY")).toEqual(d("2026-03-04")));
  it("reads US order", () => expect(parseDate("03/04/2026", "MDY")).toEqual(d("2026-03-04")));
  it("reads Indian order with 2-digit year", () => expect(parseDate("04/03/26", "DMY")).toEqual(d("2026-03-04")));
  it("reads month names", () => expect(parseDate("04-Mar-2026", "MDY")).toEqual(d("2026-03-04")));
  it("rejects impossible dates", () => expect(parseDate("31/02/2026", "DMY")).toBeNull());
});

describe("parseAmount", () => {
  it("strips symbols", () => expect(parseAmount("₹1,23,456.50")).toBe(123456.5));
  it("reads parentheses as negative", () => expect(parseAmount("($12.00)")).toBe(-12));
  it("treats blank as missing", () => expect(parseAmount("  ")).toBeNull());
});

describe("parseStatement", () => {
  it("parses a US export with signed amounts", () => {
    const csv = "Transaction Date,Description,Amount\n10/01/2026,Costco,-152.30\n10/02/2026,Payroll,2500.00\n";
    expect(parseStatement(csv, "MDY").rows).toEqual([
      { date: d("2026-10-01"), description: "Costco", amount: 152.3 },
      { date: d("2026-10-02"), description: "Payroll", amount: -2500 },
    ]);
  });

  it("parses an Indian export with withdrawal/deposit columns and a preamble", () => {
    const csv = [
      "HDFC Bank statement,,,,",
      "Date,Narration,Chq./Ref.No.,Withdrawal Amt.,Deposit Amt.",
      '01/10/26,UPI-BIGBASKET,123,"1,250.00",',
      "02/10/26,NEFT SALARY,456,,85000.00",
      "03/10/26,,789,10.00,",
    ].join("\n");
    const res = parseStatement(csv, "DMY");
    expect(res.rows).toEqual([
      { date: d("2026-10-01"), description: "UPI-BIGBASKET", amount: 1250 },
      { date: d("2026-10-02"), description: "NEFT SALARY", amount: -85000 },
    ]);
    expect(res.skipped).toBe(1);
  });

  it("explains a missing header", () => {
    expect(parseStatement("foo,bar\n1,2", "MDY").error).toMatch(/Date column/);
  });
});
