'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { usePlayerStore, type PlayerTrack } from '@/stores/playerStore'
import { useCartStore } from '@/stores/cartStore'
import WaveformDisplay from '@/components/player/WaveformDisplay'
import ProductCard from '@/components/tracks/ProductCard'

interface RelatedTrack {
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

interface TrackData {
  id: string
  title: string
  vocalist_type: string | null
  genre: string | null
  mood: string | null
  bpm: number | null
  key: string | null
  length_seconds: number | null
  license_type: string
  license_limit: number | null
  licenses_sold: number
  price_non_exclusive: number | null
  price_exclusive: number | null
  lyrics: string | null
  artwork_url: string | null
  preview_clip_url: string | null
  full_preview_url: string | null
  waveform_data: number[] | null
  is_ai_generated: boolean
  created_at: string
  creators: {
    id: string
    display_name: string
    bio: string | null
    profile_image_url: string | null
  }
}

interface TrackClientProps {
  track: TrackData
  relatedTracks?: RelatedTrack[]
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`
}

function getLicenseLabel(track: TrackData): string {
  if (track.license_type === 'unlimited') {
    return 'Unlimited licenses'
  }
  if (track.license_type === 'limited' && track.license_limit != null) {
    const remaining = track.license_limit - track.licenses_sold
    return `${track.licenses_sold} of ${track.license_limit} sold - ${remaining} remaining`
  }
  if (track.license_type === 'exclusive') {
    return 'Exclusive license'
  }
  return ''
}

export default function TrackClient({ track, relatedTracks = [] }: TrackClientProps) {
  const [lyricsExpanded, setLyricsExpanded] = useState(false)

  const play = usePlayerStore((state) => state.play)
  const pause = usePlayerStore((state) => state.pause)
  const currentTrack = usePlayerStore((state) => state.currentTrack)
  const isPlaying = usePlayerStore((state) => state.isPlaying)

  const isThisTrack = currentTrack?.id === track.id
  const isThisPlaying = isThisTrack && isPlaying

  const handlePlayPause = () => {
    if (isThisPlaying) {
      pause()
    } else if (isThisTrack) {
      play()
    } else {
      const playerTrack: PlayerTrack = {
        id: track.id,
        title: track.title,
        creatorName: track.creators.display_name,
        artworkUrl: track.artwork_url,
        previewUrl: track.full_preview_url || track.preview_clip_url || '',
      }
      play(playerTrack)
    }
  }

  const cartItems = useCartStore((state) => state.items)
  const addItem = useCartStore((state) => state.addItem)
  const openDrawer = useCartStore((state) => state.openDrawer)

  const handleAddToCart = (licenseType: 'non_exclusive' | 'exclusive') => {
    // Check if limited license is sold out
    if (
      track.license_type === 'limited' &&
      track.license_limit != null &&
      track.licenses_sold >= track.license_limit
    ) {
      toast.error('This track is sold out')
      return
    }

    const price =
      licenseType === 'exclusive'
        ? track.price_exclusive
        : track.price_non_exclusive
    if (price == null) return

    // Check if track is already in cart with a different license type
    const existingItem = cartItems.find((item) => item.trackId === track.id)
    if (existingItem && existingItem.licenseType !== licenseType) {
      const oldType = existingItem.licenseType === 'exclusive' ? 'Exclusive' : 'Non-Exclusive'
      const newType = licenseType === 'exclusive' ? 'Exclusive' : 'Non-Exclusive'
      toast.info(`Replaced ${oldType} with ${newType} license`)
    } else if (existingItem) {
      toast.info('Track is already in your cart')
      openDrawer()
      return
    } else {
      toast.success('Added to cart')
    }

    addItem({
      trackId: track.id,
      title: track.title,
      creatorName: track.creators.display_name,
      artworkUrl: track.artwork_url,
      licenseType,
      price,
    })
    openDrawer()
  }

  // Build metadata tags
  const tags: { label: string; accent?: boolean }[] = []
  if (track.genre) tags.push({ label: track.genre })
  if (track.mood) tags.push({ label: track.mood })
  if (track.vocalist_type) {
    tags.push({ label: track.vocalist_type === 'male' ? 'Male Vocal' : 'Female Vocal' })
  }
  if (track.is_ai_generated) {
    tags.push({ label: 'AI Generated', accent: true })
  } else {
    tags.push({ label: 'Human Vocal' })
  }

  const licenseLabel = getLicenseLabel(track)

  // Check if limited license is sold out
  const isSoldOut =
    track.license_type === 'limited' &&
    track.license_limit != null &&
    track.licenses_sold >= track.license_limit

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5 lg:gap-8">
        {/* Left Column - Artwork, Waveform, Lyrics (60%) */}
        <div className="flex flex-col gap-4 sm:gap-6 lg:col-span-3">
          {/* Artwork */}
          <div className="aspect-square w-full overflow-hidden rounded-xl border border-border-default">
            {track.artwork_url ? (
              <img
                src={track.artwork_url}
                alt={track.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-bg-elevated">
                <svg
                  width="96"
                  height="96"
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
                  <circle cx="6" cy="18" r="3" stroke="currentColor" strokeWidth="1.5" />
                  <circle cx="18" cy="16" r="3" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </div>
            )}
          </div>

          {/* Waveform + Play Button */}
          <div className="rounded-xl border border-border-default bg-bg-card p-4">
            <div className="mb-4 flex items-center gap-4">
              {/* Play/Pause Button */}
              <button
                type="button"
                onClick={handlePlayPause}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent transition-colors hover:bg-accent-hover"
                aria-label={isThisPlaying ? `Pause ${track.title}` : `Play ${track.title}`}
              >
                {isThisPlaying ? (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="white">
                    <rect x="5" y="3" width="4" height="14" rx="1" />
                    <rect x="11" y="3" width="4" height="14" rx="1" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="white">
                    <path d="M6.5 3.5L16 10L6.5 16.5V3.5Z" />
                  </svg>
                )}
              </button>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-text-primary">{track.title}</p>
                <p className="truncate text-xs text-text-secondary">
                  {track.creators.display_name}
                </p>
              </div>
            </div>

            {/* Waveform Display */}
            {track.waveform_data && track.waveform_data.length > 0 ? (
              <WaveformDisplay waveformData={track.waveform_data} trackId={track.id} />
            ) : (
              <div className="flex h-20 items-center justify-center rounded-lg bg-bg-elevated">
                <p className="text-xs text-text-muted">No waveform available</p>
              </div>
            )}
          </div>

          {/* Lyrics Section */}
          {track.lyrics && (
            <div className="rounded-xl border border-border-default bg-bg-card p-4">
              <button
                type="button"
                onClick={() => setLyricsExpanded(!lyricsExpanded)}
                className="flex w-full items-center justify-between"
              >
                <h3 className="text-sm font-semibold text-text-primary">Lyrics</h3>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  className={`text-text-muted transition-transform duration-200 ${
                    lyricsExpanded ? 'rotate-180' : ''
                  }`}
                >
                  <path
                    d="M4 6L8 10L12 6"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              {lyricsExpanded && (
                <pre className="mt-4 whitespace-pre-wrap font-sans text-sm leading-relaxed text-text-secondary">
                  {track.lyrics}
                </pre>
              )}
            </div>
          )}
        </div>

        {/* Right Column - Details & Pricing (40%) */}
        <div className="flex flex-col gap-4 sm:gap-6 lg:col-span-2">
          {/* Track Title & Creator */}
          <div>
            <h1 className="text-2xl font-bold text-text-primary sm:text-3xl">{track.title}</h1>
            <Link
              href={`/creator/${track.creators.id}`}
              className="mt-1 inline-block text-base text-text-secondary transition-colors hover:text-accent"
            >
              by {track.creators.display_name}
            </Link>
          </div>

          {/* Metadata Tags */}
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag.label}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  tag.accent
                    ? 'bg-accent-muted text-accent'
                    : 'bg-bg-elevated text-text-muted'
                }`}
              >
                {tag.label}
              </span>
            ))}
          </div>

          {/* Track Details */}
          <div className="rounded-xl border border-border-default bg-bg-card p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-muted">
              Track Details
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {track.bpm != null && (
                <div>
                  <p className="text-xs text-text-muted">BPM</p>
                  <p className="text-sm font-medium text-text-primary">{track.bpm}</p>
                </div>
              )}
              {track.key && (
                <div>
                  <p className="text-xs text-text-muted">Key</p>
                  <p className="text-sm font-medium text-text-primary">{track.key}</p>
                </div>
              )}
              {track.length_seconds != null && (
                <div>
                  <p className="text-xs text-text-muted">Duration</p>
                  <p className="text-sm font-medium text-text-primary">
                    {formatDuration(track.length_seconds)}
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs text-text-muted">License Type</p>
                <p className="text-sm font-medium capitalize text-text-primary">
                  {track.license_type}
                </p>
              </div>
            </div>
          </div>

          {/* License Status Badge */}
          {licenseLabel && (
            <div className="rounded-lg border border-border-default bg-bg-elevated px-4 py-2">
              <p className="text-xs text-text-secondary">{licenseLabel}</p>
            </div>
          )}

          {/* Pricing & Add to Cart */}
          <div className="rounded-xl border border-border-default bg-bg-card p-4">
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-text-muted">
              Pricing
            </h3>

            {/* Non-Exclusive */}
            {track.price_non_exclusive != null && (
              <div className="mb-4">
                <div className="mb-2 flex items-baseline justify-between">
                  <span className="text-sm text-text-secondary">Non-Exclusive License</span>
                  <span className="text-lg font-bold text-accent">
                    {formatPrice(track.price_non_exclusive)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleAddToCart('non_exclusive')}
                  disabled={isSoldOut}
                  className={`w-full rounded-lg py-3.5 text-sm font-semibold transition-colors sm:py-3 ${
                    isSoldOut
                      ? 'cursor-not-allowed bg-bg-elevated text-text-muted'
                      : 'bg-accent text-white hover:bg-accent-hover'
                  }`}
                >
                  {isSoldOut ? 'Sold Out' : 'Add to Cart'}
                </button>
              </div>
            )}

            {/* Exclusive */}
            {track.price_exclusive != null && (
              <div
                className={
                  track.price_non_exclusive != null
                    ? 'border-t border-border-default pt-4'
                    : ''
                }
              >
                <div className="mb-2 flex items-baseline justify-between">
                  <span className="text-sm text-text-secondary">Exclusive License</span>
                  <span className="text-lg font-bold text-accent">
                    {formatPrice(track.price_exclusive)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleAddToCart('exclusive')}
                  disabled={isSoldOut}
                  className={`w-full rounded-lg border py-3.5 text-sm font-semibold transition-colors sm:py-3 ${
                    isSoldOut
                      ? 'cursor-not-allowed border-border-default bg-transparent text-text-muted'
                      : 'border-accent bg-transparent text-accent hover:bg-accent hover:text-white'
                  }`}
                >
                  {isSoldOut ? 'Sold Out' : 'Buy Exclusive'}
                </button>
              </div>
            )}

            {/* Fallback if no prices */}
            {track.price_non_exclusive == null && track.price_exclusive == null && (
              <p className="text-sm text-text-muted">Price not available</p>
            )}
          </div>

          {/* Additional Info */}
          <div className="text-xs text-text-muted">
            <p>
              Includes: Acapella (WAV), Instrumental, Lyrics
            </p>
            <p className="mt-1">
              License PDF generated upon purchase
            </p>
          </div>
        </div>
      </div>

      {/* Related Tracks Section */}
      {relatedTracks.length > 0 && (
        <div className="mt-8 border-t border-border-default pt-8 sm:mt-12 sm:pt-12">
          <h2 className="mb-6 text-xl font-bold text-text-primary sm:text-2xl">
            You Might Also Like
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
            {relatedTracks.map((relatedTrack) => (
              <ProductCard
                key={relatedTrack.id}
                track={relatedTrack}
                onPlay={() => {
                  const playerTrack: PlayerTrack = {
                    id: relatedTrack.id,
                    title: relatedTrack.title,
                    creatorName: relatedTrack.creators.display_name,
                    artworkUrl: relatedTrack.artwork_url,
                    previewUrl: relatedTrack.full_preview_url || relatedTrack.preview_clip_url || '',
                  }
                  play(playerTrack)
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
