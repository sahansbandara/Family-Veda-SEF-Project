# Three Dashboards Plan — Family Head · Adult Member · Doctor

**Date:** 2026-09-29 · **Deadline:** 2026-10-06 (7 days) · **Status:** plan, not yet implemented
**Visual targets:** `docs/mockups/family-head.html`, `docs/mockups/adult-member.html`, `docs/mockups/doctor.html`
**Functional sources:** `docs/Three_Portal_Implementation_Blueprint.md`, `docs/Doctor_Side_Spec.md`
**Page-by-page UX:** `docs/Three_Dashboards_UX_Plan.md`
**Tracking:** `agent/TODO.md` → "Three dashboards — mockup parity (2026-09-29)" (sections A, B, C)

> Blueprint (`docs/Three_Portal_Implementation_Blueprint.md`) and the six invariants / ten clinical safety rules in `CLAUDE.md` win over any mockup.

---

## 1. Hard truth first

1. **Most of the database already exists.** Families, members, join requests, head transfer, doctor requests/assignments, appointments, notifications, report sharing — all shipped (migrations up to `20260929_S1_FamilyLifecycle`). The real gap is **UI parity + the doctor workspace**, not the schema.
2. **The doctor side is the weakest portal.** `DoctorPortal.tsx` is a 1,119-line tab component; Families/Profile tabs only half-use the API. There is no availability, no clinical note, no member workspace, no reschedule. This is where the time must go.
3. **7 days is not enough for every mockup button.** Anything that is AI-heavy and not already built (image observations, handwriting reader, report comparison, AI "explain my labs" straight to the patient) is cut to future work. See §6.
4. **The three mockups share one CSS file almost byte-for-byte.** "Looks the same as the mockup" is mostly one task: port those tokens/components once into `web/src/styles/` and reuse them in all three portals. Doing it per-page would triple the work and drift.

---

## 2. What already exists vs what is missing

| Area | Exists (verified 2026-09-29) | Missing |
|---|---|---|
| Family Code, join requests, invitations, head transfer, leave/remove | ✅ backend + web (FH-2, FH-3) | Flutter forms (FH-2d) |
| Report/record sharing with Head | ✅ `LabReport.SharedWithFamilyHead`, `HealthRecord.SharedWithFamilyHead` | Seed rows; adult Privacy page to toggle |
| Family Doctor request/accept, assignment history | ✅ `FamilyDoctorRequest`, `FamilyDoctorAssignment` | Change doctor; doctor discovery by preference |
| Appointments | ✅ book / cancel / confirm / complete / no-show, overlap check | Doctor availability, free-slot picker, reschedule, reminder |
| Doctor profile | Specialty, clinic, phone, district, city, languages | ConsultationModes, AcceptingNewFamilies, FamilyCapacity, SlotMinutes |
| Doctor workspace | Cases, Approvals (live), dashboard panel | My Families list/detail, member workspace tabs, notes, pre-visit brief |
| Notifications | ✅ `PortalNotification` + bell | Reschedule / reminder event types |
| Dashboards | ✅ head + adult + doctor panels with live data | Pixel/structure parity with mockups; doctor "Clinical Timeline" |

---

## 3. How the three portals connect in the database

One PostgreSQL database, one API (invariants 1–2). The three dashboards are **three filtered views over the same tables**; nothing is duplicated per portal.

```text
UserAccount ──1:1── UserProfile
    │
    ├──1:N── Member ──N:1── Family ─────────────┐
    │          │  Role = Head | Adult | Minor    │
    │          │  (Head is the source of truth,  │
    │          │   DECISIONS 2026-09-29b)        │
    │          │                                 │
    │          ├── HealthRecord  (SharedWithFamilyHead)
    │          ├── LabReport ─ LabValue / LabReportFile (SharedWithFamilyHead)
    │          ├── Vital, HereditaryFlag
    │          ├── Consent  (per member, per category, per grantee)
    │          ├── TriageCase ─ Episode ─ AgentTrace ─ Approval
    │          └── Appointment ──N:1── Doctor
    │                                         │
    │   Family ──1:N── FamilyDoctorRequest ───┤
    │   Family ──1:N── FamilyDoctorAssignment ┤ (history kept, one active primary)
    │   Family ──1:N── FamilyJoinRequest / FamilyInvitation / FamilyHeadTransfer
    │                                         │
    └──1:1── Doctor ──1:N── DoctorAvailability        (NEW)
                    ├──1:N── DoctorUnavailablePeriod  (NEW)
                    ├──1:N── ClinicalNote ─ Member?/Family/Appointment? (NEW)
                    ├──1:N── PreVisitBrief ─ Appointment (NEW, doctor-only)
                    └──1:N── CaseAccessGrant ─ TriageCase

Cross-cutting: PortalNotification (per user) · AuditLog (every cross-profile read, RULE 8)
```

### 3.1 The joins each dashboard is built from

