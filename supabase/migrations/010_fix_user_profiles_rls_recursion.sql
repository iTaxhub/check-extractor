-- Fix infinite recursion in user_profiles RLS policies
-- The user_tenant_id() function queries user_profiles, so user_profiles policies
-- cannot use user_tenant_id() or it creates infinite recursion

-- Drop ALL existing policies on user_profiles
DROP POLICY IF EXISTS "Users can view profiles in their tenant" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view own tenant user_profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own tenant user_profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own tenant user_profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can delete own tenant user_profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow all for user_profiles" ON public.user_profiles;

-- Drop the good policies too so we can recreate them
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can create their own profile" ON public.user_profiles;

-- Create simple, non-recursive policies using only auth.uid()
-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON public.user_profiles
  FOR SELECT
  USING (id = auth.uid());

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.user_profiles
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Users can insert their own profile (for signup)
CREATE POLICY "Users can create their own profile"
  ON public.user_profiles
  FOR INSERT
  WITH CHECK (id = auth.uid());
