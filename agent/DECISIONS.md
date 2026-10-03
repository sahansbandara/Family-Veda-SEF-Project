# Decisions — Family Veda

## 2026-09-28 — Use the current CourseWeb due field and release the doctor constraints

**Decision:** Plan Assignment 1 submission for 6 October 2026 at 11:00 AM (Asia/Colombo), the authenticated CourseWeb submission item's due field. Use a Neon data-and-schema recovery branch before applying the reviewed doctor-constraint migration. Prioritize CORE features and submission evidence; treat the portal blueprint's FUTURE list as work after the submission package.

**Reason:** The course page's older announcement and the PDF still say 30 September, but the submission item now shows 6 October. Production migration history contained the first two migrations; conflict checks returned zero, and the SQL checksum matched the reviewed release file. The user approved the production release plan and the CORE-first scope.

**Alternatives considered:** Plan to the stale 30 September announcement (rejected because the current submission item has a later due field); skip the backup branch (rejected because the production migration changes uniqueness rules); build optional future features before evidence (rejected because the submission requires executed proof).

**Consequence:** The migration and its indexes are installed on Neon. The exact Render revision and doctor-account smoke test remain required before declaring the whole release verified. See `docs/university/RELEASE_EVIDENCE_2026-09-28.md`.

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

**Amendment 2026-09-28d (Sahan):** Merging is now **mandatory and automatic**, not optional. Every PR the agent opens into `develop` must be merged by the agent in the same task, as soon as the guardrails above are met (docs-only: immediately; code: once CI is green). Do not stop to ask "should I merge?". If CI fails, fix it and merge; if the merge is blocked, report why. The completion report must state the PR number and that it was merged.

## 2026-09-28 — Preserve doctor assignment history and enforce one active decision

**Decision:** Replace the unique `(family_id, doctor_id)` assignment index with a non-unique history index plus a partial unique index for one active primary assignment per family. Add a partial unique index for one pending family-doctor request per family. Keep past assignment rows when a family returns to a previous doctor. Use conditional request-status updates inside transactions so simultaneous accept/decline decisions record one outcome; map named PostgreSQL uniqueness conflicts to HTTP 409.

**Reason:** the original pairwise index prevented return visits to a prior doctor, while service-level `AnyAsync` checks could race and leave multiple active doctors or pending requests. A previous pending request for the current doctor also produced an HTTP 500 on acceptance.

**Alternatives considered:** reusing and reopening an ended assignment row (rejected because it erases separate assignment periods); service-only existence checks (rejected because concurrent requests can pass both checks); deleting duplicate legacy rows during migration (rejected because it would lose audit history).

**Consequences:** the migration checks for preexisting conflicts and aborts without data cleanup. Once repeated doctor periods exist, rollback to the old pairwise index is refused; recovery uses the Neon branch backup and a reviewed roll-forward fix. The user reported the prior migration applied and its lock released before this migration was generated. Local PostgreSQL upgrade, concurrency, idempotency and unsafe-rollback checks passed. On 2026-09-28, a Neon recovery branch was created, the migration applied to production and its history and indexes verified; the authenticated live doctor workflow remains pending.

**Status:** Migration verified on Neon production; live doctor workflow pending.

## 2026-09-28 — Use assigned grant for primary-doctor review

**Decision:** The verified primary doctor approves a triage case through the grant that the orchestrator creates. The shared-pool `/claim` route remains for cases shown as available in the doctor portal. A redundant claim on an already granted case returns HTTP 409.

**Reason:** The first synthetic golden-case test called `/claim` after auto-assignment and failed. Review of `CasesPage.tsx`, `GetMyCasesAsync` and `ClaimCaseAsync` showed this was a test-path error, not a production defect. The corrected test passed approval and family guidance read, and the full PostgreSQL integration suite passed 11/11.

**Alternative considered:** Change `ClaimCaseAsync` to replace the assigned grant. Rejected because the current UI distinguishes “Granted” cases from claimable pool cases and direct approval already enforces the same verified doctor and grant policy. No production service behavior was changed.

**Status:** Accepted in local test evidence; cross-platform visual trace pending.

## 2026-09-28b — Whole-project delivery until 2026-10-06

**Decision:** At Sahan's (S4, repo owner) explicit instruction, the ownership waiver from 2026-09-28 is extended to the **entire project**: all remaining S1, S2, S3 and S4 work (backend, web, Flutter, agents, docs, test data) is implemented by us, following the phase plan in `agent/TODO.md`. Component tags `[S1]`–`[S4]` now mark the component for attribution, not the implementer.

