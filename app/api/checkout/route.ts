import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe/helpers'
import type { OrderLicenseType } from '@/lib/types/database'

interface CartItem {
  trackId: string
  licenseType: OrderLicenseType
}

interface RequestBody {
  items: CartItem[]
  termsAccepted?: boolean
}

function calculateDiscount(itemCount: number): number {
  if (itemCount >= 3) return 0.20
  if (itemCount >= 2) return 0.10
  return 0
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  // 1. Authenticate user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }

  // 2. Parse and validate request body
  let body: RequestBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    )
  }

  if (
    !body.items ||
    !Array.isArray(body.items) ||
    body.items.length === 0
  ) {
    return NextResponse.json(
      { error: 'Items array is required and must not be empty' },
      { status: 400 }
    )
  }

  // Validate terms acceptance
  if (!body.termsAccepted) {
    return NextResponse.json(
      { error: 'You must accept the License Terms & Conditions to proceed' },
      { status: 400 }
    )
  }

  // Validate each item has required fields
  for (const item of body.items) {
    if (!item.trackId || typeof item.trackId !== 'string') {
      return NextResponse.json(
        { error: 'Each item must have a valid trackId' },
        { status: 400 }
      )
    }
    if (item.licenseType !== 'non_exclusive' && item.licenseType !== 'exclusive') {
      return NextResponse.json(
        { error: 'Each item must have licenseType of "non_exclusive" or "exclusive"' },
        { status: 400 }
      )
    }
  }

  // 3. Fetch tracks from database
  const trackIds = body.items.map((item) => item.trackId)

  const { data: tracks, error: tracksError } = await supabase
    .from('tracks')
    .select('id, creator_id, title, license_type, license_limit, licenses_sold, price_non_exclusive, price_exclusive, status, artwork_url, creators!inner(id, revenue_split)')
    .in('id', trackIds)

  if (tracksError || !tracks) {
    return NextResponse.json(
      { error: 'Failed to fetch track information' },
      { status: 500 }
    )
  }

  // Build a lookup map for tracks
  const trackMap = new Map(tracks.map((t) => [t.id, t]))

  // 4. Validate each cart item against the database
  const unavailableItems: string[] = []

  for (const item of body.items) {
    const track = trackMap.get(item.trackId)

    if (!track) {
      unavailableItems.push(`Track ${item.trackId} not found`)
      continue
    }

    if (track.status !== 'approved') {
      unavailableItems.push(`"${track.title}" is no longer available`)
      continue
    }

    // Check exclusive availability
    if (item.licenseType === 'exclusive') {
      if (track.license_type === 'exclusive' && track.licenses_sold > 0) {
        unavailableItems.push(`"${track.title}" exclusive license is already sold`)
        continue
      }
      if (track.price_exclusive === null) {
        unavailableItems.push(`"${track.title}" does not offer an exclusive license`)
        continue
      }
    }

    // Check non-exclusive availability for limited tracks
    if (item.licenseType === 'non_exclusive') {
      if (
        track.license_type === 'limited' &&
        track.license_limit !== null &&
        track.licenses_sold >= track.license_limit
      ) {
        unavailableItems.push(`"${track.title}" is sold out`)
        continue
      }
      if (track.price_non_exclusive === null) {
        unavailableItems.push(`"${track.title}" does not offer a non-exclusive license`)
        continue
      }
    }
  }

  if (unavailableItems.length > 0) {
    return NextResponse.json(
      { error: 'Some items are unavailable', details: unavailableItems },
      { status: 409 }
    )
  }

  // 5. Calculate prices and discount
  const discountPercent = calculateDiscount(body.items.length)

  const lineItemsData = body.items.map((item) => {
    const track = trackMap.get(item.trackId)!
    // The creator join returns an array from Supabase; since we used !inner, there will be exactly one
    const creator = Array.isArray(track.creators) ? track.creators[0] : track.creators
    const price =
      item.licenseType === 'exclusive'
        ? track.price_exclusive!
        : track.price_non_exclusive!

    return {
      trackId: track.id,
      creatorId: track.creator_id,
      title: track.title,
      licenseType: item.licenseType,
      price,
      artworkUrl: track.artwork_url,
      revenueSplit: creator.revenue_split,
    }
  })

  const subtotal = lineItemsData.reduce((sum, item) => sum + item.price, 0)
  const discountAmount = subtotal * discountPercent
  const total = subtotal - discountAmount

  // 6. Create Stripe Checkout Session
  const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  // Helper to check if a string is a valid URL
  const isValidUrl = (str: string | null | undefined): str is string => {
    if (!str) return false
    try {
      new URL(str)
      return true
    } catch {
      return false
    }
  }

  const stripeLineItems = lineItemsData.map((item) => {
    const discountedUnitPrice = Math.round(item.price * (1 - discountPercent) * 100) // Convert to cents

    return {
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.title,
          description: `${item.licenseType === 'exclusive' ? 'Exclusive' : 'Non-Exclusive'} License`,
          ...(isValidUrl(item.artworkUrl) ? { images: [item.artworkUrl] } : {}),
        },
        unit_amount: discountedUnitPrice,
      },
      quantity: 1,
    }
  })

  // Prepare metadata items (Stripe metadata values must be strings, max 500 chars)
  const metadataItems = lineItemsData.map((item) => ({
    trackId: item.trackId,
    licenseType: item.licenseType,
    price: item.price,
    creatorId: item.creatorId,
  }))

  try {
    const stripe = getStripe()
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: stripeLineItems,
      metadata: {
        userId: user.id,
        items: JSON.stringify(metadataItems),
        discountPercent: String(discountPercent * 100),
        subtotal: String(subtotal),
        total: String(total),
      },
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cart`,
      customer_email: user.email,
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('Stripe checkout session creation failed:', err)
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to create checkout session', details: errorMessage },
      { status: 500 }
    )
  }
}
