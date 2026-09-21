import { describe, it, expect } from 'vitest';
import { sanitize, isRateLimited, MAX_REQUESTS_PER_WINDOW } from './security';

// ---------------------------------------------------------------------------
// Tests for the sanitization + rate-limit helpers extracted from the API route.
// For full route tests you would use `next/server` test utilities or an
// integration test against a running server — these unit tests cover the
// security-critical logic.
// ---------------------------------------------------------------------------

describe('sanitize', () => {
  it('escapes HTML tags', () => {
    expect(sanitize('<script>alert(1)</script>')).toBe(
      '&lt;script&gt;alert(1)&lt;&#x2F;script&gt;'
    );
  });

  it('escapes double and single quotes', () => {
    expect(sanitize('a"b\'c')).toBe('a&quot;b&#x27;c');
  });

  it('escapes forward slashes', () => {
    expect(sanitize('http://example.com')).toBe('http:&#x2F;&#x2F;example.com');
  });

  it('trims surrounding whitespace', () => {
    expect(sanitize('  hello  ')).toBe('hello');
  });

  it('leaves clean text unchanged', () => {
    expect(sanitize('Normal feedback text.')).toBe('Normal feedback text.');
  });

  it('returns an empty string for non-string input handled upstream', () => {
    // sanitize() is only called with strings in the route; this documents the
    // expected behaviour if called directly.
    expect(sanitize('')).toBe('');
  });
});

describe('rate limiting', () => {
  const TEST_IP = '192.168.1.1';

  beforeEach(() => {
    // Reset the in-memory store before each test so tests are isolated.
    isRateLimited.reset();
  });

  it('allows the first request from an IP', () => {
    expect(isRateLimited(TEST_IP)).toBe(false);
  });

  it('allows requests up to the limit', () => {
    for (let i = 0; i < MAX_REQUESTS_PER_WINDOW; i += 1) {
      expect(isRateLimited(TEST_IP)).toBe(false);
    }
  });

  it('blocks requests after the limit is reached', () => {
    for (let i = 0; i < MAX_REQUESTS_PER_WINDOW; i += 1) {
      isRateLimited(TEST_IP);
    }
    expect(isRateLimited(TEST_IP)).toBe(true);
  });

  it('tracks different IPs independently', () => {
    const ipA = '10.0.0.1';
    const ipB = '10.0.0.2';

    for (let i = 0; i < MAX_REQUESTS_PER_WINDOW; i += 1) {
      isRateLimited(ipA);
    }

    expect(isRateLimited(ipA)).toBe(true);
    expect(isRateLimited(ipB)).toBe(false);
  });
});
