# Family Veda — Component-to-File Directory Architecture Map

> **SE3090 Software Engineering Frameworks · SLIIT · Assignment 1 · Group SE_016**  
> Single source of truth for repository structure, Clean Architecture feature mappings, and student component ownership.

---

## 1. Architectural Architecture & University Compliance

In accordance with **SLIIT SE3090 Assignment 1 specification** and industry Clean Architecture standards:
- **One Unified System**: React (Web) and Flutter (Mobile) consume a single, shared ASP.NET Core Web API with one PostgreSQL database.
- **Why a "Folder-per-Student" layout is strictly forbidden**:
  - Placing code into disconnected student folders (e.g. `/Component1_S1`, `/Component2_S2`) breaks Clean Architecture layers (`Domain` ➔ `Application` ➔ `Infrastructure` ➔ `Api`), breaks .NET project references (`.csproj`), breaks Vite/TypeScript imports, breaks Flutter packages, and breaks Docker/CI pipelines.
  - In university grading, examiners evaluate an **integrated enterprise system**. A folder-per-student layout is penalised as an unintegrated project.
- **Individual Marks (70/100) Verification**:
  - Individual contributions are assessed and proven through:
    1. **`git log --author`** (genuine commits and pull requests).
    2. **File-level Ownership Manifest** ([`docs/OWNERSHIP.tsv`](docs/OWNERSHIP.tsv)).
    3. **File Header Tags** (`/* Owner: S3 · ... */`).
    4. **`.github/CODEOWNERS`**.

---

## 2. Component Ownership Summary Matrix

| Comp | Ref | Owner / IT Number | Business Domain | Owned AI Agent(s) | Primary Scope |
|---|---|---|---|---|---|
| **1** | **S1** | **Samaranayaka S.G.V.S**<br>`IT23544154` | **Family, Identity & Consent** | — *(owns Tool Security & CI)* | Auth, RBAC, Family Onboarding, Consent State Machine, Tool Registry/Dispatcher |
| **2** | **S2** | **Fernando K.R.N**<br>`IT24101875` | **Health Records & Extraction** | **Extraction Agent** | Health Records, Vitals, Lab Reports, OCR Pipeline, Structured Parsing |
| **3** | **S3** | **Karunathilaka K.D.J.C**<br>`IT24100551` *(Group Leader)* | **Symptoms, Triage & Orchestration** | **Context Agent**<br>**Analysis Agent** | Symptom Wizard, Triage Pipeline, SLA Processing, Multi-Agent Orchestration, Notifications |
| **4** | **S4** | **W.M.S.S.B. Wasala**<br>`IT24100559` | **Familial Risk & Clinical Approval** | **Familial Risk Agent**<br>**Safety Agent** *(No LLM)* | Pedigree Risk, Deterministic Safety Rule Tables, Doctor Approval Desk, Case Grants |

---

## 3. Directory Map by Component

```
Family-Veda-SEF-Project/
├── backend/
│   └── src/
│       ├── Domain/             <-- Entities, enums, pure business domain policies
│       ├── Application/        <-- DTOs, contracts, interfaces, validation
│       ├── Infrastructure/     <-- EF Core, external services, AI agents, repositories
│       └── Api/                <-- Controllers, middleware, background workers, host
├── web/
│   └── src/
│       ├── pages/              <-- Page views organized by domain/feature
│       ├── components/         <-- Reusable UI components by feature
│       ├── services/           <-- API client and endpoint handlers
│       └── styles/             <-- Theme tokens and scoped CSS
├── mobile/
│   └── lib/
│       ├── screens/            <-- Flutter screen widgets by domain
│       ├── models/             <-- Domain entities and DTOs
│       ├── providers/          <-- Riverpod state providers
│       └── services/           <-- API client and secure storage
└── docs/                       <-- Specifications, ADRs, test plans, and evidence
```

---

