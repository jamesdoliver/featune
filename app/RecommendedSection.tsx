'use client'

import Link from 'next/link'
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

interface RecommendedSectionProps {
  tracks: Track[]
  hasHistory: boolean
}

export default function RecommendedSection({ tracks, hasHistory }: RecommendedSectionProps) {
  const play = usePlayerStore((state) => state.play)

  // Don't show anything if no history or no recommendations
  if (!hasHistory || tracks.length === 0) {
    return null
  }

  return (
    <section className="py-12 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-6 flex items-center justify-between sm:mb-10">
          <h2 className="text-xl font-bold text-text-primary sm:text-2xl">
            Recommended For You
          </h2>
          <Link
            href="/search"
            className="text-sm font-medium text-accent transition-colors hover:text-accent-hover"
          >
            Browse All
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {tracks.map((track) => (
            <ProductCard
              key={track.id}
              track={track}
              showCreator
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
      </div>
    </section>
  )
}
