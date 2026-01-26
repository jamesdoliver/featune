'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { signUp } from '@/app/(auth)/actions'

type ActionState = {
  error?: string
} | null

export default function SignUpPage() {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    async (_prevState: ActionState, formData: FormData) => {
      // Client-side password validation
      const password = formData.get('password') as string
      if (password.length < 6) {
        return { error: 'Password must be at least 6 characters' }
      }

      const result = await signUp(formData)
      // If signUp succeeds, it redirects and never returns
      // If it fails, it returns { error: string }
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
            Create your account
          </p>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-border-default bg-bg-card p-8">
          <h1 className="mb-6 text-xl font-semibold text-text-primary">
            Sign Up
          </h1>

          {/* Action error */}
          {state?.error && (
            <div className="mb-4 rounded-lg bg-error/10 px-4 py-3 text-sm text-error">
              {state.error}
            </div>
          )}

          <form action={formAction} className="space-y-4">
            <div>
              <label
                htmlFor="fullName"
                className="mb-1.5 block text-sm font-medium text-text-secondary"
              >
                Full Name
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                required
                autoComplete="name"
                placeholder="Your full name"
                className="w-full rounded-lg border border-border-default bg-bg-elevated px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors focus:border-accent"
              />
            </div>

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

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium text-text-secondary"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                placeholder="At least 6 characters"
                className="w-full rounded-lg border border-border-default bg-bg-elevated px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors focus:border-accent"
              />
              <p className="mt-1 text-xs text-text-muted">
                Must be at least 6 characters
              </p>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        </div>

        {/* Login link */}
        <p className="mt-6 text-center text-sm text-text-secondary">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-accent transition-colors hover:text-accent-hover">
            Log In
          </Link>
        </p>
      </div>
    </div>
  )
}
