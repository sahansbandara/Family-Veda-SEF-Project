# ADR-014 — Google Drive for Original Lab-Report Images

**Owner:** S2 · **Status:** Accepted · **Extends:** ADR-010 (durable report storage in PostgreSQL) · **Date:** 2026-10-01

## Context

ADR-010 stores uploaded lab-report images as bytes in PostgreSQL so they survive host restarts. The hosted database is a free-tier Neon instance with 0.5 GB of storage, shared with every other table. Original images are the largest thing the system stores and the only data that grows with every upload.

Constraints:
1. Clients never call a third-party service directly (invariant 4). Agents hold no credentials (invariant 5).
2. Every cross-profile read stays consented and audited (RULE 8).
3. Synthetic data only (RULE 7).
4. Local development and CI must work with no cloud credentials.
5. An upload must never be lost because a third party is unavailable.

## Decision

Original report images are stored in Google Drive through a backend-only seam, `IExternalReportFileStore`. PostgreSQL keeps all metadata, extracted values and the storage key.

- **Key on the report.** `LabReport.StoredFileName` holds `gdrive:{fileId}{ext}` or the existing `db:{guid}{ext}`. Reads follow the key, so reports stored before this ADR keep working. No schema change.
- **Marker row.** A Drive-stored report keeps its `LabReportFile` row with empty content. Existing authorisation queries and the `hasOriginalFile` flag are unchanged.
- **Least privilege.** OAuth scope `drive.file`: the backend can see only files it created. It creates its own folder (`FamilyVeda-LabReports`). No sharing link is ever created; bytes leave Drive only through the authorised `GET /lab-reports/{id}/file` endpoint and the OCR tool.
- **Order of checks.** Consent, family and grant checks run in PostgreSQL first. Drive is contacted only after they pass; the audit row is written only after a successful read.
- **No personal detail in Drive.** Drive file names are random. The original file name stays in PostgreSQL.
- **Fallback.** If Drive rejects or cannot be reached during upload, the bytes are stored in PostgreSQL as before and a warning is logged. If Drive fails during a read, the API answers 422 "temporarily unavailable" and OCR falls back to manual entry.
- **Configuration.** `Storage:Provider=GoogleDrive` plus `GoogleDrive:ClientId`, `ClientSecret`, `RefreshToken`. Anything missing means the database store is used.
- **No new dependency.** Plain `HttpClient` against the Drive v3 REST API.

## Alternatives considered

| Option | Why not |
|---|---|
| Keep everything in PostgreSQL | Free-tier storage is small and shared; images are the only unbounded growth. |
| Service account | Service accounts have no storage quota on a personal Drive; uploads fail. Works only with Workspace Shared Drives. |
| Full `drive` scope into a hand-made folder | Restricted scope: the OAuth app cannot leave Testing without Google verification, so refresh tokens expire after 7 days. |
| Drive as a mirror only | Does not relieve database storage. |

## Consequences

- One Google account owns every stored image. Acceptable for a synthetic-data university system; **not acceptable for real patient data** — no data-processing agreement, consumer terms, single-person ownership. Before any real release the store must be replaced by managed object storage under a proper agreement. The seam makes that one new class and a configuration change.
- Preview and OCR now depend on Google availability for Drive-stored reports. Mitigated by the upload fallback and the existing manual-entry path.
- Three new secrets to manage. The refresh token is obtained once with `scripts/google-drive-authorize.py`, which writes it to the env file without printing it.
- The OAuth consent screen must be published to Production; in Testing mode Google expires refresh tokens after 7 days.

## Verification

`GoogleDriveReportStorageTests`: token refresh and caching, folder created once, 401 retry, key validation without network calls, no provider body or credential in error messages, upload keeps bytes out of PostgreSQL, fallback on failure, denial before Drive is touched.
