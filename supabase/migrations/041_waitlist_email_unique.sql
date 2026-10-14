-- 041: make the waitlist's one-row-per-person rule usable by ON CONFLICT.
--
-- 040 enforced uniqueness with a UNIQUE INDEX on lower(email). That does keep
-- duplicates out, but Postgres cannot match `ON CONFLICT (email)` to an index
-- built on an EXPRESSION, so the upsert in pages/api/waitlist.ts failed with
-- "there is no unique or exclusion constraint matching the ON CONFLICT
-- specification" and every signup after the first returned a 500.
--
-- Rather than complicate the query with the expression form, the constraint is
-- now the plain one the route expects:
--
--   UNIQUE (email)              -- what ON CONFLICT (email) binds to
--   CHECK  (email = lower(email))  -- what keeps the uniqueness meaningful
--
-- The CHECK is the half that must not be lost. Without it, UNIQUE(email) alone
-- would happily hold Someone@x.com AND someone@x.com as two people, which is the
-- exact duplicate 040 set out to prevent. The API lowercases on the way in; this
-- is what makes that a guarantee rather than a convention.
--
-- Idempotent: safe to run repeatedly.

-- Existing rows must satisfy the CHECK before it can be added. The table is new
-- and the route has always lowercased, so this normally affects nothing, but a
-- row written by hand would otherwise make the ALTER fail.
UPDATE public.waitlist SET email = lower(email) WHERE email <> lower(email);

-- Collapse any pair that differed only by case, keeping the earliest signup —
-- that is the one whose confirmation email was actually sent.
DELETE FROM public.waitlist a
 USING public.waitlist b
 WHERE a.id <> b.id
   AND lower(a.email) = lower(b.email)
   AND a.created_at > b.created_at;

DROP INDEX IF EXISTS public.waitlist_email_key;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
         WHERE conrelid = 'public.waitlist'::regclass
           AND conname  = 'waitlist_email_unique'
    ) THEN
        ALTER TABLE public.waitlist
            ADD CONSTRAINT waitlist_email_unique UNIQUE (email);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
         WHERE conrelid = 'public.waitlist'::regclass
           AND conname  = 'waitlist_email_lowercase'
    ) THEN
        ALTER TABLE public.waitlist
            ADD CONSTRAINT waitlist_email_lowercase CHECK (email = lower(email));
    END IF;
END $$;
