import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Creator, Payout } from '@/lib/types/database'
import EarningsClient from './EarningsClient'

export default async function EarningsPage() {
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

  // Fetch all track IDs for this creator
  const { data: creatorTracks } = await supabase
    .from('tracks')
    .select('id')
    .eq('creator_id', typedCreator.id)

  const trackIds = (creatorTracks ?? []).map((t: { id: string }) => t.id)

  // Calculate total earnings from order_items
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

  // Fetch all payouts for this creator
  const { data: payouts } = await supabase
    .from('payouts')
    .select('*')
    .eq('creator_id', typedCreator.id)
    .order('created_at', { ascending: false })

  const typedPayouts = (payouts ?? []) as Payout[]

  // Sum of completed payouts
  const completedPayouts = typedPayouts
    .filter((p) => p.status === 'completed')
    .reduce((sum, p) => sum + (p.amount ?? 0), 0)

  const availableBalance = totalEarnings - completedPayouts

  // Subtract pending/processing payouts from requestable balance
  const pendingPayoutsTotal = typedPayouts
    .filter((p) => p.status === 'pending' || p.status === 'processing')
    .reduce((sum, p) => sum + (p.amount ?? 0), 0)

  const requestableBalance = availableBalance - pendingPayoutsTotal

  return (
    <EarningsClient
      initialData={{
        totalEarnings,
        completedPayouts,
        availableBalance,
        pendingPayoutsTotal,
        requestableBalance,
        payouts: typedPayouts,
      }}
    />
  )
}
