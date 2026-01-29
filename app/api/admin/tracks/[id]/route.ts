import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GET: Fetch a single track for editing (admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Auth check
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

    // Use admin client to fetch track (bypasses RLS)
    const adminClient = createAdminClient()

    const { data: track, error } = await adminClient
      .from('tracks')
      .select(`
        id, title, vocalist_type, genre, mood, bpm, key,
        license_type, license_limit, licenses_sold,
        price_non_exclusive, price_exclusive,
        lyrics, artwork_url, is_ai_generated, status,
        creator_id, created_at,
        creators(id, display_name)
      `)
      .eq('id', id)
      .single()

    if (error || !track) {
      return NextResponse.json({ error: 'Track not found' }, { status: 404 })
    }

    return NextResponse.json({ track })
  } catch (err) {
    console.error('Get track error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH: Update a track (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Auth check
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

    const body = await request.json()

    // Build update object with only provided fields
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

    // Artwork URL (if replaced)
    if (body.artwork_url !== undefined) {
      updateData.artwork_url = body.artwork_url || null
    }

    // Use admin client to bypass RLS
    const adminClient = createAdminClient()

    const { error } = await adminClient
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
    console.error('Update track error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
