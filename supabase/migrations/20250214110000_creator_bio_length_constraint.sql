-- Add length constraint on creator bio to prevent abuse
ALTER TABLE creators
  ADD CONSTRAINT creators_bio_max_length CHECK (char_length(bio) <= 2000);
