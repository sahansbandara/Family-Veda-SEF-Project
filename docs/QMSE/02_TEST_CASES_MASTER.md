# Master test case register

> Reconciled on 8 October 2026 against retained repository evidence. No tests were rerun during this document review. Results dated 5 October are historical and do not certify the latest working tree.

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



## Supplied candidate scenarios — not verified executions

The supplied file states 44 cases but contains 41 case rows. These are retained as planning candidates; their original PASS/actual claims are not accepted without a matching test method, command, revision and log. Endpoint names, response codes, bounds and safety expectations must be checked against current code before execution. The supplied example password is intentionally omitted.

| Candidate ID | Category | Layer | Scenario | Status |
|---|---|---|---|---|
| TC-S1-001 | Normal | Backend API | User registration with valid synthetic credentials | Not verified; planned only |
| TC-S1-002 | Invalid | Backend API | Register with invalid email format | Not verified; planned only |
| TC-S1-003 | Boundary | Web (Vitest) | Password length boundary validation | Not verified; planned only |
| TC-S1-004 | Failure | Backend API | Login with incorrect password | Not verified; planned only |
| TC-S1-005 | Normal | Backend Unit | Consent State Machine grant transition | Not verified; planned only |
| TC-S1-006 | Invalid | Backend Unit | Consent Revocation invalid transition | Not verified; planned only |
| TC-S1-007 | Security | Backend API | RBAC unauthorized endpoint access | Not verified; planned only |
| TC-S1-008 | Security | Backend Unit | Tool Dispatcher unauthorized tool denial | Not verified; planned only |
| TC-S1-009 | Normal | Mobile (Flutter) | Login screen widget rendering and successful submission | Not verified; planned only |
| TC-S1-010 | Boundary | Database | Unique constraint on User Email | Not verified; planned only |
| TC-S2-001 | Normal | Backend API | Upsert manual health record with vitals | Not verified; planned only |
| TC-S2-002 | Invalid | Backend API | Record vitals with negative numbers | Not verified; planned only |
| TC-S2-003 | Boundary | Backend Unit | Lab extraction parser upper reference boundary | Not verified; planned only |
| TC-S2-004 | Failure | Backend Unit | Lab report parser on unreadable / corrupted file | Not verified; planned only |
| TC-S2-005 | Normal | Web (Vitest) | Recorded Range Visual component indicator | Not verified; planned only |
| TC-S2-006 | Boundary | Web (Vitest) | Empty record list rendering | Not verified; planned only |
| TC-S2-007 | Normal | Mobile (Flutter) | Lab report file picker and upload preview | Not verified; planned only |
| TC-S2-008 | Database | Database | Foreign key cascade deletion rule | Not verified; planned only |
| TC-S2-009 | Failure | Backend Unit | Lab extraction safety with synthetic clinical override | Not verified; planned only |
| TC-S2-010 | Boundary | Database | JSONB LabValues serialization bounds | Not verified; planned only |
| TC-S3-001 | Normal | Backend API | Submit symptom triage complaint | Not verified; planned only |
| TC-S3-002 | Invalid | Backend API | Submit empty complaint description | Not verified; planned only |
| TC-S3-003 | Boundary | Backend API | Maximum symptom character limit check | Not verified; planned only |
| TC-S3-004 | Failure | AI Evaluation | LLM Provider Timeout & Fallback Execution | Not verified; planned only |
| TC-S3-005 | Failure | AI Evaluation | All LLM Providers Offline (Safe Failure) | Not verified; planned only |
| TC-S3-006 | Security | AI Evaluation | Prompt Injection & Jailbreak Defense | Not verified; planned only |
| TC-S3-007 | Normal | Web (Vitest) | Triage Agent Pipeline visual stages | Not verified; planned only |
| TC-S3-008 | Normal | Mobile (Flutter) | Submit complaint screen chip selector | Not verified; planned only |
| TC-S3-009 | Performance | k6 Load Test | Triage API concurrency load test | Not verified; planned only |
| TC-S3-010 | Normal | Backend Unit | Case SLA Background Processor | Not verified; planned only |
| TC-S3-011 | Normal | Backend Unit | Structured JSON-Schema Output Validation | Not verified; planned only |
| TC-S4-001 | Normal | Backend API | Verified Doctor reviews and approves case | Not verified; planned only |
| TC-S4-002 | Security | Backend API | Doctor attempts to approve ungranted case | Not verified; planned only |
| TC-S4-003 | Failure | Backend Unit | Clinical Safety Rule 1: Zero Diagnosis Language | Not verified; planned only |
| TC-S4-004 | Failure | Backend Unit | Clinical Safety Rule 6: Prohibited Drug Dosing | Not verified; planned only |
| TC-S4-005 | Normal | Backend Unit | Clinical Safety Rule 10: Chest Pain Emergency Bypass | Not verified; planned only |
| TC-S4-006 | Normal | Backend Unit | Familial Risk Pedigree Screening Indication | Not verified; planned only |
| TC-S4-007 | Normal | Web (Vitest) | Doctor Approvals Page card and decision buttons | Not verified; planned only |
| TC-S4-008 | Boundary | Web (Vitest) | Doctor Approval Notes character boundary | Not verified; planned only |
| TC-S4-009 | Normal | E2E Integration | Complete Cross-Platform Clinical Lifecycle Workflow | Not verified; planned only |
| TC-S4-010 | Normal | Web (Vitest) | Safety Rules badge display check | Not verified; planned only |

For execution, use the full preconditions/steps/expected/actual/status/evidence template in the [complete pack](ASSIGNMENT_2_COMPLETE_PACK.md). Do not reuse guessed `/api/...` routes where the implementation uses `/api/v1/...`. Classify parser extraction against report-printed reference ranges; do not add patient diagnosis, dosing or automatic clinical advice.
