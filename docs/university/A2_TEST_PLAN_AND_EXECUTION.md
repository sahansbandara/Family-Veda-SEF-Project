# Assignment 2 Test Plan and Execution Record

**System:** Family Veda
**Assessment:** SE3090 Assignment 2 — Software Testing and Quality Evaluation
**Evidence rule:** This document records only executions reported for this worktree. Source-code presence is not treated as execution evidence. No timings, student results, performance results, security results or defect outcomes are inferred.

## 1. Scope

The test scope is the integrated Family Veda system: ASP.NET Core API and application services, PostgreSQL persistence, React web client, Flutter mobile client, cross-portal journeys, agent orchestration and safety controls. The plan covers normal, invalid, boundary and failure paths, plus performance and security testing required by the Assignment 2 brief.

The intended integrated workflow is a synthetic user journey through the API and database, with agent processing where applicable, followed by the relevant web approval or patient-facing result. Real patient data, NICs and SLMC numbers are excluded.

## 2. Risks

| Risk | Test response |
|---|---|
| Authorization or privacy leakage | Backend integration and privacy tests; security testing pending. |
| Invalid or unsafe agent output reaches a user | Schema, safety, denial and emergency-path tests; full cross-portal golden trace pending. |
| Database or migration incompatibility | PostgreSQL integration and migration tests; Neon migration history and index checks verified. Hosted doctor workflow remains pending. |
| Client/API contract mismatch | Web and Flutter test suites plus synthetic API journey; full cross-platform trace remains pending. |
| Service or workflow failure is reported as success | Failure-path tests and defect/retest records; external-service and performance evidence pending. |

## 3. Environment and tools

### Executed environment

- Local Family Veda checkout in the `portal-e2e` worktree.
- ASP.NET Core backend with PostgreSQL integration environment.
- React web test, lint and build environment.
- Flutter 3.47.5/Dart 3.13.4 was installed locally after the initial toolchain block.
- Synthetic test data only.

### Planned tools and responsibilities

| Area | Tool/evidence | Responsibility | Status |
|---|---|---|---|
| Backend/API | .NET unit and integration test runners | Backend owners | Executed results recorded below |
| Database | PostgreSQL integration tests and migration evidence | Backend/database owners | Integration results recorded; hosted doctor-constraint migration applied and indexes verified on Neon production |
| React | Web test runner, lint and production build | Web owners | Executed results recorded below |
| Flutter | Flutter test/analyze/build and device run | Mobile owners | Analyze and tests passed; hosted-API Android APK built, installed and authenticated as synthetic Head on API 36 emulator; doctor approval journey pending |
| E2E | Browser/mobile integrated journey evidence | Group | Partial local journey; complete golden trace pending |
| Performance | ApacheBench against a disposable local API and synthetic account | Group | Local baseline executed; broader workflow load pending |
| Security | Dependency vulnerability audits and application security testing | Group | Production npm and API NuGet dependency audits executed; application security testing pending |
| Agent evaluation | Schema, denial, emergency, recovery and golden-case evidence | Agent owners | Component tests executed; full cross-portal trace pending |

## 4. Test cases and execution record

