# ADR-020 — Pull-Request-to-develop-Only Integration Workflow

**Owner:** Group · **Status:** Accepted · **Date:** 2026-09-23

> Written up on 2026-10-05 from the project decision log and the implemented code; the decision itself dates from the date above.

## Context

A pull request from `feature/s3-agent-orchestration` was merged directly into `main`, so `main` was 14 commits ahead of `develop` with none of that work reviewed through the integration branch. Each member's grade depends on the individual pull-request evidence of their work.

## Options considered

| Option | Pros | Cons |
|---|---|---|
| **Revert the direct merge and enforce PR-to-`develop` only** (chosen) | Keeps history; restores review through `develop` | Needs branch protection to be physically enforced |
| Hard-reset `main` to `develop` | Clean history | Rejected in the log: rewrites shared history, harder to recover |
| Fast-forward `develop` to `main` | Quick | Rejected in the log: would retroactively bless the bypass |

## Decision

Revert the direct merge with `git revert -m 1` and push. All work integrates by pull request into `develop`; `main` is protected and receives no direct pushes. Branch protection on `main` (pull request plus one approving review, enforced for admins) was recorded as still needing to be enabled by a human in GitHub settings.

## Consequences

**Makes easy:** reviewed, attributable integration; consistent evidence per member.

**Cost:** until branch protection is enabled, direct merges to `main` remain technically possible. Later entries record that the agent opens and merges its own pull requests into `develop` (2026-09-28c).

## Evidence

- `agent/DECISIONS.md` — "2026-09-23 — Reverted direct merge to `main`; enforce PR-to-`develop`-only workflow".
- `agent/DECISIONS.md` — "2026-09-28c — Agent may open and merge PRs into `develop`".
- `CLAUDE.md` — "Branching".
