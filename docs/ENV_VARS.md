# Environment Variables — Family Veda

**Names and purpose only. Never store actual secret values in this file, in any Markdown file, or in git.**

Local values go in `.env` (gitignored). Hosted values go in the platform's environment settings.

## Backend — ASP.NET Core

| Name | Purpose | Required | Environment |
|---|---|---|---|
| `ConnectionStrings__DefaultConnection` | PostgreSQL connection string | Yes | all |
| `ASPNETCORE_ENVIRONMENT` | `Development` / `Production` | Yes | all |
| `ASPNETCORE_URLS` | Bind address and port | Hosted only | production |
| `Jwt__Issuer` | JWT issuer claim | Yes | all |
| `Jwt__Audience` | JWT audience claim | Yes | all |
| `Jwt__Key` | **JWT signing key — secret** | Yes | all |
| `Jwt__AccessTokenMinutes` | Access token lifetime | Yes | all |
| `Jwt__RefreshTokenDays` | Refresh token lifetime | Yes | all |
| `Cors__AllowedOrigins` | Comma-separated web origins | Yes | all |
| `Gemini__ApiKey` | **Google Gemini API key — secret; primary hosted LLM inference** | Optional (falls through the chain below) | all |
| `Gemini__Model` | Gemini model name (default: `gemini-3.5-flash`) | Optional | all |
| `Gemini__TimeoutSeconds` | Per-call timeout for Gemini API calls | Optional | all |
| `Llm__Provider` | `openai-compatible` to enable the Groq fallback client | Optional | all |
| `Llm__BaseUrl` | Groq endpoint (default `https://api.groq.com/openai/v1`) | Optional | all |
| `Llm__Model` | Groq model, e.g. `llama-3.1-8b-instant` | Optional | all |
| `Llm__ApiKey` | **Groq API key — secret; fallback LLM when Gemini fails or is rate-limited** | Optional | all |
| `Llm__TimeoutSeconds` | Per-call timeout for Groq API calls | Optional | all |
| `Agents__ConfidenceThreshold` | Below this → `LOW_CONFIDENCE`, draft hidden | Yes | all |
| `Ocr__Engine` | `Tesseract` or `MlKit` | Yes | all |
| `Ocr__TesseractDataPath` | Tesseract language data path | If Tesseract | all |
| `Ocr__TimeoutSeconds` | Hard timeout for each native OCR process | Yes | all |
| `Ocr__MaxConcurrentProcesses` | Bounded native OCR concurrency (`1`-`4`) | Yes | all |
| `Ocr__MaxOutputCharacters` | Maximum accepted OCR text size | Yes | all |
| `Storage__LabReportPath` | Where uploaded lab report files are stored | Yes | all |
| `Storage__MaxUploadBytes` | Upload size limit | Yes | all |
| `Fcm__ServiceAccountJson` | **Firebase service-account JSON — secret; FCM HTTP v1 only** | If push delivery is enabled | all |
| `Fcm__ProjectId` | Firebase project id | If push delivery is enabled | all |
| `Database__MigrateOnStartup` | Apply EF migrations at API startup | Hosted only | production |
| `Seed__Enabled` | Enable idempotent synthetic demonstration seed | Hosted/demo only | production/demo |
| `Seed__DefaultPassword` | **Shared initial demo password — secret** | If seed enabled | production/demo |
| `DataProtection__KeysPath` | Key-ring directory for encrypted device tokens; persistent storage required when push delivery is enabled | If push delivery is enabled | hosted |
| `Twilio__AccountSid` | **Twilio SID — secret** (SMS fallback) | Optional | all |
| `Twilio__AuthToken` | **Twilio auth token — secret** | Optional | all |
| `Twilio__FromNumber` | Sender number | Optional | all |
| `Sla__DoctorResponseHours` | SLA before release to the shared pool (6) | Yes | all |
| `Grants__ExpiryHours` | Case grant lifetime (48) | Yes | all |

## Web — React (Vite)

| Name | Purpose | Required | Environment |
|---|---|---|---|
| `VITE_API_BASE_URL` | API base, e.g. `https://api.familyveda.app/api/v1` | Yes | all |
| `VITE_APP_ENV` | `development` / `production` | Yes | all |

> Vite inlines every `VITE_*` variable into the client bundle. **Never put a secret in one.**

## Mobile — Flutter

| Name | Purpose | Required | Environment |
|---|---|---|---|
| `API_BASE_URL` | Passed with `--dart-define` at build time | Yes | all |
| `APP_ENV` | `development` / `production` | Yes | all |

```bash
flutter run --dart-define=API_BASE_URL=https://api.familyveda.app/api/v1 --dart-define=APP_ENV=development
```

Firebase configuration comes from `google-services.json`, which is **not committed**.

### Android release signing

Release APK/AAB builds fail closed unless all four values are supplied to Gradle. Keep the keystore and values outside Git.

| Name | Purpose | Required |
|---|---|---|
| `ANDROID_KEYSTORE_PATH` | Absolute path to the Android signing keystore | release only |
| `ANDROID_KEYSTORE_PASSWORD` | Keystore password | release only |
| `ANDROID_KEY_ALIAS` | Signing key alias | release only |
| `ANDROID_KEY_PASSWORD` | Signing key password | release only |

## Rules

1. `.env` is gitignored. `.env.example` carries names and placeholder text only.
2. Anything marked **secret** above never appears in git, in Markdown, in a screenshot, or in the report.
3. Before the first deploy, scan history for leaked keys.
4. Rotate any key that is ever pasted into a chat, an issue, or a commit message.
5. Hosted secrets are set in the platform's environment settings, never in a config file in the repository.
6. `google-services.json` and any signing keystore are gitignored.
