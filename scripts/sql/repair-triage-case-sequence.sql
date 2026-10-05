-- Owner: S4. Operational repair only: no rows or schema definitions change.
-- psql -X -v ON_ERROR_STOP=1 -f this-file.sql (check only)
-- Add -v apply=true to repair. Run during a short quiet window; all case
-- numbers must be allocated by INSERT, not independent nextval callers.
\set ON_ERROR_STOP on
\if :{?apply}
\else
\set apply false
\endif
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '15s';
SELECT set_config('family_veda.sequence_repair_apply', :'apply', true) AS apply_mode \gset
\if :apply
LOCK TABLE public.triage_cases IN SHARE ROW EXCLUSIVE MODE;
\else
LOCK TABLE public.triage_cases IN ACCESS SHARE MODE;
\endif
DO $repair$
DECLARE
    sequence_oid regclass;
    sequence_increment bigint;
    sequence_max bigint;
    sequence_cache bigint;
    sequence_cycles boolean;
    maximum_case bigint;
    sequence_last bigint;
    sequence_called boolean;
    next_value numeric;
    target_value numeric;
    apply_repair boolean := current_setting('family_veda.sequence_repair_apply')::boolean;
    result text := 'healthy';
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_attribute
        WHERE attrelid = 'public.triage_cases'::regclass
          AND attname = 'case_number' AND attidentity IN ('a', 'd')
          AND NOT attisdropped
    ) THEN
        RAISE EXCEPTION 'case_number must be an identity column';
    END IF;
    sequence_oid := pg_get_serial_sequence('public.triage_cases', 'case_number')::regclass;
    IF sequence_oid IS NULL THEN
        RAISE EXCEPTION 'case_number identity sequence was not found';
    END IF;
    SELECT seqincrement, seqmax, seqcache, seqcycle
      INTO sequence_increment, sequence_max, sequence_cache, sequence_cycles
      FROM pg_sequence WHERE seqrelid = sequence_oid;
    -- Cached allocations in other sessions could survive a restart. Fail
    -- closed for anything other than the application's default identity.
    IF sequence_increment IS DISTINCT FROM 1 OR sequence_cache IS DISTINCT FROM 1
       OR sequence_cycles IS DISTINCT FROM false THEN
        RAISE EXCEPTION 'Unsupported identity sequence configuration';
    END IF;
    SELECT max(case_number) INTO maximum_case FROM public.triage_cases;
    EXECUTE format('SELECT last_value, is_called FROM %s', sequence_oid)
      INTO sequence_last, sequence_called;
    -- numeric addition avoids overflowing bigint before the boundary check.
    next_value := sequence_last::numeric + CASE WHEN sequence_called THEN 1 ELSE 0 END;
    IF next_value > sequence_max OR next_value > 9223372036854775807::numeric THEN
        RAISE EXCEPTION 'Identity sequence is exhausted; repair cannot continue';
    END IF;
    IF maximum_case IS NULL THEN
        result := 'empty_no_change';
    ELSIF next_value <= maximum_case THEN
        target_value := maximum_case::numeric + 1;
        IF target_value > sequence_max OR target_value > 9223372036854775807::numeric THEN
            RAISE EXCEPTION 'case_number is at the sequence limit; repair cannot continue';
        END IF;
        result := 'repair_required';
        IF apply_repair THEN
            -- Transactional RESTART, unlike nontransactional setval. Never
            -- rewind: this branch requires target_value > current next_value.
            EXECUTE format('ALTER SEQUENCE %s RESTART WITH %s', sequence_oid, target_value);
            result := 'repaired';
        END IF;
    END IF;
    RAISE NOTICE '%', json_build_object(
        'status', result, 'apply', apply_repair,
        'maximum_case_number', maximum_case, 'next_value_before', next_value,
        'next_value_after', CASE WHEN result = 'repaired' THEN target_value ELSE next_value END
    );
END
$repair$;
COMMIT;
