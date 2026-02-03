'use client'

import { useState, useMemo } from 'react'
import type { OrderWithDetails } from './page'

const statusStyles: Record<string, string> = {
  pending: 'bg-warning/20 text-warning',
  completed: 'bg-success/20 text-success',
  failed: 'bg-error/20 text-error',
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function OrdersClient({
  orders: initialOrders,
}: {
  orders: OrderWithDetails[]
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null)

  const filteredOrders = useMemo(() => {
    return initialOrders.filter((order) => {
      // Status filter
      if (statusFilter && order.status !== statusFilter) {
        return false
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesEmail = order.customer_email.toLowerCase().includes(query)
        const matchesName = order.customer_name?.toLowerCase().includes(query)
        const matchesOrderId = order.id.toLowerCase().includes(query)
        const matchesTrack = order.items.some((item) =>
          item.track_title.toLowerCase().includes(query)
        )

        if (!matchesEmail && !matchesName && !matchesOrderId && !matchesTrack) {
          return false
        }
      }

      return true
    })
  }, [initialOrders, searchQuery, statusFilter])

  const toggleExpanded = (orderId: string) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId)
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search by customer, order ID, or track..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 w-full rounded-lg border border-border-default bg-bg-elevated pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors focus:border-accent"
          />
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
        </div>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 rounded-lg border border-border-default bg-bg-elevated px-3 text-sm text-text-primary outline-none transition-colors focus:border-accent"
        >
          <option value="">All Statuses</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {/* Results count */}
      <p className="text-sm text-text-muted">
        {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''} found
      </p>

      {/* Orders table */}
      {filteredOrders.length === 0 ? (
        <div className="rounded-xl border border-border-default bg-bg-elevated p-8 text-center">
          <p className="text-text-muted">No orders found</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border-default bg-bg-elevated">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-default text-left text-xs font-semibold uppercase tracking-wider text-text-muted">
                <th className="px-5 py-3">Order ID</th>
                <th className="px-5 py-3">Date</th>
                <th className="hidden px-5 py-3 sm:table-cell">Customer</th>
                <th className="hidden px-5 py-3 md:table-cell">Items</th>
                <th className="px-5 py-3">Total</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-default">
              {filteredOrders.map((order) => (
                <>
                  <tr
                    key={order.id}
                    className="cursor-pointer transition-colors hover:bg-bg-card"
                    onClick={() => toggleExpanded(order.id)}
                  >
                    <td className="px-5 py-4 text-sm font-mono text-text-primary">
                      {order.id.slice(0, 8)}...
                    </td>
                    <td className="px-5 py-4 text-sm text-text-secondary">
                      {formatDate(order.created_at)}
                    </td>
                    <td className="hidden px-5 py-4 sm:table-cell">
                      <div className="text-sm font-medium text-text-primary">
                        {order.customer_name || 'N/A'}
                      </div>
                      <div className="text-xs text-text-muted">
                        {order.customer_email}
                      </div>
                    </td>
                    <td className="hidden px-5 py-4 text-sm text-text-secondary md:table-cell">
                      {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                    </td>
                    <td className="px-5 py-4 text-sm font-medium text-text-primary">
                      {formatCurrency(order.total)}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyles[order.status] ?? ''}`}
                      >
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <svg
                        className={`inline-block h-4 w-4 text-text-muted transition-transform ${
                          expandedOrderId === order.id ? 'rotate-180' : ''
                        }`}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </td>
                  </tr>

                  {/* Expanded order details */}
                  {expandedOrderId === order.id && (
                    <tr key={`${order.id}-details`}>
                      <td colSpan={7} className="bg-bg-card px-5 py-4">
                        <div className="space-y-4">
                          {/* Order meta */}
                          <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
                            <div>
                              <span className="text-text-muted">Order ID: </span>
                              <span className="font-mono text-text-primary">{order.id}</span>
                            </div>
                            <div>
                              <span className="text-text-muted">Date: </span>
                              <span className="text-text-primary">{formatDateTime(order.created_at)}</span>
                            </div>
                            {order.stripe_payment_intent && (
                              <div>
                                <span className="text-text-muted">Stripe: </span>
                                <span className="font-mono text-text-primary">
                                  {order.stripe_payment_intent.slice(0, 20)}...
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Customer info (visible on mobile) */}
                          <div className="sm:hidden">
                            <p className="text-sm font-medium text-text-primary">
                              {order.customer_name || 'N/A'}
                            </p>
                            <p className="text-xs text-text-muted">{order.customer_email}</p>
                          </div>

                          {/* Order items */}
                          <div>
                            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
                              Items
                            </h4>
                            <div className="space-y-2">
                              {order.items.map((item) => (
                                <div
                                  key={item.id}
                                  className="flex items-center justify-between rounded-lg border border-border-default bg-bg-elevated px-4 py-3"
                                >
                                  <div>
                                    <p className="text-sm font-medium text-text-primary">
                                      {item.track_title}
                                    </p>
                                    <p className="text-xs text-text-muted">
                                      by {item.creator_name} &middot;{' '}
                                      <span className="capitalize">{item.license_type.replace('_', '-')}</span> license
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-sm font-medium text-text-primary">
                                      {formatCurrency(item.price_at_purchase)}
                                    </p>
                                    {item.license_pdf_url && (
                                      <a
                                        href={item.license_pdf_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="text-xs text-accent hover:underline"
                                      >
                                        View License
                                      </a>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Order totals */}
                          <div className="border-t border-border-default pt-3">
                            <div className="flex justify-end">
                              <div className="w-48 space-y-1 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-text-muted">Subtotal</span>
                                  <span className="text-text-primary">{formatCurrency(order.subtotal)}</span>
                                </div>
                                {order.discount_percent > 0 && (
                                  <div className="flex justify-between">
                                    <span className="text-text-muted">Discount ({order.discount_percent}%)</span>
                                    <span className="text-success">-{formatCurrency(order.discount_amount)}</span>
                                  </div>
                                )}
                                <div className="flex justify-between border-t border-border-default pt-1 font-medium">
                                  <span className="text-text-primary">Total</span>
                                  <span className="text-accent">{formatCurrency(order.total)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
