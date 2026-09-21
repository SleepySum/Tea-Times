import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getMongoClient } from '@/lib/mongodb';
import { sanitize, isRateLimited } from '@/lib/security';
import { validateEnv } from '@/lib/env';

export const runtime = 'nodejs';

// ---------------------------------------------------------------------------
// IP allowlist — set ALLOWED_IPS env var as comma-separated list.
// Empty = allow everyone (default for development).
// ---------------------------------------------------------------------------
function isIpAllowed(ip: string): boolean {
  const allowed = process.env.ALLOWED_IPS;
  if (!allowed) return true;
  const whitelist = allowed.split(',').map((s) => s.trim().toLowerCase());
  return whitelist.includes(ip.toLowerCase());
}

type FeedbackPayload = {
  articleId?: unknown;
  articleTitle?: unknown;
  message?: unknown;
};

export async function POST(request: NextRequest) {
  // ---- IP-based permissions ----
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    request.headers.get('x-real-ip') ??
    'unknown';

  if (!isIpAllowed(ip)) {
    return NextResponse.json(
      { error: 'Access denied.' },
      { status: 403 }
    );
  }

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a moment.' },
      { status: 429, headers: { 'Retry-After': '60' } }
    );
  }

  // ---- Validate environment ----
  validateEnv();

  // ---- Parse body ----
  let body: FeedbackPayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Please send valid JSON.' },
      { status: 400 }
    );
  }

  // ---- Validate & sanitize ----
  const message = typeof body.message === 'string' ? sanitize(body.message) : '';
  const articleId = typeof body.articleId === 'string' ? sanitize(body.articleId) : '';
  const articleTitle = typeof body.articleTitle === 'string' ? sanitize(body.articleTitle) : '';

  if (!message || !articleId || !articleTitle) {
    return NextResponse.json(
      { error: 'Article and feedback are required.' },
      { status: 400 }
    );
  }

  if (message.length > 2_000) {
    return NextResponse.json(
      { error: 'Feedback must be 2,000 characters or fewer.' },
      { status: 400 }
    );
  }

  // ---- Persist ----
  try {
    const client = await getMongoClient();
    await client
      .db(process.env.MONGODB_DB || 'tea-times')
      .collection('feedback')
      .insertOne({
        articleId,
        articleTitle,
        message,
        ip,
        createdAt: new Date(),
      });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error('Unable to save feedback', error);
    return NextResponse.json(
      { error: 'Feedback is temporarily unavailable.' },
      { status: 503 }
    );
  }
}
