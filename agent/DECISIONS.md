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

## 2026-09-28 — Premium auth redesign: AuthShell component pattern + owner-authorized full implementation

**Decision:** Auth redesign delivered as new S4-created components (`AuthShell`, `AuthHero`, `AuthStepper`, `AuthRoleSelector`, `PasswordField`, `auth-shell.css`) plus full rewrites of `AuthPage.tsx`, `AuthPage.test.tsx`, `AppRouter.tsx`, `AppRouter.test.tsx`. `index.css` updated to import `auth-shell.css`.

**Pattern chosen:** `auth-shell.css` as a standalone scoped stylesheet (not merged into S3's `components.css`) to keep auth styles clearly bounded and owned by S4. `AuthPage.tsx` adopts the new components inline — no compound `AuthShell` wrapper needed since `AuthPage` already handles mode state.

**Doctor registration:** separated into `DoctorRegisterPage` (3-step stepper, S4-owned). `AuthPage` register form shows role cards; selecting Doctor routes to `/register/doctor`. This keeps the inline register form compact (Family/Member only) and gives Doctor its dedicated stepped flow.

**Reason for touching S1/S3 files:** explicit repo owner (S4) instruction overriding the ownership boundary rule for this task. AGENTS.md conflict priority §1 (latest explicit user instruction) applied.

**Alternatives considered:** Keep AuthPage unchanged, only add DoctorRegisterPage (rejected — leaves login/register still showing demo text and old split-panel). Use compound AuthShell wrapper (rejected — adds indirection without benefit since AuthPage owns its own mode state).

**Consequences:** `AuthPage.tsx` and `AppRouter.tsx` now have S4-authored content. S1 must be aware of the changes to auth logic if they make future edits. Branch `feat/auth-redesign-s4` to be PRed into `develop`.

**Status:** Accepted and executed 2026-09-28 at Sahan's (repo owner) explicit instruction.
