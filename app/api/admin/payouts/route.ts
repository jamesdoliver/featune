import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const { user, error: authError } = await requireAdmin()
    if (authError) return authError

    const supabase = await createClient()

    // Fetch all payouts with creator display names
    const { data: rawPayouts, error } = await supabase
      .from('payouts')
      .select('*, creators!inner(id, display_name)')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Payouts fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch payouts' },
        { status: 500 }
      )
    }

    const payouts = (rawPayouts ?? []).map(
      (row: {
        id: string
        creator_id: string
        amount: number
        status: string
        invoice_url: string | null
        created_at: string
        paid_at: string | null
        creators: { id: string; display_name: string }
      }) => ({
        id: row.id,
        creator_id: row.creator_id,
        amount: row.amount,
        status: row.status,
        invoice_url: row.invoice_url,
        created_at: row.created_at,
        paid_at: row.paid_at,
        creator_name: row.creators.display_name,
      })
    )

    return NextResponse.json(payouts)
  } catch (err) {
    console.error('Admin payouts error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
