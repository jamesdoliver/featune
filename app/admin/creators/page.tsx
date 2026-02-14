import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CreatorsList from './CreatorsList'

interface CreatorRow {
  id: string
  user_id: string
  display_name: string
  bio: string | null
  profile_image_url: string | null
  revenue_split: number
  status: string
  created_at: string
}

const PAGE_SIZE = 50

export default async function AdminCreatorsPage({
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

  // Fetch creators (paginated)
  const { data: creators, count } = await supabase
    .from('creators')
    .select('id, user_id, display_name, bio, profile_image_url, revenue_split, status, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  // Fetch track counts for each creator on this page
  const creatorIds = (creators ?? []).map((c: CreatorRow) => c.id)
  let trackCountMap: Record<string, number> = {}

  if (creatorIds.length > 0) {
    const { data: trackRows } = await supabase
      .from('tracks')
      .select('creator_id')
      .in('creator_id', creatorIds)

    if (trackRows) {
      for (const row of trackRows) {
        const cid = (row as { creator_id: string }).creator_id
        trackCountMap[cid] = (trackCountMap[cid] ?? 0) + 1
      }
    }
  }

  // Merge track counts
  const creatorsWithCounts = (creators ?? []).map((creator: CreatorRow) => ({
    ...creator,
    track_count: trackCountMap[creator.id] ?? 0,
  }))

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">
          Creators
          <span className="ml-2 text-base font-normal text-text-muted">({count ?? 0})</span>
        </h1>
      </div>

      <CreatorsList initialCreators={creatorsWithCounts} />

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          {page > 1 && (
            <a
              href={`/admin/creators?page=${page - 1}`}
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
              href={`/admin/creators?page=${page + 1}`}
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
