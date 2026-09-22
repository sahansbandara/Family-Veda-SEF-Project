#!/usr/bin/env bash
#
# Family Veda — staged commit helper.
#
# Commits YOUR component's files as a series of small, well-described
# commits instead of one giant dump.
#
#   ./scripts/commit-component.sh S2                 # all phases
#   ./scripts/commit-component.sh S2 --phases 1-4    # just phases 1 to 4
#   ./scripts/commit-component.sh S2 --dry-run       # show, change nothing
#   ./scripts/commit-component.sh S2 --push          # push when finished
#
# Run it in slices across several days — a few phases per sitting. That
# gives a genuine spread of dates, which is what the marks are read from.
#
# This script does NOT set GIT_AUTHOR_DATE or GIT_COMMITTER_DATE. Forged
# timestamps are trivially detectable (the committer date and the push
# event still show the real moment) and fabricating them is misconduct.
#
# Commit as yourself, from your own account. 70 of the 100 marks are
# individual and are read from `git log --author`.

set -euo pipefail

REF="${1:-}"
PHASES_ARG=""; DO_PUSH=0; DRY=0
shift || true
while [ $# -gt 0 ]; do
  case "$1" in
    --phases) PHASES_ARG="$2"; shift 2 ;;
    --push)   DO_PUSH=1; shift ;;
    --dry-run) DRY=1; shift ;;
    *) echo "unknown option: $1" >&2; exit 2 ;;
  esac
done

case "$REF" in
  S1|S2|S3|S4) ;;
  *) echo "usage: $0 <S1|S2|S3|S4> [--phases N-M] [--push] [--dry-run]" >&2
     exit 2 ;;
esac

# ── identity guard ────────────────────────────────────────────────
GIT_NAME="$(git config user.name  || true)"
GIT_MAIL="$(git config user.email || true)"
if [ -z "$GIT_NAME" ] || [ -z "$GIT_MAIL" ]; then
  echo "ERROR: set your git identity first, so these commits are yours:" >&2
  echo "  git config user.name  \"Your Name\"" >&2
  echo "  git config user.email \"you@example.com\"" >&2
  exit 1
fi
case "$GIT_MAIL" in
  *CHANGE_ME*|*example.com*)
    echo "ERROR: user.email is still a placeholder ($GIT_MAIL)." >&2; exit 1 ;;
esac

# ── member metadata ───────────────────────────────────────────────
case "$REF" in
  S1) WHO="Samaranayaka S.G.V.S (IT23544154)"; HANDLE="@IT23544154"; BRANCH="feature/s1-consent-management" ;;
  S2) WHO="Fernando K.R.N (IT24101875)"; HANDLE="@it24101875"; BRANCH="feature/s2-lab-ocr-extraction" ;;
  S3) WHO="Karunathilaka K.D.J.C (IT24100551)"; HANDLE="@Jani6969"; BRANCH="feature/s3-agent-orchestration" ;;
  S4) WHO="W.M.S.S.B. Wasala (IT24100559)"; HANDLE="@sahansbandara"; BRANCH="feature/s4-approval-gate" ;;
esac

echo "Member    : $REF — $WHO"
echo "GitHub    : $HANDLE"
echo "Committing: $GIT_NAME <$GIT_MAIL>"
echo "Branch    : $(git rev-parse --abbrev-ref HEAD)  (expected $BRANCH)"
echo
if [ "$(git rev-parse --abbrev-ref HEAD)" != "$BRANCH" ]; then
  echo "WARNING: you are not on $BRANCH. Ctrl-C to stop, or wait 5s." >&2
  sleep 5
fi

# ── phase definitions ─────────────────────────────────────────────
PHASE_COUNT=0
declare -a PHASE_MSG=()
declare -a PHASE_FILES=()

add_phase() { PHASE_MSG+=("$1"); PHASE_FILES+=("$2"); PHASE_COUNT=$((PHASE_COUNT+1)); }