| ID | Area | Preconditions / input | Expected result | Actual result | Status |
|---|---|---|---|---|---|
| A2-BE-01 | Backend unit | Backend unit test suite with synthetic fixtures | Unit tests complete without failures | 91/91 passed | Pass |
| A2-DB-01 | PostgreSQL integration | Local PostgreSQL integration environment and synthetic data | Integration tests complete without failures | 11/11 passed, including synthetic golden and safe-failure tests | Pass |
| A2-WEB-01 | React | Web test suite | Web tests complete without failures | 40/40 passed | Pass |
| A2-WEB-02 | React quality gate | Web source and production configuration | Lint and build complete successfully | Lint and build passed | Pass |
| A2-API-01 | Synthetic API journey | Synthetic accounts and local API/PostgreSQL 16 | Family Head, Adult Member and Doctor journey completes with privacy denial | Repeatable local script passed join by code, doctor acceptance, 45-minute booking/confirmation, dashboards, notifications and Head 404 on adult records after local fixes | Pass |
| A2-API-02 | Doctor acceptance regression | PostgreSQL 16 integration fixture with an already assigned doctor and legacy pending request | Acceptance succeeds without inserting a duplicate assignment | HTTP 200, one assignment and Accepted request status; included in 11/11 passing integration tests | Pass |
| A2-DB-02 | Doctor concurrency constraints | Competing PostgreSQL writes for pending requests and active primary assignments; concurrent API accept/decline | At most one pending request, one active primary assignment, and one request decision with matching audit | One database write won each pair; API decision races returned one 200 and one 409 with one matching audit; 11/11 integration tests passed | Pass |
| A2-DB-03 | Idempotent migration | Fresh disposable PostgreSQL 16, original two migrations, then doctor-constraint script twice | Both runs succeed, one history row per migration | Both doctor-constraint script runs exited 0; migration history listed three distinct IDs | Pass |
| A2-DB-04 | Populated migration and rollback | Legacy database with assignment/request history; conflicting legacy database; repeated assignment after upgrade | Preserve rows, reject conflicting upgrade atomically, refuse unsafe rollback | PostgreSQL integration tests confirmed preservation, atomic abort and safe rollback refusal | Pass |
| A2-MOB-01 | Flutter | Flutter 3.47.5/Dart 3.13.4 against current dependency set | Analyze and tests complete without errors | `flutter analyze`: no issues; `flutter test`: 69/69 passed | Pass |
| A2-MOB-02 | Android emulator booking | Synthetic seeded Head on API 36 emulator connected to local API/PostgreSQL 16 | Select 45 minutes and 10:00 AM, submit booking, see the same local time in appointment list | Debug APK installed; database row persisted `duration_minutes=45`, and list displayed Sep 30, 2026 10:00 AM after time-zone fix | Pass |
| A2-MOB-03 | Hosted-API Android APK | Flutter 3.47.5, Android API 36 emulator, production API URL supplied at build time | APK builds, installs and opens | Debug-signed 159 MB APK built and installed; synthetic demo Head signed in and loaded dashboard, appointments and notifications. Four screenshots retained under `docs/evidence/2026-09-28/`. Hosted doctor approval and family guidance journey remains pending. | Partial |
| A2-E2E-01 | Complete integrated workflow | Flutter → API/database/agents → React approval → Flutter result | Complete synthetic golden case and safe-failure case are demonstrated and retained | Deterministic PostgreSQL API tests passed 2/2: agents → assigned verified doctor grant → allowlisted approval → family guidance read; invalid schema → persisted safe-failure trace and guidance 404. Full cross-platform visual trace remains pending. | Partial |
| A2-PERF-01 | Performance | ApacheBench, local Kestrel/PostgreSQL 16, synthetic authenticated doctor-directory request; 200 requests at concurrency 10 | Zero failed/non-2xx responses and measured latency | 200 completed, 0 failed, 1.827 ms mean request time, 4 ms p99; 5473.00 requests/s in a retained local rerun | Pass (local baseline) |
| A2-SEC-01 | Security | xUnit access-control/privacy tests and unauthenticated live API/CORS smoke checks | Deny unapproved guidance, unverified doctor actions, stale grants, and unauthenticated access | Focused xUnit run: 3 integration + 11 unit tests passed. Three protected live routes returned 401; untrusted-origin preflight had no allow-origin header. This is scoped automated application security testing, not a penetration test. | Pass (scoped) |
| A2-SEC-02 | Dependency audit | Web production dependencies, `npm audit --omit=dev --audit-level=high` | No reported known vulnerabilities | `found 0 vulnerabilities` from npm registry on 2026-09-28 | Pass |
| A2-SEC-03 | Dependency audit | API direct and transitive packages, `dotnet list backend/src/Api/FamilyVeda.Api.csproj package --vulnerable --include-transitive` | No reported known vulnerabilities | NuGet reported no vulnerable packages on 2026-09-28 | Pass |

## 5. Defect and retest log

| Defect | Reproduction / observed result | Severity | Fix/retest status |
|---|---|---|---|
| D-001 — doctor acceptance returned HTTP 500 in the older local API journey | Execute the synthetic local API journey through the doctor-acceptance step; the journey passed up to that step, which returned HTTP 500. | High: legitimate doctor request could not complete | Local fix retested with a PostgreSQL 16 integration test: HTTP 200, one assignment and Accepted request status. This retest covers the original duplicate-assignment case; concurrent acceptances remain open as a separate issue. |
| D-002 — Flutter dependency/toolchain incompatibility | Initial verification used Flutter 3.41.2/Dart 3.11 while `camera ^0.12.1` requires Dart 3.12. | Blocker for Flutter execution | Local Flutter SDK upgraded to 3.47.5/Dart 3.13.4; `flutter analyze` and all 69 tests passed. Hosted-API APK was built, installed and signed in as synthetic Head on Android API 36 emulator. |
| D-003 — doctor dashboard HTTP 500 | In the first local synthetic journey, `GET /api/v1/dashboard/doctor` failed after appointment confirmation. A non-UTC `DateTimeOffset` day boundary was passed to Npgsql. | High: doctor dashboard unavailable | Changed the query boundary to UTC; PostgreSQL dashboard integration check and repeat local journey passed. |
| D-004 — Android appointment time displayed in UTC | Booking form selected Sep 30 at 10:00 AM, but appointment list showed 4:30 AM in the Sri Lanka emulator. The API returned the same instant in UTC. | Medium: misleading appointment time | Parse the API timestamp into device-local time in the Flutter appointment model. Unit test, rebuild and emulator retest show 10:00 AM; synthetic PostgreSQL row retains the correct instant and 45-minute duration. |
| D-005 — golden-case test used wrong doctor path | Deterministic PostgreSQL test submitted a synthetic episode, ran the three agents, then called the shared-pool `/claim` route after triage had already granted the primary doctor access. The route returned 409. The web doctor portal labels such cases “Granted” and offers Claim only to pool cases. | Test design error; no production defect established | Corrected test expects 409 for redundant claim and approves through existing grant. Focused 2/2 and full integration 11/11 passed. |

