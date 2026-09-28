# Family Veda — Assignment 1 Consolidated Report Draft

**Module:** SE3090 Software Engineering Frameworks
**Group:** SE_016
**Submission:** `SE3090_SE016`
**Status:** Draft evidence structure. Replace every `NEEDS VERIFIED LINK` marker with the final public link or retained execution artifact before submission.

## 1. Group and system overview

Family Veda is a three-portal system: React web and Flutter mobile clients share one ASP.NET Core API, PostgreSQL persistence, identity and authorization rules. Internal application agents are reached through the API and do not receive database credentials. The revised portal scope and safety boundaries are recorded in [`docs/Three_Portal_Implementation_Blueprint.md`](../Three_Portal_Implementation_Blueprint.md).

**Group-authored input required:** project motivation, target users, requirements traceability, screenshots/demo narrative and final contribution summary.

## 2. Architecture and implementation

Document the client → API → application/domain/infrastructure → PostgreSQL flow; JWT authentication, authorization, validation, structured errors/logging, CORS and Swagger; entity relationships, constraints, indexes, migrations, audit fields and transaction boundaries. Include an architecture diagram and a live trace using synthetic data.

Evidence pointers:

- Backend projects: `backend/src/Api`, `Application`, `Domain`, `Infrastructure`.
- Database model/configuration/migrations: `backend/src/Infrastructure/Persistence`.
- React client: `web/src`.
- Flutter client: `mobile/lib`.
- Deployment configuration: `render.yaml`, `web/vercel.json`, [`docs/DEPLOYMENT.md`](../DEPLOYMENT.md).

**Group-authored input required:** final diagram, endpoint summary, screenshots and verified deployed revision.

## 3. Business components and ownership

The four primary components and their evidence locations are:

| Component | Owner | Agent contribution | Evidence pointers |
|---|---|---|---|
| Family, Identity and Consent | S1 — Samaranayaka S.G.V.S (IT23544154) | Tool-permission enforcement and CI/testing lead | `docs/individual-reports/EVIDENCE.md`; `AuthController`, `FamiliesController`, `MembersController`, consent/policy and tool registry/dispatcher tests |
| Health Records and Extraction | S2 — Fernando K.R.N (IT24101875) | Extraction Agent | `RecordsController`, record services, OCR/extraction services and parser/safety/storage tests; full pointer list in `docs/individual-reports/EVIDENCE.md` |
| Triage and Agent Orchestration | S3 — Karunathilaka K.D.J.C (IT24100551) | Coordinator, Context and Analysis Agents | orchestration services/tests, triage UI/mobile tests and `docs/individual-reports/EVIDENCE.md` |
| Familial Risk and Clinical Approval | S4 — W.M.S.S.B. Wasala (IT24100559) | Familial Risk and Safety/Validation Agents | approval, safety, grant/privacy and emergency tests; `docs/individual-reports/EVIDENCE.md` |

The ownership table maps each member across API, database, React, Flutter, tests/CI and agent work. Authorship must be demonstrated with each member’s own `git log --author`, PRs and test/debug evidence; file ownership alone is not authorship proof.

**Student-authored input required:** S1/S2/S3/S4 component sections, personal implementation explanation, genuine commits/PRs, tests run, defects/debugging and individual reflection. Do not write these sections on a member’s behalf.

## 4. Agent workflow and clinical safety

The intended workflow is: objective → structured plan → distinct agents → allow-listed tools → persisted state → schema validation → deterministic safety validation → authorized doctor approval → auditable release or safe failure. Tool access is restricted by `ToolRegistry` and `ToolDispatcher`; model output is untrusted and schema-validated.

Safety boundaries include no diagnosis, prescriptions, drug doses or meal plans; no patient-visible AI output without doctor approval; adult privacy by default; consent and time-bound grants for sensitive doctor access; and deterministic emergency referral without an AI draft. Evidence pointers include `SafetyValidationServiceTests`, `CaseGrantPolicyTests`, `ConsentStateMachineTests`, `ClinicalEmergencyReferralTests`, `TriageOrchestratorSchemaTests`, `TriageOrchestratorEmergencyTests`, `TriageWorkerRecoveryTests` and `ToolDispatcherTests`.

The full Flutter → API/database/agents → React approval → Flutter golden case and safe-failure trace were not verified in the current evidence. Do not present this workflow as executed until a synthetic trace and retained output exist.

