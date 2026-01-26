'use client'

import ProductCard from '@/components/tracks/ProductCard'
import { usePlayerStore } from '@/stores/playerStore'

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
  creators: {
    id: string
    display_name: string
  }
}

interface HomeTrackGridProps {
  tracks: TrackData[]
}

export default function HomeTrackGrid({ tracks }: HomeTrackGridProps) {
  const play = usePlayerStore((state) => state.play)

  if (tracks.length === 0) {
    return (
      <p className="text-center text-text-muted py-12">
        No tracks available yet. Check back soon!
      </p>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {tracks.map((track) => (
        <ProductCard
          key={track.id}
          track={track}
          onPlay={() =>
            play({
              id: track.id,
              title: track.title,
              creatorName: track.creators.display_name,
              artworkUrl: track.artwork_url,
              previewUrl: track.full_preview_url || track.preview_clip_url || '',
            })
          }
        />
      ))}
    </div>
  )
}
