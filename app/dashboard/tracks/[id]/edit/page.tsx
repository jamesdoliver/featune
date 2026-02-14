'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import type { LicenseType, VocalistType } from '@/lib/types/database'

const GENRES = ['Pop', 'R&B', 'Hip-Hop', 'EDM', 'Afrobeats', 'Latin', 'Rock', 'Country', 'Other'] as const
const MOODS = ['Happy', 'Sad', 'Energetic', 'Chill', 'Romantic', 'Dark', 'Uplifting', 'Aggressive'] as const
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
  price_non_exclusive: number | null
  price_exclusive: number | null
  lyrics: string | null
  status: string
  rejection_reason: string | null
}

export default function EditTrackPage() {
  const params = useParams()
  const router = useRouter()
  const trackId = params.id as string

  const [track, setTrack] = useState<TrackData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Form state
  const [title, setTitle] = useState('')
  const [genre, setGenre] = useState('')
  const [mood, setMood] = useState('')
  const [bpm, setBpm] = useState('')
  const [musicalKey, setMusicalKey] = useState('')
  const [vocalistType, setVocalistType] = useState<VocalistType>('male')
  const [isAiGenerated, setIsAiGenerated] = useState(false)
  const [licenseType, setLicenseType] = useState<LicenseType>('unlimited')
  const [licenseLimit, setLicenseLimit] = useState('')
  const [priceNonExclusive, setPriceNonExclusive] = useState('')
  const [priceExclusive, setPriceExclusive] = useState('')
  const [lyrics, setLyrics] = useState('')

  useEffect(() => {
    async function loadTrack() {
      const supabase = createClient()
      const { data, error: fetchError } = await supabase
        .from('tracks')
        .select(
          'id, title, genre, mood, bpm, key, vocalist_type, is_ai_generated, license_type, license_limit, price_non_exclusive, price_exclusive, lyrics, status, rejection_reason'
        )
        .eq('id', trackId)
        .single()

      if (fetchError || !data) {
        setError('Track not found')
        setLoading(false)
        return
      }

      const t = data as TrackData

      if (t.status !== 'pending' && t.status !== 'rejected') {
        setError('Only pending or rejected tracks can be edited')
        setLoading(false)
        return
      }

      setTrack(t)
      setTitle(t.title)
      setGenre(t.genre || '')
      setMood(t.mood || '')
      setBpm(t.bpm?.toString() || '')
      setMusicalKey(t.key || '')
      setVocalistType(t.vocalist_type || 'male')
      setIsAiGenerated(t.is_ai_generated)
      setLicenseType(t.license_type)
      setLicenseLimit(t.license_limit?.toString() || '')
      setPriceNonExclusive(t.price_non_exclusive?.toString() || '')
      setPriceExclusive(t.price_exclusive?.toString() || '')
      setLyrics(t.lyrics || '')
      setLoading(false)
    }

    loadTrack()
  }, [trackId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const res = await fetch(`/api/creators/me/tracks/${trackId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          genre: genre || null,
          mood: mood || null,
          bpm: bpm || null,
          key: musicalKey || null,
          vocalist_type: vocalistType,
          is_ai_generated: isAiGenerated,
          license_type: licenseType,
          license_limit: licenseLimit || null,
          price_non_exclusive: priceNonExclusive || null,
          price_exclusive: priceExclusive || null,
          lyrics: lyrics || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to update track')
        return
      }

      setSuccess(true)
    } catch {
      setError('Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl py-12 text-center text-text-muted">
        Loading...
      </div>
    )
  }

  if (error && !track) {
    return (
      <div className="mx-auto max-w-2xl py-12 text-center">
        <p className="text-error">{error}</p>
        <Link href="/dashboard/tracks" className="mt-4 inline-block text-sm text-accent hover:underline">
          Back to My Tracks
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Edit Track</h1>
        <Link
          href="/dashboard/tracks"
          className="text-sm text-text-muted hover:text-text-primary"
        >
          Back to tracks
        </Link>
      </div>

      {track?.status === 'rejected' && track.rejection_reason && (
        <div className="mb-6 rounded-lg border border-error/30 bg-error/10 p-4">
          <p className="text-sm font-medium text-error">Rejection reason:</p>
          <p className="mt-1 text-sm text-error/80">{track.rejection_reason}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 rounded-lg border border-success/30 bg-success/10 p-4">
          <p className="text-sm font-medium text-success">Track updated successfully.</p>
        </div>
      )}

      {error && track && (
        <div className="mb-6 rounded-lg border border-error/30 bg-error/10 p-4">
          <p className="text-sm text-error">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-text-primary">Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full rounded-lg border border-border-default bg-bg-elevated px-4 py-2.5 text-sm text-text-primary placeholder-text-muted focus:border-accent focus:outline-none"
          />
        </div>

        {/* Genre + Mood */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-primary">Genre</label>
            <select value={genre} onChange={(e) => setGenre(e.target.value)} className="w-full rounded-lg border border-border-default bg-bg-elevated px-4 py-2.5 text-sm text-text-primary focus:border-accent focus:outline-none">
              <option value="">Select genre</option>
              {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-primary">Mood</label>
            <select value={mood} onChange={(e) => setMood(e.target.value)} className="w-full rounded-lg border border-border-default bg-bg-elevated px-4 py-2.5 text-sm text-text-primary focus:border-accent focus:outline-none">
              <option value="">Select mood</option>
              {MOODS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>

        {/* BPM + Key */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-primary">BPM</label>
            <input type="number" value={bpm} onChange={(e) => setBpm(e.target.value)} min="1" max="300" className="w-full rounded-lg border border-border-default bg-bg-elevated px-4 py-2.5 text-sm text-text-primary focus:border-accent focus:outline-none" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-primary">Key</label>
            <select value={musicalKey} onChange={(e) => setMusicalKey(e.target.value)} className="w-full rounded-lg border border-border-default bg-bg-elevated px-4 py-2.5 text-sm text-text-primary focus:border-accent focus:outline-none">
              <option value="">Select key</option>
              {KEY_OPTIONS.map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>
        </div>

        {/* Vocalist + AI */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-primary">Vocalist Type</label>
            <select value={vocalistType} onChange={(e) => setVocalistType(e.target.value as VocalistType)} className="w-full rounded-lg border border-border-default bg-bg-elevated px-4 py-2.5 text-sm text-text-primary focus:border-accent focus:outline-none">
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
          <div className="flex items-end pb-2">
            <label className="flex items-center gap-2 text-sm text-text-primary">
              <input type="checkbox" checked={isAiGenerated} onChange={(e) => setIsAiGenerated(e.target.checked)} className="rounded border-border-default" />
              AI Generated Vocal
            </label>
          </div>
        </div>

        {/* License + Pricing */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-primary">License Type</label>
            <select value={licenseType} onChange={(e) => setLicenseType(e.target.value as LicenseType)} className="w-full rounded-lg border border-border-default bg-bg-elevated px-4 py-2.5 text-sm text-text-primary focus:border-accent focus:outline-none">
              <option value="unlimited">Unlimited</option>
              <option value="limited">Limited</option>
              <option value="exclusive">Exclusive</option>
            </select>
          </div>
          {licenseType === 'limited' && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-primary">License Limit</label>
              <input type="number" value={licenseLimit} onChange={(e) => setLicenseLimit(e.target.value)} min="1" className="w-full rounded-lg border border-border-default bg-bg-elevated px-4 py-2.5 text-sm text-text-primary focus:border-accent focus:outline-none" />
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-primary">Non-Exclusive Price ($)</label>
            <input type="number" value={priceNonExclusive} onChange={(e) => setPriceNonExclusive(e.target.value)} min="0" step="0.01" className="w-full rounded-lg border border-border-default bg-bg-elevated px-4 py-2.5 text-sm text-text-primary focus:border-accent focus:outline-none" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-primary">Exclusive Price ($)</label>
            <input type="number" value={priceExclusive} onChange={(e) => setPriceExclusive(e.target.value)} min="0" step="0.01" className="w-full rounded-lg border border-border-default bg-bg-elevated px-4 py-2.5 text-sm text-text-primary focus:border-accent focus:outline-none" />
          </div>
        </div>

        {/* Lyrics */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-text-primary">Lyrics</label>
          <textarea
            value={lyrics}
            onChange={(e) => setLyrics(e.target.value)}
            rows={8}
            className="w-full rounded-lg border border-border-default bg-bg-elevated px-4 py-2.5 text-sm text-text-primary placeholder-text-muted focus:border-accent focus:outline-none"
            placeholder="Enter lyrics..."
          />
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving || !title.trim()}
            className="rounded-lg bg-accent px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <Link
            href="/dashboard/tracks"
            className="rounded-lg border border-border-default px-6 py-2.5 text-sm font-medium text-text-secondary hover:bg-bg-elevated"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
