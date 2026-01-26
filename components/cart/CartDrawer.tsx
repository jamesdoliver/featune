'use client'

import { useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useCartStore } from '@/stores/cartStore'
import type { CartItem } from '@/stores/cartStore'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatPrice(amount: number): string {
  return `$${amount.toFixed(2)}`
}

function getDiscountUpsellMessage(itemCount: number): string | null {
  if (itemCount === 0) return null
  if (itemCount === 1) return 'Add 1 more for 10% off!'
  if (itemCount === 2) return 'Add 1 more for 20% off!'
  return '20% discount applied!'
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function CartItemRow({
  item,
  onRemove,
}: {
  item: CartItem
  onRemove: (trackId: string) => void
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border-default bg-bg-elevated p-3">
      {/* Artwork thumbnail */}
      <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-md bg-bg-card">
        {item.artworkUrl ? (
          <img
            src={item.artworkUrl}
            alt={item.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <svg
              width="24"
              height="24"
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
              <circle cx="6" cy="18" r="3" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="18" cy="16" r="3" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="truncate text-sm font-medium text-text-primary">{item.title}</p>
        <p className="truncate text-xs text-text-secondary">{item.creatorName}</p>
        <span
          className={`inline-flex w-fit rounded-full px-2 py-0.5 text-xs font-medium ${
            item.licenseType === 'exclusive'
              ? 'bg-accent-muted text-accent'
              : 'bg-bg-card text-text-secondary'
          }`}
        >
          {item.licenseType === 'exclusive' ? 'Exclusive' : 'Non-Exclusive'}
        </span>
      </div>

      {/* Price + remove */}
      <div className="flex flex-col items-end gap-2">
        <span className="text-sm font-bold text-text-primary">{formatPrice(item.price)}</span>
        <button
          type="button"
          onClick={() => onRemove(item.trackId)}
          className="flex h-6 w-6 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-bg-card hover:text-error"
          aria-label={`Remove ${item.title} from cart`}
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
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}

function EmptyCartState({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      {/* Cart icon */}
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-bg-elevated">
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-text-muted"
        >
          <circle cx="9" cy="21" r="1" />
          <circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
        </svg>
      </div>
      <div>
        <p className="text-sm font-medium text-text-primary">Your cart is empty</p>
        <p className="mt-1 text-xs text-text-secondary">
          Browse our collection and find your perfect vocal topline.
        </p>
      </div>
      <Link
        href="/search"
        onClick={onClose}
        className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
      >
        Browse Tracks
      </Link>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function CartDrawer() {
  const isDrawerOpen = useCartStore((s) => s.isDrawerOpen)
  const items = useCartStore((s) => s.items)
  const removeItem = useCartStore((s) => s.removeItem)
  const closeDrawer = useCartStore((s) => s.closeDrawer)

  const subtotal = useCartStore((s) => s.getSubtotal())
  const discountPercent = useCartStore((s) => s.getDiscountPercent())
  const discountAmount = useCartStore((s) => s.getDiscountAmount())
  const total = useCartStore((s) => s.getTotal())
  const itemCount = useCartStore((s) => s.getItemCount())

  // Close on Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeDrawer()
      }
    },
    [closeDrawer],
  )

  useEffect(() => {
    if (isDrawerOpen) {
      document.addEventListener('keydown', handleKeyDown)
      // Prevent body scroll while drawer is open
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isDrawerOpen, handleKeyDown])

  const upsellMessage = getDiscountUpsellMessage(itemCount)

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className={`fixed inset-0 z-[60] bg-black/60 transition-opacity duration-300 ${
          isDrawerOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={closeDrawer}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <aside
        role="dialog"
        aria-label="Shopping cart"
        aria-modal={isDrawerOpen}
        className={`fixed right-0 top-0 z-[60] flex h-full w-full flex-col bg-bg-card shadow-2xl transition-transform duration-300 ease-in-out sm:w-96 ${
          isDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* ---- Header ---- */}
        <div className="flex items-center justify-between border-b border-border-default px-5 py-4">
          <h2 className="text-base font-semibold text-text-primary">
            Cart{itemCount > 0 && <span className="ml-1 text-text-secondary">({itemCount})</span>}
          </h2>
          <button
            type="button"
            onClick={closeDrawer}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text-primary"
            aria-label="Close cart"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ---- Body ---- */}
        {items.length === 0 ? (
          <EmptyCartState onClose={closeDrawer} />
        ) : (
          <>
            {/* Discount upsell banner */}
            {upsellMessage && (
              <div
                className={`mx-5 mt-4 rounded-lg px-4 py-2.5 text-center text-xs font-medium ${
                  itemCount >= 3
                    ? 'bg-success/10 text-success'
                    : 'bg-accent-muted text-accent'
                }`}
              >
                {upsellMessage}
              </div>
            )}

            {/* Cart items list */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <div className="flex flex-col gap-3">
                {items.map((item) => (
                  <CartItemRow key={item.trackId} item={item} onRemove={removeItem} />
                ))}
              </div>
            </div>

            {/* ---- Footer: totals + actions ---- */}
            <div className="border-t border-border-default px-5 py-4">
              {/* Price breakdown */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary">Subtotal</span>
                  <span className="text-text-primary">{formatPrice(subtotal)}</span>
                </div>

                {discountPercent > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-success">Discount ({discountPercent}%)</span>
                    <span className="text-success">-{formatPrice(discountAmount)}</span>
                  </div>
                )}

                <div className="flex items-center justify-between border-t border-border-default pt-2 text-sm font-semibold">
                  <span className="text-text-primary">Total</span>
                  <span className="text-text-primary">{formatPrice(total)}</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-4 flex flex-col gap-2">
                <Link
                  href="/cart"
                  onClick={closeDrawer}
                  className="flex h-11 items-center justify-center rounded-lg bg-accent text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
                >
                  Checkout
                </Link>
                <Link
                  href="/cart"
                  onClick={closeDrawer}
                  className="flex h-10 items-center justify-center rounded-lg border border-border-default text-sm font-medium text-text-secondary transition-colors hover:border-border-hover hover:text-text-primary"
                >
                  View Cart
                </Link>
              </div>
            </div>
          </>
        )}
      </aside>
    </>
  )
}
