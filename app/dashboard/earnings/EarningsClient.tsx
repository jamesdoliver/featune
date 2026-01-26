'use client'

import { useState } from 'react'
import type { Payout } from '@/lib/types/database'

interface EarningsData {
  totalEarnings: number
  completedPayouts: number
  availableBalance: number
  pendingPayoutsTotal: number
  requestableBalance: number
  payouts: Payout[]
}

interface EarningsClientProps {
  initialData: EarningsData
}

type RequestState = 'idle' | 'loading' | 'success' | 'error'

export default function EarningsClient({ initialData }: EarningsClientProps) {
  const [data, setData] = useState<EarningsData>(initialData)
  const [requestState, setRequestState] = useState<RequestState>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const canRequestPayout = data.requestableBalance >= 50

  async function handleRequestPayout() {
    setRequestState('loading')
    setErrorMessage(null)

    try {
      const response = await fetch('/api/creators/me/payout', {
        method: 'POST',
      })

      if (!response.ok) {
        const body = await response.json()
        throw new Error(body.error || 'Failed to request payout')
      }

      setRequestState('success')

      // Refresh earnings data
      const earningsResponse = await fetch('/api/creators/me/earnings')
      if (earningsResponse.ok) {
        const freshData = await earningsResponse.json()
        setData(freshData)
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Something went wrong'
      )
      setRequestState('error')
    }
  }

  function formatCurrency(amount: number): string {
    return `$${amount.toFixed(2)}`
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const statusBadgeClass: Record<Payout['status'], string> = {
    pending: 'bg-warning/20 text-warning',
    processing: 'bg-accent/20 text-accent',
    completed: 'bg-success/20 text-success',
  }

  const statusLabel: Record<Payout['status'], string> = {
    pending: 'Pending',
    processing: 'Processing',
    completed: 'Completed',
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-8 text-2xl font-bold tracking-tight text-text-primary">
        Earnings & Payouts
      </h1>

      {/* Balance Card */}
      <div className="rounded-xl border border-border-default bg-bg-elevated p-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          {/* Balance Info */}
          <div>
            <p className="text-sm font-medium text-text-muted">
              Available Balance
            </p>
            <p className="mt-1 text-4xl font-bold text-accent">
              {formatCurrency(data.requestableBalance)}
            </p>
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-text-secondary">
              <span>
                Total earned:{' '}
                <span className="font-medium text-text-primary">
                  {formatCurrency(data.totalEarnings)}
                </span>
              </span>
              <span>
                Paid out:{' '}
                <span className="font-medium text-text-primary">
                  {formatCurrency(data.completedPayouts)}
                </span>
              </span>
              {data.pendingPayoutsTotal > 0 && (
                <span>
                  Pending:{' '}
                  <span className="font-medium text-warning">
                    {formatCurrency(data.pendingPayoutsTotal)}
                  </span>
                </span>
              )}
            </div>
          </div>

          {/* Payout Action */}
          <div className="flex flex-col items-start sm:items-end">
            <div className="relative">
              <button
                onClick={handleRequestPayout}
                disabled={!canRequestPayout || requestState === 'loading'}
                className="rounded-lg bg-accent px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                {requestState === 'loading'
                  ? 'Requesting...'
                  : 'Request Payout'}
              </button>

              {/* Tooltip for disabled state */}
              {!canRequestPayout && requestState !== 'loading' && (
                <p className="mt-2 text-xs text-text-muted">
                  Minimum payout amount is $50.00
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Success message */}
        {requestState === 'success' && (
          <div className="mt-4 rounded-lg bg-success/10 px-4 py-3 text-sm text-success">
            Payout request submitted successfully. You will be notified once it
            is processed.
          </div>
        )}

        {/* Error message */}
        {requestState === 'error' && errorMessage && (
          <div className="mt-4 rounded-lg bg-error/10 px-4 py-3 text-sm text-error">
            {errorMessage}
          </div>
        )}
      </div>

      {/* Payout History */}
      <div className="mt-10">
        <h2 className="mb-4 text-lg font-semibold text-text-primary">
          Payout History
        </h2>

        {data.payouts.length === 0 ? (
          <div className="rounded-xl border border-border-default bg-bg-elevated p-8 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-bg-card">
              <WalletIcon className="h-6 w-6 text-text-muted" />
            </div>
            <p className="text-sm text-text-muted">
              No payouts yet. Once you request a payout, it will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border-default bg-bg-elevated">
            {/* Desktop table */}
            <div className="hidden sm:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border-default text-left text-xs font-semibold uppercase tracking-wider text-text-muted">
                    <th className="px-5 py-3">Amount</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Requested</th>
                    <th className="px-5 py-3">Paid</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-default">
                  {data.payouts.map((payout) => (
                    <tr
                      key={payout.id}
                      className="transition-colors hover:bg-bg-card"
                    >
                      <td className="px-5 py-4 text-sm font-medium text-text-primary">
                        {formatCurrency(payout.amount)}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadgeClass[payout.status]}`}
                        >
                          {statusLabel[payout.status]}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-text-secondary">
                        {formatDate(payout.created_at)}
                      </td>
                      <td className="px-5 py-4 text-sm text-text-secondary">
                        {payout.paid_at
                          ? formatDate(payout.paid_at)
                          : '\u2014'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile card list */}
            <div className="divide-y divide-border-default sm:hidden">
              {data.payouts.map((payout) => (
                <div key={payout.id} className="px-5 py-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-text-primary">
                      {formatCurrency(payout.amount)}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadgeClass[payout.status]}`}
                    >
                      {statusLabel[payout.status]}
                    </span>
                  </div>
                  <div className="mt-2 flex gap-4 text-xs text-text-muted">
                    <span>Requested: {formatDate(payout.created_at)}</span>
                    {payout.paid_at && (
                      <span>Paid: {formatDate(payout.paid_at)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Icon Component ─── */

function WalletIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M2 10h20" />
      <circle cx="17" cy="14" r="1" />
    </svg>
  )
}
