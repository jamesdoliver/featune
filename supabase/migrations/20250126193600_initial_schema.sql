-- ============================================================================
-- FEATUNE: Initial Database Schema
-- ============================================================================
-- Supabase PostgreSQL migration
-- Creates all tables, types, triggers, RLS policies, and indexes
-- ============================================================================

-- ============================================================================
-- 1. CUSTOM ENUM TYPES
-- ============================================================================

CREATE TYPE vocalist_type AS ENUM ('male', 'female');
CREATE TYPE license_type AS ENUM ('unlimited', 'limited', 'exclusive');
CREATE TYPE order_license_type AS ENUM ('non_exclusive', 'exclusive');
CREATE TYPE track_status AS ENUM ('pending', 'approved', 'rejected', 'sold_out', 'removed');
CREATE TYPE creator_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE order_status AS ENUM ('pending', 'completed', 'failed');
CREATE TYPE payout_status AS ENUM ('pending', 'processing', 'completed');

-- ============================================================================
-- 2. TABLES
-- ============================================================================

-- ---------------------------------------------------------------------------
-- profiles (extends auth.users)
-- ---------------------------------------------------------------------------
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  is_creator BOOLEAN DEFAULT false,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- creators
-- ---------------------------------------------------------------------------
CREATE TABLE creators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  display_name TEXT NOT NULL,
  bio TEXT,
  profile_image_url TEXT,
  revenue_split DECIMAL(3,2) DEFAULT 0.70,
  payout_details JSONB,
  status creator_status DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- tracks
-- ---------------------------------------------------------------------------
CREATE TABLE tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES creators(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  vocalist_type vocalist_type,
  genre TEXT,
  mood TEXT,
  bpm INTEGER,
  key TEXT,
  length_seconds INTEGER,
  license_type license_type NOT NULL,
  license_limit INTEGER,           -- NULL if unlimited
  licenses_sold INTEGER DEFAULT 0,
  price_non_exclusive DECIMAL(10,2),
  price_exclusive DECIMAL(10,2),
  lyrics TEXT,
  lyrics_pdf_url TEXT,
  artwork_url TEXT,
  listening_file_url TEXT,
  preview_clip_url TEXT,
  preview_clip_start INTEGER,
  full_preview_url TEXT,
  acapella_url TEXT,
  instrumental_url TEXT,
  waveform_data JSONB,
  is_ai_generated BOOLEAN DEFAULT false,
  status track_status DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  approved_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- orders
-- ---------------------------------------------------------------------------
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  stripe_payment_intent TEXT,
  subtotal DECIMAL(10,2) NOT NULL,
  discount_percent INTEGER DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  status order_status DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- order_items
-- ---------------------------------------------------------------------------
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  track_id UUID REFERENCES tracks(id) ON DELETE SET NULL,
  license_type order_license_type NOT NULL,
  price_at_purchase DECIMAL(10,2) NOT NULL,
  creator_earnings DECIMAL(10,2) NOT NULL,
  license_pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- payouts
-- ---------------------------------------------------------------------------
CREATE TABLE payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES creators(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  status payout_status DEFAULT 'pending',
  invoice_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  paid_at TIMESTAMPTZ
);

-- ============================================================================
-- 3. AUTO-CREATE PROFILE ON AUTH.USERS INSERT
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 4. UPDATED_AT TRIGGER FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to profiles
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Apply updated_at trigger to creators
CREATE TRIGGER set_creators_updated_at
  BEFORE UPDATE ON creators
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Apply updated_at trigger to tracks
CREATE TRIGGER set_tracks_updated_at
  BEFORE UPDATE ON tracks
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- PROFILES policies
-- ---------------------------------------------------------------------------

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admins can read all profiles
CREATE POLICY "Admins can read all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ---------------------------------------------------------------------------
-- CREATORS policies
-- ---------------------------------------------------------------------------

-- Anyone can read approved creators (public profiles)
CREATE POLICY "Anyone can read approved creators"
  ON creators FOR SELECT
  USING (status = 'approved');

-- Users can read their own creator record (any status)
CREATE POLICY "Users can read own creator record"
  ON creators FOR SELECT
  USING (user_id = auth.uid());

-- Users can insert their own creator application
CREATE POLICY "Users can insert own creator application"
  ON creators FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own creator record
CREATE POLICY "Users can update own creator record"
  ON creators FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admins can read all creators
CREATE POLICY "Admins can read all creators"
  ON creators FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Admins can update all creators
CREATE POLICY "Admins can update all creators"
  ON creators FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ---------------------------------------------------------------------------
-- TRACKS policies
-- ---------------------------------------------------------------------------

-- Anyone can read approved tracks (public browsing)
CREATE POLICY "Anyone can read approved tracks"
  ON tracks FOR SELECT
  USING (status = 'approved');

-- Creators can read their own tracks (any status)
CREATE POLICY "Creators can read own tracks"
  ON tracks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM creators
      WHERE creators.id = tracks.creator_id
        AND creators.user_id = auth.uid()
    )
  );

