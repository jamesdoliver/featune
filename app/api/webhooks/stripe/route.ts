import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { getStripe } from '@/lib/stripe/helpers'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateLicensePDF, uploadLicensePDF } from '@/lib/pdf/license'
import {
  sendPurchaseConfirmation,
  sendCreatorSaleNotification,
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
  userId: string
  items: string // JSON-encoded MetadataItem[]
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

  if (!metadata?.userId || !metadata?.items) {
    console.error('Missing required metadata on checkout session', session.id)
    return
  }

  const userId = metadata.userId
  const items: MetadataItem[] = JSON.parse(metadata.items)
  const discountPercent = parseFloat(metadata.discountPercent) || 0
  const subtotal = parseFloat(metadata.subtotal) || 0
  const total = parseFloat(metadata.total) || 0
  const discountAmount = subtotal - total

  const supabase = createAdminClient()

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
  // 4. Fetch buyer profile for license PDF / emails
  // ------------------------------------------------------------------
  const { data: buyerProfile } = await supabase
    .from('profiles')
    .select('email, full_name')
    .eq('id', userId)
    .single()

  const buyerName = buyerProfile?.full_name || 'Customer'
  const buyerEmail = buyerProfile?.email || session.customer_email || ''

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

      // (b) Calculate creator earnings
      const creatorEarnings =
        item.price * (1 - discountPercent / 100) * revenueSplit

      // (c) Create order_items record
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

      // (d) Fetch track details + increment licenses_sold
      const { data: track } = await supabase
        .from('tracks')
        .select('id, title, licenses_sold, license_type, license_limit')
        .eq('id', item.trackId)
        .single()

      if (track) {
        const newLicensesSold = (track.licenses_sold ?? 0) + 1

        await supabase
          .from('tracks')
          .update({ licenses_sold: newLicensesSold })
          .eq('id', item.trackId)

        // (e) Exclusive purchase: mark track as removed
        if (item.licenseType === 'exclusive') {
          await supabase
            .from('tracks')
            .update({ status: 'removed' })
            .eq('id', item.trackId)
        }
        // (f) Limited license: check if sold out
        else if (
          track.license_type === 'limited' &&
          track.license_limit !== null &&
          newLicensesSold >= track.license_limit
        ) {
          await supabase
            .from('tracks')
            .update({ status: 'sold_out' })
            .eq('id', item.trackId)
        }

        // (g) Generate license PDF
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

          // (h) Update order_items with license_pdf_url
          await supabase
            .from('order_items')
            .update({ license_pdf_url: licensePdfUrl })
            .eq('id', orderItem.id)
        } catch (pdfErr) {
          console.error(
            `Failed to generate/upload license PDF for track ${item.trackId}:`,
            pdfErr
          )
        }

        // Collect data for emails
        emailItems.push({
          trackTitle: track.title,
          creatorName: creator?.display_name || 'Unknown Creator',
          licenseType: item.licenseType,
          price: item.price,
          licensePdfUrl,
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
  } catch (emailErr) {
    console.error('Error sending emails:', emailErr)
  }
}
