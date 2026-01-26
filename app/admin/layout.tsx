import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import AdminSidebar from './AdminSidebar'

export const metadata: Metadata = {
  title: 'Admin Panel - FEATUNE',
  description: 'Manage tracks, creators, payouts, and analytics on FEATUNE.',
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // Auth check
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Admin check: is the user flagged as an admin?
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    redirect('/')
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <AdminSidebar />

      {/* Main content */}
      <main className="flex-1 bg-bg-card p-6 pb-24 lg:pb-6">{children}</main>
    </div>
  )
}
