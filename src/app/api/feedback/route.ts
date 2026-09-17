import { NextResponse } from 'next/server';
import { getMongoClient } from '@/lib/mongodb';

export const runtime = 'nodejs';

type FeedbackPayload = {
  articleId?: unknown;
  articleTitle?: unknown;
  message?: unknown;
};

export async function POST(request: Request) {
  let body: FeedbackPayload;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Please send valid JSON.' }, { status: 400 });
  }

  const message = typeof body.message === 'string' ? body.message.trim() : '';
  const articleId = typeof body.articleId === 'string' ? body.articleId.trim() : '';
  const articleTitle = typeof body.articleTitle === 'string' ? body.articleTitle.trim() : '';

  if (!message || !articleId || !articleTitle) {
    return NextResponse.json({ error: 'Article and feedback are required.' }, { status: 400 });
  }

  if (message.length > 2_000) {
    return NextResponse.json({ error: 'Feedback must be 2,000 characters or fewer.' }, { status: 400 });
  }

  try {
    const client = await getMongoClient();
    await client.db(process.env.MONGODB_DB || 'tea-times').collection('feedback').insertOne({
      articleId,
      articleTitle,
      message,
      createdAt: new Date(),
    });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error('Unable to save feedback', error);
    return NextResponse.json({ error: 'Feedback is temporarily unavailable.' }, { status: 503 });
  }
}
