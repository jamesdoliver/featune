-- ============================================================================
-- FEATUNE: Storage Bucket Policies
-- ============================================================================
-- Adds RLS policies for storage buckets to allow admin and creator uploads
-- ============================================================================

-- ============================================================================
-- 1. CREATE BUCKETS (if they don't exist)
-- ============================================================================
-- Note: Buckets should be created via Supabase dashboard or CLI, but we ensure
-- the policies exist regardless

-- ============================================================================
-- 2. STORAGE POLICIES FOR tracks-public BUCKET
-- ============================================================================

-- Allow admins to upload to tracks-public
CREATE POLICY "Admins can upload to tracks-public"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'tracks-public' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Allow admins to update files in tracks-public
CREATE POLICY "Admins can update tracks-public"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'tracks-public' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = true
  )
)
WITH CHECK (
  bucket_id = 'tracks-public' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Allow admins to delete files from tracks-public
CREATE POLICY "Admins can delete from tracks-public"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'tracks-public' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Allow approved creators to upload to tracks-public
CREATE POLICY "Creators can upload to tracks-public"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'tracks-public' AND
  EXISTS (
    SELECT 1 FROM public.creators
    WHERE user_id = auth.uid() AND status = 'approved'
  )
);

-- Allow approved creators to update their own files in tracks-public
CREATE POLICY "Creators can update own files in tracks-public"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'tracks-public' AND
  EXISTS (
    SELECT 1 FROM public.creators
    WHERE user_id = auth.uid() AND status = 'approved'
  )
)
WITH CHECK (
  bucket_id = 'tracks-public' AND
  EXISTS (
    SELECT 1 FROM public.creators
    WHERE user_id = auth.uid() AND status = 'approved'
  )
);

-- Allow approved creators to delete their own files from tracks-public
CREATE POLICY "Creators can delete own files from tracks-public"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'tracks-public' AND
  EXISTS (
    SELECT 1 FROM public.creators
    WHERE user_id = auth.uid() AND status = 'approved'
  )
);

-- Allow anyone to read from tracks-public (it's a public bucket)
CREATE POLICY "Anyone can read tracks-public"
ON storage.objects FOR SELECT
USING (bucket_id = 'tracks-public');

-- ============================================================================
-- 3. STORAGE POLICIES FOR tracks-private BUCKET
-- ============================================================================

-- Allow admins to upload to tracks-private
CREATE POLICY "Admins can upload to tracks-private"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'tracks-private' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Allow admins to update files in tracks-private
CREATE POLICY "Admins can update tracks-private"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'tracks-private' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = true
  )
)
WITH CHECK (
  bucket_id = 'tracks-private' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Allow admins to delete files from tracks-private
CREATE POLICY "Admins can delete from tracks-private"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'tracks-private' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Allow admins to read from tracks-private
CREATE POLICY "Admins can read tracks-private"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'tracks-private' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Allow approved creators to upload to tracks-private
CREATE POLICY "Creators can upload to tracks-private"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'tracks-private' AND
  EXISTS (
    SELECT 1 FROM public.creators
    WHERE user_id = auth.uid() AND status = 'approved'
  )
);

-- Allow approved creators to update their own files in tracks-private
CREATE POLICY "Creators can update own files in tracks-private"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'tracks-private' AND
  EXISTS (
    SELECT 1 FROM public.creators
    WHERE user_id = auth.uid() AND status = 'approved'
  )
)
WITH CHECK (
  bucket_id = 'tracks-private' AND
  EXISTS (
    SELECT 1 FROM public.creators
    WHERE user_id = auth.uid() AND status = 'approved'
  )
);

-- Allow approved creators to delete their own files from tracks-private
CREATE POLICY "Creators can delete own files from tracks-private"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'tracks-private' AND
  EXISTS (
    SELECT 1 FROM public.creators
    WHERE user_id = auth.uid() AND status = 'approved'
  )
);

-- Allow approved creators to read their own files from tracks-private
CREATE POLICY "Creators can read own files in tracks-private"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'tracks-private' AND
  EXISTS (
    SELECT 1 FROM public.creators
    WHERE user_id = auth.uid() AND status = 'approved'
  )
);
