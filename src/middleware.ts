import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { checkRateLimit, getClientKey } from "@/lib/rate-limit";

const RATE_LIMITS: Record<string, { limit: number; windowMs: number }> = {
  "/api/generate": { limit: 20, windowMs: 60 * 1000 },
  "/api/enhance": { limit: 30, windowMs: 60 * 1000 },
  "/api/enhance-refinement": { limit: 30, windowMs: 60 * 1000 },
  "/api/deploy": { limit: 10, windowMs: 60 * 1000 },
  "/api/download": { limit: 20, windowMs: 60 * 1000 },
};

export function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const config = RATE_LIMITS[pathname];

  if (!config) {
    return NextResponse.next();
  }

  // Only rate limit POST for /api/download (GET is the bridge page)
  if (pathname === "/api/download" && req.method !== "POST") {
    return NextResponse.next();
  }

  const key = getClientKey(req, pathname);
  const result = checkRateLimit(key, config.limit, config.windowMs);

  if (!result.ok) {
    const res = NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
    if (result.retryAfter !== undefined) {
      res.headers.set("Retry-After", String(result.retryAfter));
    }
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/generate",
    "/api/enhance",
    "/api/enhance-refinement",
    "/api/deploy",
    "/api/download",
  ],
};
