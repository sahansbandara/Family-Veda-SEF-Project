# SOFTWARE TESTING REPORT
## Family Veda — Software Testing and Quality Evaluation

**Module:** SE3090 Software Engineering Frameworks · **Assessment:** Assignment 2 · **Group:** SE_016
**System under test:** the same integrated Family Veda system submitted for the SE3090 main assignment (ASP.NET Core Web API, PostgreSQL, React web application, Flutter mobile application, agentic AI subsystem)
**Repository:** https://github.com/sahansbandara/Family-Veda-SEF-Project
**Final execution date:** 5 October 2026 · **Data:** synthetic only

| Ref | Student ID | Name | Component under test |
|---|---|---|---|
| S1 | IT23544154 | Samaranayaka S.G.V.S | Family, Identity and Consent; tool-permission layer; CI |
| S2 | IT24101875 | Fernando K.R.N | Health Records and Extraction |
| S3 | IT24100551 | Karunathilaka K.D.J.C (Group Leader) | Triage and Agent Orchestration |
| S4 | IT24100559 | Wasala W.M.S.S.B. | Familial Risk and Clinical Approval |

This report contains the five required testing documents: the test plan (Sections 1 to 3), the test case document (Section 5), the defect report (Section 8), the test execution summary (Section 9) and the index of tool-generated evidence (Section 11). It is drawn from Chapter 4 of the consolidated final report, `docs/university/FINAL_REPORT.md`, so that both documents state the same results.

---

## 1. Test Plan

**Objectives.** The test plan has four objectives: (1) to show that each business component behaves correctly for normal, invalid, boundary and failure inputs; (2) to show that the ten clinical safety rules and six architecture invariants hold under test, in particular that no unapproved AI output can reach a patient; (3) to show that the two clients, the API, the database and the agentic subsystem work together in one integrated workflow; and (4) to measure the required non-functional properties, performance and security, with tools rather than by observation.

**Scope.** The system under test is the same integrated application submitted for the main assignment: the ASP.NET Core Web API, the PostgreSQL database, the React web application, the Flutter mobile application and the agentic subsystem. Only synthetic data is used. Real patient data, national identity numbers and medical-council registration numbers are excluded.

**Test environment.**

- *Local development machine:* macOS; .NET SDK 10.0.302 building the `net8.0` target; Node.js 26.9.0; Flutter 3.47.5 with Dart 3.13.4; Docker for Testcontainers (PostgreSQL 16); Android API 36 emulator.
- *Continuous integration:* GitHub Actions on `ubuntu-latest` runners, running the backend, web and mobile jobs and a quality gate on every pull request and on pushes to the integration branch, with CodeQL analysis alongside.
- *Hosted environment:* API on Render, PostgreSQL 16 on Neon and the web application on Vercel, used for smoke checks of the deployed revision.

**Schedule.** Testing followed the dates recorded in the repository: a compliance audit on 2026-09-23 identified the evidence gaps; the baseline execution, defect logging and retests took place on 2026-09-28; regression ran through CI on each pull request between 2026-09-28 and 2026-10-05; and the complete suites were rerun with coverage on 2026-10-05.

Table 1 sets out what is tested in each area, the type of testing, the tool and the responsible member.

*Table 1 – Test Plan*

| Testing area | What is tested | Testing type | Tool / framework | Expected result | Responsible member (planned) |
|---|---|---|---|---|---|
| Backend / API — Family, Identity and Consent | Registration validators, consent state machine, family lifecycle, join requests, head transfer, authentication and refresh tokens | Unit, validation, authorisation, API integration | xUnit, Moq, Testcontainers | Rules enforced; invalid input rejected; no cross-profile read without consent | S1 |
| Backend / API — Health Records and Extraction | Lab extraction parser, extraction safety, range classifier, report storage and trash, lab review | Unit, service, failure | xUnit, Moq | Only recognised values extracted; confirmed data never overwritten | S2 |
| Backend / API — Triage and Orchestration | Orchestrator schema validation, emergency gate, worker recovery, LLM client fallback, SLA processor | Unit, failure-recovery | xUnit, Moq | Invalid output fails safe; emergency halts before any LLM step | S3 |
| Backend / API — Familial Risk and Clinical Approval | Safety validation, clinical rule tables, case-grant policy, familial-risk policy, approval decisions | Unit, business-rule, authorisation | xUnit, Moq | Deterministic rules decide; expired or revoked grants denied | S4 |
| Database | Migrations on empty and populated databases, partial unique indexes, concurrency constraints, rollback refusal | Integration, constraint, migration, transaction | xUnit, Testcontainers (PostgreSQL 16), EF Core | Schema applies cleanly; one active assignment and one pending request at most | S1 (migrations), S4 (doctor constraints) |
| React web application | Pages, forms, route guards, API-state and error-state rendering for each portal | Component, form-validation, protected-route | Vitest, React Testing Library, ESLint, Vite build | Components render correct state; guards redirect; build succeeds | Component owner for each page (S1–S4) |
| Flutter mobile application | Screens, providers, models, router guards, secure storage | Unit, widget, navigation | flutter_test, `flutter analyze` | No analysis issues; widgets and providers behave as specified | Component owner for each screen (S1–S4) |
| Integration / end-to-end | Golden case from complaint to approved guidance; safe-failure case; three-role API journey | API integration, complete business workflow | xUnit integration tests, `scripts/e2e/synthetic_portal_journey.py` | Guidance unavailable before approval and available after; privacy denial returns 404 | S3, S4 |
| Agentic AI evaluation | Tool allow-list and denial, structured-output validation, prompt-injection resistance through untrusted OCR text, approval enforcement, safe failure and recovery | Agent evaluation, deterministic test cases | xUnit | Denied tools recorded and stopped; no advisory on failure | S1 (tool dispatch), S2 (Extraction), S3 (Coordinator, Context, Analysis), S4 (Familial Risk, Safety) |
| Performance (required) | Fourteen read endpoints used by the Family Head and Doctor portals, under concurrent load | Load profile | ApacheBench via `scripts/e2e/local_load_profile.py` (and the earlier single-endpoint `local_performance_check.py`) | Zero failed or non-2xx responses; latency percentiles recorded | S1 |
| Security (required) | Access control, unauthenticated access, CORS, token reuse, dependency vulnerabilities, static analysis, and a dynamic scan of every API endpoint | Authorisation, dependency audit, static analysis, dynamic application security testing | xUnit, `npm audit`, `dotnet list package --vulnerable`, CodeQL, OWASP ZAP API scan | Unauthorised requests denied; no known vulnerable dependencies; no high- or medium-risk scan alert | S1, S4 |

