import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

interface AdminAuthResult {
  user: { id: string; email?: string }
  error?: never
}

interface AdminAuthError {
  user?: never
  error: NextResponse
}

/**
 * Verify the current request is from an authenticated admin user.
 *
 * Usage:
 * ```ts
 * const { user, error } = await requireAdmin()
 * if (error) return error
 * // user is guaranteed to be an admin
 * ```
 */
export async function requireAdmin(): Promise<AdminAuthResult | AdminAuthError> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }

  return { user: { id: user.id, email: user.email } }
}
