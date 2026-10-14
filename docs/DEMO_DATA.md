# Demo data — synthetic accounts for the three portals

RULE 7: every row here is synthetic. Emails use the reserved `example.invalid` domain, and names are invented.

Seeding runs at API start-up only when `Seed__Enabled=true`. Every account uses the `Seed__DefaultPassword` value, which is at least 12 characters and is never committed.
The base seed (`DatabaseInitializer`) creates the core accounts. `DemoDataSeeder` then adds the dashboard data once per database; it checks for `demo-tharushi@example.invalid` so it never runs twice.
It also runs on a database that already has the base seed, such as the hosted Neon database.

## Accounts

| Email | Portal | Demonstrates |
|---|---|---|
| `demo-head@example.invalid` | Family Head — Nimal Perera | Family Head dashboard, 2 pending join requests, minors, family doctor, Family Code `FV-DEMO01` |
| `demo-member@example.invalid` | Adult Member — Amaya Perera | Adult dashboard; private CBC (1 value below range); open case; approved guidance; private appointments |
| `demo-tharushi@example.invalid` | Adult Member — Tharushi Perera | Second adult; Lipid Panel report |
| `demo-doctor@example.invalid` | Doctor — Dr. Synthetic Perera (verified) | Doctor dashboard: 3 appointments today, 3 pending approvals (1 priority), 3 assigned families, 1 family request |
| `demo-doctor-silva@example.invalid`, `demo-doctor-fernando@example.invalid` | Verified doctors | Doctor directory / discovery (Kandy, Galle; Tamil / Sinhala) |
| `demo-doctor-suspended@example.invalid` | Suspended doctor | Must never appear in the directory or receive access |
| `demo-pending@example.invalid` | Pending doctor | Verification queue |
| `demo-admin@example.invalid` | Clinic admin | Doctor and Family Head verification |
| `demo-silva@example.invalid`, `demo-fernando@example.invalid` | Family Heads of assigned families | Doctor's "My Families" table |
| `demo-wijesinghe@example.invalid` | Family Head | Pending family-doctor request |
| `demo-ruwan@example.invalid`, `demo-shalini@example.invalid` | Adults without a family | Pending join requests to the Perera family |

## Data per feature

| Feature | Seeded rows |
|---|---|
| Appointments | Today 09:00 Completed, 10:30 Confirmed and 14:00 Requested; upcoming Confirmed and Requested; past Completed |
| Lab reports | Hemoglobin below range, values within and above range, one value with no range (`Reference range unavailable`), and one unconfirmed extraction for a minor |
| Vitals | 7 monthly readings: blood pressure and weight (Nimal), blood pressure (Amaya), weight (Kasun) |
| Triage | Pending review (routine and priority), claimed, and 2 approved with safe guidance. All carry a case grant and agent traces for the doctor view |
| Privacy | Head sees self and minors only. Adults' reports, cases and appointments never reach the Head dashboard (`PortalDashboardMockupFieldsTests`) |

The approved guidance text contains no diagnosis, no drug and no dosing, and defers to in-person care and 1990 (RULES 1, 6, 9, 10).

## Reset locally

```bash
psql -c "drop database fv with (force)" -c "create database fv"
ASPNETCORE_ENVIRONMENT=Development Database__MigrateOnStartup=true Seed__Enabled=true \
  Seed__DefaultPassword='<12+ chars>' dotnet run --project backend/src/Api
```

Screenshots: `docs/evidence/2026-09-28/dashboard-{family-head,adult-member,doctor}.png`.
