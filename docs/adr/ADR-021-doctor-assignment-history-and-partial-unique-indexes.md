# ADR-021 — Doctor Assignment History with Partial Unique Indexes

**Owner:** S4 · **Status:** Accepted · **Date:** 2026-09-28

> Written up on 2026-10-05 from the project decision log and the implemented code; the decision itself dates from the date above.

## Context

The original unique `(family_id, doctor_id)` index prevented a family from returning to a previous doctor. Service-level existence checks could race, leaving several active doctors or several pending requests for one family, and a stale pending request caused an HTTP 500 on acceptance.

## Options considered

| Option | Pros | Cons |
|---|---|---|
| **Non-unique history index plus partial unique indexes, with conditional status updates** (chosen) | The database enforces the invariant; separate assignment periods are kept | Rollback is unsafe once repeat periods exist |
| Reopen an ended assignment row | Fewer rows | Rejected in the log: erases separate assignment periods |
| Service-only existence checks | No migration | Rejected in the log: concurrent requests can pass both checks |
| Delete duplicate legacy rows in the migration | Cleaner data | Rejected in the log: loses audit history |

## Decision

Replace the pairwise unique index with a non-unique history index. Add a partial unique index allowing one active primary assignment per family (`is_primary = TRUE AND ended_at IS NULL`) and one for one pending family-doctor request per family (`status = 'Pending'`). Past assignment rows are kept. Accept and decline use conditional status updates inside transactions so simultaneous decisions record one outcome, and named PostgreSQL uniqueness conflicts map to HTTP 409.

## Consequences

**Makes easy:** return visits to a previous doctor; race-free enforcement of one active doctor.

**Cost:** the migration aborts on preexisting conflicts without cleaning data; once repeated periods exist, rollback to the old index is refused and recovery uses the Neon recovery branch and a reviewed roll-forward fix.

## Evidence

- `agent/DECISIONS.md` — "2026-09-28 — Preserve doctor assignment history and enforce one active decision".
- `backend/src/Infrastructure/Persistence/Migrations/20260928010813_20260928_S4_DoctorAssignmentConstraints.cs` (introduced 2026-09-28).
- `agent/MEMORY.md` — 2026-09-28 entries on the Neon recovery branch and applied migration.
