/**
 * Shared security helpers extracted from the feedback API route so they can be
 * unit-tested without importing the full Next.js request pipeline.
 */

// ---------------------------------------------------------------------------
// In-memory rate limiter (same algorithm as src/app/api/feedback/route.ts)
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
  return str
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
}
