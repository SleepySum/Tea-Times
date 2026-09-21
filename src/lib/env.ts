/**
 * Environment variable validation.
 *
 * Import this module once at the entry point of your server-side code so that
 * the app fails fast with a clear message when required secrets are missing.
 *
 * Next.js runs this automatically when you import it from a server component,
 * route handler, or `layout.tsx` / `page.tsx` server file.
 */
export function validateEnv() {
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

/** Call once at module scope so validation runs before any request handler. */
validateEnv();
