'use client'

import { useCallback, useEffect, useState, Suspense, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import ProductCard from '@/components/tracks/ProductCard'
import TrackFilters from '@/components/tracks/TrackFilters'
import { usePlayerStore } from '@/stores/playerStore'
import { createClient } from '@/lib/supabase/client'

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
  reason?: string // AI search reason
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface AISearchResult {
  track_id: string
  score: number
  reason: string
}

const FASTAPI_URL = process.env.NEXT_PUBLIC_FASTAPI_URL ?? ''

function SearchPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const play = usePlayerStore((state) => state.play)
  const inputRef = useRef<HTMLInputElement>(null)

  const [tracks, setTracks] = useState<Track[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchInput, setSearchInput] = useState(searchParams.get('q') || searchParams.get('search') || '')
  const [isAISearch, setIsAISearch] = useState(false)
  const [aiSearchActive, setAiSearchActive] = useState(false)
  const [popularTracks, setPopularTracks] = useState<Track[]>([])
  const [popularLoading, setPopularLoading] = useState(false)

  // Focus input if redirected from chat button
  useEffect(() => {
    if (searchParams.get('focus') === 'true') {
      inputRef.current?.focus()
      // Remove the focus param from URL
      const params = new URLSearchParams(searchParams.toString())
      params.delete('focus')
      const newUrl = params.toString() ? `/search?${params.toString()}` : '/search'
      router.replace(newUrl, { scroll: false })
    }
  }, [searchParams, router])

  // Detect if query looks like natural language (AI search)
  const isNaturalLanguageQuery = useCallback((query: string): boolean => {
    const trimmed = query.trim().toLowerCase()
    if (!trimmed) return false

    // Natural language indicators
    const nlIndicators = [
      // Questions and requests
      /^(find|show|get|give|looking for|search for|i want|i need)/,
      // Descriptive phrases
      /(about|like|similar to|vibes|feeling|something|tracks? (with|by|for))/,
      // Multiple words with descriptive adjectives
      /\b(upbeat|sad|happy|dark|light|smooth|aggressive|chill|energetic|romantic|emotional)\b/,
      // Lyric searches
      /(lyrics?|song|songs?|words?|mention)/,
      // Creator searches
      /(by|from|artist|creator)/,
    ]

    // If it's more than 2 words and contains descriptive language, use AI
    const wordCount = trimmed.split(/\s+/).length
    if (wordCount >= 3) return true

    // Check for natural language patterns
    return nlIndicators.some(pattern => pattern.test(trimmed))
  }, [])

  // Perform AI-powered search
  const performAISearch = useCallback(async (query: string) => {
    setLoading(true)
    setAiSearchActive(true)

    try {
      // Call Claude-powered search
      const response = await fetch(`${FASTAPI_URL}/chat/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      })

      if (!response.ok) {
        throw new Error('AI search failed')
      }

      const { results } = await response.json() as { results: AISearchResult[] }

      if (results.length === 0) {
        setTracks([])
        setPagination({ page: 1, limit: 20, total: 0, totalPages: 0 })
        return
      }

      // Fetch full track details (only approved tracks)
      const trackIds = results.map(r => r.track_id)
      const supabase = createClient()
      const { data: fetchedTracks } = await supabase
        .from('tracks')
        .select('*, creators(id, display_name)')
        .in('id', trackIds)
        .eq('status', 'approved')

      if (!fetchedTracks) {
        setTracks([])
        setPagination({ page: 1, limit: 20, total: 0, totalPages: 0 })
        return
      }

      // Sort by AI relevance score and add reasons
      const trackMap = new Map(fetchedTracks.map(t => [t.id, t]))
      const reasonMap = new Map(results.map(r => [r.track_id, r.reason]))
      const sortedTracks = results
        .map(r => {
          const track = trackMap.get(r.track_id)
          if (track) {
            return { ...track, reason: reasonMap.get(r.track_id) }
          }
          return null
        })
        .filter(Boolean) as Track[]

      setTracks(sortedTracks)
      setPagination({ page: 1, limit: 20, total: sortedTracks.length, totalPages: 1 })
    } catch (error) {
      console.error('AI search error:', error)
      setTracks([])
      setPagination({ page: 1, limit: 20, total: 0, totalPages: 0 })
    } finally {
      setLoading(false)
    }
  }, [])

  // Perform traditional filter-based search
  const performTraditionalSearch = useCallback(async () => {
    setLoading(true)
    setAiSearchActive(false)

    try {
      const params = new URLSearchParams(searchParams.toString())
      const res = await fetch(`/api/tracks?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch tracks')
      const data = await res.json()
      setTracks(data.tracks || [])
      setPagination(data.pagination || null)
    } catch {
      setTracks([])
      setPagination(null)
    } finally {
      setLoading(false)
    }
  }, [searchParams])

  // Fetch popular tracks for empty state
  const fetchPopularTracks = useCallback(async () => {
    if (popularTracks.length > 0) return
    setPopularLoading(true)
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from('tracks')
        .select('*, creators(id, display_name)')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(4)
      setPopularTracks((data ?? []) as Track[])
    } catch {
      // Silently fail - popular tracks are optional
    } finally {
      setPopularLoading(false)
    }
  }, [popularTracks.length])

  // Fetch tracks based on search type
  useEffect(() => {
    const q = searchParams.get('q')
    const search = searchParams.get('search')
    const query = q || search || ''

    if (query && isNaturalLanguageQuery(query)) {
      setIsAISearch(true)
      performAISearch(query)
    } else {
      setIsAISearch(false)
      performTraditionalSearch()
    }
  }, [searchParams, isNaturalLanguageQuery, performAISearch, performTraditionalSearch])

  // Sync search input with URL
  useEffect(() => {
    setSearchInput(searchParams.get('q') || searchParams.get('search') || '')
  }, [searchParams])

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      const query = searchInput.trim()
      if (!query) {
        router.push('/search')
        return
      }

      // Use 'q' param for AI search, 'search' for traditional
      const params = new URLSearchParams()
      if (isNaturalLanguageQuery(query)) {
        params.set('q', query)
      } else {
        params.set('search', query)
      }
      router.push(`/search?${params.toString()}`)
    },
    [router, searchInput, isNaturalLanguageQuery],
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
          Find Your Sound
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          Search by lyrics, genre, mood, creator name, or describe what you&apos;re looking for
        </p>
      </div>

      {/* AI Search bar */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="relative">
          {/* Search/Sparkle icon */}
          <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
            {isAISearch || isNaturalLanguageQuery(searchInput) ? (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-accent"
              >
                <path d="M12 2l2.09 6.26L20 10l-5.91 1.74L12 18l-2.09-6.26L4 10l5.91-1.74L12 2z" />
              </svg>
            ) : (
              <svg
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
            )}
          </div>
          <input
            ref={inputRef}
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Try: 'upbeat R&B about summer' or 'female vocal in C minor' or 'songs about heartbreak'"
            className="w-full rounded-xl border border-border-default bg-bg-elevated py-4 pl-12 pr-24 text-base text-text-primary placeholder:text-text-muted outline-none transition-colors focus:border-accent"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => {
                setSearchInput('')
                router.push('/search')
              }}
              className="absolute right-20 top-1/2 -translate-y-1/2 text-text-muted transition-colors hover:text-text-primary"
              aria-label="Clear search"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M2 2l12 12M14 2L2 14" />
              </svg>
            </button>
          )}
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-accent px-5 py-2 font-semibold text-white transition-colors hover:bg-accent-hover"
          >
            Search
          </button>
        </div>
        {/* AI indicator */}
        {(isAISearch || isNaturalLanguageQuery(searchInput)) && searchInput && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-accent">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2l2.09 6.26L20 10l-5.91 1.74L12 18l-2.09-6.26L4 10l5.91-1.74L12 2z" />
            </svg>
            AI-powered search will understand your query
          </p>
        )}
      </form>

      {/* Filters (show when not using AI search) */}
      {!aiSearchActive && (
        <div className="mb-8">
          <TrackFilters />
        </div>
      )}

      {/* Results count */}
      {!loading && pagination && (
        <p className="mb-4 text-sm text-text-muted">
          {pagination.total === 0
            ? 'No tracks found'
            : aiSearchActive
              ? `Found ${pagination.total} matching track${pagination.total === 1 ? '' : 's'}`
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
        <EmptySearchState
          aiSearchActive={aiSearchActive}
          popularTracks={popularTracks}
          popularLoading={popularLoading}
          onFetchPopular={fetchPopularTracks}
          onPlay={(track) =>
            play({
              id: track.id,
              title: track.title,
              creatorName: track.creators.display_name,
              artworkUrl: track.artwork_url,
              previewUrl: track.full_preview_url || track.preview_clip_url || '',
            })
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {tracks.map((track) => (
            <div key={track.id} className="flex flex-col">
              <ProductCard
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
              {/* Show AI reason if available */}
              {track.reason && aiSearchActive && (
                <p className="mt-1 truncate px-1 text-xs text-text-muted" title={track.reason}>
                  {track.reason}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination (only for traditional search) */}
      {!loading && pagination && totalPages > 1 && !aiSearchActive && (
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

/** Empty state with popular tracks suggestion */
function EmptySearchState({
  aiSearchActive,
  popularTracks,
  popularLoading,
  onFetchPopular,
  onPlay,
}: {
  aiSearchActive: boolean
  popularTracks: Track[]
  popularLoading: boolean
  onFetchPopular: () => void
  onPlay: (track: Track) => void
}) {
  useEffect(() => {
    onFetchPopular()
  }, [onFetchPopular])

  return (
    <div className="flex flex-col items-center justify-center py-16">
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
        {aiSearchActive
          ? 'Try different keywords or a broader description.'
          : 'Try adjusting your filters or search terms.'}
      </p>

      {/* Popular tracks */}
      {(popularTracks.length > 0 || popularLoading) && (
        <div className="mt-10 w-full">
          <h3 className="mb-4 text-center text-sm font-semibold uppercase tracking-wider text-text-muted">
            Popular Tracks
          </h3>
          {popularLoading ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <TrackSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {popularTracks.map((track) => (
                <ProductCard
                  key={track.id}
                  track={track}
                  showCreator
                  onPlay={() => onPlay(track)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
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
          <div className="mb-6 h-14 animate-pulse rounded-xl bg-bg-elevated" />
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
