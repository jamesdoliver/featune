-- ============================================================================
-- FEATUNE: Featured Tracks
-- ============================================================================
-- Adds featured track functionality (columns will be removed in later migration)
-- ============================================================================

-- ============================================================================
-- 1. ADD FEATURED COLUMNS TO TRACKS
-- ============================================================================

ALTER TABLE tracks ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS featured_order INTEGER DEFAULT 0;

-- Index for efficient featured track queries
CREATE INDEX IF NOT EXISTS idx_tracks_featured ON tracks(is_featured, featured_order);

-- ============================================================================
-- 2. ADD INSERT POLICY FOR ADMIN TRACK UPLOADS
-- ============================================================================
-- Admins need to be able to insert tracks

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'tracks' AND policyname = 'Admins can insert all tracks'
  ) THEN
    CREATE POLICY "Admins can insert all tracks"
      ON tracks FOR INSERT
      WITH CHECK (public.is_admin());
  END IF;
END $$;

-- ============================================================================
-- NOTE: Platform Creator Setup
-- ============================================================================
-- The "Featune" platform creator must be created manually:
-- 1. Create a user in Supabase Auth with email: platform@featune.com
-- 2. Note the user UUID
-- 3. Update the creators table with display_name "Featune"
-- 4. Update PLATFORM_USER_ID in app/api/admin/tracks/route.ts
-- ============================================================================
