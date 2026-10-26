-- The QuickBooks company's country (CompanyInfo.Country, e.g. 'US', 'CA', 'GB').
-- Emails use it to say "cheque" to Canadian and UK firms and "check" to US ones.
-- Filled by /api/qbo/company-info; null until that runs, which reads as "check".
ALTER TABLE public.qb_connections ADD COLUMN IF NOT EXISTS country TEXT;
