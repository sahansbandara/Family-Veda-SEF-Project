#!/usr/bin/env bash
# Phase 1b — reset and reseed a LOCAL synthetic demo database (agent/TODO.md "Phase 1b").
# RULE 7: this script only ever runs against a local database and only ever writes synthetic rows.
#
# SAFETY: refuses to run unless the target host resolves to localhost/127.0.0.1/::1 — it never
# touches the hosted Neon/Render database. Never hardcodes a password: it reads
# ConnectionStrings__DefaultConnection and Seed__DefaultPassword from the environment, or from an
# optional .env file passed as $1.
#
# Usage:
#   scripts/reset-demo-db.sh [path-to-local-.env]
#
# Requires: psql, dotnet (net8.0 SDK), and Seed__DefaultPassword to be at least 12 characters
# (see docs/DEMO_DATA.md for where the shared demo password is configured).
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${1:-}"

if [[ -n "$ENV_FILE" ]]; then
  [[ -f "$ENV_FILE" ]] || { echo "env file not found: $ENV_FILE" >&2; exit 1; }
  # shellcheck disable=SC1090
  set -a; source "$ENV_FILE"; set +a
fi

raw="${ConnectionStrings__DefaultConnection:-}"
[[ -n "$raw" ]] || { echo "ConnectionStrings__DefaultConnection is not set (env or .env file)." >&2; exit 1; }

host=""
dbname=""
IFS=';' read -ra parts <<< "$raw"
for p in "${parts[@]}"; do
  k="${p%%=*}"; v="${p#*=}"
  k="$(echo "$k" | tr '[:upper:]' '[:lower:]' | tr -d ' ')"
  case "$k" in
    host|server) host="$v" ;;
    database) dbname="$v" ;;
  esac
done

case "$host" in
  localhost|127.0.0.1|::1) ;;
  *)
    echo "REFUSED: connection host '$host' is not localhost/127.0.0.1/::1." >&2
    echo "This script only resets a LOCAL database — never the hosted Neon/Render database." >&2
    exit 1
    ;;
esac
[[ -n "$dbname" ]] || { echo "Could not read Database from the connection string." >&2; exit 1; }

password="${Seed__DefaultPassword:-}"
if [[ -z "$password" || "${#password}" -lt 12 ]]; then
  echo "Seed__DefaultPassword must be set (env or .env file) and at least 12 characters." >&2
  exit 1
fi

echo "Target: local database '$dbname' on '$host'."
echo "Dropping and recreating '$dbname' ..."
psql -h "$host" -d postgres -v ON_ERROR_STOP=1 -c "DROP DATABASE IF EXISTS \"$dbname\" WITH (FORCE);"
psql -h "$host" -d postgres -v ON_ERROR_STOP=1 -c "CREATE DATABASE \"$dbname\";"

echo "Applying migrations and reseeding synthetic demo data ..."
ASPNETCORE_ENVIRONMENT=Development \
  ConnectionStrings__DefaultConnection="$raw" \
  Database__MigrateOnStartup=true \
  Seed__Enabled=true \
  Seed__DefaultPassword="$password" \
  timeout 120 dotnet run --project "$REPO_ROOT/backend/src/Api" --no-launch-profile &
API_PID=$!

# Give the API time to run migrations and seed, then stop it — this script only resets data,
# it does not leave a server running.
sleep 45
kill "$API_PID" 2>/dev/null || true
wait "$API_PID" 2>/dev/null || true

echo "Done. Local database '$dbname' reset and reseeded (base seed + DemoDataSeeder + Phase 1b)."
echo "See docs/TESTING.md for the full list of demo accounts."