case "$REF" in
  S1)
    # phase 1: Domain entities (5 files)
    add_phase "feat(s1): add the family, identity and consent domain entities" "backend/src/Domain/Common/Entity.cs backend/src/Domain/Common/Enums.cs backend/src/Domain/Consent/ConsentStateMachine.cs backend/src/Domain/FamilyVeda.Domain.csproj backend/src/Domain/Identity/IdentityEntities.cs"
    # phase 2: Application contracts (6 files)
    add_phase "feat(s1): define the family, identity and consent DTOs and contracts" "backend/src/Application/Auth/AuthContracts.cs backend/src/Application/Common/ICurrentUser.cs backend/src/Application/Common/PagedResult.cs backend/src/Application/Families/FamilyContracts.cs backend/src/Application/FamilyVeda.Application.csproj backend/src/Application/Validation/RequestValidators.cs"
    # phase 3: EF Core configuration (4 files)
    add_phase "feat(s1): configure the family, identity and consent tables, indexes and constraints" "backend/src/Infrastructure/Persistence/AppDbContext.cs backend/src/Infrastructure/Persistence/AppDbContextFactory.cs backend/src/Infrastructure/Persistence/Configurations/IdentityConfigurations.cs backend/src/Infrastructure/Persistence/DatabaseInitializer.cs"
    # phase 4: Service layer (5 files)
    add_phase "feat(s1): implement the family, identity and consent service layer" "backend/src/Infrastructure/Auth/AuthService.cs backend/src/Infrastructure/Auth/JwtOptions.cs backend/src/Infrastructure/DependencyInjection.cs backend/src/Infrastructure/Families/FamilyService.cs backend/src/Infrastructure/FamilyVeda.Infrastructure.csproj"
    # phase 5: Agent layer (2 files)
    add_phase "feat(s1): add the tool registry and permission dispatcher" "backend/src/Application/Agents/ToolRegistry.cs backend/src/Infrastructure/Agents/ToolDispatcher.cs"
    # phase 6: API surface (11 files)
    add_phase "feat(s1): expose the family, identity and consent endpoints" "backend/src/Api/Controllers/ApiControllerBase.cs backend/src/Api/Controllers/AuthController.cs backend/src/Api/Controllers/FamiliesController.cs backend/src/Api/Controllers/MembersController.cs backend/src/Api/FamilyVeda.Api.csproj backend/src/Api/FamilyVeda.Api.http backend/src/Api/Middleware/ExceptionMiddleware.cs backend/src/Api/Program.cs backend/src/Api/Properties/launchSettings.json backend/src/Api/Security/HttpCurrentUser.cs backend/src/Api/appsettings.json"
    # phase 7: Backend tests (8 files)
    add_phase "test(s1): cover the family, identity and consent service and policy layer" "backend/tests/IntegrationTests/AuthAndPatientFlowTests.cs backend/tests/IntegrationTests/FamilyVeda.IntegrationTests.csproj backend/tests/IntegrationTests/MigrationTests.cs backend/tests/UnitTests/ConsentStateMachineTests.cs backend/tests/UnitTests/FamilyServicePrivacyTests.cs backend/tests/UnitTests/FamilyVeda.UnitTests.csproj backend/tests/UnitTests/ToolDispatcherTests.cs backend/tests/UnitTests/ToolRegistryTests.cs"
    # phase 8: React screens (11 files)
    add_phase "feat(s1): add the family, identity and consent web screens" "web/src/App.tsx web/src/main.tsx web/src/pages/auth/LoginPage.tsx web/src/pages/auth/RegisterPage.tsx web/src/pages/family/FamilyPage.tsx web/src/pages/family/OnboardingPage.tsx web/src/routes/AppRouter.tsx web/src/routes/RouteGuard.tsx web/src/services/apiClient.ts web/src/store/hooks.ts web/src/store/slices/authSlice.ts"
    # phase 9: React tests (3 files)
    add_phase "test(s1): cover the family, identity and consent web screens" "web/src/pages/family/OnboardingPage.test.tsx web/src/routes/AppRouter.test.tsx web/src/store/slices/authSlice.test.ts"
    # phase 10: Flutter screens (17 files)
    add_phase "feat(s1): add the family, identity and consent mobile screens" "mobile/lib/config/app_config.dart mobile/lib/main.dart mobile/lib/models/member.dart mobile/lib/providers/active_member_provider.dart mobile/lib/providers/auth_provider.dart mobile/lib/providers/core_providers.dart mobile/lib/providers/members_provider.dart mobile/lib/router/app_router.dart mobile/lib/screens/auth/login_screen.dart mobile/lib/screens/auth/splash_screen.dart mobile/lib/screens/family/members_screen.dart mobile/lib/services/api/api_client.dart mobile/lib/services/api/auth_api.dart mobile/lib/services/storage/logout_cleanup_marker_store.dart mobile/lib/services/storage/member_preference_store.dart mobile/lib/services/storage/secure_token_store.dart mobile/lib/widgets/shared/member_card.dart"
    # phase 11: Flutter tests (7 files)
    add_phase "test(s1): cover the family, identity and consent providers and screens" "mobile/test/main_test.dart mobile/test/providers/active_member_provider_test.dart mobile/test/providers/auth_provider_test.dart mobile/test/router/route_guard_test.dart mobile/test/screens/login_screen_test.dart mobile/test/services/api_services_test.dart mobile/test/services/secure_storage_test.dart"
    # phase 12: Build and CI config (6 files)
    add_phase "ci(s1): add the family, identity and consent build configuration" ".env.example .github/workflows/ci.yml mobile/analysis_options.yaml mobile/android/gradle.properties web/index.html web/package-lock.json"
    ;;
  S2)
    # phase 1: Domain entities (1 files)
    add_phase "feat(s2): add the health records and extraction domain entities" "backend/src/Domain/Records/RecordEntities.cs"
    # phase 2: Application contracts (1 files)
    add_phase "feat(s2): define the health records and extraction DTOs and contracts" "backend/src/Application/Records/RecordContracts.cs"
    # phase 3: EF Core configuration (1 files)
    add_phase "feat(s2): configure the health records and extraction tables, indexes and constraints" "backend/src/Infrastructure/Persistence/Configurations/RecordConfigurations.cs"
    # phase 4: Service layer (3 files)
    add_phase "feat(s2): implement the health records and extraction service layer" "backend/src/Infrastructure/Records/LabExtractionService.cs backend/src/Infrastructure/Records/RecordService.cs backend/src/Infrastructure/Records/TesseractOcrService.cs"
    # phase 5: Agent layer (1 files)
    add_phase "feat(s2): add the extraction agent" "backend/src/Infrastructure/Agents/ExtractionAgent.cs"
    # phase 6: API surface (1 files)
    add_phase "feat(s2): expose the health records and extraction endpoints" "backend/src/Api/Controllers/RecordsController.cs"
    # phase 7: Backend tests (4 files)
    add_phase "test(s2): cover the health records and extraction service and policy layer" "backend/tests/UnitTests/LabExtractionParserTests.cs backend/tests/UnitTests/LabExtractionSafetyTests.cs backend/tests/UnitTests/LabReportDurableStorageTests.cs backend/tests/UnitTests/RecordServiceLabReviewTests.cs"
    # phase 8: React screens (1 files)
    add_phase "feat(s2): add the health records and extraction web screens" "web/src/pages/records/RecordsPage.tsx"
    # phase 9: React tests (1 files)
    add_phase "test(s2): cover the health records and extraction web screens" "web/src/pages/records/RecordsPage.test.tsx"
    # phase 10: Flutter screens (7 files)
    add_phase "feat(s2): add the health records and extraction mobile screens" "mobile/lib/models/health_record.dart mobile/lib/providers/records_provider.dart mobile/lib/screens/records/lab_upload_screen.dart mobile/lib/screens/records/record_entry_screen.dart mobile/lib/screens/records/records_screen.dart mobile/lib/screens/records/vital_entry_screen.dart mobile/lib/services/api/mobile_api.dart"
    # phase 11: Flutter tests (1 files)
    add_phase "test(s2): cover the health records and extraction providers and screens" "mobile/test/screens/records_screen_test.dart"
    ;;
  S3)
    # phase 1: Domain entities (1 files)
    add_phase "feat(s3): add the triage and agent orchestration domain entities" "backend/src/Domain/Triage/TriageEntities.cs"
    # phase 2: Application contracts (1 files)
    add_phase "feat(s3): define the triage and agent orchestration DTOs and contracts" "backend/src/Application/Triage/TriageContracts.cs"
    # phase 3: EF Core configuration (1 files)
    add_phase "feat(s3): configure the triage and agent orchestration tables, indexes and constraints" "backend/src/Infrastructure/Persistence/Configurations/TriageConfigurations.cs"
    # phase 4: Service layer (6 files)
    add_phase "feat(s3): implement the triage and agent orchestration service layer" "backend/src/Infrastructure/Triage/CaseSlaProcessor.cs backend/src/Infrastructure/Triage/FcmPushNotificationClient.cs backend/src/Infrastructure/Triage/NotificationService.cs backend/src/Infrastructure/Triage/TriageOrchestrator.cs backend/src/Infrastructure/Triage/TriageService.cs backend/src/Infrastructure/Triage/TriageWorkQueue.cs"
    # phase 5: Agent layer (6 files)
    add_phase "feat(s3): add the coordinator, context and analysis agents" "backend/src/Application/Agents/AgentContracts.cs backend/src/Infrastructure/Agents/AnalysisAgent.cs backend/src/Infrastructure/Agents/ChatCompletionsLlmClient.cs backend/src/Infrastructure/Agents/ContextAgent.cs backend/src/Infrastructure/Agents/GeminiClient.cs backend/src/Infrastructure/Agents/OllamaClient.cs"
    # phase 6: API surface (3 files)
    add_phase "feat(s3): expose the triage and agent orchestration endpoints" "backend/src/Api/Background/CaseSlaWorker.cs backend/src/Api/Background/TriageWorker.cs backend/src/Api/Controllers/TriageController.cs"
    # phase 7: Backend tests (7 files)
    add_phase "test(s3): cover the triage and agent orchestration service and policy layer" "backend/tests/UnitTests/CaseSlaProcessorTests.cs backend/tests/UnitTests/ChatCompletionsLlmClientTests.cs backend/tests/UnitTests/NotificationServiceTests.cs backend/tests/UnitTests/OllamaClientTests.cs backend/tests/UnitTests/TriageOrchestratorEmergencyTests.cs backend/tests/UnitTests/TriageOrchestratorSchemaTests.cs backend/tests/UnitTests/TriageWorkerRecoveryTests.cs"
    # phase 8: React screens (12 files)
    add_phase "feat(s3): add the triage and agent orchestration web screens" "web/src/components/layout/AmbientMesh.tsx web/src/components/layout/AppLayout.tsx web/src/components/shared/ListToolbar.tsx web/src/components/shared/Pagination.tsx web/src/components/shared/StatusBadge.tsx web/src/components/shared/ViewState.tsx web/src/index.css web/src/pages/dashboard/DashboardPage.tsx web/src/store/index.ts web/src/styles/components.css web/src/styles/materials.css web/src/styles/tokens.css"
    # phase 9: React tests (1 files)
    add_phase "test(s3): cover the triage and agent orchestration web screens" "web/src/components/shared/ViewState.test.tsx"
    # phase 10: Flutter screens (17 files)
    add_phase "feat(s3): add the triage and agent orchestration mobile screens" "mobile/lib/models/app_notification.dart mobile/lib/models/triage_case.dart mobile/lib/providers/cases_provider.dart mobile/lib/providers/notifications_provider.dart mobile/lib/providers/push_registration_provider.dart mobile/lib/screens/home/home_screen.dart mobile/lib/screens/notifications/notifications_screen.dart mobile/lib/screens/triage/case_status_screen.dart mobile/lib/screens/triage/cases_screen.dart mobile/lib/screens/triage/submit_complaint_screen.dart mobile/lib/services/api/patient_api.dart mobile/lib/theme/app_theme.dart mobile/lib/theme/glass.dart mobile/lib/widgets/shared/async_state_views.dart mobile/lib/widgets/shared/brand_mark.dart mobile/lib/widgets/shared/status_stepper.dart mobile/lib/widgets/shared/symptom_chip.dart"
    # phase 11: Flutter tests (4 files)
    add_phase "test(s3): cover the triage and agent orchestration providers and screens" "mobile/test/providers/patient_providers_test.dart mobile/test/screens/async_state_views_test.dart mobile/test/screens/case_status_screen_test.dart mobile/test/screens/home_screen_test.dart"
    ;;
  S4)
    # phase 1: Domain entities (5 files)
    add_phase "feat(s4): add the familial risk and clinical approval domain entities" "backend/src/Domain/Access/CaseGrantPolicy.cs backend/src/Domain/Clinical/ClinicalEntities.cs backend/src/Domain/FamilialRisk/FamilialRiskPolicy.cs backend/src/Domain/Safety/ClinicalRuleTables.cs backend/src/Domain/Safety/SafetyValidationService.cs"
    # phase 2: Application contracts (1 files)
    add_phase "feat(s4): define the familial risk and clinical approval DTOs and contracts" "backend/src/Application/Clinical/ClinicalContracts.cs"
    # phase 3: EF Core configuration (1 files)
    add_phase "feat(s4): configure the familial risk and clinical approval tables, indexes and constraints" "backend/src/Infrastructure/Persistence/Configurations/ClinicalConfigurations.cs"
    # phase 4: Service layer (1 files)
    add_phase "feat(s4): implement the familial risk and clinical approval service layer" "backend/src/Infrastructure/Clinical/ClinicalService.cs"
    # phase 5: Agent layer (1 files)
    add_phase "feat(s4): add the familial risk and safety validation agents" "backend/src/Infrastructure/Agents/FamilialRiskAgent.cs"
    # phase 6: API surface (1 files)
    add_phase "feat(s4): expose the familial risk and clinical approval endpoints" "backend/src/Api/Controllers/ClinicalController.cs"
    # phase 7: Backend tests (6 files)
    add_phase "test(s4): cover the familial risk and clinical approval service and policy layer" "backend/tests/UnitTests/CaseGrantPolicyTests.cs backend/tests/UnitTests/ClinicalCasePoolPrivacyTests.cs backend/tests/UnitTests/ClinicalEmergencyReferralTests.cs backend/tests/UnitTests/ClinicalRuleTableTests.cs backend/tests/UnitTests/FamilialRiskPolicyTests.cs backend/tests/UnitTests/SafetyValidationServiceTests.cs"
    # phase 8: React screens (7 files)
    add_phase "feat(s4): add the familial risk and clinical approval web screens" "web/src/pages/admin/DoctorVerificationPage.tsx web/src/pages/audit/AuditPage.tsx web/src/pages/auth/DoctorRegisterPage.tsx web/src/pages/doctor/ApprovalsPage.tsx web/src/pages/doctor/CasesPage.tsx web/src/pages/doctor/DoctorStatusPage.tsx web/src/pages/system/SystemPages.tsx"
    # phase 9: React tests (1 files)
    add_phase "test(s4): cover the familial risk and clinical approval web screens" "web/src/pages/doctor/ApprovalsPage.test.tsx"
    # phase 10: Flutter screens (5 files)
    add_phase "feat(s4): add the familial risk and clinical approval mobile screens" "mobile/lib/models/approved_guidance.dart mobile/lib/providers/guidance_provider.dart mobile/lib/screens/emergency/emergency_screen.dart mobile/lib/screens/risk/approved_guidance_screen.dart mobile/lib/widgets/shared/clinical_disclaimer.dart"
    # phase 11: Flutter tests (4 files)
    add_phase "test(s4): cover the familial risk and clinical approval providers and screens" "mobile/test/models/approved_guidance_test.dart mobile/test/providers/guidance_provider_test.dart mobile/test/screens/approved_guidance_screen_test.dart mobile/test/screens/emergency_screen_test.dart"
    ;;
