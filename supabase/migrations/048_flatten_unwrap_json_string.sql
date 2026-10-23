-- ============================================================================
-- 048: flatten_checks_from_job unwraps double-encoded checks_data
--
-- The backend writes checks_data with json.dumps() into a JSONB column, so the
-- stored value is a JSON *string* that contains the array, not the array. 047's
-- function saw jsonb_typeof = 'string' and returned without inserting, so the
-- backfill left checks empty. This unwraps one level of string encoding, then
-- re-runs the backfill. Everything else is unchanged from 047. Idempotent.
-- ============================================================================

ALTER TABLE public.checks ADD COLUMN IF NOT EXISTS job_id   TEXT;
ALTER TABLE public.checks ADD COLUMN IF NOT EXISTS check_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS checks_job_check_uidx
    ON public.checks (job_id, check_id);

CREATE OR REPLACE FUNCTION public.flatten_checks_from_job(p_job_id TEXT)
RETURNS void AS $$
DECLARE
    _job          RECORD;
    _check        JSONB;
    _ext          JSONB;
    _checks_array JSONB;
    _amount_num   NUMERIC;
    _date_val     DATE;
    _url          TEXT;
BEGIN
    SELECT * INTO _job FROM public.check_jobs WHERE job_id = p_job_id;
    IF NOT FOUND THEN RETURN; END IF;
    -- checks.tenant_id is NOT NULL with a foreign key to tenants: an ownerless
    -- job cannot be flattened, and must not be stamped with a fake tenant.
    IF _job.tenant_id IS NULL THEN RETURN; END IF;
    IF _job.checks_data IS NULL OR _job.checks_data::TEXT IN ('', '[]') THEN RETURN; END IF;

    BEGIN
        _checks_array := _job.checks_data::JSONB;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'flatten %: checks_data is not JSON (%)', p_job_id, SQLERRM;
        RETURN;
    END;
    -- json.dumps() into a JSONB column stores a string holding the array.
    IF jsonb_typeof(_checks_array) = 'string' THEN
        BEGIN
            _checks_array := (_checks_array #>> '{}')::JSONB;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'flatten %: checks_data string is not JSON (%)', p_job_id, SQLERRM;
            RETURN;
        END;
    END IF;
    IF jsonb_typeof(_checks_array) <> 'array' THEN RETURN; END IF;

    FOR _check IN SELECT jsonb_array_elements(_checks_array)
    LOOP
        _ext := COALESCE(_check->'extraction', '{}'::JSONB);

        BEGIN
            _amount_num := NULLIF(regexp_replace(COALESCE(_ext->'amount'->>'value', _ext->>'amount', ''), '[^0-9.]', '', 'g'), '')::NUMERIC;
        EXCEPTION WHEN OTHERS THEN
            _amount_num := NULL;
        END;
        BEGIN
            _date_val := COALESCE(_ext->'checkDate'->>'value', _ext->>'checkDate')::DATE;
        EXCEPTION WHEN OTHERS THEN
            _date_val := NULL;
        END;

        -- file_url is NOT NULL; fall back to the image's Storage path.
        _url := COALESCE(NULLIF(_check->>'image_url', ''),
                         'jobs/' || p_job_id || '/images/' || (_check->>'check_id') || '.png');

        INSERT INTO public.checks (
            tenant_id, user_id, job_id, check_id, batch_id,
            file_url, file_type,
            check_number, check_number_confidence, check_number_source,
            payee, payee_confidence, payee_source,
            amount, amount_confidence, amount_source,
            check_date, check_date_confidence, check_date_source,
            bank_name, bank_name_confidence, bank_name_source,
            memo, confidence_summary, processing_method, processed_at
        ) VALUES (
            _job.tenant_id, _job.user_id, p_job_id, _check->>'check_id', _job.batch_id,
            _url, 'image/png',
            COALESCE(_ext->'checkNumber'->>'value', _ext->>'checkNumber'),
            (_ext->'checkNumber'->>'confidence')::NUMERIC, _ext->'checkNumber'->>'source',
            COALESCE(_ext->'payee'->>'value', _ext->>'payee'),
            (_ext->'payee'->>'confidence')::NUMERIC, _ext->'payee'->>'source',
            _amount_num,
            (_ext->'amount'->>'confidence')::NUMERIC, _ext->'amount'->>'source',
            _date_val,
            (_ext->'checkDate'->>'confidence')::NUMERIC, _ext->'checkDate'->>'source',
            COALESCE(_ext->'bankName'->>'value', _ext->>'bankName'),
            (_ext->'bankName'->>'confidence')::NUMERIC, _ext->'bankName'->>'source',
            COALESCE(_ext->'memo'->>'value', _ext->>'memo'),
            GREATEST(
                COALESCE((_ext->'checkNumber'->>'confidence')::NUMERIC, 0),
                COALESCE((_ext->'amount'->>'confidence')::NUMERIC, 0),
                COALESCE((_ext->'checkDate'->>'confidence')::NUMERIC, 0),
                COALESCE((_ext->'payee'->>'confidence')::NUMERIC, 0)
            ) / 4.0,
            COALESCE(_ext->>'source', 'hybrid'),
            now()
        )
        ON CONFLICT (job_id, check_id) DO UPDATE SET
            file_url                 = EXCLUDED.file_url,
            batch_id                 = COALESCE(EXCLUDED.batch_id, public.checks.batch_id),
            check_number             = EXCLUDED.check_number,
            check_number_confidence  = EXCLUDED.check_number_confidence,
            check_number_source      = EXCLUDED.check_number_source,
            payee                    = EXCLUDED.payee,
            payee_confidence         = EXCLUDED.payee_confidence,
            payee_source             = EXCLUDED.payee_source,
            amount                   = EXCLUDED.amount,
            amount_confidence        = EXCLUDED.amount_confidence,
            amount_source            = EXCLUDED.amount_source,
            check_date               = EXCLUDED.check_date,
            check_date_confidence    = EXCLUDED.check_date_confidence,
            check_date_source        = EXCLUDED.check_date_source,
            bank_name                = EXCLUDED.bank_name,
            bank_name_confidence     = EXCLUDED.bank_name_confidence,
            bank_name_source         = EXCLUDED.bank_name_source,
            memo                     = EXCLUDED.memo,
            confidence_summary       = EXCLUDED.confidence_summary,
            processing_method        = EXCLUDED.processing_method,
            processed_at             = now(),
            updated_at               = now();
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Backfill every finished job that has an owner.
SELECT public.flatten_checks_from_job(job_id)
FROM public.check_jobs
WHERE status = 'complete' AND tenant_id IS NOT NULL;
