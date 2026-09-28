import json
import os
import urllib.error
import urllib.request
import uuid
from datetime import datetime, timedelta, timezone
from urllib.parse import urlparse

BASE = os.environ.get("FV_TEST_API_BASE", "http://127.0.0.1:5060/api/v1").rstrip("/")
if urlparse(BASE).hostname not in {"127.0.0.1", "localhost"}:
    raise SystemExit("This synthetic-data mutating journey runs only against a local API.")
PASSWORD = os.environ["FV_TEST_PASSWORD"]
DOCTOR_EMAIL = os.environ.get("FV_TEST_DOCTOR_EMAIL", "demo-doctor@example.invalid")


def call(method, path, body=None, token=None, expected=(200,)):
    data = None if body is None else json.dumps(body).encode()
    request = urllib.request.Request(BASE + path, data=data, method=method)
    if data is not None:
        request.add_header("Content-Type", "application/json")
    if token:
        request.add_header("Authorization", "Bearer " + token)
    try:
        response = urllib.request.urlopen(request, timeout=15)
        status, payload = response.status, response.read()
    except urllib.error.HTTPError as error:
        status, payload = error.code, error.read()
    print(f"{method} {path}: {status}")
    if status not in expected:
        raise AssertionError(f"Expected {expected}, got {status}: {payload[:600]!r}")
    return json.loads(payload) if payload else None


suffix = uuid.uuid4().hex[:10]
head = call("POST", "/auth/register", {
    "email": f"synthetic-head-{suffix}@example.invalid", "password": PASSWORD,
    "displayName": "Synthetic Journey Head", "userType": "FamilyUser",
}, expected=(201,))
adult = call("POST", "/auth/register", {
    "email": f"synthetic-adult-{suffix}@example.invalid", "password": PASSWORD,
    "displayName": "Synthetic Journey Adult", "userType": "FamilyUser",
}, expected=(201,))
doctor = call("POST", "/auth/login", {
    "email": DOCTOR_EMAIL, "password": PASSWORD,
})
head_token, adult_token, doctor_token = head["accessToken"], adult["accessToken"], doctor["accessToken"]
family = call("POST", "/families", {"name": "Synthetic Journey Family"}, head_token, (201,))
family_id, family_code = family["id"], family["familyCode"]
head_member = call("POST", f"/families/{family_id}/members", {
    "displayName": "Synthetic Journey Head", "dateOfBirth": "1990-01-01", "role": "Head",
    "userId": head["userId"],
}, head_token, (201,))
join = call("POST", "/families/join-requests", {
    "familyCode": family_code, "relationshipType": "sibling", "message": "Synthetic test",
}, adult_token, (201,))
call("POST", f"/families/join-requests/{join['id']}/accept", token=head_token)
call("GET", f"/families/{family_id}/members", token=head_token)
adult_member = call("GET", "/members/me", token=adult_token)
record = call("POST", f"/members/{adult_member['id']}/records", {
    "recordType": "Note", "title": "Synthetic private note", "summary": "Demonstration only.",
    "occurredOn": "2026-09-28",
}, adult_token, (201,))
call("GET", f"/members/{adult_member['id']}/records", token=head_token, expected=(404,))
call("GET", f"/members/{adult_member['id']}/records", token=adult_token)
directory = call("GET", "/doctors/directory", token=head_token)
doctor_profile = next(item for item in directory if item["displayName"] == "Synthetic Verified Doctor")
request = call("POST", f"/families/{family_id}/doctor-requests", {
    "doctorId": doctor_profile["id"], "message": "Synthetic test",
}, head_token, (201,))
call("POST", f"/doctors/me/family-requests/{request['id']}/accept", token=doctor_token)
starts_at = (datetime.now(timezone.utc) + timedelta(hours=48 + (uuid.uuid4().int % 8760))).replace(minute=0, second=0, microsecond=0)
appointment = call("POST", "/appointments", {
    "memberId": head_member["id"], "startsAt": starts_at.isoformat(),
    "durationMinutes": 45, "reason": "Synthetic routine consultation",
}, head_token, (201,))
call("POST", f"/doctors/me/appointments/{appointment['id']}/confirm", {"note": "Synthetic confirmation"}, doctor_token)
family_dashboard = call("GET", "/dashboard/family", token=head_token)
doctor_dashboard = call("GET", "/dashboard/doctor", token=doctor_token)
notifications = call("GET", "/notifications", token=head_token)
assert family_dashboard["familyDoctor"]["id"] == doctor_profile["id"]
assert family_dashboard["recentActivity"]
assert doctor_dashboard["assignedFamilies"] >= 1
assert isinstance(notifications, list)
print("Synthetic local API journey passed")
