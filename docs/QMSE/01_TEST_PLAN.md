> Reconciled on 8 October 2026 against retained repository evidence. No tests were rerun during this document review. Results dated 5 October are historical and do not certify the latest working tree.

# SE3110 Quality Management in Software Engineering — Test Plan
## Software Testing and Quality Evaluation of the SE3090 Integrated System

* **Project Title:** Family Veda — Longitudinal Family Health Context & Agentic Clinical Triage Platform
* **Academic Context:** SLIIT · BSc (Hons) in IT (Software Engineering) · Year 3 Semester 1 · 2026
* **Module Code:** SE3110 (Quality Management in Software Engineering)
* **Linked Assessment:** SE3090 Software Engineering Frameworks (Assignment 1, Group SE_016)
* **Document Version:** 1.0.0
* **Date:** October 2026

---

## 1. Introduction & Objectives

### 1.1 Purpose
This Test Plan defines the comprehensive software testing strategy, scope, environment, tools, defect management lifecycle, and evaluation criteria for the **Family Veda** integrated platform. In strict accordance with the SE3110 specification, this testing plan evaluates the integrated system in controlled synthetic test environments across backend, database, web, mobile, agentic AI, and non-functional dimensions (performance and security).

### 1.2 Testing Objectives
1. **Verify Functional Correctness:** Ensure business workflows (authentication, consent, health record management, symptom triage, clinical approval) function accurately across web and mobile clients.
2. **Validate Single-System Integration:** Verify that React Web and Flutter Mobile interface through the single shared ASP.NET Core Web API and PostgreSQL database without data drift or architectural divergence.
3. **Enforce Clinical Safety Guardrails:** Deterministically evaluate the 10 Clinical Safety Rules (no direct diagnosis language, no drug dosing/prescriptions, strict human-in-the-loop doctor approval gate).
4. **Quantify Non-Functional Resilience:** Measure system throughput, latency percentiles (p95, p99), and stability under concurrent user load using a proposed `k6` run; the retained executed baseline used ApacheBench, while auditing API endpoints against OWASP security vulnerabilities.
5. **Evaluate Agentic AI Subsystems:** Validate multi-agent orchestration, JSON-schema compliance, deterministic fallback mechanisms (Gemini ➔ Groq ➔ Safe failure), and prompt-injection resilience.

---

## 2. System Architecture & Testing Scope

### 2.1 Technology Stack Under Test
* **Backend API:** ASP.NET Core 8.0 Web API (Clean Architecture: Domain, Application, Infrastructure, Api)
* **Database:** PostgreSQL 16 with Entity Framework Core (EF Core)
* **Web Frontend:** React 18, TypeScript, Vite, Redux Toolkit, Tailwind CSS (308 passing tests on 5 October; 343 in 57 files on 8 October)
* **Mobile Frontend:** Flutter 3.x, Dart, Riverpod state management (214 passing tests on 5 October; 256 on 8 October)
* **Agentic AI Subsystem:** 5 Application Agents (Context, Analysis, Extraction, Familial Risk, Safety/Validation) powered by Gemini 2.5 Flash / Groq LLMs and deterministic C# rule engines.

### 2.2 In-Scope Testing Areas (Per SE3110 Guidelines)

