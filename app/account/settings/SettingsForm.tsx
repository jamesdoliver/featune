'use client'

import { useState } from 'react'
import { updateProfile, updateEmail, updatePassword } from '@/app/(auth)/actions'

interface SettingsFormProps {
  initialFullName: string
  initialEmail: string
}

export default function SettingsForm({
  initialFullName,
  initialEmail,
}: SettingsFormProps) {
  // Profile state
  const [fullName, setFullName] = useState(initialFullName)
  const [profileStatus, setProfileStatus] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)
  const [profileLoading, setProfileLoading] = useState(false)

  // Email state
  const [email, setEmail] = useState(initialEmail)
  const [emailStatus, setEmailStatus] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)
  const [emailLoading, setEmailLoading] = useState(false)

  // Password state
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordStatus, setPasswordStatus] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)
  const [passwordLoading, setPasswordLoading] = useState(false)

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileLoading(true)
    setProfileStatus(null)

    const formData = new FormData()
    formData.set('fullName', fullName)

    const result = await updateProfile(formData)

    if (result?.error) {
      setProfileStatus({ type: 'error', message: result.error })
    } else if (result?.success) {
      setProfileStatus({ type: 'success', message: result.success })
    }

    setProfileLoading(false)
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setEmailLoading(true)
    setEmailStatus(null)

    const formData = new FormData()
    formData.set('email', email)

    const result = await updateEmail(formData)

    if (result?.error) {
      setEmailStatus({ type: 'error', message: result.error })
    } else if (result?.success) {
      setEmailStatus({ type: 'success', message: result.success })
    }

    setEmailLoading(false)
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordLoading(true)
    setPasswordStatus(null)

    const formData = new FormData()
    formData.set('password', password)
    formData.set('confirmPassword', confirmPassword)

    const result = await updatePassword(formData)

    if (result?.error) {
      setPasswordStatus({ type: 'error', message: result.error })
    } else if (result?.success) {
      setPasswordStatus({ type: 'success', message: result.success })
      setPassword('')
      setConfirmPassword('')
    }

    setPasswordLoading(false)
  }

  return (
    <div className="space-y-8">
      {/* Profile Section */}
      <div className="rounded-xl border border-border-default bg-bg-card p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-text-secondary">
          Profile Information
        </h2>

        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="fullName"
              className="mb-1.5 block text-sm font-medium text-text-primary"
            >
              Full Name
            </label>
            <input
              type="text"
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-lg border border-border-default bg-bg-primary px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-accent focus:outline-none"
              placeholder="Your name"
            />
          </div>

          {profileStatus && (
            <div
              className={`rounded-lg px-4 py-3 text-sm ${
                profileStatus.type === 'success'
                  ? 'border border-success/30 bg-success/10 text-success'
                  : 'border border-error/30 bg-error/10 text-error'
              }`}
            >
              {profileStatus.message}
            </div>
          )}

          <button
            type="submit"
            disabled={profileLoading}
            className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            {profileLoading ? 'Saving...' : 'Update Profile'}
          </button>
        </form>
      </div>

      {/* Email Section */}
      <div className="rounded-xl border border-border-default bg-bg-card p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-text-secondary">
          Email Address
        </h2>

        <form onSubmit={handleEmailSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-sm font-medium text-text-primary"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-border-default bg-bg-primary px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-accent focus:outline-none"
              placeholder="you@example.com"
            />
            <p className="mt-1.5 text-xs text-text-muted">
              A verification email will be sent to confirm the change.
            </p>
          </div>

          {emailStatus && (
            <div
              className={`rounded-lg px-4 py-3 text-sm ${
                emailStatus.type === 'success'
                  ? 'border border-success/30 bg-success/10 text-success'
                  : 'border border-error/30 bg-error/10 text-error'
              }`}
            >
              {emailStatus.message}
            </div>
          )}

          <button
            type="submit"
            disabled={emailLoading}
            className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            {emailLoading ? 'Sending...' : 'Update Email'}
          </button>
        </form>
      </div>

      {/* Password Section */}
      <div className="rounded-xl border border-border-default bg-bg-card p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-text-secondary">
          Change Password
        </h2>

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium text-text-primary"
            >
              New Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-border-default bg-bg-primary px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-accent focus:outline-none"
              placeholder="Min 8 chars, upper + lower + number"
              minLength={8}
            />
            <p className="mt-1.5 text-xs text-text-muted">
              At least 8 characters with uppercase, lowercase, and a number
            </p>
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-1.5 block text-sm font-medium text-text-primary"
            >
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-lg border border-border-default bg-bg-primary px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-accent focus:outline-none"
              placeholder="Confirm your new password"
              minLength={8}
            />
          </div>

          {passwordStatus && (
            <div
              className={`rounded-lg px-4 py-3 text-sm ${
                passwordStatus.type === 'success'
                  ? 'border border-success/30 bg-success/10 text-success'
                  : 'border border-error/30 bg-error/10 text-error'
              }`}
            >
              {passwordStatus.message}
            </div>
          )}

          <button
            type="submit"
            disabled={passwordLoading || !password || !confirmPassword}
            className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            {passwordLoading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  )
}