> `[CONFIRM: the responsible-member column follows component ownership. Each member must confirm the areas they actually tested and can demonstrate in the viva.]`

## 2. Testing Strategy and Scope

The test strategy follows a test pyramid, with the greatest number of fast, deterministic tests at the base and a smaller number of slower, broader checks above it (Pressman & Maxim, 2020).

1. **Unit tests (xUnit and Moq).** These exercise the domain rules and application services in isolation: the consent state machine, case-grant policy, familial-risk policy, clinical rule tables, safety validation, tool registry and dispatcher, agent orchestration and worker recovery.
2. **Integration tests (xUnit with Testcontainers PostgreSQL 16).** These run the API and EF Core against a real PostgreSQL container, so that constraints, migrations and time-zone handling are exercised against the production database engine rather than an in-memory substitute.
3. **Web component and page tests (Vitest and React Testing Library)**, together with ESLint and a production Vite build as a quality gate.
4. **Mobile tests (flutter_test)**, together with `flutter analyze`.
5. **Scripted API journey.** A repeatable script, `scripts/e2e/synthetic_portal_journey.py`, drives three synthetic roles through the local API. It refuses remote hosts and mutates only synthetic local data.
6. **Performance load profile.** A local ApacheBench run across fourteen read endpoints via `scripts/e2e/local_load_profile.py`.
7. **Dependency audits.** `npm audit --omit=dev` for the web client and `dotnet list package --vulnerable --include-transitive` for the API.
8. **CI gate.** GitHub Actions runs CI and CodeQL on `develop`; both completed successfully on commit `49face54` on 2026-09-28.

Testing is risk-based. The highest priority was given to the properties whose failure would breach a clinical safety rule or the integration architecture: the approval gate (no unapproved guidance), consent and case-grant enforcement on every cross-profile read, denial of tools outside an agent's allow-list, deterministic emergency handling, and safe failure when an agent produces invalid output or a provider is unavailable. Lower-risk presentation concerns were covered by component tests and manual emulator checks. This prioritisation reflects the Assignment 2 risk register, in which authorisation leakage, unsafe agent output, migration incompatibility, client/API contract mismatch and success-reported failures were the principal risks.

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

## 4. Automated Suite Results

Table 3 reports the retained 2026-09-28 execution alongside the final local rerun on 2026-10-05 at commit `613bf7e` on `develop`. The rerun output is retained under `docs/evidence/2026-10-05/`. Results are reported as observed, including failures.

*Table 3 – Automated Test Suite Results*

| Suite | Tool | Retained run 2026-09-28 | Rerun 2026-10-05 @ `613bf7e` | Line coverage (2026-10-05) | Evidence file |
|---|---|---|---|---|---|
| Backend unit | xUnit + Moq | 91 / 91 passed | 337 / 337 passed | 20.2% overall; Domain 72.4%, Application 76.0% | `backend-unit.txt` |
| PostgreSQL integration | xUnit + Testcontainers (PostgreSQL 16) | 11 / 11 passed | 25 / 25 passed; **29 / 29 after the four request-hardening tests were added** | 69.1% overall; Infrastructure 71.1%, Api 59.0% | `backend-integration.txt`, `backend-integration-final.txt` |
| Web tests | Vitest + React Testing Library | 41 / 41 passed | First run 306 / 308 (2 failed); **retest after fixes 308 / 308 passed** (52 files) | 69.6% lines; 67.5% statements; 62.4% branches | `web-tests.txt`, `web-tests-retest.txt`, `web-coverage.txt` |
| Web lint and build | ESLint; `tsc -b` + Vite build | Passed | First run failed (lint exit 1, build exit 2); **retest after fix: both exit 0** | — | `web-lint-build.txt`, `web-lint-build-retest.txt` |
| Flutter | `flutter analyze`; flutter_test | No issues; 69 / 69 passed | No issues; 214 / 214 passed | 76.4% | `flutter-tests.txt` |
| Dependency audits | `npm audit --omit=dev`; `dotnet list package --vulnerable` | 0 vulnerabilities; none reported | 0 vulnerabilities; none reported | — | `dependency-audits.txt` |

Three points qualify these figures. First, the first run at `613bf7e` exposed two defects, both from same-day changes to the records pages: two obsolete tests in `web/src/pages/records/VitalsPanel.test.tsx` (D-008) and an unused `Link` import in `web/src/pages/records/RecordsPage.tsx` that failed lint and the production build (D-009). Both were fixed and retested the same day; the final suite has 308 tests because one obsolete test was removed and one guard test was added with D-010 (Table 8). Web coverage was captured in a separate run with fewer workers and a longer test timeout, because coverage-instrumented runs timed out when the development machine was heavily loaded. Second, backend coverage is reported per run and has not been merged: the unit run covers the Domain and Application layers well but barely touches controllers and persistence, which the integration run covers instead. The backend line totals also include generated EF Core migration code, which lowers the overall percentage. Third, the growth from the retained run to the rerun (for example 91 to 337 unit tests) reflects tests added with the features delivered between the two dates.

## 5. Test Case Document

