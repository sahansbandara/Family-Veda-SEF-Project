# Family Veda — Assignment 1 Consolidated Report Draft

**Module:** SE3090 Software Engineering Frameworks
**Group:** SE_016
**Submission:** `SE3090_SE016`
**Status:** Draft evidence structure. CourseWeb's Assignment 1 submission item displayed **6 October 2026, 11:00 AM** on 2026-09-28; recheck before upload. Replace every `NEEDS VERIFIED LINK` marker with the final public link or retained execution artifact before submission.

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

The deterministic PostgreSQL API golden case and invalid-schema safe-failure tests passed 2/2, including doctor approval and family guidance read. The full Flutter → API/database/agents → React approval → Flutter visual trace remains unverified; do not present that cross-platform flow as executed.

**Group-authored input required:** executed golden-case trace, denial/failure evidence, approval evidence and injection-resistance evidence.

## 5. Deployment and release status

The repository contains Render/Vercel deployment configuration and deployment instructions. On 2026-09-28, `develop` CI and CodeQL passed at `49face54`, Vercel reported a successful production deployment of that commit, and the public web, API health and Swagger URLs returned HTTP 200. The synthetic Family Head portal loaded its dashboard, appointments and notifications; the earlier notifications error did not recur in this smoke check. Neon production migration history now contains all three migrations, including the doctor constraints, and the new indexes were verified. The exact Render backend revision, doctor-account journey and retained authenticated API output remain outstanding. See [`RELEASE_EVIDENCE_2026-09-28.md`](RELEASE_EVIDENCE_2026-09-28.md).

An Android debug-signed APK targeting the hosted API was built, installed and launched to its sign-in screen on an API 36 emulator on 2026-09-28; its stable public share link, authenticated use evidence, release signing if chosen, public video URL and exact Render revision are **NEEDS VERIFIED LINK/evidence**. Never include credentials or secret values in this report.

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
| PostgreSQL integration tests | 11/11 passed, including synthetic approval and safe failure | Retained output: `docs/evidence/2026-09-28/backend-integration.txt` |
| React tests | 40/40 passed | Retain command output |
| React lint and production build | Passed | Retain command output |
| Full cross-portal golden case | Backend API sequence passed; full cross-platform visual trace not executed | Pending visual evidence; no cross-platform pass claim |
| Flutter verification | Analyze clean; 69/69 tests passed on Flutter 3.47.5/Dart 3.13.4; local 45-minute booking checked on Android API 36 emulator; hosted-API debug APK built, installed and launched to sign-in | Authenticated hosted workflow, stable share link and physical-device evidence pending |
| Local synthetic portal API journey | Passed across Head, Adult Member and Doctor with privacy 404 | `scripts/e2e/synthetic_portal_journey.py`; not the full agent golden case |
| Performance testing | Local ApacheBench baseline: 200/200 requests, 0 failures, 1.827 ms mean and 4 ms p99 | Broader workflow load and retained tool output pending |
| Dependency vulnerability audits and access control | npm production and API NuGet: no known vulnerabilities reported; focused xUnit security tests and unauthenticated/CORS smoke checks passed | Wider application security testing pending |

Add Assignment 2 test plan, completed cases, actual results, defect/retest records and execution summary as a linked appendix: **NEEDS VERIFIED LINK**.

## 8. Limitations and future work

Report as limitations: missing full cross-platform visual golden-case evidence; exact Render revision and doctor-account deployment proof; broader application-security execution; and missing public APK link, authenticated APK workflow and physical-device proof. The existing APK is debug-signed.

Items explicitly marked `[FUTURE]` in the portal blueprint remain future work for the submission-first plan, including opt-in adult report sharing, remaining family lifecycle controls, AI doctor discovery, doctor-gated report explanation, handwriting reader, image observations, personal health search and doctor-only Pre-Visit Brief. Concurrent family-doctor request/accept constraints passed local PostgreSQL tests and the follow-up migration is installed on Neon; the live doctor workflow still requires an authenticated retest.

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
