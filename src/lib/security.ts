/**
 * Shared security helpers extracted from the feedback API route so they can be
 * unit-tested without importing the full Next.js request pipeline.
 *
 * ## Rate limiter limitation
 *
 * The in-memory `Map` store is reset on every serverless invocation (Vercel,
 * Cloudflare, etc.). This means per-IP rate limiting works for a single
 * process / warm container but does NOT share state across invocations.
 *
 * For production-grade rate limiting, replace `isRateLimited` with a store
 * backed by Upstash Redis, Vercel KV, or a similar edge-compatible cache.
 *
 * Until then, the IP allowlist (`ALLOWED_IPS`) is the primary access-control
 * mechanism and the rate limiter is a best-effort DOS dampener.
 */

// ---------------------------------------------------------------------------
// In-memory rate limiter
// ---------------------------------------------------------------------------
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMIT_WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 20;

export { MAX_REQUESTS_PER_WINDOW };

export function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  if (entry.count >= MAX_REQUESTS_PER_WINDOW) return true;

  entry.count += 1;
  return false;
}

// Reset helper used by tests only — not exported from the route.
isRateLimited.reset = () => {
  rateLimitMap.clear();
};

// ---------------------------------------------------------------------------
// XSS / injection sanitizer
// ---------------------------------------------------------------------------
export function sanitize(str: string): string {
  // Escapes HTML-special characters so user text can be safely rendered
  // in the browser. Does NOT encode slashes — feedback text may contain
  // URLs and those should remain clickable.
  return str
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
}
