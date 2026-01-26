import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

interface RecentSubmission {
  id: string
  title: string
  creator_name: string
  created_at: string
}

export default async function AdminOverviewPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Pending submissions count
  const { count: pendingSubmissions } = await supabase
    .from('tracks')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')

  // Pending creator applications count
  const { count: pendingApplications } = await supabase
    .from('creators')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')

  // Pending payouts count
  const { count: pendingPayouts } = await supabase
    .from('payouts')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')

  // Total revenue (sum of completed orders)
  const { data: revenueData } = await supabase
    .from('orders')
    .select('total')
    .eq('status', 'completed')

  const totalRevenue = (revenueData ?? []).reduce(
    (sum: number, order: { total: number }) => sum + (order.total ?? 0),
    0
  )

  // Recent pending submissions (last 5) with creator name
  const { data: recentTracks } = await supabase
    .from('tracks')
    .select('id, title, creator_id, created_at')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(5)

  // Fetch creator display names for the recent submissions
  const creatorIds = [
    ...new Set((recentTracks ?? []).map((t: { creator_id: string }) => t.creator_id)),
  ]

  let creatorNameMap: Record<string, string> = {}

  if (creatorIds.length > 0) {
    const { data: creators } = await supabase
      .from('creators')
      .select('id, display_name')
      .in('id', creatorIds)

    for (const c of creators ?? []) {
      creatorNameMap[c.id] = c.display_name
    }
  }

  const recentSubmissions: RecentSubmission[] = (recentTracks ?? []).map(
    (track: {
      id: string
      title: string
      creator_id: string
      created_at: string
    }) => ({
      id: track.id,
      title: track.title,
      creator_name: creatorNameMap[track.creator_id] ?? 'Unknown Creator',
      created_at: track.created_at,
    })
  )

  const stats = [
    {
      label: 'Pending Submissions',
      value: pendingSubmissions ?? 0,
      icon: InboxIcon,
      format: 'number' as const,
      color: 'bg-warning/10 text-warning',
      iconBg: 'bg-warning/10',
      iconColor: 'text-warning',
    },
    {
      label: 'Pending Applications',
      value: pendingApplications ?? 0,
      icon: UsersIcon,
      format: 'number' as const,
      color: 'bg-accent/10 text-accent',
      iconBg: 'bg-accent/10',
      iconColor: 'text-accent',
    },
    {
      label: 'Pending Payouts',
      value: pendingPayouts ?? 0,
      icon: DollarIcon,
      format: 'number' as const,
      color: 'bg-error/10 text-error',
      iconBg: 'bg-error/10',
      iconColor: 'text-error',
    },
    {
      label: 'Total Revenue',
      value: totalRevenue,
      icon: ChartIcon,
      format: 'currency' as const,
      color: 'bg-success/10 text-success',
      iconBg: 'bg-success/10',
      iconColor: 'text-success',
    },
  ]

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-8 text-2xl font-bold tracking-tight text-text-primary">
        Overview
      </h1>

      {/* Summary stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-border-default bg-bg-elevated p-5"
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.iconBg}`}
              >
                <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
              </div>
              <div>
                <p className="text-sm text-text-muted">{stat.label}</p>
                <p className="text-2xl font-bold text-text-primary">
                  {stat.format === 'currency'
                    ? `$${stat.value.toFixed(2)}`
                    : stat.value.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity: Pending Submissions */}
      <div className="mt-10">
        <h2 className="mb-4 text-lg font-semibold text-text-primary">
          Recent Submissions
        </h2>

        {recentSubmissions.length === 0 ? (
          <div className="rounded-xl border border-border-default bg-bg-elevated p-8 text-center">
            <p className="text-text-muted">
              No pending submissions. All tracks have been reviewed.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border-default bg-bg-elevated">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-default text-left text-xs font-semibold uppercase tracking-wider text-text-muted">
                  <th className="px-5 py-3">Track</th>
                  <th className="px-5 py-3">Creator</th>
                  <th className="hidden px-5 py-3 text-right sm:table-cell">
                    Submitted
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default">
                {recentSubmissions.map((submission) => (
                  <tr
                    key={submission.id}
                    className="transition-colors hover:bg-bg-card"
                  >
                    <td className="px-5 py-4 text-sm font-medium text-text-primary">
                      {submission.title}
                    </td>
                    <td className="px-5 py-4 text-sm text-text-secondary">
                      {submission.creator_name}
                    </td>
                    <td className="hidden px-5 py-4 text-right text-sm text-text-muted sm:table-cell">
                      {new Date(submission.created_at).toLocaleDateString(
                        'en-US',
                        {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        }
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

/* --- Icon Components --- */

function InboxIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
      <path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" />
    </svg>
  )
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  )
}

function DollarIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
    </svg>
  )
}

function ChartIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  )
}
