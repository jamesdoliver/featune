import { createClient } from '@/lib/supabase/server'
import SubmissionsList from './SubmissionsList'

export interface PendingTrack {
  id: string
  title: string
  genre: string | null
  mood: string | null
  bpm: number | null
  key: string | null
  license_type: string
  price_non_exclusive: number | null
  price_exclusive: number | null
  artwork_url: string | null
  preview_clip_url: string | null
  full_preview_url: string | null
  is_ai_generated: boolean
  vocalist_type: string | null
  created_at: string
  creators: {
    id: string
    display_name: string
  }
}

export default async function SubmissionsPage() {
  const supabase = await createClient()

  const { data: rawTracks } = await supabase
    .from('tracks')
    .select(
      `
      id, title, genre, mood, bpm, key,
      license_type, price_non_exclusive, price_exclusive,
      artwork_url, preview_clip_url, full_preview_url,
      is_ai_generated, vocalist_type, created_at,
      creators!inner(id, display_name)
    `
    )
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  // Normalize Supabase join: creators comes back as an array type even with
  // !inner. Map it to the single-object shape.
  const tracks: PendingTrack[] = (rawTracks ?? []).map((track) => {
    const creatorsData = track.creators as unknown as
      | { id: string; display_name: string }
      | { id: string; display_name: string }[]
    const creatorObj = Array.isArray(creatorsData)
      ? creatorsData[0]
      : creatorsData
    return { ...track, creators: creatorObj } as PendingTrack
  })

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-8 text-2xl font-bold tracking-tight text-text-primary">
        Submissions
      </h1>

      <SubmissionsList initialTracks={tracks} />
    </div>
  )
}
