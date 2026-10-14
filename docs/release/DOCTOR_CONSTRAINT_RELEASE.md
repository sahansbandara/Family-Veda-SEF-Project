# Doctor assignment constraint release

The user reported that `20260927200627_20260928_S4_ThreePortalFeatures` was applied to Neon and its migration lock released on 2026-09-28. Capture the database history below before applying this follow-up. The SQL file in this directory is idempotent and was run twice successfully against disposable PostgreSQL 16 after the first two migrations. Its SHA-256 is `5741463041a945f40d815ec8822ea3946c7009f3e2a3d2e1dea98caadc9ee301`.

## Before applying

1. Merge the compatible backend code through the group review process. Coordinate a short migration lock with the group and create a Neon branch backup from the production branch. Keep the Neon connection string in the terminal, never in chat or Markdown.
2. Verify the existing migration history. The column is `migration_id` because the database uses snake-case naming:

   ```sh
   psql "$NEON_DATABASE_URL" -v ON_ERROR_STOP=1 -c 'SELECT migration_id FROM "__EFMigrationsHistory" ORDER BY migration_id;'
   ```

   Both `InitialCreate` and `ThreePortalFeatures` must appear.
3. Check for existing conflicts. Both queries must return zero rows. Do not delete or silently alter any row to make the migration pass; investigate with the family owner first.

   ```sh
   psql "$NEON_DATABASE_URL" -v ON_ERROR_STOP=1 -c 'SELECT family_id, COUNT(*) FROM family_doctor_assignments WHERE is_primary = TRUE AND ended_at IS NULL GROUP BY family_id HAVING COUNT(*) > 1;'
   psql "$NEON_DATABASE_URL" -v ON_ERROR_STOP=1 -c "SELECT family_id, COUNT(*) FROM family_doctor_requests WHERE status = 'Pending' GROUP BY family_id HAVING COUNT(*) > 1;"
   ```

## Apply and verify

```sh
shasum -a 256 docs/release/20260928_doctor_constraints.sql
psql "$NEON_DATABASE_URL" -v ON_ERROR_STOP=1 -f docs/release/20260928_doctor_constraints.sql
psql "$NEON_DATABASE_URL" -v ON_ERROR_STOP=1 -c 'SELECT migration_id FROM "__EFMigrationsHistory" ORDER BY migration_id;'
```

The history must list `20260928010813_20260928_S4_DoctorAssignmentConstraints` once. Deploy the compatible backend revision on Render, then the matching web revision on Vercel. Run synthetic-role smoke checks for doctor requests, appointment booking, notifications, dashboard activity, and privacy. Announce the migration lock release after verification.

## Recovery

The migration aborts before changing schema if existing data has multiple active primary doctors or multiple pending requests for a family. It does not resolve those data conflicts automatically. After any repeated doctor assignment period is created, the `Down` migration deliberately refuses to restore the old pairwise unique index, because that would erase or reject history. Use the Neon branch backup for disaster recovery and roll forward with a reviewed correction. Do not drop history rows to force a downgrade.
