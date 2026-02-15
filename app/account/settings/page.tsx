import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
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
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-text-primary">
        Account Settings
      </h1>
      <p className="mt-2 mb-6 text-text-secondary">
        Update your profile information, email, and password.
      </p>

      <SettingsForm
        initialFullName={profile?.full_name || ''}
        initialEmail={profile?.email || user.email || ''}
      />
    </div>
  )
}
