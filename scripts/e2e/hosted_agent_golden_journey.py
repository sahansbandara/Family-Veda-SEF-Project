"""Golden triage journey against a LOCAL API whose agents call the configured hosted LLM providers.

Synthetic data only. Submits one case as a family user, waits for the agent pipeline, checks the
approval gate before and after a doctor decision, and prints the doctor-only agent trace summary.
"""
import json
import os
import time
import urllib.error
import urllib.request
import uuid
from urllib.parse import urlparse

BASE = os.environ.get("FV_TEST_API_BASE", "http://127.0.0.1:5095/api/v1").rstrip("/")
if urlparse(BASE).hostname not in {"127.0.0.1", "localhost"}:
    raise SystemExit("This synthetic-data mutating journey runs only against a local API.")
PASSWORD = os.environ["FV_TEST_PASSWORD"]
DOCTOR_EMAIL = os.environ.get("FV_TEST_DOCTOR_EMAIL", "demo-doctor@example.invalid")
SEEDED_HEAD_EMAIL = os.environ.get("FV_TEST_SEEDED_HEAD_EMAIL")
WAIT_SECONDS = int(os.environ.get("FV_AGENT_WAIT_SECONDS", "240"))
INTERNAL_NOTE = "SYNTHETIC-INTERNAL-NOTE-" + uuid.uuid4().hex[:8]
FINAL_ADVISORY = "Please arrange an in-person clinical review."
REVIEWABLE = {"PendingDoctorReview", "LowConfidence"}
IN_PROGRESS = {"Submitted", "Planning", "ContextReady", "Analysed", "RiskAssessed", "Validated"}
checks = []


def call(method, path, body=None, token=None, expected=(200,)):
    request = urllib.request.Request(BASE + path, method=method)
    data = None if body is None else json.dumps(body).encode()
    if data is not None:
        request.add_header("Content-Type", "application/json")
    if token:
        request.add_header("Authorization", "Bearer " + token)
    try:
        response = urllib.request.urlopen(request, data=data, timeout=30)
        status, payload = response.status, response.read()
    except urllib.error.HTTPError as error:
        status, payload = error.code, error.read()
    print(f"{method} {path}: {status}")
    if status not in expected:
        raise AssertionError(f"Expected {expected}, got {status}: {payload[:400]!r}")
    return (json.loads(payload) if payload else None), payload.decode(errors="replace")


def check(name, passed, detail=""):
    checks.append((name, passed))
    print(f"CHECK {'PASS' if passed else 'FAIL'} - {name}{': ' + detail if detail else ''}")


doctor, _ = call("POST", "/auth/login", {"email": DOCTOR_EMAIL, "password": PASSWORD})
doctor_token = doctor["accessToken"]
if SEEDED_HEAD_EMAIL:
    # A seeded member with recorded vitals and labs, already assigned to the seeded doctor.
    head, _ = call("POST", "/auth/login", {"email": SEEDED_HEAD_EMAIL, "password": PASSWORD})
    head_token = head["accessToken"]
    member, _ = call("GET", "/members/me", token=head_token)
else:
    suffix = uuid.uuid4().hex[:10]
    head, _ = call("POST", "/auth/register", {
        "email": f"synthetic-golden-{suffix}@example.invalid", "password": PASSWORD,
        "displayName": "Synthetic Golden Head", "userType": "FamilyUser",
    }, expected=(201,))
    head_token = head["accessToken"]
    family, _ = call("POST", "/families", {"name": "Synthetic Golden Family"}, head_token, (201,))
    member, _ = call("POST", f"/families/{family['id']}/members", {
        "displayName": "Synthetic Golden Head", "dateOfBirth": "1990-01-01", "role": "Head",
        "userId": head["userId"],
    }, head_token, (201,))
    directory, _ = call("GET", "/doctors/directory", token=head_token)
    doctor_profile = next(item for item in directory if item["displayName"] == doctor["displayName"])
    doctor_request, _ = call("POST", f"/families/{family['id']}/doctor-requests", {
        "doctorId": doctor_profile["id"], "message": "Synthetic test",
    }, head_token, (201,))
    call("POST", f"/doctors/me/family-requests/{doctor_request['id']}/accept", token=doctor_token)

