import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

type TimeRange = '7d' | '30d' | '90d' | '1y' | 'all'

function getDateFilter(range: TimeRange): Date | null {
  const now = new Date()
  switch (range) {
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    case '90d':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    case '1y':
      return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
    case 'all':
      return null
    default:
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  }
}

function getPreviousPeriodDate(range: TimeRange, startDate: Date | null): Date | null {
  if (!startDate) return null
  const now = new Date()
  const periodLength = now.getTime() - startDate.getTime()
  return new Date(startDate.getTime() - periodLength)
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const searchParams = request.nextUrl.searchParams
  const range = (searchParams.get('range') || '30d') as TimeRange
  const genreFilter = searchParams.get('genre')
  const licenseTypeFilter = searchParams.get('licenseType')

  const startDate = getDateFilter(range)
  const previousStartDate = getPreviousPeriodDate(range, startDate)

  // Fetch orders with date filter
  let ordersQuery = supabase
    .from('orders')
    .select('id, total, created_at, user_id')
    .eq('status', 'completed')

  if (startDate) {
    ordersQuery = ordersQuery.gte('created_at', startDate.toISOString())
  }

  const { data: orders } = await ordersQuery

  // Fetch previous period orders for growth calculation
  let previousOrdersQuery = supabase
    .from('orders')
    .select('id, total')
    .eq('status', 'completed')

  if (startDate && previousStartDate) {
    previousOrdersQuery = previousOrdersQuery
      .gte('created_at', previousStartDate.toISOString())
      .lt('created_at', startDate.toISOString())
  }

  const { data: previousOrders } = await previousOrdersQuery

  // Fetch all tracks for mapping
  const { data: tracks } = await supabase
    .from('tracks')
    .select('id, title, creator_id, genre')

  // Fetch all creators for mapping
  const { data: creators } = await supabase
    .from('creators')
    .select('id, display_name')

  // Fetch order items
  let orderItemsQuery = supabase
    .from('order_items')
    .select('track_id, price_at_purchase, creator_earnings, license_type, created_at, order_id')

  const { data: allOrderItems } = await orderItemsQuery

  // Fetch pending payouts
  const { data: pendingPayouts } = await supabase
    .from('payouts')
    .select('amount')
    .eq('status', 'pending')

  const safeOrders = orders ?? []
  const safePreviousOrders = previousOrders ?? []
  const safeTracks = tracks ?? []
  const safeCreators = creators ?? []
  const safeAllOrderItems = allOrderItems ?? []
  const safePendingPayouts = pendingPayouts ?? []

  // Build lookup maps
  const trackMap: Record<string, { title: string; creator_id: string; genre: string }> = {}
  for (const t of safeTracks) {
    trackMap[t.id] = { title: t.title, creator_id: t.creator_id, genre: t.genre }
  }

  const creatorMap: Record<string, string> = {}
  for (const c of safeCreators) {
    creatorMap[c.id] = c.display_name
  }

  // Filter order items by date and genre/license if specified
  const orderIds = new Set(safeOrders.map((o) => o.id))
  let filteredOrderItems = safeAllOrderItems.filter((item) => orderIds.has(item.order_id))

  if (genreFilter) {
    filteredOrderItems = filteredOrderItems.filter(
      (item) => trackMap[item.track_id]?.genre === genreFilter
    )
  }

  if (licenseTypeFilter) {
    filteredOrderItems = filteredOrderItems.filter(
      (item) => item.license_type === licenseTypeFilter
    )
  }

  // Summary calculations
  const totalRevenue = safeOrders.reduce((sum, order) => sum + (order.total ?? 0), 0)
  const previousRevenue = safePreviousOrders.reduce((sum, order) => sum + (order.total ?? 0), 0)
  const totalSales = filteredOrderItems.length
  const avgOrderValue = safeOrders.length > 0 ? totalRevenue / safeOrders.length : 0
  const growthRate = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0
  const totalTracks = safeTracks.length
  const activeCreators = new Set(filteredOrderItems.map((item) => trackMap[item.track_id]?.creator_id)).size
  const pendingPayoutsTotal = safePendingPayouts.reduce((sum, p) => sum + (p.amount ?? 0), 0)

  // License type breakdown
  const exclusiveCount = filteredOrderItems.filter((item) => item.license_type === 'exclusive').length
  const exclusivePercentage = totalSales > 0 ? (exclusiveCount / totalSales) * 100 : 0

  // Revenue by date
  const revenueByDate: Record<string, { revenue: number; orders: number }> = {}
  for (const order of safeOrders) {
    const date = new Date(order.created_at).toISOString().split('T')[0]
    if (!revenueByDate[date]) {
      revenueByDate[date] = { revenue: 0, orders: 0 }
    }
    revenueByDate[date].revenue += order.total ?? 0
    revenueByDate[date].orders += 1
  }

  const revenue = Object.entries(revenueByDate)
    .map(([date, data]) => ({ date, revenue: data.revenue, orders: data.orders }))
    .sort((a, b) => a.date.localeCompare(b.date))

  // Genre breakdown
  const genreStats: Record<string, { count: number; revenue: number }> = {}
  for (const item of filteredOrderItems) {
    const genre = trackMap[item.track_id]?.genre || 'Unknown'
    if (!genreStats[genre]) {
      genreStats[genre] = { count: 0, revenue: 0 }
    }
    genreStats[genre].count += 1
    genreStats[genre].revenue += item.price_at_purchase ?? 0
  }

  const genres = Object.entries(genreStats)
    .map(([genre, data]) => ({ genre, count: data.count, revenue: data.revenue }))
    .sort((a, b) => b.revenue - a.revenue)

  // License type breakdown
  const licenseStats: Record<string, number> = { non_exclusive: 0, exclusive: 0 }
  for (const item of filteredOrderItems) {
    const type = item.license_type || 'non_exclusive'
    licenseStats[type] = (licenseStats[type] || 0) + 1
  }

  const licenses = Object.entries(licenseStats).map(([type, count]) => ({
    type,
    count,
    percentage: totalSales > 0 ? (count / totalSales) * 100 : 0,
  }))

  // Customer acquisition (new vs returning)
  const userFirstPurchase: Record<string, string> = {}
  const allOrdersSorted = [...safeOrders].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )

  for (const order of allOrdersSorted) {
    if (!userFirstPurchase[order.user_id]) {
      userFirstPurchase[order.user_id] = order.created_at
    }
  }

  const customersByPeriod: Record<string, { new: number; returning: number }> = {}
  for (const order of safeOrders) {
    const date = new Date(order.created_at)
    let periodKey: string

    if (range === '7d' || range === '30d') {
      periodKey = date.toISOString().split('T')[0]
    } else {
      periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    }

    if (!customersByPeriod[periodKey]) {
      customersByPeriod[periodKey] = { new: 0, returning: 0 }
    }

    const isNew = userFirstPurchase[order.user_id] === order.created_at
    if (isNew) {
      customersByPeriod[periodKey].new += 1
    } else {
      customersByPeriod[periodKey].returning += 1
    }
  }

  const customers = Object.entries(customersByPeriod)
    .map(([period, data]) => ({ period, new: data.new, returning: data.returning }))
    .sort((a, b) => a.period.localeCompare(b.period))

  // Top tracks
  const trackSalesMap: Record<string, { count: number; revenue: number }> = {}
  for (const item of filteredOrderItems) {
    if (!trackSalesMap[item.track_id]) {
      trackSalesMap[item.track_id] = { count: 0, revenue: 0 }
    }
    trackSalesMap[item.track_id].count += 1
    trackSalesMap[item.track_id].revenue += item.price_at_purchase ?? 0
  }

  const topTracks = Object.entries(trackSalesMap)
    .map(([trackId, data]) => ({
      id: trackId,
      title: trackMap[trackId]?.title ?? 'Unknown Track',
      creator: creatorMap[trackMap[trackId]?.creator_id] ?? 'Unknown Creator',
      sales: data.count,
      revenue: data.revenue,
    }))
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 10)

  // Top creators
  const creatorEarningsMap: Record<
    string,
    { totalSales: number; totalEarnings: number; trackIds: Set<string> }
  > = {}
  for (const item of filteredOrderItems) {
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
    creatorEarningsMap[creatorId].totalEarnings += item.creator_earnings ?? 0
    creatorEarningsMap[creatorId].trackIds.add(item.track_id)
  }

  const topCreators = Object.entries(creatorEarningsMap)
    .map(([creatorId, data]) => ({
      id: creatorId,
      name: creatorMap[creatorId] ?? 'Unknown Creator',
      tracks: data.trackIds.size,
      sales: data.totalSales,
      earnings: data.totalEarnings,
    }))
    .sort((a, b) => b.earnings - a.earnings)
    .slice(0, 10)

  return NextResponse.json({
    summary: {
      totalRevenue,
      totalSales,
      avgOrderValue,
      growthRate,
      totalTracks,
      activeCreators,
      pendingPayouts: pendingPayoutsTotal,
      exclusivePercentage,
    },
    revenue,
    genres,
    licenses,
    customers,
    topTracks,
    topCreators,
  })
}
