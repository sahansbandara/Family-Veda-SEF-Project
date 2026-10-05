<p align="center">
  <img src="docs/assets/family-veda-banner.webp" alt="Family Veda — your family doctor, with your family's whole story" width="100%">
</p>

# Family Veda

> **Your family doctor, with your family's whole story.**

Longitudinal family health context and agentic clinical triage platform.

**SE3090 — Software Engineering Frameworks** · SLIIT Faculty of Computing · Assignment 1 · Group **SE_016** · submission `SE3090_SE016`

## Download and try

| | |
|---|---|
| 📱 **Android APK** | [Download latest release](https://github.com/sahansbandara/Family-Veda-SEF-Project/releases/tag/apk-2026-09-28) · 159 MB · [install guide](DOWNLOAD.md) |
| 🌐 **Web app** | <https://family-veda-web.vercel.app> |
| 📘 **API docs** | [Swagger](https://family-veda-api-production.up.railway.app/swagger/index.html) |

Demo accounts: [Live demo access](#live-demo-access). All data is synthetic.

## Table of contents

1. [What it does](#what-it-does)
2. [Architecture](#architecture)
3. [The agentic workflow](#the-agentic-workflow)
4. [Safety position](#safety-position)
5. [Repository layout](#repository-layout)
6. [Tech stack](#tech-stack)
7. [New to .NET? Start here](#new-to-net-start-here)
8. [Architecture in depth](#architecture-in-depth)
9. [Run the full project locally](#run-the-full-project-locally)
10. [Live demo access](#live-demo-access)
11. [Testing](#testing)
12. [Team](#team)
13. [Documentation](#documentation)
14. [AI use disclosure](#ai-use-disclosure)
15. [Licence and data policy](#licence-and-data-policy)

---

## What it does

Sri Lanka has family doctors, but they operate without patient history. Every consultation starts from zero, so patients bypass their GP and go straight to hospitals.

Family Veda closes that gap. A family maintains one shared account with individual member records, lab reports and vitals. When a member reports a complaint, a multi-agent workflow assembles their personal baseline, analyses deviations, checks consented hereditary signals across the family, and applies deterministic clinical safety rules. The result is a **prepared case file, not a diagnosis**. A verified doctor reviews it, revises it, and approves it. Only then does the patient see anything.

**The AI does context. The doctor does medicine.**

## Architecture

```
┌──────────────────────────┐        ┌──────────────────────────┐
│   FLUTTER MOBILE APP     │        │    REACT WEB APP         │
│  (Patient / Family)      │        │  (Doctor / Admin)        │
└───────────┬──────────────┘        └───────────┬──────────────┘
            │        HTTPS / REST / JSON        │
            │        JWT Bearer Authentication  │
            └──────────────┬────────────────────┘
                           ▼
      ┌────────────────────────────────────────────────┐
      │        ASP.NET CORE WEB API                    │
      │  Controllers · Services · Auth policies        │
      │  Consent enforcement · Case grant enforcement  │
      │  Audit logging · Agent orchestration           │
      │  TOOL DISPATCH LAYER (allow-list enforced)     │
      └───────┬───────────────────────────┬────────────┘
              │ EF Core                   │ internal call only
              ▼                           ▼
   ┌────────────────────┐    ┌──────────────────────────────┐
   │    POSTGRESQL 16   │    │   CONTROLLED AGENTIC AI      │
   │  20 tables         │    │   Coordinator / Planner      │
   │  EF Core migrations│    │    ├─ Extraction Agent       │
   └────────────────────┘    │    ├─ Context Agent          │
                             │    ├─ Analysis Agent         │
                             │    ├─ Familial Risk Agent    │
                             │    └─ Safety/Validation      │
                             │   Gemini -> Groq (hosted)    │
                             └──────────────┬───────────────┘
                                            ▼
                             ┌──────────────────────────────┐
                             │  FCM / Twilio Notifications  │
                             │  (called via ASP.NET Core)   │
                             └──────────────────────────────┘
```

Full diagram and reasoning: [Final Report, Chapter 3](docs/university/FINAL_REPORT.md) (3.1 System Architecture).

## The agentic workflow

```
Flutter complaint → Coordinator → Context Agent → Analysis Agent
  → Familial Risk Agent → Safety/Validation Agent (deterministic)
  → ⏸ DOCTOR APPROVAL GATE ⏸ → notification → patient
```

| Agent | Scope | Reads raw records | Uses LLM | Owner |
|---|---|---|---|---|
| Extraction | One member | ✔ own member | ✔ | S2 |
| Context | One member | ✔ own member | ✔ structuring | S3 |
| Analysis | One member | ✔ own member | ✔ trend reasoning | S3 |
| Familial Risk | Family — **flags only** | ✘ hard denied at dispatch | ✔ signal wording | S4 |
| Safety / Validation | Case output | ✘ | ✘ **deterministic** | S4 |

Design detail: [`docs/AI_FLOW.md`](docs/AI_FLOW.md) and [Final Report, Section 3.5](docs/university/FINAL_REPORT.md).

## Safety position

- The system **never diagnoses**. It assembles context.
- No AI output reaches a patient without licensed doctor approval — enforced architecturally, with no bypass path.
- Clinical safety checks are deterministic rule tables, never LLM judgement.
- Family history yields a **screening indication**, never a diagnosis.
- In an emergency the system deliberately shows a referral and **zero AI output**.
- **Synthetic data only.** No real patient data is used anywhere in this project.

Full boundaries: [Final Report, Section 2.4](docs/university/FINAL_REPORT.md) (Clinical Safety Requirements).

## Repository layout

```
Family-Veda/
├── backend/     ONE ASP.NET Core solution (Api · Application · Domain · Infrastructure + tests)
├── web/         ONE React 18 application (Vite)
├── mobile/      ONE Flutter 3.x application
├── docs/        specs · adr/ · dashboards/ · evidence/ · individual-reports/ · university/ (final report) · release/ · mockups/ · plans/
├── agent/       TODO · MEMORY · DECISIONS
├── scripts/     database and demo helper scripts
└── .github/     workflows/ (ci · codeql · migrate-db) · pull_request_template.md · CODEOWNERS
```

One application, four authors — **not** a folder per student. Reasoning: [Final Report, Section 3.3](docs/university/FINAL_REPORT.md) (Business Components and Ownership) and `agent/DECISIONS.md`.

## Tech stack

| Layer | Technology |
|---|---|
| Backend | ASP.NET Core Web API, C# 12, .NET 8 (LTS) |
| ORM | EF Core 8 + Npgsql |
| Database | PostgreSQL 16 |
| Web | React 18 (Vite) · React Router · Redux Toolkit |
| Mobile | Flutter 3.x · go_router · Riverpod · flutter_secure_storage |
| LLM | Gemini (primary) -> Groq (fallback) — hosted |
| OCR | Tesseract / Google ML Kit on-device |
| CI | GitHub Actions |
| Testing | xUnit + Moq · Vitest + RTL · flutter_test · Testcontainers |
| Notifications | Firebase Cloud Messaging (fallback: Twilio SMS) |

## New to .NET? Start here

Backend is written in **C#** and runs on **.NET 8**. Quick glossary:

| Term | What it is |
|---|---|
| **.NET** | Microsoft's free, cross-platform runtime + SDK (like the JVM + JDK for Java, or Node for JS). Runs on macOS, Linux, Windows. |
| **C#** | Programming language used on .NET. Statically typed, object-oriented (similar to Java/TypeScript). |
| **`.cs` file** | One C# source file. Usually holds one class, record, interface or enum. Compiled, never run directly. |
| **`.csproj` file** | Project file (like `package.json`). Lists target framework (`net8.0`), NuGet packages, references to other projects. Each builds into one `.dll`. |
| **`.slnx` / `.sln`** | Solution file. Groups several `.csproj` projects so `dotnet build` / `dotnet test` handle them all together. Ours: `backend/FamilyVeda.slnx`. |
| **NuGet** | .NET package manager (like npm). `dotnet restore` downloads packages. |
| **ASP.NET Core** | .NET web framework. Gives controllers, routing, middleware, dependency injection, auth. |
| **EF Core** | Entity Framework Core — ORM. C# classes ↔ PostgreSQL tables. Schema changes are **migrations** (C# files in `Persistence/Migrations`). |
| **Npgsql** | PostgreSQL driver EF Core uses. |
| **`Program.cs`** | App entry point. Registers services, auth, CORS, Swagger, middleware, then starts the web server. |
| **`appsettings.json`** | Default config. Overridden by environment variables — `Jwt__Key` (double underscore) maps to `Jwt:Key`. |
| **`launchSettings.json`** | Local run profiles (port, environment) used by `dotnet run`. |
| **`bin/` `obj/`** | Build output. Generated, git-ignored. Safe to delete. |
| **xUnit / Moq** | Test framework / mocking library. `dotnet test` runs them. |
| **Swagger** | Auto-generated API docs at `/swagger`, available locally and on the Railway backend. Protected endpoints require JWT authentication. |

Everyday commands:

```bash
dotnet --info
```

```bash
dotnet restore
```

```bash
dotnet build
```

```bash
dotnet run --project src/Api
```

```bash
dotnet test
```

## Architecture in depth

### Request flow

1. User acts in **React** (doctor/admin) or **Flutter** (patient/family).
2. Client calls `/api/v1/...` over HTTPS with a **JWT bearer token**.
3. **ASP.NET Core** middleware: exception handler → CORS → authentication → authorization → rate limit.
4. A **Controller** (`Api/Controllers`) validates input (FluentValidation) and calls a **service**.
5. Service (`Infrastructure/*`) checks consent + case grants, reads/writes PostgreSQL via **EF Core**, writes **audit** rows.
6. Triage complaints are queued. Background `TriageWorker` runs the **agent pipeline**; agents only reach data through the **ToolDispatcher** allow-list — never the database directly.
7. Deterministic **Safety/Validation** runs; the case waits at the **doctor approval gate**. Only after approval does the patient see output, and a notification goes out via FCM (backend only).

### Backend: clean architecture, four projects

Dependencies point inward only: `Api → Infrastructure → Application → Domain`.

```
backend/
├── FamilyVeda.slnx                     solution: groups all projects below
├── Dockerfile                          container build used for Render deploy
├── src/
│   ├── Domain/                         PURE business rules. No DB, no HTTP, no packages.
│   │   ├── Common/Entity.cs, Enums.cs         base entity + shared enums
│   │   ├── Identity/IdentityEntities.cs       users, families, members, doctors
│   │   ├── Records/RecordEntities.cs          lab reports, lab values, vitals
│   │   ├── Triage/TriageEntities.cs           episodes, triage cases, agent traces
│   │   ├── Clinical/ClinicalEntities.cs       approvals, doctor decisions
│   │   ├── Consent/ConsentStateMachine.cs     legal consent state transitions
│   │   ├── Access/CaseGrantPolicy.cs          time-bound doctor case grants
│   │   ├── FamilialRisk/FamilialRiskPolicy.cs screening-indication rules (never diagnosis)
│   │   └── Safety/                            deterministic rule tables + SafetyValidationService
│   │
│   ├── Application/                    CONTRACTS: interfaces, DTOs, validators. No implementation.
│   │   ├── Auth/ Families/ Records/ Triage/ Clinical/   *Contracts.cs — service interfaces + request/response DTOs
│   │   ├── Agents/AgentContracts.cs, ToolRegistry.cs    agent interface + per-agent tool allow-list
│   │   ├── Validation/RequestValidators.cs              FluentValidation rules for incoming requests
│   │   └── Common/ICurrentUser.cs, PagedResult.cs
│   │
│   ├── Infrastructure/                 IMPLEMENTATIONS: database, LLM, OCR, notifications.
│   │   ├── DependencyInjection.cs              registers every service into ASP.NET's DI container
│   │   ├── Persistence/AppDbContext.cs         EF Core DbContext (all tables)
│   │   ├── Persistence/Configurations/         table/column/index mappings
│   │   ├── Persistence/Migrations/             schema history — never edit a pushed one
│   │   ├── Persistence/DatabaseInitializer.cs  optional migrate + synthetic seed on startup
│   │   ├── Auth/AuthService.cs, JwtOptions.cs  login, register, JWT + refresh tokens
│   │   ├── Families/FamilyService.cs              families, members, invitations, consent
│   │   ├── Records/                            RecordService, TesseractOcrService, LabExtractionService
│   │   ├── Agents/                             Extraction, Context, Analysis, FamilialRisk agents,
│   │   │                                       GeminiClient / ChatCompletionsLlmClient (hosted LLM), ToolDispatcher (allow-list gate)
│   │   ├── Triage/                             TriageOrchestrator (coordinator), TriageService,
│   │   │                                       TriageWorkQueue, CaseSlaProcessor, FcmPushNotificationClient
│   │   └── Clinical/ClinicalService.cs            doctor verification, case pool, approval gate
│   │
│   └── Api/                            HTTP LAYER: thin. Receives request, calls service, returns result.
│       ├── Program.cs                          startup wiring
│       ├── appsettings.json                    non-secret defaults
│       ├── Properties/launchSettings.json      local run profiles
│       ├── Controllers/                        Auth, Families, Members, Records, Triage, Clinical
│       ├── Background/TriageWorker.cs          runs queued agent pipelines
│       ├── Background/CaseSlaWorker.cs         escalates cases past doctor SLA
│       ├── Middleware/ExceptionMiddleware.cs   RFC 7807 errors, no leaked internals
│       └── Security/HttpCurrentUser.cs         reads user id/role from JWT
└── tests/
    ├── UnitTests/          xUnit + Moq: safety rules, consent, grants, dispatcher, orchestrator…
    └── IntegrationTests/   real API + PostgreSQL via Testcontainers (needs Docker)
```

### Web (`web/`) — React 18 + Vite + TypeScript

```
web/src/
├── main.tsx            entry: mounts React, Redux store, router
├── App.tsx             app shell
├── routes/             React Router route table + role guards
├── pages/              auth · dashboard · doctor (cases, approvals) · admin (doctor verification)
│                       family · records · audit · system
├── components/         reusable UI (liquid-glass design)
├── store/              Redux Toolkit store, typed hooks, slices
├── services/apiClient.ts  axios client → VITE_API_BASE_URL, attaches JWT
└── styles/ index.css   design tokens and global styles
```

### Mobile (`mobile/`) — Flutter

```
mobile/lib/
├── main.dart           entry point
├── config/app_config.dart  API_BASE_URL / APP_ENV from --dart-define
├── router/             go_router routes
├── providers/          Riverpod state
├── services/           HTTP client, secure token storage
├── models/             JSON data classes
├── screens/            auth · home · family · records · triage · risk · notifications · emergency
├── widgets/ theme/     shared UI + styling
```

## Run the full project locally

Everything below assumes **macOS** (Homebrew). Linux/Windows: install same tools from their official sites.

### 0. Install prerequisites

| Tool | Version | Install (macOS) | Check |
|---|---|---|---|
| .NET SDK | 8.x | `brew install --cask dotnet-sdk` | `dotnet --list-sdks` shows `8.` |
| EF Core CLI | 8.x | `dotnet tool install --global dotnet-ef --version 8.*` | `dotnet ef --version` |
| PostgreSQL | 16 | `brew install postgresql@16 && brew services start postgresql@16` | `psql --version` |
| Node.js | 20+ | `brew install node@20` | `node -v` |
| Flutter | 3.x | `brew install --cask flutter` + Android Studio (SDK + emulator) or Xcode | `flutter doctor` |
| Tesseract | 5.x | `brew install tesseract` | `tesseract --version` |
| Docker | optional | Docker Desktop — only for integration tests | `docker ps` |

> If `dotnet ef` is "not found", add `~/.dotnet/tools` to your `PATH`.

Clone:

```bash
git clone https://github.com/sahansbandara/Family-Veda-SEF-Project.git
```

```bash
cd Family-Veda-SEF-Project
```

### 1. Database (PostgreSQL)

Create a local user and database (pick your own password):

```bash
psql postgres -c "CREATE ROLE familyveda WITH LOGIN PASSWORD 'choose-a-local-password';"
```

```bash
psql postgres -c "CREATE DATABASE familyveda OWNER familyveda;"
```

Docker alternative:

```bash
docker run -d --name familyveda-db -p 5432:5432 -e POSTGRES_USER=familyveda -e POSTGRES_PASSWORD=choose-a-local-password -e POSTGRES_DB=familyveda postgres:16
```

### 2. Environment variables

ASP.NET Core does **not** read `.env` automatically. It reads real environment variables. Template: [`.env.example`](.env.example) · full reference: [`docs/ENV_VARS.md`](docs/ENV_VARS.md).

```bash
cp .env.example .env
```

Edit `.env` — minimum for local run:

```
ConnectionStrings__DefaultConnection=Host=localhost;Port=5432;Database=familyveda;Username=familyveda;Password=choose-a-local-password
ASPNETCORE_ENVIRONMENT=Development
Database__MigrateOnStartup=true
Seed__Enabled=true
Seed__DefaultPassword=<at-least-12-characters>
Jwt__Key=<long-random-string>
```

Generate a JWT key:

```bash
openssl rand -base64 48
```

Load `.env` into the current terminal (repeat in every new terminal that runs the backend):

```bash
set -a; source .env; set +a
```

Notes:
- `Seed__Enabled=true` inserts **synthetic** demo accounts only. Password must be ≥ 12 chars.
- FCM / Twilio can stay `CHANGE_ME` / empty locally — notifications just won't deliver.
- **Never commit `.env`.**

### 3. Backend API

```bash
cd backend
```

```bash
dotnet restore
```

```bash
dotnet build
```

Apply migrations (skip if `Database__MigrateOnStartup=true`):

```bash
dotnet ef database update --project src/Infrastructure --startup-project src/Api
```

Run on port **5000** (web and mobile default to this port):

```bash
dotnet run --project src/Api --urls http://localhost:5000
```

Check:
- Health: <http://localhost:5000/health>
- Swagger: <http://localhost:5000/swagger>

> Plain `dotnet run` without `--urls` uses `launchSettings.json` port `5139`. Then set `VITE_API_BASE_URL` / `API_BASE_URL` to match.

### 4. LLM keys (Gemini / Groq)

Set `Gemini__ApiKey` (and optionally `Llm__ApiKey` for Groq) in your `.env`. Without either configured, the API still starts; agent steps fail closed and cases defer to the doctor (Rule 9).

### 5. Web app (React)

New terminal:

```bash
cd web
```

```bash
npm ci
```

```bash
npm run dev
```

Open <http://localhost:5173>. API URL comes from `VITE_API_BASE_URL` (default `http://localhost:5000/api/v1`). To override, create `web/.env.local` with `VITE_API_BASE_URL=...`. Never put secrets in `VITE_*` values.

### 6. Mobile app (Flutter)

Start an Android emulator (Android Studio → Device Manager) or iOS simulator, then:

```bash
cd mobile
```

```bash
flutter pub get
```

Android emulator (`10.0.2.2` = your Mac's localhost):

```bash
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:5000/api/v1 --dart-define=APP_ENV=development
```

iOS simulator:

```bash
flutter run --dart-define=API_BASE_URL=http://localhost:5000/api/v1 --dart-define=APP_ENV=development
```

Physical phone: use your Mac's LAN IP (e.g. `http://192.168.1.20:5000/api/v1`) and add it to `Cors__AllowedOrigins` if needed.

### 7. Everything running

| Terminal | Command | URL |
|---|---|---|
| 1 | PostgreSQL (brew service / Docker) | `localhost:5432` |
| 3 | backend `dotnet run … --urls http://localhost:5000` | `localhost:5000/swagger` |
| 4 | web `npm run dev` | `localhost:5173` |
| 5 | mobile `flutter run …` | emulator |

Sign in with a seeded synthetic account (see *Live demo access* for emails) using your `Seed__DefaultPassword`.

### Troubleshooting

| Symptom | Fix |
|---|---|
| `Jwt:Key is required` | Env not loaded — run `set -a; source .env; set +a` in that terminal. |
| `password authentication failed` | Connection string user/password mismatch with step 1. |
| `relation … does not exist` | Migrations not applied — run step 3 `dotnet ef database update`. |
| `dotnet ef: command not found` | Install `dotnet-ef`, add `~/.dotnet/tools` to `PATH`. |
| Web shows network/CORS error | API not on port 5000, or origin missing from `Cors__AllowedOrigins`. |
| Android app can't reach API | Use `10.0.2.2`, not `localhost`. |
| Triage stuck / deferred | Gemini/Groq keys missing or invalid — check `Gemini__ApiKey` / `Llm__ApiKey`. |
| OCR fails | `brew install tesseract`; check `Ocr__TesseractDataPath`. |

## Live demo access

- Hosted web: <https://family-veda-web.vercel.app>
- Hosted Swagger API documentation: <https://family-veda-api-production.up.railway.app/swagger/index.html>
- Hosted API health: <https://family-veda-api-production.up.railway.app/health>
- Hosted mobile API base URL: `https://family-veda-api-production.up.railway.app/api/v1`
- Local web: <http://localhost:5173>
- Local API base URL: `http://127.0.0.1:5000/api/v1` (Android emulator: `http://10.0.2.2:5000/api/v1`)

**Shared synthetic demo password (local and hosted): `Demo@123456!!`**

All 44 accounts below exist in both the running local and hosted demo databases, checked on 2026-10-03. Local core logins and hosted admin login were verified with this password; every individual hosted login was not tested. Seeded accounts use the shared demo password unless it has subsequently been changed for that account. Changing `Seed:DefaultPassword` does not reset existing passwords.

These are public synthetic test credentials for the demo only. Do not reuse this password for real accounts or production data. No new accounts or password resets are performed by these instructions.

### Core demo accounts

| Role / scenario | Email |
|---|---|
| Family Head | `demo-head@example.invalid` |
| Adult Member | `demo-member@example.invalid` |
| Verified Doctor | `demo-doctor@example.invalid` |
| Pending Doctor | `demo-pending@example.invalid` |
| Clinic Admin | `demo-admin@example.invalid` |
| Adult Member | `demo-tharushi@example.invalid` |
| Family Head — Silva | `demo-silva@example.invalid` |
| Family Head — Fernando | `demo-fernando@example.invalid` |
| Family Head — Wijesinghe | `demo-wijesinghe@example.invalid` |
| Family join requester | `demo-ruwan@example.invalid` |
| Family join requester | `demo-shalini@example.invalid` |
| Verified Doctor — Silva | `demo-doctor-silva@example.invalid` |
| Verified Doctor — Fernando | `demo-doctor-fernando@example.invalid` |
| Suspended Doctor | `demo-doctor-suspended@example.invalid` |

### Viva accounts

| Role / scenario | Email |
|---|---|
| Adult Member — shared demo family | `viva-adult-01@example.invalid` |
| Adult Member — shared demo family | `viva-adult-02@example.invalid` |
| Adult Member — shared demo family | `viva-adult-03@example.invalid` |
| Family Head — separate family | `viva-adult-04@example.invalid` |
| Family Head — separate family | `viva-adult-05@example.invalid` |
| Verified Doctor | `viva-doctor-01@example.invalid` |
| Verified Doctor | `viva-doctor-02@example.invalid` |
| Verified Doctor | `viva-doctor-03@example.invalid` |
| Verified Doctor | `viva-doctor-04@example.invalid` |

### Phase 1b scenario accounts

| Role / scenario | Email |
|---|---|
| Family Head — alpha | `phase1b-alpha-head@example.invalid` |
| Adult Member — alpha | `phase1b-alpha-adult1@example.invalid` |
| Adult Member — alpha | `phase1b-alpha-adult2@example.invalid` |
| Family Head — beta | `phase1b-beta-head@example.invalid` |
| Adult Member — beta | `phase1b-beta-adult1@example.invalid` |
| Adult Member — beta | `phase1b-beta-adult2@example.invalid` |
| Family Head — gamma | `phase1b-gamma-head@example.invalid` |
| Adult Member — gamma | `phase1b-gamma-adult1@example.invalid` |
| Adult Member — gamma | `phase1b-gamma-adult2@example.invalid` |
| Verified Doctor | `phase1b-doctor-jaffna@example.invalid` |
| Verified Doctor | `phase1b-doctor-badulla@example.invalid` |
| Verified Doctor | `phase1b-doctor-matara@example.invalid` |
| Pending Doctor | `phase1b-doctor-pending@example.invalid` |
| Suspended Doctor | `phase1b-doctor-suspended@example.invalid` |

### Coverage and restricted-state accounts

| Role / scenario | Email |
|---|---|
| Deactivated family user — sign-in blocked | `coverage-deactivated@example.invalid` |
| Deactivated doctor — sign-in blocked | `coverage-deactivated-doctor@example.invalid` |
| Family user — joined request fixture | `coverage-joined@example.invalid` |
| Family user — declined request fixture | `coverage-declined@example.invalid` |
| Doctor — rejected verification | `coverage-doctor-rejected@example.invalid` |
| Doctor — pending verification | `coverage-doctor-pending@example.invalid` |
| Doctor — more information requested | `coverage-doctor-moreinfo@example.invalid` |

Pending, suspended, rejected and more-information-requested doctors have restricted access; successful authentication does not grant verified-clinician permissions. Deactivated users cannot sign in. Coverage accounts deliberately exercise these states.

Authentication endpoints allow 10 requests per minute per client IP. If you receive HTTP `429`, wait one minute before retrying. Testing many accounts in succession can reach this limit.

## Testing

```bash
cd backend && dotnet test
```

```bash
cd web && npm test
```

```bash
cd mobile && flutter test
```

Test plan and execution: [`docs/university/A2_TEST_PLAN_AND_EXECUTION.md`](docs/university/A2_TEST_PLAN_AND_EXECUTION.md) and [Final Report, Section 4.4](docs/university/FINAL_REPORT.md). Demo accounts and seed data: [`docs/TESTING.md`](docs/TESTING.md).

## Team

| Ref | IT Number | Name | Component |
|---|---|---|---|
| S1 | IT23544154 | Samaranayaka S.G.V.S | Family, Identity & Consent · CI · tool-permission layer |
| S2 | IT24101875 | Fernando K.R.N | Health Records & Extraction · OCR · Extraction Agent |
| S3 | IT24100551 | Karunathilaka K.D.J.C (**Group Leader**) | Triage & Orchestration · Coordinator, Context, Analysis Agents |
| S4 | IT24100559 | W.M.S.S.B. Wasala | Familial Risk & Clinical Approval · Safety rule tables |

## Documentation

| Document | Contents |
|---|---|
| [`docs/university/FINAL_REPORT.md`](docs/university/FINAL_REPORT.md) | Consolidated final report: architecture (ch. 3), database (3.10), API (3.11), agents (3.5), clinical safety (2.4), testing (4.4), timeline (App. C), risk register (App. D), future work (4.9) |
| [`docs/Three_Portal_Implementation_Blueprint.md`](docs/Three_Portal_Implementation_Blueprint.md) | Three-portal implementation blueprint |
| [`docs/Three_Portal_Feature_Spec.md`](docs/Three_Portal_Feature_Spec.md) | Three-portal feature specification |
| [`docs/Doctor_Side_Spec.md`](docs/Doctor_Side_Spec.md) | Doctor-side specification |
| [`docs/AI_FLOW.md`](docs/AI_FLOW.md) | Agent workflow, doctor approval and dashboards |
| [`docs/university/A2_TEST_PLAN_AND_EXECUTION.md`](docs/university/A2_TEST_PLAN_AND_EXECUTION.md) | Test plan and execution record |
| [`docs/TESTING.md`](docs/TESTING.md) | Demo accounts and seed data (not a test plan) |
| [`docs/DEMO_DATA.md`](docs/DEMO_DATA.md) | Synthetic demo data |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) | Hosting and deployment |
| [`docs/ENV_VARS.md`](docs/ENV_VARS.md) | Environment variable reference |
| [`docs/VIVA_PREP.md`](docs/VIVA_PREP.md) | Viva questions, phrasing, memory hooks |
| [`docs/individual-reports/EVIDENCE.md`](docs/individual-reports/EVIDENCE.md) | Per-member file ownership evidence |
| [`docs/adr/`](docs/adr/) | ADR-006 (local LLM), ADR-013 (hosted Gemini LLM), ADR-014 (Google Drive report storage) |

### Dashboard guides

One guide per portal: flow diagram, then every tab and its sub-sections.

| Portal | Guide |
|---|---|
| Clinic Admin | [`docs/dashboards/admin.md`](docs/dashboards/admin.md) |
| Doctor | [`docs/dashboards/doctor.md`](docs/dashboards/doctor.md) |
| Family Head | [`docs/dashboards/family-head.md`](docs/dashboards/family-head.md) |
| Adult Member | [`docs/dashboards/adult-member.md`](docs/dashboards/adult-member.md) |

## AI use disclosure

Development uses AI assistance at Level 4 (permitted, disclosed, verified). The final demonstration and viva are Level 1 — no external AI assistants; only the submitted application's own agentic subsystem runs.

Individual AI-usage declarations are in Appendix E of the [final report](docs/university/FINAL_REPORT.md) (to be completed by each member). Individual reflections are **never AI-generated**.

## Licence and data policy

See [LICENSE](LICENSE) — all rights reserved to Group SE_016; SLIIT assessors may view and run it for marking only.

Academic coursework. All clinical framing is for a university software engineering project and **does not constitute medical guidance**. All data used is synthetic.
