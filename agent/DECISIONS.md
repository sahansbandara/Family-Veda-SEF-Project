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
