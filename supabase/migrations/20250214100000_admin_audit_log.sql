-- Admin audit log table
-- Records all admin actions for accountability and debugging

CREATE TABLE admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for querying by action time (most common access pattern)
CREATE INDEX idx_audit_log_created_at ON admin_audit_log(created_at DESC);

-- Index for filtering by entity
CREATE INDEX idx_audit_log_entity ON admin_audit_log(entity_type, entity_id);

-- RLS: only admins can read, inserts via service role key
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit log" ON admin_audit_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
    )
  );
