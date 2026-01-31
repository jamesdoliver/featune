'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useCartStore, type CartItem } from '@/stores/cartStore'
import { TermsModal } from '@/components/checkout/TermsModal'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`
}

function licenseLabelFor(type: CartItem['licenseType']): string {
  return type === 'exclusive' ? 'Exclusive' : 'Non-Exclusive'
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Empty state displayed when the cart has no items. */
function EmptyCart() {
  return (
    <div className="flex flex-col items-center justify-center py-24">
      {/* Shopping bag icon */}
      <svg
        width="64"
        height="64"
        viewBox="0 0 24 24"
        fill="none"
        className="mb-6 text-text-muted"
      >
        <path
          d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <line
          x1="3"
          y1="6"
          x2="21"
          y2="6"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M16 10a4 4 0 01-8 0"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      <h2 className="text-xl font-semibold text-text-primary">
        Your cart is empty
      </h2>
      <p className="mt-2 text-sm text-text-secondary">
        Find the perfect vocal topline for your next production.
      </p>

      <Link
        href="/search"
        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
      >
        Browse Tracks
      </Link>
    </div>
  )
}

/** A single cart item row. */
function CartItemRow({
  item,
  onRemove,
  onToggleLicense,
}: {
  item: CartItem
  onRemove: () => void
  onToggleLicense: () => void
}) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border-default bg-bg-card p-4 sm:flex-row sm:items-center">
      {/* Artwork */}
      <div className="flex-shrink-0">
        {item.artworkUrl ? (
          <img
            src={item.artworkUrl}
            alt={item.title}
            className="h-20 w-20 rounded-lg object-cover"
          />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-bg-elevated">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              className="text-text-muted"
            >
              <path
                d="M9 18V5l12-2v13"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle
                cx="6"
                cy="18"
                r="3"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <circle
                cx="18"
                cy="16"
                r="3"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <Link
          href={`/track/${item.trackId}`}
          className="truncate text-sm font-medium text-text-primary transition-colors hover:text-accent"
          title={item.title}
        >
          {item.title}
        </Link>
        <p className="truncate text-xs text-text-secondary">
          {item.creatorName}
        </p>

        {/* License type selector */}
        <button
          type="button"
          onClick={onToggleLicense}
          className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-full border border-border-default bg-bg-elevated px-3 py-1 text-xs text-text-secondary transition-colors hover:border-border-hover hover:text-text-primary"
        >
          <span
            className={
              item.licenseType === 'exclusive'
                ? 'font-medium text-accent'
                : ''
            }
          >
            {licenseLabelFor(item.licenseType)}
          </span>
          {/* Swap icon */}
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="17 1 21 5 17 9" />
            <path d="M3 11V9a4 4 0 014-4h14" />
            <polyline points="7 23 3 19 7 15" />
            <path d="M21 13v2a4 4 0 01-4 4H3" />
          </svg>
        </button>
      </div>

      {/* Price + Remove */}
      <div className="flex items-center gap-4 sm:flex-col sm:items-end sm:gap-2">
        <p className="text-sm font-bold text-accent">
          {formatPrice(item.price)}
        </p>
        <button
          type="button"
          onClick={onRemove}
          className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-text-muted transition-colors hover:bg-bg-elevated hover:text-error"
          aria-label={`Remove ${item.title} from cart`}
        >
          {/* Trash icon */}
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
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
          </svg>
          <span className="hidden sm:inline">Remove</span>
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Discount upsell message
// ---------------------------------------------------------------------------

function getUpsellMessage(itemCount: number): string | null {
  if (itemCount === 0) return null
  if (itemCount === 1) return 'Add 1 more track for 10% off!'
  if (itemCount === 2) return 'Add 1 more track for 20% off!'
  return null // already at max discount
}

// ---------------------------------------------------------------------------
// Main cart content (must run inside Suspense since it reads client state)
// ---------------------------------------------------------------------------

function CartContent() {
  const items = useCartStore((s) => s.items)
  const removeItem = useCartStore((s) => s.removeItem)
  const clearCart = useCartStore((s) => s.clearCart)
  const addItem = useCartStore((s) => s.addItem)

  const subtotal = useCartStore((s) => s.getSubtotal())
  const discountPercent = useCartStore((s) => s.getDiscountPercent())
  const discountAmount = useCartStore((s) => s.getDiscountAmount())
  const total = useCartStore((s) => s.getTotal())

  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const [showTermsModal, setShowTermsModal] = useState(false)

  // Toggle between non_exclusive and exclusive for a given item.
  // Since the cart store replaces by trackId on addItem, we simply flip the
  // licenseType. In a real implementation the component would know both prices
  // and update accordingly; for now we keep the same price.
  const handleToggleLicense = (item: CartItem) => {
    const newType: CartItem['licenseType'] =
      item.licenseType === 'non_exclusive' ? 'exclusive' : 'non_exclusive'
    addItem({ ...item, licenseType: newType })
  }

  // Opens terms modal before checkout
  const handleCheckoutClick = () => {
    setCheckoutError(null)
    setShowTermsModal(true)
  }

  // Proceed to checkout after terms are accepted
  const handleTermsAccepted = async () => {
    setShowTermsModal(false)
    setCheckoutLoading(true)
    setCheckoutError(null)
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((item) => ({
            trackId: item.trackId,
            licenseType: item.licenseType,
          })),
          termsAccepted: true,
        }),
      })
      const data = await response.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        const errorMsg = data.details
          ? `${data.error}: ${data.details}`
          : data.error || 'Something went wrong. Please try again.'
        setCheckoutError(errorMsg)
      }
    } catch {
      setCheckoutError('Unable to reach the server. Please try again.')
    } finally {
      setCheckoutLoading(false)
    }
  }

  // ---- Empty state ----
  if (items.length === 0) {
    return <EmptyCart />
  }

  const upsell = getUpsellMessage(items.length)

  return (
    <>
      {/* Header row */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
          Your Cart{' '}
          <span className="text-base font-normal text-text-secondary">
            ({items.length} {items.length === 1 ? 'item' : 'items'})
          </span>
        </h1>

        <button
          type="button"
          onClick={clearCart}
          className="rounded-lg px-3 py-1.5 text-xs font-medium text-text-muted transition-colors hover:bg-bg-elevated hover:text-error"
        >
          Clear Cart
        </button>
      </div>

      {/* Back link */}
      <Link
        href="/search"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-text-secondary transition-colors hover:text-text-primary"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M10 12L6 8l4-4" />
        </svg>
        Continue shopping
      </Link>

      {/* Item list */}
      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <CartItemRow
            key={item.trackId}
            item={item}
            onRemove={() => removeItem(item.trackId)}
            onToggleLicense={() => handleToggleLicense(item)}
          />
        ))}
      </div>

      {/* Upsell / discount callout */}
      {upsell && (
        <div className="mt-6 rounded-xl border border-accent/30 bg-accent-muted px-4 py-3 text-sm font-medium text-accent">
          {upsell}
        </div>
      )}

      {/* Summary section */}
      <div className="mt-8 rounded-xl border border-border-default bg-bg-card p-6">
        {/* Subtotal */}
        <div className="flex items-center justify-between text-sm text-text-secondary">
          <span>Subtotal</span>
          <span>{formatPrice(subtotal)}</span>
        </div>

        {/* Discount */}
        {discountPercent > 0 && (
          <div className="mt-3 flex items-center justify-between text-sm">
            <span className="font-medium text-accent">
              Bundle Discount: {discountPercent}% off
            </span>
            <span className="font-medium text-accent">
              -{formatPrice(discountAmount)}
            </span>
          </div>
        )}

        {/* Divider */}
        <div className="my-4 border-t border-border-default" />

        {/* Total */}
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-text-primary">Total</span>
          <span className="text-lg font-bold text-text-primary">
            {formatPrice(total)}
          </span>
        </div>

        {/* Error */}
        {checkoutError && (
          <p className="mt-4 rounded-lg bg-error/10 px-3 py-2 text-sm text-error">
            {checkoutError}
          </p>
        )}

        {/* Checkout button */}
        <button
          type="button"
          onClick={handleCheckoutClick}
          disabled={checkoutLoading}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-4 text-base font-semibold text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {checkoutLoading ? (
            <>
              {/* Spinner */}
              <svg
                className="h-5 w-5 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Processing...
            </>
          ) : (
            'Proceed to Checkout'
          )}
        </button>

        {/* Terms note */}
        <p className="mt-3 text-center text-xs text-text-muted">
          By proceeding, you agree to our{' '}
          <Link href="/terms" className="text-accent hover:underline">
            License Terms
          </Link>
        </p>
      </div>

      {/* Terms Modal */}
      <TermsModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        onAccept={handleTermsAccepted}
      />
    </>
  )
}

// ---------------------------------------------------------------------------
// Page export (wrapped in Suspense for client state hydration)
// ---------------------------------------------------------------------------

export default function CartPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
          {/* Skeleton header */}
          <div className="mb-6 flex items-center justify-between">
            <div className="h-8 w-48 animate-pulse rounded bg-bg-elevated" />
            <div className="h-6 w-20 animate-pulse rounded bg-bg-elevated" />
          </div>
          {/* Skeleton items */}
          <div className="flex flex-col gap-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className="flex gap-4 rounded-xl border border-border-default bg-bg-card p-4"
              >
                <div className="h-20 w-20 flex-shrink-0 animate-pulse rounded-lg bg-bg-elevated" />
                <div className="flex flex-1 flex-col gap-2">
                  <div className="h-4 w-3/4 animate-pulse rounded bg-bg-elevated" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-bg-elevated" />
                  <div className="h-6 w-24 animate-pulse rounded-full bg-bg-elevated" />
                </div>
                <div className="h-4 w-16 animate-pulse rounded bg-bg-elevated" />
              </div>
            ))}
          </div>
          {/* Skeleton summary */}
          <div className="mt-8 rounded-xl border border-border-default bg-bg-card p-6">
            <div className="flex flex-col gap-3">
              <div className="h-4 w-full animate-pulse rounded bg-bg-elevated" />
              <div className="h-4 w-full animate-pulse rounded bg-bg-elevated" />
              <div className="my-2 border-t border-border-default" />
              <div className="h-6 w-full animate-pulse rounded bg-bg-elevated" />
            </div>
            <div className="mt-6 h-14 w-full animate-pulse rounded-xl bg-bg-elevated" />
          </div>
        </div>
      }
    >
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <CartContent />
      </div>
    </Suspense>
  )
}
