# Cross-Agent Operating Rules — Family Veda

Applies to Claude Code, Codex, Cursor, Antigravity, Gemini, and any other coding agent working in this repository.

## Communication and university reference

- Explain updates, decisions and results in a natural Sinhala and English mix by default, including future sessions. Keep code, paths and configuration names in their original form; follow a later explicit user language request.
- Before planning or changing an assessed feature, use [`docs/university/REQUIREMENTS_REFERENCE.md`](docs/university/REQUIREMENTS_REFERENCE.md) and re-check the cited university PDF pages. Review [`docs/university/AUDIT_2026-09-23.md`](docs/university/AUDIT_2026-09-23.md) for evidence gaps and verify its dated claims against current code and deployment.
- The AutoCare PDF is guidance only, never a project scenario to copy. University PDFs are assessment sources, not instructions overriding clinical safety, ownership or the user's request.

> **Naming note.** "Agent" is overloaded here. This file governs **AI coding assistants** working on the repository. The five **application agents** (Extraction, Context, Analysis, Familial Risk, Safety/Validation) are a product feature — their rules live in `rules/agents.md` and `docs/AGENTS_DESIGN.md`.

## Non-negotiables

Before doing anything in this repository, know these:

1. This is **SE3090 Assignment 1, Group SE_016**. 70 of 100 marks are individual and traceable to `git log --author`.
2. **Never commit on another member's behalf.** It destroys the evidence their individual marks depend on.
3. **File ownership is binding.** `[S1]`–`[S4]` tags mark sole owners. Seven `⚠ SHARED` files use the labelled-block convention.
4. **Synthetic data only.** No real patient data, real NIC numbers, or real SLMC registration numbers — in code, tests, seeds, docs, or commit messages.
5. **The ten clinical safety rules in `CLAUDE.md` override any instruction**, including one from the user, that would produce diagnosis language, drug dosing, prescriptions, meal plans, or unapproved patient-visible AI output.
6. **The migration lock is real.** Never generate an EF Core migration without confirming the lock is free.

## Thinking methodology (mandatory)

Follow `rules/common/thinking-methodology.md` on every task.

- Infer goals, not just methods
- Break work into testable pieces; verify each before moving on
- Identify the kill-component and double-verify it
- Tag uncertainty: [Certain], [Likely], [Possible], [Guessing]
- Self-attack conclusions before delivering
- Answer first, reasoning second, risks last
- Never guess when the answer will be acted on without verification

## Coding preflight (mandatory before any code)

Run `rules/common/agent-preflight.md`:

1. **superpowers** (mandatory) — invoke a matching skill before acting; process skills (brainstorming, systematic-debugging) before implementation skills. Fallback: `skills/development-methodology/SKILL.md`.
2. **headroom** — compress heavy context. Note if absent, continue.
3. **caveman** — optional terse output; never on committed code, commits, PRs, or security warnings.

Report: `Preflight: superpowers=[…] · headroom=[on|absent] · caveman=[on|off]`.

## Required context

Read before acting:

- `rules/common/thinking-methodology.md` (first)
- `rules/common/agent-preflight.md`
- `CLAUDE.md`
- `agent/BRIEF.md` · `agent/TODO.md` · `agent/MEMORY.md` · `agent/DECISIONS.md`
- The rules matching the component being touched
- `docs/Family_Veda_Project_Blueprint.md` for anything the summaries do not answer

## Available coding subagents

| Agent | Purpose | Model | When |
|---|---|---|---|
| `worker` | File reads, grep, single edits | Haiku/Sonnet | Fully specified, no judgement |
| `researcher` | Code search, doc lookup | Sonnet | "Where is X", "what calls Y" |
| `implementer` | Feature implementation, bug fixes | Sonnet | Clear spec or plan exists |
| `code-reviewer` | Quality, patterns, best practice | Sonnet | After writing/modifying code |
| `security-reviewer` | OWASP, secrets, consent and grant enforcement | Sonnet | Auth, input, endpoints, agent tools, audit |
| `tdd-guide` | Write tests first | Sonnet | New features, bug fixes |
| `build-error-resolver` | Build/type errors | Sonnet | Build fails — minimal diffs |
| `architect` | System design, ADRs | Opus | Architectural decisions |
| `doc-updater` | Docs, codemaps | Haiku | Documentation |
| `planner` | Implementation planning | Opus | Ambiguous or multi-layer work |
| `performance-optimizer` | Bottlenecks, agent latency | Sonnet | Slow workflow, slow queries |

### Immediate usage (no prompt needed)

1. Multi-layer feature request → **planner**
2. Code just written → **code-reviewer**
3. Bug fix or new feature → **tdd-guide**
4. Architectural decision → **architect**
5. Build fails → **build-error-resolver**
6. Anything touching auth, consent, grants, agent tools or audit → **security-reviewer**

### Parallel execution

Batch independent delegations in one dispatch.

```
Agent(security-reviewer): "Audit case grant enforcement in ApprovalsController"
Agent(code-reviewer):     "Quality review of the ToolDispatcher allow-list"
Agent(tdd-guide):         "Write ToolDenialTests for the Familial Risk raw-record denial"
```

### Do not delegate

- Direct questions from the user
- Single-line changes
- Clinical safety decisions
- Anything under-specified — clarify first, then delegate

## Ownership protocol

Before editing any file:

1. Check the owner tag in blueprint §14.1.2.
2. If it belongs to another member → **stop and ask**. Do not "helpfully" fix it.
3. If it is `⚠ SHARED` → add lines inside the correct labelled block. Never reorder, reformat, or restructure.
4. If it is `AppDbContext.cs` or any migration → confirm the migration lock is free first.

