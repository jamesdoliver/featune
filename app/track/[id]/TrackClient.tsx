'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePlayerStore, type PlayerTrack } from '@/stores/playerStore'
import { useCartStore } from '@/stores/cartStore'
import WaveformDisplay from '@/components/player/WaveformDisplay'

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

export default function TrackClient({ track }: TrackClientProps) {
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

  const addItem = useCartStore((state) => state.addItem)
  const openDrawer = useCartStore((state) => state.openDrawer)

  const handleAddToCart = (licenseType: 'non_exclusive' | 'exclusive') => {
    const price =
      licenseType === 'exclusive'
        ? track.price_exclusive
        : track.price_non_exclusive
    if (price == null) return
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

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
        {/* Left Column - Artwork, Waveform, Lyrics (60%) */}
        <div className="flex flex-col gap-6 lg:col-span-3">
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
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* Track Title & Creator */}
          <div>
            <h1 className="text-3xl font-bold text-text-primary">{track.title}</h1>
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
                  className="w-full rounded-lg bg-accent py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
                >
                  Add to Cart
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
                  className="w-full rounded-lg border border-accent bg-transparent py-3 text-sm font-semibold text-accent transition-colors hover:bg-accent hover:text-white"
                >
                  Buy Exclusive
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
    </div>
  )
}