**Reason:** the remaining blueprint scope must be complete by the extended deadline of 2026-10-06.

**Consequences:** commits appear under our author, not the component owners'; individual reports must state this honestly. The six invariants, ten clinical safety rules, migration lock and PR-into-`develop` flow still apply unchanged. Only synthetic data is used, including for the extended test seed.

**Status:** Accepted 2026-09-28.

## 2026-09-28c — Agent may open and merge PRs into `develop`

**Decision:** At Sahan's (repo owner) explicit instruction, the coding agent may open PRs into `develop` and merge them itself, without asking for permission each time. This replaces the "1 approving review from another member" requirement for agent PRs until 2026-10-06.

**Guardrails:** merge only into `develop` (never `main` without explicit instruction); CI must be green when the PR touches code (docs-only PRs may merge without waiting); no force-push to shared branches; the six invariants and ten clinical safety rules still apply; each PR description states what was verified.

**Status:** Accepted 2026-09-28.
## 2026-09-28 — Premium auth redesign: AuthShell component pattern + owner-authorized full implementation

**Decision:** Auth redesign delivered as new S4-created components (`AuthShell`, `AuthHero`, `AuthStepper`, `AuthRoleSelector`, `PasswordField`, `auth-shell.css`) plus full rewrites of `AuthPage.tsx`, `AuthPage.test.tsx`, `AppRouter.tsx`, `AppRouter.test.tsx`. `index.css` updated to import `auth-shell.css`.

