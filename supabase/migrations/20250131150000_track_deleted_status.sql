-- Add 'deleted' to track status enum
-- This status is used for admin soft-deletes or creator deletion requests
-- Unlike 'removed' (triggered by exclusive sale), 'deleted' hides tracks from
-- both the store AND creator profile while preserving data/files for existing purchasers

ALTER TYPE track_status ADD VALUE 'deleted';
