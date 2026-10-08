# Current execution evidence — 8 October 2026

Local HEAD: `3bb6c192a379f73eccbfea2745f6fee26fec87e4`. Working tree contained uncommitted changes; see [snapshot](evidence/2026-10-08-tests/revision.txt). No pull/reset was performed. GitHub develop showed a newer merge, so this run does not certify the later remote state.

## Actual execution

| Check | Command | Actual result | Evidence |
|---|---|---|---|
| Backend unit | `dotnet test backend/tests/UnitTests/FamilyVeda.UnitTests.csproj --no-restore` | 430 passed; 0 failed; 0 skipped | [backend-unit.txt](evidence/2026-10-08-tests/backend-unit.txt) |
| PostgreSQL integration | `dotnet test backend/tests/IntegrationTests/FamilyVeda.IntegrationTests.csproj --no-restore` | 30 passed; 0 failed; 0 skipped | [backend-integration.txt](evidence/2026-10-08-tests/backend-integration.txt) |
| React | `cd web && npx vitest run --maxWorkers=2` | 57 files; 343 passed | [web-tests.txt](evidence/2026-10-08-tests/web-tests.txt) |
| Flutter | `cd mobile && flutter test --no-pub` | 256 passed | [flutter-tests.txt](evidence/2026-10-08-tests/flutter-tests.txt) |
| Web lint | `cd web && npm run lint` | Exit 0 | [web-lint.txt](evidence/2026-10-08-tests/web-lint.txt) |
| Web build | `cd web && npm run build` | Exit 0; bundle-size warning retained | [web-build.txt](evidence/2026-10-08-tests/web-build.txt) |
| Flutter analyze | `cd mobile && flutter analyze --no-pub` | No issues found; exit 0 | [flutter-analyze.txt](evidence/2026-10-08-tests/flutter-analyze.txt) |

All commands exited 0. Total across the four suites: **1,059 passing tests**. Coverage was collected in a separate 8 October run; see [08_CURRENT_NONFUNCTIONAL_RESULTS.md](08_CURRENT_NONFUNCTIONAL_RESULTS.md). xUnit runs also retained TRX files. [Runtime versions](evidence/2026-10-08-tests/runtime-versions.txt).

## Selected tool-based safety and defect retests

The following named tests are independently recorded in the current integration TRX, which provides per-test outcomes. This is API/database proof, not a connected visual client workflow.

| Test | Current outcome |
|---|---|
| `FamilyVeda.IntegrationTests.RequestHardeningTests.EveryResponse_TellsBrowsersNotToSniffContentType(path: "/health")` | Passed |
| `FamilyVeda.IntegrationTests.GoldenCaseFlowTests.InvalidAgentSchema_FailsSafe_AndKeepsFamilyGuidanceUnavailable` | Passed |
| `FamilyVeda.IntegrationTests.GoldenCaseFlowTests.DoctorOriginalReport_UsesScopedAuthorizationAndSafeHeaders` | Passed |
| `FamilyVeda.IntegrationTests.AuthAndPatientFlowTests.PendingDoctor_IsForbiddenFromEveryClinicalQueueAndDecisionSurface` | Passed |
| `FamilyVeda.IntegrationTests.RequestHardeningTests.EveryResponse_TellsBrowsersNotToSniffContentType(path: "/api/v1/doctors/directory")` | Passed |
| `FamilyVeda.IntegrationTests.GoldenCaseFlowTests.SyntheticGoldenCase_RequiresApprovalBeforeFamilyCanReadGuidance` | Passed |
| `FamilyVeda.IntegrationTests.RequestHardeningTests.NulCharacterInQueryString_IsRejectedAsBadRequest_NotServerError` | Passed |
| `FamilyVeda.IntegrationTests.GoldenCaseFlowTests.PatientWithdrawal_RacesFullDoctorReview_ExactlyOneCanWin` | Passed |
| `FamilyVeda.IntegrationTests.AuthAndPatientFlowTests.RefreshToken_IsSingleUse_WhenSubmittedConcurrently` | Passed |

[Integration TRX](evidence/2026-10-08-tests/backend-integration.trx) · [unit TRX](evidence/2026-10-08-tests/backend-unit.trx).

## Evidence status

| Required evidence | Actual value / evidence |
|---|---|
| Current coverage per suite | Collected 8 October; [document 08](08_CURRENT_NONFUNCTIONAL_RESULTS.md), `evidence/2026-10-08-coverage/` |
| Load test execution | ApacheBench, 14,000 requests, 0 failed; [document 08](08_CURRENT_NONFUNCTIONAL_RESULTS.md) |
| New ZAP execution | 117 PASS / 0 FAIL / 2 WARN; `evidence/2026-10-08-zap/` |
| Connected Flutter → web doctor → Flutter journey | Executed, Failed/Partial; [document 09](09_CONNECTED_CLIENT_E2E.md) |
| Student personally executed tool demonstrations | |
| Student CLEAR declarations | |

The two blank rows are for each student to complete; blank is not a Pass or an exemption. The fix made afterwards for the two connected-client defects is recorded in [03_DEFECT_LOG.md](03_DEFECT_LOG.md).


## Verification qualifications

Golden workflow tests use deterministic stub agents; they prove approval/safe-failure API invariants, not hosted Gemini/Groq quality or a connected client demonstration. Flutter output contains missed-tap warnings despite the suite passing; retain and review those warnings rather than describe the run as warning-free. TRX files are present in this local evidence folder but may be Git-ignored; include them explicitly in the submission package if packaging it later.
