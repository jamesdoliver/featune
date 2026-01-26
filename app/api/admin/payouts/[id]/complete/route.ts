import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendPayoutCompleteEmail } from '@/lib/email'

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const supabase = await createClient()

    // Auth check
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Admin check
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Use admin client to bypass RLS
    const admin = createAdminClient()

    const { data: updatedPayout, error } = await admin
      .from('payouts')
      .update({
        status: 'completed',
        paid_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Payout complete error:', error)
      return NextResponse.json(
        { error: 'Failed to complete payout' },
        { status: 500 }
      )
    }

    // Fetch creator info and send payout complete email (fire-and-forget)
    if (updatedPayout) {
      const { data: creator } = await admin
        .from('creators')
        .select('display_name, user_id, profiles(email)')
        .eq('id', updatedPayout.creator_id)
        .single()

      if (creator) {
        const creatorData = creator as unknown as {
          display_name: string
          user_id: string
          profiles: { email: string }
        }
        sendPayoutCompleteEmail({
          creatorEmail: creatorData.profiles.email,
          creatorName: creatorData.display_name,
          amount: updatedPayout.amount,
        })
      }
    }

    return NextResponse.json(updatedPayout)
  } catch (err) {
    console.error('Admin payout complete error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
