import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendTrackRejectedEmail } from '@/lib/email'
import { logAdminAction } from '@/lib/audit'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Read rejection reason from body
    const body = await request.json()
    const reason: string | undefined = body?.reason

    const { user, error: authError } = await requireAdmin()
    if (authError) return authError

    // Use admin client to bypass RLS for the update
    const adminClient = createAdminClient()

    const { error } = await adminClient
      .from('tracks')
      .update({
        status: 'rejected',
        rejection_reason: reason ?? null,
      })
      .eq('id', id)

    if (error) {
      console.error('Error rejecting track:', error)
      return NextResponse.json(
        { error: 'Failed to reject track' },
        { status: 500 }
      )
    }

    logAdminAction(user.id, 'reject_track', 'track', id, { reason })

    // Fetch creator info and send rejection email (fire-and-forget)
    const { data: track } = await adminClient
      .from('tracks')
      .select('title, creator_id, creators(display_name, user_id, profiles(email))')
      .eq('id', id)
      .single()

    if (track?.creators) {
      const creator = track.creators as unknown as {
        display_name: string
        user_id: string
        profiles: { email: string }
      }
      sendTrackRejectedEmail({
        creatorEmail: creator.profiles.email,
        creatorName: creator.display_name,
        trackTitle: track.title,
        reason,
      })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Reject track error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
