/**
 * Environment variable validation.
 *
 * Call `validateEnv()` at the top of any server-side handler that depends on
 * secrets (API routes, server actions, server components) so the app fails
 * fast with a clear message when required env vars are missing.
 *
 * Do NOT call this at module scope — that runs during static generation and
 * would crash builds when secrets are absent from the build environment.
 */
export function validateEnv(): void {
  const required: Array<{ key: string; label: string }> = [
    { key: 'MONGODB_URI', label: 'MongoDB connection string' },
  ];

  const missing: string[] = [];

  for (const { key, label } of required) {
    const value = process.env[key];
    if (!value || value.trim() === '') {
      missing.push(`${key} — ${label}`);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n` +
        missing.map((m) => `  • ${m}`).join('\n') +
        `\n\nCopy .env.example to .env.local and fill in the values.`
    );
  }
}
