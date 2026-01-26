import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()

  // Auth check
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

  // Fetch all creators ordered by created_at desc
  const { data: creators, error: creatorsError } = await supabase
    .from('creators')
    .select('id, user_id, display_name, bio, profile_image_url, revenue_split, payout_details, status, created_at')
    .order('created_at', { ascending: false })

  if (creatorsError) {
    return NextResponse.json(
      { error: 'Failed to fetch creators' },
      { status: 500 }
    )
  }

  // Fetch track counts for each creator
  const creatorIds = (creators ?? []).map((c) => c.id)

  let trackCountMap: Record<string, number> = {}

  if (creatorIds.length > 0) {
    // Fetch track counts grouped by creator_id
    const { data: trackCounts, error: trackError } = await supabase
      .from('tracks')
      .select('creator_id')
      .in('creator_id', creatorIds)

    if (!trackError && trackCounts) {
      for (const row of trackCounts) {
        const cid = row.creator_id as string
        trackCountMap[cid] = (trackCountMap[cid] ?? 0) + 1
      }
    }
  }

  // Merge track counts into creators
  const creatorsWithCounts = (creators ?? []).map((creator) => ({
    ...creator,
    track_count: trackCountMap[creator.id] ?? 0,
  }))

  return NextResponse.json({ creators: creatorsWithCounts })
}
