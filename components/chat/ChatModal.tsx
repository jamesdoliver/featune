'use client'

import { useState, useEffect, useCallback, useRef, FormEvent } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ChatModalProps {
  isOpen: boolean
  onClose: () => void
}

interface Creator {
  id: string
  display_name: string
}

interface TrackRow {
  id: string
  title: string
  artwork_url: string | null
  genre: string | null
  mood: string | null
  price_non_exclusive: number | null
  creators: Creator[]
}

interface TrackResult {
  id: string
  title: string
  artwork_url: string | null
  genre: string | null
  mood: string | null
  price_non_exclusive: number | null
  creator: Creator | null
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`
}

const FASTAPI_URL =
  process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://localhost:8000'

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ChatModal({ isOpen, onClose }: ChatModalProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<TrackResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Close on Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    },
    [onClose],
  )

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      // Focus the input when modal opens
      setTimeout(() => inputRef.current?.focus(), 100)
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, handleKeyDown])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) return

    setIsLoading(true)
    setError(null)
    setResults([])
    setHasSearched(true)

    try {
      // 1. Query the FastAPI chat endpoint for matching track IDs
      const chatResponse = await fetch(`${FASTAPI_URL}/chat/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: trimmed }),
      })

      if (!chatResponse.ok) {
        const detail = await chatResponse.text()
        throw new Error(detail || 'Failed to search tracks')
      }

      const chatData = await chatResponse.json()
      const trackIds: string[] = chatData.results.map(
        (r: { track_id: string }) => r.track_id,
      )

      if (trackIds.length === 0) {
        setResults([])
        return
      }

      // 2. Fetch full track details from Supabase for the matched IDs
      const supabase = createClient()
      const { data: tracks, error: sbError } = await supabase
        .from('tracks')
        .select(
          'id, title, artwork_url, genre, mood, price_non_exclusive, creators(id, display_name)',
        )
        .in('id', trackIds)

      if (sbError) {
        throw new Error(sbError.message)
      }

      // Map rows: flatten the creators array into a single creator
      const mapped: TrackResult[] = (tracks || []).map((row: TrackRow) => ({
        id: row.id,
        title: row.title,
        artwork_url: row.artwork_url,
        genre: row.genre,
        mood: row.mood,
        price_non_exclusive: row.price_non_exclusive,
        creator: row.creators?.[0] ?? null,
      }))

      // Preserve the ranking order from the chat endpoint
      const trackMap = new Map(mapped.map((t) => [t.id, t]))
      const ordered = trackIds
        .map((id) => trackMap.get(id))
        .filter(Boolean) as TrackResult[]

      setResults(ordered)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  // Don't render anything when closed
  if (!isOpen) return null

  return (
    <>
      {/* Backdrop — click to close */}
      <div
        className="fixed inset-0 z-[50] bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal panel — right side */}
      <aside
        role="dialog"
        aria-label="AI Assistant"
        aria-modal
        className="fixed right-0 top-0 z-[50] flex h-full w-full flex-col border-l border-border-default bg-bg-card shadow-2xl sm:w-96"
      >
        {/* ---- Header ---- */}
        <div className="flex items-center justify-between border-b border-border-default px-5 py-4">
          <div className="flex items-center gap-2">
            {/* Sparkle icon */}
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              className="text-accent"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2l2.09 6.26L20 10l-5.91 1.74L12 18l-2.09-6.26L4 10l5.91-1.74L12 2z" />
            </svg>
            <h2 className="text-base font-semibold text-text-primary">
              AI Assistant
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text-primary"
            aria-label="Close assistant"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ---- Body ---- */}
        <div className="flex flex-1 flex-col overflow-y-auto px-5 py-4">
          {/* Intro prompt (show when no search yet) */}
          {!hasSearched && !isLoading && (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-muted">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="text-accent"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2l2.09 6.26L20 10l-5.91 1.74L12 18l-2.09-6.26L4 10l5.91-1.74L12 2z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-text-primary">
                What are you looking for?
              </p>
              <p className="text-xs text-text-secondary">
                Describe the vocal topline you need and I&apos;ll find the best
                matches.
              </p>
            </div>
          )}

          {/* Loading spinner */}
          {isLoading && (
            <div className="flex flex-1 items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                <p className="text-xs text-text-secondary">
                  Searching tracks...
                </p>
              </div>
            </div>
          )}

          {/* Error state */}
          {error && !isLoading && (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-error/10">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="text-error"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4M12 16h.01" />
                </svg>
              </div>
              <p className="text-sm text-text-primary">Something went wrong</p>
              <p className="text-xs text-text-secondary">{error}</p>
            </div>
          )}

          {/* Empty results */}
          {hasSearched && !isLoading && !error && results.length === 0 && (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-bg-elevated">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="text-text-muted"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
              </div>
              <p className="text-sm text-text-primary">No matches found</p>
              <p className="text-xs text-text-secondary">
                Try different keywords or a broader description.
              </p>
            </div>
          )}

          {/* Results list */}
          {!isLoading && !error && results.length > 0 && (
            <div className="flex flex-col gap-3">
              <p className="text-xs font-medium text-text-secondary">
                {results.length} result{results.length !== 1 ? 's' : ''} found
              </p>
              {results.map((track) => (
                <Link
                  key={track.id}
                  href={`/track/${track.id}`}
                  onClick={onClose}
                  className="flex items-center gap-3 rounded-lg border border-border-default bg-bg-elevated p-3 transition-colors hover:border-border-hover"
                >
                  {/* Artwork */}
                  <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-md bg-bg-card">
                    {track.artwork_url ? (
                      <img
                        src={track.artwork_url}
                        alt={track.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <svg
                          width="20"
                          height="20"
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
                  </div>

                  {/* Track info */}
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <p className="truncate text-sm font-medium text-text-primary">
                      {track.title}
                    </p>
                    {track.creator && (
                      <p className="truncate text-xs text-text-secondary">
                        {track.creator.display_name}
                      </p>
                    )}
                    {(track.genre || track.mood) && (
                      <div className="flex gap-1.5">
                        {track.genre && (
                          <span className="rounded-full bg-bg-card px-2 py-0.5 text-xs text-text-muted">
                            {track.genre}
                          </span>
                        )}
                        {track.mood && (
                          <span className="rounded-full bg-bg-card px-2 py-0.5 text-xs text-text-muted">
                            {track.mood}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Price */}
                  {track.price_non_exclusive != null && (
                    <span className="flex-shrink-0 text-sm font-bold text-accent">
                      {formatPrice(track.price_non_exclusive)}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* ---- Footer: search input ---- */}
        <form
          onSubmit={handleSubmit}
          className="border-t border-border-default px-5 py-4"
        >
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. upbeat female vocal for a summer track"
              className="flex-1 rounded-lg border border-border-default bg-bg-elevated px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors focus:border-accent"
            />
            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-accent text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Search"
            >
              {isLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              )}
            </button>
          </div>
        </form>
      </aside>
    </>
  )
}
