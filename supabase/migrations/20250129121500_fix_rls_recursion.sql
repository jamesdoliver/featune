-- ============================================================================
-- Fix RLS Infinite Recursion
-- ============================================================================
-- The admin policies were causing infinite recursion by querying profiles
-- from within profiles policies. This migration fixes that by using a
-- security definer function that bypasses RLS.
-- ============================================================================

-- Create a security definer function to check admin status
-- This function runs with elevated privileges and bypasses RLS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Drop the problematic recursive policies
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can read all creators" ON creators;
DROP POLICY IF EXISTS "Admins can update all creators" ON creators;
DROP POLICY IF EXISTS "Admins can read all tracks" ON tracks;
DROP POLICY IF EXISTS "Admins can update all tracks" ON tracks;
DROP POLICY IF EXISTS "Admins can delete all tracks" ON tracks;
DROP POLICY IF EXISTS "Admins can read all orders" ON orders;
DROP POLICY IF EXISTS "Admins can read all order items" ON order_items;
DROP POLICY IF EXISTS "Admins can read all payouts" ON payouts;
DROP POLICY IF EXISTS "Admins can update all payouts" ON payouts;

-- Recreate admin policies using the security definer function
CREATE POLICY "Admins can read all profiles"
  ON profiles FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can read all creators"
  ON creators FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can update all creators"
  ON creators FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can read all tracks"
  ON tracks FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can update all tracks"
  ON tracks FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete all tracks"
  ON tracks FOR DELETE
  USING (public.is_admin());

CREATE POLICY "Admins can read all orders"
  ON orders FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can read all order items"
  ON order_items FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can read all payouts"
  ON payouts FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can update all payouts"
  ON payouts FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
