import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Fixed platform creator user ID (from migration)
const PLATFORM_USER_ID = '00000000-0000-0000-0000-000000000001'

export async function POST(request: NextRequest) {
  try {
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

    // Parse request body
    const body = await request.json()

    // Use admin client to bypass RLS
    const adminClient = createAdminClient()

    // Get the platform creator ID
    const { data: platformCreator, error: creatorError } = await adminClient
      .from('creators')
      .select('id')
      .eq('user_id', PLATFORM_USER_ID)
      .single()

    if (creatorError || !platformCreator) {
      console.error('Platform creator not found:', creatorError)
      return NextResponse.json(
        { error: 'Platform creator not found. Please run the database migration.' },
        { status: 500 }
      )
    }

    // Generate track ID
    const trackId = crypto.randomUUID()

    // Create track record (admin uploads are auto-approved)
    const trackRecord = {
      id: trackId,
      creator_id: platformCreator.id,
      title: body.title,
      genre: body.genre || null,
      mood: body.mood || null,
      bpm: body.bpm ? parseInt(body.bpm, 10) : null,
      key: body.key || null,
      vocalist_type: body.vocalist_type,
      is_ai_generated: body.is_ai_generated ?? false,
      license_type: body.license_type,
      license_limit:
        body.license_type === 'limited'
          ? parseInt(body.license_limit, 10)
          : null,
      licenses_sold: 0,
      price_non_exclusive:
        body.license_type !== 'exclusive'
          ? parseFloat(body.price_non_exclusive)
          : null,
      price_exclusive: parseFloat(body.price_exclusive),
      lyrics: body.lyrics || null,
      preview_clip_start: body.preview_clip_start
        ? parseInt(body.preview_clip_start, 10)
        : 0,
      listening_file_url: body.listening_file_url || null,
      acapella_url: body.acapella_url || null,
      instrumental_url: body.instrumental_url || null,
      artwork_url: body.artwork_url || null,
      waveform_data: body.waveform_data || null,
      preview_clip_url: body.preview_clip_url || null,
      full_preview_url: body.full_preview_url || null,
      // Admin uploads are auto-approved
      status: 'approved' as const,
      approved_at: new Date().toISOString(),
    }

    const { error: insertError } = await adminClient
      .from('tracks')
      .insert(trackRecord)

    if (insertError) {
      console.error('Error creating track:', insertError)
      return NextResponse.json(
        { error: `Failed to create track: ${insertError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      trackId,
      message: 'Track created and approved',
    })
  } catch (err) {
    console.error('Admin track creation error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
