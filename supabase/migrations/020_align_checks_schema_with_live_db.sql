-- ============================================================================
-- Migration 020: Align checks table schema with live DB
-- Fixes backend flatten_checks_from_job to work with actual live DB columns
-- ============================================================================

-- The live DB has a simpler schema than migrations 001/018 defined
-- This migration updates the flatten_checks_from_job function to only insert
-- columns that actually exist in the live checks table

CREATE OR REPLACE FUNCTION flatten_checks_from_job(p_job_id TEXT)
RETURNS void AS $$
DECLARE
    _job RECORD;
    _check JSONB;
    _ext JSONB;
    _amount_text TEXT;
    _amount_num NUMERIC;
    _date_text TEXT;
    _date_val DATE;
    _checks_array JSONB;
BEGIN
    SELECT * INTO _job FROM check_jobs WHERE job_id = p_job_id;
    IF NOT FOUND THEN RETURN; END IF;

    -- Parse checks_data from TEXT/JSONB to JSONB array
    BEGIN
        IF _job.checks_data IS NULL OR _job.checks_data = '' THEN
            RETURN;
        END IF;
        
        _checks_array := _job.checks_data::JSONB;
        
        IF jsonb_typeof(_checks_array) != 'array' THEN
            RAISE NOTICE 'checks_data is not an array for job %', p_job_id;
            RETURN;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Failed to parse checks_data for job %: %', p_job_id, SQLERRM;
        RETURN;
    END;

    -- Iterate over each check in the array
    FOR _check IN SELECT jsonb_array_elements(_checks_array)
    LOOP
        _ext := _check->'extraction';

        -- Parse amount
        _amount_text := COALESCE(
            _ext->'amount'->>'value',
            _ext->>'amount'
        );
        BEGIN
            _amount_num := regexp_replace(COALESCE(_amount_text,''), '[^0-9.]', '', 'g')::NUMERIC;
        EXCEPTION WHEN OTHERS THEN
            _amount_num := NULL;
        END;

        -- Parse date
        _date_text := COALESCE(
            _ext->'checkDate'->>'value',
            _ext->>'checkDate'
        );
        BEGIN
            _date_val := _date_text::DATE;
        EXCEPTION WHEN OTHERS THEN
            _date_val := NULL;
        END;

        -- Insert only columns that exist in live DB
        INSERT INTO checks (
            tenant_id,
            file_url,
            file_type,
            check_number,
            check_number_confidence,
            check_number_source,
            payee,
            payee_confidence,
            payee_source,
            amount,
            amount_confidence,
            amount_source,
            check_date,
            check_date_confidence,
            check_date_source,
            bank_name,
            bank_name_confidence,
            bank_name_source,
            memo,
            status,
            confidence_summary,
            processing_method,
            realm_id,
            check_id
        ) VALUES (
            COALESCE(_job.tenant_id, '00000000-0000-0000-0000-000000000000'::UUID),
            _check->>'image_url',
            'image/png',
            COALESCE(_ext->'checkNumber'->>'value', _ext->>'checkNumber'),
            (_ext->'checkNumber'->>'confidence')::NUMERIC,
            _ext->'checkNumber'->>'source',
            COALESCE(_ext->'payee'->>'value', _ext->>'payee'),
            (_ext->'payee'->>'confidence')::NUMERIC,
            _ext->'payee'->>'source',
            _amount_num,
            (_ext->'amount'->>'confidence')::NUMERIC,
            _ext->'amount'->>'source',
            _date_val,
            (_ext->'checkDate'->>'confidence')::NUMERIC,
            _ext->'checkDate'->>'source',
            COALESCE(_ext->'bankName'->>'value', _ext->>'bankName'),
            (_ext->'bankName'->>'confidence')::NUMERIC,
            _ext->'bankName'->>'source',
            COALESCE(_ext->'memo'->>'value', _ext->>'memo'),
            'pending_review',
            GREATEST(
                COALESCE((_ext->'checkNumber'->>'confidence')::NUMERIC, 0),
                COALESCE((_ext->'amount'->>'confidence')::NUMERIC, 0),
                COALESCE((_ext->'checkDate'->>'confidence')::NUMERIC, 0),
                COALESCE((_ext->'payee'->>'confidence')::NUMERIC, 0)
            ) / 4.0,
            CASE 
                WHEN _ext->>'source' IS NOT NULL THEN _ext->>'source'
                ELSE 'hybrid'
            END,
            NULL,
            _check->>'check_id'
        )
        ON CONFLICT (id) DO UPDATE SET
            file_url = EXCLUDED.file_url,
            payee = EXCLUDED.payee,
            payee_confidence = EXCLUDED.payee_confidence,
            amount = EXCLUDED.amount,
            amount_confidence = EXCLUDED.amount_confidence,
            check_date = EXCLUDED.check_date,
            check_date_confidence = EXCLUDED.check_date_confidence,
            check_number = EXCLUDED.check_number,
            check_number_confidence = EXCLUDED.check_number_confidence,
            bank_name = EXCLUDED.bank_name,
            bank_name_confidence = EXCLUDED.bank_name_confidence,
            memo = EXCLUDED.memo,
            confidence_summary = EXCLUDED.confidence_summary,
            updated_at = now();
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
