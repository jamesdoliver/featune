'use client'

import { useState } from 'react'
import { usePlayerStore, type PlayerTrack } from '@/stores/playerStore'
import type { PendingTrack } from './page'

interface SubmissionsListProps {
  initialTracks: PendingTrack[]
}

export default function SubmissionsList({
  initialTracks,
}: SubmissionsListProps) {
  const [tracks, setTracks] = useState<PendingTrack[]>(initialTracks)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const play = usePlayerStore((state) => state.play)

  async function handleApprove(trackId: string) {
    setLoadingId(trackId)
    try {
      const res = await fetch(`/api/admin/tracks/${trackId}/approve`, {
        method: 'PATCH',
      })
      if (res.ok) {
        // Optimistic: remove from list
        setTracks((prev) => prev.filter((t) => t.id !== trackId))
      } else {
        const data = await res.json()
        alert(data.error ?? 'Failed to approve track')
      }
    } catch {
      alert('Network error. Please try again.')
    } finally {
      setLoadingId(null)
    }
  }

  async function handleReject(trackId: string) {
    setLoadingId(trackId)
    try {
      const res = await fetch(`/api/admin/tracks/${trackId}/reject`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason.trim() || undefined }),
      })
      if (res.ok) {
        // Optimistic: remove from list
        setTracks((prev) => prev.filter((t) => t.id !== trackId))
        setRejectingId(null)
        setRejectReason('')
      } else {
        const data = await res.json()
        alert(data.error ?? 'Failed to reject track')
      }
    } catch {
      alert('Network error. Please try again.')
    } finally {
      setLoadingId(null)
    }
  }

  function handlePlay(track: PendingTrack) {
    const playerTrack: PlayerTrack = {
      id: track.id,
      title: track.title,
      creatorName: track.creators.display_name,
      artworkUrl: track.artwork_url,
      previewUrl: track.full_preview_url || track.preview_clip_url || '',
    }
    play(playerTrack)
  }

  if (tracks.length === 0) {
    return (
      <div className="rounded-xl border border-border-default bg-bg-elevated p-12 text-center">
        <InboxIcon className="mx-auto mb-4 h-10 w-10 text-text-muted" />
        <p className="text-lg font-medium text-text-secondary">
          No pending submissions
        </p>
        <p className="mt-1 text-sm text-text-muted">
          All tracks have been reviewed. Check back later.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {tracks.map((track) => {
        const isLoading = loadingId === track.id
        const isRejecting = rejectingId === track.id

        const tags: string[] = []
        if (track.genre) tags.push(track.genre)
        if (track.mood) tags.push(track.mood)
        if (track.bpm != null) tags.push(`${track.bpm} BPM`)
        if (track.key) tags.push(track.key)

        return (
          <div
            key={track.id}
            className="rounded-xl border border-border-default bg-bg-elevated p-5 transition-colors hover:border-border-hover"
          >
            <div className="flex gap-4">
              {/* Artwork thumbnail */}
              <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg">
                {track.artwork_url ? (
                  <img
                    src={track.artwork_url}
                    alt={track.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-bg-card">
                    <MusicNoteIcon className="h-8 w-8 text-text-muted" />
                  </div>
                )}

                {/* Play overlay */}
                {(track.full_preview_url || track.preview_clip_url) && (
                  <button
                    type="button"
                    onClick={() => handlePlay(track)}
                    className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity hover:opacity-100"
                    aria-label={`Play ${track.title}`}
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent">
                      <PlayIcon className="h-4 w-4 text-white" />
                    </span>
                  </button>
                )}
              </div>

              {/* Track info */}
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-semibold text-text-primary">
                      {track.title}
                    </h3>
                    <p className="text-sm text-text-secondary">
                      {track.creators.display_name}
                    </p>
                  </div>

                  {/* AI badge */}
                  {track.is_ai_generated && (
                    <span className="flex-shrink-0 rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent">
                      AI
                    </span>
                  )}
                </div>

                {/* Tags */}
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-bg-card px-2.5 py-0.5 text-xs text-text-muted"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* License + Prices */}
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span className="capitalize text-text-secondary">
                    {track.license_type.replace('_', ' ')}
                  </span>
                  {track.price_non_exclusive != null && (
                    <span className="font-medium text-text-primary">
                      ${track.price_non_exclusive.toFixed(2)}
                    </span>
                  )}
                  {track.price_exclusive != null && (
                    <span className="text-text-muted">
                      Excl. ${track.price_exclusive.toFixed(2)}
                    </span>
                  )}
                </div>

                {/* Submitted date */}
                <p className="text-xs text-text-muted">
                  Submitted{' '}
                  {new Date(track.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-4 flex items-center gap-3 border-t border-border-default pt-4">
              <button
                type="button"
                onClick={() => handleApprove(track.id)}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 rounded-lg bg-success/20 px-4 py-2 text-sm font-medium text-success transition-colors hover:bg-success/30 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <CheckIcon className="h-4 w-4" />
                Approve
              </button>

              <button
                type="button"
                onClick={() => {
                  if (isRejecting) {
                    setRejectingId(null)
                    setRejectReason('')
                  } else {
                    setRejectingId(track.id)
                  }
                }}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 rounded-lg bg-error/20 px-4 py-2 text-sm font-medium text-error transition-colors hover:bg-error/30 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <XIcon className="h-4 w-4" />
                Reject
              </button>

              {/* Play button (text link style) */}
              {(track.full_preview_url || track.preview_clip_url) && (
                <button
                  type="button"
                  onClick={() => handlePlay(track)}
                  className="ml-auto inline-flex items-center gap-1.5 text-sm text-text-secondary transition-colors hover:text-accent"
                >
                  <PlayIcon className="h-4 w-4" />
                  Play Preview
                </button>
              )}
            </div>

            {/* Rejection reason input (inline) */}
            {isRejecting && (
              <div className="mt-3 space-y-3">
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Reason for rejection (optional)..."
                  rows={3}
                  className="w-full resize-none rounded-lg border border-border-default bg-bg-card px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleReject(track.id)}
                    disabled={isLoading}
                    className="rounded-lg bg-error px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-error/90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isLoading ? 'Rejecting...' : 'Confirm Rejection'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRejectingId(null)
                      setRejectReason('')
                    }}
                    className="rounded-lg border border-border-default px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:border-border-hover hover:text-text-primary"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

/* --- Icon Components --- */

function InboxIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
      <path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" />
    </svg>
  )
}

function MusicNoteIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  )
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path d="M6.5 3.5L16 10L6.5 16.5V3.5Z" />
    </svg>
  )
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}
