# Current coverage, performance and security — 8 October 2026

## Coverage results

| Suite | Passing tests | Line coverage | Branch coverage |
|---|---|---|---|
| Backend unit | 430 | 11,191 / 45,297 — 24.71% | 3,703 / 6,767 — 54.72% |
| PostgreSQL integration | 30 | 29,118 / 45,297 — 64.28% | 939 / 6,767 — 13.88% |
| React | 343 | 3,619 / 5,030 — 71.94% | 3,413 / 5,297 — 64.43% |
| Flutter | 256 | 8,632 / 11,396 — 75.75% | Not instrumented |

Backend scope includes Api, Application, Domain and Infrastructure, including generated migrations. Application unit coverage is 672/873 lines (76.98%); this does not establish an 80% touched-service gate. Unit/integration coverage is not merged or averaged. Flutter covers 122 files. Web also records functions 66.52% and statements 69.80%. All 1,059 tests pass; Flutter missed-tap warnings remain. The first web coverage attempt had an unretained log after output-folder cleanup; the preserved rerun passed.

### Coverage artifact index

- [backend-integration/891c168e-3283-4eb7-b4db-17a635143995/coverage.cobertura.xml](evidence/2026-10-08-coverage/backend-integration/891c168e-3283-4eb7-b4db-17a635143995/coverage.cobertura.xml)
- [backend-unit/0a87f8e9-51d8-4119-9cb9-aea69e654556/coverage.cobertura.xml](evidence/2026-10-08-coverage/backend-unit/0a87f8e9-51d8-4119-9cb9-aea69e654556/coverage.cobertura.xml)
- [coverage-summary-calculated.json](evidence/2026-10-08-coverage/coverage-summary-calculated.json)
- [mobile/lcov.info](evidence/2026-10-08-coverage/mobile/lcov.info)
- [web/report/assets/index.html](evidence/2026-10-08-coverage/web/report/assets/index.html)
- [web/report/clover.xml](evidence/2026-10-08-coverage/web/report/clover.xml)
- [web/report/components/auth/index.html](evidence/2026-10-08-coverage/web/report/components/auth/index.html)
- [web/report/components/layout/index.html](evidence/2026-10-08-coverage/web/report/components/layout/index.html)
- [web/report/components/records/index.html](evidence/2026-10-08-coverage/web/report/components/records/index.html)
- [web/report/components/shared/index.html](evidence/2026-10-08-coverage/web/report/components/shared/index.html)
- [web/report/coverage-final.json](evidence/2026-10-08-coverage/web/report/coverage-final.json)
- [web/report/index.html](evidence/2026-10-08-coverage/web/report/index.html)
- [web/report/pages/admin/index.html](evidence/2026-10-08-coverage/web/report/pages/admin/index.html)
- [web/report/pages/audit/index.html](evidence/2026-10-08-coverage/web/report/pages/audit/index.html)
- [web/report/pages/auth/index.html](evidence/2026-10-08-coverage/web/report/pages/auth/index.html)
- [web/report/pages/dashboard/index.html](evidence/2026-10-08-coverage/web/report/pages/dashboard/index.html)
- [web/report/pages/doctor/calendar/index.html](evidence/2026-10-08-coverage/web/report/pages/doctor/calendar/index.html)
- [web/report/pages/doctor/index.html](evidence/2026-10-08-coverage/web/report/pages/doctor/index.html)
- [web/report/pages/family/index.html](evidence/2026-10-08-coverage/web/report/pages/family/index.html)
- [web/report/pages/notifications/index.html](evidence/2026-10-08-coverage/web/report/pages/notifications/index.html)
- [web/report/pages/profile/index.html](evidence/2026-10-08-coverage/web/report/pages/profile/index.html)
- [web/report/pages/public/index.html](evidence/2026-10-08-coverage/web/report/pages/public/index.html)
- [web/report/pages/records/index.html](evidence/2026-10-08-coverage/web/report/pages/records/index.html)
- [web/report/pages/system/index.html](evidence/2026-10-08-coverage/web/report/pages/system/index.html)
- [web/report/pages/triage/index.html](evidence/2026-10-08-coverage/web/report/pages/triage/index.html)
- [web/report/routes/index.html](evidence/2026-10-08-coverage/web/report/routes/index.html)
- [web/report/services/index.html](evidence/2026-10-08-coverage/web/report/services/index.html)
- [web/report/store/index.html](evidence/2026-10-08-coverage/web/report/store/index.html)
- [web/report/store/slices/index.html](evidence/2026-10-08-coverage/web/report/store/slices/index.html)
- [web/report/styles/index.html](evidence/2026-10-08-coverage/web/report/styles/index.html)

### Rerun commands

```sh
dotnet test backend/tests/UnitTests/FamilyVeda.UnitTests.csproj --no-restore --collect:"XPlat Code Coverage" --results-directory docs/QMSE/evidence/2026-10-08-coverage/backend-unit
dotnet test backend/tests/IntegrationTests/FamilyVeda.IntegrationTests.csproj --no-restore --collect:"XPlat Code Coverage" --results-directory docs/QMSE/evidence/2026-10-08-coverage/backend-integration
cd web
npx vitest run --coverage --maxWorkers=2 --coverage.reportsDirectory=../docs/QMSE/evidence/2026-10-08-coverage/web/report
cd ../mobile
flutter test --no-pub --coverage --coverage-path=../docs/QMSE/evidence/2026-10-08-coverage/mobile/lcov.info
```

