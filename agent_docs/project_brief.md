# Project Brief (Persistent)

- **Product vision:** Helps people decide what to work on next when everything feels important and time is limited.
- **User:** Solo, technically comfortable builder/student juggling multiple projects and obligations.
- **Design vibe:** Calm + focused, minimalist, low visual noise; single-primary-action UI; gentle, non-judgmental copy.

## Scope Discipline
- MVP focuses on: tasks/goals CRUD, context input, single recommendation, explanation, accept/skip, basic history.
- Explicitly out of scope: team features, native mobile apps, third-party ingestion, offline support, complex PM features.

## Coding Conventions
- TypeScript everywhere (avoid `any`).
- Keep route handlers thin:
  - Route handlers validate + auth + call services.
  - Services implement business logic and DB access.
- Prefer small, composable modules (no massive files).
- Naming:
  - React components: `PascalCase`
  - Functions/vars: `camelCase`
  - Files: `kebab-case` or `camelCase` consistently (pick one early)
- Error handling: return safe user messages; log only redacted/derived context.

## Quality Gates
- Don’t merge broken builds.
- Keep the core E2E flow working at all times.
- Before pushing “done”:
  - Run lint/format (once configured)
  - Run Playwright E2E core flow
  - Manual smoke test mobile Safari for the core flow

## Update Cadence
- Update `AGENTS.md` daily (or after major milestone).
- Update `agent_docs/*` if stack or constraints change.
