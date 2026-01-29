'use client'

import Link from 'next/link'
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

interface HomepageSectionProps {
  title: string
  sectionType: 'featured' | 'genre'
  genre?: string | null
  tracks: TrackData[]
}

export default function HomepageSection({
  title,
  sectionType,
  genre,
  tracks,
}: HomepageSectionProps) {
  const play = usePlayerStore((state) => state.play)

  // Build "View All" link based on section type
  const viewAllHref =
    sectionType === 'genre' && genre
      ? `/search?genre=${encodeURIComponent(genre)}`
      : '/search'

  if (tracks.length === 0) {
    return null // Don't render empty sections
  }

  return (
    <section className="py-10 first:pt-20">
      <div className="mx-auto max-w-7xl px-6">
        {/* Section header */}
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-2xl font-bold text-text-primary">{title}</h2>
          <Link
            href={viewAllHref}
            className="text-sm font-medium text-text-secondary transition-colors hover:text-accent"
          >
            View All
          </Link>
        </div>

        {/* Desktop: 4-column grid, Mobile: horizontal scroll */}
        <div className="relative">
          {/* Desktop grid */}
          <div className="hidden md:grid md:grid-cols-4 md:gap-5">
            {tracks.slice(0, 4).map((track) => (
              <ProductCard
                key={track.id}
                track={track}
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

          {/* Mobile horizontal scroll */}
          <div className="flex gap-4 overflow-x-auto pb-4 md:hidden snap-x snap-mandatory scrollbar-hide">
            {tracks.slice(0, 4).map((track) => (
              <div key={track.id} className="w-[280px] flex-shrink-0 snap-start">
                <ProductCard
                  track={track}
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
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