## Local performance run

ApacheBench is selected for authenticated, read-only API baselines: it produces reproducible concurrency, throughput, response-time and failure measurements. Assignment PDF pp.1–2 lists examples and “other appropriate monitoring/testing tools”; it does not exclusively require k6/JMeter. This run does not measure write paths, hosted-agent latency, sustained/ramped traffic or production SLAs.

Fresh disposable PostgreSQL, local API port5060, 14 endpoints ×1,000 requests, concurrency25. All14,000 requests completed with **zero failures and zero non-2xx**. p95 range **1–220ms**; slowest p95 is Family triage cases. No blanket performance acceptance was inferred.

[Full endpoint metrics](evidence/2026-10-08-nonfunctional/performance-load-profile.txt).

```sh
# Password supplied privately; never put its value in the report.
FV_TEST_API_BASE=http://127.0.0.1:5060/api/v1 FV_LOAD_REQUESTS=1000 FV_LOAD_CONCURRENCY=25 python3 scripts/e2e/local_load_profile.py
```

## Current ZAP scan

Independent disposable database/API5061, OpenAPI scan with synthetic Head authentication. **117 PASS / 0 FAIL / 2 WARN**, runner exit2 for warnings. High/Medium alert types:0; Low:2 types/4 instances; Informational:3 types. Retained low findings: CORP missing/invalid and Swagger unexpected Content-Type. No code/security changes were made for this scan.

184 imported URLs (456 URLs in total per the scan console); unresolved resource placeholders produced480 client-error instances. Generic schema-name import warnings and Head-only authentication limit coverage. Doctor/Admin scans are not claimed.

- [Scan summary](evidence/2026-10-08-zap/SUMMARY.md)
- [Token-free reproduction instructions](evidence/2026-10-08-zap/REPRODUCE.md)
- [ZAP Markdown report](evidence/2026-10-08-zap/zap-report.md)
- [ZAP HTML report](evidence/2026-10-08-zap/zap-report.html)
- [ZAP JSON report](evidence/2026-10-08-zap/zap-report.json)
- [Scan console](evidence/2026-10-08-zap/scan-output.txt)

## Environment observation

Chrome rejects API port5060 with ERR_UNSAFE_PORT. Direct API/performance requests on5060 worked; connected browser E2E uses5080 and React5175 instead. This is a test-environment setup correction, not an application defect fix.


## Doctor and Admin ZAP scans — 8 October

Same method as the Head scan, each on a fresh disposable database and local API (port 5091), authenticated with the seeded synthetic Doctor and Admin accounts.

| Role | PASS | FAIL | WARN | High | Medium | Low | Informational |
|---|---|---|---|---|---|---|---|
| Head | 117 | 0 | 2 | 0 | 0 | 2 types / 4 instances | 3 types |
| Doctor | 117 | 0 | 2 | 0 | 0 | 2 types / 7 instances | 3 types (459 client-error responses) |
| Admin | 117 | 0 | 2 | 0 | 0 | 2 types / 7 instances | 3 types (469 client-error responses) |

Role-only routes answered 200 under the matching token (`/doctors/me`, `/doctors/me/cases`; `/admin/doctors`, `/admin/family-heads`). The two Low warning types (Cross-Origin-Resource-Policy header, unexpected Content-Type on Swagger) are the same for all roles and remain open. Evidence: [Doctor](evidence/2026-10-08-zap-doctor/SUMMARY.md) · [Admin](evidence/2026-10-08-zap-admin/SUMMARY.md).

## Write-path and ramped load — 8 October

Script `scripts/e2e/local_write_load_profile.py`, local API and disposable database, synthetic Family Head.

| Write path | Requests | Result | p50 | p95 |
|---|---|---|---|---|
| Create symptom episode | 20 | 20 × 201 | 3.8 ms | 6.6 ms |
| Submit triage case | 20 | 20 × 202 | 10.9 ms | 16.4 ms |

Ramp on `GET /dashboard/family`, 2,000 requests per step, zero failed and zero non-2xx at every step:

| Concurrency | Requests/s | p50 | p95 | p99 |
|---|---|---|---|---|
| 10 | 371 | 24 ms | 45 ms | 70 ms |
| 25 | 432 | 53 ms | 90 ms | 113 ms |
| 50 | 447 | 104 ms | 165 ms | 227 ms |
| 100 | 437 | 208 ms | 367 ms | 407 ms |

Interpretation: throughput levels off at about 430–450 requests/s from concurrency 25, after which extra load only adds latency. At 100 concurrent connections a separate `psql` session was refused with "too many clients", so the database connection limit is the first resource to saturate; the API itself returned no errors. No LLM keys were supplied in this run, so the 20 submitted cases ended `FailedSafe` / `AGENT_UNAVAILABLE` and agent latency is not part of these figures. Limits: one local machine, Debug build with SQL logging, one read endpoint, sequential writes. Evidence: [summary and rerun command](evidence/2026-10-08-nonfunctional/SUMMARY-write-ramp.md) · [raw output](evidence/2026-10-08-nonfunctional/write-and-ramp-load-profile.txt).
