import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import SettingsForm from './SettingsForm'

export const metadata: Metadata = {
  title: 'Account Settings - FEATUNE',
  description: 'Manage your FEATUNE account settings.',
}

export default async function SettingsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', user.id)
    .single()

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      {/* Header with back link */}
      <div className="mb-8">
        <Link
          href="/account"
          className="mb-4 inline-flex items-center gap-1 text-sm text-text-muted transition-colors hover:text-text-primary"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            className="rotate-90"
          >
            <path
              d="M4 6L8 10L12 6"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Back to Account
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-text-primary">
          Account Settings
        </h1>
        <p className="mt-2 text-text-secondary">
          Update your profile information, email, and password.
        </p>
      </div>

      <SettingsForm
        initialFullName={profile?.full_name || ''}
        initialEmail={profile?.email || user.email || ''}
      />
    </div>
  )
}