| Dashboard tile | Query path | Privacy filter (server-side) |
|---|---|---|
| Head · Members | `Family → Member` | names + roles only for adults |
| Head · Next shared appointment | `Appointment where Member.FamilyId = f` | **only Head's own + Minors'** — adult appointments never counted |
| Head · Open family-visible cases | `TriageCase` | own + minors only |
| Head · Recent Shared Activity | `AuditLog` | own, minors, and adult items **currently** `SharedWithFamilyHead` |
| Adult · Next appointment / cases / guidance | `Appointment`, `TriageCase`, `Approval` | `Member.UserId = me` only |
| Adult · Who can see my data | count `SharedWithFamilyHead` true/false + `Consent` for active doctor | own rows only |
| Doctor · Today / Calendar | `Appointment where DoctorId = me` | verified doctor only |
| Doctor · My Families | `FamilyDoctorAssignment where DoctorId = me AND EndedAt IS NULL` | + pending `FamilyDoctorRequest` |
| Doctor · Member workspace | `Member` → records/labs/vitals | **Chain (DECISIONS 2026-09-28)**: role → verified → active assignment (**eligibility only**) → **valid, unexpired `CaseAccessGrant` scoped to this member** → `Consent` granted for that category → audit row. An assignment alone shows only non-clinical data: family roster names, appointments, and the doctor's own notes. |
| Doctor · Clinical Timeline | UNION view over appointments, lab uploads, approvals, notes | clinical rows only under a valid grant + consent; computed, **not** a new table |

### 3.2 Key design decisions (my recommendation)

1. **Two independent permissions, never one flag.** `SharedWithFamilyHead` (family sharing) and `Consent` (doctor clinical access) stay separate columns/tables. An adult can hide a report from the Head while the doctor still sees it, and vice-versa. Already the case — keep it.
2. **Appointment privacy is derived, not stored.** An adult's appointment is private from the Head because `Member.Role = Adult`. Do **not** add a visibility column — it creates a second source of truth that can drift.
3. **Timeline is a query, not a table.** Duplicating events into a timeline table means two writes per event and a consistency bug waiting to happen.
4. **One migration for all doctor-side schema** (`20261001_S4_DoctorWorkspace`): availability, unavailable periods, clinical notes, pre-visit briefs, new doctor profile columns, `Appointment.RescheduledFromStartsAt`. One lock, one Neon apply, not four.
5. **Assignment ≠ access.** A Family Doctor assignment makes a doctor *eligible*; every clinical read needs a time-bound grant + consent (DECISIONS 2026-09-28). **Open owner decision:** today grants only come from triage cases. For appointments, a confirmed visit should issue a time-bound grant for that member (e.g. from 24 h before the visit until 24 h after it). That means generalising `CaseAccessGrant` (nullable `TriageCaseId`, plus `AppointmentId`) or adding a sibling grant table. It needs a migration, so it goes into P3.
6. **Doctor access is enforced in a new `DoctorWorkspaceService`**, not by loosening S1's `FamiliesController` or S2's `RecordsController` (Doctor spec §19).
7. **ClinicalNote is append-only**: amend = new row with `AmendsNoteId`, `Version+1`. No delete endpoint exists at all.

### 3.3 New tables (only these)

| Table | Columns | Constraints |
|---|---|---|
| `doctor_availability` | Id, DoctorId, DayOfWeek, StartTime, EndTime, IsActive | End > Start; no overlap per doctor+day (checked in service) |
| `doctor_unavailable_periods` | Id, DoctorId, StartAt, EndAt, Reason? | End > Start |
| `clinical_notes` | Id, DoctorId, FamilyId, MemberId?, AppointmentId?, NoteType, Content(≤4000), Version, AmendsNoteId?, CreatedAt | FK; index (FamilyId, MemberId) |
| `pre_visit_briefs` | Id, AppointmentId, DoctorId, SummaryJson, Source (Deterministic/LLM), ValidationPassed, CreatedAt | unique AppointmentId (latest wins via regenerate) |
| `doctors` (+cols) | ConsultationModes, AcceptingNewFamilies (default true), FamilyCapacity?, SlotMinutes (default 30) | SlotMinutes ∈ {15,20,30,45,60} |
| `appointments` (+col) | RescheduledFromStartsAt? | — |

---

## 4. Shared look-and-feel (do this first — Phase 0)

All three mockups use identical tokens (`--brand:#087b70`, `--bg:#f4f7f7`, cards with 16–22px radius, hero gradient, pill badges, top bar + sticky pill nav).

