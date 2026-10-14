"""Write-path check and stepped read ramp for Assignment 2 evidence.

Run only against a disposable local API and database with synthetic seed users:

    FV_TEST_PASSWORD=<local synthetic seed password> python3 scripts/e2e/local_write_load_profile.py

Part 1 creates symptom episodes and submits triage cases as the synthetic Family Head
(authenticated WRITE path), recording every HTTP status. 429 responses are reported, never
worked around. Part 2 ramps one read endpoint through increasing ApacheBench concurrency.
Refuses any non-local host. Exits non-zero if a write returns an unexpected status or any
ramp step has failed or non-2xx requests.
"""

import json
import os
import re
import subprocess
import sys
import time
import urllib.error
import urllib.request
from collections import Counter
from urllib.parse import urlparse

BASE = os.environ.get("FV_TEST_API_BASE", "http://127.0.0.1:5090/api/v1").rstrip("/")
if urlparse(BASE).hostname not in {"127.0.0.1", "localhost"}:
    raise SystemExit("Load checks are restricted to a local API.")

PASSWORD = os.environ["FV_TEST_PASSWORD"]
WRITES = int(os.environ.get("FV_WRITE_COUNT", "20"))
REQUESTS = int(os.environ.get("FV_RAMP_REQUESTS", "2000"))
STEPS = [int(x) for x in os.environ.get("FV_RAMP_STEPS", "10,25,50,100").split(",")]
RAMP_PATH = os.environ.get("FV_RAMP_PATH", "/dashboard/family")


def call(path, token=None, body=None, method=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    data = json.dumps(body).encode() if body is not None else None
    request = urllib.request.Request(BASE + path, data=data, headers=headers,
                                     method=method or ("POST" if data is not None else "GET"))
    started = time.perf_counter()
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            payload = response.read()
            status = response.status
    except urllib.error.HTTPError as error:
        payload, status = error.read(), error.code
    ms = (time.perf_counter() - started) * 1000
    try:
        return status, ms, json.loads(payload or b"null")
    except ValueError:
        return status, ms, None


def pct(values, q):
    ordered = sorted(values)
    return ordered[min(len(ordered) - 1, int(round(q * (len(ordered) - 1))))] if ordered else 0.0


def field(pattern, text, default="-"):
    match = re.search(pattern, text, re.MULTILINE)
    return match.group(1) if match else default


status, _, body = call("/auth/login", body={"email": "demo-head@example.invalid", "password": PASSWORD})
if status != 200 or not body or "accessToken" not in body:
    raise SystemExit(f"Login failed with HTTP {status}")
token = body["accessToken"]
member_id = call("/members/me", token)[2]["id"]

print(f"# Write path: {WRITES} x (create symptom episode -> submit triage case) as synthetic Family Head")
print(f"# target: {BASE}")
create_ms, submit_ms, codes, case_ids = [], [], Counter(), []
for index in range(WRITES):
    payload = {"symptoms": ["Mild headache", "Tiredness"], "durationDays": 2, "severity": 3,
               "notes": f"Synthetic load-test episode {index + 1}"}
    status, ms, episode = call(f"/members/{member_id}/episodes", token, payload)
    codes[f"create:{status}"] += 1
    create_ms.append(ms)
    if status != 201:
        continue
    status, ms, triage_case = call(f"/episodes/{episode['id']}/triage", token, {}, "POST")
    codes[f"submit:{status}"] += 1
    submit_ms.append(ms)
    if status == 202 and triage_case:
        case_ids.append(triage_case["id"])

print(f"status counts: {dict(sorted(codes.items()))}")
for label, values in (("create episode", create_ms), ("submit triage", submit_ms)):
    if values:
        print(f"{label:<16} n={len(values):<4} p50={pct(values, .5):7.1f} ms  p95={pct(values, .95):7.1f} ms  max={max(values):7.1f} ms")

time.sleep(5)
states = Counter()
for case_id in case_ids:
    status, _, info = call(f"/triage-cases/{case_id}/status", token)
    states[str(info.get("status")) if status == 200 and info else f"http-{status}"] += 1
print(f"case states 5 s after submit: {dict(states)}")
write_bad = [k for k in codes if k not in {"create:201", "submit:202"}]

print()
print(f"# Stepped read ramp: {REQUESTS} requests per step on GET {RAMP_PATH} (ApacheBench)")
print(f"{'conc':>5}{'done':>7}{'fail':>6}{'non2xx':>8}{'req/s':>10}{'mean ms':>10}{'p50':>6}{'p95':>6}{'p99':>6}{'max':>7}")
ramp_bad = False
for concurrency in STEPS:
    result = subprocess.run(["ab", "-n", str(REQUESTS), "-c", str(concurrency), "-s", "60", "-l",
                             "-H", f"Authorization: Bearer {token}", BASE + RAMP_PATH],
                            capture_output=True, text=True, check=False)
    out = result.stdout
    row = [field(r"^Complete requests:\s+(\d+)", out, "0"), field(r"^Failed requests:\s+(\d+)", out, "?"),
           field(r"^Non-2xx responses:\s+(\d+)", out, "0"), field(r"^Requests per second:\s+([\d.]+)", out),
           field(r"^Time per request:\s+([\d.]+) \[ms\] \(mean\)", out), field(r"^\s+50%\s+(\d+)", out),
           field(r"^\s+95%\s+(\d+)", out), field(r"^\s+99%\s+(\d+)", out), field(r"^\s+100%\s+(\d+)", out)]
    print(f"{concurrency:>5}{row[0]:>7}{row[1]:>6}{row[2]:>8}{row[3]:>10}{row[4]:>10}{row[5]:>6}{row[6]:>6}{row[7]:>6}{row[8]:>7}")
    if result.returncode != 0 or row[1] != "0" or row[2] != "0" or row[0] != str(REQUESTS):
        ramp_bad = True

print()
print("Writes: " + ("unexpected statuses " + ", ".join(write_bad) if write_bad else "all returned expected 201/202")
      + "; ramp: " + ("failures present" if ramp_bad else "no failed or non-2xx requests"))
sys.exit(1 if write_bad or ramp_bad else 0)
