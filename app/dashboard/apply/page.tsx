'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type FormState = 'idle' | 'loading' | 'success'

export default function ApplyPage() {
  const router = useRouter()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formState, setFormState] = useState<FormState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [profileImage, setProfileImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isAuthChecking, setIsAuthChecking] = useState(true)

  // Auth + creator check
  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.replace('/login?redirect=/dashboard/apply')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_creator')
        .eq('id', user.id)
        .single()

      if (profile?.is_creator) {
        router.replace('/dashboard')
        return
      }

      setIsAuthChecking(false)
    }

    checkAuth()
  }, [supabase, router])

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPG, PNG, etc.)')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5MB')
      return
    }

    setProfileImage(file)
    setError(null)

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  function removeImage() {
    setProfileImage(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setFormState('loading')

    try {
      const formData = new FormData()
      formData.append('display_name', displayName.trim())

      if (bio.trim()) {
        formData.append('bio', bio.trim())
      }

      if (profileImage) {
        formData.append('profile_image', profileImage)
      }

      const response = await fetch('/api/creators/apply', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to submit application')
      }

      setFormState('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setFormState('idle')
    }
  }

  // Loading state during auth check
  if (isAuthChecking) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg animate-pulse">
          <div className="mb-8 text-center">
            <div className="mx-auto h-8 w-48 rounded bg-bg-card" />
          </div>
          <div className="h-[500px] rounded-xl border border-border-default bg-bg-card" />
        </div>
      </div>
    )
  }

  // Success state
  if (formState === 'success') {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg text-center">
          <div className="rounded-xl border border-border-default bg-bg-card p-8">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
              <svg
                className="h-8 w-8 text-success"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 12.75l6 6 9-13.5"
                />
              </svg>
            </div>

            <h1 className="mb-2 text-2xl font-bold text-text-primary">
              Application Submitted
            </h1>
            <p className="mb-6 text-text-secondary">
              Your creator application is under review. We will notify you once
              it has been approved.
            </p>

            <Link
              href="/account"
              className="inline-flex items-center rounded-lg bg-accent px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
            >
              Back to Account
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Application form
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block">
            <span className="text-3xl font-bold tracking-tight text-text-primary">
              FEA<span className="text-accent">TUNE</span>
            </span>
          </Link>
          <p className="mt-2 text-sm text-text-secondary">
            Apply to become a creator
          </p>
        </div>

        {/* Form card */}
        <div className="rounded-xl border border-border-default bg-bg-card p-8">
          <h1 className="mb-2 text-xl font-semibold text-text-primary">
            Become a Creator
          </h1>
          <p className="mb-6 text-sm text-text-muted">
            Start selling your vocal toplines on FEATUNE. Fill in your creator
            profile details below.
          </p>

          {/* Error message */}
          {error && (
            <div className="mb-4 rounded-lg bg-error/10 px-4 py-3 text-sm text-error">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Display Name */}
            <div>
              <label
                htmlFor="display_name"
                className="mb-1.5 block text-sm font-medium text-text-secondary"
              >
                Display Name <span className="text-error">*</span>
              </label>
              <input
                id="display_name"
                type="text"
                required
                maxLength={50}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your artist or brand name"
                className="w-full rounded-lg border border-border-default bg-bg-elevated px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors focus:border-accent"
              />
              <p className="mt-1 text-xs text-text-muted">
                This is how you will appear on FEATUNE.
              </p>
            </div>

            {/* Bio */}
            <div>
              <label
                htmlFor="bio"
                className="mb-1.5 block text-sm font-medium text-text-secondary"
              >
                Bio
              </label>
              <textarea
                id="bio"
                rows={4}
                maxLength={500}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell listeners about yourself and your music..."
                className="w-full resize-none rounded-lg border border-border-default bg-bg-elevated px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors focus:border-accent"
              />
              <p className="mt-1 text-xs text-text-muted">
                {bio.length}/500 characters
              </p>
            </div>

            {/* Profile Image */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-secondary">
                Profile Image
              </label>

              {imagePreview ? (
                <div className="flex items-center gap-4">
                  <img
                    src={imagePreview}
                    alt="Profile preview"
                    className="h-20 w-20 rounded-full border border-border-default object-cover"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="text-sm text-text-muted transition-colors hover:text-error"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border-hover bg-bg-elevated px-4 py-6 text-sm text-text-muted transition-colors hover:border-accent hover:text-text-secondary"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                    />
                  </svg>
                  Upload image (JPG, PNG, max 5MB)
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={formState === 'loading' || !displayName.trim()}
              className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {formState === 'loading'
                ? 'Submitting...'
                : 'Submit Application'}
            </button>
          </form>
        </div>

        {/* Back link */}
        <p className="mt-6 text-center text-sm text-text-secondary">
          <Link
            href="/account"
            className="font-medium text-accent transition-colors hover:text-accent-hover"
          >
            Back to Account
          </Link>
        </p>
      </div>
    </div>
  )
}
