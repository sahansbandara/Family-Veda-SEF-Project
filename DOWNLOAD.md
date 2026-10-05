# Family Veda — Download and Try

All accounts and data are synthetic. This is academic coursework (SE3090, Group SE_016) and **does not constitute medical guidance**.

## Links

| What | Where |
|---|---|
| Web app | <https://family-veda-web.vercel.app> |
| Android APK | <https://github.com/sahansbandara/Family-Veda-SEF-Project/releases/tag/apk-2026-10-06> |
| API docs (Swagger) | <https://family-veda-api-production.up.railway.app/swagger/index.html> |
| API health | <https://family-veda-api-production.up.railway.app/health> |

Demo accounts are listed in the README under *Live demo access*.

## Android APK

- File: `FamilyVeda-debug-hosted-api-2026-10-06.apk` (228 MB, debug-signed)
- Points at: `https://family-veda-api-production.up.railway.app/api/v1`
- SHA-256: `9de5228e0314e2dea82221afee34e89353d1d29e0ed9d70b0c97ece79b9b7ce9`

### Install on a phone

1. Open the release link above on the phone and download the `.apk`.
2. When prompted, allow **Install unknown apps** for your browser or file manager.
3. Open the downloaded file and tap **Install**, then open **Family Veda**.

### Install from a computer

```bash
adb install -r FamilyVeda-debug-hosted-api-2026-10-06.apk
```

### Verify the download

```bash
shasum -a 256 FamilyVeda-debug-hosted-api-2026-10-06.apk
```

The output must match the SHA-256 above.

## Notes

- The API runs on Railway. The earlier `apk-2026-09-28` build targets the retired Render backend and can no longer sign in; use this release instead.
- A release-signed APK has not been produced yet; Android may warn that the app is from an unknown developer.