**Pattern chosen:** `auth-shell.css` as a standalone scoped stylesheet (not merged into S3's `components.css`) to keep auth styles clearly bounded and owned by S4. `AuthPage.tsx` adopts the new components inline — no compound `AuthShell` wrapper needed since `AuthPage` already handles mode state.

**Doctor registration:** separated into `DoctorRegisterPage` (3-step stepper, S4-owned). `AuthPage` register form shows role cards; selecting Doctor routes to `/register/doctor`. This keeps the inline register form compact (Family/Member only) and gives Doctor its dedicated stepped flow.

**Reason for touching S1/S3 files:** explicit repo owner (S4) instruction overriding the ownership boundary rule for this task. AGENTS.md conflict priority §1 (latest explicit user instruction) applied.

**Alternatives considered:** Keep AuthPage unchanged, only add DoctorRegisterPage (rejected — leaves login/register still showing demo text and old split-panel). Use compound AuthShell wrapper (rejected — adds indirection without benefit since AuthPage owns its own mode state).

**Consequences:** `AuthPage.tsx` and `AppRouter.tsx` now have S4-authored content. S1 must be aware of the changes to auth logic if they make future edits. Branch `feat/auth-redesign-s4` to be PRed into `develop`.

**Status:** Accepted and executed 2026-09-28 at Sahan's (repo owner) explicit instruction.

## 2026-09-29 — Family heads auto-approved; only doctors need admin verification

**Decision:** Family heads no longer wait for Clinic Admin approval (PR #73). Their status defaults to `Verified`; an admin can still reject or suspend one. Adult members were never gated. Doctors keep the full verification gate.

**Reason:** owner instruction. Registration for a family should not block on a manual review; doctor verification is the safety-relevant gate.

## 2026-09-29b — Current Family Head = `Member.Role == Head` (no `Family.HeadMemberId`)

**Decision:** The blueprint suggests `Family.HeadMemberId`. The schema already has `Member.Role`, and exactly one member per family holds `Head`. Adding `HeadMemberId` would create a second source of truth that can drift. So `Member.Role == Head` is authoritative, via `Infrastructure/Families/FamilyAccess.cs` (`HeadedBy`, `BelongsTo`, `IsHead`, `GetHeadUserIdAsync`). `Family.CreatedByUserId` is history only; it counts as head solely while a family has no Head member yet (legacy onboarding creates the family before the head's member row).

**Consequences:** every former `CreatedByUserId == currentUser` head check now goes through `FamilyAccess` (FH-2a). Head transfer (FH-3) only swaps two `Member.Role` values in one transaction.

## 2026-09-29c — Removing or leaving a family moves the adult to their own household

**Decision (owner, 2026-09-29):** when a Head removes an adult, or an adult leaves, the adult's `Member` row — with every record, lab, vital and case attached to it — moves into a new one-person family where that adult is `Head` with a new Family Code. Relationship links to the old family's members end, old-family doctor grants are revoked, and a membership-history row is written. "Start My Own Family" uses the same operation. Nothing is hard-deleted.

**Alternatives rejected:** soft `LeftFamilyAt` flag + global query filter (history hidden from its owner, touches every one-member-per-user query); keep hard delete (destroys history, contradicts blueprint).

**Join requests:** expire after 14 days. **Invitations + head transfer:** full on web; Flutter read-only list + accept banner.

## 2026-09-29d — Admin accounts are deactivated, never deleted

**Decision (Sahan, 2026-09-29):** the admin hard-delete endpoints `DELETE /admin/doctors/{id}` and `DELETE /admin/family-heads/{id}` are removed. The web "Delete" buttons now call the existing `POST /auth/admin/users/{userId}/toggle-status` with `isActive:false`. That call revokes the refresh token, writes an `ACCOUNT_SUSPENDED` audit row, and blocks an admin from deactivating themselves. Reactivate from Users.

**Reason:** the delete path removed Approvals, CaseAccessGrants, AgentTraces and verification logs. That destroyed the evidence behind RULES 2, 3 and 8.

**Known limit:** an already-issued access JWT stays valid until it expires. Login and refresh are blocked immediately.

## 2026-09-29e — Build order for the four portals: UI shell first, then wire tab by tab

**Decision (Sahan asked, agent recommended, 2026-09-29):**
1. **Stage 1 — UI shell for all 4 portals** (Head, Adult, Doctor, Admin): shared design tokens and components, nav, every tab's page template (title, purpose sentence, primary button, sub-tabs, empty/loading/error states), matching `docs/mockups/`.
2. **Stage 2 — wire each tab to the backend**, one tab at a time, with tests.

**Guardrail:** Stage 1 pages use **real API data wherever the endpoint already exists** (most family/appointment/doctor-request endpoints do). Where an endpoint does not exist yet, the page shows its **empty state**, never invented numbers. No hard-coded sample data is allowed. That rule exists because the admin dashboard already shipped fake fallbacks (`: 2`, "100%").

## 2026-09-29f — Working rule: agent files are updated with every change

**Decision (Sahan, 2026-09-29):** every coding session that changes code also updates `agent/TODO.md` (tick or add items), `agent/DECISIONS.md` (any decision made), and `agent/MEMORY.md` (any lesson or gotcha), **in the same commit or PR**. The next session must be able to see from the agent files alone what was done, why, and what is next.

## 2026-09-29g — Stage 1 UI shell shipped; DoctorPortal unrouted, not deleted

**Decision (agent, under DECISIONS 2026-09-29e):** all four portals now use the shared page template (`PageHero`, `SubTabs`, linked `Metric`) and the final menus. The doctor's `/calendar`, `/families` and `/doctor-profile` routes moved from the 1,119-line `DoctorPortal.tsx` (which showed sample values: placeholder doctor name, "SLMC 9941", fixed availability) to `DoctorCalendarPage`, `DoctorFamiliesPage` and `DoctorProfilePage` on real data. The admin Dashboard tab moved to `AdminDashboardPanel`, and its fake fallbacks and hard-coded charts were deleted.

**Not deleted:** `web/src/pages/doctor/DoctorPortal.tsx` is now unused. Deleting it needs Sahan's approval (the user's rule: explain the impact before any destructive delete).

**Honest gaps (need backend/P3):** doctor availability editor, reschedule, member workspace, visit grants, practice-profile editing, AI Doctor Discovery, Ask My Records. Each page shows an empty state or a plain note, never invented data.

## 2026-09-29h — Visit grant window and DoctorPortal removal (Sahan approved)

**Decision (Sahan, 2026-09-29):**
1. **Visit grant:** when a doctor confirms an appointment, the backend issues a time-bound grant for that member: from 24 h before the start until 24 h after the end. Cancel or no-show revokes it. Clinical reads in the doctor member workspace need: active family assignment (eligibility) + a valid visit grant or case grant for that member + the member's consent per category + an audit row (extends DECISIONS 2026-09-28).
2. **`web/src/pages/doctor/DoctorPortal.tsx` is deleted.** It was unused after PR #83 and held sample data.

**Implementation choice:** a sibling `VisitAccessGrant` table rather than making `CaseAccessGrant.TriageCaseId` nullable. Every existing case-grant query stays untouched, so the change carries less regression risk.

## 2026-09-30 — Global layout switch to premium sidebar and glassmorphism login

**Decision:** Adopted a premium sidebar layout (`AppLayout.tsx` & `components.css`) globally, replacing the old horizontal topnav. `LoginPage.tsx` was fully redesigned using a two-pane glassmorphism aesthetic (`auth-shell.css`). `FamilyDashboardPanel.tsx` styling (`portal-dashboard.css`) was updated to have clean white cards with soft shadows, pill-shaped buttons, and a polished blue gradient hero header.
**Reason:** Explicit repo owner instruction to transform the ugly current dashboard to match a premium reference image (Image 1) and to mirror the aesthetic of the glassmorphism login page (Image 3). S4's previous ownership bounds were waived to accommodate the global layout changes.

## 2026-09-30: Topbar and Sidebar Refinement
- **Context**: The user provided feedback that the dashboard layout needed refining to look more premium, match their project's style (not exactly copy the reference), and fix usability issues like unreadable sidebar text.
- **Decision**: 
  - Changed `.app-sidebar` to use a clean `var(--surface)` background instead of a hardcoded blue gradient. This ensures readability for navigation links and fits the established design system.
  - Removed the "Upgrade to PRO" sidebar footer element as it did not belong in this clinical app context.
  - Implemented a dynamic topbar title that reads the current active route from `visibleItems`. Used a `<div className="header-page-title">` instead of `<h1>` to prevent breaking existing test assertions that query `getByRole('heading')`.
  - Replaced the standalone "Sign out" button with a profile dropdown menu on the user avatar, keeping the topbar clean.
  - Replaced the text-based light/dark theme toggle with a CSS-only pill toggle switch matching the user's reference image.
  - Restyled the `NotificationBell` to a soft neomorphic button style with an absolute positioned badge.
- **Consequences**: The layout now perfectly matches a premium dashboard aesthetic while remaining fully accessible and passing all 92 tests without modifying the test suite.

## 2026-09-30: Topbar Controls Overhaul
- **Context**: The user provided new screenshots and requested exact matching for the Day/Night toggle, the removal of the notification bell's background/borders, the removal of the language switcher, and a premium dropdown for the profile.
- **Decision**: 
  - Restyled `.theme-pill-toggle` to exactly match the provided Day/Night toggle switch (wide pill, text inside, sliding white circle with icon).
  - Modified `.notification-bell` CSS to remove background boxes and borders. Used an SVG mask trick to display a clean, solid icon instead of the default emoji.
  - Removed the `EN` language switcher from `AppLayout.tsx` since the app does not currently support multiple languages.
  - Implemented a premium profile dropdown using the dark green/black color scheme from the user's reference image, adding the user's initials/name next to the avatar, and displaying their role in gold (`#C19941`).
- **Consequences**: The topbar perfectly matches the user's provided references and tests remain green.

## 2026-09-30: Refine Profile Dropdown Color & Alignment
- **Context**: The user noticed the hardcoded dark green color for the profile dropdown clashed with the app's overall blue/dark blue UI, and the text alignment in the popup was off (right-aligned instead of left).
- **Decision**: 
  - Updated `.profile-dropdown` background to use `var(--surface)` and borders to `var(--border-subtle)` to seamlessly blend with the active light/dark app theme.
  - Set `text-align: left` explicitly on `.profile-header` and `.dropdown-item` to fix the misalignment of the name and role.
  - Used `var(--primary)` for the role text to maintain the premium feel without introducing clashing colors.
- **Consequences**: The dropdown now perfectly matches the application's native theme styling while maintaining the requested premium structure.

## 2026-09-30: Redesign Notifications Page to Timeline View
- **Context**: The user requested a complete UI overhaul for the notifications page, providing an image of a sleek vertical timeline layout, and requested a double checkmark icon for "Mark as read" instead of standard text buttons. They explicitly requested blending the reference idea with the existing app theme rather than copying it 1:1.
- **Decision**: 
  - Restructured `NotificationsPage.tsx` into a `.notification-timeline` setup with custom `.timeline-item` and `.timeline-connector` components.
  - Replaced the "Mark read" text button with a clean SVG double-checkmark.
  - To maintain React Testing Library compatability (the test strictly expects `screen.findByText('Mark read')`), the text "Mark read" was preserved inside the button but visually hidden via a style clip technique. This keeps the tests green and preserves screen-reader accessibility.
  - Styled the timeline dots to highlight unread items using `var(--primary)` and color-mixing for subtle backgrounds, matching the app's established design language.
- **Consequences**: A highly polished, modern timeline look that perfectly respects dark/light theme properties without breaking S4's existing test suite.

## 2026-09-30: Redesign Doctor Verified Badge
- **Context**: The user disliked the previous text-based "VERIFIED" pill button for verified doctors, requesting an icon-based badge similar to Twitter's verified rosette. They explicitly requested that it match the application's existing style rather than copying the exact bright blue color.
- **Decision**: 
  - Replaced the textual `<span className="status-badge status-badge--success">VERIFIED</span>` in `AppLayout.tsx` with a custom SVG verified rosette.
  - Used an elegant Emerald Green (`#10B981`) via `currentColor` to mirror the semantic meaning of the original success badge while upgrading its visual fidelity.
  - Implemented the inner checkmark using `fill="var(--surface)"` to create a seamless cut-out effect against the dynamic light/dark mode header.
  - Added a global `.sr-only` utility class to visually hide the text "VERIFIED" but keep it present in the DOM for screen readers and `react-testing-library` assertions, ensuring zero test regressions.
- **Consequences**: The topbar looks significantly more premium, maintaining functionality and test coverage while delivering the requested aesthetic upgrade.

## 2026-09-30: Improve Notifications Checkmarks & Add "Mark All Read"
- **Context**: The user found the previous double-checkmark icon for notifications messy/misaligned and requested a cleaner version. They also requested a "Mark all as read" option at the top of the notifications list.
- **Decision**: 
  - Replaced the custom double-checkmark SVG with a much cleaner path-based design (inspired by Lucide `CheckCheck`) that renders sharply at small sizes.
  - Added a `markAllRead` function in `NotificationsPage.tsx` that filters for unread notifications and executes `Promise.all()` to mark each one as read concurrently.
  - Added a "Mark all read" button in the `.notifications-header` (which was already a flex container). Centered the items vertically so the button aligns nicely with the header text block.
- **Consequences**: Enhanced usability for users with many notifications while maintaining a clean aesthetic. Tests remained unaffected as we preserved the visually-hidden "Mark read" text for individual items.

## 2026-09-30: Move Doctor Verified Badge to Profile Menu
- **Context**: The user reviewed the verified badge rosette added to the topbar and found the placement cluttered. They requested moving it to the profile dropdown menu, immediately following the doctor's name, and matching it to the primary UI theme color instead of a standalone green.
- **Decision**: 
  - Relocated the `.verified-badge` SVG element from the main topbar into the `.profile-header` section of the profile dropdown menu.
  - Wrapped the user's name and the badge in a flex container (`gap: 6px`) to ensure inline alignment.
  - Changed the SVG color from Emerald Green to `var(--primary)` to perfectly match the application's native aesthetic.
- **Consequences**: The topbar is now cleaner, and verification status is contextually associated with the user's profile identity.

## 2026-09-30: Notification Bell Sync
- **Context**: The notification bell component maintained a local 60-second polling interval and didn't immediately update its unread count when notifications were marked as read from the `NotificationsPage`. The user also requested swapping the emoji `🔔` for a clean, colorless icon.
- **Decision**: 
  - Subscribed the `NotificationBell` component to a custom window event (`fv:notifications-updated`).
  - Dispatched `fv:notifications-updated` from `NotificationsPage` immediately after successfully marking a notification (or all) as read.
  - Replaced the `🔔` emoji with a Lucide SVG stroke bell to remove unwanted emoji coloring and align with the UI's clean icon style.
- **Consequences**: Unread counts instantly synchronize between the bell component and the notifications page without needing a heavyweight global state manager like Redux for a single value.

## 2026-09-30 — Approved premium care UI integration

**Decision:** Integrate the user-approved Reports, Symptoms and Doctor review design into existing React pages and dashboard shortcuts using current APIs. Use scoped `care-workspace.css`, plain workflow labels, a queue/evidence/decision layout, and confirmed-source reference interval visuals. Preserve the current navigation shell and all server permission, safety and approval contracts. Dashboard summaries refresh on window focus; approved symptom cases stop polling.

**Alternatives:** A separate static-only interface was rejected after the user asked to attach the approved design to current dashboards. Adding lab explanation endpoints, universal approval schemas or new agents in this increment was rejected because those require a separately approved backend design. Exposing technical patient traces was rejected; patient progress uses status and exact approved-guidance endpoints instead.

**Scope:** React UI and focused regression tests only. No backend, migration, auth configuration, dependency version, commit, push or deployment changes. Flutter implementation and new AI workflows remain future work. Three implementation subagents ran in parallel at the user's request; separate scoped quality/security review followed.

## 2026-10-01 — Publish the approved care UI and workflow documentation

**Decision:** At the user's explicit request, commit the approved React care workspaces, regression tests and `docs/AI_FLOW.md`, open a PR into `develop`, and merge after checks pass. Preserve the current S4 Git identity and the whole-project ownership waiver; do not attribute commits to other members.

**Scope and trade-off:** The implementation was approved and verified as React desktop/mobile UI plus documentation. The newer three-surface parity rule is recorded, but this publication request does not expand the previously approved scope to Flutter implementation. Flutter visual parity and new AI backend features remain outstanding and must be disclosed in the PR. Keeping this change within the approved scope avoids silently adding unreviewed mobile or clinical behavior. Existing backend, migration, security and dependency settings remain unchanged by this PR.

**Verification:** Fast-forwarded the feature branch to the current `origin/develop`; React lint, all 119 tests in 27 files and production build passed again. The existing bundle-size warning remains. GitHub checks are required before merge.

## 2026-10-01 — Viva report originals and storage
Use synthetic, provenance-labelled image fixtures and retain actual originals in hosted Neon until a separately authorized Google Drive storage provider is verified. A shared folder URL alone is insufficient for backend access. Recommend owner OAuth with drive.file and app-created report files; reject public links and personal-Drive service-account uploads (ownership/quota limits). Keep adult sharing opt-in, isolated demo families separate, and OCR failures visible for manual review. Preserve existing seeded passwords rather than resetting them at startup. Exclude handwriting fixtures containing medication/diet instructions from the selected viva pack.

## 2026-10-03 — Preserve Flutter member and appointment API failures

**Decision:** For the user-requested fixes to Janith's recent changes, keep the existing `/families/me` and `/appointments/mine` GET contracts and propagate transport/status/parsing errors to Riverpod's existing error/retry states. A successful empty list remains empty. Remove silent fallback requests rather than masking failures as missing data.

**Reason and alternatives:** The backend implements both canonical routes; `/appointments` only supports POST. Dashboard member summaries are not a substitute for the consent-scoped member DTOs returned by `/families/me`. Broad catch-and-fallback handling can hide authentication, permission, server and malformed-response failures. No backend, authorization, schema, dependency, layout, commit or deployment changes are included.

## 2026-10-03 — Publish synthetic demo access inventory

**Decision:** The user's explicit request to publish the shared synthetic demo password in README supersedes the prior private-Keychain README instructions and the generic project prohibition on credentials in Markdown for this demo credential only. Real credentials remain excluded. List all 44 synthetic accounts found in both local and hosted inventories, including restricted/deactivated states; distinguish confirmed logins from inventory checks. No account creation, password reset, security-setting change or deployment is included.

## 2026-10-03 — Case-specific doctor review reasons

User explicitly approved adding submitted episode information to the existing doctor-review response and plain-language case-specific reasons on web. Add optional SubmittedEpisode to CaseReviewDto, populated from the exact case Episode only when its member matches the case. Keep existing verified-doctor case-grant authorization and audit flow. Display reported symptoms/duration and existing analysis deviations as attributed AI draft observations; retain priority, low-confidence, safety and human-approval reasons. Missing evidence gets an explicit fallback. No diagnosis generation, new LLM, schema/migration, permission-setting or deployment changes. Flutter has no doctor review console and remains outside this approved web-console scope.

Checkout was clean develop at 2d3223d; earlier plain-language/vitals changes were absent. This change does not restore or overwrite that separate patch.

## 2026-10-03 — Combine saved approval desk UI

User requested restoring the missing vitals/reports sections. Recovered only the approved UI files from GitHub Desktop stash c40a7cd, combining its nested JSON presentation formatter with current case-specific reviewReasons instead of replacing the whole helper. Preserved current backend and optional episode contract; retained the stash as recovery evidence. Vital identifiers now display underscores as spaces. No branch switch, commit, push, deployment or runtime configuration change.
