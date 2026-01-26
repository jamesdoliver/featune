import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Creator, Track } from '@/lib/types/database'
import TrackList from './TrackList'

export default async function MyTracksPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch creator record
  const { data: creator } = await supabase
    .from('creators')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!creator) {
    redirect('/dashboard/apply')
  }

  // Fetch all tracks for this creator
  const { data: tracks } = await supabase
    .from('tracks')
    .select(
      `id, title, vocalist_type, genre, mood, bpm, key,
       license_type, license_limit, licenses_sold,
       price_non_exclusive, price_exclusive,
       artwork_url, status, created_at`
    )
    .eq('creator_id', (creator as Creator).id)
    .order('created_at', { ascending: false })

  return <TrackList tracks={(tracks as Track[]) ?? []} />
}
