import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Creator, Payout } from '@/lib/types/database'

export async function GET() {
  try {
    const supabase = await createClient()

    // Auth check
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch creator record
    const { data: creator } = await supabase
      .from('creators')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!creator) {
      return NextResponse.json(
        { error: 'Creator record not found' },
        { status: 404 }
      )
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

    // Also subtract pending/processing payouts from the "available" balance
    // so creators don't request duplicate payouts
    const pendingPayoutsTotal = typedPayouts
      .filter((p) => p.status === 'pending' || p.status === 'processing')
      .reduce((sum, p) => sum + (p.amount ?? 0), 0)

    const requestableBalance = availableBalance - pendingPayoutsTotal

    return NextResponse.json({
      totalEarnings,
      completedPayouts,
      availableBalance,
      pendingPayoutsTotal,
      requestableBalance,
      payouts: typedPayouts,
    })
  } catch (err) {
    console.error('Earnings fetch error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
