-- Add company_name column to integrations table to store QB company name
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'integrations' AND column_name = 'company_name') THEN
    ALTER TABLE integrations ADD COLUMN company_name TEXT;
  END IF;
END $$;
