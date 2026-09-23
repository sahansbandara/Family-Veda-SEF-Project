# TODO — Family Veda

## Immediate — branch hygiene (2026-09-23)

- [ ] [human] Enable branch protection on `main` (require PR + 1 approving review, enforce for admins) — GitHub → Settings → Branches. Agent's API attempt was sandbox-blocked.
- [ ] [S3] Open a PR from `feature/s3-agent-orchestration` into `develop` (work wasn't lost, just reverted off `main` — needs the same route S1/S2/S4 already used)
- [ ] [all] PR into `develop` only from here on; never push or merge directly to `main`

## Hosting (2026-09-23) — see docs/DEPLOYMENT.md for the full walkthrough

- [ ] [human] Create Neon Postgres project, hand over the connection string (or paste it into Render's dashboard directly)
- [ ] [human] Create Render account, deploy from `render.yaml` (Blueprint), set the `sync: false` secrets in its dashboard
- [ ] [human] Create Vercel account, import `web/`, set `VITE_API_BASE_URL` once the Render URL exists
- [ ] [human] Get a Gemini API key (aistudio.google.com/apikey) and a Groq API key (console.groq.com/keys) — both free tier, no card
- [ ] Apply the EF Core migration to the hosted Neon DB once it exists (`docs/DEPLOYMENT.md` §1 has the exact commands — do NOT rely on `Database__MigrateOnStartup`, the installed Npgsql provider has a real bug on that path, see agent/MEMORY.md)
- [ ] [human, only if needed] Apple Developer account for a distributable iOS build beyond simulator; Android release keystore for a signed APK (docs/DEPLOYMENT.md §5–6)
