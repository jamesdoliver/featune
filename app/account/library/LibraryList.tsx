'use client'

import { useState } from 'react'
import Link from 'next/link'
import DownloadButton from '@/components/ui/DownloadButton'

interface LibraryTrack {
  id: string
  trackId: string
  title: string
  artworkUrl: string | null
  genre: string | null
  creatorName: string
  creatorId: string
  licenseType: string
  licensePdfUrl: string | null
  acapellaUrl: string | null
  instrumentalUrl: string | null
  lyricsPdfUrl: string | null
  purchasedAt: string
}

export default function LibraryList({ tracks }: { tracks: LibraryTrack[] }) {
  const [search, setSearch] = useState('')

  const filtered = tracks.filter((t) => {
    const q = search.toLowerCase()
    return t.title.toLowerCase().includes(q) || t.creatorName.toLowerCase().includes(q)
  })

  if (tracks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-border-default bg-bg-card px-6 py-16">
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          className="mb-4 text-text-muted"
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
        <p className="mb-1 text-lg font-semibold text-text-primary">
          No tracks in your library yet
        </p>
        <p className="mb-6 text-sm text-text-muted">
          Browse our catalog to find your next vocal topline.
        </p>
        <Link
          href="/search"
          className="rounded-lg bg-accent px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
        >
          Browse Tracks
        </Link>
      </div>
    )
  }

  return (
    <div>
      {/* Search bar */}
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search your library..."
          className="w-full rounded-lg border border-border-default bg-bg-elevated px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors focus:border-accent"
        />
        <p className="mt-2 text-xs text-text-muted">
          {filtered.length} {filtered.length === 1 ? 'track' : 'tracks'}
        </p>
      </div>

      {/* Track list */}
      <div className="rounded-xl border border-border-default bg-bg-card divide-y divide-border-default">
        {filtered.map((track) => {
          const purchaseDate = new Date(track.purchasedAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })

          return (
            <div key={track.id} className="flex items-center gap-4 px-4 py-3 sm:px-5">
              {/* Artwork */}
              {track.artworkUrl ? (
                <Link href={`/track/${track.trackId}`} className="shrink-0">
                  <img
                    src={track.artworkUrl}
                    alt={track.title}
                    className="h-12 w-12 rounded-lg object-cover"
                  />
                </Link>
              ) : (
                <Link
                  href={`/track/${track.trackId}`}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-bg-elevated"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-text-muted"
                  >
                    <path d="M9 18V5l12-2v13" />
                    <circle cx="6" cy="18" r="3" />
                    <circle cx="18" cy="16" r="3" />
                  </svg>
                </Link>
              )}

              {/* Track info */}
              <div className="min-w-0 flex-1">
                <Link
                  href={`/track/${track.trackId}`}
                  className="block truncate text-sm font-medium text-text-primary transition-colors hover:text-accent"
                >
                  {track.title}
                </Link>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-text-muted">
                  <span>{track.creatorName}</span>
                  <span className="hidden sm:inline">·</span>
                  <span className="hidden sm:inline">{purchaseDate}</span>
                </div>
              </div>

              {/* Genre + License */}
              <div className="hidden items-center gap-2 md:flex">
                {track.genre && (
                  <span className="rounded-full bg-bg-elevated px-2.5 py-0.5 text-xs text-text-muted">
                    {track.genre}
                  </span>
                )}
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    track.licenseType === 'exclusive'
                      ? 'bg-accent-muted text-accent'
                      : 'bg-bg-elevated text-text-secondary'
                  }`}
                >
                  {track.licenseType === 'exclusive' ? 'Exclusive' : 'Non-Exclusive'}
                </span>
              </div>

              {/* Download buttons */}
              <div className="flex shrink-0 items-center gap-1.5">
                {track.acapellaUrl && (
                  <DownloadButton
                    href={track.acapellaUrl}
                    label="Acapella"
                    ariaLabel={`Download acapella for ${track.title}`}
                    title="Download Acapella"
                  />
                )}
                {track.instrumentalUrl && (
                  <DownloadButton
                    href={track.instrumentalUrl}
                    label="Stems"
                    ariaLabel={`Download stems for ${track.title}`}
                    title="Download Stems"
                  />
                )}
                {track.licensePdfUrl && (
                  <DownloadButton
                    href={track.licensePdfUrl}
                    label="License"
                    ariaLabel={`Download license for ${track.title}`}
                    title="Download License"
                  />
                )}
                {track.lyricsPdfUrl && (
                  <DownloadButton
                    href={track.lyricsPdfUrl}
                    label="Lyrics"
                    ariaLabel={`Download lyrics for ${track.title}`}
                    title="Download Lyrics"
                  />
                )}
              </div>
            </div>
          )
        })}

        {filtered.length === 0 && (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-text-muted">No tracks match your search.</p>
          </div>
        )}
      </div>
    </div>
  )
}
