# Write-path and ramped load profile — 2026-10-08

Environment: Apple M4 (10 cores, 24 GB), macOS 27.0.1, .NET SDK 10.0.302 running the net8.0 API, ApacheBench, PostgreSQL 16 in a throwaway Docker container (127.0.0.1:55491, fresh database). API on 127.0.0.1:5090, Development environment, seeded synthetic accounts, no Gemini/Groq/Cloudflare credentials. Everything (client, API, database) shares one machine.

## Write path (synthetic Family Head): 20 x create episode, then submit triage case

| Step | Requests | Status | p50 | p95 | max |
|---|---|---|---|---|---|
| POST /members/{id}/episodes | 20 | 20 x 201 | 3.8 ms | 6.6 ms | 30.0 ms |
| POST /episodes/{id}/triage | 20 | 20 x 202 | 10.9 ms | 16.4 ms | 64.2 ms |

No 429 responses occurred (the rate limiter is applied to auth, family-code and OCR policies; the write routes are not limited, and no limit was disabled). Latency is the synchronous API acknowledgement only. Background agent worker: with no LLM credentials the three providers were logged as skipped (configuration missing) and no outbound LLM request was made; all 20 submitted cases ended `FailedSafe` with failure code `AGENT_UNAVAILABLE` within 5 s, as designed. End-to-end agent/LLM latency is therefore not measured.

## Stepped ramp: GET /dashboard/family, 2,000 requests per step

| Concurrency | Done | Failed | Non-2xx | req/s | Mean ms | p50 | p95 | p99 | max |
|---|---|---|---|---|---|---|---|---|---|
| 10 | 2000 | 0 | 0 | 371.0 | 27.0 | 24 | 45 | 70 | 233 |
| 25 | 2000 | 0 | 0 | 431.8 | 57.9 | 53 | 90 | 113 | 141 |
| 50 | 2000 | 0 | 0 | 447.1 | 111.8 | 104 | 165 | 227 | 294 |
| 100 | 2000 | 0 | 0 | 437.4 | 228.6 | 208 | 367 | 407 | 488 |

Throughput plateaus near 430-450 req/s from concurrency 25; beyond that latency grows roughly linearly (queueing). No failures at any step. Raw output: `write-and-ramp-load-profile.txt`. Script exit 0.

## Rerun (secret supplied privately, never recorded)

```sh
FV_TEST_PASSWORD=<local synthetic seed password> FV_TEST_API_BASE=http://127.0.0.1:5090/api/v1 \
FV_WRITE_COUNT=20 FV_RAMP_REQUESTS=2000 FV_RAMP_STEPS=10,25,50,100 \
python3 scripts/e2e/local_write_load_profile.py
```

## Scope limits

- Single local machine; load generator, API and database compete for the same CPU. Not representative of a hosted deployment or production SLA.
- Dev build (Debug binaries, Development environment); EF SQL logging was on, which depresses throughput.
- One read endpoint was ramped; only 20 write operations, sequential (no concurrent writes), one user.
- ApacheBench reports whole-millisecond percentiles. Single run per step; no repetition or variance analysis; no sustained/soak test.
- No hosted LLM latency; agent worker ran in its fail-safe path.
- At concurrency 100 the connection pool opened enough PostgreSQL connections that an ad-hoc `psql` session was refused ("too many clients", default limit 100); the API itself logged no such error and returned no failures. This is an observation, not a tuned configuration.
