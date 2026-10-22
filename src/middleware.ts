import { NextResponse, type NextRequest } from "next/server";

const PUBLIC = ["/login", "/setup", "/api/cron", "/manifest.webmanifest", "/sw.js", "/icons"];

// Cheap cookie-presence gate; real session validation happens server-side in requireUser().
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC.some((p) => pathname.startsWith(p))) return NextResponse.next();
  if (!req.cookies.has("fb_session")) return NextResponse.redirect(new URL("/login", req.url));
  return NextResponse.next();
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
