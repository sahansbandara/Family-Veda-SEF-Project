# TODO — Family Veda

## Immediate — branch hygiene (2026-09-23)

- [ ] Branch protection deferred by user on 2026-09-28; continue using reviewed PRs into `develop`.
- [x] [S3] Agent orchestration PRs #4 and #12–15 merged into `develop` (verified 2026-09-28)
- [ ] [all] PR into `develop` only from here on; never push or merge directly to `main`

## Hosting (2026-09-23) — see docs/DEPLOYMENT.md for the full walkthrough

- [ ] [human] Create Neon Postgres project, hand over the connection string (or paste it into Render's dashboard directly)
- [ ] [human] Create Render account, deploy from `render.yaml` (Blueprint), set the `sync: false` secrets in its dashboard
- [ ] [human] Create Vercel account, import `web/`, set `VITE_API_BASE_URL` once the Render URL exists
- [ ] [human] Get a Gemini API key (aistudio.google.com/apikey) and a Groq API key (console.groq.com/keys) — both free tier, no card
- [x] Initial EF Core migration applied to hosted Neon (reported 2026-09-28; see `docs/DEPLOYMENT.md`).
- [x] Captured Neon migration history and applied the doctor-constraint migration on 2026-09-28; see `docs/university/RELEASE_EVIDENCE_2026-09-28.md`. Keep `Database__MigrateOnStartup=false` in production (see agent/MEMORY.md).
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
- [x] Applied migration `20260927200627_20260928_S4_ThreePortalFeatures` to Neon (reported 2026-09-28); direct migration-history evidence remains to be captured.
- [x] [pending PR] Flutter booking duration picker: 15–120 minutes. Flutter 3.47.5 analysis and 69/69 tests passed.
- [x] [pending PR] Dashboard `recentActivity` from audit rows, scoped to own records and minors for a Head.
- [x] [pending PR] Add database constraints for one pending request and one active primary doctor per family; preserve assignment history and return conflict on concurrent writes. PostgreSQL 16 integration and idempotent script tests passed.
- [x] [pending PR] Repeat synthetic API journey across Family Head, Adult Member and Doctor: join by code, doctor request, appointment confirmation, dashboards, notifications and adult privacy 404 passed. Full Flutter/React/agent golden-case trace remains outstanding.
- [x] Applied follow-up migration `20260928010813_20260928_S4_DoctorAssignmentConstraints` to Neon after a recovery branch; verified migration history and indexes.
- [x] Built and installed hosted-API debug APK on Android API 36 emulator; launched to the sign-in screen and retained `docs/evidence/2026-09-28/android-launch.png`.
- [x] Deterministic synthetic PostgreSQL API golden case and invalid-schema safe-failure tests passed; full integration suite 11/11. Doctor approves through the assigned case grant, then family reads allowlisted guidance.
- [ ] Capture a full Flutter → API/agents → React approval → Flutter visual trace with synthetic accounts.
- [ ] Verify an authenticated hosted-API journey from the APK and publish a stable APK download link with checksum and installation instructions.
- [ ] Verify the exact Render backend revision and complete a synthetic doctor-account flow. The live Family Head dashboard, appointments, and notifications pages loaded on 2026-09-28; the previous notification error did not recur in this smoke check.
- [x] [human-reported 2026-09-28] Released migration lock for `20260928_S4_ThreePortalFeatures`.

### FUTURE
- [ ] [S1+S2] Opt-in "Share with Family Head" per adult report (needs migration lock)
- [ ] [S1] Family Code + join requests; Head transfer; Start My Own Family; leave/remove
- [ ] [S1] Lifecycle gaps: revoke old doctor grants on leaving; minor turning 18; inactive Head recovery; sharing for vitals/cases/appointments
- [ ] [S1/S4] Family Doctor request/change; AI doctor discovery (suggest, never "best")
- [ ] [TBD] Appointments, availability, calendar, notifications (FCM backend-only)
- [ ] [S2/S3] AI report explanation (doctor-gated); handwriting reader (doctor-only, RULE 6); image observations (doctor-only); health search (records-only, ACL-filtered)
- [ ] [S3] Pre-Visit Brief (doctor-only, case-grant scoped)
- [ ] [design] Apply mockup fixes listed in the blueprint before reusing mockups
