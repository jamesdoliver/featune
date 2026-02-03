import { createClient } from '@/lib/supabase/server'
import OrdersClient from './OrdersClient'

export interface OrderWithDetails {
  id: string
  user_id: string
  stripe_payment_intent: string | null
  subtotal: number
  discount_percent: number
  discount_amount: number
  total: number
  status: 'pending' | 'completed' | 'failed'
  created_at: string
  customer_email: string
  customer_name: string | null
  items: OrderItem[]
}

export interface OrderItem {
  id: string
  track_id: string
  license_type: 'non_exclusive' | 'exclusive'
  price_at_purchase: number
  creator_earnings: number
  license_pdf_url: string | null
  track_title: string
  creator_name: string
}

export default async function AdminOrdersPage() {
  const supabase = await createClient()

  // Fetch orders with customer info
  const { data: rawOrders } = await supabase
    .from('orders')
    .select(`
      id, user_id, stripe_payment_intent, subtotal, discount_percent,
      discount_amount, total, status, created_at,
      profiles!inner(email, full_name)
    `)
    .order('created_at', { ascending: false })

  // Fetch all order items with track and creator info
  const { data: rawItems } = await supabase
    .from('order_items')
    .select(`
      id, order_id, track_id, license_type, price_at_purchase,
      creator_earnings, license_pdf_url,
      tracks!inner(title, creators!inner(display_name))
    `)

  // Build a map of order_id -> items
  const itemsByOrder = new Map<string, OrderItem[]>()
  for (const item of rawItems ?? []) {
    const tracks = item.tracks as unknown as { title: string; creators: { display_name: string } | { display_name: string }[] }
    const creatorsRaw = tracks.creators
    const creatorName = Array.isArray(creatorsRaw) ? creatorsRaw[0]?.display_name : creatorsRaw.display_name
    const orderItem: OrderItem = {
      id: item.id,
      track_id: item.track_id,
      license_type: item.license_type as 'non_exclusive' | 'exclusive',
      price_at_purchase: item.price_at_purchase,
      creator_earnings: item.creator_earnings,
      license_pdf_url: item.license_pdf_url,
      track_title: tracks.title,
      creator_name: creatorName ?? 'Unknown',
    }
    const existing = itemsByOrder.get(item.order_id) ?? []
    existing.push(orderItem)
    itemsByOrder.set(item.order_id, existing)
  }

  // Build final orders array
  const orders: OrderWithDetails[] = (rawOrders ?? []).map((row) => {
    const profilesRaw = row.profiles as unknown as { email: string; full_name: string | null } | { email: string; full_name: string | null }[]
    const profile = Array.isArray(profilesRaw) ? profilesRaw[0] : profilesRaw
    return {
      id: row.id,
      user_id: row.user_id,
      stripe_payment_intent: row.stripe_payment_intent,
      subtotal: row.subtotal,
      discount_percent: row.discount_percent,
      discount_amount: row.discount_amount,
      total: row.total,
      status: row.status as 'pending' | 'completed' | 'failed',
      created_at: row.created_at,
      customer_email: profile.email,
      customer_name: profile.full_name,
      items: itemsByOrder.get(row.id) ?? [],
    }
  })

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="mb-8 text-2xl font-bold tracking-tight text-text-primary">
        Orders
      </h1>

      <OrdersClient orders={orders} />
    </div>
  )
}
