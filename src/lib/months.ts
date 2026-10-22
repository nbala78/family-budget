/** Parses "YYYY-MM" into the first day of that month (UTC); defaults to the current month. */
export function parseMonth(raw?: string): Date {
  const m = raw?.match(/^(\d{4})-(\d{2})$/);
  const now = new Date();
  return m ? new Date(Date.UTC(+m[1], +m[2] - 1, 1)) : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

const key = (d: Date) => d.toISOString().slice(0, 7);

export function monthRange(start: Date) {
  const y = start.getUTCFullYear(), m = start.getUTCMonth();
  return {
    start,
    end: new Date(Date.UTC(y, m + 1, 1)),
    prev: key(new Date(Date.UTC(y, m - 1, 1))),
    next: key(new Date(Date.UTC(y, m + 1, 1))),
    key: key(start),
    label: start.toLocaleString("en-US", { month: "long", year: "numeric", timeZone: "UTC" }),
  };
}
