import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  // Auth check
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Admin check
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Parse request body
  const body = await request.json()
  const { status, revenue_split } = body as {
    status?: string
    revenue_split?: number
  }

  // Validate inputs
  const updateFields: Record<string, unknown> = {}

  if (status !== undefined) {
    const validStatuses = ['pending', 'approved', 'rejected']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: pending, approved, rejected' },
        { status: 400 }
      )
    }
    updateFields.status = status
  }

  if (revenue_split !== undefined) {
    if (typeof revenue_split !== 'number' || revenue_split < 0.01 || revenue_split > 1.0) {
      return NextResponse.json(
        { error: 'Invalid revenue_split. Must be a number between 0.01 and 1.00' },
        { status: 400 }
      )
    }
    updateFields.revenue_split = revenue_split
  }

  if (Object.keys(updateFields).length === 0) {
    return NextResponse.json(
      { error: 'No valid fields to update. Provide status and/or revenue_split.' },
      { status: 400 }
    )
  }

  // Use admin client for writes to bypass RLS
  const adminSupabase = createAdminClient()

  const { data: updatedCreator, error } = await adminSupabase
    .from('creators')
    .update(updateFields)
    .eq('id', id)
    .select('id, user_id, display_name, bio, profile_image_url, revenue_split, payout_details, status, created_at')
    .single()

  if (error || !updatedCreator) {
    return NextResponse.json(
      { error: 'Failed to update creator' },
      { status: 500 }
    )
  }

  return NextResponse.json({ creator: updatedCreator })
}
