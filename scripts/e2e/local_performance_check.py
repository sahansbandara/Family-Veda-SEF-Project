"""Small, repeatable local API load check for Assignment 2 evidence.

Run only against a disposable local database with synthetic seed users.
"""

import json
import os
import subprocess
import urllib.request
from urllib.parse import urlparse

base = os.environ.get("FV_TEST_API_BASE", "http://127.0.0.1:5060/api/v1").rstrip("/")
if urlparse(base).hostname not in {"127.0.0.1", "localhost"}:
    raise SystemExit("Load checks are restricted to a local API.")

password = os.environ["FV_TEST_PASSWORD"]
request = urllib.request.Request(
    base + "/auth/login",
    data=json.dumps({"email": "demo-head@example.invalid", "password": password}).encode(),
    headers={"Content-Type": "application/json"},
    method="POST",
)
with urllib.request.urlopen(request, timeout=15) as response:
    token = json.load(response)["accessToken"]

result = subprocess.run(
    ["ab", "-n", "200", "-c", "10", "-s", "30", "-H", f"Authorization: Bearer {token}",
     base + "/doctors/directory"],
    capture_output=True,
    text=True,
    check=False,
)
if result.returncode:
    raise SystemExit(result.stderr.strip() or "ApacheBench failed")
print(result.stdout)
if "Failed requests:        0" not in result.stdout or "Non-2xx responses:" in result.stdout:
    raise SystemExit("Load check returned failed or non-2xx responses")
