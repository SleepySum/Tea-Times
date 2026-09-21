import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from './route';
import { isRateLimited } from '@/lib/security';

// Store the real MongoClient.prototype.connect so we can restore it between
// tests. Each test that touches MongoDB mocks connect itself.
let realConnect: typeof import('mongodb').MongoClient['prototype']['connect'];  beforeEach(async () => {
    const { MongoClient } = await import('mongodb');
    realConnect = MongoClient.prototype.connect;

    // Clear the cached client promise in getMongoClient() so each test that
    // mocks connect gets a fresh client instead of reusing a previous test's.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any)._mongoClientPromise = undefined;
  });

afterEach(async () => {
  const { MongoClient } = await import('mongodb');
  // Restore the original connect so tests are isolated.
  MongoClient.prototype.connect = realConnect;
});

// ---------------------------------------------------------------------------
// Helper: build a NextRequest with a JSON body usable in Vitest/jsdom.
// NextRequest's constructor doesn't accept a body option directly, so we
// mock the `json()` method instead.
// ---------------------------------------------------------------------------
function makeRequest(
  body: Record<string, unknown>,
  ip = '192.168.1.1'
): NextRequest {
  const url = new URL('http://localhost/api/feedback');
  const req = new NextRequest(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': ip,
    },
  });

  // Mock the body parsing so we don't need a real readable stream.
  vi.spyOn(req, 'json').mockResolvedValue(body);
  return req;
}

function makeBadJsonRequest(ip = '192.168.1.1'): NextRequest {
  const url = new URL('http://localhost/api/feedback');
  const req = new NextRequest(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain',
      'x-forwarded-for': ip,
    },
  });

  vi.spyOn(req, 'json').mockRejectedValue(new Error('bad json'));
  return req;
}

describe('POST /api/feedback', () => {
  beforeEach(() => {
    isRateLimited.reset();
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    process.env.ALLOWED_IPS = '';

    // Reset the MongoClient mock so no test leaks its mock into another.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.restoreAllMocks();
  });

  it('throws when MONGODB_URI is missing (validateEnv is effective)', async () => {
    delete process.env.MONGODB_URI;

    const req = makeRequest({
      articleId: 'tea-001',
      articleTitle: 'Test',
      message: 'Hello',
    });

    // validateEnv() throws synchronously. In production Next.js turns this
    // into a 500 response; here we verify the throw so the guard is real.
    await expect(POST(req)).rejects.toThrow(/Missing required environment variables/);
  });

  it('returns 400 for invalid JSON body', async () => {
    const req = makeBadJsonRequest();

    const res = await POST(req);
    expect(res.status).toBe(400);

    const data = (await res.json()) as { error?: string };
    expect(data.error).toContain('valid JSON');
  });

  it('returns 400 when required fields are missing', async () => {
    const req = makeRequest({ articleId: 'tea-001' });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const data = (await res.json()) as { error?: string };
    expect(data.error).toContain('required');
  });

  it('returns 400 when message exceeds 2000 characters', async () => {
    const req = makeRequest({
      articleId: 'tea-001',
      articleTitle: 'Test',
      message: 'a'.repeat(2001),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 201 for a valid submission', async () => {
    const MongoClient = await import('mongodb').then((m) => m.MongoClient);
    const originalConnect = MongoClient.prototype.connect;
    // The route calls client.db(...).collection(...) so the mocked client must
    // expose a `db` method that returns a DB-shaped object.
    const mockDb = {
      collection: vi.fn().mockReturnValue({
        insertOne: vi.fn().mockResolvedValue({ acknowledged: true }),
      }),
    };
    const mockClient = { db: vi.fn().mockReturnValue(mockDb) };
   MongoClient.prototype.connect = vi.fn().mockResolvedValue(mockClient as unknown as MongoClient);

    const req = makeRequest({
      articleId: 'tea-001',
      articleTitle: 'Test Article',
      message: 'Great article!',
    });

    const res = await POST(req);
    expect(res.status).toBe(201);

    const data = (await res.json()) as { ok?: boolean };
    expect(data.ok).toBe(true);

    MongoClient.prototype.connect = originalConnect;
  });

  it('stores a sanitized message (no raw HTML tags)', async () => {
    const MongoClient = await import('mongodb').then((m) => m.MongoClient);
    const insertOne = vi.fn().mockResolvedValue({ acknowledged: true });
    const db = {
      collection: vi.fn().mockReturnValue({ insertOne }),
    };
    const client = { db: vi.fn().mockReturnValue(db) };
    const originalConnect = MongoClient.prototype.connect;
    MongoClient.prototype.connect = vi
      .fn()
      .mockResolvedValue(client as unknown as MongoClient);

    const req = makeRequest({
      articleId: 'tea-001',
      articleTitle: 'Test',
      message: '<script>alert(1)</script> Hello',
    });

    const res = await POST(req);
    expect(res.status).toBe(201);

    expect(insertOne).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.not.stringContaining('<script>'),
        message: expect.stringContaining('&lt;script&gt;'),
      })
    );

    MongoClient.prototype.connect = originalConnect;
  });

  it('returns 429 when rate limit is exceeded', async () => {
    const ip = '10.0.0.99';
    for (let i = 0; i < 20; i += 1) {
      isRateLimited(ip);
    }

    const req = makeRequest(
      { articleId: 'tea-001', articleTitle: 'Test', message: 'Hi' },
      ip
    );

    const res = await POST(req);
    expect(res.status).toBe(429);

    const data = (await res.json()) as { error?: string };
    expect(data.error).toContain('many requests');
  });

  it('returns 403 when IP is not in ALLOWED_IPS', async () => {
    process.env.ALLOWED_IPS = '10.0.0.1,10.0.0.2';
    const req = makeRequest(
      { articleId: 'tea-001', articleTitle: 'Test', message: 'Hi' },
      '10.0.0.99'
    );

    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it('allows requests from IPs in ALLOWED_IPS', async () => {
    const MongoClient = await import('mongodb').then((m) => m.MongoClient);
    const mockDb = {
      collection: vi.fn().mockReturnValue({
        insertOne: vi.fn().mockResolvedValue({ acknowledged: true }),
      }),
    };
    MongoClient.prototype.connect = vi
      .fn()
      .mockResolvedValue({ db: vi.fn().mockReturnValue(mockDb) } as unknown as MongoClient);

    process.env.ALLOWED_IPS = '10.0.0.1,10.0.0.99';
    const req = makeRequest(
      { articleId: 'tea-001', articleTitle: 'Test', message: 'Hi' },
      '10.0.0.99'
    );

    const res = await POST(req);
    expect(res.status).toBe(201);
  });

  it('returns 503 when the database is unavailable', async () => {
    const MongoClient = await import('mongodb').then((m) => m.MongoClient);
    const originalConnect = MongoClient.prototype.connect;
    MongoClient.prototype.connect = vi.fn().mockRejectedValue(new Error('connection refused'));

    const req = makeRequest({
      articleId: 'tea-001',
      articleTitle: 'Test',
      message: 'Hello',
    });

    const res = await POST(req);
    expect(res.status).toBe(503);

    MongoClient.prototype.connect = originalConnect;
  });
});