Table 4 is the test case document. Each case names the feature, its type (normal, invalid, boundary or failure), the preconditions and steps, the expected and actual result, and the status. Cases TC-01 to TC-26 are individual automated tests, identified by their test method so that they can be rerun; cases A2-* are the wider integrated, non-functional and device cases executed on 2026-09-28. Automated cases were last executed on 2026-10-05 as part of the suites in Table 3.

*Table 4 – Test Case Document*

| ID | Feature | Type | Preconditions and steps / input | Expected result | Actual result | Status |
|---|---|---|---|---|---|---|
| TC-01 | Registration (S1) | Normal | Submit a complete Family Head registration to the validator — `ValidFamilyHead_Passes` | Validation passes | Passed | Pass |
| TC-02 | Registration (S1) | Invalid | Submit a Family Head registration with no family name — `FamilyHead_RequiresFamilyName` | Validation error on family name | Error returned | Pass |
| TC-03 | Registration (S1) | Invalid | Submit mismatched password and confirmation — `ConfirmPassword_MustMatch` | Validation error | Error returned | Pass |
| TC-04 | Registration (S1) | Boundary | Submit a date of birth below the adult threshold, and a future date — `DateOfBirth_RequiresAdult`, `DateOfBirth_RejectsFuture` | Both rejected | Both rejected | Pass |
| TC-05 | Consent (S1) | Boundary | Guardian-granted consent for a member who turns eighteen — `RequiresReaffirmation_WhenGuardianGrantedAndMemberTurnsEighteen_ReturnsTrue` | Reaffirmation required | Reaffirmation required | Pass |
| TC-06 | Authentication (S1) | Failure | Submit the same refresh token concurrently — `RefreshToken_IsSingleUse_WhenSubmittedConcurrently` | Only one request succeeds | One succeeded | Pass |
| TC-07 | Tool dispatch (S1) | Failure | An agent requests a tool outside its allow-list — `DeniedTool_IsPersisted_AndThrowsHardError` | Denial persisted; processing stops | Denial persisted; error raised | Pass |
| TC-08 | Tool dispatch (S1) | Normal | Familial Risk Agent reads relatives' flags — `FamilialRisk_ReadsOnlyBiologicalRelativesWithCurrentConsent` | Only consented biological relatives returned | As expected | Pass |
| TC-09 | Lab extraction (S2) | Normal | Parse a recognised report table — `ParseValues_ExtractsStructuredRows_AndIgnoresFreeText` | Structured rows extracted; free text ignored | As expected | Pass |
| TC-10 | Lab extraction (S2) | Invalid | Parse text containing appointment times — `ParseValues_DoesNotTreatAppointmentTimesAsLabResults` | No lab value created | None created | Pass |
| TC-11 | Lab extraction (S2) | Invalid | Parse table rows with malformed fields or no recognised header — `ParseValues_TableRows_UseCurrentValueAndRejectMalformedFields`, `ParseValues_DoesNotParseTableRowsWithoutRecognizedHeader` | Malformed rows rejected | Rejected | Pass |
| TC-12 | Lab extraction (S2) | Failure | Extraction recognises zero rows — `ExtractAsync_WhenRecognizedRowsAreZero_FailsWithoutWritingValuesOrFlags` | Fails without writing values or flags | Nothing written | Pass |
| TC-13 | Lab extraction (S2) | Failure | Re-extract a report that already holds manually confirmed data — `ExtractAsync_WhenReportContainsManuallyConfirmedData_RejectsAndPreservesConfirmedRows` | Rejected; confirmed rows preserved | Preserved | Pass |
| TC-14 | Agent orchestration (S3) | Failure | An agent returns output that violates its schema — `InvalidAgentSchema_FailsSafe_AndStopsRemainingAgents` | Case fails safe; later agents do not run | Failed safe | Pass |
| TC-15 | Emergency gate (S3) | Failure | Emergency wording appears in free-text notes — `EmergencyGate_AlsoChecksFreeTextNotes_BeforeEveryLlmAgent` | Halt before every LLM agent | Halted | Pass |
| TC-16 | LLM client (S3) | Failure | Provider returns rate-limit responses twice — `RateLimitedTwice_FailsClosed` | Client fails closed | Failed closed | Pass |
| TC-17 | LLM client (S3) | Invalid | Provider returns a schema violation once — `SchemaViolation_RetriesOnce_ThenReturnsValidOutput` | One retry, then valid output | As expected | Pass |
| TC-18 | Worker recovery (S3) | Boundary | More queued cases than channel capacity at start-up — `Recovery_ReturnsMoreThanChannelCapacity_WithoutBlockingStartup` | Start-up not blocked | Not blocked | Pass |
| TC-19 | Case grant (S4) | Boundary | Grant expired or exactly at its expiry time — `HasAccess_WhenGrantIsExpiredOrAtExpiryBoundary_ReturnsFalse` | Access denied | Denied | Pass |
| TC-20 | Case grant (S4) | Invalid | Grant was revoked — `HasAccess_WhenGrantWasRevoked_ReturnsFalse` | Access denied | Denied | Pass |
| TC-21 | Safety validation (S4) | Failure | Emergency red flag present — `Validate_WhenEmergencyRedFlagExists_HaltsBeforeLlmAndReturnsReferralOnly` | Referral only; no AI output | Referral only | Pass |
| TC-22 | Safety validation (S4) | Invalid | Evidence contains prohibited content — `Validate_WhenLabEvidenceContainsMedicationContent_StillBlocksContent` | Content blocked | Blocked | Pass |
| TC-23 | Approval gate (S4) | Normal | Complete synthetic golden case — `SyntheticGoldenCase_RequiresApprovalBeforeFamilyCanReadGuidance` | Guidance unreadable before approval, readable after | As expected | Pass |
| TC-24 | Doctor verification (S4) | Invalid | Unverified doctor calls clinical routes — `PendingDoctor_IsForbiddenFromEveryClinicalQueueAndDecisionSurface` | Forbidden on every route | Forbidden | Pass |
| A2-API-01 | Three-role API journey | Normal | Synthetic Head, Adult Member and Doctor against local API and PostgreSQL 16; run `scripts/e2e/synthetic_portal_journey.py` | Journey completes; Head denied an adult's records | Join by code, doctor acceptance, 45-minute booking, dashboards and notifications passed; Head received 404 | Pass |
| A2-API-02 | Doctor acceptance | Failure (regression) | Fixture with an already assigned doctor and a legacy pending request; accept the request | No duplicate assignment | HTTP 200, one assignment, request Accepted | Pass |
| A2-DB-02 | Doctor concurrency constraints | Boundary | Competing writes for pending requests and active primary assignments; concurrent accept and decline | At most one of each; one decision with matching audit | One write won each pair; API returned one 200 and one 409 with one audit row | Pass |
| A2-DB-03 | Idempotent migration | Normal | Fresh PostgreSQL 16; apply the first two migrations, then the doctor-constraint script twice | Both runs succeed; one history row per migration | Both runs exited 0; three distinct migration IDs | Pass |
| A2-DB-04 | Populated migration and rollback | Failure | Legacy database with history; conflicting legacy database; repeated assignment after upgrade | Rows preserved; conflicting upgrade rejected atomically; unsafe rollback refused | Confirmed by integration tests | Pass |
| A2-MOB-02 | Android appointment booking | Normal | Synthetic Head on Android API 36 emulator with local API; select 45 minutes and 10:00 AM; submit | Same local time shown in the appointment list | Stored `duration_minutes=45`; list showed 10:00 AM after the time-zone fix | Pass |
| A2-MOB-03 | Hosted-API Android APK | Normal | Build with the production API URL; install on Android API 36 emulator; sign in as synthetic Head | APK builds, installs and reaches the dashboard | Built, installed, signed in; dashboard, appointments and notifications loaded. Doctor-approved guidance journey on the hosted environment not run | Partial |
| A2-E2E-01 | Complete integrated workflow | Normal and failure | Flutter → API, database and agents → React approval → Flutter result | Golden case and safe-failure case demonstrated across both clients | Passed at API level (TC-14, TC-23). Cross-platform visual trace not executed | Partial |
| A2-PERF-01 | Performance | Normal | ApacheBench, 1,000 requests at concurrency 25 on each of 14 read endpoints (14,000 requests), disposable local API and PostgreSQL 16; run `scripts/e2e/local_load_profile.py` | Zero failed or non-2xx responses on every endpoint | 14,000 completed, 0 failed, 0 non-2xx; slowest endpoint 88 ms mean and 267 ms p99 (Table 7) | Pass (local) |
| A2-SEC-01 | Access control | Invalid | Unauthenticated GET on three protected live routes; preflight from an untrusted origin | 401 on each route; no allow-origin header | 401 returned three times; no allow-origin header | Pass (scoped) |
| A2-SEC-02 | Web dependency audit | Normal | `npm audit --omit=dev --audit-level=high` | No known vulnerabilities | `found 0 vulnerabilities` (2026-10-05) | Pass |
| A2-SEC-03 | API dependency audit | Normal | `dotnet list package --vulnerable --include-transitive` | No vulnerable packages | None reported (2026-10-05) | Pass |
| A2-SEC-04 | Dynamic security scan | Normal and invalid | OWASP ZAP API scan over the OpenAPI definition with a synthetic Family Head token, disposable local API | No high- or medium-risk alert | 0 failed; 4 low-risk warnings on first run, 2 after fixes (D-011, D-012) | Pass |
| TC-25 | Request hardening (S1) | Invalid | Send a query string containing a NUL character — `NulCharacterInQueryString_IsRejectedAsBadRequest_NotServerError` | HTTP 400 problem details, not HTTP 500 | HTTP 400 | Pass |
| TC-26 | Request hardening (S1) | Normal | Request the health and an API route — `EveryResponse_TellsBrowsersNotToSniffContentType` | `X-Content-Type-Options: nosniff` on each | Present | Pass |
| A2-WEB-01 | Vitals panel (web) | Normal | Run `VitalsPanel.test.tsx` on 2026-10-05 | All tests pass | First run: two of four failed (D-008). Retest after the tests were aligned with the redesigned panel: three of three passed | Pass (after retest) |
| A2-WEB-02 | Web quality gate | Normal | `npm run lint` and `npm run build` on 2026-10-05 | Both exit 0 | First run: lint exit 1, build exit 2 (D-009). Retest after fix: both exit 0 | Pass (after retest) |

