import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

interface TrackRow {
  id: string
  title: string
  artwork_url: string | null
  genre: string | null
  mood: string | null
  bpm: number | null
  key: string | null
  price_non_exclusive: number | null
  price_exclusive: number | null
  license_type: string
  is_ai_generated: boolean
  vocalist_type: string | null
  preview_clip_url: string | null
  full_preview_url: string | null
  creators: { id: string; display_name: string } | { id: string; display_name: string }[]
}

interface TrackData {
  id: string
  title: string
  artwork_url: string | null
  genre: string | null
  mood: string | null
  bpm: number | null
  key: string | null
  price_non_exclusive: number | null
  price_exclusive: number | null
  license_type: string
  is_ai_generated: boolean
  vocalist_type: string | null
  preview_clip_url: string | null
  full_preview_url: string | null
  creators: { id: string; display_name: string }
}

function normalizeCreator(track: TrackRow): TrackData {
  const creatorsData = track.creators as
    | { id: string; display_name: string }
    | { id: string; display_name: string }[]
  const creatorObj = Array.isArray(creatorsData) ? creatorsData[0] : creatorsData
  return { ...track, creators: creatorObj }
}

export async function GET() {
  const supabase = await createClient()

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ tracks: [], hasHistory: false })
  }

  // Get user's purchased track IDs and their genres/moods
  const { data: orderItems } = await supabase
    .from('order_items')
    .select(
      `
      track_id,
      orders!inner (
        user_id,
        status
      ),
      tracks!inner (
        id,
        genre,
        mood
      )
    `
    )
    .eq('orders.user_id', user.id)
    .eq('orders.status', 'completed')

  if (!orderItems || orderItems.length === 0) {
    return NextResponse.json({ tracks: [], hasHistory: false })
  }

  // Extract purchased track IDs and genres/moods
  const purchasedTrackIds = new Set<string>()
  const genres = new Set<string>()
  const moods = new Set<string>()

  for (const item of orderItems) {
    purchasedTrackIds.add(item.track_id)
    const tracksRaw = item.tracks as unknown
    const track = Array.isArray(tracksRaw)
      ? (tracksRaw[0] as { id: string; genre: string | null; mood: string | null })
      : (tracksRaw as { id: string; genre: string | null; mood: string | null })

    if (track.genre) genres.add(track.genre)
    if (track.mood) moods.add(track.mood)
  }

  // No preferences to base recommendations on
  if (genres.size === 0 && moods.size === 0) {
    return NextResponse.json({ tracks: [], hasHistory: true })
  }

  // Build query to find tracks matching user's preferences
  // Exclude already purchased tracks
  const purchasedIds = Array.from(purchasedTrackIds)
  const genreArray = Array.from(genres)
  const moodArray = Array.from(moods)

  // Query for tracks matching genres OR moods
  let query = supabase
    .from('tracks')
    .select(
      `
      id, title, artwork_url, genre, mood, bpm, key,
      price_non_exclusive, price_exclusive, license_type,
      is_ai_generated, vocalist_type, preview_clip_url, full_preview_url,
      creators!inner(id, display_name)
    `
    )
    .eq('status', 'approved')
    .not('id', 'in', `(${purchasedIds.join(',')})`)
    .order('created_at', { ascending: false })
    .limit(8)

  // Filter by genres or moods (combine with OR logic)
  // Use a combined filter approach
  if (genreArray.length > 0 && moodArray.length > 0) {
    // Get tracks matching either genre OR mood
    query = query.or(`genre.in.(${genreArray.join(',')}),mood.in.(${moodArray.join(',')})`)
  } else if (genreArray.length > 0) {
    query = query.in('genre', genreArray)
  } else if (moodArray.length > 0) {
    query = query.in('mood', moodArray)
  }

  const { data: recommendedTracks, error } = await query

  if (error) {
    console.error('Error fetching recommendations:', error)
    return NextResponse.json({ tracks: [], hasHistory: true })
  }

  const normalizedTracks = ((recommendedTracks as TrackRow[] | null) ?? []).map(
    normalizeCreator
  )

  return NextResponse.json({
    tracks: normalizedTracks,
    hasHistory: true,
  })
}
