#!/usr/bin/env python3
"""Check/repair the triage identity using psql; never echo database credentials.

Defaults to repo-root .env and check-only. Pass --apply for the approved repair.
No packages are installed, no migrations run, and no case rows are modified.
"""

import argparse
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys


def connection_parts(raw: str) -> dict[str, str]:
    """Parse Npgsql key/value pairs, including quoted semicolons/quotes."""
    parts: dict[str, str] = {}
    index = 0
    while index < len(raw):
        while index < len(raw) and (raw[index].isspace() or raw[index] == ';'):
            index += 1
        if index == len(raw):
            break
        separator = raw.find('=', index)
        if separator < 0:
            raise ValueError('Invalid connection setting')
        key = ''.join(raw[index:separator].lower().split())
        index = separator + 1
        while index < len(raw) and raw[index].isspace():
            index += 1
        if index < len(raw) and raw[index] in ('"', "'"):
            quote = raw[index]
            index += 1
            value = ''
            while index < len(raw):
                char = raw[index]
                index += 1
                if char == quote:
                    if index < len(raw) and raw[index] == quote:
                        value += quote
                        index += 1
                    else:
                        break
                else:
                    value += char
            else:
                raise ValueError('Unterminated connection setting')
            while index < len(raw) and raw[index].isspace():
                index += 1
            if index < len(raw) and raw[index] != ';':
                raise ValueError('Invalid quoted connection setting')
        else:
            end = raw.find(';', index)
            if end < 0:
                end = len(raw)
            value = raw[index:end].strip()
            index = end
        parts[key] = value
    return parts


def database_environment(env_path: Path) -> dict[str, str]:
    raw = os.environ.get('ConnectionStrings__DefaultConnection')
    if not raw:
        for line in env_path.read_text().splitlines():
            key, separator, value = line.partition('=')
            if separator and key.strip() == 'ConnectionStrings__DefaultConnection':
                raw = value.strip()
                if len(raw) >= 2 and raw[0] in ('"', "'") and raw[-1] == raw[0]:
                    raw = raw[1:-1]
                break
    if not raw:
        raise ValueError('Missing connection setting')
    parts = connection_parts(raw)
    # Remove inherited PG routing/options so the .env target is authoritative.
    environment = {key: value for key, value in os.environ.items() if not key.startswith('PG')}
    mappings = {
        'PGHOST': ('host', 'server'), 'PGPORT': ('port',),
        'PGDATABASE': ('database',), 'PGUSER': ('username', 'userid', 'user'),
        'PGPASSWORD': ('password',),
    }
    for target, aliases in mappings.items():
        value = next((parts[alias] for alias in aliases if alias in parts), None)
        if value is None and target != 'PGPORT':
            raise ValueError('Incomplete connection setting')
        if value is not None:
            environment[target] = value
    ssl_mode = parts.get('sslmode', 'prefer').lower().replace('-', '')
    allowed = {'disable', 'allow', 'prefer', 'require', 'verifyca', 'verifyfull'}
    if ssl_mode not in allowed:
        raise ValueError('Unsupported SSL mode')
    environment['PGSSLMODE'] = {'verifyca': 'verify-ca', 'verifyfull': 'verify-full'}.get(ssl_mode, ssl_mode)
    environment['PGCONNECT_TIMEOUT'] = '10'
    environment['PGAPPNAME'] = 'family-veda-triage-sequence-repair'
    if 'rootcertificate' in parts:
        environment['PGSSLROOTCERT'] = parts['rootcertificate']
    return environment


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--env-file', type=Path, default=Path(__file__).resolve().parents[1] / '.env')
    parser.add_argument('--apply', action='store_true', help='repair only if the next number overlaps existing cases')
    args = parser.parse_args()
    executable = shutil.which('psql')
    if executable is None:
        print('psql is required; no database operation was run.', file=sys.stderr)
        return 2
    try:
        environment = database_environment(args.env_file)
        sql_file = Path(__file__).resolve().parent / 'sql' / 'repair-triage-case-sequence.sql'
        result = subprocess.run(
            [executable, '-X', '-w', '-q', '-v', 'ON_ERROR_STOP=1',
             '-v', f'apply={str(args.apply).lower()}', '-f', str(sql_file)],
            env=environment, capture_output=True, text=True, timeout=45, check=False,
        )
    except (OSError, ValueError, subprocess.TimeoutExpired):
        print('Repair could not complete (configuration, connection, or timeout). Credentials withheld.', file=sys.stderr)
        return 1
    if result.returncode:
        # psql errors can include connection details or SQL context; do not echo.
        print('Database check/repair failed; transaction was not confirmed. Credentials withheld.', file=sys.stderr)
        return 1
    for line in result.stderr.splitlines():
        if 'NOTICE:' in line and '{' in line:
            try:
                report = json.loads(line[line.index('{'):])
                if report.get('status') in {'healthy', 'empty_no_change', 'repair_required', 'repaired'}:
                    print(json.dumps(report))
                    return 0
            except (ValueError, TypeError):
                pass
    print('Database command completed without a recognized status; verify before retrying.', file=sys.stderr)
    return 1


if __name__ == '__main__':
    raise SystemExit(main())
