import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import TrackClient from './TrackClient'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()

  const { data: track } = await supabase
    .from('tracks')
    .select('title, genre, mood, artwork_url, creators!inner(display_name)')
    .eq('id', id)
    .eq('status', 'approved')
    .single()

  if (!track) {
    return { title: 'Track Not Found - FEATUNE' }
  }

  const creator = Array.isArray(track.creators)
    ? track.creators[0]
    : track.creators
  const creatorName = (creator as { display_name: string })?.display_name ?? 'Unknown'

  const title = `${track.title} by ${creatorName} - FEATUNE`
  const description = `Listen to and license ${track.title}. ${track.genre ?? ''} ${track.mood ?? ''} vocal topline by ${creatorName}.`.replace(/\s+/g, ' ').trim()

  const metadata: Metadata = { title, description }

  if (track.artwork_url) {
    metadata.openGraph = {
      title,
      description,
      images: [{ url: track.artwork_url }],
    }
  }

  return metadata
}

export default async function TrackPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: track } = await supabase
    .from('tracks')
    .select(`
      id, title, vocalist_type, genre, mood, bpm, key, length_seconds,
      license_type, license_limit, licenses_sold,
      price_non_exclusive, price_exclusive,
      lyrics, artwork_url, preview_clip_url, full_preview_url,
      waveform_data, is_ai_generated, status, created_at, approved_at,
      creators!inner(id, display_name, bio, profile_image_url)
    `)
    .eq('id', id)
    .eq('status', 'approved')
    .single()

  if (!track) {
    notFound()
  }

  // Supabase returns the joined creator as an array; normalize to a single object
  const creator = Array.isArray(track.creators) ? track.creators[0] : track.creators
  if (!creator) {
    notFound()
  }

  // Fetch related tracks (same genre, prioritize same mood)
  const { data: relatedTracksRaw } = await supabase
    .from('tracks')
    .select(`
      id, title, artwork_url, genre, mood, bpm, key,
      price_non_exclusive, price_exclusive, license_type,
      is_ai_generated, vocalist_type, preview_clip_url, full_preview_url,
      creators!inner(id, display_name)
    `)
    .eq('genre', track.genre)
    .eq('status', 'approved')
    .neq('id', id)
    .order('created_at', { ascending: false })
    .limit(8)

  // Sort to prioritize same mood, then take first 4
  const relatedTracks = (relatedTracksRaw ?? [])
    .sort((a, b) => {
      const aMoodMatch = a.mood === track.mood ? 0 : 1
      const bMoodMatch = b.mood === track.mood ? 0 : 1
      return aMoodMatch - bMoodMatch
    })
    .slice(0, 4)
    .map((t) => ({
      ...t,
      creators: Array.isArray(t.creators) ? t.creators[0] : t.creators,
    }))

  const trackData = {
    ...track,
    creators: creator as {
      id: string
      display_name: string
      bio: string | null
      profile_image_url: string | null
    },
  }

  return <TrackClient track={trackData} relatedTracks={relatedTracks} />
}