Of the 41 cases, 39 are Pass (two with stated scope qualifications and two after a same-day fix and retest) and 2 are Partial. No case remains failed.

## 6. Security Testing

Table 6 lists the security checks for which execution evidence exists. Each is automated and tool-based; together they are still not a substitute for an independent penetration test.

*Table 6 – Security Checks*

| ID | Check | Expected | Actual | Status |
|---|---|---|---|---|
| SEC-1 | Guidance requested before doctor approval (integration test) | Family read of unapproved guidance denied | HTTP 404 before approval; guidance returned only after allow-listed approval | Pass |
| SEC-2 | Action by a doctor whose verification is pending (integration test) | Denied | Pending-doctor denial confirmed | Pass |
| SEC-3 | Refresh-token reuse (integration test) | Refresh token usable once only | Single-use behaviour confirmed | Pass |
| SEC-4 | Tool dispatch, case grants and consent (11 unit tests) | Unauthorised tool use, stale grants and revoked consent are denied | 11 unit tests passed | Pass |
| SEC-5 | Unauthenticated GET to `/api/v1/notifications`, `/api/v1/dashboard/family`, `/api/v1/dashboard/doctor` on the live API | HTTP 401 | All three returned HTTP 401 | Pass |
| SEC-6 | CORS preflight from `https://untrusted.example.invalid` | No allow-origin header | HTTP 204 without `Access-Control-Allow-Origin` | Pass |
| SEC-7 | `npm audit --omit=dev --audit-level=high` (web production dependencies) | No known vulnerabilities | `found 0 vulnerabilities` (2026-09-28 and 2026-10-05) | Pass |
| SEC-8 | `dotnet list package --vulnerable --include-transitive` (API) | No known vulnerable packages | None reported (2026-09-28 and 2026-10-05) | Pass |
| SEC-9 | OWASP ZAP API scan of all endpoints in the OpenAPI definition, authenticated as a synthetic Family Head, against a disposable local API | No high- or medium-risk alert | First run: 116 rules passed, 0 failed, 4 low-risk warnings. Retest after fixes: 117 passed, 0 failed, 2 low-risk warnings (Section 6.2) | Pass |
| SEC-10 | Query string carrying a NUL character (integration test) | HTTP 400, not a server error | HTTP 400 with a problem-details body | Pass |
| SEC-11 | `X-Content-Type-Options` header on API responses (integration test) | `nosniff` on every response | Present on the health and API routes tested | Pass |

