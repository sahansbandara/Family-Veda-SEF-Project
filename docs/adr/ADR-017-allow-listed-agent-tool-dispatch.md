# ADR-017 — Allow-Listed Tool Dispatch; Agents Hold No Database Credentials

**Owner:** S1 · **Status:** Accepted · **Date:** 2026-09-23

> Written up on 2026-10-05 from the project decision log and the implemented code; the decision itself dates from the date above.

## Context

The agentic subsystem processes family health data. Invariants 3 and 5 require that no client calls it directly and that no agent holds database credentials. Agents therefore need a controlled way to read only what their role requires, and every refusal must be traceable (rule 8).

## Options considered

| Option | Pros | Cons |
|---|---|---|
| **Per-agent allow-list enforced in one dispatcher** (chosen) | Single enforcement point; denials audited; least privilege per agent | Every new tool needs an explicit registration |
| Give agents a database connection | Simpler to write | Violates invariant 5 |

## Decision

`ToolRegistry` holds a fixed map from each `AgentKind` to its permitted tool names; the Coordinator has none, and the Extraction agent has only profile, raw-record, OCR and lab-extraction tools. `ToolDispatcher.InvokeAsync` checks `IsAllowed` before executing anything. A denied call writes a `TOOL_DENIED` audit row and throws `ToolDeniedException`, which stops processing safely. Each allowed tool is a bounded query projecting only the fields needed, and an allowed name without a handler throws rather than falling through. Only the ASP.NET Core backend calls the dispatcher.

## Consequences

**Makes easy:** reasoning about exactly what each agent can see; a denial test that maps to a viva question; an audit trail of attempted violations.

**Cost:** adding a tool means changing both the registry and the dispatcher.

## Evidence

- `backend/src/Application/Agents/ToolRegistry.cs` (introduced 2026-09-23).
- `backend/src/Infrastructure/Agents/ToolDispatcher.cs` (introduced 2026-09-23): `TOOL_DENIED` audit row and `ToolDeniedException`.
- `docs/AI_FLOW.md` section 4: "Agent attempts a denied tool — Record the denial and stop safely."
- `CLAUDE.md` — invariants 3 and 5; S1 "owns the tool-permission enforcement layer".
