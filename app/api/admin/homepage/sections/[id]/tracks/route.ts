import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET: Get pinned tracks for a section
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id: sectionId } = await params
    const supabase = await createClient()
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

    const adminClient = createAdminClient()

    // Get pinned tracks with full track details
    const { data: pinnedTracks, error } = await adminClient
      .from('homepage_section_tracks')
      .select(
        `
        id,
        position,
        tracks!inner(
          id,
          title,
          artwork_url,
          genre,
          creators!inner(id, display_name)
        )
      `
      )
      .eq('section_id', sectionId)
      .order('position', { ascending: true })

    if (error) {
      console.error('Error fetching pinned tracks:', error)
      return NextResponse.json(
        { error: 'Failed to fetch pinned tracks' },
        { status: 500 }
      )
    }

    return NextResponse.json({ tracks: pinnedTracks ?? [] })
  } catch (err) {
    console.error('Error in GET section tracks:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT: Replace all pinned tracks for a section
// Body: { tracks: [{ track_id: string, position: number }] }
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: sectionId } = await params
    const supabase = await createClient()
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

    const body = await request.json()
    const { tracks } = body as {
      tracks: { track_id: string; position: number }[]
    }

    // Validate positions (1-4)
    if (tracks && tracks.length > 0) {
      for (const t of tracks) {
        if (t.position < 1 || t.position > 4) {
          return NextResponse.json(
            { error: 'Positions must be between 1 and 4' },
            { status: 400 }
          )
        }
      }

      // Check for duplicate positions
      const positions = tracks.map((t) => t.position)
      if (new Set(positions).size !== positions.length) {
        return NextResponse.json(
          { error: 'Duplicate positions are not allowed' },
          { status: 400 }
        )
      }

      // Check for duplicate track_ids
      const trackIds = tracks.map((t) => t.track_id)
      if (new Set(trackIds).size !== trackIds.length) {
        return NextResponse.json(
          { error: 'Duplicate tracks are not allowed' },
          { status: 400 }
        )
      }
    }

    const adminClient = createAdminClient()

    // Verify section exists
    const { data: section, error: sectionError } = await adminClient
      .from('homepage_sections')
      .select('id')
      .eq('id', sectionId)
      .single()

    if (sectionError || !section) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 })
    }

    // Delete all existing pinned tracks for this section
    const { error: deleteError } = await adminClient
      .from('homepage_section_tracks')
      .delete()
      .eq('section_id', sectionId)

    if (deleteError) {
      console.error('Error deleting existing tracks:', deleteError)
      return NextResponse.json(
        { error: 'Failed to update pinned tracks' },
        { status: 500 }
      )
    }

    // Insert new pinned tracks if any
    if (tracks && tracks.length > 0) {
      const inserts = tracks.map((t) => ({
        section_id: sectionId,
        track_id: t.track_id,
        position: t.position,
      }))

      const { error: insertError } = await adminClient
        .from('homepage_section_tracks')
        .insert(inserts)

      if (insertError) {
        console.error('Error inserting tracks:', insertError)
        return NextResponse.json(
          { error: 'Failed to pin tracks' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Error in PUT section tracks:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