### 🔵 Component 1: Family, Identity & Consent Management
**Owner:** `[S1]` Samaranayaka S.G.V.S (`IT23544154`)

#### Backend (`backend/`)
* **Controllers & Middleware**:
  - `backend/src/Api/Controllers/ApiControllerBase.cs`
  - `backend/src/Api/Controllers/Component1_Family/AuthController.cs`
  - `backend/src/Api/Controllers/Component1_Family/FamiliesController.cs`
  - `backend/src/Api/Controllers/Component1_Family/MembersController.cs`
  - `backend/src/Api/Controllers/Component1_Family/FamilyHeadTransfersController.cs`
  - `backend/src/Api/Controllers/Component1_Family/FamilyLifecycleController.cs`
  - `backend/src/Api/Controllers/Component1_Family/JoinRequestsController.cs`
  - `backend/src/Api/Controllers/Component1_Family/ProfileController.cs`
  - `backend/src/Api/Middleware/ExceptionMiddleware.cs`
  - `backend/src/Api/Security/HttpCurrentUser.cs`
* **Domain Layer**:
  - `backend/src/Domain/Component1_Family/Identity/IdentityEntities.cs`
  - `backend/src/Domain/Component1_Family/Consent/ConsentStateMachine.cs`
* **Application Layer**:
  - `backend/src/Application/Component1_Family/Auth/AuthContracts.cs`
  - `backend/src/Application/Component1_Family/Families/FamilyContracts.cs`
  - `backend/src/Application/Agents/ToolRegistry.cs` *(Tool Security Layer)*
  - `backend/src/Application/Component1_Family/Validation/RequestValidators.cs`
* **Infrastructure Layer**:
  - `backend/src/Infrastructure/Component1_Family/Auth/AuthService.cs`
  - `backend/src/Infrastructure/Component1_Family/Families/FamilyService.cs`
  - `backend/src/Infrastructure/Agents/Component1_Family/ToolDispatcher.cs` *(Tool Dispatcher Layer)*
  - `backend/src/Infrastructure/Persistence/Configurations/IdentityConfigurations.cs`
* **Tests**:
  - `backend/tests/UnitTests/ConsentStateMachineTests.cs`
  - `backend/tests/UnitTests/FamilyServicePrivacyTests.cs`
  - `backend/tests/UnitTests/ToolRegistryTests.cs`
  - `backend/tests/UnitTests/ToolDispatcherTests.cs`
  - `backend/tests/IntegrationTests/AuthAndPatientFlowTests.cs`

#### Frontend Web (`web/src/`)
* `web/src/pages/auth/LoginPage.tsx` & `.test.tsx`
* `web/src/pages/auth/RegisterPage.tsx`
* `web/src/pages/family/FamilyPage.tsx`
* `web/src/pages/family/OnboardingPage.tsx` & `.test.tsx`
* `web/src/pages/public/PublicInformationPage.tsx` & `.test.tsx`
* `web/src/routes/RouteGuard.tsx`
* `web/src/store/slices/authSlice.ts` & `.test.ts`

#### Mobile (`mobile/lib/`)
* `mobile/lib/screens/auth/login_screen.dart`
* `mobile/lib/screens/auth/splash_screen.dart`
* `mobile/lib/screens/family/members_screen.dart`
* `mobile/lib/models/member.dart`
* `mobile/lib/providers/auth_provider.dart`
* `mobile/lib/providers/members_provider.dart`
* `mobile/lib/services/api/auth_api.dart`
* `mobile/lib/services/storage/secure_token_store.dart`

---

### 🟢 Component 2: Health Records & Extraction
**Owner:** `[S2]` Fernando K.R.N (`IT24101875`)

#### Backend (`backend/`)
* **Controllers**:
  - `backend/src/Api/Controllers/Component2_Records/RecordsController.cs`