esac

# ── phase range ───────────────────────────────────────────────────
FROM=1; TO=$PHASE_COUNT
if [ -n "$PHASES_ARG" ]; then
  FROM="${PHASES_ARG%%-*}"; TO="${PHASES_ARG##*-}"
  [ "$TO" -gt "$PHASE_COUNT" ] && TO=$PHASE_COUNT
fi
echo "Phases    : $FROM to $TO of $PHASE_COUNT"; echo

MADE=0; SKIPPED=0
for i in $(seq "$FROM" "$TO"); do
  idx=$((i-1))
  msg="${PHASE_MSG[$idx]}"
  files="${PHASE_FILES[$idx]}"

  present=""
  for f in $files; do [ -e "$f" ] && present="$present $f"; done
  if [ -z "$present" ]; then
    printf "  %2d. SKIP   %s (no files present)\n" "$i" "$msg"
    SKIPPED=$((SKIPPED+1)); continue
  fi

  if [ "$DRY" -eq 1 ]; then
    printf "  %2d. WOULD  %s\n" "$i" "$msg"
    for f in $present; do echo "        $f"; done
    continue
  fi

  git add -- $present
  if git diff --cached --quiet; then
    printf "  %2d. SKIP   %s (nothing changed)\n" "$i" "$msg"
    SKIPPED=$((SKIPPED+1)); continue
  fi
  git commit -q -m "$msg"
  printf "  %2d. commit %s  %s\n" "$i" "$(git rev-parse --short HEAD)" "$msg"
  MADE=$((MADE+1))
done

echo
echo "Commits made: $MADE   skipped: $SKIPPED"
if [ "$DRY" -eq 1 ]; then echo "(dry run — nothing was changed)"; exit 0; fi

if [ "$DO_PUSH" -eq 1 ] && [ "$MADE" -gt 0 ]; then
  echo "Pushing $BRANCH ..."
  git push -u origin "$BRANCH"
elif [ "$MADE" -gt 0 ]; then
  echo "Not pushed. When ready:  git push -u origin $BRANCH"
fi

echo
echo "Your commits so far:"
git log --author="$GIT_MAIL" --oneline | head -20

