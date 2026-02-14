import type { SupabaseClient } from '@supabase/supabase-js'

interface EarningsSummary {
  totalEarnings: number
  completedPayouts: number
  pendingPayouts: number
  availableBalance: number
  requestableBalance: number
}

/**
 * Calculate the earnings summary for a creator.
 * Works with any Supabase client (session or admin).
 */
export async function getCreatorEarnings(
  supabase: SupabaseClient,
  creatorId: string
): Promise<EarningsSummary> {
  // Fetch all track IDs for this creator
  const { data: creatorTracks } = await supabase
    .from('tracks')
    .select('id')
    .eq('creator_id', creatorId)

  const trackIds = (creatorTracks ?? []).map((t: { id: string }) => t.id)

  let totalEarnings = 0

  if (trackIds.length > 0) {
    const { data: earningsData } = await supabase
      .from('order_items')
      .select('creator_earnings')
      .in('track_id', trackIds)

    totalEarnings = (earningsData ?? []).reduce(
      (sum: number, item: { creator_earnings: number }) =>
        sum + (item.creator_earnings ?? 0),
      0
    )
  }

  // Round to cents
  totalEarnings = Math.round(totalEarnings * 100) / 100

  // Fetch all payouts
  const { data: payouts } = await supabase
    .from('payouts')
    .select('amount, status')
    .eq('creator_id', creatorId)

  const typedPayouts = payouts ?? []

  const completedPayouts = typedPayouts
    .filter((p: { status: string }) => p.status === 'completed')
    .reduce((sum: number, p: { amount: number }) => sum + (p.amount ?? 0), 0)

  const pendingPayouts = typedPayouts
    .filter((p: { status: string }) => p.status === 'pending' || p.status === 'processing')
    .reduce((sum: number, p: { amount: number }) => sum + (p.amount ?? 0), 0)

  const availableBalance = Math.round((totalEarnings - completedPayouts) * 100) / 100
  const requestableBalance = Math.round((availableBalance - pendingPayouts) * 100) / 100

  return {
    totalEarnings,
    completedPayouts,
    pendingPayouts,
    availableBalance,
    requestableBalance,
  }
}