**Group-authored input required:** executed golden-case trace, denial/failure evidence, approval evidence and injection-resistance evidence.

## 5. Deployment and release status

The repository contains Render/Vercel deployment configuration and deployment instructions. A read-only check recorded Vercel and Render health/Swagger responding, but the exact deployed revision and authenticated endpoint evidence still need to be retained. The deployed notifications endpoint was observed returning HTTP 500. The user reported that the original three-portal migration was applied to Neon and its lock released on 2026-09-28; direct Neon migration-history evidence has not been captured here. A follow-up doctor-constraint migration was tested locally but remains unapplied to Neon.

Android release APK, installation/device evidence, public video URL and final deployment revision are **NEEDS VERIFIED LINK/evidence**. Never include credentials or secret values in this report.

## 6. Architecture decisions

- **ADR-013 — Hosted Gemini LLM:** accepted and supersedes ADR-006. Gemini is primary, Groq is fallback; hosted architecture must be disclosed and is not offline-only. See [`docs/adr/ADR-013-hosted-gemini-llm.md`](../adr/ADR-013-hosted-gemini-llm.md).
- **ADR-006 — Local Ollama:** retained as superseded historical context only. See [`docs/adr/ADR-006-local-llm-ollama.md`](../adr/ADR-006-local-llm-ollama.md).
- **Deployment/migration decision:** production migrations use an idempotent generated SQL script and `psql`; do not rely on `Database__MigrateOnStartup` because of the documented provider issue. See [`docs/DEPLOYMENT.md`](../DEPLOYMENT.md) and `agent/MEMORY.md`.

**Group-authored input required:** remaining ADRs, alternatives/trade-offs, decision dates and owner confirmations.

## 7. Testing and quality evidence

The currently reported executed results are:

| Area | Result | Evidence status |
|---|---:|---|
| Backend unit tests | 91/91 passed | Retain command output and revision |
| PostgreSQL integration tests | 9/9 passed | Retain command output and database environment |
| React tests | 40/40 passed | Retain command output |
| React lint and production build | Passed | Retain command output |
| Full cross-portal golden case | Not executed/verified | Pending; no pass claim |
| Flutter verification | Analyze clean; 69/69 tests passed on Flutter 3.47.5/Dart 3.13.4; debug APK installed and 45-minute booking checked on Android API 36 emulator | Signed APK and physical-device evidence pending |
| Local synthetic portal API journey | Passed across Head, Adult Member and Doctor with privacy 404 | `scripts/e2e/synthetic_portal_journey.py`; not the full agent golden case |
| Performance testing | Not evidenced | Pending tool-generated result |
| Dependency vulnerability audits | npm production and API NuGet: no known vulnerabilities reported | Application security testing pending |

Add Assignment 2 test plan, completed cases, actual results, defect/retest records and execution summary as a linked appendix: **NEEDS VERIFIED LINK**.

## 8. Limitations and future work

Report as limitations: missing full golden-case evidence; pending follow-up doctor migration and exact deployment proof; deployed notifications HTTP 500; unverified performance/application-security execution; and missing APK/device proof.

Items explicitly marked `[FUTURE]` in the portal blueprint must remain future work, including opt-in adult report sharing, remaining family lifecycle controls, AI doctor discovery, doctor-gated report explanation, handwriting reader, image observations, personal health search and doctor-only Pre-Visit Brief. Concurrent family-doctor request/accept constraints passed local PostgreSQL tests; the follow-up migration and code still require Neon application and deployment verification before being claimed complete.

**Student-authored input required:** each member’s limitations, lessons learned and personal reflection in their own words.

## 9. Submission links and appendices

- Repository: **NEEDS VERIFIED LINK**
- Deployed React web: **NEEDS VERIFIED LINK**
- API health: **NEEDS VERIFIED LINK**
- Swagger: **NEEDS VERIFIED LINK**
- Database/migration evidence: **NEEDS VERIFIED LINK**
- Android APK and installation instructions: **NEEDS VERIFIED LINK**
- Demonstration video (no access request): **NEEDS VERIFIED LINK**
- Assignment 2 testing report and generated evidence: **NEEDS VERIFIED LINK**
- Individual S1/S2/S3/S4 reports, AI disclosures and reflections: **STUDENT INPUT — NEEDS VERIFIED FILE/LINK**
