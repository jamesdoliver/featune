import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * PATCH /api/creators/me/tracks/[id]
 *
 * Allows a creator to edit metadata on their own tracks.
 * Only permitted on tracks with status 'pending' or 'rejected'.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Auth check
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch creator record
    const { data: creator } = await supabase
      .from('creators')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!creator) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 })
    }

    // Fetch the track and verify ownership
    const { data: track } = await supabase
      .from('tracks')
      .select('id, creator_id, status')
      .eq('id', id)
      .single()

    if (!track) {
      return NextResponse.json({ error: 'Track not found' }, { status: 404 })
    }

    if (track.creator_id !== creator.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Only allow editing on pending or rejected tracks
    if (track.status !== 'pending' && track.status !== 'rejected') {
      return NextResponse.json(
        { error: 'Only pending or rejected tracks can be edited' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const updateData: Record<string, unknown> = {}

    // Text fields
    if (body.title !== undefined) updateData.title = body.title.trim()
    if (body.genre !== undefined) updateData.genre = body.genre || null
    if (body.mood !== undefined) updateData.mood = body.mood || null
    if (body.key !== undefined) updateData.key = body.key || null
    if (body.lyrics !== undefined) updateData.lyrics = body.lyrics || null
    if (body.vocalist_type !== undefined) updateData.vocalist_type = body.vocalist_type

    // Numeric fields
    if (body.bpm !== undefined) {
      updateData.bpm = body.bpm ? parseInt(body.bpm, 10) : null
    }
    if (body.price_non_exclusive !== undefined) {
      updateData.price_non_exclusive = body.price_non_exclusive
        ? parseFloat(body.price_non_exclusive)
        : null
    }
    if (body.price_exclusive !== undefined) {
      updateData.price_exclusive = body.price_exclusive
        ? parseFloat(body.price_exclusive)
        : null
    }

    // License fields
    if (body.license_type !== undefined) {
      updateData.license_type = body.license_type
    }
    if (body.license_limit !== undefined) {
      updateData.license_limit = body.license_limit
        ? parseInt(body.license_limit, 10)
        : null
    }

    // Boolean fields
    if (body.is_ai_generated !== undefined) {
      updateData.is_ai_generated = body.is_ai_generated
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      )
    }

    // If the track was rejected, resubmit it for review
    if (track.status === 'rejected') {
      updateData.status = 'pending'
      updateData.rejection_reason = null
    }

    const admin = createAdminClient()

    const { error } = await admin
      .from('tracks')
      .update(updateData)
      .eq('id', id)

    if (error) {
      console.error('Error updating track:', error)
      return NextResponse.json(
        { error: 'Failed to update track' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Creator track edit error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
