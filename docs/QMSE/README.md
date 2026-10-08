# QMSE Assignment 2

> **Current assessment status — 8 October 2026:** 1,059 suite tests passed. Current coverage/performance/ZAP evidence is in [08_CURRENT_NONFUNCTIONAL_RESULTS.md](08_CURRENT_NONFUNCTIONAL_RESULTS.md). Connected real clients were exercised in [09_CONNECTED_CLIENT_E2E.md](09_CONNECTED_CLIENT_E2E.md), with an unavailable hosted agent and two High defects (internal-note exposure; stale delay hides approved guidance). Overall report status remains **Partial / not submission-ready** until defects are fixed/retested and personal declarations are completed. Older tables below are dated historical evidence, not current certification.


Start with [ASSIGNMENT_2_COMPLETE_PACK.md](ASSIGNMENT_2_COMPLETE_PACK.md): requirements, retained testing report, cases, defects, results, screenshots, logs, remaining-work checklist and viva preparation.

All content is Markdown or original supporting evidence; no PDF was generated. Older tables are dated 5 October 2026; tests, coverage, performance, ZAP and the connected-client run were executed again on 8 October (see documents 07, 08 and 09). Pending work and student-authored sections are explicitly labelled.


Current iOS capture attempt: [8 October build and capture status](evidence/2026-10-08-ios/README.md). Build passed; current iOS login screenshot verified. Authenticated capture subsequently succeeded; see the current light-mode gallery below.


### Current iOS login - 8 October 2026

![Current Flutter iOS login](evidence/2026-10-08-ios/01-login.png)


## Current doctor iOS evidence - 8 October 2026

Fresh doctor screenshots are available in the [iOS evidence index](evidence/2026-10-08-ios/README.md#doctor-session-captured-after-user-sign-in). User sign-in and navigation were observed on iPhone 18 Pro Max / iOS 27.0. These supersede older screenshots for these screen appearances only; historical test results remain unchanged.

### Doctor dashboard

![Doctor dashboard](evidence/2026-10-08-ios/02-doctor-dashboard.png)

### Triage cases

![Triage cases](evidence/2026-10-08-ios/03-doctor-triage-cases.png)

### My Families

![My Families](evidence/2026-10-08-ios/04-doctor-families.png)

### Doctor calendar

![Doctor calendar](evidence/2026-10-08-ios/05-doctor-calendar.png)


Added 12 more current iOS screenshots: doctor availability/practice and Family Head dashboard, family, records, labs, vitals, triage, appointments, doctor, privacy and notifications. See the [updated gallery](evidence/2026-10-08-ios/README.md#additional-doctor-and-family-head-screenshots---8-october-2026).


## Current light-mode dashboards and tabs

See [8 October screenshot coverage and gallery](SCREENSHOT_GALLERY_2026-10-08.md) for 135 current screenshots across iOS Head/Adult/Doctor and web Head/Adult/Doctor/Admin. Observed errors and capture limits are documented there; historical test results are unchanged.


## Reconciled supporting report documents — 8 October

- [01_TEST_PLAN.md](01_TEST_PLAN.md)
- [02_TEST_CASES_MASTER.md](02_TEST_CASES_MASTER.md)
- [03_DEFECT_LOG.md](03_DEFECT_LOG.md)
- [04_TEST_EXECUTION_SUMMARY.md](04_TEST_EXECUTION_SUMMARY.md)
- [05_REPORT_COMPLETION_CHECKLIST.md](05_REPORT_COMPLETION_CHECKLIST.md)

These replace unsupported completion claims in the supplied drafts with dated evidence and explicit remaining work.


## Current test execution and Git contribution evidence

- [8 October execution results and logs](07_CURRENT_EXECUTION_EVIDENCE.md)
- [Author-specific test files, tools and commits](06_INDIVIDUAL_CONTRIBUTION_EVIDENCE.md)

Unknown personal details are intentionally blank. Current suites total 1,059 passing tests; current coverage is in document 08 and the connected-client E2E run is in document 09.


## Current coverage and non-functional evidence

[8 October coverage, performance and ZAP results](08_CURRENT_NONFUNCTIONAL_RESULTS.md) now includes actual artifacts. Coverage: unit24.71%, integration64.28%, React71.94%, Flutter75.75% lines (scopes differ). ApacheBench14,000 requests completed without failed/non-2xx responses. ZAP0 High/Medium,2 Low warning types retained. Connected UI E2E status is recorded separately.


## Connected client execution outcome

[8 October connected Flutter/web E2E](09_CONNECTED_CLIENT_E2E.md) was executed against isolated local infrastructure. Fresh case0021 failed safely because a hosted agent was unavailable. Seeded case0003 approval propagated to Flutter, but the run exposed High internal-note privacy and stale-delay navigation defects. Overall status remains Failed/Partial, not Pass; fixes/retests are pending.
