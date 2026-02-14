import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCreatorEarnings } from '@/lib/earnings'
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

    // Calculate available balance using shared earnings helper
    const earnings = await getCreatorEarnings(supabase, typedCreator.id)

    // Block if there's already a pending payout (prevents duplicate requests)
    if (earnings.pendingPayouts > 0) {
      return NextResponse.json(
        { error: 'You already have a pending payout request. Please wait for it to be processed.' },
        { status: 409 }
      )
    }

    // Validate minimum payout amount (configurable via env)
    const minPayout = Number(process.env.MIN_PAYOUT_AMOUNT) || 50
    if (earnings.requestableBalance < minPayout) {
      return NextResponse.json(
        {
          error:
            earnings.requestableBalance < 0
              ? 'No available balance for payout'
              : `Minimum payout amount is $${minPayout.toFixed(2)}`,
        },
        { status: 400 }
      )
    }

    const requestableBalance = earnings.requestableBalance

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
