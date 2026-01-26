import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Order Confirmed - FEATUNE',
  description: 'Your purchase was successful. Download your licensed tracks.',
}

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>
}) {
  const { session_id } = await searchParams

  // No session_id: show a generic "no order found" state
  if (!session_id) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center px-6 py-24 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-border-default bg-bg-elevated">
          <svg
            width="36"
            height="36"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-text-muted"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M8 15h8M9 9h.01M15 9h.01" />
          </svg>
        </div>
        <h1 className="mt-6 text-2xl font-bold text-text-primary">
          No Order Found
        </h1>
        <p className="mt-2 text-text-secondary">
          We could not find an order to display. If you just completed a
          purchase, check your email for a confirmation.
        </p>
        <Link
          href="/search"
          className="mt-8 inline-flex h-11 items-center justify-center rounded-lg bg-accent px-6 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
        >
          Browse Tracks
        </Link>
      </div>
    )
  }

  // Authenticate user
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch order by Stripe session ID, ensuring it belongs to the authenticated user
  const { data: order } = await supabase
    .from('orders')
    .select(
      `
      id,
      user_id,
      subtotal,
      discount_percent,
      discount_amount,
      total,
      status,
      created_at,
      order_items (
        id,
        track_id,
        license_type,
        price_at_purchase,
        license_pdf_url,
        tracks (
          id,
          title,
          artwork_url,
          creator_id,
          creators (
            id,
            display_name
          )
        )
      )
    `
    )
    .eq('stripe_payment_intent', session_id)
    .eq('user_id', user.id)
    .single()

  if (!order) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center px-6 py-24 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-border-default bg-bg-elevated">
          <svg
            width="36"
            height="36"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-text-muted"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M8 15h8M9 9h.01M15 9h.01" />
          </svg>
        </div>
        <h1 className="mt-6 text-2xl font-bold text-text-primary">
          Order Not Found
        </h1>
        <p className="mt-2 text-text-secondary">
          We could not find this order. It may not belong to your account, or the
          session has expired.
        </p>
        <Link
          href="/search"
          className="mt-8 inline-flex h-11 items-center justify-center rounded-lg bg-accent px-6 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
        >
          Browse Tracks
        </Link>
      </div>
    )
  }

  // Normalize nested Supabase joins (may come back as arrays)
  const items = (order.order_items ?? []).map((item) => {
    const trackRaw = item.tracks as unknown as {
      id: string
      title: string
      artwork_url: string | null
      creator_id: string
      creators:
        | { id: string; display_name: string }
        | { id: string; display_name: string }[]
    }

    const creator = Array.isArray(trackRaw.creators)
      ? trackRaw.creators[0]
      : trackRaw.creators

    return {
      id: item.id as string,
      license_type: item.license_type as string,
      price_at_purchase: item.price_at_purchase as number,
      license_pdf_url: item.license_pdf_url as string | null,
      track: {
        id: trackRaw.id,
        title: trackRaw.title,
        artwork_url: trackRaw.artwork_url,
      },
      creator: creator ?? { id: '', display_name: 'Unknown' },
    }
  })

  const orderDate = new Date(order.created_at as string).toLocaleDateString(
    'en-US',
    {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }
  )

  const discountPercent = (order.discount_percent as number) ?? 0
  const discountAmount = (order.discount_amount as number) ?? 0

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      {/* Success icon */}
      <div className="flex flex-col items-center text-center">
        <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-success/15">
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="animate-[checkmark_0.4s_ease-in-out] text-success"
          >
            <path d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="mt-6 text-3xl font-bold tracking-tight text-text-primary">
          Thank you for your purchase!
        </h1>
        <p className="mt-2 text-text-secondary">
          Your order has been confirmed. Download your licenses and files below.
        </p>
        <p className="mt-1 text-sm text-text-muted">
          Order placed on {orderDate}
        </p>
      </div>

      {/* Order items card */}
      <div className="mt-10 rounded-xl border border-border-default bg-bg-card">
        <div className="border-b border-border-default px-6 py-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-text-secondary">
            Order Summary
          </h2>
        </div>

        <ul className="divide-y divide-border-default">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-4 px-6 py-4">
              {/* Artwork */}
              {item.track.artwork_url ? (
                <img
                  src={item.track.artwork_url}
                  alt={item.track.title}
                  className="h-14 w-14 flex-shrink-0 rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-lg bg-bg-elevated">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-text-muted"
                  >
                    <path d="M9 18V5l12-2v13" />
                    <circle cx="6" cy="18" r="3" />
                    <circle cx="18" cy="16" r="3" />
                  </svg>
                </div>
              )}

              {/* Track info */}
              <div className="min-w-0 flex-1">
                <Link
                  href={`/track/${item.track.id}`}
                  className="truncate text-sm font-semibold text-text-primary transition-colors hover:text-accent"
                >
                  {item.track.title}
                </Link>
                <p className="mt-0.5 text-xs text-text-muted">
                  by {item.creator.display_name}
                </p>
                <span
                  className={`mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    item.license_type === 'exclusive'
                      ? 'bg-accent-muted text-accent'
                      : 'bg-bg-elevated text-text-secondary'
                  }`}
                >
                  {item.license_type === 'exclusive'
                    ? 'Exclusive'
                    : 'Non-Exclusive'}
                </span>
              </div>

              {/* Price and download */}
              <div className="flex flex-shrink-0 flex-col items-end gap-2">
                <span className="text-sm font-semibold text-text-primary">
                  ${Number(item.price_at_purchase).toFixed(2)}
                </span>
                {item.license_pdf_url && (
                  <a
                    href={item.license_pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border-default px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-accent hover:text-accent"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    License PDF
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>

        {/* Totals */}
        <div className="border-t border-border-default px-6 py-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-secondary">Subtotal</span>
              <span className="text-text-primary">
                ${Number(order.subtotal).toFixed(2)}
              </span>
            </div>

            {discountPercent > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary">
                  Bundle Discount ({discountPercent}%)
                </span>
                <span className="text-success">
                  -${Number(discountAmount).toFixed(2)}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between border-t border-border-default pt-3">
              <span className="text-sm font-semibold text-text-primary">
                Total Paid
              </span>
              <span className="text-lg font-bold text-success">
                ${Number(order.total).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action links */}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/account/purchases"
          className="inline-flex h-11 items-center justify-center rounded-lg border border-border-default px-6 text-sm font-semibold text-text-primary transition-colors hover:border-accent hover:text-accent"
        >
          View Order History
        </Link>
        <Link
          href="/search"
          className="inline-flex h-11 items-center justify-center rounded-lg bg-accent px-6 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
        >
          Continue Browsing
        </Link>
      </div>
    </div>
  )
}
