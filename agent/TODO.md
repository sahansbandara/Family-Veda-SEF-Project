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

## Three-portal blueprint (2026-09-28) — see docs/Three_Portal_Implementation_Blueprint.md

Due 2026-09-30. CORE first; FUTURE only if time remains, otherwise it goes in the report's future-work section.

### CORE
- [x] [S4] Keep approval gate covering every patient-visible AI output; approval screen shows full draft + rule results (already true in ApprovalsPage — add a regression test)
- [ ] [S2] Deterministic lab range status with unit-mismatch check ("Cannot compare — unit mismatch")
- [ ] [S1+S2] Adult report sharing: Private default / Share with Family Head; Head queries filtered; no dashboard count leaks
- [ ] [S3] Simple family triage states on web + Flutter (no agent names)
- [ ] [S3/S4] Emergency referral screen on web (replace any alert()), 1990
- [ ] [each owner] Authorization-negative tests: 404 for other adult's private item, expired grant, revoked consent
- [ ] [S1] CI: CodeQL, Dependabot, secret scanning + push protection, coverage gate (Lecture 08)

### FUTURE
- [ ] [S1] Family Code + join requests; Head transfer; Start My Own Family; leave/remove
- [ ] [S1] Lifecycle gaps: revoke old doctor grants on leaving; minor turning 18; inactive Head recovery; sharing for vitals/cases/appointments
- [ ] [S1/S4] Family Doctor request/change; AI doctor discovery (suggest, never "best")
- [ ] [TBD] Appointments, availability, calendar, notifications (FCM backend-only)
- [ ] [S2/S3] AI report explanation (doctor-gated); handwriting reader (doctor-only, RULE 6); image observations (doctor-only); health search (records-only, ACL-filtered)
- [ ] [S3] Pre-Visit Brief (doctor-only, case-grant scoped)
- [ ] [design] Apply mockup fixes listed in the blueprint before reusing mockups
