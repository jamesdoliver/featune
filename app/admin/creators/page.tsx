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

export default async function AdminCreatorsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch all creators ordered by created_at desc
  const { data: creators } = await supabase
    .from('creators')
    .select('id, user_id, display_name, bio, profile_image_url, revenue_split, status, created_at')
    .order('created_at', { ascending: false })

  // Fetch track counts for each creator
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

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-8 text-2xl font-bold tracking-tight text-text-primary">
        Creators
      </h1>

      <CreatorsList initialCreators={creatorsWithCounts} />
    </div>
  )
}
