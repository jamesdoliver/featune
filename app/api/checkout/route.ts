import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe/helpers'
import { calculateDiscount } from '@/lib/pricing'
import type { OrderLicenseType } from '@/lib/types/database'

// Simple per-user rate limiter: max 5 checkout attempts per 10 minutes
const CHECKOUT_RATE_LIMIT_MAX = 5
const CHECKOUT_RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000
const checkoutRequests = new Map<string, number[]>()

function isCheckoutRateLimited(userId: string): boolean {
  const now = Date.now()
  const timestamps = (checkoutRequests.get(userId) ?? []).filter(
    (t) => now - t < CHECKOUT_RATE_LIMIT_WINDOW_MS
  )
  if (timestamps.length >= CHECKOUT_RATE_LIMIT_MAX) {
    checkoutRequests.set(userId, timestamps)
    return true
  }
  timestamps.push(now)
  checkoutRequests.set(userId, timestamps)
  return false
}

interface CartItem {
  trackId: string
  licenseType: OrderLicenseType
}

interface RequestBody {
  items: CartItem[]
  termsAccepted?: boolean
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  // 1. Authenticate user (optional — guests can checkout too)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Rate limit: use user ID if logged in, IP if guest
  const rateLimitKey = user?.id || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  if (isCheckoutRateLimited(rateLimitKey)) {
    return NextResponse.json(
      { error: 'Too many checkout attempts. Please try again later.' },
      { status: 429 }
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

  // Deduplicate items by trackId (last entry wins, prevents double-purchasing)
  const deduped = new Map(body.items.map((item) => [item.trackId, item]))
  body.items = Array.from(deduped.values())

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
  const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL
  if (!origin) {
    return NextResponse.json(
      { error: 'Site URL not configured' },
      { status: 500 }
    )
  }

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

  // Prepare metadata items – Stripe limits each metadata value to 500 chars.
  // Split items across multiple keys to avoid overflow.
  const metadataItems = lineItemsData.map((item) => ({
    trackId: item.trackId,
    licenseType: item.licenseType,
    price: item.price,
    creatorId: item.creatorId,
  }))

  const STRIPE_META_MAX = 500
  const itemChunks: Record<string, string> = {}
  let chunkIndex = 0
  let currentChunk: typeof metadataItems = []

  for (const mi of metadataItems) {
    const tentative = JSON.stringify([...currentChunk, mi])
    if (tentative.length > STRIPE_META_MAX && currentChunk.length > 0) {
      itemChunks[`items_${chunkIndex}`] = JSON.stringify(currentChunk)
      chunkIndex++
      currentChunk = [mi]
    } else {
      currentChunk.push(mi)
    }
  }
  if (currentChunk.length > 0) {
    itemChunks[`items_${chunkIndex}`] = JSON.stringify(currentChunk)
  }

  try {
    const stripe = getStripe()
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: stripeLineItems,
      metadata: {
        ...(user ? { userId: user.id } : { guestCheckout: 'true' }),
        ...itemChunks,
        itemChunkCount: String(chunkIndex + 1),
        discountPercent: String(discountPercent * 100),
        subtotal: String(subtotal),
        total: String(total),
      },
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cart`,
      ...(user?.email ? { customer_email: user.email } : {}),
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
