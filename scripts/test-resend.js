/**
 * Standalone script to test Resend email sending.
 * Does not use the database or NextAuth.
 *
 * Usage (from project root):
 *   Set env: RESEND_API_KEY, RESEND_FROM_EMAIL, and TEST_EMAIL (recipient).
 *   Then: node scripts/test-resend.js
 *
 * Example (PowerShell):
 *   $env:RESEND_API_KEY="re_..."; $env:RESEND_FROM_EMAIL="you@domain.com"; $env:TEST_EMAIL="you@domain.com"; node scripts/test-resend.js
 *
 * Logs: env confirmation (keys present, not values), full Resend response, and test recipient for diagnosis.
 */

const { Resend } = require("resend");

const apiKey = process.env.RESEND_API_KEY;
const fromRaw = process.env.RESEND_FROM_EMAIL?.trim();
const from = fromRaw || "onboarding@resend.dev";
const to = process.env.TEST_EMAIL?.trim();

if (!apiKey) {
  console.error("Missing RESEND_API_KEY. Set it in your environment.");
  process.exit(1);
}
if (!fromRaw) {
  console.error("Missing or empty RESEND_FROM_EMAIL. Set it in your environment.");
  process.exit(1);
}
if (!to || !to.includes("@")) {
  console.error("Missing or invalid TEST_EMAIL. Set it to the recipient address.");
  process.exit(1);
}

console.info("[test-resend] RESEND_API_KEY: set");
console.info("[test-resend] RESEND_FROM_EMAIL: set (value not logged)");
console.info("[test-resend] TEST_EMAIL (recipient):", to);
console.info("[test-resend] from address used:", from);

const resend = new Resend(apiKey);

async function main() {
  const result = await resend.emails.send({
    from,
    to,
    subject: "[Test] Next Action — Resend check",
    text: "If you received this, Resend is working.",
  });

  const responsePayload = {
    data: result.data,
    error: result.error,
    headers: result.headers ?? null,
  };
  console.info("[test-resend] full Resend API response:", JSON.stringify(responsePayload));

  if (result.error) {
    const err = result.error;
    console.error("[test-resend] HTTP status code:", err?.statusCode ?? "unknown");
    console.error("[test-resend] structured error details:", JSON.stringify({
      name: err?.name,
      message: err?.message,
      statusCode: err?.statusCode,
    }));
    process.exit(1);
  }
  console.info("[test-resend] send ok, id:", result.data?.id ?? "unknown");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