| Testing Area | What Is Tested | Selected Frameworks & Tools |
| :--- | :--- | :--- |
| **Backend / API Testing** | Unit tests, service business logic, request validation (FluentValidation), controller endpoints, authentication/authorization (JWT, RBAC). | xUnit, Moq, WebApplicationFactory, FluentAssertions |
| **Database Testing** | Schema migrations, entity relational integrity, cascade deletes, unique constraints, JSONB column queries, transaction rollbacks. | xUnit, EF Core / PostgreSQL, Testcontainers for .NET |
| **React Web Application** | Component rendering, user form validation (Zod), protected routing (`RouteGuard`), async state management (Redux), error boundary handling. | Vitest, React Testing Library (RTL), jsdom (343 passing tests on 8 October; 308 on 5 October) |
| **Flutter Mobile Testing** | Mobile widget rendering, form input validation, Riverpod state providers, navigation flows, mock API interactions. | `flutter_test`, Mockito/mocktail |
| **Integration & E2E Testing** | Complete end-to-end clinical workflow: Patient complaint submission ➔ Multi-agent triage ➔ Doctor review & approval ➔ Patient status notification. | Automated C# Workflow Integration Test / Playwright |
| **Performance Testing (Mandatory)** | API throughput, concurrency capacity, latency percentiles under sustained and ramped load (20–50 VUs) on Triage and Record endpoints. | `k6` (proposed); ApacheBench (retained executed baseline) |
| **Security Testing (Mandatory)** | OWASP Top 10 API vulnerabilities, token forgery, consent-state bypass, broken object-level authorization (BOLA), injection vectors. | OWASP ZAP (Baseline scan), xUnit Security suites |
| **Agentic AI Evaluation** | Structured output schema validation, Tool allow-list enforcement (ToolDispatcher), Prompt injection defense, LLM fallback recovery. | xUnit deterministic test suites, System Prompt Test Harness |

---

## 3. Team Member Allocation & Viva Demonstration Matrix

Individual viva performance represents **60 out of 100 marks**. The following allocation is supplied by the draft, not proof of actual work. Each student must confirm identity, ownership, authored tests and Git evidence. Responsibilities are proposed to map to student component ownership in SE3090 (`docs/OWNERSHIP.tsv`):

| Member Ref | Student Name & IT Number | Owned Component | Primary Testing Tool / Role | Viva Demonstration Focus |
| :--- | :--- | :--- | :--- | :--- |
| **S1** | **Samaranayaka S.G.V.S**<br>`IT23544154` | **Family, Identity & Consent** | **Security Testing Lead**<br>(OWASP ZAP, xUnit Auth/Consent) | API Security Scan, JWT & Token lifecycle, Consent State Machine transitions, Tool Dispatcher allow-list denial. |
| **S2** | **Fernando K.R.N**<br>`IT24101875` | **Health Records & OCR Extraction** | **Database & Parsing Test Lead**<br>(xUnit DB constraints, Flutter Test) | PostgreSQL foreign key & cascade constraints, Lab OCR parser boundary cases, Corrupted file upload handling. |
| **S3** | **Karunathilaka K.D.J.C**<br>`IT24100551`<br>*(Group Leader)* | **Symptoms, Triage & Agent Orchestration** | **Performance & AI Evaluation Lead**<br>(`k6` Load Testing, xUnit AI Suite) | `k6` load test execution (p95 latency, concurrency metrics), Agent prompt injection resistance, LLM fallback recovery. |
| **S4** | **W.M.S.S.B. Wasala**<br>`IT24100559` | **Familial Risk & Clinical Approval** | **E2E & Safety Gate Test Lead**<br>(Playwright / Workflow Integration, xUnit) | Complete cross-component workflow trace, Deterministic Clinical Safety Rules 1–10 validation, Doctor Case Grant isolation. |

---

## 4. Test Environment & Prerequisites

### 4.1 Environments
1. **Local Test Environment:**
   * Current capture host: macOS; iPhone 18 Pro Max / iOS 27.0 simulator. Windows/Linux execution must be evidenced separately.
   * Runtimes: .NET SDK 8.0.x, Node.js v20.x, Flutter 3.x, Python 3.11
   * Database: PostgreSQL 16 (Local instance / Docker container)
2. **Continuous Integration (CI):**
   * GitHub Actions workflow (`.github/workflows/ci.yml`) triggering on push and PR to `main` and `develop`.
   * Automated jobs: Backend restore, build, test with XPlat coverage; Web lint, test with vitest; Mobile flutter analyze and test.

### 4.2 Test Data Isolation (Clinical Safety Rule 7)
* **Synthetic Data Only:** Under no circumstances are real patient identities, real NIC numbers, or real SLMC doctor registration numbers utilized.
* All test fixtures use pre-configured synthetic IDs, synthetic addresses, and standard mock lab data ranges.

---

## 5. Defect Management & Classification

