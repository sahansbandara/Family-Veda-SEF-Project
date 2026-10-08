# Fresh isolated ZAP API scan — 2026-10-08

ZAP version: 2.17.0
Target: localhost API5061, disposable fv_qmse_zap database, synthetic Family Head bearer authentication.
High: 0; Medium: 0; Low alert types: 2; Informational alert types: 3.
Runner exit: 2 (warnings); FAIL-NEW: 0; WARN-NEW: 2; PASS: 117.

Low: missing/invalid Cross-Origin-Resource-Policy (2 instances); unexpected Content-Type (2 Swagger UI instances).
Informational: client error responses (480 instances), authentication requests identified (2), non-storable content (5).

Scope limits:184 imported OpenAPI URLs (456 URLs in total per the scan console); synthetic Head role only. Many generated resource placeholders cause client errors; this does not establish full authorized resource or Doctor/Admin coverage. Generic PagedResult schema-name regex warnings occurred during import. No hosted LLM credentials were supplied. No application fixes were made.

Isolation: scan container removed automatically; API5061 stopped; root API5060 and unrelated Docker containers preserved. Database retained. Reports and console output sanitized against all private runtime values and bearer token.