-- Creators can insert tracks for their own creator_id
CREATE POLICY "Creators can insert own tracks"
  ON tracks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM creators
      WHERE creators.id = tracks.creator_id
        AND creators.user_id = auth.uid()
    )
  );

-- Creators can update their own tracks
CREATE POLICY "Creators can update own tracks"
  ON tracks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM creators
      WHERE creators.id = tracks.creator_id
        AND creators.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM creators
      WHERE creators.id = tracks.creator_id
        AND creators.user_id = auth.uid()
    )
  );

-- Admins can read all tracks
CREATE POLICY "Admins can read all tracks"
  ON tracks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Admins can update all tracks
CREATE POLICY "Admins can update all tracks"
  ON tracks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Admins can delete all tracks
CREATE POLICY "Admins can delete all tracks"
  ON tracks FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ---------------------------------------------------------------------------
-- ORDERS policies
-- ---------------------------------------------------------------------------

-- Users can read their own orders
CREATE POLICY "Users can read own orders"
  ON orders FOR SELECT
  USING (user_id = auth.uid());

-- Admins can read all orders
CREATE POLICY "Admins can read all orders"
  ON orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ---------------------------------------------------------------------------
-- ORDER_ITEMS policies
-- ---------------------------------------------------------------------------

-- Users can read items from their own orders
CREATE POLICY "Users can read own order items"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
        AND orders.user_id = auth.uid()
    )
  );

-- Admins can read all order items
CREATE POLICY "Admins can read all order items"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ---------------------------------------------------------------------------
-- PAYOUTS policies
-- ---------------------------------------------------------------------------

-- Creators can read their own payouts
CREATE POLICY "Creators can read own payouts"
  ON payouts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM creators
      WHERE creators.id = payouts.creator_id
        AND creators.user_id = auth.uid()
    )
  );

-- Creators can insert payout requests for themselves
CREATE POLICY "Creators can insert own payout requests"
  ON payouts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM creators
      WHERE creators.id = payouts.creator_id
        AND creators.user_id = auth.uid()
    )
  );

-- Admins can read all payouts
CREATE POLICY "Admins can read all payouts"
  ON payouts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Admins can update all payouts
CREATE POLICY "Admins can update all payouts"
  ON payouts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ============================================================================
-- 6. INDEXES
-- ============================================================================

-- Tracks indexes
CREATE INDEX idx_tracks_creator_id ON tracks(creator_id);
CREATE INDEX idx_tracks_status ON tracks(status);
CREATE INDEX idx_tracks_genre ON tracks(genre);
CREATE INDEX idx_tracks_vocalist_type ON tracks(vocalist_type);
CREATE INDEX idx_tracks_is_ai_generated ON tracks(is_ai_generated);

-- Orders indexes
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);

-- Order items indexes
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_track_id ON order_items(track_id);

-- Payouts indexes
CREATE INDEX idx_payouts_creator_id ON payouts(creator_id);
CREATE INDEX idx_payouts_status ON payouts(status);

-- Creators indexes
CREATE INDEX idx_creators_user_id ON creators(user_id);
CREATE INDEX idx_creators_status ON creators(status);
