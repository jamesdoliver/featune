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

const PAGE_SIZE = 50

export default async function AdminTracksPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const supabase = await createClient()
  const { page: pageParam } = await searchParams
  const page = Math.max(1, parseInt(pageParam || '1', 10))
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: rawTracks, error, count } = await supabase
    .from('tracks')
    .select(
      'id, title, genre, license_type, price_non_exclusive, artwork_url, status, created_at, creators!inner(id, display_name)',
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(from, to)

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

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">
          All Tracks
          <span className="ml-2 text-base font-normal text-text-muted">({count ?? 0})</span>
        </h1>
      </div>
      <AdminTrackList tracks={tracks} />

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          {page > 1 && (
            <a
              href={`/admin/tracks?page=${page - 1}`}
              className="rounded-lg border border-border-default px-3 py-1.5 text-sm text-text-secondary hover:bg-bg-elevated"
            >
              Previous
            </a>
          )}
          <span className="text-sm text-text-muted">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <a
              href={`/admin/tracks?page=${page + 1}`}
              className="rounded-lg border border-border-default px-3 py-1.5 text-sm text-text-secondary hover:bg-bg-elevated"
            >
              Next
            </a>
          )}
        </div>
      )}
    </div>
  )
}