Checks SEC-1 to SEC-3 are the three integration tests, and SEC-4 the eleven unit tests, that together form the focused xUnit run of A2-SEC-01 (3 + 11 tests). A further privacy check, that a Family Head receives HTTP 404 on an adult member's records, was part of the synthetic API journey A2-API-01 in Table 4. SEC-10 and SEC-11 are the regression tests in `RequestHardeningTests` added after the scan.

### 6.1 Mapping to OWASP

The executed checks map to the OWASP Top Ten 2021 categories (OWASP Foundation, 2021) as follows.

- **A01 Broken Access Control.** SEC-1, SEC-2, SEC-4, SEC-5 and the Head-404 privacy check address object-level and function-level authorisation, grant expiry and consent revocation.
- **A02 Cryptographic Failures and A07 Identification and Authentication Failures.** SEC-3 covers refresh-token single use. Password hashing and token lifetimes are design controls described in Chapter 3; they are not separately tested here beyond the checks listed.
- **A03 Injection.** SEC-9 exercised every endpoint with the scanner's injection rules (SQL injection, command injection, server-side template injection, path traversal and others) and raised no injection alert. SEC-10 covers the one malformed-input fault it did find.
- **A05 Security Misconfiguration.** SEC-6 covers CORS handling for an untrusted origin; SEC-9 and SEC-11 cover response security headers.
- **A06 Vulnerable and Outdated Components.** SEC-7 and SEC-8 are dependency audits; CodeQL and Dependabot provide continuing coverage.

For the agentic subsystem, the controls are relevant to categories in the OWASP Top 10 for large language model applications (OWASP Foundation, 2025), in particular prompt injection and excessive agency. Indirect prompt injection through untrusted content is a recognised risk for LLM-integrated applications (Greshake et al., 2023). The relevant mitigations are structural: agents hold no database credentials, tool access is limited to a per-agent allow-list enforced at dispatch (`ToolRegistryTests`, `ToolDispatcherTests`, SEC-4), safety validation is deterministic rather than an LLM judgement, and no output reaches a patient without doctor approval (SEC-1). OCR text is treated as untrusted input. This mapping describes which controls address which categories; it does not claim that every category was tested.

### 6.2 Dynamic Scan with OWASP ZAP

A dynamic scan was run with OWASP ZAP 2.17.0 using its API scan, which imports the OpenAPI definition published at `/swagger/v1/swagger.json` and then both passively inspects and actively attacks every documented endpoint. The scanner was given a bearer token for a synthetic Family Head so that it could reach authenticated routes. The target was a disposable local API with its own PostgreSQL 16 database and synthetic seed data; the hosted service and its database were deliberately not scanned.

The first run passed 116 rules, failed none and raised four low-risk warnings. No high- or medium-risk alert was raised in either run. The four warnings and their outcome were:

1. **A server error on malformed input.** `GET /api/v1/doctors/directory?search=%00` returned HTTP 500, because PostgreSQL cannot store a NUL character in text. This was a real defect (D-011): the client received a server error for what is a client error. It is now rejected with HTTP 400 before reaching the database.
2. **`X-Content-Type-Options` header missing.** A real hardening gap (D-012). Every response now carries `nosniff`.
3. **`Cross-Origin-Resource-Policy` header missing.** Accepted, not changed. The web client is served from a different site from the API, so a restrictive value risks blocking legitimate requests, and the API returns JSON to authenticated callers rather than embeddable resources. It is recorded as a limitation.
4. **Unexpected content type on `/swagger/`.** A false positive: the Swagger UI page is HTML by design, while the scanner expects JSON from an API.

After the two fixes the scan was repeated: 117 rules passed, none failed, and only warnings 3 and 4 remained. The summary and both full reports are retained in `docs/evidence/2026-10-05/security-zap-summary.txt`, `zap-first-run/` and `zap-retest/`.

The scan has limits. It ran with one role's token, so it did not test whether a Doctor or Clinic Admin token can reach another role's data; that property is covered by the access-control tests SEC-1 to SEC-5 instead. It tested the API only, not the web or mobile clients. The evaluation as a whole remains **automated testing, not a penetration test**: session-management attacks, business-logic abuse and independent review were not performed (see Section 10).

## 7. Performance Testing

Performance was measured with ApacheBench against a disposable local API and PostgreSQL 16 database loaded with the synthetic seed data. The script `scripts/e2e/local_load_profile.py` signs in as a synthetic Family Head and a synthetic Doctor, then sends 1,000 requests at a concurrency of 25 to each of fourteen read endpoints: 14,000 requests in total. It refuses any non-local host and fails if any request fails or returns a non-2xx status. Table 7 reports the result; the raw output is retained in `docs/evidence/2026-10-05/performance-load-profile.txt`.

*Table 7 – Performance Baseline*

