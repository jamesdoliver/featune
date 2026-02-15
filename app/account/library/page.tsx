import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import LibraryList from './LibraryList'

export const metadata: Metadata = {
  title: 'My Library - FEATUNE',
  description: 'Your purchased tracks and downloads.',
}

export default async function LibraryPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: orders } = await supabase
    .from('orders')
    .select(`
      order_items (
        id,
        track_id,
        license_type,
        license_pdf_url,
        created_at,
        tracks (
          id,
          title,
          artwork_url,
          genre,
          acapella_url,
          instrumental_url,
          lyrics_pdf_url,
          creators!inner(id, display_name)
        )
      )
    `)
    .eq('user_id', user.id)
    .eq('status', 'completed')

  // Flatten order_items from all orders and deduplicate by track_id (keep most recent)
  const itemMap = new Map<string, {
    id: string
    trackId: string
    title: string
    artworkUrl: string | null
    genre: string | null
    creatorName: string
    creatorId: string
    licenseType: string
    licensePdfUrl: string | null
    acapellaUrl: string | null
    instrumentalUrl: string | null
    lyricsPdfUrl: string | null
    purchasedAt: string
  }>()

  for (const order of orders ?? []) {
    for (const item of order.order_items ?? []) {
      const trackRaw = item.tracks as unknown as {
        id: string
        title: string
        artwork_url: string | null
        genre: string | null
        acapella_url: string | null
        instrumental_url: string | null
        lyrics_pdf_url: string | null
        creators: { id: string; display_name: string } | { id: string; display_name: string }[]
      }

      if (!trackRaw) continue

      const creator = Array.isArray(trackRaw.creators)
        ? trackRaw.creators[0]
        : trackRaw.creators

      const trackId = trackRaw.id
      const existing = itemMap.get(trackId)

      // Keep the most recent purchase
      if (!existing || new Date(item.created_at as string) > new Date(existing.purchasedAt)) {
        itemMap.set(trackId, {
          id: item.id as string,
          trackId,
          title: trackRaw.title,
          artworkUrl: trackRaw.artwork_url,
          genre: trackRaw.genre,
          creatorName: creator?.display_name ?? 'Unknown',
          creatorId: creator?.id ?? '',
          licenseType: item.license_type as string,
          licensePdfUrl: item.license_pdf_url as string | null,
          acapellaUrl: trackRaw.acapella_url,
          instrumentalUrl: trackRaw.instrumental_url,
          lyricsPdfUrl: trackRaw.lyrics_pdf_url,
          purchasedAt: item.created_at as string,
        })
      }
    }
  }

  const tracks = Array.from(itemMap.values()).sort(
    (a, b) => new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime()
  )

  return <LibraryList tracks={tracks} />
}
