# Per-member full-stack evidence table

**Generated** 2026-09-22 from [`docs/OWNERSHIP.tsv`](../OWNERSHIP.tsv) at `05b0605`. Regenerate after any ownership change — do not hand-edit.

Closes the `agent/TODO.md` H7 item *"Per-member full-stack evidence table"*.

## Why this file exists

70 of the 100 marks are individual, and every individual rubric band asks the student to **explain, test, modify or debug their own contribution across all five technologies**. A folder-per-student layout was rejected (`agent/DECISIONS.md:39`) because it breaks the shared-API requirement, so separation is enforced three ways instead:

| Mechanism | Where | Enforced by |
|---|---|---|
| File-level ownership manifest | `docs/OWNERSHIP.tsv` | review discipline |
| Ownership header in every source file | `// Owner: Sx …` | visible at point of edit |
| Reviewer routing | `.github/CODEOWNERS` | GitHub, on every PR |
| Per-member branch | `feature/sN-*` | branch protection + `git log --author` |

> **The examiner reads `git log --author`, not directory names.** Ownership tags prove *scope*; only your own commits prove *authorship*. Each member must commit their own work from their own account.

## Ownership at a glance

| Member | GitHub | Component | Agent(s) | Branch | Files |
|---|---|---|---|---|---|
| **S1** · IT23544154 | `@IT23544154` | Samaranayaka S.G.V.S — Family, Identity & Consent | —  (owns the enforcement layer every agent depends on) | `feature/s1-consent-management` | 85 |
| **S2** · IT24101875 | `@it24101875` | Fernando K.R.N — Health Records & Extraction | Extraction Agent | `feature/s2-lab-ocr-extraction` | 22 |
| **S3** · IT24100551 | `@Jani6969` | Karunathilaka K.D.J.C — Triage & Agent Orchestration | Coordinator · Context · Analysis Agents | `feature/s3-agent-orchestration` | 59 |
| **S4** · IT24100559 | `@sahansbandara` | W.M.S.S.B. Wasala — Familial Risk & Clinical Approval | Familial Risk · Safety/Validation Agents | `feature/s4-approval-gate` | 33 |

## Full-stack coverage matrix

File counts per member per rubric layer. Every member owns code in the API, the database layer, React, Flutter and the agent subsystem — that is the allocation rule in `agent/BRIEF.md`.

| Rubric layer | S1 | S2 | S3 | S4 |
|---|---|---|---|---|
| ASP.NET Core REST API (10) | 11 | 1 | 3 | 1 |
| Application + Domain layer | 12 | 2 | 3 | 6 |
| Infrastructure + PostgreSQL (10) | 10 | 5 | 12 | 3 |
| React web application (10) | 14 | 2 | 13 | 8 |
| Flutter mobile application (10) | 17 | 7 | 17 | 5 |
| Testing, CI, Git workflow (8) | 16 | 5 | 11 | 10 |
| Agentic AI contribution (12) | 2 | 1 | 6 | 5 |
| **Total owned files** | 85 | 22 | 59 | 33 |

## Database tables owned

| Member | Tables |
|---|---|
| **S1** | `users` `families` `members` `relationships` `consents` |
| **S2** | `health_records` `lab_reports` `lab_values` `vitals` `hereditary_flags` |
| **S3** | `episodes` `triage_cases` `agent_traces` `notification_subscriptions` |
| **S4** | `doctors` `doctor_verification_log` `family_doctor_assignments` `case_access_grants` `approvals` `audit_log` |

Schema changes follow the **migration lock** protocol in `CLAUDE.md`: announce, pull, add one migration, verify, push, release. `backend/src/Infrastructure/Persistence/Migrations/` requires all four reviewers.

---

## S1 — Samaranayaka S.G.V.S (IT23544154)

**Component:** Family, Identity & Consent  
**Also owns:** tool-permission enforcement layer · CI/testing lead  
**Agent(s):** —  (owns the enforcement layer every agent depends on)  
**Branch:** `feature/s1-consent-management`  
**Commits as:** `@IT23544154`  
**Report:** [`S1.md`](./S1.md) · **AI disclosure:** [`../ai-disclosure/S1.md`](../ai-disclosure/S1.md)

