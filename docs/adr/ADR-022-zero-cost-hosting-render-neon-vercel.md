# ADR-022 — Zero-Cost Hosting: Render, Neon and Vercel

**Owner:** Group · **Status:** Accepted · **Date:** 2026-09-23

> Written up on 2026-10-05 from the project decision log and the implemented code; the decision itself dates from the date above.

## Context

The submission requires an end-to-end cloud-hosted evaluation (see ADR-013), with no budget. ADR-013 notes the 512 MB RAM limit of the Render free tier, and ADR-014 notes the 0.5 GB Neon storage limit.

## Options considered

| Option | Pros | Cons |
|---|---|---|
| **Render (API, Docker), Neon (PostgreSQL 16), Vercel (React web), all free tier** (chosen) | No cost; `render.yaml` Blueprint and Vercel configuration in the repository | Small memory and storage quotas; cold starts are not recorded in the sources |
| Other hosts | Not recorded | Not recorded |

## Decision

Host the ASP.NET Core API on Render from `backend/Dockerfile` (Singapore region, health check `/health`, Tesseract installed in the runtime image), the database on Neon, and the web app on Vercel with a single-page-application rewrite to `index.html`. The database is not provisioned by the Blueprint; its connection string is supplied as a secret. Providers and keys required are listed in `docs/DEPLOYMENT.md`.

## Consequences

**Makes easy:** a reproducible deployment from the repository.

**Cost:** free-tier limits shape other decisions, for example moving original report images to Google Drive (ADR-014) and using hosted LLMs (ADR-013). `CLAUDE.md` still marks the host choice "confirm W7".

## Evidence

- `docs/DEPLOYMENT.md` — account table and section 1 (introduced 2026-09-23).
- `render.yaml` (introduced 2026-09-23): `plan: free`, `region: singapore`, `healthCheckPath: /health`.
- `web/vercel.json` (introduced 2026-09-23).
- `agent/MEMORY.md` — "2026-09-23 Gemini→Groq→Ollama LLM fallback + hosting scaffolding".
- `CLAUDE.md` — "Current selections".
