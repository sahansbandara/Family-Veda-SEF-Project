<p align="center">
  <img src="brand/dist/lockup.png" alt="Family Veda — healthier families, brighter tomorrows" width="380">
</p>

# Family Veda

> **Your family doctor, with your family's whole story.**

Longitudinal family health context and agentic clinical triage platform.

**SE3090 — Software Engineering Frameworks** · SLIIT Faculty of Computing · Assignment 1 · Group **SE_016** · submission `SE3090_SE016`

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
                             │   Ollama (local model)       │
                             └──────────────┬───────────────┘
                                            ▼
                             ┌──────────────────────────────┐
                             │  FCM / Twilio Notifications  │
                             │  (called via ASP.NET Core)   │
                             └──────────────────────────────┘
```

Full diagram and reasoning: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

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

Design detail: [`docs/AGENTS_DESIGN.md`](docs/AGENTS_DESIGN.md).

## Safety position

- The system **never diagnoses**. It assembles context.
- No AI output reaches a patient without licensed doctor approval — enforced architecturally, with no bypass path.
- Clinical safety checks are deterministic rule tables, never LLM judgement.
- Family history yields a **screening indication**, never a diagnosis.
- In an emergency the system deliberately shows a referral and **zero AI output**.
- **Synthetic data only.** No real patient data is used anywhere in this project.

Full boundaries: [`docs/CLINICAL_SAFETY.md`](docs/CLINICAL_SAFETY.md).

## Repository layout

```
Family-Veda/
├── backend/     ONE ASP.NET Core solution (Api · Application · Domain · Infrastructure + tests)
├── web/         ONE React 18 application (Vite)
├── mobile/      ONE Flutter 3.x application
├── docs/        blueprint · adr/ · diagrams/ · api/ · ai-disclosure/ · individual-reports/
├── agent/       BRIEF · TODO · MEMORY · DECISIONS
├── rules/       coding and safety rules by scope
├── skills/      project-scoped agent skills
├── workflows/   build · test · commit · deploy · audit · handoff · human-approval
└── .github/     workflows/ci.yml · pull_request_template.md
```

One application, four authors — **not** a folder per student. Reasoning: blueprint §14.1.1.

## Tech stack

| Layer | Technology |
|---|---|
| Backend | ASP.NET Core Web API, C# 12, .NET 8 (LTS) |
| ORM | EF Core 8 + Npgsql |
| Database | PostgreSQL 16 |
| Web | React 18 (Vite) · React Router · Redux Toolkit |
| Mobile | Flutter 3.x · go_router · Riverpod · flutter_secure_storage |
| LLM | Ollama (local) — `llama3.1:8b` |
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
| **Swagger** | Auto-generated, clickable API docs at `/swagger` (Development only). |

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
│   │   │                                       OllamaClient (local LLM), ToolDispatcher (allow-list gate)
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
| Ollama | latest | `brew install ollama` | `ollama --version` |
| Tesseract | 5.x | `brew install tesseract` | `tesseract --version` |
| Docker | optional | Docker Desktop — only for integration tests | `docker ps` |

> If `dotnet ef` is "not found", add `~/.dotnet/tools` to your `PATH`.

Clone:

```bash
git clone https://github.com/sahansbandara/Family-Veda.git
```

```bash
cd Family-Veda
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

### 4. Ollama (local LLM)

New terminal:

```bash
ollama serve
```

Another terminal (one-time, ~4.7 GB download):

```bash
ollama pull llama3.1:8b
```

Without Ollama the API still starts; agent steps time out and cases defer to the doctor (Rule 9).

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
| 2 | `ollama serve` | `localhost:11434` |
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
| Triage stuck / deferred | Ollama not running or model not pulled. |
| OCR fails | `brew install tesseract`; check `Ocr__TesseractDataPath`. |

## Live demo access

- Web: <https://family-veda-web.vercel.app>
- API health: <https://family-veda-api.onrender.com/health>
- Mobile API base URL: `https://family-veda-api.onrender.com/api/v1`

All accounts below are synthetic and use the same demo password.

| Role | Email |
|---|---|
| Family Head | `demo-head@example.invalid` |
| Adult Member | `demo-member@example.invalid` |
| Verified Doctor | `demo-doctor@example.invalid` |
| Pending Doctor | `demo-pending@example.invalid` |
| Clinic Admin | `demo-admin@example.invalid` |

The password is intentionally not committed. On the deployment owner's Mac, copy it from Keychain without printing it into terminal history:

```bash
security find-generic-password \
  -a demo-evaluator \
  -s FamilyVedaDemoPassword \
  -w | pbcopy
```

Paste it into the app, then clear the clipboard immediately:

```bash
pbcopy </dev/null
```

Avoid retrieving it while screen-sharing or recording. Share the password with evaluators through a private channel. Never place it in Git, issues, screenshots or chat history.

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

Test plan and the 8 priority cases: [`docs/TESTING.md`](docs/TESTING.md).

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
| [`docs/Family_Veda_Project_Blueprint.md`](docs/Family_Veda_Project_Blueprint.md) | Full blueprint — the source of truth |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | System architecture and integration rules |
| [`docs/DATABASE.md`](docs/DATABASE.md) | Schema, 20 tables, state machines, seed policy |
| [`docs/API_CONTRACT.md`](docs/API_CONTRACT.md) | Endpoints, conventions, status codes |
| [`docs/AGENTS_DESIGN.md`](docs/AGENTS_DESIGN.md) | Agents, tool permission matrix, traces |
| [`docs/CLINICAL_SAFETY.md`](docs/CLINICAL_SAFETY.md) | Advice boundaries, emergency path, genetics framing |
| [`docs/PERMISSIONS.md`](docs/PERMISSIONS.md) | Roles, access principles, permission matrix |
| [`docs/AUDIT_LOGGING.md`](docs/AUDIT_LOGGING.md) | What is audited and how |
| [`docs/TESTING.md`](docs/TESTING.md) | Test plan and priority cases |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) | Hosting and the evaluator access package |
| [`docs/TIMELINE.md`](docs/TIMELINE.md) | Nine-week plan, gates, contingencies |
| [`docs/RISK_REGISTER.md`](docs/RISK_REGISTER.md) | Risks and mitigations |
| [`docs/VIVA_PREP.md`](docs/VIVA_PREP.md) | Viva questions, phrasing, memory hooks |
| [`docs/FUTURE_WORK.md`](docs/FUTURE_WORK.md) | Deliberate deferrals with reserved extension points |
| [`docs/adr/`](docs/adr/) | ADR-001 … ADR-009 |

## AI use disclosure

Development uses AI assistance at Level 4 (permitted, disclosed, verified). The final demonstration and viva are Level 1 — no external AI assistants; only the submitted application's own agentic subsystem runs.

Each member maintains `docs/ai-disclosure/S<n>.md`. Individual reflections are **never AI-generated**.

## Licence and data policy

Academic coursework. All clinical framing is for a university software engineering project and **does not constitute medical guidance**. All data used is synthetic.
