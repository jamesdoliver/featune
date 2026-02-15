import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { getStripe } from '@/lib/stripe/helpers'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateLicensePDF, uploadLicensePDF } from '@/lib/pdf/license'
import {
  sendPurchaseConfirmation,
  sendCreatorSaleNotification,
  sendWelcomeEmail,
} from '@/lib/email'
import type { OrderLicenseType } from '@/lib/types/database'

export const runtime = 'nodejs'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MetadataItem {
  trackId: string
  licenseType: OrderLicenseType
  price: number
  creatorId: string
}

interface SessionMetadata {
  userId?: string
  guestCheckout?: string
  // Items may be in a single `items` key (legacy) or chunked across
  // `items_0`, `items_1`, … with `itemChunkCount` indicating how many.
  items?: string
  itemChunkCount?: string
  [key: string]: string | undefined
  discountPercent: string
  subtotal: string
  total: string
}

// ---------------------------------------------------------------------------
// POST /api/webhooks/stripe
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  const stripe = getStripe()

  // 1. Read raw body and verify webhook signature
  let event: Stripe.Event
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      )
    }

    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Unknown verification error'
    console.error('Stripe webhook signature verification failed:', message)
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${message}` },
      { status: 400 }
    )
  }

  // 2. Only handle checkout.session.completed
  if (event.type !== 'checkout.session.completed') {
    // Acknowledge other event types without processing
    return NextResponse.json({ received: true })
  }

  // Return 200 promptly; do processing inline but catch all errors so Stripe
  // never receives a non-2xx that would trigger retries for transient issues.
  try {
    await handleCheckoutSessionCompleted(
      event.data.object as Stripe.Checkout.Session
    )
  } catch (err) {
    // Log but still return 200 so Stripe does not retry endlessly
    console.error('Error processing checkout.session.completed:', err)
  }

  return NextResponse.json({ received: true })
}

// ---------------------------------------------------------------------------
// Core handler
// ---------------------------------------------------------------------------

async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session
) {
  const metadata = session.metadata as unknown as SessionMetadata | null

  if (!metadata?.userId && metadata?.guestCheckout !== 'true') {
    console.error('Missing required metadata on checkout session', session.id)
    return
  }

  // Guard against duplicate webhook deliveries
  const supabase = createAdminClient()
  const { data: existingOrder } = await supabase
    .from('orders')
    .select('id')
    .eq('stripe_payment_intent', session.id)
    .maybeSingle()

  if (existingOrder) {
    console.log('Webhook already processed for session', session.id)
    return
  }

  // ------------------------------------------------------------------
  // 2b. Resolve user ID (existing user or auto-create for guests)
  // ------------------------------------------------------------------
  let userId: string
  let buyerEmail: string
  let buyerName: string
  let isGuestCheckout = false

  if (metadata.guestCheckout === 'true') {
    isGuestCheckout = true
    buyerEmail = session.customer_details?.email || ''
    buyerName = session.customer_details?.name || 'Customer'

    if (!buyerEmail) {
      console.error('Guest checkout missing email', session.id)
      return
    }

    // Check if a user with this email already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find(
      (u) => u.email === buyerEmail
    )

    if (existingUser) {
      userId = existingUser.id
    } else {
      // Create account with random password — user will reset via email
      const tempPassword = crypto.randomUUID() + crypto.randomUUID()
      const { data: newUser, error: createError } =
        await supabase.auth.admin.createUser({
          email: buyerEmail,
          password: tempPassword,
          email_confirm: true,
          user_metadata: { full_name: buyerName },
        })

      if (createError || !newUser.user) {
        console.error('Failed to create guest account:', createError)
        return
      }
      userId = newUser.user.id
    }
  } else {
    userId = metadata.userId!

    const { data: buyerProfile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', userId)
      .single()

    buyerName = buyerProfile?.full_name || 'Customer'
    buyerEmail = buyerProfile?.email || session.customer_email || ''
  }

  // Reassemble items from chunked metadata keys (items_0, items_1, …)
  // with fallback to legacy single `items` key.
  let items: MetadataItem[]

  if (metadata.itemChunkCount) {
    const chunkCount = parseInt(metadata.itemChunkCount, 10)
    items = []
    for (let i = 0; i < chunkCount; i++) {
      const chunk = metadata[`items_${i}`]
      if (chunk) items.push(...JSON.parse(chunk))
    }
  } else if (metadata.items) {
    items = JSON.parse(metadata.items)
  } else {
    console.error('Missing items metadata on checkout session', session.id)
    return
  }
  const discountPercent = parseFloat(metadata.discountPercent) || 0
  const subtotal = parseFloat(metadata.subtotal) || 0
  const total = parseFloat(metadata.total) || 0
  const discountAmount = subtotal - total

  // ------------------------------------------------------------------
  // 3. Create order record
  // ------------------------------------------------------------------
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: userId,
      stripe_payment_intent: session.id,
      subtotal,
      discount_percent: discountPercent,
      discount_amount: discountAmount,
      total,
      status: 'completed',
    })
    .select()
    .single()

  if (orderError || !order) {
    console.error('Failed to create order:', orderError)
    throw new Error(`Failed to create order: ${orderError?.message}`)
  }

  // ------------------------------------------------------------------
  // 5. Process each item
  // ------------------------------------------------------------------

  // Collect data for the purchase confirmation email
  const emailItems: Array<{
    trackTitle: string
    creatorName: string
    licenseType: string
    price: number
    licensePdfUrl?: string
    acapellaUrl?: string
    instrumentalUrl?: string
  }> = []

  // Collect creator notifications to send after processing
  const creatorNotifications: Array<{
    to: string
    creatorName: string
    trackTitle: string
    licenseType: string
    earnings: number
  }> = []

  for (const item of items) {
    try {
      // (a) Fetch creator's revenue_split
      const { data: creator } = await supabase
        .from('creators')
        .select('id, display_name, revenue_split, user_id')
        .eq('id', item.creatorId)
        .single()

      const revenueSplit = creator?.revenue_split ?? 0.7

      // (b) Calculate creator earnings (round to cents to avoid IEEE 754 drift)
      const discountedPrice =
        Math.round(item.price * (1 - discountPercent / 100) * 100) / 100
      const creatorEarnings =
        Math.round(discountedPrice * revenueSplit * 100) / 100

      // (c) Atomically update track BEFORE creating order_items
      //     (prevents writing order items for failed exclusive purchases)
      const { data: purchaseResult, error: purchaseError } = await supabase
        .rpc('process_track_purchase', {
          p_track_id: item.trackId,
          p_license_type: item.licenseType,
        })

      if (purchaseError || !purchaseResult?.success) {
        console.error(
          `Purchase failed for track ${item.trackId}:`,
          purchaseError?.message || purchaseResult?.error
        )
        continue
      }

      // (d) Create order_items record (only after successful purchase lock)
      const { data: orderItem, error: orderItemError } = await supabase
        .from('order_items')
        .insert({
          order_id: order.id,
          track_id: item.trackId,
          license_type: item.licenseType,
          price_at_purchase: item.price,
          creator_earnings: creatorEarnings,
        })
        .select()
        .single()

      if (orderItemError) {
        console.error(
          `Failed to create order item for track ${item.trackId}:`,
          orderItemError
        )
        continue
      }

      // (e) Fetch track details for license PDF (read-only)
      const { data: track } = await supabase
        .from('tracks')
        .select('id, title, acapella_url, instrumental_url')
        .eq('id', item.trackId)
        .single()

      if (track) {
        // (f) Generate license PDF
        let licensePdfUrl: string | undefined
        try {
          const licenseId = orderItem.id as string
          const pdfBytes = await generateLicensePDF({
            licenseId,
            licenseType: item.licenseType,
            buyerName,
            buyerEmail,
            purchaseDate: new Date(),
            trackTitle: track.title,
            creatorName: creator?.display_name || 'Unknown Creator',
          })
          licensePdfUrl = await uploadLicensePDF(pdfBytes, licenseId)

          // (g) Update order_items with license_pdf_url
          await supabase
            .from('order_items')
            .update({ license_pdf_url: licensePdfUrl })
            .eq('id', orderItem.id)
        } catch (pdfErr) {
          const errorMessage = pdfErr instanceof Error ? pdfErr.message : 'Unknown error'
          console.error(
            '[PDF_GENERATION_FAILED]',
            JSON.stringify({
              orderId: order.id,
              orderItemId: orderItem.id,
              trackId: item.trackId,
              trackTitle: track.title,
              buyerEmail,
              error: errorMessage,
            })
          )
          // Mark the order item so admins can identify and regenerate failed PDFs
          await supabase
            .from('order_items')
            .update({ license_pdf_url: 'GENERATION_FAILED' })
            .eq('id', orderItem.id)
        }

        // Collect data for emails
        emailItems.push({
          trackTitle: track.title,
          creatorName: creator?.display_name || 'Unknown Creator',
          licenseType: item.licenseType,
          price: item.price,
          licensePdfUrl,
          acapellaUrl: track.acapella_url || undefined,
          instrumentalUrl: track.instrumental_url || undefined,
        })

        // Prepare creator notification
        if (creator) {
          const { data: creatorProfile } = await supabase
            .from('profiles')
            .select('email')
            .eq('id', creator.user_id)
            .single()

          if (creatorProfile?.email) {
            creatorNotifications.push({
              to: creatorProfile.email,
              creatorName: creator.display_name,
              trackTitle: track.title,
              licenseType: item.licenseType,
              earnings: creatorEarnings,
            })
          }
        }
      }
    } catch (itemErr) {
      console.error(
        `Error processing item (track ${item.trackId}):`,
        itemErr
      )
    }
  }

  // ------------------------------------------------------------------
  // 6. Send emails (non-blocking -- errors are logged, not thrown)
  // ------------------------------------------------------------------
  try {
    // Purchase confirmation to buyer
    if (buyerEmail) {
      await sendPurchaseConfirmation({
        to: buyerEmail,
        buyerName,
        orderId: order.id,
        items: emailItems,
        subtotal,
        discountPercent,
        discountAmount,
        total,
      })
    }

    // Sale notification to each creator
    for (const notification of creatorNotifications) {
      await sendCreatorSaleNotification(notification)
    }

    // For guest checkouts: send welcome email + password reset link
    if (isGuestCheckout && buyerEmail) {
      await sendWelcomeEmail({ to: buyerEmail, name: buyerName })
      await supabase.auth.admin.generateLink({
        type: 'recovery',
        email: buyerEmail,
      })
    }
  } catch (emailErr) {
    console.error('Error sending emails:', emailErr)
  }
}
