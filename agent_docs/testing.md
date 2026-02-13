# Testing Strategy

## Goal
Protect the core MVP flow with minimal overhead (1-week timeline).

## Primary Automated Test: E2E (Playwright)
**Run:** `npm test` or `npx playwright test`. The config starts the dev server with `E2E_TEST_MODE=1` and `E2E_TEST_SECRET=e2e-secret` so the Credentials sign-in is available.

**Core flow to protect:**
1. Sign in
2. Enter context (time/energy/urgency)
3. Request recommendation (AI-generated suggestion only; no existing-task pick)
4. Add to my tasks or skip
5. Request next suggestion

## Manual Checks (Smoke)
- Desktop (Chrome): full core flow
- Mobile Safari: core flow + layout sanity
- Slow LLM simulation:
  - loading state visible
  - retry works
- LLM failure path:
  - deterministic pick is returned
  - message shown: “AI is unavailable…”
- Daily cap reached:
  - deterministic path used
  - user sees “daily AI limit reached” messaging

## Pre-commit Hooks (Add once repo exists)
Recommended:
- `npm run lint`
- `npm run build` (or `next lint` + typecheck)
- `npx playwright test` (core spec only)

## Verification Loop
After each feature:
1. Run dev server and click through the changed flow
2. Run the core Playwright test (or at least before merging)
3. Fix failures immediately