episode, _ = call("POST", f"/members/{member['id']}/episodes", {
    "symptoms": ["mild headache"], "durationDays": 2, "severity": 2,
    "notes": "Synthetic demonstration only.",
}, head_token, (201,))
case, _ = call("POST", f"/episodes/{episode['id']}/triage", token=head_token, expected=(202,))
case_id = case["id"]
print(f"CASE {case_id}")

_, _ = call("GET", f"/triage-cases/{case_id}/approved-guidance", token=head_token, expected=(404,))
check("guidance hidden before any doctor decision", True, "HTTP 404")
call("GET", f"/triage-cases/{case_id}/review", token=head_token, expected=(403, 404))
check("family user cannot open the doctor-only review (agent outputs and draft)", True)

started = time.monotonic()
status = {}
while time.monotonic() - started < WAIT_SECONDS:
    status, _ = call("GET", f"/triage-cases/{case_id}/status", token=head_token)
    if status["status"] not in IN_PROGRESS:
        break
    time.sleep(5)
elapsed = round(time.monotonic() - started, 1)
print(f"PIPELINE status={status.get('status')} priority={status.get('priority')} "
      f"failureCode={status.get('failureCode')} seconds={elapsed}")

if status.get("status") not in REVIEWABLE:
    _, _ = call("GET", f"/triage-cases/{case_id}/approved-guidance", token=head_token, expected=(404,))
    check("no guidance after a non-reviewable pipeline outcome", True, str(status.get("status")))
    check("hosted agent pipeline reached doctor review", False, str(status))
else:
    check("hosted agent pipeline reached doctor review", True, f"{status['status']} in {elapsed}s")
    review, _ = call("GET", f"/triage-cases/{case_id}/review", token=doctor_token)
    for trace in review["traces"]:
        print(f"TRACE step={trace['stepNumber']} agent={trace['agent']} status={trace['status']} "
              f"schemaValid={trace['outputSchemaValid']} confidence={trace['confidence']} "
              f"latencyMs={trace['latencyMilliseconds']} allowed={trace['toolsAllowed']} "
              f"denied={trace['toolsDenied']}")
    check("every completed agent step produced schema-valid output",
          all(t["outputSchemaValid"] for t in review["traces"] if t["status"] == "Completed"))
    if status["status"] == "PendingDoctorReview":
        check("a draft advisory exists for the doctor only", bool(review.get("draftAdvisoryJson")))
    else:
        print("INFO low-confidence outcome: no draft advisory is produced; the doctor decides without one")
    _, _ = call("GET", f"/triage-cases/{case_id}/approved-guidance", token=head_token, expected=(404,))
    check("guidance still hidden after agents finish, before approval", True, "HTTP 404")
    _, family_traces = call("GET", f"/triage-cases/{case_id}/traces", token=head_token)
    check("family progress view carries step metadata only, no agent output or draft text",
          not any(key in family_traces for key in ("outputJson", "draftAdvisory", "analysisJson", "contextJson")))

    call("POST", f"/triage-cases/{case_id}/approve", {
        "doctorNotes": INTERNAL_NOTE, "finalAdvisory": FINAL_ADVISORY,
    }, doctor_token)
    guidance, guidance_raw = call("GET", f"/triage-cases/{case_id}/approved-guidance", token=head_token)
    check("family reads the doctor-approved guidance", guidance["finalAdvisory"] == FINAL_ADVISORY)
    patient_case, patient_raw = call("GET", f"/triage-cases/{case_id}", token=head_token)
    check("case is Approved for the family", patient_case["status"] == "Approved")
    check("internal doctor note absent from patient responses",
          INTERNAL_NOTE not in patient_raw and INTERNAL_NOTE not in guidance_raw)
    check("no overdue-review marker on the approved case", patient_case.get("failureCode") != "DOCTOR_RESPONSE_DELAY")

failed = [name for name, passed in checks if not passed]
print(f"RESULT {len(checks) - len(failed)} passed, {len(failed)} failed")
if failed:
    raise SystemExit("Failed checks: " + "; ".join(failed))
print("Hosted-agent golden journey passed")
