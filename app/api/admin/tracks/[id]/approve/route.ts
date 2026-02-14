import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendTrackApprovedEmail } from '@/lib/email'
import { logAdminAction } from '@/lib/audit'
import { revalidatePath } from 'next/cache'

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
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) {
      console.error('Error approving track:', error)
      return NextResponse.json(
        { error: 'Failed to approve track' },
        { status: 500 }
      )
    }

    logAdminAction(user.id, 'approve_track', 'track', id)

    // Fetch creator info and send approval email (fire-and-forget)
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
      sendTrackApprovedEmail({
        creatorEmail: creator.profiles.email,
        creatorName: creator.display_name,
        trackTitle: track.title,
        trackId: id,
      })
    }

    revalidatePath('/')

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Approve track error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
