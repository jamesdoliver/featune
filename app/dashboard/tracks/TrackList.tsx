'use client'

import Link from 'next/link'
import Image from 'next/image'
import type { Track } from '@/lib/types/database'

interface TrackListProps {
  tracks: Track[]
}

const statusStyles: Record<
  Track['status'],
  { bg: string; text: string; label: string }
> = {
  pending: {
    bg: 'bg-warning/20',
    text: 'text-warning',
    label: 'Pending',
  },
  approved: {
    bg: 'bg-success/20',
    text: 'text-success',
    label: 'Approved',
  },
  rejected: {
    bg: 'bg-error/20',
    text: 'text-error',
    label: 'Rejected',
  },
  sold_out: {
    bg: 'bg-bg-elevated',
    text: 'text-text-muted',
    label: 'Sold Out',
  },
  removed: {
    bg: 'bg-bg-elevated',
    text: 'text-text-muted',
    label: 'Removed',
  },
  deleted: {
    bg: 'bg-bg-elevated',
    text: 'text-text-muted',
    label: 'Deleted',
  },
}

const licenseLabels: Record<Track['license_type'], string> = {
  unlimited: 'Unlimited',
  limited: 'Limited',
  exclusive: 'Exclusive',
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatPrice(price: number | null): string {
  if (price == null) return '--'
  return `$${price.toFixed(2)}`
}

export default function TrackList({ tracks }: TrackListProps) {
  if (tracks.length === 0) {
    return (
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            My Tracks
          </h1>
          <Link
            href="/dashboard/upload"
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
          >
            <UploadIcon className="h-4 w-4" />
            Upload Track
          </Link>
        </div>

        <div className="rounded-xl border border-border-default bg-bg-elevated p-12 text-center">
          <MusicIcon className="mx-auto mb-4 h-12 w-12 text-text-muted" />
          <p className="text-lg font-medium text-text-primary">
            No tracks yet.
          </p>
          <p className="mt-1 text-sm text-text-muted">
            Upload your first track to start selling on FEATUNE!
          </p>
          <Link
            href="/dashboard/upload"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
          >
            <UploadIcon className="h-4 w-4" />
            Upload Your First Track
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">
          My Tracks
          <span className="ml-2 text-base font-normal text-text-muted">
            ({tracks.length})
          </span>
        </h1>
        <Link
          href="/dashboard/upload"
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
        >
          <UploadIcon className="h-4 w-4" />
          Upload Track
        </Link>
      </div>

      {/* Desktop table view */}
      <div className="hidden overflow-hidden rounded-xl border border-border-default bg-bg-elevated md:block">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border-default text-left text-xs font-semibold uppercase tracking-wider text-text-muted">
              <th className="px-5 py-3">Track</th>
              <th className="px-5 py-3">Genre / Mood</th>
              <th className="px-5 py-3">BPM / Key</th>
              <th className="px-5 py-3 text-right">Price</th>
              <th className="px-5 py-3">License</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-default">
            {tracks.map((track) => {
              const status = statusStyles[track.status]
              return (
                <tr
                  key={track.id}
                  className="transition-colors hover:bg-bg-card"
                >
                  {/* Track: artwork + title */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      {track.artwork_url ? (
                        <Image
                          src={track.artwork_url}
                          alt={track.title}
                          width={40}
                          height={40}
                          className="rounded-md object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-bg-card">
                          <MusicIcon className="h-5 w-5 text-text-muted" />
                        </div>
                      )}
                      <Link
                        href={`/track/${track.id}`}
                        className="text-sm font-medium text-text-primary transition-colors hover:text-accent"
                      >
                        {track.title}
                      </Link>
                    </div>
                  </td>

                  {/* Genre / Mood */}
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-1.5">
                      {track.genre && (
                        <span className="inline-flex items-center rounded-full bg-bg-card px-2 py-0.5 text-xs font-medium text-text-secondary">
                          {track.genre}
                        </span>
                      )}
                      {track.mood && (
                        <span className="inline-flex items-center rounded-full bg-bg-card px-2 py-0.5 text-xs font-medium text-text-secondary">
                          {track.mood}
                        </span>
                      )}
                      {!track.genre && !track.mood && (
                        <span className="text-xs text-text-muted">--</span>
                      )}
                    </div>
                  </td>

                  {/* BPM / Key */}
                  <td className="px-5 py-4 text-sm text-text-secondary">
                    {track.bpm != null || track.key != null ? (
                      <>
                        {track.bpm != null && <span>{track.bpm} BPM</span>}
                        {track.bpm != null && track.key != null && (
                          <span className="mx-1 text-text-muted">/</span>
                        )}
                        {track.key != null && <span>{track.key}</span>}
                      </>
                    ) : (
                      <span className="text-text-muted">--</span>
                    )}
                  </td>

                  {/* Price */}
                  <td className="px-5 py-4 text-right text-sm font-medium text-text-primary">
                    {formatPrice(track.price_non_exclusive)}
                  </td>

                  {/* License type */}
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-semibold text-accent">
                      {licenseLabels[track.license_type]}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${status.bg} ${status.text}`}
                    >
                      {status.label}
                    </span>
                  </td>

                  {/* Date */}
                  <td className="px-5 py-4 text-right text-sm text-text-muted">
                    {formatDate(track.created_at)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile card view */}
      <div className="space-y-3 md:hidden">
        {tracks.map((track) => {
          const status = statusStyles[track.status]
          return (
            <div
              key={track.id}
              className="rounded-xl border border-border-default bg-bg-elevated p-4"
            >
              {/* Header: artwork + title + status */}
              <div className="flex items-start gap-3">
                {track.artwork_url ? (
                  <Image
                    src={track.artwork_url}
                    alt={track.title}
                    width={48}
                    height={48}
                    className="rounded-md object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-md bg-bg-card">
                    <MusicIcon className="h-6 w-6 text-text-muted" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/track/${track.id}`}
                    className="text-sm font-medium text-text-primary transition-colors hover:text-accent"
                  >
                    {track.title}
                  </Link>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${status.bg} ${status.text}`}
                    >
                      {status.label}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent">
                      {licenseLabels[track.license_type]}
                    </span>
                  </div>
                </div>
              </div>

              {/* Details grid */}
              <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-border-default pt-3 text-xs">
                {/* Genre / Mood */}
                <div>
                  <span className="text-text-muted">Genre / Mood</span>
                  <p className="mt-0.5 font-medium text-text-secondary">
                    {[track.genre, track.mood].filter(Boolean).join(' / ') ||
                      '--'}
                  </p>
                </div>

                {/* BPM / Key */}
                <div>
                  <span className="text-text-muted">BPM / Key</span>
                  <p className="mt-0.5 font-medium text-text-secondary">
                    {[
                      track.bpm != null ? `${track.bpm} BPM` : null,
                      track.key,
                    ]
                      .filter(Boolean)
                      .join(' / ') || '--'}
                  </p>
                </div>

                {/* Price */}
                <div>
                  <span className="text-text-muted">Price</span>
                  <p className="mt-0.5 font-medium text-text-primary">
                    {formatPrice(track.price_non_exclusive)}
                  </p>
                </div>

                {/* Date */}
                <div>
                  <span className="text-text-muted">Uploaded</span>
                  <p className="mt-0.5 font-medium text-text-secondary">
                    {formatDate(track.created_at)}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ─── Icon Components ─── */

function UploadIcon({ className }: { className?: string }) {
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
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  )
}

function MusicIcon({ className }: { className?: string }) {
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
