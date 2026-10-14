# Role-coverage ZAP API scan, synthetic Admin — 2026-10-08

Method: identical to `../2026-10-08-zap/REPRODUCE.md` (ZAP 2.17.0 `zap-api-scan.py`, OpenAPI import, Authorization header replacer with a synthetic bearer, cached `ghcr.io/zaproxy/zaproxy:stable`). Only differences: API port 5091, throwaway PostgreSQL 16 container (127.0.0.1:55491, database `fv_nf2_admin`, fresh per scan), authenticated as `demo-admin@example.invalid` (seeded synthetic account). Token and seed/database secrets kept in a private scratch directory and redacted from all retained files (verified: no JWT or secret strings remain).

Result: runner exit 2 (warnings). PASS 117 / FAIL-NEW 0 / WARN-NEW 2.
Alerts by risk: High 0; Medium 0; Low 2 types (CORP header missing/invalid: 5 instances; unexpected Content-Type, Swagger UI: 2); Informational 3 types (469 client-error responses; authentication requests identified: 2; non-storable content: 5).

Role evidence: seeded-Admin-only routes returned 200 under this token (see scan-output.txt: GET /api/v1/admin/doctors and /admin/family-heads).

Limits: 184 OpenAPI URLs imported, the same count the Head scan console reports. Swagger-generated resource placeholders cause many safe 4xx denials, so coverage of real authorized resources is partial. Active scan mutated only the disposable database. API-level scan only: no browser/UI, no hosted target, no LLM credentials supplied. Exit status is not equated with severity; no application fixes were made.

Isolation: scan container auto-removed; API on 127.0.0.1:5091 stopped; throwaway PostgreSQL container removed.
