'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { resetPassword } from '@/app/(auth)/actions'

type ActionState = {
  error?: string
  success?: string
} | null

export default function ResetPasswordPage() {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    async (_prevState: ActionState, formData: FormData) => {
      const result = await resetPassword(formData)
      return result ?? null
    },
    null
  )

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-[400px]">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block">
            <span className="text-3xl font-bold tracking-tight text-text-primary">
              FEA<span className="text-accent">TUNE</span>
            </span>
          </Link>
          <p className="mt-2 text-sm text-text-secondary">
            Reset your password
          </p>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-border-default bg-bg-card p-8">
          <h1 className="mb-2 text-xl font-semibold text-text-primary">
            Reset Password
          </h1>
          <p className="mb-6 text-sm text-text-secondary">
            Enter your email and we&apos;ll send you a link to reset your password.
          </p>

          {/* Success message */}
          {state?.success && (
            <div className="mb-4 rounded-lg bg-success/10 px-4 py-3 text-sm text-success">
              {state.success}
            </div>
          )}

          {/* Error message */}
          {state?.error && (
            <div className="mb-4 rounded-lg bg-error/10 px-4 py-3 text-sm text-error">
              {state.error}
            </div>
          )}

          <form action={formAction} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-text-secondary"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full rounded-lg border border-border-default bg-bg-elevated px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors focus:border-accent"
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        </div>

        {/* Back to login */}
        <p className="mt-6 text-center text-sm text-text-secondary">
          Remember your password?{' '}
          <Link href="/login" className="font-medium text-accent transition-colors hover:text-accent-hover">
            Log In
          </Link>
        </p>
      </div>
    </div>
  )
}