* **Domain Layer**:
  - `backend/src/Domain/Component2_Records/Records/RecordEntities.cs`
  - `backend/src/Domain/Component2_Records/Records/LabRangeClassifier.cs`
* **Application Layer**:
  - `backend/src/Application/Component2_Records/Records/RecordContracts.cs`
* **Infrastructure Layer & AI Agent**:
  - `backend/src/Infrastructure/Component2_Records/Records/RecordService.cs`
  - `backend/src/Infrastructure/Component2_Records/Records/LabExtractionService.cs`
  - `backend/src/Infrastructure/Component2_Records/Records/TesseractOcrService.cs`
  - `backend/src/Infrastructure/Agents/Component2_Records/ExtractionAgent.cs` **(AI Extraction Agent)**
  - `backend/src/Infrastructure/Persistence/Configurations/RecordConfigurations.cs`
* **Tests**:
  - `backend/tests/UnitTests/LabExtractionParserTests.cs`
  - `backend/tests/UnitTests/LabExtractionSafetyTests.cs`
  - `backend/tests/UnitTests/LabReportDurableStorageTests.cs`
  - `backend/tests/UnitTests/RecordServiceLabReviewTests.cs`

#### Frontend Web (`web/src/`)
* `web/src/pages/records/RecordsPage.tsx` & `.test.tsx`
* `web/src/pages/records/RecordSummaryText.tsx`
* `web/src/pages/records/recordSummaryMeta.ts` & `.test.ts`
* `web/src/components/records/RecordedRangeVisual.tsx` & `.test.tsx`
* `web/src/components/records/OriginalReportPreview.tsx` & `.test.tsx`
* `web/src/components/records/ReportThumbnail.tsx` & `.test.tsx`
* `web/src/components/records/PdfReportCanvas.tsx` & `.test.tsx`

#### Mobile (`mobile/lib/`)
* `mobile/lib/screens/records/records_screen.dart`
* `mobile/lib/screens/records/record_entry_screen.dart`
* `mobile/lib/screens/records/lab_upload_screen.dart`
* `mobile/lib/screens/records/vital_entry_screen.dart`
* `mobile/lib/models/health_record.dart`
* `mobile/lib/models/record_summary_meta.dart`
* `mobile/lib/providers/records_provider.dart`

---

### 🟡 Component 3: Symptoms, Triage & Agent Orchestration
**Owner:** `[S3]` Karunathilaka K.D.J.C (`IT24100551` - Group Leader)

#### Backend (`backend/`)
* **Controllers & Background Workers**:
  - `backend/src/Api/Controllers/Component3_Triage/TriageController.cs`
  - `backend/src/Api/Controllers/Component3_Triage/NotificationsController.cs`
  - `backend/src/Api/Controllers/Component3_Triage/DashboardController.cs`
  - `backend/src/Api/Background/TriageWorker.cs`
  - `backend/src/Api/Background/CaseSlaWorker.cs`
* **Domain Layer**:
  - `backend/src/Domain/Component3_Triage/Triage/TriageEntities.cs`
* **Application Layer**:
  - `backend/src/Application/Component3_Triage/Triage/TriageContracts.cs`
  - `backend/src/Application/Agents/AgentContracts.cs`
* **Infrastructure Layer & AI Agents**:
  - `backend/src/Infrastructure/Component3_Triage/Triage/TriageOrchestrator.cs` **(Agent Coordinator)**
  - `backend/src/Infrastructure/Component3_Triage/Triage/TriageService.cs`
  - `backend/src/Infrastructure/Component3_Triage/Triage/TriageWorkQueue.cs`
  - `backend/src/Infrastructure/Component3_Triage/Triage/CaseSlaProcessor.cs`
  - `backend/src/Infrastructure/Component3_Triage/Triage/NotificationService.cs`
  - `backend/src/Infrastructure/Component3_Triage/Triage/FcmPushNotificationClient.cs`
  - `backend/src/Infrastructure/Agents/Component3_Triage/ContextAgent.cs` **(AI Context Agent)**
  - `backend/src/Infrastructure/Agents/Component3_Triage/AnalysisAgent.cs` **(AI Analysis Agent)**
  - `backend/src/Infrastructure/Agents/Component3_Triage/GeminiClient.cs`
  - `backend/src/Infrastructure/Agents/Component3_Triage/ChatCompletionsLlmClient.cs`
  - `backend/src/Infrastructure/Agents/Component3_Triage/LlmFallbackClient.cs`
  - `backend/src/Infrastructure/Persistence/Configurations/TriageConfigurations.cs`
