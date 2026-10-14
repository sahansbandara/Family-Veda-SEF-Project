"""Multi-endpoint local API load profile for Assignment 2 evidence.

Drives the read paths a Family Head and a Doctor use most, with ApacheBench.
Run only against a disposable local API and database with synthetic seed users:

    FV_TEST_PASSWORD=<local synthetic seed password> python3 scripts/e2e/local_load_profile.py

It refuses any non-local host, performs reads only, and exits non-zero if any
request fails or returns a non-2xx status.
"""

import json
import os
import re
import subprocess
import sys
import urllib.request
from urllib.parse import urlparse

BASE = os.environ.get("FV_TEST_API_BASE", "http://127.0.0.1:5060/api/v1").rstrip("/")
if urlparse(BASE).hostname not in {"127.0.0.1", "localhost"}:
    raise SystemExit("Load checks are restricted to a local API.")

PASSWORD = os.environ["FV_TEST_PASSWORD"]
REQUESTS = int(os.environ.get("FV_LOAD_REQUESTS", "1000"))
CONCURRENCY = int(os.environ.get("FV_LOAD_CONCURRENCY", "25"))


def call(path, token=None, body=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    request = urllib.request.Request(
        BASE + path,
        data=json.dumps(body).encode() if body is not None else None,
        headers=headers,
        method="POST" if body is not None else "GET",
    )
    with urllib.request.urlopen(request, timeout=20) as response:
        return json.load(response)


def login(email):
    return call("/auth/login", body={"email": email, "password": PASSWORD})["accessToken"]


def field(pattern, text, default="-"):
    match = re.search(pattern, text, re.MULTILINE)
    return match.group(1) if match else default


def bench(label, path, token):
    command = ["ab", "-n", str(REQUESTS), "-c", str(CONCURRENCY), "-s", "30", "-l"]
    if token:
        command += ["-H", f"Authorization: Bearer {token}"]
    result = subprocess.run(command + [BASE + path], capture_output=True, text=True, check=False)
    out = result.stdout
    row = {
        "label": label,
        "complete": field(r"^Complete requests:\s+(\d+)", out, "0"),
        "failed": field(r"^Failed requests:\s+(\d+)", out, "?"),
        "non2xx": field(r"^Non-2xx responses:\s+(\d+)", out, "0"),
        "rps": field(r"^Requests per second:\s+([\d.]+)", out),
        "mean": field(r"^Time per request:\s+([\d.]+) \[ms\] \(mean\)", out),
        "p50": field(r"^\s+50%\s+(\d+)", out),
        "p95": field(r"^\s+95%\s+(\d+)", out),
        "p99": field(r"^\s+99%\s+(\d+)", out),
        "max": field(r"^\s+100%\s+(\d+)", out),
    }
    row["ok"] = result.returncode == 0 and row["failed"] == "0" and row["non2xx"] == "0" \
        and row["complete"] == str(REQUESTS)
    return row


head = login("demo-head@example.invalid")
doctor = login("demo-doctor@example.invalid")
member_id = call("/members/me", head)["id"]

targets = [
    ("Health check (anonymous)", "/../../health", None),
    ("Family: own family", "/families/me", head),
    ("Family: dashboard", "/dashboard/family", head),
    ("Family: notifications", "/notifications", head),
    ("Family: appointments", "/appointments/mine", head),
    ("Family: health records", f"/members/{member_id}/records", head),
    ("Family: vitals", f"/members/{member_id}/vitals", head),
    ("Family: lab reports", f"/members/{member_id}/lab-reports", head),
    ("Family: triage cases", f"/members/{member_id}/triage-cases", head),
    ("Family: doctor directory", "/doctors/directory", head),
    ("Doctor: dashboard", "/dashboard/doctor", doctor),
    ("Doctor: my cases", "/doctors/me/cases", doctor),
    ("Doctor: case pool", "/doctors/case-pool", doctor),
    ("Doctor: appointments", "/doctors/me/appointments", doctor),
]

print(f"# ApacheBench load profile: {REQUESTS} requests per endpoint at concurrency {CONCURRENCY}")
print(f"# target: {BASE}")
print()
print(f"{'Endpoint':<28}{'done':>6}{'fail':>6}{'non2xx':>8}{'req/s':>10}{'mean ms':>10}"
      f"{'p50':>6}{'p95':>6}{'p99':>6}{'max':>7}")
rows = [bench(*target) for target in targets]
for row in rows:
    print(f"{row['label']:<28}{row['complete']:>6}{row['failed']:>6}{row['non2xx']:>8}{row['rps']:>10}"
          f"{row['mean']:>10}{row['p50']:>6}{row['p95']:>6}{row['p99']:>6}{row['max']:>7}")

bad = [row["label"] for row in rows if not row["ok"]]
print()
if bad:
    print("FAILED endpoints: " + ", ".join(bad))
    sys.exit(1)
print(f"All {len(rows)} endpoints completed {REQUESTS} requests with zero failed and zero non-2xx responses.")
