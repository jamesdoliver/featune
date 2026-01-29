import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AdminAnalyticsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Admin check
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    redirect('/')
  }

  // --- Data Fetching ---

  // Completed orders (for total revenue + monthly breakdown)
  const { data: orders } = await supabase
    .from('orders')
    .select('id, total, created_at')
    .eq('status', 'completed')

  // All order items (for top tracks + top creators + total sales count)
  const { data: orderItems } = await supabase
    .from('order_items')
    .select('track_id, price_at_purchase, creator_earnings')

  // All tracks
  const { data: tracks } = await supabase
    .from('tracks')
    .select('id, title, creator_id')

  // All creators
  const { data: creators } = await supabase
    .from('creators')
    .select('id, display_name')

  const safeOrders = orders ?? []
  const safeOrderItems = orderItems ?? []
  const safeTracks = tracks ?? []
  const safeCreators = creators ?? []

  // --- Summary Stats ---

  const totalRevenue = safeOrders.reduce(
    (sum: number, order: { total: number }) => sum + (order.total ?? 0),
    0
  )
  const totalSales = safeOrderItems.length
  const totalTracks = safeTracks.length
  const totalCreators = safeCreators.length

  const summaryStats = [
    {
      label: 'Total Revenue',
      value: `$${totalRevenue.toFixed(2)}`,
      icon: DollarIcon,
      iconBg: 'bg-success/10',
      iconColor: 'text-success',
    },
    {
      label: 'Total Sales',
      value: totalSales.toLocaleString(),
      icon: CartIcon,
      iconBg: 'bg-accent/10',
      iconColor: 'text-accent',
    },
    {
      label: 'Total Tracks',
      value: totalTracks.toLocaleString(),
      icon: MusicIcon,
      iconBg: 'bg-warning/10',
      iconColor: 'text-warning',
    },
    {
      label: 'Total Creators',
      value: totalCreators.toLocaleString(),
      icon: UsersIcon,
      iconBg: 'bg-error/10',
      iconColor: 'text-error',
    },
  ]

  // --- Top 5 Tracks by Sales ---

  // Build lookup maps
  const trackMap: Record<string, { title: string; creator_id: string }> = {}
  for (const t of safeTracks) {
    trackMap[t.id] = { title: t.title, creator_id: t.creator_id }
  }

  const creatorMap: Record<string, string> = {}
  for (const c of safeCreators) {
    creatorMap[c.id] = c.display_name
  }

  // Aggregate order items by track
  const trackSalesMap: Record<
    string,
    { count: number; revenue: number }
  > = {}
  for (const item of safeOrderItems) {
    if (!trackSalesMap[item.track_id]) {
      trackSalesMap[item.track_id] = { count: 0, revenue: 0 }
    }
    trackSalesMap[item.track_id].count += 1
    trackSalesMap[item.track_id].revenue += item.price_at_purchase ?? 0
  }

  const topTracks = Object.entries(trackSalesMap)
    .map(([trackId, data]) => ({
      trackId,
      title: trackMap[trackId]?.title ?? 'Unknown Track',
      creatorName:
        creatorMap[trackMap[trackId]?.creator_id] ?? 'Unknown Creator',
      sales: data.count,
      revenue: data.revenue,
    }))
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 5)

  // --- Top 5 Creators by Earnings ---

  // Aggregate order items by creator (via track -> creator_id)
  const creatorEarningsMap: Record<
    string,
    { totalSales: number; totalEarnings: number; trackIds: Set<string> }
  > = {}
  for (const item of safeOrderItems) {
    const creatorId = trackMap[item.track_id]?.creator_id
    if (!creatorId) continue
    if (!creatorEarningsMap[creatorId]) {
      creatorEarningsMap[creatorId] = {
        totalSales: 0,
        totalEarnings: 0,
        trackIds: new Set(),
      }
    }
    creatorEarningsMap[creatorId].totalSales += 1
    creatorEarningsMap[creatorId].totalEarnings +=
      item.creator_earnings ?? 0
    creatorEarningsMap[creatorId].trackIds.add(item.track_id)
  }

  const topCreators = Object.entries(creatorEarningsMap)
    .map(([creatorId, data]) => ({
      creatorId,
      displayName: creatorMap[creatorId] ?? 'Unknown Creator',
      totalTracks: data.trackIds.size,
      totalSales: data.totalSales,
      totalEarnings: data.totalEarnings,
    }))
    .sort((a, b) => b.totalEarnings - a.totalEarnings)
    .slice(0, 5)

  // --- Monthly Revenue (Last 6 Months) ---

  const now = new Date()
  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ]

  // Build last 6 months keys (newest first)
  const last6Months: { key: string; label: string }[] = []
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = `${monthNames[d.getMonth()]} ${d.getFullYear()}`
    last6Months.push({ key, label })
  }

  // Aggregate orders by month
  const monthlyMap: Record<string, { sales: number; revenue: number }> = {}
  for (const m of last6Months) {
    monthlyMap[m.key] = { sales: 0, revenue: 0 }
  }
  for (const order of safeOrders) {
    const d = new Date(order.created_at)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (monthlyMap[key]) {
      monthlyMap[key].sales += 1
      monthlyMap[key].revenue += order.total ?? 0
    }
  }

  const currentMonthKey = last6Months[0]?.key

  const monthlyRevenue = last6Months.map((m) => ({
    label: m.label,
    key: m.key,
    sales: monthlyMap[m.key].sales,
    revenue: monthlyMap[m.key].revenue,
  }))

  // --- Render ---

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-8 text-2xl font-bold tracking-tight text-text-primary">
        Analytics
      </h1>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryStats.map((stat) => (
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
                  {stat.value}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Top 5 Tracks by Sales */}
      <div className="mt-10">
        <h2 className="mb-4 text-lg font-semibold text-text-primary">
          Top 5 Tracks by Sales
        </h2>

        {topTracks.length === 0 ? (
          <div className="rounded-xl border border-border-default bg-bg-elevated p-8 text-center">
            <p className="text-text-muted">No sales data available yet.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border-default bg-bg-elevated">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-default text-left text-xs font-semibold uppercase tracking-wider text-text-muted">
                  <th className="px-5 py-3">Track</th>
                  <th className="px-5 py-3">Creator</th>
                  <th className="px-5 py-3 text-right">Sales</th>
                  <th className="hidden px-5 py-3 text-right sm:table-cell">
                    Revenue
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default">
                {topTracks.map((track) => (
                  <tr
                    key={track.trackId}
                    className="transition-colors hover:bg-bg-card"
                  >
                    <td className="px-5 py-4 text-sm font-medium text-text-primary">
                      {track.title}
                    </td>
                    <td className="px-5 py-4 text-sm text-text-secondary">
                      {track.creatorName}
                    </td>
                    <td className="px-5 py-4 text-right text-sm text-text-primary">
                      {track.sales.toLocaleString()}
                    </td>
                    <td className="hidden px-5 py-4 text-right text-sm text-text-primary sm:table-cell">
                      ${track.revenue.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Top 5 Creators by Earnings */}
      <div className="mt-10">
        <h2 className="mb-4 text-lg font-semibold text-text-primary">
          Top 5 Creators by Earnings
        </h2>

        {topCreators.length === 0 ? (
          <div className="rounded-xl border border-border-default bg-bg-elevated p-8 text-center">
            <p className="text-text-muted">
              No creator earnings data available yet.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border-default bg-bg-elevated">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-default text-left text-xs font-semibold uppercase tracking-wider text-text-muted">
                  <th className="px-5 py-3">Creator</th>
                  <th className="hidden px-5 py-3 text-right sm:table-cell">
                    Tracks
                  </th>
                  <th className="px-5 py-3 text-right">Sales</th>
                  <th className="px-5 py-3 text-right">Earnings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default">
                {topCreators.map((creator) => (
                  <tr
                    key={creator.creatorId}
                    className="transition-colors hover:bg-bg-card"
                  >
                    <td className="px-5 py-4 text-sm font-medium text-text-primary">
                      {creator.displayName}
                    </td>
                    <td className="hidden px-5 py-4 text-right text-sm text-text-secondary sm:table-cell">
                      {creator.totalTracks}
                    </td>
                    <td className="px-5 py-4 text-right text-sm text-text-primary">
                      {creator.totalSales.toLocaleString()}
                    </td>
                    <td className="px-5 py-4 text-right text-sm text-text-primary">
                      ${creator.totalEarnings.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Monthly Revenue — Last 6 Months */}
      <div className="mt-10">
        <h2 className="mb-4 text-lg font-semibold text-text-primary">
          Monthly Revenue
        </h2>

        <div className="overflow-hidden rounded-xl border border-border-default bg-bg-elevated">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-default text-left text-xs font-semibold uppercase tracking-wider text-text-muted">
                <th className="px-5 py-3">Month</th>
                <th className="px-5 py-3 text-right">Sales</th>
                <th className="px-5 py-3 text-right">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-default">
              {monthlyRevenue.map((month) => (
                <tr
                  key={month.key}
                  className={`transition-colors hover:bg-bg-card ${
                    month.key === currentMonthKey
                      ? 'bg-accent/5'
                      : ''
                  }`}
                >
                  <td className="px-5 py-4 text-sm font-medium text-text-primary">
                    {month.label}
                    {month.key === currentMonthKey && (
                      <span className="ml-2 inline-flex items-center rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                        Current
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right text-sm text-text-primary">
                    {month.sales.toLocaleString()}
                  </td>
                  <td className="px-5 py-4 text-right text-sm text-text-primary">
                    ${month.revenue.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

/* --- Icon Components --- */

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

function CartIcon({ className }: { className?: string }) {
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
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
    </svg>
  )
}

function MusicIcon({ className }: { className?: string }) {
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
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
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
