#!/usr/bin/env python3
"""One-time Google Drive consent for Family Veda report storage (ADR-014).

Opens the Google consent page, receives the redirect on 127.0.0.1 and writes the
refresh token straight into the env file. The token is never printed.

Usage:
    GOOGLE_DRIVE_CLIENT_ID=... GOOGLE_DRIVE_CLIENT_SECRET=... \
        python3 scripts/google-drive-authorize.py [path/to/.env]

Scope requested: drive.file — the backend can only see files it created.
"""
import http.server
import json
import os
import secrets
import sys
import urllib.parse
import urllib.request
import webbrowser
from pathlib import Path

SCOPE = "https://www.googleapis.com/auth/drive.file"
PORT = 8765
REDIRECT = f"http://127.0.0.1:{PORT}/callback"


def main() -> int:
    client_id = os.environ.get("GOOGLE_DRIVE_CLIENT_ID", "").strip()
    client_secret = os.environ.get("GOOGLE_DRIVE_CLIENT_SECRET", "").strip()
    if not client_id or not client_secret:
        print("Set GOOGLE_DRIVE_CLIENT_ID and GOOGLE_DRIVE_CLIENT_SECRET first.")
        return 2
    env_path = Path(sys.argv[1] if len(sys.argv) > 1 else ".env")
    state = secrets.token_urlsafe(24)
    result: dict[str, str] = {}

    class Handler(http.server.BaseHTTPRequestHandler):
        def do_GET(self):  # noqa: N802
            query = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
            ok = query.get("state", [""])[0] == state and "code" in query
            if ok:
                result["code"] = query["code"][0]
            self.send_response(200 if ok else 400)
            self.send_header("Content-Type", "text/plain; charset=utf-8")
            self.end_headers()
            self.wfile.write(b"Done. You can close this tab." if ok else b"Authorisation was not completed.")

        def log_message(self, *_):  # keep the code out of the terminal
            pass

    url = "https://accounts.google.com/o/oauth2/v2/auth?" + urllib.parse.urlencode({
        "client_id": client_id, "redirect_uri": REDIRECT, "response_type": "code", "scope": SCOPE,
        "access_type": "offline", "prompt": "consent", "state": state,
    })
    server = http.server.HTTPServer(("127.0.0.1", PORT), Handler)
    print("Opening the Google consent page in your browser…")
    webbrowser.open(url)
    while "code" not in result:
        server.handle_request()
    server.server_close()

    body = urllib.parse.urlencode({
        "code": result["code"], "client_id": client_id, "client_secret": client_secret,
        "redirect_uri": REDIRECT, "grant_type": "authorization_code",
    }).encode()
    try:
        with urllib.request.urlopen(urllib.request.Request("https://oauth2.googleapis.com/token", data=body), timeout=30) as response:
            refresh_token = json.load(response).get("refresh_token")
    except Exception as error:  # noqa: BLE001 — never echo the response body
        print(f"Token exchange failed: {type(error).__name__}")
        return 1
    if not refresh_token:
        print("Google returned no refresh token. Remove the app at myaccount.google.com/permissions and run again.")
        return 1

    values = {
        "Storage__Provider": "GoogleDrive",
        "GoogleDrive__ClientId": client_id,
        "GoogleDrive__ClientSecret": client_secret,
        "GoogleDrive__RefreshToken": refresh_token,
    }
    lines = env_path.read_text().splitlines() if env_path.exists() else []
    lines = [line for line in lines if line.split("=", 1)[0] not in values]
    lines += [f"{key}={value}" for key, value in values.items()]
    env_path.write_text("\n".join(lines) + "\n")
    env_path.chmod(0o600)
    print(f"Saved 4 settings to {env_path}. Copy the same 4 into the Render environment. Nothing was printed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
