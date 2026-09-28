#!/usr/bin/env zsh
# Owner: S4 · W.M.S.S.B. Wasala (IT24100559)
# Backs up Neon, applies the idempotent EF Core migration script, and verifies it.
# Reads ConnectionStrings__DefaultConnection from the repo-root .env; never prints it.
# Usage: scripts/apply-neon-migration.sh <path-to-.env> <path-to-migration.sql>
set -euo pipefail

ENV_FILE="${1:?path to .env}"
SQL_FILE="${2:?path to migration.sql}"

raw=$(grep -E '^ConnectionStrings__DefaultConnection=' "$ENV_FILE" | head -1 | cut -d= -f2- | sed -e "s/^[\"']//" -e "s/[\"']$//")
[[ -n "$raw" ]] || { echo "ConnectionStrings__DefaultConnection not found in $ENV_FILE"; exit 1; }

IFS=';' read -rA parts <<< "$raw"
for p in "${parts[@]}"; do
  k="${p%%=*}"; v="${p#*=}"
  k=$(echo "$k" | tr '[:upper:]' '[:lower:]' | tr -d ' ')
  case "$k" in
    host|server) export PGHOST="$v" ;;
    port) export PGPORT="$v" ;;
    database) export PGDATABASE="$v" ;;
    username|userid|user) export PGUSER="$v" ;;
    password) export PGPASSWORD="$v" ;;
  esac
done
export PGSSLMODE=require

echo "Before:"
psql -tAc 'select migration_id from "__EFMigrationsHistory"' 2>/dev/null || echo "  (no migration history table yet)"

backup="neon-backup-$(date +%Y%m%d-%H%M%S).sql"
echo "Backing up to $backup ..."
pg_dump --no-owner --no-privileges -f "$backup"

echo "Applying migration ..."
psql -v ON_ERROR_STOP=1 -q -f "$SQL_FILE"

echo "After:"
psql -tAc 'select migration_id from "__EFMigrationsHistory"'
psql -tAc "select 'tables: ' || count(*) from information_schema.tables where table_schema='public' and table_name<>'__EFMigrationsHistory'"
psql -tAc "select 'families without code: ' || count(*) from families where family_code is null"
echo "Done. Backup file: $backup (do not commit it)."
