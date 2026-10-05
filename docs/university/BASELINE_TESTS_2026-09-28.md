# Phase 1 Test Baseline — 2026-09-28

Baseline recorded on `develop` at `c80f408` (after PR #53), before Phase 1b–12 work begins.
All runs are local; synthetic data only.

| Suite | Command | Result |
|---|---|---|
| Backend unit (xUnit) | `dotnet test backend/tests/UnitTests/FamilyVeda.UnitTests.csproj` | 91/91 passed |
| Backend integration (Testcontainers, PostgreSQL 16) | `dotnet test backend/tests/IntegrationTests/FamilyVeda.IntegrationTests.csproj` | 11/11 passed |
| Web (Vitest + RTL) | `npx vitest run` in `web/` | 42/42 passed (15 files) |
| Web lint + build | `npm run lint && npm run build` | exit 0 |
| Flutter analyze | `flutter analyze` in `mobile/` | no issues |
| Flutter tests | `flutter test` in `mobile/` | 69/69 passed |

Hosted check: `GET https://family-veda-api.onrender.com/health` returned `200 Healthy`.
The API exposes no revision endpoint, so the deployed commit must be confirmed from the Render deploy list.

Any later phase that lowers these counts or breaks a green check is a regression.