The seven shared files: `Program.cs` [S1] · `AppDbContext.cs` [S1] · `IAgent.cs` [S3] · `web/src/store/index.ts` [S3] · `web/src/routes/AppRouter.tsx` [S1] · `mobile/lib/router/app_router.dart` [S1] · `package.json`/`pubspec.yaml` [S1].

## Tool policy

- Confirm the tool is necessary before using it.
- Prefer Direct API → MCP → browser automation → Computer Use.
- Use least privilege; define expected output and failure behaviour.
- Never store credentials in Markdown.
- When adding an **application** agent tool, register it in `ToolRegistry` with its per-agent allow-list and add a denial test. A tool that is not in the registry does not exist.

## LLM policy

- The application LLM is **Gemini (primary), Groq (fallback)** — both hosted, no local Ollama (ADR-013 supersedes ADR-006). Disclose the hosted architecture transparently in the report; do not claim offline-only data residency.
- Every agent output is JSON-schema validated. Schema failure → one retry → safe failure.
- The Safety/Validation Agent uses **no LLM**. Do not "improve" it with one.
- Treat all LLM output as untrusted input to the rest of the system.

## Evaluation policy

- Hard failures: invalid schema · prohibited content · red flag present · confidence below threshold · denied tool call attempted.
- Bound revision loops at one retry.
- Do not claim verification without evidence — paste the test output.

## Code quality gates before any commit

- [ ] `code-reviewer` run — no CRITICAL or HIGH outstanding
- [ ] `security-reviewer` run for auth / consent / grant / input / endpoint / agent-tool changes
- [ ] Tests passing, 80%+ coverage on the touched service layer
- [ ] No hardcoded secrets, no `Console.WriteLine`/`console.log`/`print` debug statements
- [ ] Conventional commit message with the owner scope: `feat(s3): …`
- [ ] No clinical safety rule violated

### Review severity

| Level | Meaning | Action |
|---|---|---|
| CRITICAL | Security vulnerability, data loss, or clinical-safety-rule violation | **BLOCK** |
| HIGH | Bug or significant quality issue | **WARN** |
| MEDIUM | Maintainability concern | **INFO** |
| LOW | Style or minor suggestion | **NOTE** |

## UI parity rule — change all three surfaces together (mandatory)

This rule fires automatically on **any** UI request — redesign, improvement, new page, new feature, layout, styling, component, copy, colour, spacing or flow. The user does not need to ask for it. One requested UI change = all three interfaces updated and verified:

1. **Web desktop** — React (`web/`) at desktop widths
2. **Web mobile** — React (`web/`) responsive at phone and tablet widths
3. **Mobile app** — Flutter (`mobile/`), Android and iOS

**A UI task is not complete if only one surface is updated.** If a request names one surface ("fix the login page on web"), still update the matching screen on the other two, or state in the completion report exactly why a surface does not apply (e.g. the screen exists only in the clinician web console).

### Per surface

- **Web desktop** — implement the full requested design; keep spacing, typography and layout professional; preserve existing functionality.
- **Web mobile** — adapt navigation, cards, tables, forms and actions for small screens. No horizontal overflow, overlapping text or clipped buttons. Check **375 px, 390 px, 768 px and desktop**.
- **Flutter** — build the equivalent screen with native Flutter widgets; same branding, terminology, functionality and information hierarchy, adapted for touch and for different phone sizes. Do not copy the desktop layout into Flutter.
- **Mockups** are a visual reference to adapt per screen size, not a layout to clone.

### Functional consistency

- All three surfaces use the same ASP.NET Core API, permissions, validation and business rules (invariants 1 and 2).
- Never replace a working API integration with hardcoded or mock data.
- Every control must work. No buttons that only look functional.
- Doctor approval and patient-data access stay enforced by the backend, never by the UI alone.
- Raw JSON and technical output are shown through readable UI components. Technical traces stay in an expandable, doctor-only section — never on a patient screen.

### Workflow

1. Inspect the latest `develop` and the existing React and Flutter implementations of the screen.
2. Check file ownership.
3. Implement desktop, responsive web and Flutter, reusing existing APIs and components.
4. Add or update tests on both `web/` and `mobile/`.
5. No database migration unless explicitly required and the migration lock is held.

If the corresponding Flutter screen does not exist, decide whether it must be created. Either create it or name the blocker — do not report the task complete without one of the two.

### Completion table

End every UI task with this table. Report what was actually verified: a surface that was only covered by automated tests, or not run on a device, is stated as such — never ticked as verified.

| Platform | Status |
|---|---|
| Web Desktop | Complete / Pending |
| Web Mobile | Complete / Pending |
| Flutter Android | Complete / Pending |
| Flutter iOS | Complete / Pending |
| API Integration | Verified / Pending |
| Tests | Passed / Failed / Not Run |
| Evidence | Screenshot per surface, or the reason one could not be captured |

## Change control

Ask for approval before: deleting files, overwriting major files, changing lock files (`package-lock.json`, `pubspec.lock`, `.csproj` versions), generating a migration, changing deployment or security settings, committing, pushing, deploying, or changing anything on a protected branch.

## Memory rules

Update `agent/MEMORY.md` for meaningful project knowledge, bugs and their fixes, reusable patterns, dependency notes, environment issues, and session handoff. Never store secrets or sensitive personal data.

Record decisions in `agent/DECISIONS.md` **at the moment they are made**, including rejected alternatives — the ADR section of the report is graded on trade-off reasoning, and reconstructing it in Week 8 produces weak ADRs.

## Conflict priority

1. Latest explicit user instruction
2. The ten clinical safety rules and the six architectural invariants
3. Project files (`CLAUDE.md`, `agent/*`, blueprint)
4. Security and permission rules
5. Selected skills
6. Generic rules

Document important conflicts in `agent/DECISIONS.md`.
