# Demo accounts — synthetic test data

RULE 7: every account and record below is synthetic. Emails use the reserved `example.invalid`
domain; names are invented. No real patient data exists in this project under any circumstances.

Every account uses the same shared demo password: the value of `Seed__DefaultPassword`
(12+ characters, never committed — see `docs/DEMO_DATA.md` and `scripts/reset-demo-db.sh`). Seeding
runs at API start-up only when `Seed__Enabled=true`, and is idempotent (safe to run more than once).

Seeding happens in three layers, all inside `DatabaseInitializer.InitializeAsync`:

1. **Base seed** (`DatabaseInitializer`) — the original Perera family and the first five accounts.
2. **`DemoDataSeeder`** — the three-portal dashboard demo data (see `docs/DEMO_DATA.md` for its own
   account table).
3. **`Phase1bSeeder`** (`backend/src/Infrastructure/Persistence/Seed/*.cs`) — additional synthetic
   families, doctors, records and workflow states for Phase 1b test coverage. This is the table below.

## Phase 1b accounts

### Families — Alpha, Beta, Gamma (Head + 2 adults + 2 minors each)

| Email | Role | Family | Demonstrates |
|---|---|---|---|
| `phase1b-alpha-head@example.invalid` | Family Head | Phase1b Alpha Family (`FV-P1BALP`) | Head dashboard; granted consents; hereditary flag; a pending, doctor-assigned triage case |
| `phase1b-alpha-adult1@example.invalid` | Adult Member | Phase1b Alpha Family | Revoked consents; a rejected triage case with doctor notes |
| `phase1b-alpha-adult2@example.invalid` | Adult Member | Phase1b Alpha Family | Not-set consents; a pending routine triage case |
| Alpha Minor One / Alpha Minor Two | Minor Member | Phase1b Alpha Family | Guardian relationships; no linked account (minors are guardian-managed) |
| `phase1b-beta-head@example.invalid` | Family Head | Phase1b Beta Family (`FV-P1BBET`) | An approved triage case with final advisory; a pending family-doctor request |
| `phase1b-beta-adult1@example.invalid` | Adult Member | Phase1b Beta Family | A priority-priority triage case pending review; a cancelled appointment |
| `phase1b-beta-adult2@example.invalid` | Adult Member | Phase1b Beta Family | A pending join request into the Alpha family (join-by-code / cross-family flow); an escalated triage case |
| Beta Minor One / Beta Minor Two | Minor Member | Phase1b Beta Family | Guardian relationships |
| `phase1b-gamma-head@example.invalid` | Family Head | Phase1b Gamma Family (`FV-P1BGAM`) | A "request more information" triage decision; a no-show appointment; a lab value with no reference range |
| `phase1b-gamma-adult1@example.invalid` | Adult Member | Phase1b Gamma Family | An **emergency, red-flag** triage case (`FailedSafe` / `EMERGENCY_RED_FLAG_REFERRAL`) — RULE 10 referral path |
| `phase1b-gamma-adult2@example.invalid` | Adult Member | Phase1b Gamma Family | Second adult for join/consent variety |
| Gamma Minor One / Gamma Minor Two | Minor Member | Phase1b Gamma Family | Guardian relationships |

### Doctors

| Email | Verification | Demonstrates |
|---|---|---|
| `phase1b-doctor-jaffna@example.invalid` | Verified | Jaffna district, Tamil/English — directory language/district filtering; primary doctor for Gamma family |
| `phase1b-doctor-badulla@example.invalid` | Verified | Badulla district, Sinhala/English — pending family-doctor request from Beta |
| `phase1b-doctor-matara@example.invalid` | Verified | Matara district, Sinhala/Tamil/English — directory breadth |
| `phase1b-doctor-pending@example.invalid` | Pending | Verification queue |
| `phase1b-doctor-suspended@example.invalid` | Suspended | Must never appear in the directory or receive case access |

Saturday-specific availability is **not seeded**: `DoctorAvailability` does not exist yet (Phase 4,
`agent/TODO.md`). Noted as a gap rather than modelled with a non-existent column.

### Data coverage per feature

| Feature | Seeded rows |
|---|---|
| Conditions | One per family head and adult-one (`HealthRecord`, `RecordType.Condition`) |
| Vitals | 7 monthly points (6 months back to now) per family head and adult-one |
| Lab reports | Below range (Alpha head, Hemoglobin), within range (Alpha adult-one, Fasting glucose), above range (Beta head, Total cholesterol), no reference range (Gamma head, "Synthetic novel marker") |
| Family history | Hereditary flags on Alpha head and Gamma head, tied to a `HealthRecord` |
| Consents | Granted (family heads), Revoked (adult-one in each family), Not-set (adult-two and both minors) |
| Triage priority | Routine, Priority and Emergency (red-flag) cases |
| Triage approval states | Pending review, Approved (with final advisory), Request-information, Rejected, Escalated — one `TriageCase` + `CaseAccessGrant` each, with an `Approval` row where a decision exists |
| Appointments | One each of Requested, Confirmed, Completed, Cancelled, No-show |
| Join requests | `phase1b-beta-adult2@example.invalid` → pending join request into Alpha family |
| Family doctor requests | Beta family → pending request to `phase1b-doctor-badulla@example.invalid` |
| Notifications | Unread `PortalNotification` rows for join requests, doctor requests, escalation and rejection |

**Not seeded — no matching column/entity exists yet** (per the Phase 1b task instructions: skip and
list, don't add schema):

- Per-report "private vs. shared with Family Head" visibility — `LabReport` has no sharing/visibility
  column (Phase 2, `agent/TODO.md`).
- Pending family-head transfer — no `FamilyHeadTransfer` entity yet (Phase 3).
- Doctor Saturday-specific availability — no `DoctorAvailability`/`DoctorUnavailablePeriod` entity yet
  (Phase 4).

### Synthetic lab-report images

`docs/evidence/synthetic-inputs/phase1b-typed-lab-report.png` and
`phase1b-handwritten-lab-report.png` — generated with Python + Pillow
(`backend`-independent script, not committed; regenerate with any PNG-writing tool). Both images are
clearly labelled "SYNTHETIC — TEST DATA ONLY" and contain only the synthetic values from the table
above — no real lab values, drug names or diagnoses.

## Resetting the local demo database

```bash
scripts/reset-demo-db.sh [path-to-local-.env]
```

Refuses to run unless `ConnectionStrings__DefaultConnection` resolves to `localhost`, `127.0.0.1` or
`::1` — it never touches the hosted Neon/Render database. See the script for the exact environment
variables it reads (`Seed__DefaultPassword` must already be set; it is never printed or committed).