* **Tests**:
  - `backend/tests/UnitTests/TriageOrchestratorSchemaTests.cs`
  - `backend/tests/UnitTests/TriageOrchestratorEmergencyTests.cs`
  - `backend/tests/UnitTests/TriageWorkerRecoveryTests.cs`
  - `backend/tests/UnitTests/CaseSlaProcessorTests.cs`
  - `backend/tests/UnitTests/NotificationServiceTests.cs`
  - `backend/tests/UnitTests/ChatCompletionsLlmClientTests.cs`

#### Frontend Web (`web/src/`)
* `web/src/pages/triage/TriagePage.tsx` & `.test.tsx`
* `web/src/pages/triage/AgentPipeline.tsx`
* `web/src/pages/triage/pipelineStages.ts`
* `web/src/pages/dashboard/DashboardPage.tsx`
* `web/src/components/layout/AppLayout.tsx`
* `web/src/components/layout/AmbientMesh.tsx`
* `web/src/components/shared/` (`StatusBadge`, `ViewState`, `AiBadge`, `ListToolbar`, `Pagination`)
* `web/src/styles/tokens.css` *(Core Design Tokens)*
* `web/src/styles/triage-redesign.css`

#### Mobile (`mobile/lib/`)
* `mobile/lib/screens/home/home_screen.dart`
* `mobile/lib/screens/triage/submit_complaint_screen.dart`
* `mobile/lib/screens/triage/cases_screen.dart`
* `mobile/lib/screens/triage/case_status_screen.dart`
* `mobile/lib/screens/notifications/notifications_screen.dart`
* `mobile/lib/models/triage_case.dart`
* `mobile/lib/models/app_notification.dart`
* `mobile/lib/providers/cases_provider.dart`
* `mobile/lib/providers/notifications_provider.dart`
* `mobile/lib/theme/app_theme.dart` & `glass.dart`

---

### 🔴 Component 4: Familial Risk & Clinical Approval
**Owner:** `[S4]` W.M.S.S.B. Wasala (`IT24100559`)

#### Backend (`backend/`)
* **Controllers**:
  - `backend/src/Api/Controllers/Component4_Clinical/ClinicalController.cs`
  - `backend/src/Api/Controllers/Component4_Clinical/AppointmentsController.cs`
  - `backend/src/Api/Controllers/Component4_Clinical/DoctorWorkspaceController.cs`
  - `backend/src/Api/Controllers/Component4_Clinical/FamilyDoctorController.cs`
* **Domain Layer & Safety Engine**:
  - `backend/src/Domain/Component4_Clinical/Clinical/ClinicalEntities.cs`
  - `backend/src/Domain/Component4_Clinical/Access/CaseGrantPolicy.cs`
  - `backend/src/Domain/Component4_Clinical/FamilialRisk/FamilialRiskPolicy.cs`
  - `backend/src/Domain/Component4_Clinical/Safety/ClinicalRuleTables.cs`
  - `backend/src/Domain/Component4_Clinical/Safety/SafetyValidationService.cs` **(Deterministic Safety Agent, No LLM)**
* **Application Layer**:
  - `backend/src/Application/Component4_Clinical/Clinical/ClinicalContracts.cs`
