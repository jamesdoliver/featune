import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import LogoutButton from './LogoutButton'

export const metadata: Metadata = {
  title: 'Account - FEATUNE',
  description: 'Manage your FEATUNE account.',
}

export default async function AccountPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const accountType = profile?.is_admin
    ? 'Admin'
    : profile?.is_creator
      ? 'Creator'
      : 'Customer'

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Unknown'

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      {/* Page heading */}
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-text-primary">
          Account
        </h1>
        <LogoutButton />
      </div>

      {/* Profile card */}
      <div className="rounded-xl border border-border-default bg-bg-card p-6">
        <h2 className="mb-6 text-sm font-semibold uppercase tracking-wider text-text-secondary">
          Profile Information
        </h2>

        <dl className="space-y-5">
          <div>
            <dt className="text-sm text-text-muted">Name</dt>
            <dd className="mt-1 text-lg font-medium text-text-primary">
              {profile?.full_name || 'Not set'}
            </dd>
          </div>

          <div className="border-t border-border-default pt-5">
            <dt className="text-sm text-text-muted">Email</dt>
            <dd className="mt-1 text-lg font-medium text-text-primary">
              {profile?.email || user.email || 'No email'}
            </dd>
          </div>

          <div className="border-t border-border-default pt-5">
            <dt className="text-sm text-text-muted">Account Type</dt>
            <dd className="mt-1">
              <span className="inline-flex items-center rounded-full bg-accent-muted px-3 py-1 text-sm font-semibold text-accent">
                {accountType}
              </span>
            </dd>
          </div>

          <div className="border-t border-border-default pt-5">
            <dt className="text-sm text-text-muted">Member Since</dt>
            <dd className="mt-1 text-lg font-medium text-text-primary">
              {memberSince}
            </dd>
          </div>
        </dl>
      </div>

      {/* Quick links */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Link
          href="/account/purchases"
          className="group rounded-xl border border-border-default bg-bg-card p-5 transition-colors hover:border-border-hover"
        >
          <h3 className="text-sm font-semibold text-text-primary transition-colors group-hover:text-accent">
            Purchase History
          </h3>
          <p className="mt-1 text-sm text-text-muted">
            View your orders and download purchased tracks.
          </p>
        </Link>

        {!profile?.is_creator && (
          <Link
            href="/dashboard/apply"
            className="group rounded-xl border border-border-default bg-bg-card p-5 transition-colors hover:border-border-hover"
          >
            <h3 className="text-sm font-semibold text-text-primary transition-colors group-hover:text-accent">
              Become a Creator
            </h3>
            <p className="mt-1 text-sm text-text-muted">
              Start selling your vocal toplines on FEATUNE.
            </p>
          </Link>
        )}

        {profile?.is_creator && (
          <Link
            href="/dashboard"
            className="group rounded-xl border border-border-default bg-bg-card p-5 transition-colors hover:border-border-hover"
          >
            <h3 className="text-sm font-semibold text-text-primary transition-colors group-hover:text-accent">
              Creator Dashboard
            </h3>
            <p className="mt-1 text-sm text-text-muted">
              Manage your tracks, sales, and earnings.
            </p>
          </Link>
        )}
      </div>
    </div>
  )
}
