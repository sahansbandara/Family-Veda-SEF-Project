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
- [x] [pending PR/deployment] Fix doctor web dashboard blank screen caused by treating the API's pending request count as a list; local web tests 41/41, lint and build passed. Retest hosted doctor portal after deployment.
- [x] Synthetic demo Head authenticated through the hosted-API APK; dashboard, appointments and notifications rendered on Android API 36 with retained screenshots.
- [ ] Publish a stable APK download link with checksum and installation instructions; verify hosted doctor approval and family guidance on Android.
- [ ] Verify the exact Render backend revision and complete a synthetic doctor-account flow. The live Family Head dashboard, appointments, and notifications pages loaded on 2026-09-28; the previous notification error did not recur in this smoke check.
- [x] [human-reported 2026-09-28] Released migration lock for `20260928_S4_ThreePortalFeatures`.

### REMAINING WORK AFTER PR #49 — deadline 2026-10-06 (supersedes the old FUTURE list)

Gap check dated 2026-09-28 against the three-portal blueprint. Each phase: take the migration lock for schema changes, TDD first, open a PR into `develop`, and coordinate with the owner for S1-owned files (`IdentityEntities.cs`, `FamilyService.cs`).

#### Phase 1 — Stabilise and baseline (29 Sep)
- [ ] Retest the hosted doctor dashboard after the #49 deploy; confirm the Render revision matches `develop`.
- [ ] Record baseline results for backend unit and integration tests, web (41/41) and Flutter (69/69) in `docs/university/`.
- [ ] Publish the APK link with checksum and install steps.

#### Phase 2 — Member profile + adult privacy (30 Sep–1 Oct) · needs migration lock
- [ ] [S1+S4] `Member.SexForClinicalReference` (`ClinicalSex = Male|Female|NotSpecified`) in registration, add-minor and invite-accept flows (web + Flutter).
- [ ] [S2+S4] Per-report family sharing: `Keep Private from Family Head` by default, or `Share with Family Head`. Keep it separate from doctor consent.
- [ ] [S4] Head sees shared adult reports only; dashboard counts and activity leak nothing. Add negative tests.
- [ ] [S4] Report-library card: owner, collected date, visibility, extraction state, original-file status, range summary.

#### Phase 3 — Family lifecycle (1–2 Oct) · needs migration lock
- [ ] [S1] `Family.HeadMemberId`; keep `CreatedByUserId` as history.
- [ ] [S1] `FamilyHeadTransfer`: the Head selects an adult, the adult accepts or declines, and the change applies in one transaction with audit and notifications.
- [ ] [S1] Start My Own Family: end the old membership, keep the account and history, create a new family and code.
- [ ] [S1] Leave Family (adult) and Remove from Family (Head); the Head must transfer the role first; revoke the old doctor grants.
- [ ] [S1] Join requests: `Expired` status, rate limit on code attempts. Invitations: resend and cancel.

#### Phase 4 — Doctor & appointments completion (2–3 Oct) · needs migration lock
- [ ] [S4] `DoctorAvailability` + `DoctorUnavailablePeriod`; slot picker only offers free slots.
- [ ] [S4] Doctor reschedule plus an appointment reminder notification.
- [ ] [S4] Change Family Doctor: end the current assignment and keep its history.
- [ ] [S4] Doctor member workspace tabs (Overview · Records · Labs · Vitals · Triage · Visits · Notes) + `ClinicalNote`. Every load checks verification, grant and consent.
- [ ] [all] Align the navigation of all three portals with the blueprint's final menus.

#### Phase 5 — Controlled AI tools (3–4 Oct) · pick the minimum; the rest goes to future work
- [ ] [S3] Doctor Pre-Visit Brief: doctor-only, grant-scoped, schema-validated, audited, labelled "AI-generated context only".
- [ ] [S2] AI plain-language lab explanation. Uses deterministic range status only and goes through the doctor-approval gate (RULES 1, 2, 6).
- [ ] [S3] Ask My Health Records: structured query over allow-listed read-only tools; never reads another adult's data.
- [ ] [S4] AI Doctor Discovery: parse preferences, apply hard filters on the backend, show "Suggested based on…", and the Head chooses.
- [ ] [FUTURE-WORK if no time] Image observations, handwritten reader, report comparison.

#### Phase 6 — Hardening + evidence (5 Oct)
- [ ] Authorization-negative tests for every new endpoint; audit rows for every cross-profile read.
- [ ] E2E golden flows: new household, join request, Family Doctor, private appointment, private lab report, triage, emergency (1990).
- [ ] Full Flutter → API/agents → React approval → Flutter visual trace (synthetic accounts).
- [ ] CI green, secret scan clean, and the blueprint's final checklist ticked.

#### Phase 7 — Submit (6 Oct)
- [ ] Freeze `develop` → `main`, tag release, report sections + AI disclosure, `SE3090_SE016` package.
