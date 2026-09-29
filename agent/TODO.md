# TODO — Family Veda

## Immediate — branch hygiene (2026-09-23)

- [ ] Branch protection deferred by user on 2026-09-28; continue using reviewed PRs into `develop`.
- [x] [S3] Agent orchestration PRs #4 and #12–15 merged into `develop` (verified 2026-09-28)
- [ ] [all] PR into `develop` only from here on; never push or merge directly to `main`. Agent may self-merge its PRs into `develop` (DECISIONS 2026-09-28c)

## Hosting (2026-09-23) — see docs/DEPLOYMENT.md for the full walkthrough

- [ ] [human] Create Neon Postgres project, hand over the connection string (or paste it into Render's dashboard directly)
- [ ] [human] Create Render account, deploy from `render.yaml` (Blueprint), set the `sync: false` secrets in its dashboard
- [ ] [human] Create Vercel account, import `web/`, set `VITE_API_BASE_URL` once the Render URL exists
- [ ] [human] Get a Gemini API key (aistudio.google.com/apikey) and a Groq API key (console.groq.com/keys) — both free tier, no card
- [x] Initial EF Core migration applied to hosted Neon (reported 2026-09-28; see `docs/DEPLOYMENT.md`).
- [x] Captured Neon migration history and applied the doctor-constraint migration on 2026-09-28; see `docs/university/RELEASE_EVIDENCE_2026-09-28.md`. Keep `Database__MigrateOnStartup=false` in production (see agent/MEMORY.md).
- [ ] [human, only if needed] Apple Developer account for a distributable iOS build beyond simulator; Android release keystore for a signed APK (docs/DEPLOYMENT.md §5–6)

## Three-portal blueprint (2026-09-28) — see docs/Three_Portal_Implementation_Blueprint.md

Due 2026-10-06 (extended). CORE first; FUTURE only if time remains, otherwise it goes in the report's future-work section.

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
- [x] Fixed doctor web dashboard blank screen caused by treating the API's pending request count as a list; PR #49 merged, production synthetic verified-doctor dashboard and request panel retested without console errors.
- [x] [pending PR/deployment] Route doctor `/dashboard` to the live API panel so hard-coded sample metrics no longer appear above real counts. Web tests 41/41, lint and build passed locally.
- [x] Synthetic demo Head authenticated through the hosted-API APK; dashboard, appointments and notifications rendered on Android API 36 with retained screenshots.
- [ ] Publish a stable APK download link with checksum and installation instructions; verify hosted doctor approval and family guidance on Android.
- [ ] Verify the exact Render backend revision and complete a synthetic doctor-account flow. The live Family Head dashboard, appointments, and notifications pages loaded on 2026-09-28; the previous notification error did not recur in this smoke check.
- [x] [human-reported 2026-09-28] Released migration lock for `20260928_S4_ThreePortalFeatures`.

### REMAINING WORK AFTER PR #49 — WHOLE PROJECT, deadline 2026-10-06 (supersedes the old FUTURE list)

**Scope: we complete the entire project — every component (S1–S4), backend, web, Flutter, agents, docs — not only S4's part.** See DECISIONS 2026-09-28b. `[Sx]` tags below mark the *component* (for report attribution), not who must implement it. Each phase: take the migration lock for schema changes, TDD first, PR into `develop`, and tell the component owner what changed.

#### Phase 1 — Stabilise and baseline (29 Sep)
- [x] Render live revision `a6b64af` (PR #54) matches `develop` head (2026-09-28). Found and fixed hosted Swagger 500 (duplicate `FamilyDashboardDto` schemaId) — PR `feature/phase-1-baseline`.
- [x] Baseline recorded in `docs/university/BASELINE_TESTS_2026-09-28.md`: unit 91/91, integration 11/11, web 42/42, Flutter 69/69.
- [x] APK published as GitHub pre-release https://github.com/sahansbandara/Family-Veda-SEF-Project/releases/tag/apk-2026-09-28 with SHA-256 and install steps.

#### Phase 1b — Synthetic test data (29–30 Sep) · RULE 7: synthetic only, `example.invalid` emails
- [x] 2026-09-28: Three dashboards were rebuilt to match the mockups, using live API data. `DemoDataSeeder` adds 4 families, 5 doctors, appointments, labs, vitals and triage cases (see `docs/DEMO_DATA.md`). Backend unit tests 95/95; web tests 43/43, lint and build pass.
- [x] Doctor `/approvals` and `/cases` now route to the live `ApprovalsPage` and `CasesPage` (PR #53). The dead `handleDecision` mock remains in the unused `DoctorPortal` approvals tab; delete it during clean-up.
- [ ] Portal navigation labels still differ from the blueprint menus (e.g. "AI triage", "Family screening"). Align them in `AppLayout`.
- [x] Extend `DatabaseInitializer` seed (still gated by `Seed:Enabled`), via new `Phase1bSeeder` (`backend/src/Infrastructure/Persistence/Seed/*.cs`, additive, idempotent): 3 families (Alpha/Beta/Gamma); Head + 2 adults + 2 minors each; Beta's second adult has a pending join request into the Alpha family (join / cross-family flow).
- [x] Doctors: 3 verified (different districts: Jaffna, Badulla, Matara; different languages), 1 pending, 1 suspended — for directory, discovery and verification tests. Saturday-specific availability **not seeded** — no `DoctorAvailability` entity exists yet (Phase 4); noted in `docs/TESTING.md`.
- [x] Records per member: conditions, vitals series (7 monthly points ≈6 months), lab reports with values below/within/above range and one with no range. Private/shared adult report **not seeded** — `LabReport` has no visibility column yet (Phase 2); noted in `docs/TESTING.md`.
- [x] Family history: hereditary flags + consents in granted/revoked/not-set states (per-member split across the Alpha family).
- [x] Triage: one routine, one priority, one emergency (red-flag, `FailedSafe`) case; cases in each approval state (pending, approved, request-info, rejected, escalated).
- [x] Appointments in every status (Requested/Confirmed/Completed/Cancelled/NoShow); pending join request; pending doctor request; unread notifications. Pending head transfer **not seeded** — no `FamilyHeadTransfer` entity exists yet (Phase 3); noted in `docs/TESTING.md`.
- [x] Synthetic lab-report images (typed + handwritten-style) under `docs/evidence/synthetic-inputs/`, clearly labelled SYNTHETIC.
- [x] Documented all demo accounts (base + `DemoDataSeeder` + Phase 1b) in `docs/TESTING.md`; `scripts/reset-demo-db.sh` reseeds a clean local demo DB (refuses any non-localhost connection string).
- [x] Unit tests (`backend/tests/UnitTests/Phase1bSeedTests.cs`): idempotency, `@example.invalid` email domain, per-role/per-family counts, consent-state coverage, triage-approval-state coverage, appointment-status coverage. Unit 102/102, integration 11/11 passed locally.
- [ ] Every later phase adds its own seed rows for the feature it builds.

#### Phase 2 — Member profile + adult privacy (30 Sep–1 Oct) · needs migration lock
- [x] [S1+S4] `Member.SexForClinicalReference` (`ClinicalSex = NotSpecified|Male|Female`) on add-member (Head self-registration + add-minor), invite-accept and profile update; web forms added. Flutter has no onboarding/add-minor/invite forms, so it parses and carries the field only.
- [x] [S2+S4] Per-item family sharing on lab reports **and** health records (owner decision 2026-09-28): private by default; `PATCH /lab-reports/{id}/sharing`, `PATCH /records/{id}/sharing`, owning adult only. Separate from doctor consent.
- [x] [S4] Head reads only shared adult items (audited `ADULT_SHARED_REPORT_ACCESS`); vitals, flags, writes and extraction stay 404; dashboard counts only shared adult reports; activity unchanged. Negative integration tests in `AdultReportSharingTests`.
- [x] [S4] Report-library card (web `ReportLibraryCard`, Flutter `ReportLibraryCard`): owner, collected date, visibility, extraction state, original-file status, range-position counts.
- [ ] Human: apply migration `20260929_S4_MemberClinicalSexAndSharing` to Neon, then release the migration lock.
- [ ] Seed: add shared/private adult report rows to the Phase 1b seed now that the columns exist.

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
## Family Head portal — full build (2026-09-29)

Target: the Family Head mockup (`Family_Veda_Family_Head_Mockup.html`) + blueprint "FAMILY HEAD" section, delivered on **backend + web + Flutter**. Family heads are auto-approved (PR #73); only doctors wait for admin verification.
Order: FH-0 → FH-1 → FH-2 → FH-3 → FH-4 → FH-5 → FH-6. Each step: TDD, PR into `develop`, self-merge. Schema steps take the migration lock.

Nav (web + Flutter): `Dashboard | My Family | Health Records | Symptoms & Triage | My Doctor | Appointments | Privacy & Access` · top-right Notifications, Profile, Emergency Help.

### FH-0 — Baseline + cleanup (no schema)
- [x] Baseline 2026-09-29 on `develop` @ fec93e1: unit 150/150, integration 20/20, web 70/70, Flutter 78/78.
- [x] Web: family-head status page/redirect now only fires for Rejected/Suspended/More-info heads (backend returns Verified by default since PR #73).
- [x] Web `AppLayout`: head nav = the 7 blueprint items; adult nav = blueprint order (tested in `AppRouter.test.tsx`). Rename "AI triage" → "Symptoms & Triage", "Records" → "Health Records"; fold "Join requests" and "Family screening" into My Family / Health Records; "Audit" → Privacy & Access.
- [x] Web: persistent **Emergency Help** button (moved into `AppLayout`) (card/route, never `alert()`), 1990 referral — RULE 10.

### FH-1 — Dashboard (backend + web + Flutter)
- [x] Backend: check `DashboardController` head DTO covers the mockup: member count + minor count, next shared/minor appointment, open family-visible cases, pending join requests, Family Doctor summary, Needs Attention items, members overview (per-member shared-activity line), recent **shared-only** activity. Add missing fields.
- [x] (2026-09-29: adult card shows only a count of items the adult currently shares; head guidance count includes minors; "Lab report shared" activity only while still shared — `PortalDashboardMockupFieldsTests`.) No-leak test: a private adult's appointment / case / report never changes any head count or activity row.
- [x] Web (already matched the mockup): hero (greeting + Family Code + notification count), 4 metric tiles, My Family Doctor card, Needs Attention, Members overview, Quick Actions (Add Minor, Invite Adult, Upload Report, Report Symptoms, Book Appointment), Health Tools (Understand a Report, Search My Records, Check Symptoms), Recent Shared Activity. Loading / empty / error states.
- [x] Flutter `HeadDashboardSection` (hero, metrics, needs attention, doctor, members, quick actions, shared activity) on the home screen for heads.
- [ ] Flutter bottom nav (Dashboard · Family · Records · Triage · More) — deferred to FH-6 polish; home screen links cover every destination.

### FH-2 — My Family: Members · Join Requests · Invitations · Family Settings
- [x] Backend: `GET /families/{id}/invitations` (masked email, relationship, derived status) + `POST …/invitations/{id}/resend` (same email required; new token) + `POST …/invitations/{id}/cancel`.
- [x] Backend: join requests — `Expired` after 14 days (lazy), `FamilyCode` rate-limit policy (10 / 10 min / account), under-18 and already-in-a-shared-family rejected.
- [x] (FH-2b, DECISIONS 2026-09-29c: move to own household via `FamilyMembershipMover`; `POST /members/{id}/remove-from-family`, `POST /families/me/leave`; migration `20260929_S1_FamilyLifecycle`.) Backend: **Remove from Family** must not hard-delete. `FamilyService.DeleteMemberAsync` currently calls `Members.Remove` → change to end the membership (`EndedAt`/status), keep account + history, revoke doctor grants. Needs migration lock.
- [ ] Backend: rename family (`PUT /families/{id}`) — head-only verified (FamilyAccess); audit row still missing.
- [ ] Minor profile removal still hard-deletes (`FamilyService.DeleteMemberAsync`, minors only). Decide: keep, or archive the minor profile.
- [x] Web `FamilyPage`: 4 tabs (`?tab=` deep links), roster via new `GET /families/{id}/roster` (names + roles only), Remove from Family, Add Minor, invitations resend/cancel, Accept / Decline with masked email, rename + Family Code copy. `FamilyPage.test.tsx`.
- [ ] Flutter: Members screen gets Add Minor + Invite Adult forms (currently missing), Join Requests tab (exists — wire into tabs), Invitations list, Family Settings.

### FH-3 — Family Head transfer (schema · migration lock)
- [x] ~~`Family.HeadMemberId`~~ → `Member.Role == Head` is the source of truth (`FamilyAccess`, DECISIONS 2026-09-29b); `CreatedByUserId` kept as history.
- [x] `FamilyHeadTransfer` (`FamilyHeadTransferService`, `/families/{id}/head-transfers`, `/families/head-transfers/{id}/accept|decline|cancel`, `/incoming`): one pending per family, one SaveChanges swaps roles, audit + notifications.
- [x] Head cannot leave or be removed until transferred (FH-2b).
- [x] Web Family Settings "Transfer Family Head" + adult accept banner (session refreshed on accept). Flutter: see FH-2d.
- [x] Tests: `FamilyHeadTransferServiceTests` (4) + web `HeadTransfer.test.tsx` (3).

### FH-4 — Health Records for the Head (self + minors + shared adult)
- [ ] Backend already enforces sharing (Phase 2). Verify list filter: "All visible members / self / minor / shared adult reports".
- [ ] Web Records page: tabs Records · Vitals · Lab Reports · Health Insights; report card grid (`ReportLibraryCard`); Upload modal — member picker limited to **self + minors**, notice that adults upload their own.
- [ ] Report detail: progress Uploaded → Extracted → Manually Confirmed; deterministic range table; "does not diagnose" notice (RULES 1, 4).
- [ ] Flutter records screen: member filter + same card; upload restricted to self/minor.
- [ ] Seed: shared + private adult report rows (open item from Phase 2).

### FH-5 — My Doctor · Appointments · Symptoms & Triage
- [ ] My Doctor: current doctor card, "Manage Family Doctor → Request Change" (end old assignment, keep history — overlaps Phase 4). Head-only.
- [ ] Find a Doctor: free-text preferences → backend hard filters (verified, active, accepting, language, district, availability) → "Suggested based on location, availability and your preferences." Head chooses. Deterministic parse first; LLM parse only if time (Phase 5).
- [ ] Appointments: head books for self + minors only; table Member · Date · Doctor · Reason · Status; private adult rows never appear.
- [ ] Triage: head sees own + minors' cases only, 4 plain steps (already built) — verify minor submission path.
- [ ] Flutter parity for all three.

### FH-6 — Privacy & Access + hardening
- [ ] Backend `GET /families/me/privacy`: per-member sharing summary (minor = guardian managed; adult = N items shared / nothing shared) + recent access events for head-visible data only.
- [ ] Web + Flutter Privacy & Access page (Consent & Sharing, Recent Access).
- [ ] Authorization-negative tests for every new endpoint (adult, other-family head, doctor, anonymous).
- [ ] Seed rows for every new feature; update `docs/TESTING.md` demo walkthrough for the viva (head flow end-to-end).
- [ ] CI green; screenshots into `docs/evidence/` for the report.

### Owner decisions (2026-09-29)
- Join requests expire after **14 days**.
- Invitations + Head transfer: **web full**; Flutter read-only list + accept banner for the transfer target.
- Migration lock taken by owner for FH-2/FH-3 schema work.

## Three dashboards — mockup parity (2026-09-29)

Plan: `docs/Three_Dashboards_Plan.md` (DB linkage §3, disagreements §6). Mockups: `docs/mockups/{family-head,adult-member,doctor}.html`. Doctor spec: `docs/Doctor_Side_Spec.md`.
Overlaps FH-4..FH-6 above — tick both when done. Each phase: TDD, PR into `develop`, self-merge.

### Build order (DECISIONS 2026-09-29e): Stage 1 = UI shell for all 4 portals with real data or empty states (no sample numbers); Stage 2 = wire tab by tab.

### U — Clarity fixes first (see `docs/Three_Dashboards_UX_Plan.md`)
- [x] U0 (2026-09-29) `PageHero`, `SubTabs`, `Metric to=` link in `dashboardParts.tsx`; tab CSS in `portal-dashboard.css`. Page template: hero (title = nav label, one purpose sentence, one primary button), metric tiles as links, one badge vocabulary, sub-tabs, teaching empty states.
- [x] U1 (2026-09-29) Titles/wording: "AI triage" → "Symptoms & Triage"; "Audit activity" → Privacy summary; adult "My Family" → membership page (join is one option); remove agent/OCR/audit words from family screens (UX plan §7).
- [x] U1 Doctor nav (one Calendar; `/doctor-calendar` redirects): merge "Calendar" + "Appointments calendar" into one Calendar tab.
- [x] U1 Records: split single scroll into Records · Vitals · Lab Reports sub-tabs (Head + Adult share the component).
- [x] U1 Adult: add Privacy tab (`PrivacyPage`, also replaces the Head's raw audit table) (Family Sharing + Clinical Consent).
- [x] G1 + G2 fixed in `FamilyMembershipMover` (2026-09-29). Still open: G3 test that the old doctor gets 404 after a move; G4 confirm modal. Original item: Membership-move gaps (UX plan §10): G1 close an empty household (end its assignment, cancel its requests), G2 reset `SharedWithFamilyHead` on move, G3 test that the old doctor gets 404 after the move, G4 confirm modal before a solo Head joins another family.
- [ ] Per-page done check: title = nav label · purpose sentence · one primary button · loading/empty/error · test asserts title + button.

### P0 — Shared design system (29 Sep, no schema)
- [ ] Port mockup tokens (brand `#087b70`, bg, line, badge colours, radii, shadows) into `web/src/styles/tokens.css` + dark-mode variants.
- [ ] Shared primitives in `web/src/components/portal/`: PortalHero, MetricTile, Panel, StatusBadge, Tabs, Timeline, StepProgress, ReportCard, Modal, EmptyState.
- [ ] `AppLayout`: mockup top bar (logo, portal name, user, role badge) + sticky pill nav per role; Emergency Help stays a card/route (RULE 10).
- [ ] Flutter theme seeded from the same tokens.

### Section A — Family Head (30 Sep)
Nav: `Dashboard | My Family | Health Records | Symptoms & Triage | My Doctor | Appointments | Privacy & Access`
- [ ] A1 Dashboard: re-skin with primitives — hero (greeting, Family Code, bell count), 4 metrics, Family Doctor card, Needs Attention, Members grid, Quick Actions, Health Tools, Recent Shared Activity. Badge "Family Head", not "HEAD VERIFIED".
- [ ] A2 My Family: 4 tabs already built — re-skin only; add audit row for rename.
- [ ] A3 Health Records (= FH-4): tabs Records · Vitals · Lab Reports · Health Insights; member filter (all visible / self / minor / shared adult); upload modal self + minors only; report modal with deterministic range table and "does not diagnose" notice — **no AI Explanation shown to the family** (RULE 2).
- [ ] A4 Symptoms & Triage: 4-step progress for own + minors; verify minor submission path.
- [ ] A5 My Doctor (= FH-5): current doctor card, Request Change (end old assignment, keep history), Find a Doctor with deterministic filters + "Suggested based on location, availability and your preferences."
- [x] A6 (free-slot picker live; falls back to free time entry until the doctor sets hours) Appointments: table Member · Date · Doctor · Reason · Status; book for self + minors only; free-slot picker (needs P3).
- [x] A7 web (2026-09-29, `PrivacyPage` head mode, uses existing endpoints; no new `/families/me/privacy` needed yet) Privacy & Access (= FH-6): `GET /families/me/privacy` — per-member sharing summary + recent access (head-visible only).
- [ ] A-test: no-leak test adding a private adult appointment + case; still zero change to head counts.

### Section B — Adult Member (30 Sep–1 Oct)
Nav: `Dashboard | My Health | Appointments | Symptoms & Triage | My Family | My Doctor | Privacy`
- [ ] B1 Dashboard: hero, 4 metrics (Next appointment, My cases, New guidance, Private reports), Family Doctor card, Quick Actions (Upload, Report Symptoms, Add Vital, Ask My Records, Book), Recent Health, "Who can see my data?". No family-management actions.
- [ ] B2 My Health: tabs Records · Vitals · Lab Reports · Timeline; upload modal with **Keep Private (default) / Share with Family Head** radio; report modal with range table.
- [ ] B3 Ask My Records: deterministic structured search (member=self, type, date range, analyte). LLM parsing only in P5 if time.
- [ ] B4 Appointments: own only; "Private appointment" label; book own.
- [ ] B5 Symptoms & Triage: 4-step progress; "not visible to Family Head" note.
- [x] B6 (2026-09-29, `MyFamilyPage` with confirm step) My Family: membership card + Start My Own Family / Leave Family / Join by code (backend exists, FH-2b) — re-skin and wire.
- [x] B7 (hero + role-specific wording) My Doctor: read-only doctor card + Book My Appointment; "only the Family Head can change the doctor".
- [x] B8 (2026-09-29, `PrivacyPage` adult mode) Privacy: Family Sharing list with per-item toggle (`PATCH …/sharing`) + Clinical Consent card for current doctor (existing consent API). New route `/privacy` for MEMBER.
- [ ] B9 Seed: shared + private adult report rows (open since Phase 2).
- [ ] B-cut (future work): Explain lab values to patient, image observations, handwritten reader — hidden, listed in report.

### Section D — Admin (see UX plan §11)
- [x] D-A Removed fake fallback numbers and hard-coded charts; new `AdminDashboardPanel` (2026-09-29).
- [~] D-B Real counts from existing `/admin/doctors`, `/admin/users`, `/audit` (first 100 rows, labelled). A dedicated `GET /admin/dashboard` aggregate is still open.
- [x] D-C Deactivate instead of hard delete: delete endpoints removed; web uses `toggle-status` (DECISIONS 2026-09-29d). Web 79/79 tests, lint and build pass; backend is verified by CI.
- [~] D-D Dashboard tab extracted (545 lines removed). Verification/Users/Settings tabs still live in `ClinicAdminPortal.tsx`.
- [ ] D-E Safety & System page.
- [ ] D-F Negative test: admin cannot read member health data.

### P3 — Doctor schema, one migration (1 Oct) · MIGRATION LOCK
- [x] (2026-09-29, generated as `20260929093045_20260929_S4_DoctorWorkspace`, additive only; `ClinicalNote` done, `PreVisitBrief` deferred to P5) `20261001_S4_DoctorWorkspace`: `DoctorAvailability`, `DoctorUnavailablePeriod`, `ClinicalNote` (append-only, `AmendsNoteId`, `Version`), `PreVisitBrief`; `Doctor` + ConsultationModes, AcceptingNewFamilies, FamilyCapacity, SlotMinutes; `Appointment.RescheduledFromStartsAt`.
- [x] Visit grant (sibling `VisitAccessGrant` table; window 24 h before to 24 h after, approved in DECISIONS 2026-09-29h): a confirmed appointment issues a time-bound grant for that member (generalise `CaseAccessGrant` with `AppointmentId`). **Owner decision needed** on the window (proposed: 24 h before to 24 h after).
- [ ] **[human]** Apply `20260929_S4_DoctorWorkspace` to Neon (take the migration lock); keep `Database__MigrateOnStartup=false`. Apply to Neon same day, record migration history, release lock.

### Section C — Doctor (1–3 Oct)
Nav: `Dashboard | Calendar | My Families | Triage Cases | Approvals | Profile & Availability`
- [x] C0 (in `DoctorWorkspaceService`; 404 without an assignment, restricted view without a grant) `DoctorAccessGuard` in new `DoctorWorkspaceService`: role → verified/active → active assignment (eligibility only) → **valid case/visit grant scoped to the member** → consent category → audit (DECISIONS 2026-09-28). Assignment alone = roster names, appointments, own notes; no clinical data. Every doctor endpoint uses it. Do not loosen `FamiliesController`/`RecordsController`.
- [ ] C1 Dashboard: hero, 4 metrics (Today, Pending approvals, Open cases, Family requests), Today's Schedule, Needs Attention, My Families table, Clinical Timeline (UNION query, not a table).
- [x] C2 (Today / 7 days / All; reschedule with family notification; block time on the Profile page) Calendar: Today + Week views; confirm / reschedule / complete / cancel / no-show; Block Time → `DoctorUnavailablePeriod`. Reschedule notifies the family.
- [x] C3 (web, 2026-09-29, `DoctorFamiliesPage`: tabs via `?tab=requests`, search, sort, accept/decline, one-person family = "Individual patient"). Pagination still open. My Families: tabs Assigned · Requests; search / sort / pagination; accept/decline (existing API). `GET /doctors/me/families`.
- [x] C4 (`/families/:id`, `/members/:id`; Triage tab not built, cases stay in Triage Cases) Family detail → Member workspace tabs Overview · Records · Labs · Vitals · Triage · Visits · Notes, all via `/doctors/me/members/{id}/…`; "Clinical details restricted" card when consent missing (don't reveal counts).
- [x] C5 Clinical notes: create / amend / list; no delete endpoint; audited.
- [x] C6 Profile & Availability: practice fields + weekly availability editor + slot minutes; availability drives the family free-slot picker (`GET /doctors/{id}/slots?date=`).
- [x] C7 `DoctorPortal.tsx` deleted (approved, DECISIONS 2026-09-29h). Split `DoctorPortal.tsx` (1,119 lines) into per-page files; delete dead `handleDecision` mock.
- [x] C-test (`DoctorWorkspaceServiceTests`, 14) negative tests — other doctor, ended assignment, revoked consent, expired grant, unverified/suspended doctor → 403/404; overlap + availability tests.

- [ ] Seed: weekly hours for the 3 verified synthetic doctors (Phase1bSeeder) so the demo shows free slots.

### P5 — Controlled AI minimum (3–4 Oct)
- [ ] Pre-Visit Brief: deterministic "since last visit" (labs, vitals, cases, approvals, pending items) from allow-listed reads; optional LLM phrasing with schema validation; doctor-only; label "AI-generated context only. Clinical interpretation remains with the doctor."; audited.
- [ ] Doctor Discovery (Head): deterministic keyword parse → backend hard filters. LLM parse only if time.
- [ ] Cut order if late: LLM brief phrasing → LLM discovery parse → Ask Records LLM.

### P6 — Flutter parity + hardening (4–5 Oct)
- [ ] Flutter: head + adult dashboards re-skinned, adult upload privacy radio, appointments free-slot picker. Doctor stays web-only (desktop density).
- [ ] E2E golden flows from the blueprint (household, join, Family Doctor, private appointment, private lab, triage, emergency).
- [ ] Screenshots of all three portals next to the mockups into `docs/evidence/`.

## Auth redesign — completed 2026-09-28

- [x] Premium AuthPage redesign (split-panel, hero images, role cards, password toggle, Remember Me)
- [x] DoctorRegisterPage 3-step stepper
- [x] AuthShell, AuthHero, AuthStepper, AuthRoleSelector, PasswordField components
- [x] auth-shell.css scoped stylesheet
- [x] AppRouter wired /register/doctor to DoctorRegisterPage
- [x] All tests updated and passing (60/60)
- [ ] PR feat/auth-redesign-s4 → develop [human to merge]
