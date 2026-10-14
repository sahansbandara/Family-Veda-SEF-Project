START TRANSACTION;


DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260928010813_20260928_S4_DoctorAssignmentConstraints') THEN
    DO $$
    BEGIN
        IF EXISTS (
            SELECT 1 FROM family_doctor_assignments
            WHERE is_primary = TRUE AND ended_at IS NULL
            GROUP BY family_id HAVING COUNT(*) > 1
        ) THEN
            RAISE EXCEPTION 'Cannot add doctor constraints: a family has multiple active primary assignments';
        END IF;
        IF EXISTS (
            SELECT 1 FROM family_doctor_requests
            WHERE status = 'Pending'
            GROUP BY family_id HAVING COUNT(*) > 1
        ) THEN
            RAISE EXCEPTION 'Cannot add doctor constraints: a family has multiple pending requests';
        END IF;
    END $$;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260928010813_20260928_S4_DoctorAssignmentConstraints') THEN
    DROP INDEX ix_family_doctor_assignments_family_id_doctor_id;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260928010813_20260928_S4_DoctorAssignmentConstraints') THEN
    CREATE UNIQUE INDEX ux_family_doctor_requests_pending ON family_doctor_requests (family_id) WHERE status = 'Pending';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260928010813_20260928_S4_DoctorAssignmentConstraints') THEN
    CREATE INDEX ix_family_doctor_assignments_family_id_doctor_id ON family_doctor_assignments (family_id, doctor_id);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260928010813_20260928_S4_DoctorAssignmentConstraints') THEN
    CREATE UNIQUE INDEX ux_family_doctor_assignments_active_primary ON family_doctor_assignments (family_id) WHERE is_primary = TRUE AND ended_at IS NULL;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "migration_id" = '20260928010813_20260928_S4_DoctorAssignmentConstraints') THEN
    INSERT INTO "__EFMigrationsHistory" (migration_id, product_version)
    VALUES ('20260928010813_20260928_S4_DoctorAssignmentConstraints', '8.0.20');
    END IF;
END $EF$;
COMMIT;
