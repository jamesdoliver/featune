import { SupabaseClient } from '@supabase/supabase-js'

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

export interface RecommendedTrack {
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

export interface RecommendationsResult {
  tracks: RecommendedTrack[]
  hasHistory: boolean
}

function normalizeCreator(track: TrackRow): RecommendedTrack {
  const creatorsData = track.creators as
    | { id: string; display_name: string }
    | { id: string; display_name: string }[]
  const creatorObj = Array.isArray(creatorsData) ? creatorsData[0] : creatorsData
  return { ...track, creators: creatorObj }
}

export async function getRecommendations(
  supabase: SupabaseClient,
  userId: string | null
): Promise<RecommendationsResult> {
  if (!userId) {
    return { tracks: [], hasHistory: false }
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
    .eq('orders.user_id', userId)
    .eq('orders.status', 'completed')

  if (!orderItems || orderItems.length === 0) {
    return { tracks: [], hasHistory: false }
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
    return { tracks: [], hasHistory: true }
  }

  // Build query to find tracks matching user's preferences
  const purchasedIds = Array.from(purchasedTrackIds)
  const genreArray = Array.from(genres)
  const moodArray = Array.from(moods)

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
  if (genreArray.length > 0 && moodArray.length > 0) {
    query = query.or(`genre.in.(${genreArray.join(',')}),mood.in.(${moodArray.join(',')})`)
  } else if (genreArray.length > 0) {
    query = query.in('genre', genreArray)
  } else if (moodArray.length > 0) {
    query = query.in('mood', moodArray)
  }

  const { data: recommendedTracks, error } = await query

  if (error) {
    console.error('Error fetching recommendations:', error)
    return { tracks: [], hasHistory: true }
  }

  const normalizedTracks = ((recommendedTracks as TrackRow[] | null) ?? []).map(normalizeCreator)

  return {
    tracks: normalizedTracks,
    hasHistory: true,
  }
}
