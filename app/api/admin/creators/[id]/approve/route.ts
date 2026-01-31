import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendCreatorApprovedEmail } from '@/lib/email'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: creatorId } = await params
    const supabase = await createClient()

    // Auth check - must be admin
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get creator details
    const admin = createAdminClient()
    const { data: creator, error: fetchError } = await admin
      .from('creators')
      .select('id, user_id, display_name, status')
      .eq('id', creatorId)
      .single()

    if (fetchError || !creator) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 })
    }

    if (creator.status === 'approved') {
      return NextResponse.json({ error: 'Creator is already approved' }, { status: 400 })
    }

    // Update creator status to approved
    const { error: updateError } = await admin
      .from('creators')
      .update({ status: 'approved' })
      .eq('id', creatorId)

    if (updateError) {
      console.error('Creator update error:', updateError)
      return NextResponse.json({ error: 'Failed to approve creator' }, { status: 500 })
    }

    // Get user email for notification
    const { data: creatorProfile } = await admin
      .from('profiles')
      .select('email')
      .eq('id', creator.user_id)
      .single()

    // Send welcome email to creator (non-blocking)
    if (creatorProfile?.email) {
      sendCreatorApprovedEmail({
        to: creatorProfile.email,
        creatorName: creator.display_name,
      }).catch(() => {})
    }

    return NextResponse.json({ success: true, message: 'Creator approved' })
  } catch (err) {
    console.error('Approve creator error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
