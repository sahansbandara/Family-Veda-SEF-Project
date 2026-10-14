# ADR-006 — Local LLM via Ollama

**Owner:** S3 · **Status:** Superseded by [ADR-013](ADR-013-hosted-gemini-llm.md) (2026-09-22) · **Date:** 2026-08-06

## Context

Three of the five agents use an LLM (Context, Analysis, Familial Risk — for structuring and wording, never for clinical judgement). The input to those agents is health data: conditions, medications, lab values, hereditary flags. Even though our data is synthetic, the architecture must be defensible as if it were real, because that is what the report and viva claim.

Constraints: zero budget, an evaluation that may run on a venue network, and a demonstration that must not fail because an API key expired or a rate limit hit.

## Options considered

| Option | Pros | Cons |
|---|---|---|
| **Ollama, local, `llama3.1:8b`** (chosen) | Health data never leaves the machine — the data-residency argument is real, not aspirational; zero cost; no API key to leak or expire; the demo works with no internet; reproducible for the examiner | Latency depends on team hardware (risk R2); not deployed, so the hosted API cannot run the workflow unaided; smaller model than a hosted frontier model |
| Hosted API (OpenAI / Anthropic / Gemini free tier) | Stronger model; no local hardware requirement | Health data leaves the country and the team's control — directly contradicts the privacy position; free tiers have rate limits and expire; a key in a repo or a rate limit during the viva is a demo-failure mode |
| No LLM — pure rule-based | Fully deterministic; fastest | Fails the specification's agentic AI requirement; the Context and Analysis agents genuinely need natural-language structuring |

## Decision

**Ollama running locally**, model `llama3.1:8b`, called over HTTP from `OllamaClient` [S3] with a configured timeout and a single retry, then safe failure.

Model choice is re-confirmed in W5 after a latency measurement **on the actual demo machine**. A smaller model is acceptable if `llama3.1:8b` cannot meet NFR-01 (full workflow under 60 s).

## Consequences

**Makes easy**
- The privacy argument in the report is structural: no health data crosses a network boundary to a third party.
- The demonstration is offline-capable and has no external dependency that can rate-limit or expire.
- Model and prompt changes cost nothing, so iteration in W5–W6 is unconstrained.

**Makes hard**
- **The deployed API cannot run the agent workflow without a reachable Ollama instance.** This must be stated plainly in the report and the demo — never implied otherwise.
- Output quality is lower than a frontier model, which raises the importance of schema validation and the deterministic safety layer (ADR-007).
- Latency is hardware-dependent — risk R2, tested in W5.

**Rules out**
- Any design that depends on a hosted LLM's quality to be safe. Safety is deterministic by ADR-007 precisely because the model is small.

## Status
 
Superseded by [ADR-013](ADR-013-hosted-gemini-llm.md). Local Ollama retained as fallback for offline development.
