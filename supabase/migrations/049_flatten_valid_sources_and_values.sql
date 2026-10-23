-- ============================================================================
-- 049: flatten_checks_from_job writes values the live checks table accepts
--
-- Running 048 failed on the first cheque:
--   checks_amount_source_check: amount_source must be ocr | ai | hybrid | manual
-- but the extractor records the engine ("gemini", "tesseract", "numarkdown")
-- or "none". It also wrote whole field objects ({"value":null,...}) into text
-- columns, because COALESCE(_ext->'payee'->>'value', _ext->>'payee') falls
-- back to the object's text when the value is null.
--
-- Two helpers fix both, the function is redefined with them, and the backfill
-- runs again. Columns, index and the string-unwrap from 047/048 are kept.
-- Idempotent.
-- ============================================================================

ALTER TABLE public.checks ADD COLUMN IF NOT EXISTS job_id   TEXT;
ALTER TABLE public.checks ADD COLUMN IF NOT EXISTS check_id TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS checks_job_check_uidx ON public.checks (job_id, check_id);

-- Engine name -> the source vocabulary the CHECK constraints allow. Unknown or
-- "none" -> NULL, which every *_source constraint accepts.
CREATE OR REPLACE FUNCTION public.kyriq_check_source(src TEXT)
RETURNS TEXT LANGUAGE sql IMMUTABLE AS $$
    SELECT CASE lower(coalesce(src, ''))
        WHEN 'ocr'        THEN 'ocr'
        WHEN 'tesseract'  THEN 'ocr'
        WHEN 'ai'         THEN 'ai'
        WHEN 'gemini'     THEN 'ai'
        WHEN 'numarkdown' THEN 'ai'
        WHEN 'openai'     THEN 'ai'
        WHEN 'gemini-openai-backup' THEN 'ai'
        WHEN 'hybrid'     THEN 'hybrid'
        WHEN 'manual'     THEN 'manual'
        ELSE NULL
    END
$$;

-- A field is either {"value": x, "confidence": n, "source": s} or a bare value.
-- Return the value as text, never the object.
CREATE OR REPLACE FUNCTION public.kyriq_field_value(f JSONB)
RETURNS TEXT LANGUAGE sql IMMUTABLE AS $$
    SELECT CASE
        WHEN f IS NULL OR jsonb_typeof(f) = 'null' THEN NULL
        WHEN jsonb_typeof(f) = 'object' THEN NULLIF(f->>'value', '')
        ELSE NULLIF(f #>> '{}', '')
    END
$$;

-- Confidence columns are numeric(3,2), max 9.99. Engines report either 0-1 or
-- 0-100; normalise to 0-1 so a 95 cannot overflow the column.
CREATE OR REPLACE FUNCTION public.kyriq_confidence(f JSONB)
RETURNS NUMERIC LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE c NUMERIC;
BEGIN
    BEGIN
        c := (f->>'confidence')::NUMERIC;
    EXCEPTION WHEN OTHERS THEN
        RETURN NULL;
    END;
    IF c IS NULL THEN RETURN NULL; END IF;
    IF c > 1 THEN c := c / 100.0; END IF;
    RETURN round(greatest(0, least(1, c)), 2);
END;
$$;

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
    -- checks.tenant_id is NOT NULL with a foreign key to tenants.
    IF _job.tenant_id IS NULL THEN RETURN; END IF;
    IF _job.checks_data IS NULL OR _job.checks_data::TEXT IN ('', '[]') THEN RETURN; END IF;

    BEGIN
        _checks_array := _job.checks_data::JSONB;
        -- json.dumps() into a JSONB column stores a string holding the array.
        IF jsonb_typeof(_checks_array) = 'string' THEN
            _checks_array := (_checks_array #>> '{}')::JSONB;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'flatten %: checks_data is not JSON (%)', p_job_id, SQLERRM;
        RETURN;
    END;
    IF jsonb_typeof(_checks_array) <> 'array' THEN RETURN; END IF;

    FOR _check IN SELECT jsonb_array_elements(_checks_array)
    LOOP
        _ext := COALESCE(_check->'extraction', '{}'::JSONB);

        BEGIN
            _amount_num := NULLIF(regexp_replace(COALESCE(public.kyriq_field_value(_ext->'amount'), ''), '[^0-9.]', '', 'g'), '')::NUMERIC;
        EXCEPTION WHEN OTHERS THEN
            _amount_num := NULL;
        END;
        BEGIN
            _date_val := public.kyriq_field_value(_ext->'checkDate')::DATE;
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
            public.kyriq_field_value(_ext->'checkNumber'),
            public.kyriq_confidence(_ext->'checkNumber'), public.kyriq_check_source(_ext->'checkNumber'->>'source'),
            public.kyriq_field_value(_ext->'payee'),
            public.kyriq_confidence(_ext->'payee'), public.kyriq_check_source(_ext->'payee'->>'source'),
            _amount_num,
            public.kyriq_confidence(_ext->'amount'), public.kyriq_check_source(_ext->'amount'->>'source'),
            _date_val,
            public.kyriq_confidence(_ext->'checkDate'), public.kyriq_check_source(_ext->'checkDate'->>'source'),
            public.kyriq_field_value(_ext->'bankName'),
            public.kyriq_confidence(_ext->'bankName'), public.kyriq_check_source(_ext->'bankName'->>'source'),
            public.kyriq_field_value(_ext->'memo'),
            -- Mean of the four main fields' confidence, already 0-1.
            round((
                COALESCE(public.kyriq_confidence(_ext->'checkNumber'), 0) +
                COALESCE(public.kyriq_confidence(_ext->'amount'), 0) +
                COALESCE(public.kyriq_confidence(_ext->'checkDate'), 0) +
                COALESCE(public.kyriq_confidence(_ext->'payee'), 0)
            ) / 4.0, 2),
            -- processing_method allows only ocr | ai | hybrid.
            COALESCE(NULLIF(public.kyriq_check_source(_ext->>'source'), 'manual'), 'hybrid'),
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
