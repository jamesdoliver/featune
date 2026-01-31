'use client'

import { useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import type { LicenseType, VocalistType } from '@/lib/types/database'

/* ─── Constants ─── */

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

const STEPS = [
  { number: 1, label: 'Metadata' },
  { number: 2, label: 'Files' },
  { number: 3, label: 'Review' },
  { number: 4, label: 'Submit' },
]

/* ─── Types ─── */

interface FormMetadata {
  title: string
  genre: string
  mood: string
  bpm: string
  key: string
  vocalist_type: VocalistType
  is_ai_generated: boolean
  license_type: LicenseType
  license_limit: string
  price_non_exclusive: string
  price_exclusive: string
}

interface FormFiles {
  listening_file: File | null
  acapella: File | null
  instrumental: File | null
  artwork: File | null
  lyrics: string
  preview_clip_start: string
}

/* ─── Helpers ─── */

function getFileExtension(file: File): string {
  const name = file.name
  const dotIndex = name.lastIndexOf('.')
  return dotIndex !== -1 ? name.slice(dotIndex) : ''
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/* ─── Main Component ─── */

export default function UploadTrackPage() {
  const [currentStep, setCurrentStep] = useState(1)

  // Step 1: Metadata
  const [metadata, setMetadata] = useState<FormMetadata>({
    title: '',
    genre: '',
    mood: '',
    bpm: '',
    key: '',
    vocalist_type: 'male',
    is_ai_generated: false,
    license_type: 'unlimited',
    license_limit: '',
    price_non_exclusive: '',
    price_exclusive: '',
  })

  // Step 2: Files
  const [files, setFiles] = useState<FormFiles>({
    listening_file: null,
    acapella: null,
    instrumental: null,
    artwork: null,
    lyrics: '',
    preview_clip_start: '0',
  })

  // Step 4: Submission state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<string>('')

  // Artwork preview
  const [artworkPreview, setArtworkPreview] = useState<string | null>(null)

  /* ─── Step Validation ─── */

  function validateStep1(): string | null {
    if (!metadata.title.trim()) return 'Title is required.'
    if (!metadata.genre) return 'Genre is required.'
    if (!metadata.mood) return 'Mood is required.'
    if (!metadata.vocalist_type) return 'Vocalist type is required.'
    if (!metadata.license_type) return 'License type is required.'

    if (metadata.license_type === 'limited') {
      const limit = parseInt(metadata.license_limit, 10)
      if (!metadata.license_limit || isNaN(limit) || limit < 1) {
        return 'License limit must be at least 1 for limited licenses.'
      }
    }

    if (metadata.license_type !== 'exclusive') {
      const price = parseFloat(metadata.price_non_exclusive)
      if (!metadata.price_non_exclusive || isNaN(price) || price <= 0) {
        return 'Non-exclusive price is required and must be greater than 0.'
      }
    }

    // Exclusive price is required for all license types per spec
    const exclusivePrice = parseFloat(metadata.price_exclusive)
    if (!metadata.price_exclusive || isNaN(exclusivePrice) || exclusivePrice <= 0) {
      return 'Exclusive price is required and must be greater than 0.'
    }

    return null
  }

  function validateStep2(): string | null {
    if (!files.listening_file) return 'Listening file (MP3) is required.'
    if (!files.acapella) return 'Acapella file (WAV) is required.'
    if (!files.instrumental) return 'Instrumental file (WAV/ZIP) is required.'
    return null
  }

  /* ─── Navigation ─── */

  const [stepError, setStepError] = useState<string | null>(null)

  function goNext() {
    setStepError(null)

    if (currentStep === 1) {
      const err = validateStep1()
      if (err) {
        setStepError(err)
        return
      }
    }

    if (currentStep === 2) {
      const err = validateStep2()
      if (err) {
        setStepError(err)
        return
      }
    }

    if (currentStep < 4) {
      setCurrentStep((s) => s + 1)
    }
  }

  function goBack() {
    setStepError(null)
    if (currentStep > 1) {
      setCurrentStep((s) => s - 1)
    }
  }

  /* ─── Metadata Handlers ─── */

  function updateMetadata<K extends keyof FormMetadata>(key: K, value: FormMetadata[K]) {
    setMetadata((prev) => ({ ...prev, [key]: value }))
  }

  /* ─── File Handlers ─── */

  function handleFileChange(
    field: 'listening_file' | 'acapella' | 'instrumental' | 'artwork',
    file: File | null
  ) {
    setFiles((prev) => ({ ...prev, [field]: file }))

    if (field === 'artwork') {
      if (artworkPreview) URL.revokeObjectURL(artworkPreview)
      if (file) {
        setArtworkPreview(URL.createObjectURL(file))
      } else {
        setArtworkPreview(null)
      }
    }
  }

  /* ─── Submission ─── */

  async function handleSubmit() {
    setIsSubmitting(true)
    setSubmitError(null)
    setUploadProgress('Preparing upload...')

    try {
      const supabase = createClient()
      const trackId = crypto.randomUUID()

      // Get the current user's creator record
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated. Please log in again.')

      const { data: creator } = await supabase
        .from('creators')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!creator) throw new Error('Creator record not found.')

      // 1. Upload files to Supabase Storage
      const uploadedUrls: Record<string, string> = {}

      // Listening file (public)
      if (files.listening_file) {
        setUploadProgress('Uploading listening file...')
        const ext = getFileExtension(files.listening_file)
        const path = `tracks/${trackId}/listening${ext}`
        const { error } = await supabase.storage
          .from('tracks-public')
          .upload(path, files.listening_file, {
            contentType: files.listening_file.type,
            upsert: false,
          })
        if (error) throw new Error(`Failed to upload listening file: ${error.message}`)
        const { data: urlData } = supabase.storage.from('tracks-public').getPublicUrl(path)
        uploadedUrls.listening_file_url = urlData.publicUrl
      }

      // Acapella (private)
      if (files.acapella) {
        setUploadProgress('Uploading acapella...')
        const ext = getFileExtension(files.acapella)
        const path = `tracks/${trackId}/acapella${ext}`
        const { error } = await supabase.storage
          .from('tracks-private')
          .upload(path, files.acapella, {
            contentType: files.acapella.type,
            upsert: false,
          })
        if (error) throw new Error(`Failed to upload acapella: ${error.message}`)
        uploadedUrls.acapella_url = path // Store path for signed URL generation
      }

      // Instrumental (private)
      if (files.instrumental) {
        setUploadProgress('Uploading instrumental...')
        const ext = getFileExtension(files.instrumental)
        const path = `tracks/${trackId}/instrumental${ext}`
        const { error } = await supabase.storage
          .from('tracks-private')
          .upload(path, files.instrumental, {
            contentType: files.instrumental.type,
            upsert: false,
          })
        if (error) throw new Error(`Failed to upload instrumental: ${error.message}`)
        uploadedUrls.instrumental_url = path
      }

      // Artwork (public, optional)
      if (files.artwork) {
        setUploadProgress('Uploading artwork...')
        const ext = getFileExtension(files.artwork)
        const path = `tracks/${trackId}/artwork${ext}`
        const { error } = await supabase.storage
          .from('tracks-public')
          .upload(path, files.artwork, {
            contentType: files.artwork.type,
            upsert: false,
          })
        if (error) throw new Error(`Failed to upload artwork: ${error.message}`)
        const { data: urlData } = supabase.storage.from('tracks-public').getPublicUrl(path)
        uploadedUrls.artwork_url = urlData.publicUrl
      }

      // 2. Call FastAPI for audio processing (waveform, watermarked previews)
      let waveformData: number[] | null = null
      let previewClipUrl: string | null = null
      let fullPreviewUrl: string | null = null

      if (uploadedUrls.listening_file_url) {
        setUploadProgress('Processing audio (waveform + previews)...')
        const fastapiUrl =
          process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://localhost:8000'

        try {
          const processFormData = new FormData()
          processFormData.append('listening_file', files.listening_file!)
          processFormData.append(
            'preview_clip_start',
            files.preview_clip_start || '0'
          )
          processFormData.append('track_id', trackId)

          const processRes = await fetch(`${fastapiUrl}/process/upload`, {
            method: 'POST',
            body: processFormData,
          })

          if (processRes.ok) {
            const processData = await processRes.json()
            waveformData = processData.waveform_data ?? null
            previewClipUrl = processData.preview_clip_url ?? null
            fullPreviewUrl = processData.full_preview_url ?? null
          } else {
            // Non-fatal: track can still be created without processed audio
            console.warn('Audio processing failed, continuing without previews.')
          }
        } catch {
          console.warn(
            'Could not reach audio processing service, continuing without previews.'
          )
        }
      }

      // 3. Create track record in Supabase
      setUploadProgress('Creating track record...')
      const trackRecord = {
        id: trackId,
        creator_id: creator.id,
        title: metadata.title.trim(),
        genre: metadata.genre || null,
        mood: metadata.mood || null,
        bpm: metadata.bpm ? parseInt(metadata.bpm, 10) : null,
        key: metadata.key || null,
        vocalist_type: metadata.vocalist_type,
        is_ai_generated: metadata.is_ai_generated,
        license_type: metadata.license_type,
        license_limit:
          metadata.license_type === 'limited'
            ? parseInt(metadata.license_limit, 10)
            : null,
        licenses_sold: 0,
        price_non_exclusive:
          metadata.license_type !== 'exclusive'
            ? parseFloat(metadata.price_non_exclusive)
            : null,
        price_exclusive: parseFloat(metadata.price_exclusive),
        lyrics: files.lyrics || null,
        preview_clip_start: files.preview_clip_start
          ? parseInt(files.preview_clip_start, 10)
          : 0,
        listening_file_url: uploadedUrls.listening_file_url ?? null,
        acapella_url: uploadedUrls.acapella_url ?? null,
        instrumental_url: uploadedUrls.instrumental_url ?? null,
        artwork_url: uploadedUrls.artwork_url ?? null,
        waveform_data: waveformData,
        preview_clip_url: previewClipUrl,
        full_preview_url: fullPreviewUrl,
        status: 'pending' as const,
      }

      const { error: insertError } = await supabase
        .from('tracks')
        .insert(trackRecord)

      if (insertError) {
        throw new Error(`Failed to create track: ${insertError.message}`)
      }

      // Notify admin of new submission (non-blocking)
      fetch('/api/tracks/notify-submission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackTitle: metadata.title.trim() }),
      }).catch(() => {})

      setUploadProgress('')
      setSubmitSuccess(true)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'An unexpected error occurred.')
      setUploadProgress('')
    } finally {
      setIsSubmitting(false)
    }
  }

  /* ─── Render ─── */

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-8 text-2xl font-bold tracking-tight text-text-primary">
        Upload Track
      </h1>

      {/* Step Indicators */}
      <StepIndicator currentStep={currentStep} />

      {/* Step Content */}
      <div className="mt-8">
        {currentStep === 1 && (
          <StepMetadata
            metadata={metadata}
            onUpdate={updateMetadata}
            error={stepError}
          />
        )}

        {currentStep === 2 && (
          <StepFiles
            files={files}
            artworkPreview={artworkPreview}
            onFileChange={handleFileChange}
            onLyricsChange={(val) => setFiles((prev) => ({ ...prev, lyrics: val }))}
            onPreviewStartChange={(val) =>
              setFiles((prev) => ({ ...prev, preview_clip_start: val }))
            }
            error={stepError}
          />
        )}

        {currentStep === 3 && (
          <StepReview metadata={metadata} files={files} artworkPreview={artworkPreview} />
        )}

        {currentStep === 4 && (
          <StepSubmit
            isSubmitting={isSubmitting}
            submitError={submitError}
            submitSuccess={submitSuccess}
            uploadProgress={uploadProgress}
            onSubmit={handleSubmit}
          />
        )}
      </div>

      {/* Navigation Buttons */}
      {currentStep < 4 && (
        <div className="mt-8 flex items-center justify-between">
          <button
            type="button"
            onClick={goBack}
            disabled={currentStep === 1}
            className="rounded-lg border border-border-default bg-bg-primary px-5 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:border-border-hover hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40"
          >
            Back
          </button>
          <button
            type="button"
            onClick={goNext}
            className="rounded-lg bg-accent px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
          >
            {currentStep === 3 ? 'Continue to Submit' : 'Next'}
          </button>
        </div>
      )}

      {currentStep === 4 && !submitSuccess && !isSubmitting && (
        <div className="mt-8 flex items-center justify-between">
          <button
            type="button"
            onClick={goBack}
            className="rounded-lg border border-border-default bg-bg-primary px-5 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:border-border-hover hover:text-text-primary"
          >
            Back
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="rounded-lg bg-accent px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            Submit Track
          </button>
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   Step Indicator Component
   ═══════════════════════════════════════════════════════════════ */

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-between">
      {STEPS.map((step, idx) => {
        const isActive = currentStep === step.number
        const isCompleted = currentStep > step.number

        return (
          <div key={step.number} className="flex items-center">
            {/* Step circle + label */}
            <div className="flex flex-col items-center">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                  isCompleted
                    ? 'bg-success text-white'
                    : isActive
                      ? 'bg-accent text-white'
                      : 'bg-bg-elevated text-text-muted'
                }`}
              >
                {isCompleted ? (
                  <CheckIcon className="h-4 w-4" />
                ) : (
                  step.number
                )}
              </div>
              <span
                className={`mt-1.5 text-xs font-medium ${
                  isActive
                    ? 'text-accent'
                    : isCompleted
                      ? 'text-success'
                      : 'text-text-muted'
                }`}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line */}
            {idx < STEPS.length - 1 && (
              <div
                className={`mx-3 h-0.5 w-12 sm:w-20 md:w-28 ${
                  currentStep > step.number ? 'bg-success' : 'bg-bg-elevated'
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   Step 1: Metadata
   ═══════════════════════════════════════════════════════════════ */

interface StepMetadataProps {
  metadata: FormMetadata
  onUpdate: <K extends keyof FormMetadata>(key: K, value: FormMetadata[K]) => void
  error: string | null
}

function StepMetadata({ metadata, onUpdate, error }: StepMetadataProps) {
  return (
    <div className="rounded-xl border border-border-default bg-bg-elevated p-6">
      <h2 className="mb-6 text-lg font-semibold text-text-primary">Track Details</h2>

      {error && <ErrorBanner message={error} />}

      <div className="space-y-5">
        {/* Title */}
        <FieldGroup label="Title" required>
          <input
            type="text"
            value={metadata.title}
            onChange={(e) => onUpdate('title', e.target.value)}
            placeholder="Enter track title"
            className="w-full rounded-lg border border-border-default bg-bg-primary px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-accent focus:outline-none"
          />
        </FieldGroup>

        {/* Genre & Mood */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <FieldGroup label="Genre" required>
            <select
              value={metadata.genre}
              onChange={(e) => onUpdate('genre', e.target.value)}
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
              value={metadata.mood}
              onChange={(e) => onUpdate('mood', e.target.value)}
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
              value={metadata.bpm}
              onChange={(e) => onUpdate('bpm', e.target.value)}
              placeholder="e.g. 120"
              className="w-full rounded-lg border border-border-default bg-bg-primary px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-accent focus:outline-none"
            />
          </FieldGroup>

          <FieldGroup label="Key" hint="Optional">
            <select
              value={metadata.key}
              onChange={(e) => onUpdate('key', e.target.value)}
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
                  checked={metadata.vocalist_type === type}
                  onChange={() => onUpdate('vocalist_type', type)}
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
            checked={metadata.is_ai_generated}
            onChange={(e) => onUpdate('is_ai_generated', e.target.checked)}
            className="h-4 w-4 rounded accent-accent"
          />
          This track uses AI-generated vocals
        </label>

        {/* Divider */}
        <div className="border-t border-border-default" />

        {/* License Type */}
        <FieldGroup label="License Type" required>
          <select
            value={metadata.license_type}
            onChange={(e) => onUpdate('license_type', e.target.value as LicenseType)}
            className="w-full rounded-lg border border-border-default bg-bg-primary px-4 py-2.5 text-sm text-text-primary transition-colors focus:border-accent focus:outline-none"
          >
            <option value="unlimited">Unlimited (Non-Exclusive)</option>
            <option value="limited">Limited (Non-Exclusive)</option>
            <option value="exclusive">Exclusive Only</option>
          </select>
        </FieldGroup>

        {/* License Limit (only for limited) */}
        {metadata.license_type === 'limited' && (
          <FieldGroup label="License Limit" required hint="Maximum number of licenses">
            <input
              type="number"
              min={1}
              value={metadata.license_limit}
              onChange={(e) => onUpdate('license_limit', e.target.value)}
              placeholder="e.g. 50"
              className="w-full rounded-lg border border-border-default bg-bg-primary px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-accent focus:outline-none"
            />
          </FieldGroup>
        )}

        {/* Pricing */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {metadata.license_type !== 'exclusive' && (
            <FieldGroup label="Non-Exclusive Price ($)" required>
              <input
                type="number"
                min={0.01}
                step={0.01}
                value={metadata.price_non_exclusive}
                onChange={(e) => onUpdate('price_non_exclusive', e.target.value)}
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
              value={metadata.price_exclusive}
              onChange={(e) => onUpdate('price_exclusive', e.target.value)}
              placeholder="e.g. 299.99"
              className="w-full rounded-lg border border-border-default bg-bg-primary px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-accent focus:outline-none"
            />
          </FieldGroup>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   Step 2: Files
   ═══════════════════════════════════════════════════════════════ */

interface StepFilesProps {
  files: FormFiles
  artworkPreview: string | null
  onFileChange: (
    field: 'listening_file' | 'acapella' | 'instrumental' | 'artwork',
    file: File | null
  ) => void
  onLyricsChange: (value: string) => void
  onPreviewStartChange: (value: string) => void
  error: string | null
}

function StepFiles({
  files,
  artworkPreview,
  onFileChange,
  onLyricsChange,
  onPreviewStartChange,
  error,
}: StepFilesProps) {
  return (
    <div className="rounded-xl border border-border-default bg-bg-elevated p-6">
      <h2 className="mb-6 text-lg font-semibold text-text-primary">Upload Files</h2>

      {error && <ErrorBanner message={error} />}

      <div className="space-y-6">
        {/* Listening File */}
        <FileDropZone
          label="Listening File"
          required
          accept=".mp3,audio/mpeg"
          hint="MP3 format"
          file={files.listening_file}
          onFileSelect={(f) => onFileChange('listening_file', f)}
          onClear={() => onFileChange('listening_file', null)}
        />

        {/* Acapella */}
        <FileDropZone
          label="Acapella"
          required
          accept=".wav,audio/wav,audio/x-wav"
          hint="WAV format"
          file={files.acapella}
          onFileSelect={(f) => onFileChange('acapella', f)}
          onClear={() => onFileChange('acapella', null)}
        />

        {/* Instrumental */}
        <FileDropZone
          label="Instrumental"
          required
          accept=".wav,.zip,audio/wav,audio/x-wav,application/zip"
          hint="WAV or ZIP (stems)"
          file={files.instrumental}
          onFileSelect={(f) => onFileChange('instrumental', f)}
          onClear={() => onFileChange('instrumental', null)}
        />

        {/* Artwork */}
        <div>
          <FileDropZone
            label="Artwork"
            required={false}
            accept=".jpg,.jpeg,.png,image/jpeg,image/png"
            hint="JPG or PNG"
            file={files.artwork}
            onFileSelect={(f) => onFileChange('artwork', f)}
            onClear={() => onFileChange('artwork', null)}
          />
          {artworkPreview && (
            <div className="mt-3">
              <img
                src={artworkPreview}
                alt="Artwork preview"
                className="h-32 w-32 rounded-lg border border-border-default object-cover"
              />
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-border-default" />

        {/* Lyrics */}
        <FieldGroup label="Lyrics" hint="Optional">
          <textarea
            value={files.lyrics}
            onChange={(e) => onLyricsChange(e.target.value)}
            placeholder="Paste lyrics here..."
            rows={6}
            className="w-full rounded-lg border border-border-default bg-bg-primary px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-accent focus:outline-none resize-y"
          />
        </FieldGroup>

        {/* Preview Clip Start */}
        <FieldGroup
          label="Preview Clip Start (seconds)"
          hint="Where the 30-second preview should begin"
        >
          <input
            type="number"
            min={0}
            value={files.preview_clip_start}
            onChange={(e) => onPreviewStartChange(e.target.value)}
            placeholder="0"
            className="w-full rounded-lg border border-border-default bg-bg-primary px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-accent focus:outline-none"
          />
        </FieldGroup>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   Step 3: Review
   ═══════════════════════════════════════════════════════════════ */

interface StepReviewProps {
  metadata: FormMetadata
  files: FormFiles
  artworkPreview: string | null
}

function StepReview({ metadata, files, artworkPreview }: StepReviewProps) {
  return (
    <div className="space-y-6">
      {/* Metadata Review */}
      <div className="rounded-xl border border-border-default bg-bg-elevated p-6">
        <h2 className="mb-4 text-lg font-semibold text-text-primary">Track Details</h2>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ReviewField label="Title" value={metadata.title} />
          <ReviewField label="Genre" value={metadata.genre} />
          <ReviewField label="Mood" value={metadata.mood} />
          <ReviewField label="BPM" value={metadata.bpm || 'Not specified'} />
          <ReviewField label="Key" value={metadata.key || 'Not specified'} />
          <ReviewField
            label="Vocalist"
            value={metadata.vocalist_type === 'male' ? 'Male' : 'Female'}
          />
          <ReviewField
            label="AI Generated"
            value={metadata.is_ai_generated ? 'Yes' : 'No'}
          />
          <ReviewField
            label="License Type"
            value={
              metadata.license_type === 'unlimited'
                ? 'Unlimited'
                : metadata.license_type === 'limited'
                  ? `Limited (${metadata.license_limit} licenses)`
                  : 'Exclusive Only'
            }
          />
          {metadata.license_type !== 'exclusive' && (
            <ReviewField
              label="Non-Exclusive Price"
              value={`$${parseFloat(metadata.price_non_exclusive).toFixed(2)}`}
            />
          )}
          <ReviewField
            label="Exclusive Price"
            value={`$${parseFloat(metadata.price_exclusive).toFixed(2)}`}
          />
        </dl>
      </div>

      {/* Files Review */}
      <div className="rounded-xl border border-border-default bg-bg-elevated p-6">
        <h2 className="mb-4 text-lg font-semibold text-text-primary">Files</h2>

        <div className="space-y-3">
          <FileReviewRow
            label="Listening File"
            file={files.listening_file}
          />
          <FileReviewRow label="Acapella" file={files.acapella} />
          <FileReviewRow label="Instrumental" file={files.instrumental} />
          <FileReviewRow label="Artwork" file={files.artwork} />

          {artworkPreview && (
            <div className="mt-2">
              <img
                src={artworkPreview}
                alt="Artwork preview"
                className="h-24 w-24 rounded-lg border border-border-default object-cover"
              />
            </div>
          )}

          <div className="border-t border-border-default pt-3">
            <ReviewField
              label="Lyrics"
              value={files.lyrics ? `${files.lyrics.slice(0, 100)}${files.lyrics.length > 100 ? '...' : ''}` : 'None'}
            />
            <div className="mt-3">
              <ReviewField
                label="Preview Clip Start"
                value={`${files.preview_clip_start || '0'}s`}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   Step 4: Submit / Success
   ═══════════════════════════════════════════════════════════════ */

interface StepSubmitProps {
  isSubmitting: boolean
  submitError: string | null
  submitSuccess: boolean
  uploadProgress: string
  onSubmit: () => void
}

function StepSubmit({
  isSubmitting,
  submitError,
  submitSuccess,
  uploadProgress,
}: StepSubmitProps) {
  if (submitSuccess) {
    return (
      <div className="rounded-xl border border-success/30 bg-success/10 p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/20">
          <CheckIcon className="h-8 w-8 text-success" />
        </div>
        <h2 className="mb-2 text-xl font-bold text-text-primary">Track Submitted!</h2>
        <p className="mb-6 text-sm text-text-secondary">
          Your track has been uploaded and is now pending review. You will be notified once
          it is approved.
        </p>
        <Link
          href="/dashboard/tracks"
          className="inline-flex rounded-lg bg-accent px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
        >
          Go to My Tracks
        </Link>
      </div>
    )
  }

  if (isSubmitting) {
    return (
      <div className="rounded-xl border border-border-default bg-bg-elevated p-8 text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-bg-primary border-t-accent" />
        <h2 className="mb-2 text-lg font-semibold text-text-primary">
          Uploading your track...
        </h2>
        <p className="text-sm text-text-secondary">{uploadProgress}</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border-default bg-bg-elevated p-8 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
        <UploadCloudIcon className="h-8 w-8 text-accent" />
      </div>
      <h2 className="mb-2 text-lg font-semibold text-text-primary">Ready to Submit</h2>
      <p className="mb-4 text-sm text-text-secondary">
        Your track will be uploaded and submitted for review. This may take a moment
        depending on file sizes.
      </p>

      {submitError && <ErrorBanner message={submitError} />}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   Shared Components
   ═══════════════════════════════════════════════════════════════ */

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

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="mb-4 rounded-lg border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
      {message}
    </div>
  )
}

function ReviewField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wider text-text-muted">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm text-text-primary">{value}</dd>
    </div>
  )
}

function FileReviewRow({ label, file }: { label: string; file: File | null }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-text-muted">{label}</span>
      {file ? (
        <span className="text-sm text-text-primary">
          {file.name}{' '}
          <span className="text-text-muted">({formatFileSize(file.size)})</span>
        </span>
      ) : (
        <span className="text-sm text-text-muted">Not provided</span>
      )}
    </div>
  )
}

/* ─── File Drop Zone ─── */

interface FileDropZoneProps {
  label: string
  required: boolean
  accept: string
  hint: string
  file: File | null
  onFileSelect: (file: File) => void
  onClear: () => void
}

function FileDropZone({
  label,
  required,
  accept,
  hint,
  file,
  onFileSelect,
  onClear,
}: FileDropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const droppedFile = e.dataTransfer.files[0]
      if (droppedFile) {
        onFileSelect(droppedFile)
      }
    },
    [onFileSelect]
  )

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = e.target.files?.[0]
      if (selected) {
        onFileSelect(selected)
      }
    },
    [onFileSelect]
  )

  if (file) {
    return (
      <div>
        <label className="mb-1.5 block text-sm font-medium text-text-primary">
          {label}
          {required && <span className="ml-1 text-accent">*</span>}
          <span className="ml-2 text-xs font-normal text-text-muted">({hint})</span>
        </label>
        <div className="flex items-center justify-between rounded-lg border border-success/30 bg-success/5 px-4 py-3">
          <div className="flex items-center gap-3">
            <FileIcon className="h-5 w-5 flex-shrink-0 text-success" />
            <div>
              <p className="text-sm font-medium text-text-primary">{file.name}</p>
              <p className="text-xs text-text-muted">{formatFileSize(file.size)}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClear}
            className="rounded-md p-1 text-text-muted transition-colors hover:bg-bg-primary hover:text-error"
            aria-label={`Remove ${label}`}
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-text-primary">
        {label}
        {required && <span className="ml-1 text-accent">*</span>}
        <span className="ml-2 text-xs font-normal text-text-muted">({hint})</span>
      </label>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-8 text-center transition-colors ${
          isDragging
            ? 'border-accent bg-accent/5'
            : 'border-border-default hover:border-border-hover hover:bg-bg-primary/50'
        }`}
      >
        <UploadCloudIcon
          className={`mb-2 h-8 w-8 ${isDragging ? 'text-accent' : 'text-text-muted'}`}
        />
        <p className="text-sm text-text-secondary">
          <span className="font-medium text-accent">Click to upload</span> or drag and
          drop
        </p>
        <p className="mt-1 text-xs text-text-muted">{hint}</p>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleInputChange}
          className="hidden"
        />
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   Icons
   ═══════════════════════════════════════════════════════════════ */

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function UploadCloudIcon({ className }: { className?: string }) {
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
      <polyline points="16 16 12 12 8 16" />
      <line x1="12" y1="12" x2="12" y2="21" />
      <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" />
      <polyline points="16 16 12 12 8 16" />
    </svg>
  )
}

function FileIcon({ className }: { className?: string }) {
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
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  )
}

function XIcon({ className }: { className?: string }) {
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
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}
