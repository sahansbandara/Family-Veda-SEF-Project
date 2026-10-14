# ADR-018 — Mandatory Doctor Approval Gate with Time-Bound Case Grants

**Owner:** S4 · **Status:** Accepted · **Date:** 2026-09-22

> Written up on 2026-10-05 from the project decision log and the implemented code; the decision itself dates from the date above.

## Context

Invariant 6 and safety rules 2 and 3 require that no patient-visible output exists that has not passed a doctor, and that the gate is architectural with no bypass. A doctor must also only see the cases they are entitled to, for a limited time (access by grant, not by role).

## Options considered

| Option | Pros | Cons |
|---|---|---|
| **Approval endpoint that checks verified doctor and active grant, with guidance chosen from a fixed allow-list** (chosen) | No free-text clinical advice can be released; decisions are auditable | Doctors cannot author bespoke guidance |
| Free-text doctor revision | More expressive | Would let unvalidated clinical text reach patients; not compatible with rules 1 and 6 |

## Decision

A case is readable and decidable only by a verified doctor holding an active grant. `CaseGrantPolicy.HasAccess` is true only when the grant is not revoked and has not expired. "Approve" and "Revise and approve" select final guidance from a fixed backend allow-list, checked by `SafetyValidationService.IsApprovedPatientGuidance`. The patient endpoint returns only saved final guidance for `Approved` and `ApprovedRevised` cases, never the raw AI draft. Terminal decisions revoke active grants, and concurrent conflicting decisions return a conflict. On 2026-09-28 it was recorded that the assigned primary doctor approves through the grant the orchestrator creates, while the shared-pool `/claim` route stays for unassigned cases.

## Consequences

**Makes easy:** a single check point for patient visibility; an audited decision trail.

**Rules out:** a bypass path and arbitrary free-form advice.

**Cost:** the request-information decision keeps the case pending and its internal notes are not shown to the patient (documented limitation in `docs/AI_FLOW.md`).

## Evidence

- `backend/src/Domain/Access/CaseGrantPolicy.cs`, `backend/src/Infrastructure/Clinical/ClinicalService.cs` (both introduced 2026-09-22).
- `backend/src/Domain/Safety/SafetyValidationService.cs` — `IsApprovedPatientGuidance`.
- `docs/AI_FLOW.md` section 5, "Doctor approval and patient visibility".
- `agent/DECISIONS.md` — "2026-09-28 — Use assigned grant for primary-doctor review".
- `CLAUDE.md` — invariant 6; safety rules 2 and 3.
