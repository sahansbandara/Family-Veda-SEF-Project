# ADR-016 — Deterministic Clinical Safety Validation Outside the LLM

**Owner:** S4 · **Status:** Accepted · **Date:** 2026-09-22

> Written up on 2026-10-05 from the project decision log and the implemented code; the decision itself dates from the date above.

## Context

Family Veda must never diagnose, prescribe or give dosing (safety rules 1 and 6), and must show a referral rather than AI output in an emergency (rule 10). Language-model output is non-deterministic and cannot be the authority for these checks. ADR-013 refers to these rules as ADR-007; the record of that earlier numbering is not recoverable.

## Options considered

| Option | Pros | Cons |
|---|---|---|
| **Deterministic rule tables and pattern checks in the Domain layer, plus an emergency gate before any LLM call** (chosen) | Repeatable, unit-testable, independent of provider availability | Rules must be maintained by hand |
| Ask a second LLM to judge safety | Flexible wording coverage | Contradicts rule 4 (checks are never LLM judgement); reason beyond that not recorded |

## Decision

Implement safety checks as plain C# in `backend/src/Domain/Safety`: `ClinicalRuleTables` and `SafetyValidationService`, which rejects diagnosis phrasing, drug and dosing patterns and other prohibited content. `TriageOrchestrator` evaluates red-flag conditions (severity 9 or above, listed red-flag symptoms, and a young child with persistent fever) first. On a match it sets the case to `Escalated` with `Emergency` priority, stores no draft advisory, and does not call any LLM. All agent output is validated before it can reach the doctor approval gate (ADR-013).

## Consequences

**Makes easy:** unit tests for each rule; an emergency path that works when every hosted provider is unavailable.

**Rules out:** relying on the model to police its own output.

**Cost:** rule tables and regular expressions need maintenance; `agent/DECISIONS.md` (2026-10-03) records a refinement that preserves lab concentration evidence so mg/dL values are not mistaken for doses.

## Evidence

- `backend/src/Domain/Safety/SafetyValidationService.cs` and `ClinicalRuleTables.cs` (introduced 2026-09-22).
- `backend/src/Infrastructure/Triage/TriageOrchestrator.cs` (introduced 2026-09-23): comment "fail closed to referral; no LLM is called".
- `docs/AI_FLOW.md` section 4, "Safety and failure handling" (emergency row, prohibited-content row).
- `CLAUDE.md` — "The ten clinical safety rules" (rules 1, 4, 6, 10).
- `agent/DECISIONS.md` — "2026-10-03 — Preserve lab concentration evidence in deterministic safety checks".
