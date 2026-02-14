-- Atomic purchase function with row-level locking to prevent race conditions
-- on concurrent exclusive purchases
CREATE OR REPLACE FUNCTION public.process_track_purchase(
  p_track_id UUID,
  p_license_type TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_track RECORD;
  v_new_licenses_sold INTEGER;
  v_new_status TEXT;
BEGIN
  -- Lock the row (prevents concurrent modifications)
  SELECT id, status, license_type, license_limit, licenses_sold
  INTO v_track
  FROM tracks
  WHERE id = p_track_id
  FOR UPDATE;

  IF v_track IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Track not found');
  END IF;

  IF v_track.status NOT IN ('approved') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Track not available');
  END IF;

  v_new_licenses_sold := COALESCE(v_track.licenses_sold, 0) + 1;
  v_new_status := v_track.status::TEXT;

  -- Exclusive: mark as removed
  IF p_license_type = 'exclusive' THEN
    v_new_status := 'removed';
  -- Limited: check if sold out
  ELSIF v_track.license_type = 'limited'
    AND v_track.license_limit IS NOT NULL
    AND v_new_licenses_sold >= v_track.license_limit THEN
    v_new_status := 'sold_out';
  END IF;

  UPDATE tracks
  SET licenses_sold = v_new_licenses_sold, status = v_new_status::track_status
  WHERE id = p_track_id;

  RETURN jsonb_build_object(
    'success', true,
    'licenses_sold', v_new_licenses_sold,
    'new_status', v_new_status
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to service_role
GRANT EXECUTE ON FUNCTION public.process_track_purchase(UUID, TEXT) TO service_role;
