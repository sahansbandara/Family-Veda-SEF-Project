# ADR-019 — Production Migrations by Idempotent SQL Script, Not on Startup

**Owner:** S1 · **Status:** Accepted · **Date:** 2026-09-23

> Written up on 2026-10-05 from the project decision log and the implemented code; the decision itself dates from the date above.

## Context

Applying EF Core migrations from the running API on startup failed in this project: the installed Npgsql 8.0.11 EF provider throws `IndexOutOfRangeException` in `RequiresQuoting` on the `database update` path. A deploy that reached Render before its migration was applied also caused errors such as a missing `user_profiles` relation.

## Options considered

| Option | Pros | Cons |
|---|---|---|
| **Generate an idempotent SQL script and apply it with `psql`, automated by a CI workflow** (chosen) | Works around the provider bug; already-applied migrations are skipped | Extra step and a repository secret |
| `Database__MigrateOnStartup=true` | No extra step | Triggers the provider bug (recorded) |

## Decision

Keep `Database__MigrateOnStartup` set to `false` in production. Generate the script with `dotnet ef migrations script --idempotent` and apply it with `psql`. The `migrate-db` workflow does this automatically when a migration lands on `develop`, serialised by a concurrency group and skipped with a warning when the `PRODUCTION_DATABASE_URL` secret is absent. For migrations that touch columns `DatabaseInitializer` has already added, the script is rewritten to use `IF NOT EXISTS`, rehearsed locally, and applied with a prior `pg_dump` backup (`agent/MEMORY.md`, 2026-09-28).

## Consequences

**Makes easy:** schema changes that reach Neon before, or with, the API revision that needs them.

**Cost:** the manual route remains the fallback when the secret is unset; the migration lock protocol in `CLAUDE.md` still applies.

## Evidence

- `docs/DEPLOYMENT.md` section 1, "Database — Neon" (steps 3 and 4).
- `render.yaml` — `Database__MigrateOnStartup: "false"` and its comment.
- `.github/workflows/migrate-db.yml` (introduced 2026-09-29).
- `agent/MEMORY.md` — "2026-09-23 full stack verified running locally" (Npgsql bug) and "2026-09-28 Neon migration applied" (`IF NOT EXISTS` rewrite, backup).
