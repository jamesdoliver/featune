'use client'

import { useState } from 'react'
import type { PayoutWithCreator } from './page'

const statusStyles: Record<string, string> = {
  pending: 'bg-warning/20 text-warning',
  processing: 'bg-accent/20 text-accent',
  completed: 'bg-success/20 text-success',
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

export default function PayoutsList({
  payouts: initialPayouts,
}: {
  payouts: PayoutWithCreator[]
}) {
  const [payouts, setPayouts] = useState<PayoutWithCreator[]>(initialPayouts)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  async function handleMarkComplete(payoutId: string) {
    setLoadingId(payoutId)

    try {
      const res = await fetch(`/api/admin/payouts/${payoutId}/complete`, {
        method: 'PATCH',
      })

      if (!res.ok) {
        const body = await res.json()
        console.error('Failed to complete payout:', body.error)
        return
      }

      const updated = await res.json()

      setPayouts((prev) =>
        prev.map((p) =>
          p.id === payoutId
            ? {
                ...p,
                status: updated.status as 'pending' | 'processing' | 'completed',
                paid_at: updated.paid_at,
              }
            : p
        )
      )
    } catch (err) {
      console.error('Mark complete error:', err)
    } finally {
      setLoadingId(null)
    }
  }

  if (payouts.length === 0) {
    return (
      <div className="rounded-xl border border-border-default bg-bg-elevated p-8 text-center">
        <p className="text-text-muted">No payouts found</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border-default bg-bg-elevated">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border-default text-left text-xs font-semibold uppercase tracking-wider text-text-muted">
            <th className="px-5 py-3">Creator</th>
            <th className="px-5 py-3">Amount</th>
            <th className="px-5 py-3">Status</th>
            <th className="hidden px-5 py-3 sm:table-cell">Requested</th>
            <th className="hidden px-5 py-3 sm:table-cell">Paid</th>
            <th className="px-5 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-default">
          {payouts.map((payout) => (
            <tr
              key={payout.id}
              className="transition-colors hover:bg-bg-card"
            >
              <td className="px-5 py-4 text-sm font-medium text-text-primary">
                {payout.creator_name}
              </td>
              <td className="px-5 py-4 text-sm font-medium text-text-primary">
                {formatCurrency(payout.amount)}
              </td>
              <td className="px-5 py-4">
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyles[payout.status] ?? ''}`}
                >
                  {payout.status.charAt(0).toUpperCase() +
                    payout.status.slice(1)}
                </span>
              </td>
              <td className="hidden px-5 py-4 text-sm text-text-muted sm:table-cell">
                {formatDate(payout.created_at)}
              </td>
              <td className="hidden px-5 py-4 text-sm text-text-muted sm:table-cell">
                {payout.paid_at ? formatDate(payout.paid_at) : '\u2014'}
              </td>
              <td className="px-5 py-4 text-right">
                {payout.status !== 'completed' ? (
                  <button
                    onClick={() => handleMarkComplete(payout.id)}
                    disabled={loadingId === payout.id}
                    className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
                  >
                    {loadingId === payout.id
                      ? 'Completing...'
                      : 'Mark Complete'}
                  </button>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
