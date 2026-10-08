# Test execution summary

> Reconciled on 8 October 2026 against retained repository evidence. No tests were rerun during this document review. Results dated 5 October are historical and do not certify the latest working tree.

## 4. Automated Suite Results

Table 3 reports the retained 2026-09-28 execution alongside the final local rerun on 2026-10-05 at commit `613bf7e` on `develop`. The rerun output is retained under `evidence/2026-10-05/`. Results are reported as observed, including failures.

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



## Non-functional results

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

After the two fixes the scan was repeated: 117 rules passed, none failed, and only warnings 3 and 4 remained. The summary and both full reports are retained in `evidence/2026-10-05/security-zap-summary.txt`, `zap-first-run/` and `zap-retest/`.

The scan has limits. It ran with one role's token, so it did not test whether a Doctor or Clinic Admin token can reach another role's data; that property is covered by the access-control tests SEC-1 to SEC-5 instead. It tested the API only, not the web or mobile clients. The evaluation as a whole remains **automated testing, not a penetration test**: session-management attacks, business-logic abuse and independent review were not performed (see Section 10).

## 7. Performance Testing

Performance was measured with ApacheBench against a disposable local API and PostgreSQL 16 database loaded with the synthetic seed data. The script `scripts/e2e/local_load_profile.py` signs in as a synthetic Family Head and a synthetic Doctor, then sends 1,000 requests at a concurrency of 25 to each of fourteen read endpoints: 14,000 requests in total. It refuses any non-local host and fails if any request fails or returns a non-2xx status. Table 7 reports the result; the raw output is retained in `evidence/2026-10-05/performance-load-profile.txt`.

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



## Completion assessment

The four main suite logs show 337 + 29 + 308 + 214 = **888 historical passing tests**. This is a suite total, not 888 independent report cases; AI/security subsets must not be added again. Coverage scopes are separate and no 84.8% overall coverage is supported. Full connected client E2E remains Partial. Performance is a local read-only ApacheBench baseline, not a k6 triage-write measurement or production SLA certification. ZAP retest retains two low-risk warnings and used one role token.

135 current light-mode screenshots document navigation only: [gallery](SCREENSHOT_GALLERY_2026-10-08.md). Report is not final submission-ready until the [completion checklist](05_REPORT_COMPLETION_CHECKLIST.md) is resolved.


## Latest execution update

8 October local working-tree rerun: **430 backend + 30 PostgreSQL integration + 343 React + 256 Flutter = 1,059 passed**. Web lint/build and Flutter analyze also passed. [Commands, logs, TRX and limits](07_CURRENT_EXECUTION_EVIDENCE.md). Historical coverage remains separate.


## Current coverage and non-functional evidence

[8 October coverage, performance and ZAP results](08_CURRENT_NONFUNCTIONAL_RESULTS.md) now includes actual artifacts. Coverage: unit24.71%, integration64.28%, React71.94%, Flutter75.75% lines (scopes differ). ApacheBench14,000 requests completed without failed/non-2xx responses. ZAP0 High/Medium,2 Low warning types retained. Connected UI E2E status is recorded separately.


## Connected client execution outcome

[8 October connected Flutter/web E2E](09_CONNECTED_CLIENT_E2E.md) was executed against isolated local infrastructure. Fresh case0021 failed safely because a hosted agent was unavailable. Seeded case0003 approval propagated to Flutter, but the run exposed High internal-note privacy and stale-delay navigation defects. Overall status remains Failed/Partial, not Pass; fixes/retests are pending.
