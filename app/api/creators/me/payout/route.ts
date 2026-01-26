import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Creator, Payout } from '@/lib/types/database'

export async function POST() {
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

    // Calculate available balance
    const { data: creatorTracks } = await supabase
      .from('tracks')
      .select('id')
      .eq('creator_id', typedCreator.id)

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

    // Fetch all payouts
    const { data: payouts } = await supabase
      .from('payouts')
      .select('*')
      .eq('creator_id', typedCreator.id)

    const typedPayouts = (payouts ?? []) as Payout[]

    const completedPayouts = typedPayouts
      .filter((p) => p.status === 'completed')
      .reduce((sum, p) => sum + (p.amount ?? 0), 0)

    const pendingPayoutsTotal = typedPayouts
      .filter((p) => p.status === 'pending' || p.status === 'processing')
      .reduce((sum, p) => sum + (p.amount ?? 0), 0)

    const availableBalance = totalEarnings - completedPayouts
    const requestableBalance = availableBalance - pendingPayoutsTotal

    // Validate minimum payout amount
    if (requestableBalance < 50) {
      return NextResponse.json(
        {
          error:
            requestableBalance < 0
              ? 'No available balance for payout'
              : 'Minimum payout amount is $50.00',
        },
        { status: 400 }
      )
    }

    // Create payout record using admin client to bypass RLS
    const admin = createAdminClient()

    const { data: newPayout, error: payoutError } = await admin
      .from('payouts')
      .insert({
        creator_id: typedCreator.id,
        amount: requestableBalance,
        status: 'pending',
      })
      .select()
      .single()

    if (payoutError) {
      console.error('Payout insert error:', payoutError)
      return NextResponse.json(
        { error: 'Failed to create payout request' },
        { status: 500 }
      )
    }

    return NextResponse.json(newPayout as Payout, { status: 201 })
  } catch (err) {
    console.error('Payout request error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
