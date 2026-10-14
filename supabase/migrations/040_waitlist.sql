-- 040: the Kyriq IQ waitlist.
--
-- WHY: "Join the waitlist" on the landing page was a mailto: link. It threw the
-- visitor out of the site into whatever mail client the OS happened to open,
-- and on a machine with no mail client configured it did nothing at all. Every
-- sign-up it did produce landed in one inbox as free text, so nobody could
-- answer "how many people want this".
--
-- This table is the record instead. It is the ONE place the landing form writes.
--
-- NOT TENANT-SCOPED, deliberately. Everything else here carries tenant_id and an
-- RLS policy keyed to it, but a waitlist signup happens before the person has an
-- account, so there is no tenant to scope to and no authenticated user to check.
-- The protection is therefore the opposite shape: no client role may touch this
-- table AT ALL, and both routes that use it hold the service-role key server
-- side. Writing it with the anon key from the browser is what would turn it into
-- a public mailing list, so that path is closed here rather than in app code.
--
-- Idempotent: safe to run repeatedly.

CREATE TABLE IF NOT EXISTS public.waitlist (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email       TEXT NOT NULL,
    name        TEXT,
    company     TEXT,
    note        TEXT,
    -- Which surface produced the signup, so a second entry point later can be
    -- measured separately rather than silently merged into the first.
    source      TEXT NOT NULL DEFAULT 'landing_kyriq_iq',
    -- Set once the confirmation email is accepted by the provider. NULL means
    -- the row exists but nothing was delivered, which is the case worth seeing.
    confirmed_at TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- One row per address. A second submission updates the existing row rather than
-- creating a duplicate, so the count is a count of PEOPLE. Addresses are
-- compared case-insensitively because Someone@x.com and someone@x.com are one
-- person; the API lowercases on the way in and this index enforces it even if a
-- future caller forgets.
CREATE UNIQUE INDEX IF NOT EXISTS waitlist_email_key
    ON public.waitlist (lower(email));

CREATE INDEX IF NOT EXISTS waitlist_created_at_idx
    ON public.waitlist (created_at DESC);

ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- A policy that matches nothing. RLS with no policy already denies, but an
-- explicit FALSE states the intent, so the next person to read this file does
-- not "helpfully" add a permissive one. service_role bypasses RLS and is how
-- both routes reach the table.
DROP POLICY IF EXISTS "waitlist_no_client_access" ON public.waitlist;
CREATE POLICY "waitlist_no_client_access"
    ON public.waitlist
    FOR ALL
    TO anon, authenticated
    USING (false)
    WITH CHECK (false);

-- Belt and braces: RLS governs row visibility, but the table-level grant is a
-- separate gate. Revoking it means a mistaken permissive policy later still
-- cannot expose the list.
REVOKE ALL ON public.waitlist FROM anon, authenticated;

COMMENT ON TABLE public.waitlist IS
    'Kyriq IQ waitlist signups from the public landing form. Not tenant-scoped: '
    'signups happen before an account exists. Service-role access only.';
