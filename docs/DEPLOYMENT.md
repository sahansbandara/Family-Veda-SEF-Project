# Deployment — Family Veda

Hosted deployment plan. Railway replaced Render on 2026-10-06; existing Neon and private Google Drive storage are retained. Names and purposes only — actual
secret values are never written here; see `docs/ENV_VARS.md` for the full list.

## What you need to create/provide

| # | Account / key | Used for | Cost |
|---|---|---|---|
| 1 | **Neon** project (Postgres 16) | production database | Free tier |
| 2 | **Railway** account | hosts the backend API (Docker), Singapore | Check current Railway plan and usage |
| 3 | **Vercel** account | hosts the React web app | Free tier |
| 4 | **Google AI Studio** API key (Gemini) | primary hosted LLM | Free tier |
| 5 | **Groq** API key | fallback LLM when Gemini fails/rate-limits | Free tier |
| 6 | Apple Developer account | sign + distribute the iOS build | Paid ($99/yr) — only if distributing beyond simulator |
| 7 | Android signing keystore | sign the release APK | Free (self-generated) |
| 8 | (Optional) Firebase project | push notifications (FCM) | Free tier |
| 9 | (Optional) Twilio account | SMS fallback for notifications | Free trial credit |

Items 6–9 are **not required** to have a working hosted website + backend + a
runnable/demoable mobile build. They're only needed for push notifications and
a store-signed release APK/IPA.

## 1. Database — Neon

1. Create a Neon project, Postgres 16, region close to Railway's Singapore backend.
2. For an existing production database, retain its connection string in Railway's secret environment variables. New database setup and any EF Core migrations require separate approval.
3. **Automatic:** `.github/workflows/migrate-db.yml` applies pending migrations to production whenever a migration lands on `develop` (needs repo secret `PRODUCTION_DATABASE_URL`; also runnable by hand from the Actions tab). The manual steps below remain the fallback.
4. **Do not** rely on `Database__MigrateOnStartup=true` — the installed Npgsql 8.0.11 EF provider has a real bug that throws on that path (documented in `agent/MEMORY.md`). Apply migrations with:
   ```bash
   cd backend
   dotnet ef migrations script --project src/Infrastructure --startup-project src/Api --output /tmp/migration.sql --idempotent
   psql "<neon-connection-string>" -f /tmp/migration.sql
   ```

## 2. Backend API — Railway

Production API: `https://family-veda-api-production.up.railway.app/api/v1`.

- Project/service: `family-veda-api`; production environment.
- Git source: `develop`, root `/backend`, Dockerfile `Dockerfile`; port `8080`, health check `/health`.
- One replica in Singapore. Keep the old Render service suspended: overlapping workers can process or recover the same Neon cases.
- Persistent volume: `/app/storage`; report path `/app/storage/lab-reports`; data-protection keys `/app/storage/data-protection-keys`.
- All 40 existing Render environment variables were copied and verified before deployment. The key path above is the documented platform-specific change. Preserve existing JWT, database, private Drive, provider and CORS settings; never paste secrets into documentation.
- `Database__MigrateOnStartup=false`; this hosting cutover did not run database migrations.
- Keep Render configuration for rollback. Stop Railway before resuming Render, then restore client API URLs.
- Existing installed mobile apps require a rebuild with the Railway API URL. Existing push subscriptions may need token re-registration because the previous Render filesystem key ring was not transferred.

`render.yaml` is retained as the historical rollback blueprint.

## 3. Web — Vercel

`web/vercel.json` is already set up (Vite framework, SPA rewrites). In Vercel: **New Project → import this repo → root directory `web`**.

Env var to set in Vercel: `VITE_API_BASE_URL=https://family-veda-api-production.up.railway.app/api/v1`

## 4. LLM keys

- **Gemini**: https://aistudio.google.com/apikey — free tier, no card required.
- **Groq**: https://console.groq.com/keys — free tier, no card required.

The backend tries Gemini first, falls back to Groq automatically on any failure or rate limit (HTTP 429 or 5xx). If both are unconfigured or fail, the agent step throws and the case defers to the doctor (Rule 9) rather than blocking.

## 5. Mobile — Android (signed release APK)

No paid account needed. Generate a keystore once:
```bash
keytool -genkey -v -keystore ~/familyveda-release.jks -keyalg RSA -keysize 2048 -validity 10000 -alias familyveda
```
Then set `ANDROID_KEYSTORE_PATH`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, and `ANDROID_KEY_PASSWORD` from `docs/ENV_VARS.md` (locally or as CI secrets) and build:
```bash
flutter build apk --release --dart-define=API_BASE_URL=https://family-veda-api-production.up.railway.app/api/v1 --dart-define=APP_ENV=production
```

## 6. Mobile — iOS

- **Simulator / your own device via Xcode**: free, no Apple Developer account needed — I can build and run this with the iOS Simulator tool right now.
- **A build others can install (TestFlight or ad-hoc/signed IPA)**: needs a paid Apple Developer account ($99/yr) and its Team ID, which you'd add to `mobile/ios` signing settings in Xcode. Not needed just to demo the app running.

## 7. Optional — push notifications (FCM)

Only if you want real push delivery:
1. Create a Firebase project, add Android + iOS apps.
2. Download `google-services.json` (Android) and `GoogleService-Info.plist` (iOS) — both gitignored, never commit them.
3. Generate a service-account JSON for `Fcm__ServiceAccountJson` (Firebase Console → Project Settings → Service Accounts).

Without this, the app runs fine — the subscription endpoint exists but no push is actually delivered.

## What to send me

To actually deploy, the fastest path is you create the accounts above (Neon, Render, Vercel are all free, no card) and either:
- give me the resulting connection strings / API keys directly in chat and I'll configure everything, or
- connect this session to your Render/Vercel accounts (I have MCP tools for both) and I'll do the setup end-to-end without you handling raw secrets at all.

Either way — nothing above touches this repo's git history; every value here is set through each platform's own environment/secrets UI.
