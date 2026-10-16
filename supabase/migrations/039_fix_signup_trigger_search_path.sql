-- ============================================================================
-- 039: Fix "Database error saving new user" on signup
--
-- handle_new_user() (last set in 014) is SECURITY DEFINER with no search_path
-- and unqualified table names. Supabase Auth inserts into auth.users with
-- search_path = auth, so "tenants" / "user_profiles" don't resolve and the
-- whole signup rolls back. Every later migration (026+) uses SET search_path,
-- this function was never brought in line.
--
-- Also: 014 coerced every plan outside the legacy set to 'starter'; 026 made
-- essential | professional | scale the current plans, so accept those.
-- ============================================================================

DO $$
DECLARE
    _profiles TEXT := CASE
        WHEN to_regclass('public.user_profiles') IS NOT NULL THEN 'user_profiles'
        ELSE 'profiles'
    END;
BEGIN
    EXECUTE format($fn$
        CREATE OR REPLACE FUNCTION public.handle_new_user()
        RETURNS TRIGGER AS $func$
        DECLARE
            _tenant_id UUID;
            _company_name TEXT;
            _full_name TEXT;
            _plan TEXT;
        BEGIN
            _company_name := COALESCE(
                NULLIF(btrim(NEW.raw_user_meta_data->>'company_name'), ''),
                NULLIF(btrim(NEW.raw_user_meta_data->>'full_name'), ''),
                split_part(NEW.email, '@', 1)
            );
            _full_name := COALESCE(
                NULLIF(btrim(NEW.raw_user_meta_data->>'full_name'), ''),
                split_part(NEW.email, '@', 1)
            );
            _plan := COALESCE(NEW.raw_user_meta_data->>'plan', 'essential');
            IF _plan NOT IN ('essential', 'professional', 'scale') THEN
                _plan := 'essential';
            END IF;

            INSERT INTO public.tenants (name, slug, plan)
            VALUES (
                _company_name,
                lower(regexp_replace(_company_name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(NEW.id::text, 1, 8),
                _plan
            )
            RETURNING id INTO _tenant_id;

            INSERT INTO public.%I (id, tenant_id, email, full_name, role)
            VALUES (NEW.id, _tenant_id, NEW.email, _full_name, 'admin');

            IF to_regclass('public.tenant_settings') IS NOT NULL THEN
                INSERT INTO public.tenant_settings (tenant_id) VALUES (_tenant_id);
            END IF;

            RETURN NEW;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE WARNING 'Error in handle_new_user: %% (SQLSTATE: %%)', SQLERRM, SQLSTATE;
                RAISE EXCEPTION 'Database error saving new user: %%', SQLERRM;
        END;
        $func$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
    $fn$, _profiles);
END $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
