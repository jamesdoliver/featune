import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GET: List all homepage sections (including inactive, for admin)
export async function GET() {
  try {
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

    // Get all sections with pinned track counts
    const { data: sections, error } = await adminClient
      .from('homepage_sections')
      .select(
        `
        id,
        section_type,
        genre,
        title,
        display_order,
        is_active,
        created_at,
        updated_at,
        homepage_section_tracks(count)
      `
      )
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Error fetching sections:', error)
      return NextResponse.json(
        { error: 'Failed to fetch sections' },
        { status: 500 }
      )
    }

    // Transform to include pinned_count
    const sectionsWithCounts = (sections ?? []).map((section) => ({
      ...section,
      pinned_count: (section.homepage_section_tracks as { count: number }[])?.[0]?.count ?? 0,
      homepage_section_tracks: undefined,
    }))

    return NextResponse.json({ sections: sectionsWithCounts })
  } catch (err) {
    console.error('Error in GET sections:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST: Create a new genre section
export async function POST(request: NextRequest) {
  try {
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
    const { genre, title } = body

    if (!genre || !title) {
      return NextResponse.json(
        { error: 'Genre and title are required' },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()

    // Get the highest display_order to append at the end
    const { data: lastSection } = await adminClient
      .from('homepage_sections')
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1)
      .single()

    const newOrder = (lastSection?.display_order ?? 0) + 1

    // Create the new genre section
    const { data: newSection, error } = await adminClient
      .from('homepage_sections')
      .insert({
        section_type: 'genre',
        genre,
        title,
        display_order: newOrder,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating section:', error)
      return NextResponse.json(
        { error: 'Failed to create section' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, section: newSection })
  } catch (err) {
    console.error('Error in POST section:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
