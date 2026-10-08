# Individual test contributions — repository evidence

Compiled 8 October 2026. Git author/file history is evidence of recorded changes, not proof of who personally ran tests, independent authorship, viva understanding or ownership of every changed component. S1–S4 handle mapping comes from docs/OWNERSHIP.tsv. Scope tags alone do not establish authorship.

Repository: https://github.com/sahansbandara/Family-Veda-SEF-Project

## Current tool execution

Codex executed xUnit, Testcontainers/PostgreSQL, Vitest/RTL and flutter_test on the current working tree. These runs cannot be claimed as personal student demonstrations. All four suites passed: 430 unit + 30 integration + 343 React + 256 Flutter = 1,059 tests. See [execution evidence](07_CURRENT_EXECUTION_EVIDENCE.md).

## Author-specific test changes

### S1 — Samaranayaka S.G.V.S

| Commit / date | Recorded change | Test files changed | Tool indicated by source |
|---|---|---|---|
| [e678bf1](https://github.com/sahansbandara/Family-Veda-SEF-Project/commit/e678bf14f6fb8bf435902a22a40edbfe09546a09) / 2026-09-23 | test(s1): cover the family, identity and consent providers and screens | `mobile/test/main_test.dart`<br>`mobile/test/providers/active_member_provider_test.dart`<br>`mobile/test/providers/auth_provider_test.dart`<br>`mobile/test/router/route_guard_test.dart`<br>`mobile/test/screens/login_screen_test.dart`<br>`mobile/test/services/api_services_test.dart`<br>`mobile/test/services/secure_storage_test.dart` | flutter_test |
| [eadc2e5](https://github.com/sahansbandara/Family-Veda-SEF-Project/commit/eadc2e56ed32e05ef142e0f8d030aef322022fa1) / 2026-09-23 | test(s1): cover the family, identity and consent web screens | `web/src/pages/family/OnboardingPage.test.tsx`<br>`web/src/routes/AppRouter.test.tsx`<br>`web/src/store/slices/authSlice.test.ts` | Vitest/RTL |

| Student-confirmed field | Value |
|---|---|
| Personally demonstrated command/date | |
| Personal role in defect discovery/fix/retest | |
| Viva explanation and modifications demonstrated | |
| CLEAR declaration | |

### S2 — Fernando K.R.N / Ranidu Fernando

| Commit / date | Recorded change | Test files changed | Tool indicated by source |
|---|---|---|---|
| [43ca434](https://github.com/sahansbandara/Family-Veda-SEF-Project/commit/43ca434f391fb6686c84f7c3d7751f0fa884a0fe) / 2026-09-22 | test(s2): cover the health records and extraction providers and screens | `mobile/test/screens/records_screen_test.dart` | flutter_test |
| [2731780](https://github.com/sahansbandara/Family-Veda-SEF-Project/commit/2731780bd8b8167bf33a4639efc6a8708c4d4b4f) / 2026-09-22 | test(s2): cover the health records and extraction web screens | `web/src/pages/records/RecordsPage.test.tsx` | Vitest/RTL |
| [ef35ed8](https://github.com/sahansbandara/Family-Veda-SEF-Project/commit/ef35ed8250ac5927d433d35cc303c4b4d517e450) / 2026-09-20 | test(s2): cover extraction agent, record sorting, and records UI | `mobile/test/screens/records_screen_test.dart`<br>`web/src/pages/records/RecordsPage.test.tsx` | Vitest/RTL, flutter_test |

| Student-confirmed field | Value |
|---|---|
| Personally demonstrated command/date | |
| Personal role in defect discovery/fix/retest | |
| Viva explanation and modifications demonstrated | |
| CLEAR declaration | |

### S3 — Karunathilaka K.D.J.C / Jani6969

| Commit / date | Recorded change | Test files changed | Tool indicated by source |
|---|---|---|---|
| [3e137e7](https://github.com/sahansbandara/Family-Veda-SEF-Project/commit/3e137e7fbd15f1523607ebbd25cb53a9321b510c) / 2026-09-23 | test(s3): cover the triage and agent orchestration providers and screens | `mobile/test/providers/patient_providers_test.dart`<br>`mobile/test/screens/async_state_views_test.dart`<br>`mobile/test/screens/case_status_screen_test.dart`<br>`mobile/test/screens/home_screen_test.dart` | flutter_test |
| [d09383e](https://github.com/sahansbandara/Family-Veda-SEF-Project/commit/d09383e468edaf0880b2c75a46eb0975fa39007d) / 2026-09-23 | test(s3): cover the triage and agent orchestration web screens | `web/src/components/shared/ViewState.test.tsx` | Vitest/RTL |

| Student-confirmed field | Value |
|---|---|
| Personally demonstrated command/date | |
| Personal role in defect discovery/fix/retest | |
| Viva explanation and modifications demonstrated | |
| CLEAR declaration | |

### S4 — ImSahanS; handle @sahansbandara

| Commit / date | Recorded change | Test files changed | Tool indicated by source |
|---|---|---|---|
| [f002316](https://github.com/sahansbandara/Family-Veda-SEF-Project/commit/f0023168709581504336e140452968e6eb809565) / 2026-10-04 | test(s4): cover the name-first case title and anonymous pool fallback (AI co-authored) | `mobile/test/models/doctor_queue_case_reference_test.dart` | flutter_test |
| [e877454](https://github.com/sahansbandara/Family-Veda-SEF-Project/commit/e8774540acf54953c2bab285f255da1f4db97949) / 2026-10-04 | test(s4): cover the doctor menu after a fresh sign-in through the real router (AI co-authored) | `mobile/test/router/doctor_shell_after_login_test.dart` | flutter_test |
| [fa6c357](https://github.com/sahansbandara/Family-Veda-SEF-Project/commit/fa6c357027376a2bbfa2fc24846d88b6023a594c) / 2026-09-22 | test(s4): cover the familial risk and clinical approval providers and screens | `mobile/test/models/approved_guidance_test.dart`<br>`mobile/test/providers/guidance_provider_test.dart`<br>`mobile/test/screens/approved_guidance_screen_test.dart`<br>`mobile/test/screens/emergency_screen_test.dart` | flutter_test |
| [977c822](https://github.com/sahansbandara/Family-Veda-SEF-Project/commit/977c822cfa6504879f898e37f4d0f083ff50a897) / 2026-09-22 | test(s4): cover the familial risk and clinical approval web screens | `web/src/pages/doctor/ApprovalsPage.test.tsx` | Vitest/RTL |

| Student-confirmed field | Value |
|---|---|
| Personally demonstrated command/date | |
| Personal role in defect discovery/fix/retest | |
| Viva explanation and modifications demonstrated | |
| CLEAR declaration | |

## Tool source inventory

| Tool | Existing source/configuration | Evidence |
|---|---|
| xUnit + Moq | `backend/tests/UnitTests/FamilyVeda.UnitTests.csproj` and component test folders | Current TRX + text log |
| xUnit + PostgreSQL Testcontainers | `backend/tests/IntegrationTests/FamilyVeda.IntegrationTests.csproj` | Current TRX + text log; real Docker required |
| Vitest + React Testing Library | `web/package.json`, web test sources | Current 57 files / 343 tests |
| flutter_test | `mobile/pubspec.yaml`, `mobile/test/` | Current 256 tests |
| ApacheBench | `scripts/e2e/local_load_profile.py` | 14-endpoint output, rerun 8 October (`evidence/2026-10-08-nonfunctional/performance-load-profile.txt`) |
| OWASP ZAP | Retained first-run/retest reports | Head-token API scan, 5 October first run/retest and 8 October rerun (`evidence/2026-10-08-zap/`) |

## Defect/fix/retest traceability

D-008/D-009: first failing React tests/lint/build and successful retests retained in 5 October evidence. D-010: VitalsPanel guard test and PR #160. D-011/D-012: ZAP first run → [request hardening fix 7a90a77](https://github.com/sahansbandara/Family-Veda-SEF-Project/commit/7a90a771ccc33b73e2cc86d02214e18303615bea) → RequestHardeningTests → historical ZAP rescan and current 30-test integration pass. These are project traces; the student who discovered or retested each defect remains blank unless personally confirmed.

Computer Use verified the GitHub fix page; [commit screenshot](evidence/2026-10-08-tests/github-request-hardening.jpg). The GitHub develop page showed a newer merge than local HEAD; current tests certify the recorded local working tree, not that later remote merge.

## AI attribution

The repository contains Claude-authored commits and AI co-author trailers. Preserve those identities. AI-authored changes must not be reassigned to a student just because the component tag is S1–S4. Students must disclose their actual use and understanding.

## Complete test file inventory

- [`backend/tests/IntegrationTests/Component1_Family/AuthAndPatientFlowTests.cs`](../../backend/tests/IntegrationTests/Component1_Family/AuthAndPatientFlowTests.cs)
- [`backend/tests/IntegrationTests/Component1_Family/DoctorRegistrationTests.cs`](../../backend/tests/IntegrationTests/Component1_Family/DoctorRegistrationTests.cs)
- [`backend/tests/IntegrationTests/Component1_Family/MigrationTests.cs`](../../backend/tests/IntegrationTests/Component1_Family/MigrationTests.cs)
- [`backend/tests/IntegrationTests/Component1_Family/RegistrationFlowTests.cs`](../../backend/tests/IntegrationTests/Component1_Family/RegistrationFlowTests.cs)
- [`backend/tests/IntegrationTests/Component2_Records/AdultReportSharingTests.cs`](../../backend/tests/IntegrationTests/Component2_Records/AdultReportSharingTests.cs)
- [`backend/tests/IntegrationTests/RequestHardeningTests.cs`](../../backend/tests/IntegrationTests/RequestHardeningTests.cs)
- [`backend/tests/IntegrationTests/Shared/GoldenCaseFlowTests.cs`](../../backend/tests/IntegrationTests/Shared/GoldenCaseFlowTests.cs)
- [`backend/tests/UnitTests/AgentOutputPromptTests.cs`](../../backend/tests/UnitTests/AgentOutputPromptTests.cs)
- [`backend/tests/UnitTests/CloudflareClientTests.cs`](../../backend/tests/UnitTests/CloudflareClientTests.cs)
- [`backend/tests/UnitTests/Component1_Family/ConsentStateMachineTests.cs`](../../backend/tests/UnitTests/Component1_Family/ConsentStateMachineTests.cs)
- [`backend/tests/UnitTests/Component1_Family/FamilyAccessTests.cs`](../../backend/tests/UnitTests/Component1_Family/FamilyAccessTests.cs)
- [`backend/tests/UnitTests/Component1_Family/FamilyHeadTransferServiceTests.cs`](../../backend/tests/UnitTests/Component1_Family/FamilyHeadTransferServiceTests.cs)
- [`backend/tests/UnitTests/Component1_Family/FamilyLifecycleServiceTests.cs`](../../backend/tests/UnitTests/Component1_Family/FamilyLifecycleServiceTests.cs)
- [`backend/tests/UnitTests/Component1_Family/FamilyServicePrivacyTests.cs`](../../backend/tests/UnitTests/Component1_Family/FamilyServicePrivacyTests.cs)
- [`backend/tests/UnitTests/Component1_Family/IncomingInvitationServiceTests.cs`](../../backend/tests/UnitTests/Component1_Family/IncomingInvitationServiceTests.cs)
- [`backend/tests/UnitTests/Component1_Family/ProfileServiceTests.cs`](../../backend/tests/UnitTests/Component1_Family/ProfileServiceTests.cs)
- [`backend/tests/UnitTests/Component1_Family/RegistrationValidatorTests.cs`](../../backend/tests/UnitTests/Component1_Family/RegistrationValidatorTests.cs)
- [`backend/tests/UnitTests/Component1_Family/ToolDispatcherTests.cs`](../../backend/tests/UnitTests/Component1_Family/ToolDispatcherTests.cs)
- [`backend/tests/UnitTests/Component1_Family/ToolRegistryTests.cs`](../../backend/tests/UnitTests/Component1_Family/ToolRegistryTests.cs)
- [`backend/tests/UnitTests/Component2_Records/GoogleDriveReportStorageTests.cs`](../../backend/tests/UnitTests/Component2_Records/GoogleDriveReportStorageTests.cs)
- [`backend/tests/UnitTests/Component2_Records/LabExtractionParserTests.cs`](../../backend/tests/UnitTests/Component2_Records/LabExtractionParserTests.cs)
- [`backend/tests/UnitTests/Component2_Records/LabExtractionSafetyTests.cs`](../../backend/tests/UnitTests/Component2_Records/LabExtractionSafetyTests.cs)
- [`backend/tests/UnitTests/Component2_Records/LabExtractionWorkerTests.cs`](../../backend/tests/UnitTests/Component2_Records/LabExtractionWorkerTests.cs)
- [`backend/tests/UnitTests/Component2_Records/LabReportDurableStorageTests.cs`](../../backend/tests/UnitTests/Component2_Records/LabReportDurableStorageTests.cs)
- [`backend/tests/UnitTests/Component2_Records/LabReportTrashTests.cs`](../../backend/tests/UnitTests/Component2_Records/LabReportTrashTests.cs)
- [`backend/tests/UnitTests/Component2_Records/PdfReportLimitTests.cs`](../../backend/tests/UnitTests/Component2_Records/PdfReportLimitTests.cs)
- [`backend/tests/UnitTests/Component2_Records/RecordServiceLabReviewTests.cs`](../../backend/tests/UnitTests/Component2_Records/RecordServiceLabReviewTests.cs)
- [`backend/tests/UnitTests/Component2_Records/VitalReferenceRangesTests.cs`](../../backend/tests/UnitTests/Component2_Records/VitalReferenceRangesTests.cs)
- [`backend/tests/UnitTests/Component3_Triage/CaseSlaProcessorTests.cs`](../../backend/tests/UnitTests/Component3_Triage/CaseSlaProcessorTests.cs)
- [`backend/tests/UnitTests/Component3_Triage/ChatCompletionsLlmClientTests.cs`](../../backend/tests/UnitTests/Component3_Triage/ChatCompletionsLlmClientTests.cs)
- [`backend/tests/UnitTests/Component3_Triage/NotificationServiceTests.cs`](../../backend/tests/UnitTests/Component3_Triage/NotificationServiceTests.cs)
- [`backend/tests/UnitTests/Component3_Triage/TriageOrchestratorEmergencyTests.cs`](../../backend/tests/UnitTests/Component3_Triage/TriageOrchestratorEmergencyTests.cs)
- [`backend/tests/UnitTests/Component3_Triage/TriageOrchestratorNoDataTests.cs`](../../backend/tests/UnitTests/Component3_Triage/TriageOrchestratorNoDataTests.cs)
- [`backend/tests/UnitTests/Component3_Triage/TriageOrchestratorSchemaTests.cs`](../../backend/tests/UnitTests/Component3_Triage/TriageOrchestratorSchemaTests.cs)
- [`backend/tests/UnitTests/Component3_Triage/TriageReviewReasonsTests.cs`](../../backend/tests/UnitTests/Component3_Triage/TriageReviewReasonsTests.cs)
- [`backend/tests/UnitTests/Component3_Triage/TriageSubmissionLifecycleTests.cs`](../../backend/tests/UnitTests/Component3_Triage/TriageSubmissionLifecycleTests.cs)
- [`backend/tests/UnitTests/Component3_Triage/TriageWorkerRecoveryTests.cs`](../../backend/tests/UnitTests/Component3_Triage/TriageWorkerRecoveryTests.cs)
- [`backend/tests/UnitTests/Component4_Clinical/AdultPrivacyAuthorizationTests.cs`](../../backend/tests/UnitTests/Component4_Clinical/AdultPrivacyAuthorizationTests.cs)
- [`backend/tests/UnitTests/Component4_Clinical/AppointmentServiceTests.cs`](../../backend/tests/UnitTests/Component4_Clinical/AppointmentServiceTests.cs)
- [`backend/tests/UnitTests/Component4_Clinical/CaseGrantPolicyTests.cs`](../../backend/tests/UnitTests/Component4_Clinical/CaseGrantPolicyTests.cs)
- [`backend/tests/UnitTests/Component4_Clinical/ClinicalCasePoolPrivacyTests.cs`](../../backend/tests/UnitTests/Component4_Clinical/ClinicalCasePoolPrivacyTests.cs)
- [`backend/tests/UnitTests/Component4_Clinical/ClinicalEmergencyReferralTests.cs`](../../backend/tests/UnitTests/Component4_Clinical/ClinicalEmergencyReferralTests.cs)
- [`backend/tests/UnitTests/Component4_Clinical/ClinicalRuleTableTests.cs`](../../backend/tests/UnitTests/Component4_Clinical/ClinicalRuleTableTests.cs)
- [`backend/tests/UnitTests/Component4_Clinical/DoctorWorkspaceServiceTests.cs`](../../backend/tests/UnitTests/Component4_Clinical/DoctorWorkspaceServiceTests.cs)
- [`backend/tests/UnitTests/Component4_Clinical/EmergencyFollowUpTests.cs`](../../backend/tests/UnitTests/Component4_Clinical/EmergencyFollowUpTests.cs)
- [`backend/tests/UnitTests/Component4_Clinical/FamilialRiskAgentTests.cs`](../../backend/tests/UnitTests/Component4_Clinical/FamilialRiskAgentTests.cs)
- [`backend/tests/UnitTests/Component4_Clinical/FamilialRiskPolicyTests.cs`](../../backend/tests/UnitTests/Component4_Clinical/FamilialRiskPolicyTests.cs)
- [`backend/tests/UnitTests/Component4_Clinical/FamilyDoctorServiceTests.cs`](../../backend/tests/UnitTests/Component4_Clinical/FamilyDoctorServiceTests.cs)
- [`backend/tests/UnitTests/Component4_Clinical/JoinRequestServiceTests.cs`](../../backend/tests/UnitTests/Component4_Clinical/JoinRequestServiceTests.cs)
- [`backend/tests/UnitTests/Component4_Clinical/LabRangeClassifierTests.cs`](../../backend/tests/UnitTests/Component4_Clinical/LabRangeClassifierTests.cs)
- [`backend/tests/UnitTests/Component4_Clinical/PortalDashboardAndNotificationTests.cs`](../../backend/tests/UnitTests/Component4_Clinical/PortalDashboardAndNotificationTests.cs)
- [`backend/tests/UnitTests/Component4_Clinical/PortalDashboardMockupFieldsTests.cs`](../../backend/tests/UnitTests/Component4_Clinical/PortalDashboardMockupFieldsTests.cs)
- [`backend/tests/UnitTests/Component4_Clinical/SafetyValidationServiceTests.cs`](../../backend/tests/UnitTests/Component4_Clinical/SafetyValidationServiceTests.cs)
- [`backend/tests/UnitTests/GeminiKeyPoolTests.cs`](../../backend/tests/UnitTests/GeminiKeyPoolTests.cs)
- [`backend/tests/UnitTests/LlmFallbackCancellationTests.cs`](../../backend/tests/UnitTests/LlmFallbackCancellationTests.cs)
- [`backend/tests/UnitTests/LlmFallbackClientTests.cs`](../../backend/tests/UnitTests/LlmFallbackClientTests.cs)
- [`backend/tests/UnitTests/ProviderRedirectTests.cs`](../../backend/tests/UnitTests/ProviderRedirectTests.cs)
- [`backend/tests/UnitTests/Shared/Phase1bSeedTests.cs`](../../backend/tests/UnitTests/Shared/Phase1bSeedTests.cs)
- [`backend/tests/UnitTests/Shared/VivaDemoSeederTests.cs`](../../backend/tests/UnitTests/Shared/VivaDemoSeederTests.cs)
- [`mobile/test/main_test.dart`](../../mobile/test/main_test.dart)
- [`mobile/test/models/app_notification_test.dart`](../../mobile/test/models/app_notification_test.dart)
- [`mobile/test/models/appointment_test.dart`](../../mobile/test/models/appointment_test.dart)
- [`mobile/test/models/approved_guidance_test.dart`](../../mobile/test/models/approved_guidance_test.dart)
- [`mobile/test/models/doctor_queue_case_reference_test.dart`](../../mobile/test/models/doctor_queue_case_reference_test.dart)
- [`mobile/test/models/family_dashboard_test.dart`](../../mobile/test/models/family_dashboard_test.dart)
- [`mobile/test/models/lab_report_test.dart`](../../mobile/test/models/lab_report_test.dart)
- [`mobile/test/models/record_summary_meta_test.dart`](../../mobile/test/models/record_summary_meta_test.dart)
- [`mobile/test/models/triage_case_test.dart`](../../mobile/test/models/triage_case_test.dart)
- [`mobile/test/models/vital_test.dart`](../../mobile/test/models/vital_test.dart)
- [`mobile/test/providers/active_member_provider_test.dart`](../../mobile/test/providers/active_member_provider_test.dart)
- [`mobile/test/providers/auth_provider_test.dart`](../../mobile/test/providers/auth_provider_test.dart)
- [`mobile/test/providers/guidance_provider_test.dart`](../../mobile/test/providers/guidance_provider_test.dart)
- [`mobile/test/providers/members_provider_test.dart`](../../mobile/test/providers/members_provider_test.dart)
- [`mobile/test/providers/patient_providers_test.dart`](../../mobile/test/providers/patient_providers_test.dart)
- [`mobile/test/router/doctor_shell_after_login_test.dart`](../../mobile/test/router/doctor_shell_after_login_test.dart)
- [`mobile/test/router/route_guard_test.dart`](../../mobile/test/router/route_guard_test.dart)
- [`mobile/test/screens/appointments_screen_test.dart`](../../mobile/test/screens/appointments_screen_test.dart)
- [`mobile/test/screens/approved_guidance_screen_test.dart`](../../mobile/test/screens/approved_guidance_screen_test.dart)
- [`mobile/test/screens/async_state_views_test.dart`](../../mobile/test/screens/async_state_views_test.dart)
- [`mobile/test/screens/book_appointment_member_options_test.dart`](../../mobile/test/screens/book_appointment_member_options_test.dart)
- [`mobile/test/screens/book_appointment_screen_test.dart`](../../mobile/test/screens/book_appointment_screen_test.dart)
- [`mobile/test/screens/care_workflows_test.dart`](../../mobile/test/screens/care_workflows_test.dart)
- [`mobile/test/screens/case_status_screen_test.dart`](../../mobile/test/screens/case_status_screen_test.dart)
- [`mobile/test/screens/cases_screen_test.dart`](../../mobile/test/screens/cases_screen_test.dart)
- [`mobile/test/screens/doctor_calendar_logic_test.dart`](../../mobile/test/screens/doctor_calendar_logic_test.dart)
- [`mobile/test/screens/doctor_calendar_screen_test.dart`](../../mobile/test/screens/doctor_calendar_screen_test.dart)
- [`mobile/test/screens/doctor_families_flow_test.dart`](../../mobile/test/screens/doctor_families_flow_test.dart)
- [`mobile/test/screens/doctor_profile_screen_test.dart`](../../mobile/test/screens/doctor_profile_screen_test.dart)
- [`mobile/test/screens/doctor_triage_cases_screen_test.dart`](../../mobile/test/screens/doctor_triage_cases_screen_test.dart)
- [`mobile/test/screens/emergency_screen_test.dart`](../../mobile/test/screens/emergency_screen_test.dart)
- [`mobile/test/screens/family_doctor_availability_test.dart`](../../mobile/test/screens/family_doctor_availability_test.dart)
- [`mobile/test/screens/home_screen_test.dart`](../../mobile/test/screens/home_screen_test.dart)
- [`mobile/test/screens/login_screen_test.dart`](../../mobile/test/screens/login_screen_test.dart)
- [`mobile/test/screens/members_screen_test.dart`](../../mobile/test/screens/members_screen_test.dart)
- [`mobile/test/screens/my_doctor_screen_test.dart`](../../mobile/test/screens/my_doctor_screen_test.dart)
- [`mobile/test/screens/privacy_screen_test.dart`](../../mobile/test/screens/privacy_screen_test.dart)
- [`mobile/test/screens/profile_screen_test.dart`](../../mobile/test/screens/profile_screen_test.dart)
- [`mobile/test/screens/public_information_screen_test.dart`](../../mobile/test/screens/public_information_screen_test.dart)
- [`mobile/test/screens/records_screen_test.dart`](../../mobile/test/screens/records_screen_test.dart)
- [`mobile/test/screens/register_screen_test.dart`](../../mobile/test/screens/register_screen_test.dart)
- [`mobile/test/screens/report_library_workflow_test.dart`](../../mobile/test/screens/report_library_workflow_test.dart)
- [`mobile/test/screens/report_trash_test.dart`](../../mobile/test/screens/report_trash_test.dart)
- [`mobile/test/screens/request_progress_actions_test.dart`](../../mobile/test/screens/request_progress_actions_test.dart)
- [`mobile/test/screens/vitals_tab_test.dart`](../../mobile/test/screens/vitals_tab_test.dart)
- [`mobile/test/services/api_services_test.dart`](../../mobile/test/services/api_services_test.dart)
- [`mobile/test/services/auth_api_error_test.dart`](../../mobile/test/services/auth_api_error_test.dart)
- [`mobile/test/services/report_reading_poller_test.dart`](../../mobile/test/services/report_reading_poller_test.dart)
- [`mobile/test/services/secure_storage_test.dart`](../../mobile/test/services/secure_storage_test.dart)
- [`mobile/test/widgets/app_shell_test.dart`](../../mobile/test/widgets/app_shell_test.dart)
- [`mobile/test/widgets/doctor/vital_overview_grid_test.dart`](../../mobile/test/widgets/doctor/vital_overview_grid_test.dart)
- [`mobile/test/widgets/head_dashboard_section_test.dart`](../../mobile/test/widgets/head_dashboard_section_test.dart)
- [`mobile/test/widgets/report_library_card_test.dart`](../../mobile/test/widgets/report_library_card_test.dart)
- [`mobile/test/widgets/report_review_workspace_test.dart`](../../mobile/test/widgets/report_review_workspace_test.dart)
- [`scripts/e2e/local_load_profile.py`](../../scripts/e2e/local_load_profile.py)
- [`scripts/e2e/local_performance_check.py`](../../scripts/e2e/local_performance_check.py)
- [`scripts/e2e/synthetic_portal_journey.py`](../../scripts/e2e/synthetic_portal_journey.py)
- [`web/src/components/records/DeletedReports.test.tsx`](../../web/src/components/records/DeletedReports.test.tsx)
- [`web/src/components/records/OriginalReportPreview.test.tsx`](../../web/src/components/records/OriginalReportPreview.test.tsx)
- [`web/src/components/records/PdfReportCanvas.test.tsx`](../../web/src/components/records/PdfReportCanvas.test.tsx)
- [`web/src/components/records/RecordedRangeVisual.test.tsx`](../../web/src/components/records/RecordedRangeVisual.test.tsx)
- [`web/src/components/records/ReportLibrary.test.tsx`](../../web/src/components/records/ReportLibrary.test.tsx)
- [`web/src/components/records/ReportLibraryCard.test.tsx`](../../web/src/components/records/ReportLibraryCard.test.tsx)
- [`web/src/components/records/ReportReviewDialog.test.tsx`](../../web/src/components/records/ReportReviewDialog.test.tsx)
- [`web/src/components/records/ReportThumbnail.test.tsx`](../../web/src/components/records/ReportThumbnail.test.tsx)
- [`web/src/components/shared/ViewState.test.tsx`](../../web/src/components/shared/ViewState.test.tsx)
- [`web/src/pages/admin/AdminDashboardPanel.test.tsx`](../../web/src/pages/admin/AdminDashboardPanel.test.tsx)
- [`web/src/pages/auth/AuthPage.test.tsx`](../../web/src/pages/auth/AuthPage.test.tsx)
- [`web/src/pages/auth/DoctorRegisterPage.test.tsx`](../../web/src/pages/auth/DoctorRegisterPage.test.tsx)
- [`web/src/pages/doctor/AgentOutputCard.test.tsx`](../../web/src/pages/doctor/AgentOutputCard.test.tsx)
- [`web/src/pages/doctor/ApprovalSupportingEvidence.test.tsx`](../../web/src/pages/doctor/ApprovalSupportingEvidence.test.tsx)
- [`web/src/pages/doctor/ApprovalsPage.test.tsx`](../../web/src/pages/doctor/ApprovalsPage.test.tsx)
- [`web/src/pages/doctor/CasesPage.test.tsx`](../../web/src/pages/doctor/CasesPage.test.tsx)
- [`web/src/pages/doctor/DoctorCalendarPage.test.tsx`](../../web/src/pages/doctor/DoctorCalendarPage.test.tsx)
- [`web/src/pages/doctor/DoctorDashboardPanel.test.tsx`](../../web/src/pages/doctor/DoctorDashboardPanel.test.tsx)
- [`web/src/pages/doctor/DoctorFamiliesPage.test.tsx`](../../web/src/pages/doctor/DoctorFamiliesPage.test.tsx)
- [`web/src/pages/doctor/DoctorFamilyDetailPage.test.tsx`](../../web/src/pages/doctor/DoctorFamilyDetailPage.test.tsx)
- [`web/src/pages/doctor/DoctorMemberPage.test.tsx`](../../web/src/pages/doctor/DoctorMemberPage.test.tsx)
- [`web/src/pages/doctor/DoctorProfilePage.test.tsx`](../../web/src/pages/doctor/DoctorProfilePage.test.tsx)
- [`web/src/pages/doctor/PracticeProfileForm.test.tsx`](../../web/src/pages/doctor/PracticeProfileForm.test.tsx)
- [`web/src/pages/doctor/approvalReview.test.ts`](../../web/src/pages/doctor/approvalReview.test.ts)
- [`web/src/pages/doctor/calendar/calendarUtils.test.ts`](../../web/src/pages/doctor/calendar/calendarUtils.test.ts)
- [`web/src/pages/doctor/doctorSchedule.test.ts`](../../web/src/pages/doctor/doctorSchedule.test.ts)
- [`web/src/pages/doctor/memberClinicalTabs.test.tsx`](../../web/src/pages/doctor/memberClinicalTabs.test.tsx)
- [`web/src/pages/doctor/reviewReasons.test.ts`](../../web/src/pages/doctor/reviewReasons.test.ts)
- [`web/src/pages/doctor/safetyRules.test.ts`](../../web/src/pages/doctor/safetyRules.test.ts)
- [`web/src/pages/family/AppointmentsPage.test.tsx`](../../web/src/pages/family/AppointmentsPage.test.tsx)
- [`web/src/pages/family/FamilyDashboardPanel.adult.test.tsx`](../../web/src/pages/family/FamilyDashboardPanel.adult.test.tsx)
- [`web/src/pages/family/FamilyDashboardPanel.test.tsx`](../../web/src/pages/family/FamilyDashboardPanel.test.tsx)
- [`web/src/pages/family/FamilyPage.test.tsx`](../../web/src/pages/family/FamilyPage.test.tsx)
- [`web/src/pages/family/FamilyRiskPage.test.tsx`](../../web/src/pages/family/FamilyRiskPage.test.tsx)
- [`web/src/pages/family/HeadTransfer.test.tsx`](../../web/src/pages/family/HeadTransfer.test.tsx)
- [`web/src/pages/family/IncomingInvitationsPanel.test.tsx`](../../web/src/pages/family/IncomingInvitationsPanel.test.tsx)
- [`web/src/pages/family/MyDoctorPage.test.tsx`](../../web/src/pages/family/MyDoctorPage.test.tsx)
- [`web/src/pages/family/OnboardingPage.test.tsx`](../../web/src/pages/family/OnboardingPage.test.tsx)
- [`web/src/pages/family/PrivacyPage.test.tsx`](../../web/src/pages/family/PrivacyPage.test.tsx)
- [`web/src/pages/notifications/NotificationsPage.test.tsx`](../../web/src/pages/notifications/NotificationsPage.test.tsx)
- [`web/src/pages/profile/ProfilePage.test.tsx`](../../web/src/pages/profile/ProfilePage.test.tsx)
- [`web/src/pages/public/PublicInformationPage.test.tsx`](../../web/src/pages/public/PublicInformationPage.test.tsx)
- [`web/src/pages/records/RecordsPage.test.tsx`](../../web/src/pages/records/RecordsPage.test.tsx)
- [`web/src/pages/records/VitalsPanel.test.tsx`](../../web/src/pages/records/VitalsPanel.test.tsx)
- [`web/src/pages/records/extractionRefusal.test.ts`](../../web/src/pages/records/extractionRefusal.test.ts)
- [`web/src/pages/records/pollReading.test.ts`](../../web/src/pages/records/pollReading.test.ts)
- [`web/src/pages/records/recordSummaryMeta.test.ts`](../../web/src/pages/records/recordSummaryMeta.test.ts)
- [`web/src/pages/records/vitalMeta.test.ts`](../../web/src/pages/records/vitalMeta.test.ts)
- [`web/src/pages/triage/FamilyCaseProgress.test.tsx`](../../web/src/pages/triage/FamilyCaseProgress.test.tsx)
- [`web/src/pages/triage/RequestPopup.test.tsx`](../../web/src/pages/triage/RequestPopup.test.tsx)
- [`web/src/pages/triage/TriageJourney.test.tsx`](../../web/src/pages/triage/TriageJourney.test.tsx)
- [`web/src/pages/triage/TriagePage.test.tsx`](../../web/src/pages/triage/TriagePage.test.tsx)
- [`web/src/routes/AppRouter.test.tsx`](../../web/src/routes/AppRouter.test.tsx)
- [`web/src/routes/RouteGuard.test.tsx`](../../web/src/routes/RouteGuard.test.tsx)
- [`web/src/services/apiClient.session.test.ts`](../../web/src/services/apiClient.session.test.ts)
- [`web/src/store/slices/authSlice.test.ts`](../../web/src/store/slices/authSlice.test.ts)
- [`web/src/styles/approvalVitalsGrid.test.ts`](../../web/src/styles/approvalVitalsGrid.test.ts)


Review notes: S4 Git authorship is confirmed for `doctor_queue_case_reference_test.dart` and `doctor_shell_after_login_test.dart`, but these two paths are absent from the ownership manifest. Request-hardening commit 7a90a77 is AI co-authored; its S1 scope does not make it an S1 student-authored commit. S2 ef35ed8 also changed historical backend `ExtractionAgentTests.cs` and `RecordServiceSortingTests.cs` (xUnit); those paths have since moved/changed and are not linked as current files.


## Retained non-functional evidence links

- [ApacheBench raw local load output](evidence/2026-10-05/performance-load-profile.txt)
- [ZAP first-run/retest summary](evidence/2026-10-05/security-zap-summary.txt)
- [ZAP first report](evidence/2026-10-05/zap-first-run/zap-report.md)
- [ZAP retest report](evidence/2026-10-05/zap-retest/zap-report.md)

Performance/security scripts or reports do not establish which student personally demonstrated them. Those fields remain blank.
