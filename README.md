# NoteForWork v2

Monorepo for the NoteForWork rebuild. Design docs: [analysis](docs/01-website-analysis.md) · [architecture](docs/02-architecture.md).

> Local and staging environments use **fake data only**. Never load real patient data outside production.

## Layout

| Path | What |
|---|---|
| `apps/marketing` | Next.js 16: www site (static). Keeps every old `*.html` URL via `content/legacy-urls.ts` |
| `apps/app` | Next.js 16: patient intake (`/start`), later the portal, verification, physician and admin |
| `apps/api` | NestJS 12 (Fastify): the source of truth for screening, intake lifecycle, payments, notes |
| `apps/worker` | BullMQ jobs: expired-draft purge now; SLA timers, PDFs, email later |
| `packages/screening` | Eligibility rules engine (pure TS, versioned, used by the app and the API) |
| `packages/schemas` | Shared zod schemas, states, date helpers, ID formats |
| `packages/db` | Prisma 7 schema, migrations, seed, client |
| `packages/ui` | Brand tokens (Tailwind v4 `@theme`) and shared components |
| `packages/config` | Shared tsconfig presets |
| `infra` | AWS CDK (not scaffolded yet) |

## Getting started

Requirements: Node 22, pnpm 11, Docker.

```bash
pnpm install
pnpm db:up          # Postgres + Redis in Docker
pnpm db:generate
pnpm --filter @nfw/db migrate:deploy
pnpm db:seed        # states + one fake physician
pnpm build          # builds shared packages
pnpm dev            # marketing :3000, app :3001, api :4000, worker
```

Open http://localhost:3001/start. You need a state that's enabled in the seed, e.g. California or Texas.

## Checks

```bash
pnpm typecheck
pnpm test           # API and worker tests need the Docker DB running
pnpm build
```

## Rules of the road

- The API is the only source of truth. Never trust a value computed in the browser (risk, price, IDs, dates).
- No third-party scripts in `apps/app`: no analytics, session replay or ad pixels on PHI pages.
- Clinical rule changes go in `packages/screening/src/ruleset.ts`. They need medical-director sign-off and a `RULESET_VERSION` bump.
- Never log request bodies on PHI routes. Never put PHI in audit `meta`, Stripe metadata, SMS, or email subjects.

## Status

Phase 1 (foundation) is in progress. Done:
- Monorepo and CI.
- Database schema with migrations and seed.
- Screening engine.
- API endpoints for health, states and intake (create, consent, screening).
- Patient wizard through the screening result.
- Draft-purge worker.
- Marketing skeleton.

Next: authentication (Better Auth: patient OTP, staff MFA), CDK base stacks, and self-hosted font files.
