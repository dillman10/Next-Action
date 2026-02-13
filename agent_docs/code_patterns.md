# Code Patterns & Architecture

## Folder Structure (Target)
Prefer this structure (adjust as needed to match actual repo):

```
src/
  app/                 # Next.js App Router pages + API route handlers
  components/
    ui/                # shadcn/ui primitives
    features/          # feature-level components (RecommendationCard, ContextForm, etc.)
  lib/
    auth/              # NextAuth helpers
    db/                # prisma client, db helpers
    llm/               # Claude client + prompt builders + parsers
    recommend/         # rules scoring + shortlist + fallbacks
    analytics/         # event logging to DB
    utils/             # shared utilities
  types/               # shared TS types
```

## Service Layer Rule
Route handlers:
- Validate request with Zod
- Ensure authenticated user
- Call a service function
- Return JSON

Services:
- Contain business logic
- Perform Prisma queries
- Do not depend on React/DOM
- Must not log raw task titles/notes

## Recommendation Engine Pattern
1. `fetchCandidateTasks(userId, filters)`
2. `scoreTasks(tasks, context)` → sorted list
3. `buildShortlist(scoredTasks, N=20..40)`
4. `maybeUseCache(key)`
5. `callClaude(shortlist, goals, recentEvents, context)` → strict JSON
6. Validate JSON → return result
7. On failure → deterministic pick + fallback explanation
8. Persist `RecommendationEvent`

## Redaction / Logging
- Logs should contain IDs + derived values only.
- Never print task titles/notes.
- For debugging, add a `safeDebugTask(task)` helper that returns an object with safe fields only.

## API Response Shape (Recommendation)
Return a consistent shape:
- `recommendedTaskId: string`
- `recommendedNextActionText: string`
- `explanation: string`
- `confidence: "low"|"med"|"high"`
- `source: "llm"|"rules"`