| Endpoint | Completed | Failed | Non-2xx | Requests/s | Mean (ms) | p50 (ms) | p95 (ms) | p99 (ms) | Max (ms) |
|---|---|---|---|---|---|---|---|---|---|
| Health check (anonymous) | 1000 | 0 | 0 | 21,439 | 1.2 | 1 | 2 | 2 | 2 |
| Family: own family | 1000 | 0 | 0 | 2,660 | 9.4 | 7 | 12 | 79 | 89 |
| Family: dashboard | 1000 | 0 | 0 | 284 | 88.2 | 67 | 197 | 267 | 384 |
| Family: notifications | 1000 | 0 | 0 | 2,063 | 12.1 | 7 | 34 | 93 | 214 |
| Family: appointments | 1000 | 0 | 0 | 639 | 39.1 | 33 | 73 | 115 | 191 |
| Family: health records | 1000 | 0 | 0 | 731 | 34.2 | 27 | 72 | 115 | 181 |
| Family: vitals | 1000 | 0 | 0 | 1,041 | 24.0 | 19 | 55 | 120 | 184 |
| Family: lab reports | 1000 | 0 | 0 | 938 | 26.6 | 23 | 47 | 81 | 114 |
| Family: triage cases | 1000 | 0 | 0 | 1,289 | 19.4 | 16 | 34 | 55 | 94 |
| Family: doctor directory | 1000 | 0 | 0 | 1,977 | 12.6 | 10 | 27 | 37 | 64 |
| Doctor: dashboard | 1000 | 0 | 0 | 452 | 55.3 | 50 | 88 | 121 | 162 |
| Doctor: my cases | 1000 | 0 | 0 | 593 | 42.1 | 37 | 78 | 125 | 242 |
| Doctor: case pool | 1000 | 0 | 0 | 530 | 47.1 | 42 | 87 | 118 | 164 |
| Doctor: appointments | 1000 | 0 | 0 | 639 | 39.1 | 21 | 127 | 560 | 570 |

Mean is the mean time per request at the stated concurrency. All fourteen endpoints completed every request with no failed and no non-2xx responses.

**Interpretation.** Three observations follow from Table 7. First, the two dashboard endpoints are the slowest (88 ms and 55 ms mean): each aggregates several queries into one response, so they are the first place to optimise, for example by combining queries or caching the summary briefly. Second, simple list endpoints stay between 9 ms and 47 ms mean, and every endpoint keeps its 95th percentile under 200 ms. Third, the doctor appointments endpoint has a long tail (560 ms at the 99th percentile against a 21 ms median), which points to occasional contention rather than a consistently slow query and deserves a profiling pass.

The result should be read conservatively. The run was local, with no network latency, a small synthetic data set and a development build. It covers read paths only: no write load and no mixed workload. It says nothing about the hosted environment, where the free-tier API instance sleeps when idle and adds a cold-start delay to the first request, nor about the latency of the agent pipeline, which is dominated by hosted LLM response times (provider timeouts are 45 and 30 seconds). An earlier single-endpoint baseline of 200 requests on 2026-09-28 (1.8 ms mean, zero failures) is retained in the Assignment 2 execution record.

## 8. Defect Report and Retest Evidence

Table 8 is the defect report: each defect recorded during execution of the test plan, with its reproduction steps, cause, fix, retest outcome and current status.

*Table 8 – Defect and Retest Log*

