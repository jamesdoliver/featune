import { createAdminClient } from '@/lib/supabase/admin'

export async function logAdminAction(
  adminUserId: string,
  action: string,
  entityType: string,
  entityId?: string,
  details?: Record<string, unknown>
): Promise<void> {
  try {
    const supabase = createAdminClient()
    await supabase.from('admin_audit_log').insert({
      admin_user_id: adminUserId,
      action,
      entity_type: entityType,
      entity_id: entityId ?? null,
      details: details ?? {},
    })
  } catch (error) {
    // Log but don't throw - audit failures should never break admin operations
    console.error('Failed to write audit log:', error)
  }
}
