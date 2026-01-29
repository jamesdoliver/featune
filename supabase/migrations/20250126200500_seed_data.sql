-- ============================================================================
-- FEATUNE: Seed Data
-- ============================================================================
-- Inserts test creators (3) and tracks (15) for development and testing.
-- All tracks are status = 'approved' so they appear in the browse/shop.
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. HARDCODED UUIDs
-- ============================================================================
-- User/Profile UUIDs (must match auth.users entries)
-- user_1: a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d
-- user_2: b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e
-- user_3: c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f
--
-- Creator UUIDs
-- creator_1: d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80
-- creator_2: e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8091
-- creator_3: f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8091a2

-- ============================================================================
-- 2. INSERT AUTH USERS (Supabase auth.users for FK)
-- ============================================================================
-- These are minimal auth.users entries so that profiles FK constraint is met.
-- In production, users are created via Supabase Auth; this is for seeding only.

INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
) VALUES
(
  'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'aria.voice@example.com',
  crypt('testpassword123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Aria Voice"}'::jsonb,
  '', '', '', ''
),
(
  'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'kingmelody@example.com',
  crypt('testpassword123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"King Melody"}'::jsonb,
  '', '', '', ''
),
(
  'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'neonpulse@example.com',
  crypt('testpassword123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Neon Pulse"}'::jsonb,
  '', '', '', ''
);

-- ============================================================================
-- 3. INSERT PROFILES
-- ============================================================================
-- The on_auth_user_created trigger may auto-create these.
-- Use ON CONFLICT to handle both cases safely.

INSERT INTO profiles (id, email, full_name, is_creator, is_admin)
VALUES
  ('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'aria.voice@example.com', 'Aria Voice', true, false),
  ('b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', 'kingmelody@example.com', 'King Melody', true, false),
  ('c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f', 'neonpulse@example.com', 'Neon Pulse', true, false)
ON CONFLICT (id) DO UPDATE SET
  is_creator = EXCLUDED.is_creator,
  full_name = EXCLUDED.full_name;

-- ============================================================================
-- 4. INSERT CREATORS
-- ============================================================================

INSERT INTO creators (id, user_id, display_name, bio, profile_image_url, revenue_split, status)
VALUES
(
  'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80',
  'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
  'Aria Voice',
  'Professional vocalist specializing in pop and R&B toplines. Over 500 placements with major and indie artists worldwide.',
  '/placeholders/creator-aria.jpg',
  0.70,
  'approved'
),
(
  'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8091',
  'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
  'King Melody',
  'Hip-hop and Afrobeats vocalist bringing authentic vibes to every track. Featured on multiple charting singles.',
  '/placeholders/creator-king.jpg',
  0.70,
  'approved'
),
(
  'f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8091a2',
  'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
  'Neon Pulse',
  'AI-enhanced vocal producer creating cutting-edge EDM and electronic toplines. Blending human emotion with digital precision.',
  '/placeholders/creator-neon.jpg',
  0.75,
  'approved'
);

-- ============================================================================
-- 5. INSERT TRACKS (15 total)
-- ============================================================================

-- ---- TRACK 1 ----
INSERT INTO tracks (
  id, creator_id, title, vocalist_type, genre, mood, bpm, key,
  length_seconds, license_type, license_limit, licenses_sold,
  price_non_exclusive, price_exclusive,
  lyrics, artwork_url, listening_file_url,
  preview_clip_url, preview_clip_start, full_preview_url,
  acapella_url, instrumental_url,
  waveform_data, is_ai_generated, status, approved_at
) VALUES (
  gen_random_uuid(),
  'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80',
  'Midnight Glow',
  'female', 'Pop', 'Romantic', 118, 'C Major',
  210, 'unlimited', NULL, 0,
  49.99, 299.99,
  E'Verse 1:\nUnderneath the city lights\nYour silhouette against the night\nEvery word you whisper low\nSets my heart on a midnight glow\n\nChorus:\nMidnight glow, can you feel it?\nThe way the stars align for us tonight\nMidnight glow, don''t conceal it\nLet the world fade and hold me tight',
  '/placeholders/artwork-1.jpg',
  '/placeholders/listening-1.mp3',
  '/placeholders/preview-1.mp3', 30, '/placeholders/full-preview-1.mp3',
  '/placeholders/acapella-1.wav', '/placeholders/instrumental-1.wav',
  '[0.12,0.18,0.25,0.31,0.42,0.55,0.63,0.71,0.78,0.82,0.88,0.92,0.95,0.98,1.00,0.97,0.93,0.88,0.82,0.75,0.68,0.61,0.55,0.50,0.47,0.52,0.58,0.65,0.72,0.80,0.86,0.91,0.94,0.97,0.99,1.00,0.96,0.90,0.83,0.76,0.69,0.62,0.56,0.50,0.45,0.41,0.38,0.42,0.48,0.55,0.63,0.70,0.78,0.85,0.90,0.94,0.97,0.99,1.00,0.98,0.94,0.89,0.83,0.76,0.68,0.60,0.53,0.46,0.40,0.35,0.31,0.36,0.43,0.51,0.60,0.68,0.76,0.83,0.89,0.94,0.97,0.99,1.00,0.97,0.92,0.86,0.79,0.71,0.63,0.55,0.47,0.40,0.34,0.28,0.23,0.19,0.15,0.12,0.09,0.07]'::jsonb,
  false, 'approved', now()
);

-- ---- TRACK 2 ----
INSERT INTO tracks (
  id, creator_id, title, vocalist_type, genre, mood, bpm, key,
  length_seconds, license_type, license_limit, licenses_sold,
  price_non_exclusive, price_exclusive,
  artwork_url, listening_file_url,
  preview_clip_url, preview_clip_start, full_preview_url,
  acapella_url, instrumental_url,
  waveform_data, is_ai_generated, status, approved_at
) VALUES (
  gen_random_uuid(),
  'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80',
  'Golden Hour',
  'female', 'Pop', 'Happy', 124, 'G Major',
  195, 'unlimited', NULL, 0,
  39.99, 249.99,
  '/placeholders/artwork-2.jpg',
  '/placeholders/listening-2.mp3',
  '/placeholders/preview-2.mp3', 20, '/placeholders/full-preview-2.mp3',
  '/placeholders/acapella-2.wav', '/placeholders/instrumental-2.wav',
  '[0.08,0.15,0.22,0.30,0.40,0.52,0.60,0.68,0.75,0.80,0.85,0.90,0.93,0.96,0.98,0.99,1.00,0.98,0.94,0.88,0.82,0.74,0.67,0.60,0.54,0.49,0.55,0.62,0.70,0.77,0.84,0.89,0.93,0.96,0.98,1.00,0.98,0.94,0.89,0.83,0.76,0.68,0.60,0.53,0.47,0.42,0.39,0.44,0.51,0.59,0.67,0.75,0.82,0.88,0.92,0.96,0.98,1.00,0.98,0.95,0.90,0.84,0.77,0.69,0.61,0.53,0.46,0.40,0.35,0.31,0.28,0.33,0.40,0.48,0.57,0.66,0.74,0.81,0.87,0.92,0.96,0.98,1.00,0.97,0.93,0.87,0.80,0.72,0.63,0.55,0.47,0.40,0.33,0.27,0.22,0.18,0.14,0.11,0.08,0.06]'::jsonb,
  false, 'approved', now()
);

-- ---- TRACK 3 ----
INSERT INTO tracks (
  id, creator_id, title, vocalist_type, genre, mood, bpm, key,
  length_seconds, license_type, license_limit, licenses_sold,
  price_non_exclusive, price_exclusive,
  artwork_url, listening_file_url,
  preview_clip_url, preview_clip_start, full_preview_url,
  acapella_url, instrumental_url,
  waveform_data, is_ai_generated, status, approved_at
) VALUES (
  gen_random_uuid(),
  'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80',
  'Velvet Dreams',
  'female', 'R&B', 'Chill', 92, 'D Minor',
  240, 'limited', 50, 3,
  59.99, 399.99,
  '/placeholders/artwork-3.jpg',
  '/placeholders/listening-3.mp3',
  '/placeholders/preview-3.mp3', 45, '/placeholders/full-preview-3.mp3',
  '/placeholders/acapella-3.wav', '/placeholders/instrumental-3.wav',
  '[0.05,0.10,0.16,0.23,0.30,0.38,0.45,0.52,0.58,0.64,0.70,0.75,0.80,0.84,0.88,0.91,0.94,0.96,0.98,0.99,1.00,0.99,0.97,0.94,0.90,0.86,0.81,0.76,0.70,0.64,0.58,0.53,0.48,0.44,0.48,0.54,0.60,0.66,0.72,0.78,0.83,0.87,0.91,0.94,0.97,0.99,1.00,0.98,0.95,0.91,0.86,0.81,0.75,0.69,0.63,0.57,0.51,0.46,0.42,0.39,0.43,0.49,0.56,0.63,0.70,0.76,0.82,0.87,0.91,0.94,0.97,0.99,1.00,0.98,0.95,0.91,0.86,0.80,0.73,0.66,0.59,0.52,0.45,0.39,0.33,0.28,0.23,0.19,0.16,0.13,0.10,0.08,0.06,0.05,0.04,0.03,0.03,0.02,0.02,0.01]'::jsonb,
  false, 'approved', now()
);

-- ---- TRACK 4 ----
INSERT INTO tracks (
  id, creator_id, title, vocalist_type, genre, mood, bpm, key,
  length_seconds, license_type, license_limit, licenses_sold,
  price_non_exclusive, price_exclusive,
  lyrics, artwork_url, listening_file_url,
  preview_clip_url, preview_clip_start, full_preview_url,
  acapella_url, instrumental_url,
  waveform_data, is_ai_generated, status, approved_at
) VALUES (
  gen_random_uuid(),
  'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80',
  'Neon Nights',
  'female', 'EDM', 'Energetic', 140, 'A Minor',
  185, 'unlimited', NULL, 0,
  45.99, 349.99,
  E'Verse 1:\nFlashing colors on the wall\nBass is dropping, hear the call\nWe''re alive in neon lights\nLost together, neon nights\n\nChorus:\nNeon nights, neon nights\nWe''re burning up the sky tonight\nNeon nights, hold me close\nDon''t let go until the morning light',
  '/placeholders/artwork-4.jpg',
  '/placeholders/listening-4.mp3',
  '/placeholders/preview-4.mp3', 15, '/placeholders/full-preview-4.mp3',
  '/placeholders/acapella-4.wav', '/placeholders/instrumental-4.wav',
  '[0.15,0.25,0.38,0.50,0.62,0.74,0.83,0.90,0.95,0.98,1.00,0.98,0.94,0.88,0.80,0.72,0.63,0.55,0.48,0.42,0.50,0.60,0.70,0.80,0.88,0.94,0.98,1.00,0.98,0.93,0.86,0.78,0.69,0.60,0.52,0.45,0.40,0.48,0.58,0.68,0.78,0.87,0.93,0.97,1.00,0.98,0.94,0.87,0.79,0.70,0.61,0.53,0.46,0.40,0.35,0.42,0.52,0.63,0.74,0.84,0.91,0.96,0.99,1.00,0.97,0.92,0.85,0.76,0.67,0.58,0.50,0.43,0.37,0.32,0.40,0.50,0.62,0.73,0.83,0.91,0.96,0.99,1.00,0.97,0.91,0.83,0.74,0.64,0.55,0.46,0.38,0.31,0.25,0.20,0.16,0.13,0.10,0.08,0.06,0.05]'::jsonb,
  false, 'approved', now()
);

-- ---- TRACK 5 ----
INSERT INTO tracks (
  id, creator_id, title, vocalist_type, genre, mood, bpm, key,
  length_seconds, license_type, license_limit, licenses_sold,
  price_non_exclusive, price_exclusive,
  artwork_url, listening_file_url,
  preview_clip_url, preview_clip_start, full_preview_url,
  acapella_url, instrumental_url,
  waveform_data, is_ai_generated, status, approved_at
) VALUES (
  gen_random_uuid(),
  'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80',
  'Ocean Breeze',
  'female', 'R&B', 'Chill', 88, 'E Minor',
  225, 'exclusive', NULL, 0,
  NULL, 499.99,
  '/placeholders/artwork-5.jpg',
  '/placeholders/listening-5.mp3',
  '/placeholders/preview-5.mp3', 35, '/placeholders/full-preview-5.mp3',
  '/placeholders/acapella-5.wav', '/placeholders/instrumental-5.wav',
  '[0.03,0.07,0.12,0.18,0.25,0.33,0.40,0.47,0.54,0.60,0.66,0.71,0.76,0.80,0.84,0.87,0.90,0.93,0.95,0.97,0.98,0.99,1.00,0.99,0.98,0.96,0.93,0.90,0.86,0.82,0.77,0.72,0.67,0.62,0.57,0.52,0.48,0.44,0.41,0.38,0.42,0.47,0.53,0.59,0.65,0.71,0.76,0.81,0.85,0.89,0.92,0.95,0.97,0.99,1.00,0.99,0.97,0.94,0.90,0.86,0.81,0.76,0.70,0.64,0.58,0.52,0.47,0.42,0.37,0.33,0.29,0.26,0.23,0.27,0.32,0.38,0.44,0.50,0.57,0.63,0.69,0.74,0.79,0.83,0.87,0.90,0.92,0.88,0.82,0.75,0.67,0.58,0.49,0.40,0.32,0.25,0.18,0.13,0.08,0.05]'::jsonb,
  false, 'approved', now()
);

-- ---- TRACK 6 ----
INSERT INTO tracks (
  id, creator_id, title, vocalist_type, genre, mood, bpm, key,
  length_seconds, license_type, license_limit, licenses_sold,
  price_non_exclusive, price_exclusive,
  lyrics, artwork_url, listening_file_url,
  preview_clip_url, preview_clip_start, full_preview_url,
  acapella_url, instrumental_url,
  waveform_data, is_ai_generated, status, approved_at
) VALUES (
  gen_random_uuid(),
  'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8091',
  'Crown Heights',
  'male', 'Hip-Hop', 'Dark', 85, 'D Minor',
  200, 'unlimited', NULL, 0,
  39.99, 299.99,
  E'Verse 1:\nWalking through the concrete maze\nShadows dance in the city haze\nEvery corner tells a story\nOf the hustle, pain, and glory\n\nChorus:\nCrown heights, crown heights\nWe rise above the noise tonight\nCrown heights, stay tight\nKeep pushing till we see the light',
  '/placeholders/artwork-6.jpg',
  '/placeholders/listening-6.mp3',
  '/placeholders/preview-6.mp3', 25, '/placeholders/full-preview-6.mp3',
  '/placeholders/acapella-6.wav', '/placeholders/instrumental-6.wav',
  '[0.10,0.20,0.32,0.45,0.55,0.65,0.74,0.82,0.88,0.93,0.97,0.99,1.00,0.98,0.95,0.90,0.84,0.77,0.70,0.63,0.56,0.50,0.45,0.50,0.57,0.64,0.72,0.79,0.85,0.90,0.94,0.97,0.99,1.00,0.98,0.94,0.89,0.82,0.75,0.67,0.60,0.53,0.47,0.42,0.48,0.56,0.64,0.72,0.80,0.87,0.92,0.96,0.99,1.00,0.97,0.93,0.87,0.80,0.72,0.64,0.56,0.49,0.43,0.38,0.34,0.40,0.48,0.57,0.66,0.75,0.83,0.89,0.94,0.98,1.00,0.97,0.92,0.85,0.77,0.68,0.59,0.50,0.42,0.35,0.29,0.24,0.20,0.16,0.13,0.10,0.08,0.07,0.06,0.05,0.04,0.04,0.03,0.03,0.02,0.02]'::jsonb,
  false, 'approved', now()
);

-- ---- TRACK 7 ----
INSERT INTO tracks (
  id, creator_id, title, vocalist_type, genre, mood, bpm, key,
  length_seconds, license_type, license_limit, licenses_sold,
  price_non_exclusive, price_exclusive,
  artwork_url, listening_file_url,
  preview_clip_url, preview_clip_start, full_preview_url,
  acapella_url, instrumental_url,
  waveform_data, is_ai_generated, status, approved_at
) VALUES (
  gen_random_uuid(),
  'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8091',
  'Lagos Nights',
  'male', 'Afrobeats', 'Energetic', 108, 'G Major',
  215, 'unlimited', NULL, 0,
  49.99, 349.99,
  '/placeholders/artwork-7.jpg',
  '/placeholders/listening-7.mp3',
  '/placeholders/preview-7.mp3', 40, '/placeholders/full-preview-7.mp3',
  '/placeholders/acapella-7.wav', '/placeholders/instrumental-7.wav',
  '[0.14,0.22,0.33,0.44,0.54,0.64,0.73,0.80,0.86,0.91,0.95,0.98,1.00,0.99,0.96,0.92,0.86,0.80,0.73,0.66,0.60,0.55,0.60,0.67,0.74,0.80,0.86,0.91,0.95,0.98,1.00,0.98,0.94,0.89,0.83,0.76,0.69,0.63,0.57,0.52,0.57,0.64,0.71,0.78,0.84,0.89,0.94,0.97,1.00,0.98,0.95,0.90,0.84,0.77,0.70,0.63,0.57,0.51,0.46,0.42,0.47,0.54,0.62,0.70,0.77,0.84,0.90,0.94,0.98,1.00,0.97,0.93,0.87,0.80,0.72,0.65,0.57,0.50,0.44,0.39,0.34,0.30,0.35,0.42,0.50,0.58,0.66,0.73,0.80,0.85,0.78,0.70,0.61,0.52,0.43,0.35,0.27,0.20,0.14,0.09]'::jsonb,
  false, 'approved', now()
);

-- ---- TRACK 8 ----
INSERT INTO tracks (
  id, creator_id, title, vocalist_type, genre, mood, bpm, key,
  length_seconds, license_type, license_limit, licenses_sold,
  price_non_exclusive, price_exclusive,
  artwork_url, listening_file_url,
  preview_clip_url, preview_clip_start, full_preview_url,
  acapella_url, instrumental_url,
  waveform_data, is_ai_generated, status, approved_at
) VALUES (
  gen_random_uuid(),
  'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8091',
  'Shadow Play',
  'male', 'Hip-Hop', 'Dark', 90, 'A Minor',
  190, 'limited', 25, 8,
  59.99, 399.99,
  '/placeholders/artwork-8.jpg',
  '/placeholders/listening-8.mp3',
  '/placeholders/preview-8.mp3', 10, '/placeholders/full-preview-8.mp3',
  '/placeholders/acapella-8.wav', '/placeholders/instrumental-8.wav',
  '[0.18,0.28,0.40,0.52,0.63,0.73,0.81,0.88,0.93,0.97,0.99,1.00,0.98,0.94,0.88,0.81,0.73,0.65,0.57,0.50,0.44,0.39,0.44,0.51,0.59,0.67,0.75,0.82,0.88,0.93,0.97,1.00,0.98,0.94,0.89,0.82,0.74,0.66,0.58,0.51,0.45,0.40,0.45,0.52,0.60,0.68,0.76,0.83,0.89,0.94,0.98,1.00,0.97,0.93,0.87,0.80,0.72,0.64,0.56,0.49,0.43,0.38,0.43,0.50,0.58,0.66,0.74,0.81,0.87,0.92,0.96,0.99,1.00,0.97,0.92,0.86,0.78,0.70,0.62,0.54,0.47,0.40,0.34,0.29,0.24,0.20,0.17,0.14,0.12,0.10,0.08,0.07,0.06,0.05,0.05,0.04,0.04,0.03,0.03,0.02]'::jsonb,
  false, 'approved', now()
);

-- ---- TRACK 9 ----
INSERT INTO tracks (
  id, creator_id, title, vocalist_type, genre, mood, bpm, key,
  length_seconds, license_type, license_limit, licenses_sold,
  price_non_exclusive, price_exclusive,
  lyrics, artwork_url, listening_file_url,
  preview_clip_url, preview_clip_start, full_preview_url,
  acapella_url, instrumental_url,
  waveform_data, is_ai_generated, status, approved_at
) VALUES (
  gen_random_uuid(),
  'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8091',
  'Wahala',
  'male', 'Afrobeats', 'Happy', 112, 'C Major',
  198, 'unlimited', NULL, 0,
  29.99, 199.99,
  E'Verse 1:\nSun is shining on the island\nFeel the rhythm, no more hiding\nDance with me under the palm trees\nLet the music set us free\n\nChorus:\nNo wahala, no wahala\nWe dey party till tomorrow\nNo wahala, no wahala\nForget your trouble, forget your sorrow',
  '/placeholders/artwork-9.jpg',
  '/placeholders/listening-9.mp3',
  '/placeholders/preview-9.mp3', 20, '/placeholders/full-preview-9.mp3',
  '/placeholders/acapella-9.wav', '/placeholders/instrumental-9.wav',
  '[0.11,0.19,0.28,0.38,0.48,0.58,0.67,0.75,0.82,0.88,0.92,0.96,0.98,1.00,0.99,0.96,0.92,0.87,0.81,0.74,0.67,0.61,0.55,0.50,0.55,0.62,0.69,0.76,0.82,0.88,0.92,0.96,0.99,1.00,0.98,0.95,0.90,0.84,0.77,0.70,0.63,0.57,0.51,0.56,0.63,0.70,0.77,0.83,0.89,0.93,0.97,1.00,0.98,0.94,0.89,0.83,0.76,0.69,0.62,0.56,0.50,0.45,0.50,0.57,0.64,0.71,0.78,0.84,0.89,0.93,0.97,0.99,1.00,0.97,0.93,0.88,0.82,0.75,0.67,0.60,0.53,0.46,0.40,0.35,0.30,0.26,0.22,0.19,0.16,0.13,0.11,0.09,0.08,0.07,0.06,0.05,0.04,0.04,0.03,0.03]'::jsonb,
  false, 'approved', now()
);

-- ---- TRACK 10 ----
INSERT INTO tracks (
  id, creator_id, title, vocalist_type, genre, mood, bpm, key,
  length_seconds, license_type, license_limit, licenses_sold,
  price_non_exclusive, price_exclusive,
  artwork_url, listening_file_url,
  preview_clip_url, preview_clip_start, full_preview_url,
  acapella_url, instrumental_url,
  waveform_data, is_ai_generated, status, approved_at
) VALUES (
  gen_random_uuid(),
  'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8091',
  'Concrete Jungle',
  'male', 'Hip-Hop', 'Energetic', 95, 'F Minor',
  175, 'exclusive', NULL, 0,
  NULL, 449.99,
  '/placeholders/artwork-10.jpg',
  '/placeholders/listening-10.mp3',
  '/placeholders/preview-10.mp3', 30, '/placeholders/full-preview-10.mp3',
  '/placeholders/acapella-10.wav', '/placeholders/instrumental-10.wav',
  '[0.20,0.32,0.45,0.56,0.66,0.75,0.83,0.89,0.94,0.97,1.00,0.98,0.94,0.88,0.81,0.73,0.65,0.57,0.50,0.44,0.40,0.46,0.54,0.63,0.72,0.80,0.87,0.92,0.96,0.99,1.00,0.97,0.93,0.87,0.79,0.71,0.63,0.55,0.48,0.42,0.38,0.44,0.52,0.61,0.70,0.78,0.85,0.91,0.96,0.99,1.00,0.97,0.92,0.86,0.78,0.70,0.62,0.54,0.47,0.41,0.36,0.42,0.50,0.59,0.68,0.76,0.84,0.90,0.95,0.98,1.00,0.97,0.92,0.85,0.77,0.68,0.59,0.51,0.44,0.37,0.32,0.27,0.23,0.20,0.17,0.15,0.13,0.11,0.10,0.09,0.08,0.07,0.06,0.06,0.05,0.05,0.04,0.04,0.03,0.03]'::jsonb,
  false, 'approved', now()
);

-- ---- TRACK 11 ----
INSERT INTO tracks (
  id, creator_id, title, vocalist_type, genre, mood, bpm, key,
  length_seconds, license_type, license_limit, licenses_sold,
  price_non_exclusive, price_exclusive,
  artwork_url, listening_file_url,
  preview_clip_url, preview_clip_start, full_preview_url,
  acapella_url, instrumental_url,
  waveform_data, is_ai_generated, status, approved_at
) VALUES (
  gen_random_uuid(),
  'f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8091a2',
  'Digital Sunset',
  'female', 'EDM', 'Chill', 128, 'E Minor',
  230, 'unlimited', NULL, 0,
  49.99, 349.99,
  '/placeholders/artwork-11.jpg',
  '/placeholders/listening-11.mp3',
  '/placeholders/preview-11.mp3', 50, '/placeholders/full-preview-11.mp3',
  '/placeholders/acapella-11.wav', '/placeholders/instrumental-11.wav',
  '[0.06,0.11,0.17,0.24,0.32,0.40,0.48,0.56,0.63,0.70,0.76,0.82,0.87,0.91,0.94,0.97,0.99,1.00,0.99,0.97,0.94,0.90,0.85,0.80,0.74,0.68,0.62,0.57,0.52,0.48,0.53,0.59,0.66,0.73,0.79,0.85,0.90,0.94,0.97,0.99,1.00,0.98,0.95,0.91,0.86,0.80,0.74,0.68,0.62,0.56,0.51,0.47,0.52,0.58,0.65,0.72,0.78,0.84,0.89,0.93,0.96,0.99,1.00,0.98,0.95,0.90,0.85,0.79,0.73,0.66,0.60,0.54,0.48,0.43,0.39,0.35,0.32,0.29,0.27,0.25,0.23,0.22,0.20,0.19,0.17,0.16,0.15,0.13,0.12,0.11,0.10,0.09,0.08,0.07,0.06,0.06,0.05,0.04,0.04,0.03]'::jsonb,
  true, 'approved', now()
);

-- ---- TRACK 12 ----
INSERT INTO tracks (
  id, creator_id, title, vocalist_type, genre, mood, bpm, key,
  length_seconds, license_type, license_limit, licenses_sold,
  price_non_exclusive, price_exclusive,
  artwork_url, listening_file_url,
  preview_clip_url, preview_clip_start, full_preview_url,
  acapella_url, instrumental_url,
  waveform_data, is_ai_generated, status, approved_at
) VALUES (
  gen_random_uuid(),
  'f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8091a2',
  'Synthetic Love',
  'female', 'EDM', 'Romantic', 136, 'B Minor',
  205, 'limited', 100, 12,
  39.99, 249.99,
  '/placeholders/artwork-12.jpg',
  '/placeholders/listening-12.mp3',
  '/placeholders/preview-12.mp3', 25, '/placeholders/full-preview-12.mp3',
  '/placeholders/acapella-12.wav', '/placeholders/instrumental-12.wav',
  '[0.09,0.16,0.24,0.33,0.43,0.53,0.62,0.71,0.78,0.85,0.90,0.94,0.97,0.99,1.00,0.98,0.95,0.91,0.86,0.80,0.73,0.67,0.61,0.55,0.50,0.55,0.62,0.69,0.76,0.82,0.88,0.92,0.96,0.99,1.00,0.98,0.94,0.89,0.83,0.76,0.69,0.63,0.57,0.52,0.48,0.53,0.60,0.68,0.75,0.82,0.88,0.93,0.97,0.99,1.00,0.97,0.93,0.88,0.82,0.75,0.68,0.61,0.55,0.49,0.44,0.40,0.44,0.50,0.58,0.66,0.74,0.81,0.87,0.92,0.96,0.99,1.00,0.97,0.92,0.86,0.79,0.71,0.63,0.55,0.48,0.41,0.35,0.29,0.24,0.20,0.16,0.13,0.11,0.09,0.07,0.06,0.05,0.04,0.03,0.03]'::jsonb,
  true, 'approved', now()
);

-- ---- TRACK 13 ----
INSERT INTO tracks (
  id, creator_id, title, vocalist_type, genre, mood, bpm, key,
  length_seconds, license_type, license_limit, licenses_sold,
  price_non_exclusive, price_exclusive,
  lyrics, artwork_url, listening_file_url,
  preview_clip_url, preview_clip_start, full_preview_url,
  acapella_url, instrumental_url,
  waveform_data, is_ai_generated, status, approved_at
) VALUES (
  gen_random_uuid(),
  'f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8091a2',
  'Binary Stars',
  'male', 'Pop', 'Energetic', 132, 'D Major',
  188, 'unlimited', NULL, 0,
  55.99, 399.99,
  E'Verse 1:\nTwo worlds colliding in the data stream\nPixels forming more than what they seem\nWe are binary, we are one\nZero gravity, into the sun\n\nChorus:\nBinary stars, binary stars\nWe light up the universe from afar\nBinary stars, binary stars\nCoded in love, that''s who we are',
  '/placeholders/artwork-13.jpg',
  '/placeholders/listening-13.mp3',
  '/placeholders/preview-13.mp3', 15, '/placeholders/full-preview-13.mp3',
  '/placeholders/acapella-13.wav', '/placeholders/instrumental-13.wav',
  '[0.12,0.20,0.30,0.41,0.52,0.62,0.72,0.80,0.87,0.92,0.96,0.99,1.00,0.98,0.94,0.89,0.83,0.76,0.69,0.62,0.56,0.51,0.56,0.63,0.70,0.77,0.84,0.89,0.94,0.97,1.00,0.98,0.95,0.90,0.84,0.77,0.70,0.63,0.57,0.51,0.46,0.51,0.58,0.66,0.74,0.81,0.87,0.92,0.96,0.99,1.00,0.97,0.93,0.88,0.81,0.74,0.67,0.60,0.54,0.48,0.43,0.48,0.55,0.63,0.71,0.78,0.85,0.90,0.95,0.98,1.00,0.97,0.93,0.87,0.80,0.73,0.65,0.57,0.50,0.43,0.37,0.32,0.27,0.23,0.20,0.17,0.14,0.12,0.10,0.09,0.07,0.06,0.05,0.05,0.04,0.04,0.03,0.03,0.02,0.02]'::jsonb,
  true, 'approved', now()
);

-- ---- TRACK 14 ----
INSERT INTO tracks (
  id, creator_id, title, vocalist_type, genre, mood, bpm, key,
  length_seconds, license_type, license_limit, licenses_sold,
  price_non_exclusive, price_exclusive,
  artwork_url, listening_file_url,
  preview_clip_url, preview_clip_start, full_preview_url,
  acapella_url, instrumental_url,
  waveform_data, is_ai_generated, status, approved_at
) VALUES (
  gen_random_uuid(),
  'f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8091a2',
  'Cyber Rain',
  'female', 'EDM', 'Dark', 150, 'F# Minor',
  180, 'unlimited', NULL, 0,
  69.99, 449.99,
  '/placeholders/artwork-14.jpg',
  '/placeholders/listening-14.mp3',
  '/placeholders/preview-14.mp3', 20, '/placeholders/full-preview-14.mp3',
  '/placeholders/acapella-14.wav', '/placeholders/instrumental-14.wav',
  '[0.22,0.35,0.48,0.60,0.70,0.79,0.86,0.92,0.96,0.99,1.00,0.97,0.92,0.85,0.77,0.68,0.60,0.52,0.45,0.40,0.46,0.54,0.63,0.72,0.80,0.87,0.93,0.97,1.00,0.98,0.93,0.87,0.79,0.70,0.62,0.54,0.47,0.41,0.36,0.42,0.50,0.59,0.68,0.77,0.85,0.91,0.96,0.99,1.00,0.96,0.91,0.84,0.76,0.67,0.59,0.51,0.44,0.38,0.34,0.40,0.48,0.57,0.66,0.75,0.83,0.90,0.95,0.98,1.00,0.97,0.92,0.85,0.76,0.67,0.58,0.50,0.42,0.36,0.30,0.25,0.21,0.18,0.26,0.35,0.45,0.55,0.65,0.74,0.72,0.62,0.52,0.42,0.33,0.26,0.20,0.15,0.11,0.08,0.06,0.04]'::jsonb,
  true, 'approved', now()
);

-- ---- TRACK 15 ----
INSERT INTO tracks (
  id, creator_id, title, vocalist_type, genre, mood, bpm, key,
  length_seconds, license_type, license_limit, licenses_sold,
  price_non_exclusive, price_exclusive,
  artwork_url, listening_file_url,
  preview_clip_url, preview_clip_start, full_preview_url,
  acapella_url, instrumental_url,
  waveform_data, is_ai_generated, status, approved_at
) VALUES (
  gen_random_uuid(),
  'f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8091a2',
  'Pulse Wave',
  'male', 'EDM', 'Energetic', 160, 'A Minor',
  170, 'limited', 30, 0,
  79.99, 499.99,
  '/placeholders/artwork-15.jpg',
  '/placeholders/listening-15.mp3',
  '/placeholders/preview-15.mp3', 10, '/placeholders/full-preview-15.mp3',
  '/placeholders/acapella-15.wav', '/placeholders/instrumental-15.wav',
  '[0.25,0.38,0.50,0.62,0.73,0.82,0.89,0.94,0.98,1.00,0.98,0.93,0.86,0.78,0.69,0.60,0.52,0.45,0.40,0.36,0.42,0.50,0.60,0.70,0.79,0.87,0.93,0.97,1.00,0.98,0.93,0.86,0.78,0.69,0.60,0.52,0.45,0.39,0.35,0.41,0.49,0.58,0.68,0.77,0.85,0.91,0.96,0.99,1.00,0.97,0.92,0.85,0.76,0.67,0.58,0.50,0.43,0.37,0.33,0.39,0.47,0.56,0.66,0.75,0.83,0.90,0.95,0.99,1.00,0.97,0.91,0.84,0.75,0.66,0.57,0.49,0.42,0.36,0.31,0.27,0.33,0.41,0.50,0.60,0.69,0.78,0.85,0.80,0.70,0.60,0.50,0.40,0.32,0.25,0.19,0.15,0.11,0.08,0.06,0.04]'::jsonb,
  true, 'approved', now()
);

COMMIT;
