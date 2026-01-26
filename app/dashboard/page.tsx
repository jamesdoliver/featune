import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Creator, Track, OrderItem } from '@/lib/types/database'

interface RecentSale {
  id: string
  track_title: string
  license_type: string
  price_at_purchase: number
  creator_earnings: number
  created_at: string
}

export default async function DashboardOverviewPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch creator record
  const { data: creator } = await supabase
    .from('creators')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!creator) {
    redirect('/dashboard/apply')
  }

  const typedCreator = creator as Creator

  // Fetch total tracks count
  const { count: totalTracks } = await supabase
    .from('tracks')
    .select('*', { count: 'exact', head: true })
    .eq('creator_id', typedCreator.id)

  // Fetch order items for this creator's tracks to compute sales + earnings
  // We join order_items with tracks to find items belonging to this creator
  const { data: creatorTracks } = await supabase
    .from('tracks')
    .select('id, title')
    .eq('creator_id', typedCreator.id)

  const trackIds = (creatorTracks ?? []).map((t: { id: string }) => t.id)
  const trackTitleMap: Record<string, string> = {}
  for (const t of creatorTracks ?? []) {
    trackTitleMap[t.id] = t.title
  }

  let totalSales = 0
  let totalEarnings = 0
  let recentSales: RecentSale[] = []

  if (trackIds.length > 0) {
    // Total sales count
    const { count: salesCount } = await supabase
      .from('order_items')
      .select('*', { count: 'exact', head: true })
      .in('track_id', trackIds)

    totalSales = salesCount ?? 0

    // Total earnings sum
    const { data: earningsData } = await supabase
      .from('order_items')
      .select('creator_earnings')
      .in('track_id', trackIds)

    totalEarnings = (earningsData ?? []).reduce(
      (sum: number, item: { creator_earnings: number }) =>
        sum + (item.creator_earnings ?? 0),
      0
    )

    // Recent sales (last 5)
    const { data: recentOrderItems } = await supabase
      .from('order_items')
      .select('id, track_id, license_type, price_at_purchase, creator_earnings, created_at')
      .in('track_id', trackIds)
      .order('created_at', { ascending: false })
      .limit(5)

    recentSales = (recentOrderItems ?? []).map(
      (item: {
        id: string
        track_id: string | null
        license_type: string
        price_at_purchase: number
        creator_earnings: number
        created_at: string
      }) => ({
        id: item.id,
        track_title: item.track_id ? trackTitleMap[item.track_id] ?? 'Unknown Track' : 'Unknown Track',
        license_type: item.license_type,
        price_at_purchase: item.price_at_purchase,
        creator_earnings: item.creator_earnings,
        created_at: item.created_at,
      })
    )
  }

  // Pending payout
  const { data: pendingPayouts } = await supabase
    .from('payouts')
    .select('amount')
    .eq('creator_id', typedCreator.id)
    .eq('status', 'pending')

  const pendingPayoutTotal = (pendingPayouts ?? []).reduce(
    (sum: number, p: { amount: number }) => sum + (p.amount ?? 0),
    0
  )

  const stats = [
    {
      label: 'Total Tracks',
      value: totalTracks ?? 0,
      icon: MusicNoteIcon,
      format: 'number' as const,
    },
    {
      label: 'Total Sales',
      value: totalSales,
      icon: ShoppingBagIcon,
      format: 'number' as const,
    },
    {
      label: 'Total Earnings',
      value: totalEarnings,
      icon: DollarCircleIcon,
      format: 'currency' as const,
    },
    {
      label: 'Pending Payout',
      value: pendingPayoutTotal,
      icon: ClockIcon,
      format: 'currency' as const,
    },
  ]

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-8 text-2xl font-bold tracking-tight text-text-primary">
        Overview
      </h1>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-border-default bg-bg-elevated p-5"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                <stat.icon className="h-5 w-5 text-accent" />
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

      {/* Recent Sales */}
      <div className="mt-10">
        <h2 className="mb-4 text-lg font-semibold text-text-primary">
          Recent Sales
        </h2>

        {recentSales.length === 0 ? (
          <div className="rounded-xl border border-border-default bg-bg-elevated p-8 text-center">
            <p className="text-text-muted">
              No sales yet. Once your tracks are purchased, they will appear
              here.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border-default bg-bg-elevated">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-default text-left text-xs font-semibold uppercase tracking-wider text-text-muted">
                  <th className="px-5 py-3">Track</th>
                  <th className="px-5 py-3">License</th>
                  <th className="px-5 py-3 text-right">Price</th>
                  <th className="px-5 py-3 text-right">Your Earnings</th>
                  <th className="hidden px-5 py-3 text-right sm:table-cell">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default">
                {recentSales.map((sale) => (
                  <tr
                    key={sale.id}
                    className="transition-colors hover:bg-bg-card"
                  >
                    <td className="px-5 py-4 text-sm font-medium text-text-primary">
                      {sale.track_title}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          sale.license_type === 'exclusive'
                            ? 'bg-accent/20 text-accent'
                            : 'bg-bg-card text-text-secondary'
                        }`}
                      >
                        {sale.license_type === 'exclusive'
                          ? 'Exclusive'
                          : 'Non-Exclusive'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right text-sm text-text-secondary">
                      ${sale.price_at_purchase.toFixed(2)}
                    </td>
                    <td className="px-5 py-4 text-right text-sm font-medium text-success">
                      ${sale.creator_earnings.toFixed(2)}
                    </td>
                    <td className="hidden px-5 py-4 text-right text-sm text-text-muted sm:table-cell">
                      {new Date(sale.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
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

/* ─── Icon Components ─── */

function MusicNoteIcon({ className }: { className?: string }) {
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

function ShoppingBagIcon({ className }: { className?: string }) {
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
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 01-8 0" />
    </svg>
  )
}

function DollarCircleIcon({ className }: { className?: string }) {
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
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="6" x2="12" y2="18" />
      <path d="M15.5 9.5c0-1.38-1.57-2.5-3.5-2.5S8.5 8.12 8.5 9.5 10.07 12 12 12s3.5 1.12 3.5 2.5-1.57 2.5-3.5 2.5-3.5-1.12-3.5-2.5" />
    </svg>
  )
}

function ClockIcon({ className }: { className?: string }) {
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
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}
