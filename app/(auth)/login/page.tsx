'use client'

import { useActionState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import { signIn } from '@/app/(auth)/actions'

type ActionState = {
  error?: string
} | null

function LoginForm() {
  const searchParams = useSearchParams()
  const errorParam = searchParams.get('error')
  const messageParam = searchParams.get('message')
  const redirectParam = searchParams.get('redirect')

  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    async (_prevState: ActionState, formData: FormData) => {
      const result = await signIn(formData)
      // If signIn succeeds, it redirects and never returns
      // If it fails, it returns { error: string }
      return result ?? null
    },
    null
  )

  return (
    <div className="w-full max-w-[400px]">
      {/* Logo */}
      <div className="mb-8 text-center">
        <Link href="/" className="inline-block">
          <span className="text-3xl font-bold tracking-tight text-text-primary">
            FEA<span className="text-accent">TUNE</span>
          </span>
        </Link>
        <p className="mt-2 text-sm text-text-secondary">
          Welcome back
        </p>
      </div>

      {/* Card */}
      <div className="rounded-xl border border-border-default bg-bg-card p-8">
        <h1 className="mb-6 text-xl font-semibold text-text-primary">
          Log In
        </h1>

        {/* URL error param (e.g., from callback failure) */}
        {errorParam && (
          <div className="mb-4 rounded-lg bg-error/10 px-4 py-3 text-sm text-error">
            {errorParam}
          </div>
        )}

        {/* URL success message (e.g., after signup) */}
        {messageParam && (
          <div className="mb-4 rounded-lg bg-success/10 px-4 py-3 text-sm text-success">
            {messageParam}
          </div>
        )}

        {/* Action error */}
        {state?.error && (
          <div className="mb-4 rounded-lg bg-error/10 px-4 py-3 text-sm text-error">
            {state.error}
          </div>
        )}

        <form action={formAction} className="space-y-4">
          {/* Hidden redirect */}
          {redirectParam && (
            <input type="hidden" name="redirect" value={redirectParam} />
          )}

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
              autoComplete="current-password"
              placeholder="Your password"
              className="w-full rounded-lg border border-border-default bg-bg-elevated px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors focus:border-accent"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <Link
            href="/reset-password"
            className="text-sm text-text-muted transition-colors hover:text-text-secondary"
          >
            Forgot your password?
          </Link>
        </div>
      </div>

      {/* Sign up link */}
      <p className="mt-6 text-center text-sm text-text-secondary">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="font-medium text-accent transition-colors hover:text-accent-hover">
          Sign Up
        </Link>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <Suspense fallback={
        <div className="w-full max-w-[400px] animate-pulse">
          <div className="mb-8 text-center">
            <span className="text-3xl font-bold tracking-tight text-text-primary">
              FEA<span className="text-accent">TUNE</span>
            </span>
          </div>
          <div className="h-[400px] rounded-xl border border-border-default bg-bg-card" />
        </div>
      }>
        <LoginForm />
      </Suspense>
    </div>
  )
}
