-- ============================================================================
-- Homepage Sections & Per-Genre Curation
-- ============================================================================
-- Replaces the old star-based featured system with configurable homepage
-- sections that support admin curation and pinned tracks per section.
-- ============================================================================

-- ============================================================================
-- Part 1: Create New Tables
-- ============================================================================

-- Homepage sections (each row on the homepage)
CREATE TABLE homepage_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_type TEXT NOT NULL CHECK (section_type IN ('featured', 'genre')),
  genre TEXT,  -- NULL for 'featured', genre name for 'genre' type
  title TEXT NOT NULL,  -- Display title (e.g., "Featured Recommended", "House")
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Pinned tracks within sections (max 4 positions per section)
CREATE TABLE homepage_section_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID REFERENCES homepage_sections(id) ON DELETE CASCADE,
  track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
  position INTEGER NOT NULL CHECK (position BETWEEN 1 AND 4),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(section_id, position),  -- Each position can only have one track
  UNIQUE(section_id, track_id)   -- Each track can only be pinned once per section
);

-- ============================================================================
-- Part 2: Indexes for Performance
-- ============================================================================

CREATE INDEX idx_homepage_sections_order ON homepage_sections(display_order) WHERE is_active = true;
CREATE INDEX idx_section_tracks_section ON homepage_section_tracks(section_id, position);

-- ============================================================================
-- Part 3: Seed Data
-- ============================================================================

-- Featured section (always first, cannot be deleted)
INSERT INTO homepage_sections (section_type, genre, title, display_order)
VALUES ('featured', NULL, 'Featured Recommended', 0);

-- Initial genre sections
INSERT INTO homepage_sections (section_type, genre, title, display_order) VALUES
  ('genre', 'House', 'House', 1),
  ('genre', 'EDM', 'EDM', 2),
  ('genre', 'Pop', 'Pop', 3),
  ('genre', 'Drum and Bass', 'Drum and Bass', 4);

-- ============================================================================
-- Part 4: RLS Policies
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE homepage_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE homepage_section_tracks ENABLE ROW LEVEL SECURITY;

-- Anyone can read active sections (for homepage display)
CREATE POLICY "Anyone can read active sections"
  ON homepage_sections FOR SELECT
  USING (is_active = true);

-- Admins can read all sections (including inactive)
CREATE POLICY "Admins can read all sections"
  ON homepage_sections FOR SELECT
  USING (public.is_admin());

-- Admins can insert sections
CREATE POLICY "Admins can insert sections"
  ON homepage_sections FOR INSERT
  WITH CHECK (public.is_admin());

-- Admins can update sections
CREATE POLICY "Admins can update sections"
  ON homepage_sections FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Admins can delete sections
CREATE POLICY "Admins can delete sections"
  ON homepage_sections FOR DELETE
  USING (public.is_admin());

-- Anyone can read section tracks (for homepage display)
CREATE POLICY "Anyone can read section tracks"
  ON homepage_section_tracks FOR SELECT
  USING (true);

-- Admins can insert section tracks
CREATE POLICY "Admins can insert section tracks"
  ON homepage_section_tracks FOR INSERT
  WITH CHECK (public.is_admin());

-- Admins can update section tracks
CREATE POLICY "Admins can update section tracks"
  ON homepage_section_tracks FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Admins can delete section tracks
CREATE POLICY "Admins can delete section tracks"
  ON homepage_section_tracks FOR DELETE
  USING (public.is_admin());

-- ============================================================================
-- Part 5: Updated_at Trigger
-- ============================================================================

-- Create trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to homepage_sections
CREATE TRIGGER update_homepage_sections_updated_at
  BEFORE UPDATE ON homepage_sections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Part 6: Cleanup Old Featured System
-- ============================================================================

-- Remove the old featured columns from tracks table
ALTER TABLE tracks DROP COLUMN IF EXISTS is_featured;
ALTER TABLE tracks DROP COLUMN IF EXISTS featured_order;

-- Remove the old featured index
DROP INDEX IF EXISTS idx_tracks_featured;