### Backend — API

- `backend/src/Api/Controllers/ApiControllerBase.cs`
- `backend/src/Api/Controllers/AuthController.cs`
- `backend/src/Api/Controllers/FamiliesController.cs`
- `backend/src/Api/Controllers/MembersController.cs`
- `backend/src/Api/FamilyVeda.Api.csproj`
- `backend/src/Api/FamilyVeda.Api.http`
- `backend/src/Api/Middleware/ExceptionMiddleware.cs`
- `backend/src/Api/Program.cs` · ⚠ SHARED (coordinator)
- `backend/src/Api/Properties/launchSettings.json`
- `backend/src/Api/Security/HttpCurrentUser.cs`
- `backend/src/Api/appsettings.json`

### Backend — Application

- `backend/src/Application/Agents/ToolRegistry.cs`
- `backend/src/Application/Auth/AuthContracts.cs`
- `backend/src/Application/Common/ICurrentUser.cs`
- `backend/src/Application/Common/PagedResult.cs`
- `backend/src/Application/Families/FamilyContracts.cs`
- `backend/src/Application/FamilyVeda.Application.csproj`
- `backend/src/Application/Validation/RequestValidators.cs`

### Backend — Domain

- `backend/src/Domain/Common/Entity.cs`
- `backend/src/Domain/Common/Enums.cs`
- `backend/src/Domain/Consent/ConsentStateMachine.cs`
- `backend/src/Domain/FamilyVeda.Domain.csproj`
- `backend/src/Domain/Identity/IdentityEntities.cs`

### Backend — Infrastructure

- `backend/src/Infrastructure/Agents/ToolDispatcher.cs`
- `backend/src/Infrastructure/Auth/AuthService.cs`
- `backend/src/Infrastructure/Auth/JwtOptions.cs`
- `backend/src/Infrastructure/DependencyInjection.cs` · ⚠ SHARED (coordinator)
- `backend/src/Infrastructure/Families/FamilyService.cs`
- `backend/src/Infrastructure/FamilyVeda.Infrastructure.csproj`
- `backend/src/Infrastructure/Persistence/AppDbContext.cs` · ⚠ SHARED (coordinator)
- `backend/src/Infrastructure/Persistence/AppDbContextFactory.cs`
- `backend/src/Infrastructure/Persistence/Configurations/IdentityConfigurations.cs`
- `backend/src/Infrastructure/Persistence/DatabaseInitializer.cs` · ⚠ SHARED (coordinator)

### Backend — tests

- `backend/tests/IntegrationTests/AuthAndPatientFlowTests.cs`
- `backend/tests/IntegrationTests/FamilyVeda.IntegrationTests.csproj`
- `backend/tests/IntegrationTests/MigrationTests.cs`
- `backend/tests/UnitTests/ConsentStateMachineTests.cs`
- `backend/tests/UnitTests/FamilyServicePrivacyTests.cs`
- `backend/tests/UnitTests/FamilyVeda.UnitTests.csproj`
- `backend/tests/UnitTests/ToolDispatcherTests.cs`
- `backend/tests/UnitTests/ToolRegistryTests.cs`

### React web

- `web/src/App.tsx`
- `web/src/main.tsx`
- `web/src/pages/auth/LoginPage.tsx`
- `web/src/pages/auth/RegisterPage.tsx`
- `web/src/pages/family/FamilyPage.tsx`
- `web/src/pages/family/OnboardingPage.test.tsx`
- `web/src/pages/family/OnboardingPage.tsx`
- `web/src/routes/AppRouter.test.tsx`
- `web/src/routes/AppRouter.tsx` · ⚠ SHARED (coordinator)
- `web/src/routes/RouteGuard.tsx`
- `web/src/services/apiClient.ts`
- `web/src/store/hooks.ts`
- `web/src/store/slices/authSlice.test.ts`
- `web/src/store/slices/authSlice.ts`

### Flutter mobile

