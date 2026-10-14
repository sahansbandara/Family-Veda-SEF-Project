# 2026-09-28 production release evidence

All checks below used synthetic demo data. No database credentials or patient data are recorded here.

## Submission date

The authenticated SE3090 CourseWeb Assignment 1 submission item displayed **Tuesday, 6 October 2026, 11:00 AM** on 2026-09-28 (Asia/Colombo). An older announcement on the same course page still displayed 30 September; the submission item's due field is the current operational deadline. Recheck the item before final submission.

## Repository and web

- `develop` commit `49face54bb7dbcac22aa5aa67b60ba156be58de4`: [CI](https://github.com/sahansbandara/Family-Veda-SEF-Project/actions/runs/36386368127) and [CodeQL](https://github.com/sahansbandara/Family-Veda-SEF-Project/actions/runs/36386368055) completed successfully.
- [Vercel production deployment](https://github.com/sahansbandara/Family-Veda-SEF-Project/deployments/6703765532) reported success for that same commit.
- `https://family-veda-web.vercel.app/`, `https://family-veda-api.onrender.com/health`, and `https://family-veda-api.onrender.com/swagger/index.html` returned HTTP 200 on 2026-09-28.
- In the authenticated synthetic Family Head portal, dashboard, appointments, and notifications rendered. Notifications showed the ready empty state, which the current page code reaches only after its request succeeds. This retests the prior notifications loading failure for this account. A doctor-account journey and the exact Render backend revision remain unverified.

## Neon production migration

Project `Family Veda SEF Production`, database `familyveda`, branch `production` (`br-hidden-union-azqm55dm`). Before the migration, `__EFMigrationsHistory` listed `20260923103257_InitialCreate` and `20260927200627_20260928_S4_ThreePortalFeatures`. Read-only conflict queries returned zero families with multiple active primary doctor assignments and zero with multiple pending doctor requests.

A data-and-schema recovery branch, `backup-2026-09-28-pre-doctor-constraints-1208` (`br-summer-bread-az8dpdar`), was created from production at 2026-09-28 12:08:48 Asia/Colombo and set not to auto-delete.

The approved `docs/release/20260928_doctor_constraints.sql` had SHA-256 `5741463041a945f40d815ec8822ea3946c7009f3e2a3d2e1dea98caadc9ee301`. The production Neon SQL Editor reported all eight statements through `COMMIT` executed successfully. A fresh query then listed the third migration, `20260928010813_20260928_S4_DoctorAssignmentConstraints`, exactly once. `pg_indexes` returned the ordinary `(family_id, doctor_id)` history index and both partial unique indexes: `ux_family_doctor_requests_pending` and `ux_family_doctor_assignments_active_primary`.

The migration and index checks establish database deployment, not the full doctor workflow. Retain a doctor-account smoke test and the exact Render revision before claiming the release complete.

## Local verification and Android artifact

Live synthetic verified-doctor sign-in on the hosted web app reproduced a blank `/dashboard` at 12:44 UTC. Browser console: `TypeError: pendingFamilyRequests.map is not a function`. The dashboard API returns an integer pending-request count while React expected request records. PR #49 corrected the client contract and merged. Vercel production deployed `3df6bb3`; a synthetic verified-doctor sign-in then rendered the live request panel with no browser console errors. Retest also exposed hard-coded sample metrics and appointments above that live panel. A focused local route change now renders the live panel directly for the doctor dashboard; web tests passed 41/41 with lint and build clean, and production retest awaits that change's merge and deployment.

The new deterministic PostgreSQL golden-case test confirms that an assigned verified primary doctor receives an active case grant. The doctor approves an allowlisted advisory directly through that grant, then the family reads it; before approval, the same family read returns HTTP 404. Calling shared-pool `/claim` on the already granted case returns the expected HTTP 409. The independent invalid-schema safe-failure test verifies processing stopped after Context, a persisted `SafeFailure` trace with `INVALID_AGENT_SCHEMA`, and approved guidance remained HTTP 404. Both focused tests passed and the full PostgreSQL integration suite passed **11/11**. This is backend API evidence; a full Flutter → React → Flutter visual trace remains pending.

At the isolated `develop` checkout, these commands completed successfully on 2026-09-28:

- `dotnet test backend/tests/UnitTests/FamilyVeda.UnitTests.csproj --verbosity quiet`: 91 passed, 0 failed.
- `dotnet test backend/tests/IntegrationTests/FamilyVeda.IntegrationTests.csproj --no-restore --verbosity quiet`: 11 passed, 0 failed using PostgreSQL integration containers.
- `npm ci --prefix web`, `npm test --prefix web -- --run`, `npm run lint --prefix web`, `npm run build --prefix web`: 40 tests passed; lint and build exited 0. Vite warned that one bundle exceeds 500 kB.
- `flutter analyze` and `flutter test` in `mobile`: no analysis issues; 69 tests passed on Flutter 3.47.5/Dart 3.13.4.
- Retained output: `docs/evidence/2026-09-28/backend-unit.txt`, `backend-integration.txt`, `web-tests.txt`, and `flutter-tests.txt`.
- Focused security tests: 3 integration tests for unapproved guidance, pending-doctor denial and refresh-token single use; 11 unit tests for tool dispatch, case grants and consent; all passed.
- Unauthenticated live API GETs to `/api/v1/notifications`, `/api/v1/dashboard/family` and `/api/v1/dashboard/doctor` each returned HTTP 401. An OPTIONS preflight from `https://untrusted.example.invalid` returned 204 without an `Access-Control-Allow-Origin` header. These are narrow access-control smoke checks, not a full penetration test.

Built a **debug-signed**, hosted-API Android APK with `flutter build apk --debug --dart-define=API_BASE_URL=https://family-veda-api.onrender.com/api/v1 --dart-define=APP_ENV=production`. The build exited 0, and `adb install -r` on an Android API 36 emulator returned `Success`. `am start` opened `lk.familyveda.family_veda/.MainActivity`; the resumed activity and rendered sign-in screen were confirmed. The synthetic demo Family Head then signed in and loaded the dashboard (including family doctor and case counts), appointments empty state and three notifications. Retained screenshots: `docs/evidence/2026-09-28/android-launch.png`, `android-hosted-head-dashboard.png`, `android-hosted-appointments.png`, `android-hosted-notifications.png`. The copied artifact is `/Users/sahansandaruwan/FamilyVeda-submission/FamilyVeda-debug-hosted-api-2026-09-28.apk` (159 MB; SHA-256 `ac493f51f19a23a75f6d3b49b76fecb0f390e9172569ea4adb404edfdafd7d3d`). It still needs a stable share link and a doctor-approved guidance journey on the hosted environment. A release-signed APK has not been produced.

To install the existing APK on a test Android device with USB debugging enabled, run `adb install -r FamilyVeda-debug-hosted-api-2026-09-28.apk` from its download directory, then open **Family Veda**. It requires network access to the hosted API. The final submission should provide an accessible download URL and its checksum above; it is published at https://github.com/sahansbandara/Family-Veda-SEF-Project/releases/tag/apk-2026-09-28 (debug-signed pre-release).