* **Infrastructure Layer & AI Agent**:
  - `backend/src/Infrastructure/Component4_Clinical/Clinical/ClinicalService.cs`
  - `backend/src/Infrastructure/Agents/Component4_Clinical/FamilialRiskAgent.cs` **(AI Familial Risk Agent)**
  - `backend/src/Infrastructure/Persistence/Configurations/ClinicalConfigurations.cs`
* **Tests**:
  - `backend/tests/UnitTests/CaseGrantPolicyTests.cs`
  - `backend/tests/UnitTests/ClinicalCasePoolPrivacyTests.cs`
  - `backend/tests/UnitTests/ClinicalEmergencyReferralTests.cs`
  - `backend/tests/UnitTests/ClinicalRuleTableTests.cs`
  - `backend/tests/UnitTests/FamilialRiskPolicyTests.cs`
  - `backend/tests/UnitTests/SafetyValidationServiceTests.cs`

#### Frontend Web (`web/src/`)
* `web/src/pages/doctor/ApprovalsPage.tsx` & `.test.tsx`
* `web/src/pages/doctor/ApprovalDecisionPanel.tsx`
* `web/src/pages/doctor/ApprovalEvidenceTabs.tsx`
* `web/src/pages/doctor/CasesPage.tsx` & `.test.tsx`
* `web/src/pages/doctor/DoctorCalendarPage.tsx` & `.test.tsx`
* `web/src/pages/doctor/SafetyChecks.tsx` & `safetyRules.ts`
* `web/src/pages/family/FamilyRiskPage.tsx` & `.test.tsx`
* `web/src/pages/auth/DoctorRegisterPage.tsx` & `.test.tsx`
* `web/src/pages/admin/DoctorVerificationPage.tsx`
* `web/src/styles/care-workspace.css`, `approval-desk.css`, `doctor-calendar.css`

#### Mobile (`mobile/lib/`)
* `mobile/lib/screens/doctor/` (`doctor_calendar_screen`, `doctor_triage_cases_screen`, `doctor_families_screen`, `doctor_profile_screen`)
* `mobile/lib/screens/risk/approved_guidance_screen.dart`
* `mobile/lib/screens/emergency/emergency_screen.dart`
* `mobile/lib/models/doctor_queue_case.dart`, `approved_guidance.dart`, `doctor_practice.dart`
* `mobile/lib/providers/doctor_cases_provider.dart`, `guidance_provider.dart`

---

### ⚠ Shared Infrastructure (`SHARED` Labelled Blocks)
These files are shared across the team. Any edits must occur strictly within the labelled comment block corresponding to the author's tag:
1. `backend/src/Api/Program.cs` `[SHARED:S1]`
2. `backend/src/Infrastructure/Persistence/AppDbContext.cs` `[SHARED:S1]`
3. `backend/src/Infrastructure/DependencyInjection.cs` `[SHARED:S1]`
4. `web/src/routes/AppRouter.tsx` `[SHARED:S1]`
5. `web/src/store/index.ts` `[SHARED:S3]`
6. `mobile/lib/main.dart` `[SHARED:S1]`
7. `mobile/lib/router/app_router.dart` `[SHARED:S1]`

---

## 4. How to Find & Filter Files in VS Code
- **Search by Owner**: Press `Ctrl + Shift + F` and search for `Owner: S1`, `Owner: S2`, `Owner: S3`, or `Owner: S4`.
- **Search by Feature**:
  - Family / Auth ➔ Look in `Application/Families`, `Domain/Identity`, `web/pages/family`, `web/pages/auth`
  - Records / OCR ➔ Look in `Application/Records`, `Domain/Records`, `web/pages/records`, `mobile/screens/records`
  - Triage / AI ➔ Look in `Application/Triage`, `Domain/Triage`, `web/pages/triage`, `mobile/screens/triage`
  - Doctor / Risk ➔ Look in `Application/Clinical`, `Domain/Clinical`, `web/pages/doctor`, `mobile/screens/doctor`
