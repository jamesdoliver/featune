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
  acapella_url: string | null
  instrumental_url: string | null
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
    case 'cancelled':
      return {
        label: 'Cancelled',
        className: 'bg-text-muted/15 text-text-muted',
      }
    case 'refunded':
      return {
        label: 'Refunded',
        className: 'bg-accent-muted text-accent',
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

function DownloadButton({
  href,
  label,
  ariaLabel,
  title,
}: {
  href: string
  label: string
  ariaLabel: string
  title: string
}) {
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    setLoading(true)
    try {
      // Use fetch to trigger download, then follow the redirect
      const res = await fetch(href)
      if (!res.ok) throw new Error('Download failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      // Extract filename from content-disposition header if available
      const disposition = res.headers.get('content-disposition')
      const match = disposition?.match(/filename="?(.+?)"?$/i)
      a.download = match?.[1] ?? label.toLowerCase()
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      // Fallback: open link directly
      window.location.href = href
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="flex h-8 items-center justify-center gap-1 rounded-lg border border-border-default px-2 text-xs font-medium text-text-secondary transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
      aria-label={ariaLabel}
      title={title}
    >
      {loading ? <SpinnerIcon /> : <DownloadIcon />}
      <span className="hidden sm:inline">{label}</span>
    </button>
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

      {/* Download buttons */}
      <div className="flex shrink-0 items-center gap-1">
        {track?.acapella_url && (
          <DownloadButton
            href={`/api/downloads/${track.id}?type=acapella`}
            label="Acapella"
            ariaLabel={`Download acapella for ${track?.title ?? 'track'}`}
            title="Download Acapella"
          />
        )}
        {track?.instrumental_url && (
          <DownloadButton
            href={`/api/downloads/${track.id}?type=instrumental`}
            label="Stems"
            ariaLabel={`Download instrumental for ${track?.title ?? 'track'}`}
            title="Download Instrumental"
          />
        )}
        {item.license_pdf_url && track && (
          <DownloadButton
            href={`/api/downloads/${track.id}?type=license`}
            label="License"
            ariaLabel={`Download license for ${track.title}`}
            title="Download License PDF"
          />
        )}
      </div>
    </li>
  )
}

function SpinnerIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="animate-spin">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="28" strokeDashoffset="10" />
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
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
