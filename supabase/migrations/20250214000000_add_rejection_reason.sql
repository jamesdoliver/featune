-- Add rejection_reason column to tracks table so admins can explain why a
-- track was rejected. Nullable, only set when status = 'rejected'.
ALTER TABLE public.tracks
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT DEFAULT NULL;
