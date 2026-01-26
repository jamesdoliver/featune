import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendTrackRejectedEmail } from '@/lib/email'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Read rejection reason from body
    const body = await request.json()
    const reason: string | undefined = body?.reason

    // Auth check using session client
    const supabase = await createClient()
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