- Port the mockup tokens into `web/src/styles/tokens.css` (dark-mode variants too) and the shared components (`hero`, `metric`, `panel`, `item`, `badge ok|warn|danger|info`, `tabs`, `timeline`, `progress/step`, `modal`, `report card`) into `web/src/styles/portal-dashboard.css`.
- Build React primitives once in `web/src/components/portal/`: `PortalHero`, `MetricTile`, `Panel`, `StatusBadge`, `Tabs`, `Timeline`, `StepProgress`, `ReportCard`, `Modal`, `EmptyState`.
- `AppLayout`: top bar (logo, portal name, user, role badge) + horizontal pill nav — exactly the mockups' nav per role.
- Flutter: mirror the tokens in the theme (`ColorScheme` seed `#087B70`) so the APK looks like the same product.

**Red only for safety/urgent** (blueprint UI rules). Every page: loading · empty · error · forbidden states.

---

## 5. Phases

| Day | Phase | Output |
|---|---|---|
| 29 Sep | **P0** Shared design system + nav | tokens, primitives, AppLayout per role |
| 30 Sep | **P1** Section A — Family Head parity | 7 pages match mockup |
| 30 Sep–1 Oct | **P2** Section B — Adult Member parity | 7 pages match mockup |
| 1 Oct | **P3** Doctor schema (one migration, lock) | tables in §3.3 |
| 1–3 Oct | **P4** Section C — Doctor workspace | 6 pages + member workspace |
| 3–4 Oct | **P5** Controlled AI minimum | Pre-Visit Brief, Doctor Discovery (deterministic first) |
| 4–5 Oct | **P6** Flutter parity + hardening | auth-negative tests, E2E, screenshots |
| 6 Oct | **P7** Submit | freeze, tag |

Details and checkboxes live in `agent/TODO.md`.

---

## 6. Where I disagree with the mockups / spec (and what to do instead)

| Mockup / spec item | Problem | Do instead |
|---|---|---|
| Adult & Head report modal: "AI Explanation" step shown straight to the patient | Breaks **RULE 2** (no AI output reaches a patient without doctor approval) | Show deterministic range status only (RULE 4). AI explanation becomes a draft that goes into the approval queue; patient sees it only after approval. |
| "Explain confirmed lab values", "Describe medical image", "Read handwritten document" tools (adult) | Three new AI pipelines in 7 days; image/handwriting risks RULES 1 and 6 (drug names) | Cut to future work. Keep the tiles hidden or labelled "Coming later". |
| "Ask My Health Records" | LLM free text over records = injection + leak risk | Deterministic structured search first (member, type, date range, analyte). LLM parsing only if time remains, and only via allow-listed tools (invariant 5). |
| Family Head badge "HEAD VERIFIED" | Heads are auto-approved (PR #73); badge implies a check that does not happen | Show "Family Head" role badge. |
| Doctor mockup has a top-level "Member View" nav item | Member pages need a family/member context; a top-level link has none | Reach the member workspace from My Families → family → member (blueprint nav). |
| Doctor spec: Today / Week / **Month** calendar, "Online" consultation | Month view + video is scope creep | Today + Week only; "Online" is a label, no video. |
| Doctor spec: 5 metric tiles | Mockup has 4 and looks cleaner | 4 tiles (Today, Approvals, Open cases, Family requests); assigned-family count goes in the My Families panel header. |
| Doctor spec: many required registration fields | Registration already has a 3-step stepper; more required fields = more drop-off | Keep registration as is; new practice fields are edited on Profile & Availability after verification. |
| AI Pre-Visit Brief via LLM | LLM not needed for "since last visit: 1 lab, 3 vitals, 1 case" | Build it **deterministically** (counts + dates from allow-listed reads). Optional LLM phrasing afterwards, schema-validated, labelled "AI-generated context only". Much safer for viva. |
| Mockups use `alert()` for Emergency Help | RULE 10 needs a real referral surface | Existing referral card/route (1990) stays. |

---

## 7. Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Doctor workspace leaks data (IDOR) | Medium | Single `DoctorAccessGuard` used by every doctor endpoint; negative tests: other doctor, ended assignment, revoked consent, expired grant |
| Migration collision | Medium | One combined migration P3; announce lock; apply to Neon same day |
| `DoctorPortal.tsx` refactor breaks existing tests | High | Split into per-page files behind the same routes; keep test IDs |
| Private adult data leaks through Head counts | Low (tested) | Re-run `PortalDashboardMockupFieldsTests` + add adult-appointment case |
| Time overrun | High | P5 AI items are optional; cut order: Doctor Discovery → LLM brief phrasing → Ask Records |

---

## 8. Summary

| Item | Decision |
|---|---|
| Visual parity | One shared token + component set, reused by all 3 portals |
| DB linkage | Same tables, three server-side filtered views; no per-portal copies |
| New tables | 4 (availability, unavailable periods, clinical notes, pre-visit briefs) + doctor/appointment columns, **one** migration |
| Privacy | Family sharing ≠ doctor consent; adult appointment privacy derived from role |
| AI | Pre-Visit Brief deterministic-first; patient-facing AI only through approval gate; image/handwriting cut |
| Order | P0 design → A Head → B Adult → P3 schema → C Doctor → AI → hardening → submit |
