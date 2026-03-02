-- Fix handle_new_user trigger to properly handle company_name from signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    _tenant_id UUID;
    _company_name TEXT;
    _full_name TEXT;
BEGIN
    -- Get company name from user metadata (from signup form)
    _company_name := COALESCE(
        NEW.raw_user_meta_data->>'company_name',
        NEW.raw_user_meta_data->>'full_name',
        split_part(NEW.email, '@', 1)
    );
    
    _full_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        split_part(NEW.email, '@', 1)
    );
    
    -- Create tenant with company name
    INSERT INTO tenants (name, slug)
    VALUES (
        _company_name,
        lower(regexp_replace(_company_name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(NEW.id::text, 1, 8)
    )
    RETURNING id INTO _tenant_id;
    
    -- Create user profile
    INSERT INTO profiles (id, tenant_id, email, full_name, role)
    VALUES (NEW.id, _tenant_id, NEW.email, _full_name, 'admin');
    
    -- Create tenant settings
    INSERT INTO tenant_settings (tenant_id) 
    VALUES (_tenant_id);
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error for debugging
        RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
        RAISE EXCEPTION 'Database error saving new user: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();
