'use client'

import Link from 'next/link'
import { useCartStore } from '@/stores/cartStore'

interface ProductCardProps {
  track: {
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
  onPlay?: () => void
  showCreator?: boolean
}

function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`
}

export default function ProductCard({
  track,
  onPlay,
  showCreator = true,
}: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem)
  const openDrawer = useCartStore((state) => state.openDrawer)

  const handleAddToCart = () => {
    if (track.price_non_exclusive == null) return
    addItem({
      trackId: track.id,
      title: track.title,
      creatorName: track.creators.display_name,
      artworkUrl: track.artwork_url,
      licenseType: 'non_exclusive',
      price: track.price_non_exclusive,
    })
    openDrawer()
  }

  const tags: string[] = []
  if (track.genre) tags.push(track.genre)
  if (track.mood) tags.push(track.mood)

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-border-default bg-bg-card transition-colors hover:border-border-hover">
      {/* Artwork area */}
      <Link href={`/track/${track.id}`} className="relative aspect-square overflow-hidden">
        {track.artwork_url ? (
          <img
            src={track.artwork_url}
            alt={track.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-bg-elevated">
            {/* Music note icon placeholder */}
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
          </div>
        )}

        {/* Play button overlay */}
        {onPlay && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onPlay()
            }}
            className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100"
            aria-label={`Play ${track.title}`}
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent shadow-lg transition-transform duration-200 hover:scale-110">
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="white"
              >
                <path d="M6.5 3.5L16 10L6.5 16.5V3.5Z" />
              </svg>
            </span>
          </button>
        )}
      </Link>

      {/* Info section */}
      <div className="flex flex-1 flex-col gap-2 p-3">
        {/* Title */}
        <Link
          href={`/track/${track.id}`}
          className="truncate text-sm font-medium text-text-primary transition-colors hover:text-accent"
          title={track.title}
        >
          {track.title}
        </Link>

        {/* Creator name */}
        {showCreator && (
          <Link
            href={`/creator/${track.creators.id}`}
            className="truncate text-xs text-text-secondary transition-colors hover:text-text-primary"
          >
            {track.creators.display_name}
          </Link>
        )}

        {/* Tags: genre, mood, AI badge */}
        {(tags.length > 0 || track.is_ai_generated) && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-bg-elevated px-2 py-0.5 text-xs text-text-muted"
              >
                {tag}
              </span>
            ))}
            {track.is_ai_generated && (
              <span className="rounded-full bg-accent-muted px-2 py-0.5 text-xs font-medium text-accent">
                AI
              </span>
            )}
          </div>
        )}

        {/* Price */}
        {track.price_non_exclusive != null && (
          <p className="text-sm font-bold text-accent">
            {formatPrice(track.price_non_exclusive)}
          </p>
        )}
      </div>

      {/* Bottom section: metadata + add to cart */}
      <div className="flex items-center justify-between border-t border-border-default px-3 py-2">
        <div className="flex items-center gap-3 text-xs text-text-muted">
          {track.bpm != null && <span>{track.bpm} BPM</span>}
          {track.key && <span>{track.key}</span>}
        </div>

        {/* Add to cart button */}
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={track.price_non_exclusive == null}
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-border-default text-text-secondary transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border-default disabled:hover:text-text-secondary"
          aria-label={`Add ${track.title} to cart`}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>
    </div>
  )
}
