import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminTrackList from './AdminTrackList'

interface TrackRow {
  id: string
  title: string
  genre: string | null
  license_type: string | null
  price_non_exclusive: number | null
  artwork_url: string | null
  status: string
  created_at: string
  creators:
    | { id: string; display_name: string }
    | { id: string; display_name: string }[]
}

export interface AdminTrack {
  id: string
  title: string
  genre: string | null
  license_type: string | null
  price_non_exclusive: number | null
  artwork_url: string | null
  status: string
  created_at: string
  creator_name: string
}

export default async function AdminTracksPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: rawTracks, error } = await supabase
    .from('tracks')
    .select(
      'id, title, genre, license_type, price_non_exclusive, artwork_url, status, created_at, creators!inner(id, display_name)'
    )
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching tracks:', error)
  }

  const tracks: AdminTrack[] = ((rawTracks as TrackRow[] | null) ?? []).map(
    (track) => {
      const creator = Array.isArray(track.creators)
        ? track.creators[0]
        : track.creators

      return {
        id: track.id,
        title: track.title,
        genre: track.genre,
        license_type: track.license_type,
        price_non_exclusive: track.price_non_exclusive,
        artwork_url: track.artwork_url,
        status: track.status,
        created_at: track.created_at,
        creator_name: creator?.display_name ?? 'Unknown Creator',
      }
    }
  )

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="mb-8 text-2xl font-bold tracking-tight text-text-primary">
        All Tracks
      </h1>
      <AdminTrackList tracks={tracks} />
    </div>
  )
}