| ID | Description | Severity / priority | Steps to reproduce | Root cause | Fix and retest result | Status | Evidence |
|---|---|---|---|---|---|---|---|
| D-001 | Doctor acceptance returned HTTP 500 | High / P1 | Run the synthetic API journey to the doctor-acceptance step with a doctor already assigned | Duplicate assignment inserted for an already assigned doctor | Fixed; integration test returns HTTP 200 with one assignment and request Accepted | Closed | `AuthAndPatientFlowTests` (TC A2-API-02) |
| D-002 | Flutter verification blocked | Blocker / P1 | Run `flutter pub get` on Flutter 3.41.2 / Dart 3.11 | `camera ^0.12.1` requires Dart 3.12 | SDK upgraded to Flutter 3.47.5 / Dart 3.13.4; analyze clean and tests pass | Closed | `docs/evidence/2026-09-28/flutter-tests.txt` |
| D-003 | Doctor dashboard returned HTTP 500 | High / P1 | Confirm an appointment, then `GET /api/v1/dashboard/doctor` | Non-UTC `DateTimeOffset` day boundary passed to Npgsql | Query boundary changed to UTC; integration check and repeat journey passed | Closed | `docs/evidence/2026-09-28/backend-integration.txt` |
| D-004 | Android appointment time shown in UTC | Medium / P2 | On a Sri Lanka-time emulator, book 10:00 AM and open the appointment list; 4:30 AM is shown | Model displayed the API instant without converting to device-local time | Timestamp parsed to local time; unit test and emulator retest show 10:00 AM | Closed | `docs/evidence/android_appointment_local_time.png` |
| D-005 | Golden-case test returned HTTP 409 | Test design error / P3 | Run the golden-case test, which called `/claim` on a case the primary doctor already held | Test used the shared-pool route for an already granted case | Test corrected to expect 409 and approve through the existing grant; 2/2 passed | Closed | `GoldenCaseFlowTests` |
| D-006 | Hosted doctor dashboard rendered blank | High / P1 | Sign in as the synthetic verified doctor on the hosted web app and open `/dashboard` | API returns an integer count; the client expected an array | Client contract corrected (PR #49) and redeployed; panel renders with no console errors; regression test added | Closed | `docs/evidence/2026-09-28/web-tests.txt` |
| D-007 | Sample metrics shown above live doctor metrics | Medium / P2 | After the D-006 fix, open the doctor `/dashboard`; hard-coded counts disagree with live counts | Static sample content rendered alongside the live panel | Route changed to render the live panel only (`DashboardPage.tsx` returns `DoctorDashboardPanel` for doctors). Retested on the current `develop` build against a local API on 2026-10-05 (final report, Section 4.3): live panel only. A sign-in retest on the hosted site was not performed | Closed (local retest) | final report Figure 4.8; `docs/university/RELEASE_EVIDENCE_2026-09-28.md` |
| D-008 | Two vitals-panel web tests fail | Medium / P2 | In `web/`, run `npx vitest run src/pages/records/VitalsPanel.test.tsx` at `613bf7e` | The redesign of the vitals panel removed the history table and its type filter, but two tests still asserted them; the product behaved as designed and the tests were obsolete | The history-table assertion was removed from one test and the filter test was deleted; recorded readings remain covered by the per-vital dialog test. Retest: web suite passed in full | Closed | `docs/evidence/2026-10-05/web-tests.txt`, `web-tests-retest.txt` |
| D-009 | Web lint and production build fail | High / P1 | In `web/`, run `npm run lint` then `npm run build` at `613bf7e` | Unused `Link` import left in `RecordsPage.tsx` (ESLint `no-unused-vars`, TypeScript TS6133) | Import removed. Retest: lint exit 0, build exit 0 | Closed | `docs/evidence/2026-10-05/web-lint-build.txt`, `web-lint-build-retest.txt` |
| D-010 | Patient vital charts drew a hard-coded "normal" band | High / P1 (clinical safety) | In the web app open Health Records → Vitals at `613bf7e`; each chart shows a green reference band and limits | Fixed reference limits were written into the web client and passed to the chart. One fixed range cannot fit every member (age, pregnancy, measurement context), and showing it classifies a reading for the patient without a doctor, contrary to safety rules 1, 2 and 4. Found by automated pull-request review | Limits removed from the client; the chart now draws recorded values and their average only. A guard test asserts that no reference range is drawn. Retest: web suite 308 / 308, lint and build exit 0 | Closed | `VitalsPanel.test.tsx`; pull request #160 |
| D-011 | Server error on a NUL character in a query string | Medium / P2 | `GET /api/v1/doctors/directory?search=%00` against the API | The character reached PostgreSQL, which cannot store it in text; the failure surfaced as HTTP 500 instead of a client error. Found by the OWASP ZAP scan | `RequestHardeningMiddleware` rejects such a query string with HTTP 400 problem details. Retest: integration test passed; ZAP rescan no longer reports a server error | Closed | `RequestHardeningTests`; `docs/evidence/2026-10-05/security-zap-summary.txt` |
| D-012 | `X-Content-Type-Options` header missing from API responses | Low / P3 | Inspect the response headers of any API route | The header was never set. Found by the OWASP ZAP scan | The middleware adds `nosniff` to every response. Retest: integration test passed; ZAP rescan no longer reports it | Closed | `RequestHardeningTests`; `zap-retest/` |

Priority follows severity: P1 blocks a user journey or the build, P2 misleads without blocking, and P3 affects only the test suite. D-009 is rated high because a failing build blocks the CI quality gate and the web deployment.

Two of these defects, D-003 and D-006, are instructive. D-003 was found only because the integration tests ran against real PostgreSQL, where Npgsql rejects a non-UTC offset that an in-memory provider would have accepted. D-006 was a contract mismatch between client and API that component tests with mocked data did not detect, and it was found by a live synthetic sign-in; a regression test now guards it. Related deployment findings (a hosted Swagger 500 from a duplicate schema identifier, and a notifications page that previously failed to load until a follow-up Neon migration) were also corrected and are recorded in the release evidence.

## 9. Test Execution Summary

Table 5 summarises the final execution on 2026-10-05, after the same-day fixes for D-008 to D-012.

*Table 5 – Test Execution Summary*

| Area | Executed | Passed | Failed | Note |
|---|---|---|---|---|
| Backend unit tests | 337 | 337 | 0 | |
| PostgreSQL integration tests | 29 | 29 | 0 | Includes golden case, safe failure, migrations, concurrency and request hardening |
| Web tests | 308 | 308 | 0 | First run 306 / 308; obsolete tests corrected (D-008); guard test added (D-010) |
| Flutter tests | 214 | 214 | 0 | `flutter analyze` reported no issues |
| **Automated tests in total** | **888** | **888** | **0** | |
| Web lint and build | 2 checks | 2 | 0 | First run failed on one unused import (D-009) |
| Dependency audits | 2 | 2 | 0 | No known vulnerabilities |
| Dynamic security scan (OWASP ZAP) | 117 rules | 117 | 0 | 2 low-risk warnings remain, one accepted and one false positive |
| Load profile (ApacheBench) | 14,000 requests | 14,000 | 0 | 14 read endpoints, zero non-2xx |
| Integrated, device and non-functional cases (A2-*) | see Table 4 | — | 0 | 2 Partial: hosted APK journey and cross-platform trace |
| Defects recorded | 12 | — | — | 12 fixed and retested (D-007 retested locally, not on the hosted site) |

**Conclusion.** The backend, database and mobile suites pass in full, and the properties that protect patients — the approval gate, consent and grant enforcement, tool denial, the emergency path and safe failure — are each covered by passing automated tests. The final rerun also did its job: it exposed two web defects introduced on the last day, which were fixed and retested before submission. Three gaps remain in the evidence: the integrated workflow is proven at API level but not as a cross-platform visual trace; performance testing covers read paths on a local environment only; and security testing, although it now includes a dynamic scan, used one role's token and is not a penetration test.

## 10. Agentic AI Evaluation and Remaining Gaps

The agentic subsystem was evaluated at component level and at API level. The following named test classes exist in the backend test projects and cover the safety-critical behaviour.

- `SafetyValidationServiceTests`: deterministic validation of agent output against rule tables, including prohibited-content rejection.
- `ToolRegistryTests` and `ToolDispatcherTests`: the per-agent tool allow-list and the dispatch-layer enforcement that denies a tool outside it, with the denial recorded as a `ToolDenied` step.
- `TriageOrchestratorSchemaTests`: invalid agent output results in a `FailedSafe` case with an `INVALID_AGENT_SCHEMA` trace, and no advisory is produced.
- `TriageOrchestratorEmergencyTests` and `ClinicalEmergencyReferralTests`: an emergency red-flag phrase produces a deterministic escalation and referral before any LLM step is invoked.
- `TriageWorkerRecoveryTests`: after a worker restart, untouched queued cases are recovered and interrupted cases are marked safely failed rather than silently replayed.
- `CaseGrantPolicyTests`, `ConsentStateMachineTests` and `FamilialRiskPolicyTests`: the grant, consent and hereditary-screening rules that gate what an agent or doctor may read.
- `GoldenCaseFlowTests`: the PostgreSQL golden case and safe-failure case described below.

**Golden case.** The deterministic PostgreSQL test (A2-E2E-01) passed 2/2 at API level. It submits a synthetic episode, runs the agents, confirms that the assigned verified primary doctor receives an active case grant, has that doctor approve through an allow-listed advisory, and then reads the guidance as the family member. Before approval the same family read returns HTTP 404. Calling the shared-pool claim route on the already granted case returns the expected HTTP 409 (this resolved defect D-005, a test design error, not a production defect).

**Safe-failure trace.** The independent invalid-schema test verifies that processing stopped after the Context agent, that a persisted `SafeFailure` trace with code `INVALID_AGENT_SCHEMA` exists, and that approved guidance remained HTTP 404.

**Limits of this evaluation.** The golden-case evidence is backend API evidence. The full cross-platform visual trace (Flutter submission, React doctor approval, Flutter result) has **not** yet been executed and retained; it is pending and is reported as such in Table 4 and Table 6. No agent-latency or LLM-quality measurement has been taken, and the hosted LLM output is non-deterministic, so the deterministic tests above deliberately do not depend on it.

The remaining gaps in the testing evidence are stated plainly: the complete integrated workflow is proven by automated API-level tests but not by a recorded cross-platform run through both clients; the mobile application was run on an emulator only; performance testing covers read endpoints on a local environment; and the security scan used one role's token and is not a penetration test.

## 11. Tool-Generated Evidence

All files are in the repository under `docs/evidence/2026-10-05/` unless another path is given.

| Evidence | File |
|---|---|
| Backend unit test output | `backend-unit.txt`, `backend-unit-final.txt` |
| PostgreSQL integration test output | `backend-integration.txt`, `backend-integration-final.txt` |
| Web test output, first run and retest | `web-tests.txt`, `web-tests-retest.txt` |
| Web lint and build, first run and retest | `web-lint-build.txt`, `web-lint-build-retest.txt` |
| Flutter analyze and test output | `flutter-tests.txt` |
| Coverage figures (backend, web, Flutter) | `coverage-summary.txt`, `web-coverage.txt` |
| Dependency audits | `dependency-audits.txt` |
| Load profile (ApacheBench) | `performance-load-profile.txt` |
| OWASP ZAP scan summary and full reports | `security-zap-summary.txt`, `zap-first-run/`, `zap-retest/` |
| Application screenshots | `screens/` |
| Earlier execution of 28 September 2026 | `docs/evidence/2026-09-28/` |

**Automated test source code.** Backend: `backend/tests/UnitTests/` and `backend/tests/IntegrationTests/`. Web: `web/src/**/*.test.ts(x)`. Mobile: `mobile/test/`. Scripts: `scripts/e2e/synthetic_portal_journey.py`, `scripts/e2e/local_load_profile.py`, `scripts/e2e/local_performance_check.py`. Continuous integration: `.github/workflows/ci.yml` and `codeql.yml`.

**How to rerun.**

```bash
dotnet test backend/tests/UnitTests/FamilyVeda.UnitTests.csproj
```

```bash
dotnet test backend/tests/IntegrationTests/FamilyVeda.IntegrationTests.csproj
```

```bash
cd web && npm ci && npm test -- --run && npm run lint && npm run build
```

```bash
cd mobile && flutter pub get && flutter analyze && flutter test
```

The integration tests need Docker, because they start PostgreSQL 16 in a container. The load profile and the ZAP scan need a local API with a disposable database and synthetic seed data; both refuse or must not be pointed at the hosted service.

## 12. Individual Testing Contribution

Each student must be able to run, explain and modify the tests they contributed. Each student completes their own row and paragraph below in their own words.

| Member | Tool or framework demonstrated | Tests implemented and executed (files) | Defects found or retested | Commit evidence (`git log --author`) |
|---|---|---|---|---|
| S1 | `[STUDENT-AUTHORED — S1 to write]` | `[STUDENT-AUTHORED — S1 to write]` | `[STUDENT-AUTHORED — S1 to write]` | `[STUDENT-AUTHORED — S1 to write]` |
| S2 | `[STUDENT-AUTHORED — S2 to write]` | `[STUDENT-AUTHORED — S2 to write]` | `[STUDENT-AUTHORED — S2 to write]` | `[STUDENT-AUTHORED — S2 to write]` |
| S3 | `[STUDENT-AUTHORED — S3 to write]` | `[STUDENT-AUTHORED — S3 to write]` | `[STUDENT-AUTHORED — S3 to write]` | `[STUDENT-AUTHORED — S3 to write]` |
| S4 | `[STUDENT-AUTHORED — S4 to write]` | `[STUDENT-AUTHORED — S4 to write]` | `[STUDENT-AUTHORED — S4 to write]` | `[STUDENT-AUTHORED — S4 to write]` |

## 13. Use of AI

AI tools were used to support test-case ideas, test-script generation, debugging, documentation and review, as the assignment permits. Test results in this report come from executing the tests on the group's own system; none is generated text. The load-profile script, the request-hardening tests and this report's structure were produced with AI assistance and checked by execution. Each student must be able to explain and reproduce the tests they present, and declares their own AI use under the CLEAR framework below.

- S1: `[STUDENT-AUTHORED CLEAR DECLARATION — S1]`
- S2: `[STUDENT-AUTHORED CLEAR DECLARATION — S2]`
- S3: `[STUDENT-AUTHORED CLEAR DECLARATION — S3]`
- S4: `[STUDENT-AUTHORED CLEAR DECLARATION — S4]`
