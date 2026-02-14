import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import DashboardSidebar from './DashboardSidebar'
import type { Creator } from '@/lib/types/database'

export const metadata: Metadata = {
  title: 'Creator Dashboard - FEATUNE',
  description: 'Manage your tracks, sales, and earnings on FEATUNE.',
}

export default async function DashboardLayout({
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

  // Fetch creator record directly (don't rely on is_creator flag alone)
  const { data: creator } = await supabase
    .from('creators')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!creator) {
    redirect('/dashboard/apply')
  }

  const typedCreator = creator as Creator

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <DashboardSidebar creator={typedCreator} />

      <div className="flex flex-1 flex-col">
        {/* Pending review banner */}
        {typedCreator.status === 'pending' && (
          <div className="border-b border-warning/30 bg-warning/10 px-6 py-3">
            <p className="text-center text-sm font-medium text-warning">
              Your creator application is under review. Some features may be
              limited until approval.
            </p>
          </div>
        )}

        {/* Rejected banner */}
        {typedCreator.status === 'rejected' && (
          <div className="border-b border-error/30 bg-error/10 px-6 py-3">
            <p className="text-center text-sm font-medium text-error">
              Your creator application has been rejected. Please contact
              support for more information.
            </p>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 bg-bg-card p-6 pb-24 lg:pb-6">
          {children}
        </main>
      </div>
    </div>
  )
}
