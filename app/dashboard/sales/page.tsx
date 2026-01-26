import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Creator } from '@/lib/types/database'
import SalesList from './SalesList'

export interface SaleItem {
  id: string
  track_title: string
  license_type: string
  price_at_purchase: number
  creator_earnings: number
  created_at: string
}

export default async function SalesPage() {
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

  // Fetch all tracks for this creator
  const { data: creatorTracks } = await supabase
    .from('tracks')
    .select('id, title')
    .eq('creator_id', typedCreator.id)

  const trackIds = (creatorTracks ?? []).map((t: { id: string }) => t.id)
  const trackTitleMap: Record<string, string> = {}
  for (const t of creatorTracks ?? []) {
    trackTitleMap[t.id] = t.title
  }

  let sales: SaleItem[] = []

  if (trackIds.length > 0) {
    const { data: orderItems } = await supabase
      .from('order_items')
      .select(
        'id, track_id, license_type, price_at_purchase, creator_earnings, created_at'
      )
      .in('track_id', trackIds)
      .order('created_at', { ascending: false })

    sales = (orderItems ?? []).map(
      (item: {
        id: string
        track_id: string | null
        license_type: string
        price_at_purchase: number
        creator_earnings: number
        created_at: string
      }) => ({
        id: item.id,
        track_title: item.track_id
          ? trackTitleMap[item.track_id] ?? 'Unknown Track'
          : 'Unknown Track',
        license_type: item.license_type,
        price_at_purchase: item.price_at_purchase,
        creator_earnings: item.creator_earnings,
        created_at: item.created_at,
      })
    )
  }

  return <SalesList sales={sales} />
}
