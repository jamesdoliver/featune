'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useState } from 'react'

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
const LICENSE_TYPES = ['unlimited', 'limited', 'exclusive']
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_low', label: 'Price: Low to High' },
  { value: 'price_high', label: 'Price: High to Low' },
  { value: 'popular', label: 'Popular' },
]

export default function TrackFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showFilters, setShowFilters] = useState(false)

  const currentGenre = searchParams.get('genre') || ''
  const currentMood = searchParams.get('mood') || ''
  const currentVocalist = searchParams.get('vocalist_type') || ''
  const currentBpmMin = searchParams.get('bpm_min') || ''
  const currentBpmMax = searchParams.get('bpm_max') || ''
  const currentKey = searchParams.get('key') || ''
  const currentType = searchParams.get('is_ai_generated') || ''
  const currentSort = searchParams.get('sort') || 'newest'
  const currentPriceMin = searchParams.get('price_min') || ''
  const currentPriceMax = searchParams.get('price_max') || ''
  const currentLicenseType = searchParams.get('license_type') || ''

  const hasActiveFilters =
    currentGenre ||
    currentMood ||
    currentVocalist ||
    currentBpmMin ||
    currentBpmMax ||
    currentKey ||
    currentType ||
    currentPriceMin ||
    currentPriceMax ||
    currentLicenseType

  const activeFilterCount = [
    currentGenre,
    currentMood,
    currentVocalist,
    currentBpmMin || currentBpmMax,
    currentKey,
    currentType,
    currentPriceMin || currentPriceMax,
    currentLicenseType,
  ].filter(Boolean).length

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
      {/* Mobile: Filter toggle button + Sort */}
      <div className="flex items-center gap-3 md:hidden">
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-border-default bg-bg-elevated px-4 text-sm font-medium text-text-primary transition-colors hover:border-border-hover"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="4" y1="12" x2="14" y2="12" />
            <line x1="4" y1="18" x2="10" y2="18" />
          </svg>
          Filters
          {activeFilterCount > 0 && (
            <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-accent px-1.5 text-xs font-semibold text-white">
              {activeFilterCount}
            </span>
          )}
        </button>
        <select
          value={currentSort}
          onChange={(e) => updateParams('sort', e.target.value)}
          className="h-11 flex-1 rounded-lg border border-border-default bg-bg-elevated px-3 text-sm text-text-primary outline-none transition-colors focus:border-accent"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Mobile: Collapsible filter panel */}
      {showFilters && (
        <div className="flex flex-col gap-3 rounded-xl border border-border-default bg-bg-card p-4 md:hidden">
          {/* 2x2 Grid for main filters */}
          <div className="grid grid-cols-2 gap-3">
            <select
              value={currentGenre}
              onChange={(e) => updateParams('genre', e.target.value)}
              className="h-11 rounded-lg border border-border-default bg-bg-elevated px-3 text-sm text-text-primary outline-none transition-colors focus:border-accent"
            >
              <option value="">All Genres</option>
              {GENRES.map((genre) => (
                <option key={genre} value={genre}>
                  {genre}
                </option>
              ))}
            </select>
            <select
              value={currentMood}
              onChange={(e) => updateParams('mood', e.target.value)}
              className="h-11 rounded-lg border border-border-default bg-bg-elevated px-3 text-sm text-text-primary outline-none transition-colors focus:border-accent"
            >
              <option value="">All Moods</option>
              {MOODS.map((mood) => (
                <option key={mood} value={mood}>
                  {mood}
                </option>
              ))}
            </select>
            <select
              value={currentVocalist}
              onChange={(e) => updateParams('vocalist_type', e.target.value)}
              className="h-11 rounded-lg border border-border-default bg-bg-elevated px-3 text-sm text-text-primary outline-none transition-colors focus:border-accent"
            >
              <option value="">All Vocalists</option>
              {VOCALIST_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
            <select
              value={currentType}
              onChange={(e) => updateParams('is_ai_generated', e.target.value)}
              className="h-11 rounded-lg border border-border-default bg-bg-elevated px-3 text-sm text-text-primary outline-none transition-colors focus:border-accent"
            >
              <option value="">All Types</option>
              <option value="false">Human</option>
              <option value="true">AI</option>
            </select>
          </div>
          {/* BPM Range */}
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="BPM min"
              value={currentBpmMin}
              onChange={(e) => updateParams('bpm_min', e.target.value)}
              min={0}
              max={300}
              className="h-11 flex-1 rounded-lg border border-border-default bg-bg-elevated px-3 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors focus:border-accent [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <span className="text-xs text-text-muted">to</span>
            <input
              type="number"
              placeholder="BPM max"
              value={currentBpmMax}
              onChange={(e) => updateParams('bpm_max', e.target.value)}
              min={0}
              max={300}
              className="h-11 flex-1 rounded-lg border border-border-default bg-bg-elevated px-3 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors focus:border-accent [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
          </div>
          {/* Price Range */}
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="$ min"
              value={currentPriceMin}
              onChange={(e) => updateParams('price_min', e.target.value)}
              min={0}
              className="h-11 flex-1 rounded-lg border border-border-default bg-bg-elevated px-3 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors focus:border-accent [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <span className="text-xs text-text-muted">to</span>
            <input
              type="number"
              placeholder="$ max"
              value={currentPriceMax}
              onChange={(e) => updateParams('price_max', e.target.value)}
              min={0}
              className="h-11 flex-1 rounded-lg border border-border-default bg-bg-elevated px-3 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors focus:border-accent [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
          </div>
          {/* Key */}
          <select
            value={currentKey}
            onChange={(e) => updateParams('key', e.target.value)}
            className="h-11 rounded-lg border border-border-default bg-bg-elevated px-3 text-sm text-text-primary outline-none transition-colors focus:border-accent"
          >
            <option value="">All Keys</option>
            {KEYS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
          {/* License Type */}
          <select
            value={currentLicenseType}
            onChange={(e) => updateParams('license_type', e.target.value)}
            className="h-11 rounded-lg border border-border-default bg-bg-elevated px-3 text-sm text-text-primary outline-none transition-colors focus:border-accent"
          >
            <option value="">All Licenses</option>
            {LICENSE_TYPES.map((type) => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
          {/* Clear filters */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="h-11 w-full rounded-lg bg-accent-muted text-sm font-medium text-accent transition-colors hover:bg-accent hover:text-white"
            >
              Clear All Filters
            </button>
          )}
        </div>
      )}

      {/* Desktop: Horizontal filter row */}
      <div className="hidden flex-wrap items-center gap-3 md:flex">
        {/* Genre */}
        <select
          value={currentGenre}
          onChange={(e) => updateParams('genre', e.target.value)}
          className="h-10 rounded-lg border border-border-default bg-bg-elevated px-3 text-sm text-text-primary outline-none transition-colors focus:border-accent"
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
          className="h-10 rounded-lg border border-border-default bg-bg-elevated px-3 text-sm text-text-primary outline-none transition-colors focus:border-accent"
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
          className="h-10 rounded-lg border border-border-default bg-bg-elevated px-3 text-sm text-text-primary outline-none transition-colors focus:border-accent"
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
            className="h-10 w-24 rounded-lg border border-border-default bg-bg-elevated px-3 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors focus:border-accent [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <span className="text-xs text-text-muted">&ndash;</span>
          <input
            type="number"
            placeholder="BPM max"
            value={currentBpmMax}
            onChange={(e) => updateParams('bpm_max', e.target.value)}
            min={0}
            max={300}
            className="h-10 w-24 rounded-lg border border-border-default bg-bg-elevated px-3 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors focus:border-accent [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
        </div>

        {/* Key */}
        <select
          value={currentKey}
          onChange={(e) => updateParams('key', e.target.value)}
          className="h-10 rounded-lg border border-border-default bg-bg-elevated px-3 text-sm text-text-primary outline-none transition-colors focus:border-accent"
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
          className="h-10 rounded-lg border border-border-default bg-bg-elevated px-3 text-sm text-text-primary outline-none transition-colors focus:border-accent"
        >
          <option value="">All Types</option>
          <option value="false">Human</option>
          <option value="true">AI</option>
        </select>

        {/* Price Range */}
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            placeholder="$ min"
            value={currentPriceMin}
            onChange={(e) => updateParams('price_min', e.target.value)}
            min={0}
            className="h-10 w-20 rounded-lg border border-border-default bg-bg-elevated px-3 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors focus:border-accent [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <span className="text-xs text-text-muted">&ndash;</span>
          <input
            type="number"
            placeholder="$ max"
            value={currentPriceMax}
            onChange={(e) => updateParams('price_max', e.target.value)}
            min={0}
            className="h-10 w-20 rounded-lg border border-border-default bg-bg-elevated px-3 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors focus:border-accent [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
        </div>

        {/* License Type */}
        <select
          value={currentLicenseType}
          onChange={(e) => updateParams('license_type', e.target.value)}
          className="h-10 rounded-lg border border-border-default bg-bg-elevated px-3 text-sm text-text-primary outline-none transition-colors focus:border-accent"
        >
          <option value="">All Licenses</option>
          {LICENSE_TYPES.map((type) => (
            <option key={type} value={type}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </option>
          ))}
        </select>

        {/* Sort */}
        <select
          value={currentSort}
          onChange={(e) => updateParams('sort', e.target.value)}
          className="h-10 rounded-lg border border-border-default bg-bg-elevated px-3 text-sm text-text-primary outline-none transition-colors focus:border-accent"
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
            className="h-10 rounded-lg bg-accent-muted px-3 text-sm font-medium text-accent transition-colors hover:bg-accent hover:text-white"
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
          {(currentPriceMin || currentPriceMax) && (
            <FilterBadge
              label={`Price: $${currentPriceMin || '0'} - $${currentPriceMax || '∞'}`}
              onRemove={() => {
                const params = new URLSearchParams(searchParams.toString())
                params.delete('price_min')
                params.delete('price_max')
                params.delete('page')
                router.push(`/search?${params.toString()}`)
              }}
            />
          )}
          {currentLicenseType && (
            <FilterBadge
              label={`License: ${currentLicenseType.charAt(0).toUpperCase() + currentLicenseType.slice(1)}`}
              onRemove={() => updateParams('license_type', '')}
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
