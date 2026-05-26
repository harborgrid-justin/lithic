# CLAUDE.md — Lithic Healthcare Platform

Guidance for Claude Code (and any AI agent) working in this repo. Lithic is an
enterprise, **HIPAA-regulated** healthcare SaaS (EHR). Treat every change as
production clinical software: correctness, security, and auditability come first.

## Commands

| Task | Command |
|------|---------|
| Dev server | `npm run dev` |
| Production build | `npm run build` |
| Type-check (no emit) | `npm run type-check` |
| Lint | `npm run lint` |
| Format | `npm run format` (check: `npm run format:check`) |
| Unit tests | `npm run test` (watch: `npm run test:watch`, coverage: `npm run test:coverage`) |
| E2E tests | `npm run test:e2e` (Playwright) |
| Prisma client | `npm run db:generate` |
| Prisma migrate (dev) | `npm run db:migrate` |
| Prisma studio | `npm run db:studio` |
| Seed DB | `npm run db:seed` |

**Definition of done** for any code change: `npm run type-check`, `npm run lint`, and
relevant `npm run test` all pass. Run them before claiming a task complete. Husky +
lint-staged auto-format and lint staged files on commit — don't bypass hooks.

## Stack

- **Next.js 14 (App Router)** + **React 18**, **TypeScript (strict)**
- **Prisma** ORM over **PostgreSQL**; **Redis** (ioredis) for cache/sessions
- **tRPC** (routers in `src/server/api`) + Next.js route handlers (`src/app/api`)
- **NextAuth v5** for auth; **Zod** for validation at boundaries
- **TailwindCSS** + **Radix UI**; **Zustand** + **TanStack Query** for state/data
- Integrations: AWS S3 (documents/DICOM), FHIR R4, HL7, Stripe, Twilio, Pusher
- **AI/LLM on Anthropic Claude** — see [`docs/llm/`](./docs/llm/)

## Repository map

```
src/
  app/           # App Router pages + API route handlers (app/api/**)
  components/    # React components (incl. components/ai)
  lib/           # Domain modules; lib/ai = LLM service, providers, prompts, agents
  server/        # tRPC routers, business services, db utilities
  hooks/         # Client React hooks
  stores/        # Zustand stores
  types/         # Shared TS types (e.g. types/ai.ts)
prisma/          # schema + seed
docs/llm/        # Canonical LLM/Claude engineering guidance (read before AI work)
```

Import alias: `@/` → `src/` (e.g. `import { LLMService } from '@/lib/ai/llm-service'`).

> Note: a separate `vanilla/` tree exists (alternate/legacy implementation). The Next.js
> app under `src/` is the primary, active codebase — make changes there unless told
> otherwise.

## HIPAA & security guardrails (non-negotiable)

- **Never log PHI.** Patient data must not appear in logs, error messages, analytics, or
  cache keys. The AI path enforces this via `PHIRedactor` in `src/lib/ai/llm-service.ts` —
  keep redaction on and route all model calls through `LLMService`.
- **No secrets in code or commits.** Keys come from env / a secrets manager. Never read or
  print `.env*`. If you find a secret committed, stop and flag it.
- **Validate at every boundary.** Parse and validate all external/API input with Zod
  before use. Don't trust client input or model output.
- **AuthZ on every endpoint.** API routes must check authentication and role/permission
  before touching PHI. Enforce data scoping server-side; never let the client or a model
  decide what records it may access.
- **Audit-sensitive actions.** Reads/writes of PHI and AI inferences must be auditable.
- **Encryption.** PHI at rest is AES-256 (see env `ENCRYPTION_KEY`); transport is HTTPS only.
- **Care with the DB.** Prisma migrations on patient tables can be destructive — see the
  `prisma-migration-reviewer` agent and never run destructive SQL without review.

## Conventions

- TypeScript strict mode; no `any` without a justified, commented reason.
- Prefer editing existing modules over adding new ones; match the folder's existing style.
- Keep cross-cutting LLM concerns (cache, rate limit, redaction, audit) in `LLMService`,
  not scattered in feature code. New AI features follow [`docs/llm/`](./docs/llm/).
- Don't introduce new dependencies casually in a regulated codebase; prefer what's already
  in `package.json`.
- Comments explain *why*, not *what*. Don't leave dead code or TODO stubs.

## Building AI / LLM features

Before touching anything under `src/lib/ai`, `src/components/ai`, or `src/app/api/ai`,
read the relevant doc:

- Model choice, prompting, SDK → [`docs/llm/claude-best-practices.md`](./docs/llm/claude-best-practices.md)
- Workflow vs. agent, building blocks → [`docs/llm/agents.md`](./docs/llm/agents.md)
- Where code goes → [`docs/llm/folder-structure.md`](./docs/llm/folder-structure.md)
- Caching, batch, cost → [`docs/llm/token-optimization.md`](./docs/llm/token-optimization.md)
- HIPAA/BAA, deployment → [`docs/llm/enterprise.md`](./docs/llm/enterprise.md)

Default model is **`claude-sonnet-4-6`**; escalate to `claude-opus-4-7` only where an eval
shows it's needed; use `claude-haiku-4-5` for bulk/low-latency work. Cache stable prompt
prefixes; budget `max_tokens`.

## Specialized agents available

This repo ships project subagents in `.claude/agents/` — delegate to them proactively:

- **code-reviewer** — correctness review of a diff.
- **hipaa-security-reviewer** — PHI/secrets/authz/encryption review (use for any change
  touching patient data, auth, or API routes).
- **test-runner** — run and triage Jest/Playwright failures.
- **prisma-migration-reviewer** — review schema/migration safety before applying.
- **llm-feature-engineer** — build AI features per `docs/llm/`.
