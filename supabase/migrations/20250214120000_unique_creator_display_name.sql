-- Add unique constraint on creator display_name to prevent duplicates
ALTER TABLE creators
  ADD CONSTRAINT creators_display_name_unique UNIQUE (display_name);
