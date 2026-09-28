# Decisions — Family Veda

What is already decided. Record at the moment of decision, including rejected alternatives.

## 2026-09-23 — Reverted direct merge to `main`; enforce PR-to-`develop`-only workflow

**Decision:** PR #3 (`feature/s3-agent-orchestration`) had been merged straight into `main`, bypassing `develop` — `main` was 14 commits ahead of `develop` with none of it reviewed through the integration branch. Reverted via `git revert -m 1 aa6c406` (keeps history, not a hard reset) and pushed; `main` now matches `develop` again. S3's branch still exists untouched and needs a normal PR into `develop`, same as the other three members.

**Reason:** all four members' work must integrate through `develop`; direct pushes to `main` skip review and destroy the individual PR evidence each member's grade depends on.

**Alternatives considered:** hard reset `main` to `develop` (rejected — rewrites shared history, harder to recover from if anyone already pulled `main`) · leave `main` as-is and just fast-forward `develop` to match it (rejected — would retroactively bless the bypass instead of fixing it).

**Consequences:** branch protection on `main` (require PR + 1 approving review, enforce for admins) still needs to be turned on by a human via GitHub Settings → Branches — until then, direct merges to `main` remain physically possible again.

**Status:** Accepted and executed 2026-09-23 at Sahan's request.

## Open decisions

| # | Question | Owner | Decide by |
|---|---|---|---|
| 1 | Turn on branch protection on `main` | Sahan (human) | ASAP |
| 2 | S3 to open PR of `feature/s3-agent-orchestration` into `develop` | S3 | Next session |

## 2026-09-28 — Three-portal blueprint: CORE vs FUTURE, and AI gating

**Decision:** every patient- or family-visible AI output passes the doctor approval gate, no exceptions; handwriting transcription and image observations are doctor-only; no AI on the emergency path; doctor reads require a case grant + consent (a Family Doctor assignment only confers eligibility). Only the CORE table in `docs/Three_Portal_Implementation_Blueprint.md` is in scope for 2026-09-30.

**Reason:** the draft conflicted with RULES 2, 3, 6, 8, 10; two days to deadline.

**Status:** Accepted 2026-09-28 at Sahan's request.

## 2026-09-28 — S4 implements the full three-portal scope across ownership boundaries

**Decision:** At Sahan's (S4, repo owner) explicit instruction, the S4 branch `feature/s4-three-portal-safety-review` implements the whole three-portal spec (`docs/Three_Portal_Feature_Spec.md`): Family Code, join requests, Family Doctor requests, appointments, in-app notifications, and the Family Head / Adult Member / Doctor dashboards, on backend, web and Flutter. Ownership checks are waived for this work; files owned by S1/S2/S3 are edited where needed.

**Reason:** the other members will not deliver these features before the 2026-09-30 deadline.

**Consequences:** these commits appear under S4's `git log --author`, not the file owners'. Individual reports must describe this honestly. Migration `20260928_S4_ThreePortalFeatures` — announce the migration lock in the group chat.

**Status:** Accepted 2026-09-28.

## 2026-09-28 — Preserve doctor assignment history and enforce one active decision

**Decision:** Replace the unique `(family_id, doctor_id)` assignment index with a non-unique history index plus a partial unique index for one active primary assignment per family. Add a partial unique index for one pending family-doctor request per family. Keep past assignment rows when a family returns to a previous doctor. Use conditional request-status updates inside transactions so simultaneous accept/decline decisions record one outcome; map named PostgreSQL uniqueness conflicts to HTTP 409.

**Reason:** the original pairwise index prevented return visits to a prior doctor, while service-level `AnyAsync` checks could race and leave multiple active doctors or pending requests. A previous pending request for the current doctor also produced an HTTP 500 on acceptance.

**Alternatives considered:** reusing and reopening an ended assignment row (rejected because it erases separate assignment periods); service-only existence checks (rejected because concurrent requests can pass both checks); deleting duplicate legacy rows during migration (rejected because it would lose audit history).

**Consequences:** the migration checks for preexisting conflicts and aborts without data cleanup. Once repeated doctor periods exist, rollback to the old pairwise index is refused; recovery uses the Neon branch backup and a reviewed roll-forward fix. The user reported the prior migration applied and its lock released before this migration was generated. Local PostgreSQL upgrade, concurrency, idempotency and unsafe-rollback checks passed; Neon application remains pending.

**Status:** Implemented locally on `codex/portal-e2e-fixes`; deployment pending.
