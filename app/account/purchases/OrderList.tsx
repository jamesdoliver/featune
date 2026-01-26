'use client'

import { useState } from 'react'

// --- Type definitions ---

interface Creator {
  id: string
  display_name: string
}

interface Track {
  id: string
  title: string
  artwork_url: string | null
  creators: Creator | Creator[]
}

interface OrderItem {
  id: string
  order_id: string
  track_id: string
  license_type: string
  price_at_purchase: number
  creator_earnings: number
  license_pdf_url: string | null
  created_at: string
  tracks: Track | null
}

interface Order {
  id: string
  user_id: string
  stripe_payment_intent: string | null
  subtotal: number
  discount_percent: number
  discount_amount: number
  total: number
  status: string
  created_at: string
  order_items: OrderItem[]
}

interface OrderListProps {
  orders: Order[]
}

// --- Helpers ---

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`
}

function getCreatorName(track: Track): string {
  const creator = Array.isArray(track.creators)
    ? track.creators[0]
    : track.creators
  return creator?.display_name ?? 'Unknown Creator'
}

function getStatusConfig(status: string): { label: string; className: string } {
  switch (status) {
    case 'completed':
      return {
        label: 'Completed',
        className: 'bg-success/15 text-success',
      }
    case 'pending':
      return {
        label: 'Pending',
        className: 'bg-warning/15 text-warning',
      }
    case 'failed':
      return {
        label: 'Failed',
        className: 'bg-error/15 text-error',
      }
    default:
      return {
        label: status,
        className: 'bg-bg-elevated text-text-muted',
      }
  }
}

function getLicenseLabel(licenseType: string): string {
  switch (licenseType) {
    case 'non_exclusive':
      return 'Non-Exclusive'
    case 'exclusive':
      return 'Exclusive'
    default:
      return licenseType
  }
}

// --- Components ---

function OrderCard({ order }: { order: Order }) {
  const [expanded, setExpanded] = useState(false)

  const itemCount = order.order_items.length
  const statusConfig = getStatusConfig(order.status)

  return (
    <div className="rounded-xl border border-border-default bg-bg-card">
      {/* Order header - clickable to expand */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-bg-elevated/50"
      >
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
          <span className="text-sm font-medium text-text-primary">
            {formatDate(order.created_at)}
          </span>
          <span
            className={`inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusConfig.className}`}
          >
            {statusConfig.label}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-semibold text-text-primary">
              {formatPrice(order.total)}
            </p>
            <p className="text-xs text-text-muted">
              {itemCount} {itemCount === 1 ? 'item' : 'items'}
              {order.discount_percent > 0 && (
                <span className="ml-1 text-success">
                  ({order.discount_percent}% off)
                </span>
              )}
            </p>
          </div>

          {/* Chevron */}
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            className={`shrink-0 text-text-muted transition-transform duration-200 ${
              expanded ? 'rotate-180' : ''
            }`}
          >
            <path
              d="M4 6L8 10L12 6"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </button>

      {/* Expanded items list */}
      {expanded && (
        <div className="border-t border-border-default">
          <ul className="divide-y divide-border-default">
            {order.order_items.map((item) => (
              <OrderItemRow key={item.id} item={item} />
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function OrderItemRow({ item }: { item: OrderItem }) {
  const track = item.tracks
  const licenseLabel = getLicenseLabel(item.license_type)
  const isExclusive = item.license_type === 'exclusive'

  return (
    <li className="flex items-center gap-4 px-5 py-4">
      {/* Artwork thumbnail */}
      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-border-default">
        {track?.artwork_url ? (
          <img
            src={track.artwork_url}
            alt={track.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-bg-elevated">
            <svg
              width="20"
              height="20"
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

      {/* Track info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-text-primary">
          {track?.title ?? 'Unknown Track'}
        </p>
        <p className="truncate text-xs text-text-secondary">
          {track ? getCreatorName(track) : 'Unknown Creator'}
        </p>
      </div>

      {/* License badge */}
      <span
        className={`hidden shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold sm:inline-flex ${
          isExclusive
            ? 'bg-accent-muted text-accent'
            : 'bg-bg-elevated text-text-muted'
        }`}
      >
        {licenseLabel}
      </span>

      {/* Price */}
      <span className="shrink-0 text-sm font-medium text-text-primary">
        {formatPrice(item.price_at_purchase)}
      </span>

      {/* Download button */}
      {item.license_pdf_url ? (
        <a
          href={item.license_pdf_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border-default text-text-secondary transition-colors hover:border-accent hover:text-accent"
          aria-label={`Download license for ${track?.title ?? 'track'}`}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
          >
            <path
              d="M14 10V12.6667C14 13.0203 13.8595 13.3594 13.6095 13.6095C13.3594 13.8595 13.0203 14 12.6667 14H3.33333C2.97971 14 2.64057 13.8595 2.39052 13.6095C2.14048 13.3594 2 13.0203 2 12.6667V10"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M4.66669 6.66669L8.00002 10L11.3334 6.66669"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M8 10V2"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </a>
      ) : (
        <div className="h-8 w-8 shrink-0" />
      )}
    </li>
  )
}

export default function OrderList({ orders }: OrderListProps) {
  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <OrderCard key={order.id} order={order} />
      ))}
    </div>
  )
}
