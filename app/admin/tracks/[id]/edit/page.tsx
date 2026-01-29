'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import Link from 'next/link'
import type { LicenseType, VocalistType } from '@/lib/types/database'

const GENRES = [
  'Pop',
  'R&B',
  'Hip-Hop',
  'EDM',
  'Afrobeats',
  'Latin',
  'Rock',
  'Country',
  'Other',
] as const

const MOODS = [
  'Happy',
  'Sad',
  'Energetic',
  'Chill',
  'Romantic',
  'Dark',
  'Uplifting',
  'Aggressive',
] as const

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const
const KEY_OPTIONS = NOTES.flatMap((note) => [`${note} Major`, `${note} Minor`])

interface TrackData {
  id: string
  title: string
  genre: string | null
  mood: string | null
  bpm: number | null
  key: string | null
  vocalist_type: VocalistType | null
  is_ai_generated: boolean
  license_type: LicenseType
  license_limit: number | null
  licenses_sold: number
  price_non_exclusive: number | null
  price_exclusive: number | null
  lyrics: string | null
  artwork_url: string | null
  status: string
  creators: { id: string; display_name: string } | null
}

export default function AdminTrackEditPage() {
  const router = useRouter()
  const params = useParams()
  const trackId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Form state
  const [title, setTitle] = useState('')
  const [genre, setGenre] = useState('')
  const [mood, setMood] = useState('')
  const [bpm, setBpm] = useState('')
  const [key, setKey] = useState('')
  const [vocalistType, setVocalistType] = useState<VocalistType>('male')
  const [isAiGenerated, setIsAiGenerated] = useState(false)
  const [licenseType, setLicenseType] = useState<LicenseType>('unlimited')
  const [licenseLimit, setLicenseLimit] = useState('')
  const [licensesSold, setLicensesSold] = useState(0)
  const [priceNonExclusive, setPriceNonExclusive] = useState('')
  const [priceExclusive, setPriceExclusive] = useState('')
  const [lyrics, setLyrics] = useState('')
  const [artworkUrl, setArtworkUrl] = useState<string | null>(null)
  const [creatorName, setCreatorName] = useState('')
  const [status, setStatus] = useState('')

  // New artwork upload
  const [newArtwork, setNewArtwork] = useState<File | null>(null)
  const [artworkPreview, setArtworkPreview] = useState<string | null>(null)
  const artworkInputRef = useRef<HTMLInputElement>(null)

  // Load track data
  useEffect(() => {
    async function loadTrack() {
      try {
        const res = await fetch(`/api/admin/tracks/${trackId}`)
        if (!res.ok) {
          throw new Error('Failed to load track')
        }
        const data = await res.json()
        const track: TrackData = data.track

        setTitle(track.title)
        setGenre(track.genre ?? '')
        setMood(track.mood ?? '')
        setBpm(track.bpm?.toString() ?? '')
        setKey(track.key ?? '')
        setVocalistType(track.vocalist_type ?? 'male')
        setIsAiGenerated(track.is_ai_generated)
        setLicenseType(track.license_type)
        setLicenseLimit(track.license_limit?.toString() ?? '')
        setLicensesSold(track.licenses_sold)
        setPriceNonExclusive(track.price_non_exclusive?.toString() ?? '')
        setPriceExclusive(track.price_exclusive?.toString() ?? '')
        setLyrics(track.lyrics ?? '')
        setArtworkUrl(track.artwork_url)
        setCreatorName(track.creators?.display_name ?? 'Unknown')
        setStatus(track.status)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load track')
      } finally {
        setLoading(false)
      }
    }

    loadTrack()
  }, [trackId])

  // Handle artwork change
  const handleArtworkChange = useCallback((file: File | null) => {
    if (artworkPreview) URL.revokeObjectURL(artworkPreview)
    setNewArtwork(file)
    if (file) {
      setArtworkPreview(URL.createObjectURL(file))
    } else {
      setArtworkPreview(null)
    }
  }, [artworkPreview])

  // Validate form
  function validate(): string | null {
    if (!title.trim()) return 'Title is required.'
    if (!genre) return 'Genre is required.'
    if (!mood) return 'Mood is required.'

    if (licenseType === 'limited') {
      const limit = parseInt(licenseLimit, 10)
      if (!licenseLimit || isNaN(limit) || limit < 1) {
        return 'License limit must be at least 1 for limited licenses.'
      }
      if (limit < licensesSold) {
        return `License limit cannot be less than licenses already sold (${licensesSold}).`
      }
    }

    if (licenseType !== 'exclusive') {
      const price = parseFloat(priceNonExclusive)
      if (!priceNonExclusive || isNaN(price) || price <= 0) {
        return 'Non-exclusive price is required and must be greater than 0.'
      }
    }

    const exclusivePrice = parseFloat(priceExclusive)
    if (!priceExclusive || isNaN(exclusivePrice) || exclusivePrice <= 0) {
      return 'Exclusive price is required and must be greater than 0.'
    }

    return null
  }

  // Save changes
  async function handleSave() {
    setError(null)
    setSuccess(false)

    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setSaving(true)

    try {
      let finalArtworkUrl = artworkUrl

      // Upload new artwork if provided
      if (newArtwork) {
        const supabase = createClient()
        const ext = newArtwork.name.split('.').pop() || 'jpg'
        const path = `tracks/${trackId}/artwork.${ext}`

        const { error: uploadError } = await supabase.storage
          .from('tracks-public')
          .upload(path, newArtwork, {
            contentType: newArtwork.type,
            upsert: true,
          })

        if (uploadError) {
          throw new Error(`Failed to upload artwork: ${uploadError.message}`)
        }

        const { data: urlData } = supabase.storage
          .from('tracks-public')
          .getPublicUrl(path)
        finalArtworkUrl = urlData.publicUrl
      }

      // Update track
      const res = await fetch(`/api/admin/tracks/${trackId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          genre: genre || null,
          mood: mood || null,
          bpm: bpm || null,
          key: key || null,
          vocalist_type: vocalistType,
          is_ai_generated: isAiGenerated,
          license_type: licenseType,
          license_limit: licenseType === 'limited' ? licenseLimit : null,
          price_non_exclusive: licenseType !== 'exclusive' ? priceNonExclusive : null,
          price_exclusive: priceExclusive,
          lyrics: lyrics || null,
          artwork_url: finalArtworkUrl,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save changes')
      }

      setSuccess(true)
      setArtworkUrl(finalArtworkUrl)
      setNewArtwork(null)
      setArtworkPreview(null)

      // Redirect after short delay
      setTimeout(() => {
        router.push('/admin/tracks')
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <Link
            href="/admin/tracks"
            className="mb-2 inline-flex items-center gap-1 text-sm text-text-muted hover:text-text-primary"
          >
            <ChevronLeftIcon className="h-4 w-4" />
            Back to Tracks
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            Edit Track
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Creator: {creatorName} &middot; Status:{' '}
            <span className="capitalize">{status}</span>
          </p>
        </div>
      </div>

      {/* Success message */}
      {success && (
        <div className="mb-6 rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
          Changes saved successfully! Redirecting...
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mb-6 rounded-lg border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
          {error}
        </div>
      )}

      {/* Form */}
      <div className="space-y-6">
        {/* Basic Info */}
        <div className="rounded-xl border border-border-default bg-bg-elevated p-6">
          <h2 className="mb-5 text-lg font-semibold text-text-primary">
            Basic Information
          </h2>

          <div className="space-y-5">
            {/* Title */}
            <FieldGroup label="Title" required>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg border border-border-default bg-bg-primary px-4 py-2.5 text-sm text-text-primary transition-colors focus:border-accent focus:outline-none"
              />
            </FieldGroup>

            {/* Genre & Mood */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <FieldGroup label="Genre" required>
                <select
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className="w-full rounded-lg border border-border-default bg-bg-primary px-4 py-2.5 text-sm text-text-primary transition-colors focus:border-accent focus:outline-none"
                >
                  <option value="">Select genre</option>
                  {GENRES.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </FieldGroup>

              <FieldGroup label="Mood" required>
                <select
                  value={mood}
                  onChange={(e) => setMood(e.target.value)}
                  className="w-full rounded-lg border border-border-default bg-bg-primary px-4 py-2.5 text-sm text-text-primary transition-colors focus:border-accent focus:outline-none"
                >
                  <option value="">Select mood</option>
                  {MOODS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </FieldGroup>
            </div>

            {/* BPM & Key */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <FieldGroup label="BPM" hint="Optional">
                <input
                  type="number"
                  min={1}
                  max={999}
                  value={bpm}
                  onChange={(e) => setBpm(e.target.value)}
                  placeholder="e.g. 120"
                  className="w-full rounded-lg border border-border-default bg-bg-primary px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-accent focus:outline-none"
                />
              </FieldGroup>

              <FieldGroup label="Key" hint="Optional">
                <select
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  className="w-full rounded-lg border border-border-default bg-bg-primary px-4 py-2.5 text-sm text-text-primary transition-colors focus:border-accent focus:outline-none"
                >
                  <option value="">Select key</option>
                  {KEY_OPTIONS.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
              </FieldGroup>
            </div>

            {/* Vocalist Type */}
            <FieldGroup label="Vocalist Type" required>
              <div className="flex gap-6">
                {(['male', 'female'] as const).map((type) => (
                  <label
                    key={type}
                    className="flex cursor-pointer items-center gap-2 text-sm text-text-primary"
                  >
                    <input
                      type="radio"
                      name="vocalist_type"
                      value={type}
                      checked={vocalistType === type}
                      onChange={() => setVocalistType(type)}
                      className="h-4 w-4 accent-accent"
                    />
                    <span className="capitalize">{type}</span>
                  </label>
                ))}
              </div>
            </FieldGroup>

            {/* AI Generated */}
            <label className="flex cursor-pointer items-center gap-3 text-sm text-text-primary">
              <input
                type="checkbox"
                checked={isAiGenerated}
                onChange={(e) => setIsAiGenerated(e.target.checked)}
                className="h-4 w-4 rounded accent-accent"
              />
              This track uses AI-generated vocals
            </label>
          </div>
        </div>

        {/* Pricing & License */}
        <div className="rounded-xl border border-border-default bg-bg-elevated p-6">
          <h2 className="mb-5 text-lg font-semibold text-text-primary">
            Pricing & License
          </h2>

          <div className="space-y-5">
            {/* License Type */}
            <FieldGroup label="License Type" required>
              <select
                value={licenseType}
                onChange={(e) => setLicenseType(e.target.value as LicenseType)}
                className="w-full rounded-lg border border-border-default bg-bg-primary px-4 py-2.5 text-sm text-text-primary transition-colors focus:border-accent focus:outline-none"
              >
                <option value="unlimited">Unlimited (Non-Exclusive)</option>
                <option value="limited">Limited (Non-Exclusive)</option>
                <option value="exclusive">Exclusive Only</option>
              </select>
            </FieldGroup>

            {/* License Limit */}
            {licenseType === 'limited' && (
              <FieldGroup
                label="License Limit"
                required
                hint={`${licensesSold} already sold`}
              >
                <input
                  type="number"
                  min={licensesSold || 1}
                  value={licenseLimit}
                  onChange={(e) => setLicenseLimit(e.target.value)}
                  placeholder="e.g. 50"
                  className="w-full rounded-lg border border-border-default bg-bg-primary px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-accent focus:outline-none"
                />
              </FieldGroup>
            )}

            {/* Pricing */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {licenseType !== 'exclusive' && (
                <FieldGroup label="Non-Exclusive Price ($)" required>
                  <input
                    type="number"
                    min={0.01}
                    step={0.01}
                    value={priceNonExclusive}
                    onChange={(e) => setPriceNonExclusive(e.target.value)}
                    placeholder="e.g. 29.99"
                    className="w-full rounded-lg border border-border-default bg-bg-primary px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-accent focus:outline-none"
                  />
                </FieldGroup>
              )}

              <FieldGroup label="Exclusive Price ($)" required>
                <input
                  type="number"
                  min={0.01}
                  step={0.01}
                  value={priceExclusive}
                  onChange={(e) => setPriceExclusive(e.target.value)}
                  placeholder="e.g. 299.99"
                  className="w-full rounded-lg border border-border-default bg-bg-primary px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-accent focus:outline-none"
                />
              </FieldGroup>
            </div>
          </div>
        </div>

        {/* Artwork */}
        <div className="rounded-xl border border-border-default bg-bg-elevated p-6">
          <h2 className="mb-5 text-lg font-semibold text-text-primary">
            Artwork
          </h2>

          <div className="flex items-start gap-6">
            {/* Current/Preview artwork */}
            <div className="relative h-32 w-32 flex-shrink-0 overflow-hidden rounded-lg border border-border-default bg-bg-card">
              {artworkPreview || artworkUrl ? (
                <Image
                  src={artworkPreview || artworkUrl!}
                  alt="Track artwork"
                  fill
                  className="object-cover"
                  sizes="128px"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <MusicNoteIcon className="h-8 w-8 text-text-muted" />
                </div>
              )}
            </div>

            <div className="flex-1">
              <p className="mb-3 text-sm text-text-secondary">
                Upload a new image to replace the current artwork.
              </p>
              <input
                ref={artworkInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                onChange={(e) => handleArtworkChange(e.target.files?.[0] || null)}
                className="hidden"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => artworkInputRef.current?.click()}
                  className="rounded-lg border border-border-default px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:border-border-hover hover:text-text-primary"
                >
                  Choose File
                </button>
                {newArtwork && (
                  <button
                    type="button"
                    onClick={() => handleArtworkChange(null)}
                    className="rounded-lg px-4 py-2 text-sm font-medium text-error transition-colors hover:bg-error/10"
                  >
                    Remove
                  </button>
                )}
              </div>
              {newArtwork && (
                <p className="mt-2 text-xs text-text-muted">
                  New file: {newArtwork.name}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Lyrics */}
        <div className="rounded-xl border border-border-default bg-bg-elevated p-6">
          <h2 className="mb-5 text-lg font-semibold text-text-primary">
            Lyrics
          </h2>

          <textarea
            value={lyrics}
            onChange={(e) => setLyrics(e.target.value)}
            placeholder="Enter lyrics..."
            rows={8}
            className="w-full resize-y rounded-lg border border-border-default bg-bg-primary px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-accent focus:outline-none"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/admin/tracks"
            className="rounded-lg border border-border-default px-5 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:border-border-hover hover:text-text-primary"
          >
            Cancel
          </Link>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-accent px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* --- Helper Components --- */

function FieldGroup({
  label,
  required,
  hint,
  children,
}: {
  label: string
  required?: boolean
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-text-primary">
        {label}
        {required && <span className="ml-1 text-accent">*</span>}
        {hint && (
          <span className="ml-2 text-xs font-normal text-text-muted">({hint})</span>
        )}
      </label>
      {children}
    </div>
  )
}

/* --- Icons --- */

function ChevronLeftIcon({ className }: { className?: string }) {
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
      <path d="M15 18l-6-6 6-6" />
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
