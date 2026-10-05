# ADR-015 — One Shared Application with File-Level Ownership Tags

**Owner:** Group · **Status:** Accepted · **Date:** 2026-09-22

> Written up on 2026-10-05 from the project decision log and the implemented code; the decision itself dates from the date above.

## Context

The assignment is delivered by four students, each assessed on an individual component. The integration requirement is that React and Flutter consume the same ASP.NET Core API, database, identity and business rules. A separate codebase per student would defeat that requirement and make the components impossible to integrate end to end.

Constraints:
1. One API, one web application and one mobile application (invariants 1 and 2 in `CLAUDE.md`).
2. Individual contribution must remain attributable per member.

## Options considered

| Option | Pros | Cons |
|---|---|---|
| **One repository, one solution per tier, file-level ownership manifest** (chosen) | Components integrate by construction; ownership remains auditable per file | Requires a manifest and discipline on shared files |
| Folder-per-student layout | Trivial attribution | Forbidden by `CLAUDE.md`; reason beyond the integration requirement not recorded |

## Decision

Keep `backend/`, `web/` and `mobile/` as single applications. Record ownership per file in `docs/OWNERSHIP.tsv`, the single source of truth, and derive `.github/CODEOWNERS` from it so that the owning member is requested as reviewer on every pull request that touches their files. A small set of shared files follows a labelled-block convention: members add lines inside their own block and never reorder or reformat.

## Consequences

**Makes easy:** end-to-end integration; per-member review routing; per-file attribution in source headers (for example the `// Owner:` header in `ToolDispatcher.cs`).

**Rules out:** a folder-per-student layout.

**Cost:** the manifest and `CODEOWNERS` must be regenerated when ownership changes. The whole-project delivery waiver recorded in `agent/DECISIONS.md` (2026-09-28b) relaxes who may edit a file; tags then record attribution only.

## Evidence

- `CLAUDE.md` — "Repository layout" ("A folder-per-student layout is forbidden") and "Team and ownership".
- `docs/OWNERSHIP.tsv` (introduced 2026-09-22); `.github/CODEOWNERS` ("GENERATED from docs/OWNERSHIP.tsv", introduced 2026-09-22).
- `agent/DECISIONS.md` — "2026-09-28b — Whole-project delivery until 2026-10-06" (waiver). The log has no standalone entry for the layout decision itself; `CLAUDE.md` is the recorded source.
