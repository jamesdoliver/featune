import { createClient } from '@/lib/supabase/server'
import type { Payout } from '@/lib/types/database'
import PayoutsList from './PayoutsList'

export interface PayoutWithCreator extends Payout {
  creator_name: string
}

export default async function AdminPayoutsPage() {
  const supabase = await createClient()

  const { data: rawPayouts } = await supabase
    .from('payouts')
    .select('*, creators!inner(id, display_name)')
    .order('created_at', { ascending: false })

  const payouts: PayoutWithCreator[] = (rawPayouts ?? []).map(
    (row: {
      id: string
      creator_id: string
      amount: number
      status: 'pending' | 'processing' | 'completed'
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

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-8 text-2xl font-bold tracking-tight text-text-primary">
        Payouts
      </h1>

      <PayoutsList payouts={payouts} />
    </div>
  )
}
