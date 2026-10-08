# Defect log and retest evidence

> Reconciled on 8 October 2026 against retained repository evidence. No tests were rerun during this document review. Results dated 5 October are historical and do not certify the latest working tree.

## 8. Defect Report and Retest Evidence

Table 8 is the defect report: each defect recorded during execution of the test plan, with its reproduction steps, cause, fix, retest outcome and current status.

*Table 8 – Defect and Retest Log*

| ID | Description | Severity / priority | Steps to reproduce | Root cause | Fix and retest result | Status | Evidence |
|---|---|---|---|---|---|---|---|
| D-001 | Doctor acceptance returned HTTP 500 | High / P1 | Run the synthetic API journey to the doctor-acceptance step with a doctor already assigned | Duplicate assignment inserted for an already assigned doctor | Fixed; integration test returns HTTP 200 with one assignment and request Accepted | Closed | `AuthAndPatientFlowTests` (TC A2-API-02) |
| D-002 | Flutter verification blocked | Blocker / P1 | Run `flutter pub get` on Flutter 3.41.2 / Dart 3.11 | `camera ^0.12.1` requires Dart 3.12 | SDK upgraded to Flutter 3.47.5 / Dart 3.13.4; analyze clean and tests pass | Closed | `../evidence/2026-09-28/flutter-tests.txt` |
| D-003 | Doctor dashboard returned HTTP 500 | High / P1 | Confirm an appointment, then `GET /api/v1/dashboard/doctor` | Non-UTC `DateTimeOffset` day boundary passed to Npgsql | Query boundary changed to UTC; integration check and repeat journey passed | Closed | `../evidence/2026-09-28/backend-integration.txt` |
| D-004 | Android appointment time shown in UTC | Medium / P2 | On a Sri Lanka-time emulator, book 10:00 AM and open the appointment list; 4:30 AM is shown | Model displayed the API instant without converting to device-local time | Timestamp parsed to local time; unit test and emulator retest show 10:00 AM | Closed | `docs/evidence/android_appointment_local_time.png` |
| D-005 | Golden-case test returned HTTP 409 | Test design error / P3 | Run the golden-case test, which called `/claim` on a case the primary doctor already held | Test used the shared-pool route for an already granted case | Test corrected to expect 409 and approve through the existing grant; 2/2 passed | Closed | `GoldenCaseFlowTests` |
| D-006 | Hosted doctor dashboard rendered blank | High / P1 | Sign in as the synthetic verified doctor on the hosted web app and open `/dashboard` | API returns an integer count; the client expected an array | Client contract corrected (PR #49) and redeployed; panel renders with no console errors; regression test added | Closed | `../evidence/2026-09-28/web-tests.txt` |
| D-007 | Sample metrics shown above live doctor metrics | Medium / P2 | After the D-006 fix, open the doctor `/dashboard`; hard-coded counts disagree with live counts | Static sample content rendered alongside the live panel | Route changed to render the live panel only (`DashboardPage.tsx` returns `DoctorDashboardPanel` for doctors). Retested on the current `develop` build against a local API on 2026-10-05 (final report, Section 4.3): live panel only. A sign-in retest on the hosted site was not performed | Closed (local retest) | final report Figure 4.8; `docs/university/RELEASE_EVIDENCE_2026-09-28.md` |
| D-008 | Two vitals-panel web tests fail | Medium / P2 | In `web/`, run `npx vitest run src/pages/records/VitalsPanel.test.tsx` at `613bf7e` | The redesign of the vitals panel removed the history table and its type filter, but two tests still asserted them; the product behaved as designed and the tests were obsolete | The history-table assertion was removed from one test and the filter test was deleted; recorded readings remain covered by the per-vital dialog test. Retest: web suite passed in full | Closed | `evidence/2026-10-05/web-tests.txt`, `web-tests-retest.txt` |
| D-009 | Web lint and production build fail | High / P1 | In `web/`, run `npm run lint` then `npm run build` at `613bf7e` | Unused `Link` import left in `RecordsPage.tsx` (ESLint `no-unused-vars`, TypeScript TS6133) | Import removed. Retest: lint exit 0, build exit 0 | Closed | `evidence/2026-10-05/web-lint-build.txt`, `web-lint-build-retest.txt` |
| D-010 | Patient vital charts drew a hard-coded "normal" band | High / P1 (clinical safety) | In the web app open Health Records → Vitals at `613bf7e`; each chart shows a green reference band and limits | Fixed reference limits were written into the web client and passed to the chart. One fixed range cannot fit every member (age, pregnancy, measurement context), and showing it classifies a reading for the patient without a doctor, contrary to safety rules 1, 2 and 4. Found by automated pull-request review | Limits removed from the client; the chart now draws recorded values and their average only. A guard test asserts that no reference range is drawn. Retest: web suite 308 / 308, lint and build exit 0 | Closed | `VitalsPanel.test.tsx`; pull request #160 |
| D-011 | Server error on a NUL character in a query string | Medium / P2 | `GET /api/v1/doctors/directory?search=%00` against the API | The character reached PostgreSQL, which cannot store it in text; the failure surfaced as HTTP 500 instead of a client error. Found by the OWASP ZAP scan | `RequestHardeningMiddleware` rejects such a query string with HTTP 400 problem details. Retest: integration test passed; ZAP rescan no longer reports a server error | Closed | `RequestHardeningTests`; `evidence/2026-10-05/security-zap-summary.txt` |
| D-012 | `X-Content-Type-Options` header missing from API responses | Low / P3 | Inspect the response headers of any API route | The header was never set. Found by the OWASP ZAP scan | The middleware adds `nosniff` to every response. Retest: integration test passed; ZAP rescan no longer reports it | Closed | `RequestHardeningTests`; `zap-retest/` |

Priority follows severity: P1 blocks a user journey or the build, P2 misleads without blocking, and P3 affects only the test suite. D-009 is rated high because a failing build blocks the CI quality gate and the web deployment.

Two of these defects, D-003 and D-006, are instructive. D-003 was found only because the integration tests ran against real PostgreSQL, where Npgsql rejects a non-UTC offset that an in-memory provider would have accepted. D-006 was a contract mismatch between client and API that component tests with mocked data did not detect, and it was found by a live synthetic sign-in; a regression test now guards it. Related deployment findings (a hosted Swagger 500 from a duplicate schema identifier, and a notifications page that previously failed to load until a follow-up Neon migration) were also corrected and are recorded in the release evidence.



## Current capture observations awaiting investigation

| ID | Observation | Reproduction | Status / evidence |
|---|---|---|---|
| OBS-IOS-01 | Adult Join Requests and Invitations showed a safe error | Synthetic Adult account → My Family → respective tab on 8 October | Open observation, not a confirmed root cause or fix; see [gallery](SCREENSHOT_GALLERY_2026-10-08.md) |
| OBS-IOS-02 | Simulator startup/freeze recovered after runtime relaunch | Earlier iOS capture session under heavy host load | Recovered runtime only; permanent app fix not established |

## Supplied defect claims needing corroboration

The supplied DEF-001–DEF-008 identifiers are separate from retained D-001–D-012 and must not replace them. Supplied claims about validator DI, Npgsql migration probing, Windows file modes, shell configuration, emergency prechecks, consent cache invalidation, Docker wrappers and large-PDF uploads require first-run logs, exact fix commit and retest evidence. DEF-008 has no detailed report in the supplied file. A stopped Docker daemon is an environment blocker; an in-memory fallback does not prove PostgreSQL integration. No new clinical/security defect or resolution is inferred from draft prose.


## Newly observed connected-client defects — 8 October

### QMSE-20261008-01 — Doctor-only internal note visible to patient

Severity: **HIGH**. Status: Fixed in commit `bed063f` ([PR #176](https://github.com/sahansbandara/Family-Veda-SEF-Project/pull/176)); automated retest Passed; the same approved case was re-viewed on web and Flutter after the fix (document 09).

Precondition: seeded Adult case0003 pending review in isolated DB. Web Doctor enters a harmless marker in Internal Clinical Notes (labelled doctor-only), approves with existing final-guidance template. Patient GET case returns the marker in latestDecisionReason; Flutter renders it under Doctor response. Expected: internal notes never enter patient DTO/UI. Actual: exact marker exposed. Source: Infrastructure/Component3_Triage/Triage/TriageService.cs:353 maps DoctorNotes to LatestDecisionReason; mobile/lib/screens/triage/case_status_screen.dart:98 and web/src/pages/triage/TriagePage.tsx:592 render it. Web patient rendering is source-confirmed, not independently UI-run in this session.

### QMSE-20261008-02 — Approved case retains delayed-review state and hides guidance button

Severity: **HIGH** functional. Status: Fixed in commit `bed063f` ([PR #176](https://github.com/sahansbandara/Family-Veda-SEF-Project/pull/176)); automated retest Passed; the same approved case was re-viewed on web and Flutter after the fix (document 09).

Same case became Approved; approved-guidance returned200 with the selected final text. failureCode remained DOCTOR_RESPONSE_DELAY. Flutter delayed branch displayed doctor-not-responded warning and suppressed View approved guidance. Expected: approval clears/reconciles obsolete delay and offers approved guidance. Actual: contradictory terminal/progress state. See mobile/lib/screens/triage/case_status_screen.dart:83–115 and current patient response/accessibility evidence.

[Connected E2E evidence, steps and assertions](09_CONNECTED_CLIENT_E2E.md). The observations were recorded before any fix. Personal discoverer, student fixer and retester fields remain blank; these observations were collected by Codex.


### Fix and retest evidence — 8 October

| Step | Tool | Actual result | Evidence |
|---|---|---|---|
| Before fix | xUnit + Testcontainers PostgreSQL, `ApprovedCase_NeverReturnsInternalDoctorNotes_AndClearsStaleDelayMarker` | Failed: patient response contained the marker note in `latestDecisionReason` and `failureCode` `DOCTOR_RESPONSE_DELAY` | [01-before-fix-integration.txt](evidence/2026-10-08-defect-retest/01-before-fix-integration.txt) |
| After fix, API | Full integration suite | 31 passed, 0 failed (30 earlier tests plus the new regression test) | [02-after-fix-integration.txt](evidence/2026-10-08-defect-retest/02-after-fix-integration.txt) |
| After fix, React | Vitest + React Testing Library, `TriagePage.test.tsx` | 12 passed, including "never renders internal doctor notes in the patient doctor-response card" | [03-after-fix-web.txt](evidence/2026-10-08-defect-retest/03-after-fix-web.txt) |
| After fix, Flutter | flutter_test, `case_status_screen_test.dart` | 4 passed, including "approved case hides a stale delay marker and never shows internal doctor notes" | [04-after-fix-flutter.txt](evidence/2026-10-08-defect-retest/04-after-fix-flutter.txt) |

Fix summary: the patient case DTO no longer carries `Approval.DoctorNotes`; both clients stopped rendering `latestDecisionReason`; a final doctor decision clears `DOCTOR_RESPONSE_DELAY`, and the Flutter status screen ignores that marker once a decision exists. No migration. Consequence to note: patients now see only the fixed decision label for Request-information and Reject decisions, not free text.

Rerun: `dotnet test backend/tests/IntegrationTests/FamilyVeda.IntegrationTests.csproj --filter "FullyQualifiedName~ApprovedCase_NeverReturnsInternalDoctorNotes"`.


### QMSE-20261008-03 — Adult sees errors on Head-only family tabs (was OBS-IOS-01)

Severity: **MEDIUM**. Status: Fixed; automated retest Passed; not re-run on a device.

Cause: the Flutter Members screen showed Join Requests and Invitations to every user and loaded two providers whose endpoints are Head-only, so an Adult got "Something went wrong". Fix: those tabs and providers are used only for a Family Head; Adults keep Members, incoming invitations and Settings. The React app already hid these for Adults.

| Step | Result | Evidence |
|---|---|---|
| Before fix, new widget test "hides Head-only tabs and never calls Head-only providers for an Adult" | Failed | [05-before-fix-flutter-adult-family.txt](evidence/2026-10-08-defect-retest/05-before-fix-flutter-adult-family.txt) |
| After fix, `members_screen_test.dart` | 2 passed | [06-after-fix-flutter-adult-family.txt](evidence/2026-10-08-defect-retest/06-after-fix-flutter-adult-family.txt) |
| Full Flutter suite and analyze | 258 passed; no issues | same run |

### QMSE-20261008-04 — API journey script expected 404 for a private record list

Severity: **LOW** (test defect, not a product defect). Status: Fixed.

`scripts/e2e/synthetic_portal_journey.py` expected 404 when a Head lists an adult's records. The tested contract (`AdultReportSharingTests`) is an empty list with 200 for lists and 404 for single-record reads; no private data was returned. The script now asserts the empty list, and its doctor lookup no longer depends on a stale display name. Retest: the full journey passed on a fresh disposable database ([07-after-fix-api-journey.txt](evidence/2026-10-08-defect-retest/07-after-fix-api-journey.txt)).