- `mobile/lib/config/app_config.dart`
- `mobile/lib/main.dart` · ⚠ SHARED (coordinator)
- `mobile/lib/models/member.dart`
- `mobile/lib/providers/active_member_provider.dart`
- `mobile/lib/providers/auth_provider.dart`
- `mobile/lib/providers/core_providers.dart`
- `mobile/lib/providers/members_provider.dart`
- `mobile/lib/router/app_router.dart` · ⚠ SHARED (coordinator)
- `mobile/lib/screens/auth/login_screen.dart`
- `mobile/lib/screens/auth/splash_screen.dart`
- `mobile/lib/screens/family/members_screen.dart`
- `mobile/lib/services/api/api_client.dart`
- `mobile/lib/services/api/auth_api.dart`
- `mobile/lib/services/storage/logout_cleanup_marker_store.dart`
- `mobile/lib/services/storage/member_preference_store.dart`
- `mobile/lib/services/storage/secure_token_store.dart`
- `mobile/lib/widgets/shared/member_card.dart`

### Flutter tests

- `mobile/test/main_test.dart`
- `mobile/test/providers/active_member_provider_test.dart`
- `mobile/test/providers/auth_provider_test.dart`
- `mobile/test/router/route_guard_test.dart`
- `mobile/test/screens/login_screen_test.dart`
- `mobile/test/services/api_services_test.dart`
- `mobile/test/services/secure_storage_test.dart`

### CI

- `.github/workflows/ci.yml` · ⚠ SHARED (coordinator)

---

## S2 — Fernando K.R.N (IT24101875)

**Component:** Health Records & Extraction  
**Also owns:** OCR pipeline · file storage · synthetic seed data  
**Agent(s):** Extraction Agent  
**Branch:** `feature/s2-lab-ocr-extraction`  
**Commits as:** `@it24101875`  
**Report:** [`S2.md`](./S2.md) · **AI disclosure:** [`../ai-disclosure/S2.md`](../ai-disclosure/S2.md)

### Backend — API

- `backend/src/Api/Controllers/RecordsController.cs`

### Backend — Application

- `backend/src/Application/Records/RecordContracts.cs`

### Backend — Domain

- `backend/src/Domain/Records/RecordEntities.cs`

### Backend — Infrastructure

- `backend/src/Infrastructure/Agents/ExtractionAgent.cs`
- `backend/src/Infrastructure/Persistence/Configurations/RecordConfigurations.cs`
- `backend/src/Infrastructure/Records/LabExtractionService.cs`
- `backend/src/Infrastructure/Records/RecordService.cs`
- `backend/src/Infrastructure/Records/TesseractOcrService.cs`

### Backend — tests

- `backend/tests/UnitTests/LabExtractionParserTests.cs`
- `backend/tests/UnitTests/LabExtractionSafetyTests.cs`
- `backend/tests/UnitTests/LabReportDurableStorageTests.cs`
- `backend/tests/UnitTests/RecordServiceLabReviewTests.cs`

### React web

- `web/src/pages/records/RecordsPage.test.tsx`
- `web/src/pages/records/RecordsPage.tsx`

### Flutter mobile

- `mobile/lib/models/health_record.dart`
- `mobile/lib/providers/records_provider.dart`
- `mobile/lib/screens/records/lab_upload_screen.dart`
- `mobile/lib/screens/records/record_entry_screen.dart`
- `mobile/lib/screens/records/records_screen.dart`
- `mobile/lib/screens/records/vital_entry_screen.dart`
- `mobile/lib/services/api/mobile_api.dart`

### Flutter tests

- `mobile/test/screens/records_screen_test.dart`

---

## S3 — Karunathilaka K.D.J.C (IT24100551)

**Component:** Triage & Agent Orchestration  
**Also owns:** Group Leader · notifications  
**Agent(s):** Coordinator · Context · Analysis Agents  
**Branch:** `feature/s3-agent-orchestration`  
**Commits as:** `@Jani6969`  
**Report:** [`S3.md`](./S3.md) · **AI disclosure:** [`../ai-disclosure/S3.md`](../ai-disclosure/S3.md)

### Backend — API

- `backend/src/Api/Background/CaseSlaWorker.cs`
- `backend/src/Api/Background/TriageWorker.cs`
- `backend/src/Api/Controllers/TriageController.cs`

### Backend — Application

