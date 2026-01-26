import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // Auth check
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is a creator
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_creator')
      .eq('id', user.id)
      .single()

    if (!profile?.is_creator) {
      return NextResponse.json(
        { error: 'Forbidden: not a creator' },
        { status: 403 }
      )
    }

    // Fetch creator record
    const { data: creator } = await supabase
      .from('creators')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!creator) {
      return NextResponse.json(
        { error: 'Creator record not found' },
        { status: 404 }
      )
    }

    // Fetch all tracks for this creator
    const { data: tracks, error } = await supabase
      .from('tracks')
      .select(
        `id, title, vocalist_type, genre, mood, bpm, key,
         license_type, license_limit, licenses_sold,
         price_non_exclusive, price_exclusive,
         artwork_url, status, created_at`
      )
      .eq('creator_id', creator.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching creator tracks:', error)
      return NextResponse.json(
        { error: 'Failed to fetch tracks' },
        { status: 500 }
      )
    }

    return NextResponse.json({ tracks: tracks ?? [] })
  } catch (err) {
    console.error('Creator tracks error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
