'use client'

import { useState, useEffect, useCallback } from 'react'

interface HomepageSection {
  id: string
  section_type: 'featured' | 'genre'
  genre: string | null
  title: string
}

interface PinnedTrack {
  id: string
  position: number
  tracks: {
    id: string
    title: string
    artwork_url: string | null
    genre: string | null
    creators: { id: string; display_name: string }
  }
}

interface SearchResult {
  id: string
  title: string
  artwork_url: string | null
  genre: string | null
  creators: { id: string; display_name: string }
}

interface TrackPickerModalProps {
  section: HomepageSection
  pinnedTracks: PinnedTrack[]
  onClose: () => void
  onSave: (tracks: { track_id: string; position: number }[]) => void
  saving: boolean
}

export default function TrackPickerModal({
  section,
  pinnedTracks,
  onClose,
  onSave,
  saving,
}: TrackPickerModalProps) {
  // State for the 4 slots (0-3 index, but positions are 1-4)
  const [slots, setSlots] = useState<(SearchResult | null)[]>([null, null, null, null])
  const [showSearch, setShowSearch] = useState<number | null>(null) // Which slot is being filled
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)

  // Initialize slots from pinned tracks
  useEffect(() => {
    const newSlots: (SearchResult | null)[] = [null, null, null, null]
    for (const pt of pinnedTracks) {
      const idx = pt.position - 1
      if (idx >= 0 && idx < 4) {
        newSlots[idx] = {
          id: pt.tracks.id,
          title: pt.tracks.title,
          artwork_url: pt.tracks.artwork_url,
          genre: pt.tracks.genre,
          creators: Array.isArray(pt.tracks.creators)
            ? pt.tracks.creators[0]
            : pt.tracks.creators,
        }
      }
    }
    setSlots(newSlots)
  }, [pinnedTracks])

  // Search for tracks
  const searchTracks = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setSearching(true)
    try {
      // Build search URL with genre filter for genre sections
      let url = `/api/tracks?search=${encodeURIComponent(query)}&limit=10`
      if (section.section_type === 'genre' && section.genre) {
        url += `&genre=${encodeURIComponent(section.genre)}`
      }

      const res = await fetch(url)
      if (!res.ok) throw new Error('Search failed')
      const data = await res.json()

      // Filter out already pinned tracks
      const pinnedIds = new Set(slots.filter(Boolean).map((s) => s!.id))
      const filtered = (data.tracks || []).filter(
        (t: SearchResult) => !pinnedIds.has(t.id)
      )

      setSearchResults(
        filtered.map((t: {
          id: string
          title: string
          artwork_url: string | null
          genre: string | null
          creators: { id: string; display_name: string } | { id: string; display_name: string }[]
        }) => ({
          id: t.id,
          title: t.title,
          artwork_url: t.artwork_url,
          genre: t.genre,
          creators: Array.isArray(t.creators) ? t.creators[0] : t.creators,
        }))
      )
    } catch {
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }, [section, slots])

  // Debounced search
  useEffect(() => {
    if (showSearch === null) return

    const timer = setTimeout(() => {
      searchTracks(searchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, showSearch, searchTracks])

  function handleSelectTrack(track: SearchResult) {
    if (showSearch === null) return
    const newSlots = [...slots]
    newSlots[showSearch] = track
    setSlots(newSlots)
    setShowSearch(null)
    setSearchQuery('')
    setSearchResults([])
  }

  function handleRemoveTrack(slotIndex: number) {
    const newSlots = [...slots]
    newSlots[slotIndex] = null
    setSlots(newSlots)
  }

  function handleSave() {
    const tracks: { track_id: string; position: number }[] = []
    slots.forEach((slot, idx) => {
      if (slot) {
        tracks.push({ track_id: slot.id, position: idx + 1 })
      }
    })
    onSave(tracks)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-2xl rounded-xl border border-border-default bg-bg-card">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-default px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-text-primary">
              Edit: {section.title}
            </h2>
            <p className="text-sm text-text-muted">
              Pin up to 4 tracks to always appear in this section
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-text-muted transition-colors hover:bg-bg-elevated hover:text-text-primary"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Slots */}
        <div className="p-6">
          <p className="mb-4 text-sm font-medium text-text-secondary">
            Pinned Tracks (drag to reorder):
          </p>
          <div className="space-y-3">
            {slots.map((slot, idx) => (
              <div
                key={idx}
                className="flex items-center gap-4 rounded-lg border border-border-default bg-bg-elevated p-3"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-bg-card text-sm font-medium text-text-muted">
                  {idx + 1}
                </span>

                {slot ? (
                  <>
                    {/* Track artwork */}
                    <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-md bg-bg-card">
                      {slot.artwork_url ? (
                        <img
                          src={slot.artwork_url}
                          alt={slot.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-text-muted">
                          <MusicIcon className="h-5 w-5" />
                        </div>
                      )}
                    </div>

                    {/* Track info */}
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-text-primary">
                        {slot.title}
                      </p>
                      <p className="truncate text-xs text-text-muted">
                        by {slot.creators.display_name}
                      </p>
                    </div>

                    {/* Remove button */}
                    <button
                      onClick={() => handleRemoveTrack(idx)}
                      className="rounded-lg p-2 text-text-muted transition-colors hover:bg-red-500/10 hover:text-red-400"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <div className="flex-1 text-sm text-text-muted">
                      (empty - will auto-fill)
                    </div>
                    <button
                      onClick={() => {
                        setShowSearch(idx)
                        setSearchQuery('')
                        setSearchResults([])
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border-default px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-accent hover:text-accent"
                    >
                      <PlusIcon className="h-3.5 w-3.5" />
                      Pin
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Search overlay */}
        {showSearch !== null && (
          <div className="border-t border-border-default px-6 py-4">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  section.section_type === 'genre'
                    ? `Search ${section.genre} tracks...`
                    : 'Search tracks...'
                }
                className="w-full rounded-lg border border-border-default bg-bg-elevated py-2 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
                autoFocus
              />
            </div>

            {/* Search results */}
            <div className="mt-3 max-h-60 overflow-y-auto">
              {searching ? (
                <div className="py-4 text-center text-sm text-text-muted">
                  Searching...
                </div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-1">
                  {searchResults.map((track) => (
                    <button
                      key={track.id}
                      onClick={() => handleSelectTrack(track)}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-bg-elevated"
                    >
                      <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded bg-bg-card">
                        {track.artwork_url ? (
                          <img
                            src={track.artwork_url}
                            alt={track.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-text-muted">
                            <MusicIcon className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm text-text-primary">
                          {track.title}
                        </p>
                        <p className="truncate text-xs text-text-muted">
                          {track.creators.display_name}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : searchQuery.trim() ? (
                <div className="py-4 text-center text-sm text-text-muted">
                  No tracks found
                </div>
              ) : (
                <div className="py-4 text-center text-sm text-text-muted">
                  Type to search for tracks
                </div>
              )}
            </div>

            <button
              onClick={() => {
                setShowSearch(null)
                setSearchQuery('')
                setSearchResults([])
              }}
              className="mt-3 w-full rounded-lg border border-border-default py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text-primary"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-border-default px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-border-default px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:border-border-hover hover:text-text-primary"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

function CloseIcon({ className }: { className?: string }) {
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
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
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

function TrashIcon({ className }: { className?: string }) {
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
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
    </svg>
  )
}

function PlusIcon({ className }: { className?: string }) {
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
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

function SearchIcon({ className }: { className?: string }) {
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
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}
