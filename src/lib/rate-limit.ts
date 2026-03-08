/**
 * In-memory rate limiter for API routes.
 * Note: Does not persist across serverless instances. For production at scale,
 * consider Upstash Redis or similar.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

const PRUNE_INTERVAL = 60 * 1000; // 1 minute
let lastPrune = Date.now();

function pruneExpired(): void {
  const now = Date.now();
  if (now - lastPrune < PRUNE_INTERVAL) return;
  lastPrune = now;
  for (const [key, entry] of store.entries()) {
    if (now > entry.resetAt) store.delete(key);
  }
}

export interface RateLimitResult {
  ok: boolean;
  retryAfter?: number;
}

/**
 * Check if the request is within rate limit.
 * @param key - Identifier (e.g. IP or IP+path hash)
 * @param limit - Max requests per window
 * @param windowMs - Window duration in milliseconds
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  pruneExpired();

  const now = Date.now();
  const entry = store.get(key);

  if (!entry) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }

  if (now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }

  entry.count++;
  if (entry.count <= limit) {
    return { ok: true };
  }

  return {
    ok: false,
    retryAfter: Math.ceil((entry.resetAt - now) / 1000),
  };
}

/**
 * Get client identifier from request headers.
 * Uses x-forwarded-for or x-real-ip when behind a proxy.
 */
export function getClientKey(req: Request, pathname: string): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const ip = forwarded?.split(",")[0]?.trim() ?? realIp ?? "unknown";
  return `${ip}:${pathname}`;
}
