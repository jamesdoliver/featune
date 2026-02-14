import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { createAdminClient } from '@/lib/supabase/admin'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { user, error: authError } = await requireAdmin()
    if (authError) return authError

    // Use admin client to bypass RLS for the update
    const adminClient = createAdminClient()

    const { error } = await adminClient
      .from('tracks')
      .update({ status: 'removed' })
      .eq('id', id)

    if (error) {
      console.error('Error removing track:', error)
      return NextResponse.json(
        { error: 'Failed to remove track' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Remove track error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
