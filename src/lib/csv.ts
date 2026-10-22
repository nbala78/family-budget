// Bank-statement CSV parsing. Handles US exports (single signed Amount column, MM/DD/YYYY)
// and Indian exports (separate Withdrawal/Deposit columns, DD/MM/YYYY).

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.some((f) => f.trim() !== "")) rows.push(row);
      row = [];
    } else field += c;
  }
  row.push(field);
  if (row.some((f) => f.trim() !== "")) rows.push(row);
  return rows;
}

export type DateOrder = "MDY" | "DMY";

export type ParsedRow = { date: Date; description: string; amount: number };
export type ImportResult = { rows: ParsedRow[]; skipped: number; error?: string };

const norm = (h: string) => h.toLowerCase().replace(/[^a-z]/g, "");
const find = (headers: string[], names: string[]) => headers.findIndex((h) => names.some((n) => norm(h).startsWith(n)));

export function parseDate(raw: string, order: DateOrder): Date | null {
  const s = raw.trim();
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return utc(+m[1], +m[2], +m[3]);
  m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/);
  if (m) {
    const [a, b, y] = [+m[1], +m[2], +m[3] < 100 ? 2000 + +m[3] : +m[3]];
    return order === "MDY" ? utc(y, a, b) : utc(y, b, a);
  }
  const months = "janfebmaraprmayjunjulaugsepoctnovdec";
  m = s.match(/^(\d{1,2})[ -]([A-Za-z]{3})[a-z]*[ -](\d{2,4})$/);
  if (m) {
    const mon = months.indexOf(m[2].toLowerCase()) / 3 + 1;
    if (mon >= 1) return utc(+m[3] < 100 ? 2000 + +m[3] : +m[3], mon, +m[1]);
  }
  return null;
}

function utc(y: number, m: number, d: number): Date | null {
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d ? dt : null;
}

export function parseAmount(raw: string | undefined): number | null {
  if (raw === undefined) return null;
  let s = raw.trim().replace(/[$₹,\s]|INR|USD|Rs\.?/gi, "");
  if (s === "" || s === "-") return null;
  let neg = false;
  if (/^\(.*\)$/.test(s)) { neg = true; s = s.slice(1, -1); }
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  return neg ? -n : n;
}

/**
 * Turns a statement into rows where a positive amount is money spent.
 * With a single Amount column, `negativeIsExpense` says which sign the bank uses for spending.
 */
export function parseStatement(text: string, order: DateOrder, negativeIsExpense = true): ImportResult {
  const all = parseCsv(text);
  const headerIdx = all.findIndex((r) => find(r, ["date", "txndate", "transactiondate", "valuedate", "postingdate"]) >= 0);
  if (headerIdx < 0) return { rows: [], skipped: 0, error: "Couldn't find a header row with a Date column." };
  const headers = all[headerIdx];
  const iDate = find(headers, ["date", "txndate", "transactiondate", "postingdate", "valuedate"]);
  const iDesc = find(headers, ["description", "narration", "details", "particulars", "payee", "memo", "remarks", "name"]);
  const iAmt = find(headers, ["amount"]);
  const iOut = find(headers, ["withdrawal", "debit"]);
  const iIn = find(headers, ["deposit", "credit"]);
  if (iDesc < 0 || (iAmt < 0 && iOut < 0)) {
    return { rows: [], skipped: 0, error: "Couldn't find Description and Amount (or Withdrawal/Deposit) columns." };
  }

  const rows: ParsedRow[] = [];
  let skipped = 0;
  for (const r of all.slice(headerIdx + 1)) {
    const date = parseDate(r[iDate] ?? "", order);
    let amount: number | null;
    if (iOut >= 0 && iAmt < 0) {
      const out = parseAmount(r[iOut]) ?? 0;
      const inn = iIn >= 0 ? parseAmount(r[iIn]) ?? 0 : 0;
      amount = out || inn ? Math.abs(out) - Math.abs(inn) : null;
    } else {
      const a = parseAmount(r[iAmt]);
      amount = a === null ? null : negativeIsExpense ? -a : a;
    }
    const description = (r[iDesc] ?? "").trim();
    if (!date || amount === null || amount === 0 || !description) { skipped++; continue; }
    rows.push({ date, description: description.slice(0, 200), amount: Math.round(amount * 100) / 100 });
  }
  return { rows, skipped };
}