### 5.1 Severity Levels
* **CRITICAL:** Application crash, database corruption, security breach/unauthorized data access, or violation of the 10 Clinical Safety Rules (e.g., AI output directly visible to patient without doctor approval).
* **HIGH:** Major functional defect, business workflow blocked, or unhandled 500 error on core API endpoints.
* **MEDIUM:** Validation error wording inconsistency, minor UI rendering quirk, or non-blocking edge-case failure.
* **LOW:** Cosmetic styling deviation, minor log format typo, or non-functional documentation gap.

### 5.2 Defect Lifecycle
`Identified ➔ Logged in Defect Register ➔ Triaged & Assigned ➔ Root Cause Diagnosed ➔ Patch Developed ➔ Unit/Integration Retest Verified ➔ Closed`.

---

## 6. Execution Schedule & Deliverables

| Phase | Milestone | Target Output | Responsible |
| :--- | :--- | :--- | :--- |
| **Phase 1** | Test Planning & Architecture Setup | `01_TEST_PLAN.md`, environment setup | S3 (Janith) |
| **Phase 2** | Test Case Specification (Normal, Edge, Failure) | `02_TEST_CASES_MASTER.md` (41 supplied candidate cases; retained executed register separately) | S1, S2, S3, S4 |
| **Phase 3 (planned)** | Automated Script Implementation (`k6`, AI, Security) | `scripts/testing/`, new xUnit suites | S1, S2, S3, S4 |
| **Phase 4** | Execution & Tool Evidence Collection | Test logs, coverage reports, `k6` graphs, ZAP scans | All members |
| **Phase 5** | Defect Logging & Retesting Documentation | `03_DEFECT_LOG.md` (12 retained defect entries; supplied additional claims require evidence) | All members |
| **Phase 6** | Consolidated Software Testing Report Compilation | Markdown report package (user-requested format) | Group Leader (S3) |


## Evidence-led execution and completion gates

## 3. Non-Functional Test Selection

Performance and security testing are mandatory for this assessment. Table 2 records which non-functional types were selected, and why the others were not.

*Table 2 – Non-Functional Test Selection*

| Non-functional type | Selected | Justification |
|---|---|---|
| Performance (load profile) | Yes — required | Confirms that the read paths both portals depend on complete without errors under concurrency, and shows which are slowest. Limited to read endpoints and a local environment (Section 7). |
| Security | Yes — required | The system handles health-related records and cross-profile access, so access control, token handling, dependency vulnerabilities and malformed-input handling carry the highest risk. Covered by automated access-control tests, dependency audits, static analysis and an OWASP ZAP scan of the API (Section 6). |
| Reliability and recovery | Yes | A triage case must never be lost or silently replayed. Worker-restart recovery, provider-failure fallback and safe-failure paths are covered by automated tests. |
| Compatibility | Partly | The mobile application was built and run on an Android API 36 emulator only. No physical device and no iOS build were tested. |
| Stress testing | No | Free-tier hosting imposes its own limits, so a stress result would describe the hosting plan rather than the application. |
| Usability and accessibility | No | No tool-based usability or accessibility run (for example Lighthouse or axe) was executed. Responsive layout was checked manually during development, which does not count as tool-based evidence. |



## Entry / exit criteria and risk controls

Entry: record commit and dirty state, runtimes, disposable local PostgreSQL target, synthetic fixtures and tool versions. Docker must be healthy for Testcontainers. Keep credentials outside Markdown and evidence.

Exit: execute selected normal/invalid/boundary/failure tests; retain command, date, revision, logs and coverage; document failures and independent retests; complete one correlated integrated workflow plus required performance and ZAP evidence. Any unmet gate is reported as Partial or Not Run. No overall 100% coverage is calculated by averaging unrelated suites.

Prioritise the doctor approval gate, consent and case grants, emergency referral and fail-safe handling. Performance/active scanning targets disposable local environments. Proposed k6 thresholds (p95 <500ms, errors <1%) are acceptance targets requiring a recorded agreed workload, not existing results.

See [completion checklist](05_REPORT_COMPLETION_CHECKLIST.md), [cases](02_TEST_CASES_MASTER.md), [defects](03_DEFECT_LOG.md) and [execution summary](04_TEST_EXECUTION_SUMMARY.md).
