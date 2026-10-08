# Isolated authenticated OWASP ZAP API scan

Target: disposable local ASP.NET Core API, port 5061, PostgreSQL 16 database `fv_qmse_zap`. Port 5060 and its database remain separate. Only synthetic accounts and data are used. No hosted LLM keys are supplied.

1. Create a fresh PostgreSQL database in an isolated local PostgreSQL 16 instance; do not target a hosted connection.
2. Start the existing API binary with `ASPNETCORE_ENVIRONMENT=Development`, `ASPNETCORE_URLS=http://127.0.0.1:5061`, `ConnectionStrings__DefaultConnection` pointing to that database, `Database__MigrateOnStartup=true`, `Seed__Enabled=true`, a privately supplied `Seed__DefaultPassword` of at least 12 characters, and `DataProtection__PersistToDatabase=true`. Apply existing migrations only; do not generate migrations. Explicitly remove Gemini, Llm and Cloudflare credential environment variables.
3. Verify both host and Docker connectivity to `/swagger/v1/swagger.json`. Docker target is `http://host.docker.internal:5061`. Do not broaden the API network binding if connectivity fails without coordinating first.
4. Authenticate `demo-head@example.invalid` through `/api/v1/auth/login` using the private seed password. Store the resulting token only in a private temporary directory, never in this evidence folder.
5. Create a private ZAP configuration (the value below is a placeholder):

```properties
replacer.full_list(0).description=isolated synthetic Head bearer
replacer.full_list(0).enabled=true
replacer.full_list(0).matchtype=REQ_HEADER
replacer.full_list(0).matchstr=Authorization
replacer.full_list(0).regex=false
replacer.full_list(0).replacement=Bearer <PRIVATE_TEMPORARY_TOKEN>
```

6. Run the cached image with the private configuration mounted read-only and an evidence folder mounted at `/zap/wrk`:

```sh
docker run --rm --name fv-qmse-zap-20261008 \
  -v "$FV_PRIVATE_ZAP_DIR:/zap/private:ro" \
  -v "$FV_ZAP_EVIDENCE_DIR:/zap/wrk:rw" \
  ghcr.io/zaproxy/zaproxy:stable zap-api-scan.py \
  -t http://host.docker.internal:5061/swagger/v1/swagger.json \
  -f openapi -r zap-report.html -w zap-report.md -J zap-report.json \
  -z '-configfile /zap/private/replacer.conf'
```

This active scan mutates the disposable dataset. It is authenticated only as a synthetic Family Head; it does not constitute authenticated Doctor/Admin coverage, proof against all vulnerabilities, or UI/browser scanning. Swagger-generated requests may use unresolved resource placeholders and receive safe denials. Exit 1 indicates failures, exit 2 warnings, exit 3 execution failure; inspect actual alerts instead of equating exit status with severity.

7. Sanitize output for tokens, seed/database passwords and connection strings before retaining reports. Stop only the scan container and isolated port-5061 API. Preserve database evidence and unrelated containers.