- `backend/src/Application/Agents/AgentContracts.cs` · ⚠ SHARED (coordinator)
- `backend/src/Application/Triage/TriageContracts.cs`

### Backend — Domain

- `backend/src/Domain/Triage/TriageEntities.cs`

### Backend — Infrastructure

- `backend/src/Infrastructure/Agents/AnalysisAgent.cs`
- `backend/src/Infrastructure/Agents/ChatCompletionsLlmClient.cs`
- `backend/src/Infrastructure/Agents/ContextAgent.cs`
- `backend/src/Infrastructure/Agents/GeminiClient.cs`
- `backend/src/Infrastructure/Agents/OllamaClient.cs`
- `backend/src/Infrastructure/Persistence/Configurations/TriageConfigurations.cs`
- `backend/src/Infrastructure/Triage/CaseSlaProcessor.cs`
- `backend/src/Infrastructure/Triage/FcmPushNotificationClient.cs`
- `backend/src/Infrastructure/Triage/NotificationService.cs`
- `backend/src/Infrastructure/Triage/TriageOrchestrator.cs`
- `backend/src/Infrastructure/Triage/TriageService.cs`
- `backend/src/Infrastructure/Triage/TriageWorkQueue.cs`

### Backend — tests

- `backend/tests/UnitTests/CaseSlaProcessorTests.cs`
- `backend/tests/UnitTests/ChatCompletionsLlmClientTests.cs`
- `backend/tests/UnitTests/NotificationServiceTests.cs`
- `backend/tests/UnitTests/OllamaClientTests.cs`
- `backend/tests/UnitTests/TriageOrchestratorEmergencyTests.cs`
- `backend/tests/UnitTests/TriageOrchestratorSchemaTests.cs`
- `backend/tests/UnitTests/TriageWorkerRecoveryTests.cs`

### React web

- `web/src/components/layout/AmbientMesh.tsx`
- `web/src/components/layout/AppLayout.tsx`
- `web/src/components/shared/ListToolbar.tsx`
- `web/src/components/shared/Pagination.tsx`
- `web/src/components/shared/StatusBadge.tsx`
- `web/src/components/shared/ViewState.test.tsx`
- `web/src/components/shared/ViewState.tsx`
- `web/src/index.css`
- `web/src/pages/dashboard/DashboardPage.tsx`
- `web/src/store/index.ts` · ⚠ SHARED (coordinator)
- `web/src/styles/components.css`
- `web/src/styles/materials.css`
- `web/src/styles/tokens.css`

### Flutter mobile

- `mobile/lib/models/app_notification.dart`
- `mobile/lib/models/triage_case.dart`
- `mobile/lib/providers/cases_provider.dart`
- `mobile/lib/providers/notifications_provider.dart`
- `mobile/lib/providers/push_registration_provider.dart`
- `mobile/lib/screens/home/home_screen.dart`
- `mobile/lib/screens/notifications/notifications_screen.dart`
- `mobile/lib/screens/triage/case_status_screen.dart`
- `mobile/lib/screens/triage/cases_screen.dart`
- `mobile/lib/screens/triage/submit_complaint_screen.dart`
- `mobile/lib/services/api/patient_api.dart`
- `mobile/lib/theme/app_theme.dart`
- `mobile/lib/theme/glass.dart`
- `mobile/lib/widgets/shared/async_state_views.dart`
- `mobile/lib/widgets/shared/brand_mark.dart`
- `mobile/lib/widgets/shared/status_stepper.dart`
- `mobile/lib/widgets/shared/symptom_chip.dart`

### Flutter tests

- `mobile/test/providers/patient_providers_test.dart`
- `mobile/test/screens/async_state_views_test.dart`
- `mobile/test/screens/case_status_screen_test.dart`
- `mobile/test/screens/home_screen_test.dart`

---

## S4 — W.M.S.S.B. Wasala (IT24100559)

**Component:** Familial Risk & Clinical Approval  
**Also owns:** deterministic rule tables  
**Agent(s):** Familial Risk · Safety/Validation Agents  
**Branch:** `feature/s4-approval-gate`  
**Commits as:** `@sahansbandara`  
**Report:** [`S4.md`](./S4.md) · **AI disclosure:** [`../ai-disclosure/S4.md`](../ai-disclosure/S4.md)

