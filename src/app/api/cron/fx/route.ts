import { NextResponse } from "next/server";
import { refreshRates } from "@/lib/rates";

// Vercel Cron calls this daily (see vercel.json) with "Authorization: Bearer $CRON_SECRET".
export async function GET(req: Request) {
  if (!process.env.CRON_SECRET || req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const row = await refreshRates();
    return NextResponse.json({ date: row.date, rate: Number(row.rate), source: row.source });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
