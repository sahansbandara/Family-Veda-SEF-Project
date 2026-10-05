# Family Veda — Download and Try

All accounts and data are synthetic. This is academic coursework (SE3090, Group SE_016) and **does not constitute medical guidance**.

## Links

| What | Where |
|---|---|
| Web app | <https://family-veda-web.vercel.app> |
| Android APK | <https://github.com/sahansbandara/Family-Veda-SEF-Project/releases/tag/apk-2026-09-28> |
| API docs (Swagger) | <https://family-veda-api.onrender.com/swagger/index.html> |
| API health | <https://family-veda-api.onrender.com/health> |

Demo accounts are listed in the README under *Live demo access*.

## Android APK

- File: `FamilyVeda-debug-hosted-api-2026-09-28.apk` (159 MB, debug-signed)
- Points at: `https://family-veda-api.onrender.com/api/v1`
- SHA-256: `ac493f51f19a23a75f6d3b49b76fecb0f390e9172569ea4adb404edfdafd7d3d`

### Install on a phone

1. Open the release link above on the phone and download the `.apk`.
2. When prompted, allow **Install unknown apps** for your browser or file manager.
3. Open the downloaded file and tap **Install**, then open **Family Veda**.

### Install from a computer

```bash
adb install -r FamilyVeda-debug-hosted-api-2026-09-28.apk
```

### Verify the download

```bash
shasum -a 256 FamilyVeda-debug-hosted-api-2026-09-28.apk
```

The output must match the SHA-256 above.

## Notes

- The API runs on Render's free tier and sleeps when idle; the first request can take about 50 seconds.
- A release-signed APK has not been produced yet; Android may warn that the app is from an unknown developer.