### Backend — API

- `backend/src/Api/Controllers/ClinicalController.cs`

### Backend — Application

- `backend/src/Application/Clinical/ClinicalContracts.cs`

### Backend — Domain

- `backend/src/Domain/Access/CaseGrantPolicy.cs`
- `backend/src/Domain/Clinical/ClinicalEntities.cs`
- `backend/src/Domain/FamilialRisk/FamilialRiskPolicy.cs`
- `backend/src/Domain/Safety/ClinicalRuleTables.cs`
- `backend/src/Domain/Safety/SafetyValidationService.cs`

### Backend — Infrastructure

- `backend/src/Infrastructure/Agents/FamilialRiskAgent.cs`
- `backend/src/Infrastructure/Clinical/ClinicalService.cs`
- `backend/src/Infrastructure/Persistence/Configurations/ClinicalConfigurations.cs`

### Backend — tests

- `backend/tests/UnitTests/CaseGrantPolicyTests.cs`
- `backend/tests/UnitTests/ClinicalCasePoolPrivacyTests.cs`
- `backend/tests/UnitTests/ClinicalEmergencyReferralTests.cs`
- `backend/tests/UnitTests/ClinicalRuleTableTests.cs`
- `backend/tests/UnitTests/FamilialRiskPolicyTests.cs`
- `backend/tests/UnitTests/SafetyValidationServiceTests.cs`

### React web

- `web/src/pages/admin/DoctorVerificationPage.tsx`
- `web/src/pages/audit/AuditPage.tsx`
- `web/src/pages/auth/DoctorRegisterPage.tsx`
- `web/src/pages/doctor/ApprovalsPage.test.tsx`
- `web/src/pages/doctor/ApprovalsPage.tsx`
- `web/src/pages/doctor/CasesPage.tsx`
- `web/src/pages/doctor/DoctorStatusPage.tsx`
- `web/src/pages/system/SystemPages.tsx`

### Flutter mobile

- `mobile/lib/models/approved_guidance.dart`
- `mobile/lib/providers/guidance_provider.dart`
- `mobile/lib/screens/emergency/emergency_screen.dart`
- `mobile/lib/screens/risk/approved_guidance_screen.dart`
- `mobile/lib/widgets/shared/clinical_disclaimer.dart`

### Flutter tests

- `mobile/test/models/approved_guidance_test.dart`
- `mobile/test/providers/guidance_provider_test.dart`
- `mobile/test/screens/approved_guidance_screen_test.dart`
- `mobile/test/screens/emergency_screen_test.dart`

---

## ⚠ SHARED files — the only real conflict surface

Add lines **inside your own labelled block**. Never reorder or reformat existing lines (`agent/MEMORY.md:63`).

| File | Coordinator |
|---|---|
| `.github/workflows/ci.yml` | S1 |
| `backend/src/Api/Program.cs` | S1 |
| `backend/src/Infrastructure/DependencyInjection.cs` | S1 |
| `backend/src/Infrastructure/Persistence/AppDbContext.cs` | S1 |
| `backend/src/Infrastructure/Persistence/DatabaseInitializer.cs` | S1 |
| `mobile/lib/main.dart` | S1 |
| `mobile/lib/router/app_router.dart` | S1 |
| `web/src/routes/AppRouter.tsx` | S1 |
| `backend/src/Application/Agents/AgentContracts.cs` | S3 |
| `web/src/store/index.ts` | S3 |

## Verification commands

```bash
# every commit a member has authored
git log --author="Fernando" --oneline | wc -l

# who last touched each of a member's files
grep -E '^S2\s' docs/OWNERSHIP.tsv | cut -f2 | \
  xargs -I{} git log -1 --format="%an  {}" -- {}

# confirm every tracked source file is assigned
git ls-files backend/src backend/tests web/src mobile/lib mobile/test \
  | grep -vE '\.(png|svg)$' | sort > /tmp/tracked.txt
grep -vE '^\s*#|^\s*$' docs/OWNERSHIP.tsv | cut -f2 | sort > /tmp/owned.txt
comm -23 /tmp/tracked.txt /tmp/owned.txt   # expect only Migrations/*
```

