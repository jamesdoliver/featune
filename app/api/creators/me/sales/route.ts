import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Creator } from '@/lib/types/database'

export async function GET() {
  try {
    const supabase = await createClient()

    // Auth check
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch creator record
    const { data: creator } = await supabase
      .from('creators')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!creator) {
      return NextResponse.json(
        { error: 'Creator profile not found' },
        { status: 403 }
      )
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

    if (trackIds.length === 0) {
      return NextResponse.json([])
    }

    // Fetch order items for creator's tracks
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select(
        'id, track_id, license_type, price_at_purchase, creator_earnings, created_at'
      )
      .in('track_id', trackIds)
      .order('created_at', { ascending: false })

    if (itemsError) {
      console.error('Error fetching order items:', itemsError)
      return NextResponse.json(
        { error: 'Failed to fetch sales data' },
        { status: 500 }
      )
    }

    const sales = (orderItems ?? []).map(
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

    return NextResponse.json(sales)
  } catch (err) {
    console.error('Sales fetch error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
