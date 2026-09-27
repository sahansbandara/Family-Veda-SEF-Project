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
- [x] [S2→done by S4] Deterministic lab range status (`LabRangeClassifier`, server-side `RangeStatus`, "Reference range unavailable"). Value and range share one `Unit` column, so no mismatch is possible yet.
- [x] [S4] Adult privacy verified: Head gets 404 on any adult's reports/vitals (`AdultPrivacyAuthorizationTests`). Opt-in "Share with Family Head" needs a schema migration → moved to FUTURE.
- [x] [S4] Web family triage shows 4 plain steps (`FamilyCaseProgress`); agent pipeline kept under "Technical details" as viva evidence. Flutter stepper already uses non-technical labels.
- [x] Emergency referral already a card on web + Flutter screen; no alert() in code (only in the external mockups).
- [x] [S4] 404 for other adult's private items. Expired grant / revoked consent already covered by `CaseGrantPolicyTests`, `ConsentStateMachineTests`.
- [x] [S4] CodeQL workflow + Dependabot added. [human] Turn on secret scanning + push protection in GitHub Settings → Code security.

### DONE 2026-09-28 (S4, ownership waived — see DECISIONS 2026-09-28)
- [x] Family Code + join requests (backend, web, Flutter)
- [x] Family Doctor directory + request/accept (assignment history kept)
- [x] Appointments: book/cancel (family), confirm/complete/no-show (doctor), overlap + privacy rules
- [x] In-app notifications + bell
- [x] Family Head / Adult Member / Doctor dashboards
- [ ] [human] Apply migration `20260927200627_20260928_S4_ThreePortalFeatures` to Neon via `dotnet ef migrations script --idempotent` + psql (see DEPLOYMENT.md)
- [ ] Book-appointment on Flutter: add duration picker (fixed 30 min now)
- [ ] Dashboard `recentActivity` list is empty — wire from audit rows (own + minors only)
- [ ] [human] Announce migration lock for `20260928_S4_ThreePortalFeatures`

### FUTURE
- [ ] [S1+S2] Opt-in "Share with Family Head" per adult report (needs migration lock)
- [ ] [S1] Family Code + join requests; Head transfer; Start My Own Family; leave/remove
- [ ] [S1] Lifecycle gaps: revoke old doctor grants on leaving; minor turning 18; inactive Head recovery; sharing for vitals/cases/appointments
- [ ] [S1/S4] Family Doctor request/change; AI doctor discovery (suggest, never "best")
- [ ] [TBD] Appointments, availability, calendar, notifications (FCM backend-only)
- [ ] [S2/S3] AI report explanation (doctor-gated); handwriting reader (doctor-only, RULE 6); image observations (doctor-only); health search (records-only, ACL-filtered)
- [ ] [S3] Pre-Visit Brief (doctor-only, case-grant scoped)
- [ ] [design] Apply mockup fixes listed in the blueprint before reusing mockups
