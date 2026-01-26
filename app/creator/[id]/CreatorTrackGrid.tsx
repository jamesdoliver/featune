'use client'

import ProductCard from '@/components/tracks/ProductCard'
import { usePlayerStore } from '@/stores/playerStore'

interface Track {
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

interface CreatorTrackGridProps {
  tracks: Track[]
}

export default function CreatorTrackGrid({ tracks }: CreatorTrackGridProps) {
  const play = usePlayerStore((state) => state.play)

  if (tracks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          className="text-text-muted"
        >
          <path
            d="M9 18V5l12-2v13"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle
            cx="6"
            cy="18"
            r="3"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <circle
            cx="18"
            cy="16"
            r="3"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </svg>
        <p className="mt-4 text-text-secondary">No tracks yet</p>
        <p className="mt-1 text-sm text-text-muted">
          This creator hasn&apos;t published any tracks.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {tracks.map((track) => (
        <ProductCard
          key={track.id}
          track={track}
          showCreator={false}
          onPlay={() =>
            play({
              id: track.id,
              title: track.title,
              creatorName: track.creators.display_name,
              artworkUrl: track.artwork_url,
              previewUrl:
                track.full_preview_url || track.preview_clip_url || '',
            })
          }
        />
      ))}
    </div>
  )
}
