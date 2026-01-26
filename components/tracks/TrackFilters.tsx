'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

const GENRES = ['Pop', 'R&B', 'Hip-Hop', 'EDM', 'Afrobeats']
const MOODS = ['Energetic', 'Chill', 'Dark', 'Romantic', 'Happy']
const VOCALIST_TYPES = ['male', 'female']
const KEYS = [
  'C Major', 'C Minor', 'C# Major', 'C# Minor',
  'D Major', 'D Minor', 'D# Major', 'D# Minor',
  'E Major', 'E Minor',
  'F Major', 'F Minor', 'F# Major', 'F# Minor',
  'G Major', 'G Minor', 'G# Major', 'G# Minor',
  'A Major', 'A Minor', 'A# Major', 'A# Minor',
  'B Major', 'B Minor',
]
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_low', label: 'Price: Low to High' },
  { value: 'price_high', label: 'Price: High to Low' },
  { value: 'popular', label: 'Popular' },
]

export default function TrackFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const currentGenre = searchParams.get('genre') || ''
  const currentMood = searchParams.get('mood') || ''
  const currentVocalist = searchParams.get('vocalist_type') || ''
  const currentBpmMin = searchParams.get('bpm_min') || ''
  const currentBpmMax = searchParams.get('bpm_max') || ''
  const currentKey = searchParams.get('key') || ''
  const currentType = searchParams.get('is_ai_generated') || ''
  const currentSort = searchParams.get('sort') || 'newest'

  const hasActiveFilters =
    currentGenre ||
    currentMood ||
    currentVocalist ||
    currentBpmMin ||
    currentBpmMax ||
    currentKey ||
    currentType

  const updateParams = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      // Reset to page 1 when filters change
      params.delete('page')
      router.push(`/search?${params.toString()}`)
    },
    [router, searchParams],
  )

  const clearFilters = useCallback(() => {
    const params = new URLSearchParams()
    const search = searchParams.get('search')
    if (search) params.set('search', search)
    router.push(`/search?${params.toString()}`)
  }, [router, searchParams])

  return (
    <div className="flex flex-col gap-4">
      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Genre */}
        <select
          value={currentGenre}
          onChange={(e) => updateParams('genre', e.target.value)}
          className="rounded-lg border border-border-default bg-bg-elevated px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-accent"
        >
          <option value="">All Genres</option>
          {GENRES.map((genre) => (
            <option key={genre} value={genre}>
              {genre}
            </option>
          ))}
        </select>

        {/* Mood */}
        <select
          value={currentMood}
          onChange={(e) => updateParams('mood', e.target.value)}
          className="rounded-lg border border-border-default bg-bg-elevated px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-accent"
        >
          <option value="">All Moods</option>
          {MOODS.map((mood) => (
            <option key={mood} value={mood}>
              {mood}
            </option>
          ))}
        </select>

        {/* Vocalist */}
        <select
          value={currentVocalist}
          onChange={(e) => updateParams('vocalist_type', e.target.value)}
          className="rounded-lg border border-border-default bg-bg-elevated px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-accent"
        >
          <option value="">All Vocalists</option>
          {VOCALIST_TYPES.map((type) => (
            <option key={type} value={type}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </option>
          ))}
        </select>

        {/* BPM Range */}
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            placeholder="BPM min"
            value={currentBpmMin}
            onChange={(e) => updateParams('bpm_min', e.target.value)}
            min={0}
            max={300}
            className="w-24 rounded-lg border border-border-default bg-bg-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors focus:border-accent [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <span className="text-xs text-text-muted">&ndash;</span>
          <input
            type="number"
            placeholder="BPM max"
            value={currentBpmMax}
            onChange={(e) => updateParams('bpm_max', e.target.value)}
            min={0}
            max={300}
            className="w-24 rounded-lg border border-border-default bg-bg-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors focus:border-accent [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
        </div>

        {/* Key */}
        <select
          value={currentKey}
          onChange={(e) => updateParams('key', e.target.value)}
          className="rounded-lg border border-border-default bg-bg-elevated px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-accent"
        >
          <option value="">All Keys</option>
          {KEYS.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>

        {/* Type (AI / Human) */}
        <select
          value={currentType}
          onChange={(e) => updateParams('is_ai_generated', e.target.value)}
          className="rounded-lg border border-border-default bg-bg-elevated px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-accent"
        >
          <option value="">All Types</option>
          <option value="false">Human</option>
          <option value="true">AI</option>
        </select>

        {/* Sort */}
        <select
          value={currentSort}
          onChange={(e) => updateParams('sort', e.target.value)}
          className="rounded-lg border border-border-default bg-bg-elevated px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-accent"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Clear filters */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="rounded-lg bg-accent-muted px-3 py-2 text-sm font-medium text-accent transition-colors hover:bg-accent hover:text-white"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Active filter badges */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {currentGenre && (
            <FilterBadge
              label={`Genre: ${currentGenre}`}
              onRemove={() => updateParams('genre', '')}
            />
          )}
          {currentMood && (
            <FilterBadge
              label={`Mood: ${currentMood}`}
              onRemove={() => updateParams('mood', '')}
            />
          )}
          {currentVocalist && (
            <FilterBadge
              label={`Vocalist: ${currentVocalist.charAt(0).toUpperCase() + currentVocalist.slice(1)}`}
              onRemove={() => updateParams('vocalist_type', '')}
            />
          )}
          {(currentBpmMin || currentBpmMax) && (
            <FilterBadge
              label={`BPM: ${currentBpmMin || '0'} - ${currentBpmMax || '300'}`}
              onRemove={() => {
                const params = new URLSearchParams(searchParams.toString())
                params.delete('bpm_min')
                params.delete('bpm_max')
                params.delete('page')
                router.push(`/search?${params.toString()}`)
              }}
            />
          )}
          {currentKey && (
            <FilterBadge
              label={`Key: ${currentKey}`}
              onRemove={() => updateParams('key', '')}
            />
          )}
          {currentType && (
            <FilterBadge
              label={`Type: ${currentType === 'true' ? 'AI' : 'Human'}`}
              onRemove={() => updateParams('is_ai_generated', '')}
            />
          )}
        </div>
      )}
    </div>
  )
}

function FilterBadge({
  label,
  onRemove,
}: {
  label: string
  onRemove: () => void
}) {
  return (
    <span className="flex items-center gap-1.5 rounded-full bg-accent-muted px-3 py-1 text-xs font-medium text-accent">
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="flex h-4 w-4 items-center justify-center rounded-full transition-colors hover:bg-accent hover:text-white"
        aria-label={`Remove ${label} filter`}
      >
        <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M1 1l6 6M7 1l-6 6" />
        </svg>
      </button>
    </span>
  )
}
