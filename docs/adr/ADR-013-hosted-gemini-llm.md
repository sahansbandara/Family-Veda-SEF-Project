# ADR-013 — Hosted Gemini LLM for Agent Inference

**Owner:** S3 · **Status:** Accepted · **Supersedes:** [ADR-006](ADR-006-local-llm-ollama.md) · **Date:** 2026-09-22

## Context

ADR-006 selected a local Ollama instance (`llama3.1:8b`) to ensure health data never leaves team hardware. However, project submission requirements (SE3090 §16 and §17.1) mandate an end-to-end cloud-hosted evaluation where the agentic subsystem must be demonstrably operational without depending on local laptops, network tunnels, or workstation availability.

The cloud API hosting environment (e.g., Render free tier, ADR-010) provides constrained memory (512 MB RAM), making on-host LLM weights execution impossible. At the same time, offline demonstration capability and local development flexibility must not be compromised.

Constraints:
1. Zero cost (must operate within available free-tier API quotas).
2. Deterministic clinical safety rules (ADR-007) must remain strictly in force; the LLM never exercises clinical judgement or prescribes treatment.
3. Every agent response must pass strict JSON schema deserialisation and semantic validation before reaching the doctor approval gate.
4. If the cloud service fails or rate limits occur, fail-closed safe fallback (`FailedSafe`) must trigger.

## Options considered

| Option | Pros | Cons |
|---|---|---|
| **Google Gemini API (`gemini-3.5-flash` via `GeminiClient`)** (chosen) | Free tier available without credit card barriers; native structured JSON response mode (`responseMimeType: "application/json"`); low latency (1–2 s per call); authenticated via `x-goog-api-key` header; lightweight HTTP client in ASP.NET Core | Agent context crosses external network to Google servers; free-tier request quotas |
| Groq Cloud API (`llama-3.1-8b-instant`, evaluated in ADR-012) | High speed, familiar Llama family model | Separate account/key management; free tier limits |
| Local Ollama only (ADR-006) | Zero external data egress; fully local | Cannot execute autonomously on cloud-hosted API environment with 512 MB RAM |
| Self-hosted GPU VM (Oracle Cloud / AWS) | Keeps team control | Setup overhead, card signup restrictions, maintenance burden |

## Decision

Adopt Google Gemini as the primary hosted inference engine via `GeminiClient` [S3], which implements the `IOllamaClient` contract. `GeminiClient` is activated whenever the `Gemini:ApiKey` configuration key is populated in the backend environment.

When `Gemini:ApiKey` is absent or unconfigured, the system automatically falls back to `OllamaClient` pointing to `Ollama:BaseUrl`, preserving complete offline local development functionality.

Key implementation standards:
- **Authentication**: The API key is passed strictly via the `x-goog-api-key` request header, never in query string parameters (preventing exposure in proxy, server, or client logs).
- **Format enforcement**: Requests mandate `responseMimeType: "application/json"` with schema type hints in system instructions.
- **Resilience**: Bounded per-call timeout (default: 45 s), exactly one retry on failure, with unhandled exceptions caught and converted to safe termination (`FailedSafe`).
- **Safety Gate**: All outputs continue to pass through `AgentOutputValidator.Validate()` and require doctor approval before any patient visibility.

## Consequences

**Makes easy:**
- The deployed API runs agent workflows reliably in cloud environments without local machine dependencies.
- Workflow latency comfortably satisfies NFR-01 (full triage pipeline completed within 60 seconds).
- Developers without local GPU hardware can run the agent pipeline effortlessly using a Gemini key, while developers without internet access can run local Ollama.

**Privacy consequence & trade-off:**
- In hosted mode, agent context (consisting of patient symptoms, recent vital values, and synthetic clinical history) leaves the host and is transmitted over TLS/HTTPS to Google's Generative Language API.
- **This trade-off is strictly acceptable because Family Veda operates exclusively with synthetic data (Rule 4 / SE3090 compliance).** No real patient data, real NICs, or real SLMC numbers ever exist in the system or cross external boundaries.
- Only the specific fields exposed by each agent's allow-listed tools are transmitted. Clients never communicate directly with Gemini; all calls originate from the ASP.NET Core backend.

**Rules out:**
- Claiming pure offline data residency in production deployment sections of the report. The report and viva presentation must transparently disclose the hosted Gemini architecture alongside synthetic data boundaries and the local Ollama fallback.

## Status

Accepted. Implemented in `backend/src/Infrastructure/Agents/GeminiClient.cs` and registered via `backend/src/Infrastructure/DependencyInjection.cs`.
