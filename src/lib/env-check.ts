/**
 * Runtime check for required environment variables.
 * Logs warnings only; does not throw. No PII or secrets in output.
 */

const REQUIRED_ENV = [
  "DATABASE_URL",
  "NEXTAUTH_SECRET",
  "NEXTAUTH_URL",
  "RESEND_API_KEY",
  "ANTHROPIC_API_KEY",
] as const;

let warned = false;

export function logEnvWarningsIfNeeded(): void {
  if (warned) return;
  const missing = REQUIRED_ENV.filter((key) => {
    const v = process.env[key];
    return v == null || String(v).trim() === "";
  });
  if (missing.length > 0) {
    console.warn(
      "[env] Missing or empty variables (app may fail at runtime):",
      missing.join(", "),
    );
    warned = true;
  }
}