## 6. Execution summary

Executed evidence currently supports:

- Backend unit tests: **91/91 passed**.
- PostgreSQL integration tests: **11/11 passed** including the doctor-acceptance, concurrency, populated-migration, synthetic golden-case and safe-failure checks.
- React tests: **40/40 passed**.
- React lint and production build: **passed**.
- Flutter analysis: **no issues**; Flutter tests: **69/69 passed** on Flutter 3.47.5/Dart 3.13.4.
- Android API 36 emulator: **debug APK installed**; synthetic 45-minute booking passed and local appointment time displayed correctly. Screenshots: `docs/evidence/android_duration_picker.png`, `docs/evidence/android_appointment_local_time.png`.
- Production web and API dependency vulnerability audits: **no known vulnerabilities reported** by their configured registries on 2026-09-28. This does not replace application security testing.
- Local synthetic API journey: **passed** after fixes using `scripts/e2e/synthetic_portal_journey.py`; covers three roles and privacy. A full Flutter UI → API/agents → React approval → Flutter result golden case remains pending.
- Local directory load baseline: **200/200 requests completed, zero failures**, 1.827 ms mean and 4 ms p99 at concurrency 10 in a retained rerun. This short local run does not establish production capacity or cover agent workflow latency.

The following remain incomplete for an Assignment 2 evidence package: complete integrated workflow and safe-failure trace, physical-device execution, broader workflow performance testing, wider application security testing, and retained tool output for every claimed result. The deployed notifications page previously failed to load. A synthetic Family Head browser retest on 2026-09-28 reached its ready empty state after the follow-up Neon migration. Retain the exact authenticated API response and a doctor-account journey before closing the deployment defect for all roles.

## 7. Evidence and reporting requirements

Retain command output or tool-generated reports for every claimed result. Add the exact test command, revision, environment, date, actual output, defect identifier and retest result when each pending item is executed. Do not convert pending, blocked or source-only evidence into a pass claim.

### 2026-09-28 local command evidence

Run from the repository root unless noted:

```text
dotnet test backend/tests/UnitTests/FamilyVeda.UnitTests.csproj --no-restore --verbosity quiet
Passed: 91, Failed: 0, Skipped: 0

dotnet test backend/tests/IntegrationTests/FamilyVeda.IntegrationTests.csproj --no-restore --verbosity quiet
Passed: 11, Failed: 0, Skipped: 0 (PostgreSQL 16 Testcontainers; retained output `docs/evidence/2026-09-28/backend-integration.txt`)

cd web && npm test -- --run && npm run lint && npm run build
Tests: 40 passed; lint and build exited 0

cd mobile && flutter analyze && flutter test
No issues found; 69 tests passed (Flutter 3.47.5, Dart 3.13.4)

cd web && npm audit --omit=dev --audit-level=high
found 0 vulnerabilities

dotnet list backend/src/Api/FamilyVeda.Api.csproj package --vulnerable --include-transitive
No vulnerable packages reported by the configured NuGet source
```

The idempotent doctor-constraint SQL script was also applied twice on a fresh disposable PostgreSQL 16 after the first two migrations. Both runs exited 0; `__EFMigrationsHistory.migration_id` listed all three migration IDs once. These are local results; the report still needs retained CI/deployment artifacts and member-owned test evidence.

`FV_TEST_PASSWORD=<local synthetic seed password> python3 scripts/e2e/synthetic_portal_journey.py` exited 0 against a disposable local API/PostgreSQL 16 on 2026-09-28. It mutates synthetic local data and refuses remote API hosts.

`FV_TEST_PASSWORD=<local synthetic seed password> python3 scripts/e2e/local_performance_check.py` exited 0 against the same disposable local environment on 2026-09-28. A retained rerun of ApacheBench reported 200 completed requests, 0 failed requests, 1.827 ms mean request time, 4 ms p99 and 5473.00 requests/s at concurrency 10. The script fails on non-2xx responses and rejects remote hosts.
