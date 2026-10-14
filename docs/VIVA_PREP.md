# Family Veda viva preparation

This is a compact speaking guide grounded in the current repository. Claims marked **unverified** must be demonstrated or described as outstanding; do not present source-code presence as executed evidence.

## One-minute system explanation

Family Veda is a three-portal React/Flutter client system backed by one ASP.NET Core API and shared PostgreSQL data, identity and authorization rules. A client submits authenticated data to the API; the API persists it and, for triage, coordinates allow-listed application agents. Agents never receive database credentials. Their tool calls are checked by `ToolRegistry` and `ToolDispatcher`, outputs are schema-checked, then deterministic safety validation and a doctor approval gate control any patient-visible guidance. Emergency red flags stop the agent path and return a deterministic referral to in-person care / Suwa Seriya 1990.

## Likely owner questions

### S1 — Family, Identity, Consent and tool-permission enforcement

- How do JWT authentication, password hashing, validation and authorization work, and how is access re-checked on sensitive reads?
- Why is a family relationship or doctor role insufficient by itself? Explain consent, case grants, expiry/revocation and audit records.
- How does the allow-list stop an agent from reading arbitrary records? Show the per-agent entries in `backend/src/Application/Agents/ToolRegistry.cs`, denial persistence in `ToolDispatcher`, and `ToolDispatcherTests.DeniedTool_IsPersisted_AndThrowsHardError`.
- How is adult privacy protected from Family Head dashboard leakage? Cite `AdultPrivacyAuthorizationTests` and explain that private adult records return an authorization-safe 404.
- What remains incomplete? Family Code and join requests are implemented locally. Head transfer, lifecycle edge cases and several sharing controls remain future work. Do not claim the hosted migration is applied.

### S2 — Health records and extraction

- What is the report lifecycle from upload/storage through OCR and extraction, and which data is synthetic?
- Which result is deterministic? `LabRangeClassifier` computes range status server-side and reports “Reference range unavailable” when no usable interval exists; it does not use an LLM to classify a range.
- How are OCR text and model output treated? They are untrusted input, validated at boundaries, and must not become patient-visible AI guidance without approval.
- What evidence exists? Point to `LabExtractionParserTests`, `LabExtractionSafetyTests`, `LabReportDurableStorageTests`, `RecordServiceLabReviewTests` and the integration flow tests. State whether the command was actually run in the current session.
- What is future work? Doctor-gated report explanation, handwriting reading and image observations are explicitly marked `[FUTURE]` and must not be demoed as completed.

### S3 — Triage and agent orchestration

- Walk through `Submitted → Being Reviewed → Doctor Review → Guidance Available` and explain why the UI uses plain clinical states while technical agent details stay secondary.
- Describe the pipeline: objective, structured plan, distinct agents, allow-listed tools, persisted state, schema validation, deterministic safety checks, authorized doctor approval, then release or safe failure.
- Why is emergency triage special? Deterministic red-flag detection bypasses normal AI output and shows referral only.
- How are background failures handled? Mention the triage worker, retry bound, safe failure and audit trail; cite `TriageWorkerRecoveryTests`, `TriageOrchestratorSchemaTests`, `TriageOrchestratorEmergencyTests` and `ToolDispatcherTests`.
- What is unverified? The audit found no executed Flutter → API/DB/agents → React approval → Flutter golden-case trace in this checkout. Do not claim an end-to-end run unless fresh evidence is available.

### S4 — Familial risk and clinical approval

- How does family history remain a screening indication rather than a diagnosis? Familial Risk reads only biological relatives with current consent, confirmed flags and the permitted tool set.
- Explain the approval gate: the doctor sees the full draft and deterministic rule results; only approved, allow-listed guidance can reach a patient or family user.
- What happens on unsafe content? Invalid schema, low confidence, prohibited diagnosis/medication/dose language and emergency red flags produce safe failure; emergency returns referral without the draft.
- Cite `SafetyValidationServiceTests` for emergency halting, prohibited-content blocking and the allow-listed patient guidance check; cite `FamilialRiskPolicyTests`, `CaseGrantPolicyTests`, `ConsentStateMachineTests` and `ClinicalEmergencyReferralTests` for privacy and grant behavior.
- Why no LLM in Safety/Validation? Clinical safety checks are deterministic and must not depend on model judgment.

## Synthetic end-to-end demo sequence

Use synthetic identities and records only. Register a synthetic family user, create a synthetic family/member, add a non-emergency synthetic episode, submit triage, and show the case entering the accepted workflow. Demonstrate that the family endpoint cannot read `/approved-guidance` before a doctor approval (the integration test expects `404`). In a controlled test fixture, show the coordinator’s allow-listed calls and persisted case/audit state; then show a doctor-approved allow-listed sentence reaching the authorized member. Separately submit a synthetic emergency signal and show the deterministic referral screen with 1990, with no AI draft exposed. If the full cross-portal trace has not been executed, say so explicitly and use the repository tests as code evidence only.

## Architecture and safety answers to rehearse

- One API serves both portals; clients never call agents, notifications or the database directly.
- Authorization is grant/consent based and re-checked at each sensitive backend read.
- Hosted Gemini is primary and Groq is fallback; this is not an offline-only architecture. LLM output is untrusted and schema validated.
- The system does not diagnose, prescribe, provide dosing or meal plans. Uncertainty defers to in-person care; emergency handling is referral-only.
- Synthetic data is mandatory. Never show real patient, NIC or SLMC data in a demo, test, screenshot or explanation.

## Current limitations and evidence gaps

The 2026-09-23 audit predates the current deployment. A read-only check on 2026-09-28 found the Vercel web app, Render health endpoint and Swagger responding, but the deployed notifications endpoint returned 500. The hosted migration, full integrated golden case, performance/security tool runs, completed A2 test documents, third-party LLM calls and individual AI logs/reflections remain unverified or missing. `docs/DEPLOYMENT.md` says to apply the EF migration script manually and not rely on `Database__MigrateOnStartup`. Family lifecycle, sharing, and several AI features remain future work.

## Source pointers

- Project safety and ownership: `CLAUDE.md`; component plan: `docs/Three_Portal_Implementation_Blueprint.md`.
- Assessment claims: `docs/university/REQUIREMENTS_REFERENCE.md`; evidence status: `docs/university/AUDIT_2026-09-23.md`.
- Current work and gaps: `agent/TODO.md`, `agent/MEMORY.md`, `agent/DECISIONS.md`.
- Deployment caveats: `docs/DEPLOYMENT.md`.
- Representative implementation: `backend/src/Application/Agents/ToolRegistry.cs`, `backend/src/Domain/Safety/SafetyValidationService.cs`, `backend/src/Infrastructure/Agents/ToolDispatcher.cs`.
- Genuine test sources: `backend/tests/UnitTests/` and `backend/tests/IntegrationTests/`, especially the files named above. Use actual command output for pass claims.
