'use client'

import { useCallback, useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import ProductCard from '@/components/tracks/ProductCard'
import TrackFilters from '@/components/tracks/TrackFilters'
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

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

function SearchPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const play = usePlayerStore((state) => state.play)

  const [tracks, setTracks] = useState<Track[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '')

  // Fetch tracks whenever search params change
  useEffect(() => {
    let cancelled = false

    async function fetchTracks() {
      setLoading(true)
      try {
        const params = new URLSearchParams(searchParams.toString())
        const res = await fetch(`/api/tracks?${params.toString()}`)
        if (!res.ok) throw new Error('Failed to fetch tracks')
        const data = await res.json()
        if (!cancelled) {
          setTracks(data.tracks || [])
          setPagination(data.pagination || null)
        }
      } catch {
        if (!cancelled) {
          setTracks([])
          setPagination(null)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchTracks()
    return () => {
      cancelled = true
    }
  }, [searchParams])

  // Sync the search input when URL search param changes externally
  useEffect(() => {
    setSearchInput(searchParams.get('search') || '')
  }, [searchParams])

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      const params = new URLSearchParams(searchParams.toString())
      if (searchInput.trim()) {
        params.set('search', searchInput.trim())
      } else {
        params.delete('search')
      }
      params.delete('page')
      router.push(`/search?${params.toString()}`)
    },
    [router, searchParams, searchInput],
  )

  const goToPage = useCallback(
    (page: number) => {
      const params = new URLSearchParams(searchParams.toString())
      if (page > 1) {
        params.set('page', String(page))
      } else {
        params.delete('page')
      }
      router.push(`/search?${params.toString()}`)
    },
    [router, searchParams],
  )

  const currentPage = pagination?.page ?? 1
  const totalPages = pagination?.totalPages ?? 1

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
          Browse Tracks
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          Discover and license premium vocal toplines for your next production.
        </p>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="relative">
          {/* Search icon */}
          <svg
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by track title..."
            className="w-full rounded-xl border border-border-default bg-bg-elevated py-3 pl-12 pr-4 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors focus:border-accent"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => {
                setSearchInput('')
                const params = new URLSearchParams(searchParams.toString())
                params.delete('search')
                params.delete('page')
                router.push(`/search?${params.toString()}`)
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted transition-colors hover:text-text-primary"
              aria-label="Clear search"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M2 2l12 12M14 2L2 14" />
              </svg>
            </button>
          )}
        </div>
      </form>

      {/* Filters */}
      <div className="mb-8">
        <TrackFilters />
      </div>

      {/* Results count */}
      {!loading && pagination && (
        <p className="mb-4 text-sm text-text-muted">
          {pagination.total === 0
            ? 'No tracks found'
            : `Showing ${(currentPage - 1) * pagination.limit + 1}\u2013${Math.min(currentPage * pagination.limit, pagination.total)} of ${pagination.total} track${pagination.total === 1 ? '' : 's'}`}
        </p>
      )}

      {/* Track grid */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <TrackSkeleton key={i} />
          ))}
        </div>
      ) : tracks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            className="mb-4 text-text-muted"
          >
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5" />
            <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <h2 className="text-lg font-semibold text-text-primary">No tracks found</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Try adjusting your filters or search terms.
          </p>
        </div>
      ) : (
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
                  previewUrl:
                    track.full_preview_url || track.preview_clip_url || '',
                })
              }
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && pagination && totalPages > 1 && (
        <nav className="mt-10 flex items-center justify-center gap-2" aria-label="Pagination">
          {/* Previous */}
          <button
            type="button"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border-default text-text-secondary transition-colors hover:border-border-hover hover:text-text-primary disabled:pointer-events-none disabled:opacity-40"
            aria-label="Previous page"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 12L6 8l4-4" />
            </svg>
          </button>

          {/* Page numbers */}
          {generatePageNumbers(currentPage, totalPages).map((pageNum, idx) =>
            pageNum === null ? (
              <span key={`ellipsis-${idx}`} className="px-1 text-sm text-text-muted">
                &hellip;
              </span>
            ) : (
              <button
                key={pageNum}
                type="button"
                onClick={() => goToPage(pageNum)}
                className={`flex h-9 min-w-[2.25rem] items-center justify-center rounded-lg border text-sm font-medium transition-colors ${
                  pageNum === currentPage
                    ? 'border-accent bg-accent text-white'
                    : 'border-border-default text-text-secondary hover:border-border-hover hover:text-text-primary'
                }`}
                aria-current={pageNum === currentPage ? 'page' : undefined}
              >
                {pageNum}
              </button>
            ),
          )}

          {/* Next */}
          <button
            type="button"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border-default text-text-secondary transition-colors hover:border-border-hover hover:text-text-primary disabled:pointer-events-none disabled:opacity-40"
            aria-label="Next page"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 12l4-4-4-4" />
            </svg>
          </button>
        </nav>
      )}
    </div>
  )
}

/** Generates a compact page number sequence with ellipsis. */
function generatePageNumbers(
  current: number,
  total: number,
): (number | null)[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const pages: (number | null)[] = [1]

  if (current > 3) {
    pages.push(null) // left ellipsis
  }

  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  if (current < total - 2) {
    pages.push(null) // right ellipsis
  }

  pages.push(total)

  return pages
}

/** Loading skeleton for a product card */
function TrackSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-border-default bg-bg-card">
      <div className="aspect-square animate-pulse bg-bg-elevated" />
      <div className="flex flex-col gap-2 p-3">
        <div className="h-4 w-3/4 animate-pulse rounded bg-bg-elevated" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-bg-elevated" />
        <div className="flex gap-1.5">
          <div className="h-5 w-12 animate-pulse rounded-full bg-bg-elevated" />
          <div className="h-5 w-10 animate-pulse rounded-full bg-bg-elevated" />
        </div>
        <div className="h-4 w-16 animate-pulse rounded bg-bg-elevated" />
      </div>
      <div className="flex items-center justify-between border-t border-border-default px-3 py-2">
        <div className="h-3 w-20 animate-pulse rounded bg-bg-elevated" />
        <div className="h-7 w-7 animate-pulse rounded-lg bg-bg-elevated" />
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="h-10 w-56 animate-pulse rounded bg-bg-elevated" />
            <div className="mt-2 h-4 w-80 animate-pulse rounded bg-bg-elevated" />
          </div>
          <div className="mb-6 h-12 animate-pulse rounded-xl bg-bg-elevated" />
          <div className="mb-8 h-10 animate-pulse rounded bg-bg-elevated" />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="flex flex-col overflow-hidden rounded-xl border border-border-default bg-bg-card"
              >
                <div className="aspect-square animate-pulse bg-bg-elevated" />
                <div className="flex flex-col gap-2 p-3">
                  <div className="h-4 w-3/4 animate-pulse rounded bg-bg-elevated" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-bg-elevated" />
                </div>
              </div>
            ))}
          </div>
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  )
}
