'use client'

import type { SaleItem } from './page'

interface SalesListProps {
  sales: SaleItem[]
}

export default function SalesList({ sales }: SalesListProps) {
  const totalSales = sales.length
  const totalEarnings = sales.reduce(
    (sum, sale) => sum + (sale.creator_earnings ?? 0),
    0
  )

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-8 text-2xl font-bold tracking-tight text-text-primary">
        Sales History
      </h1>

      {/* Summary stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border-default bg-bg-elevated p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
              <ShoppingBagIcon className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-sm text-text-muted">Total Sales</p>
              <p className="text-2xl font-bold text-text-primary">
                {totalSales.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border-default bg-bg-elevated p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
              <DollarCircleIcon className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-sm text-text-muted">Total Earnings</p>
              <p className="text-2xl font-bold text-success">
                ${totalEarnings.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sales list */}
      <div className="mt-10">
        {sales.length === 0 ? (
          <div className="rounded-xl border border-border-default bg-bg-elevated p-8 text-center">
            <ShoppingBagIcon className="mx-auto mb-3 h-10 w-10 text-text-muted" />
            <p className="text-text-muted">
              No sales yet. Once your tracks are purchased, they will appear
              here.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-hidden rounded-xl border border-border-default bg-bg-elevated sm:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border-default text-left text-xs font-semibold uppercase tracking-wider text-text-muted">
                    <th className="px-5 py-3">Track</th>
                    <th className="px-5 py-3">License</th>
                    <th className="px-5 py-3 text-right">Sale Price</th>
                    <th className="px-5 py-3 text-right">Your Earnings</th>
                    <th className="px-5 py-3 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-default">
                  {sales.map((sale) => (
                    <tr
                      key={sale.id}
                      className="transition-colors hover:bg-bg-card"
                    >
                      <td className="px-5 py-4 text-sm font-medium text-text-primary">
                        {sale.track_title}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            sale.license_type === 'exclusive'
                              ? 'bg-accent/20 text-accent'
                              : 'bg-bg-card text-text-secondary'
                          }`}
                        >
                          {sale.license_type === 'exclusive'
                            ? 'Exclusive'
                            : 'Non-Exclusive'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right text-sm text-text-secondary">
                        ${sale.price_at_purchase.toFixed(2)}
                      </td>
                      <td className="px-5 py-4 text-right text-sm font-medium text-success">
                        ${sale.creator_earnings.toFixed(2)}
                      </td>
                      <td className="px-5 py-4 text-right text-sm text-text-muted">
                        {new Date(sale.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="flex flex-col gap-3 sm:hidden">
              {sales.map((sale) => (
                <div
                  key={sale.id}
                  className="rounded-xl border border-border-default bg-bg-elevated p-4"
                >
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <h3 className="text-sm font-medium text-text-primary">
                      {sale.track_title}
                    </h3>
                    <span
                      className={`flex-shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        sale.license_type === 'exclusive'
                          ? 'bg-accent/20 text-accent'
                          : 'bg-bg-card text-text-secondary'
                      }`}
                    >
                      {sale.license_type === 'exclusive'
                        ? 'Exclusive'
                        : 'Non-Exclusive'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <p className="text-text-muted">Sale Price</p>
                      <p className="font-medium text-text-secondary">
                        ${sale.price_at_purchase.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-text-muted">Your Earnings</p>
                      <p className="font-medium text-success">
                        ${sale.creator_earnings.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <p className="mt-2 text-xs text-text-muted">
                    {new Date(sale.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/* ─── Icon Components ─── */

function ShoppingBagIcon({ className }: { className?: string }) {
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
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 01-8 0" />
    </svg>
  )
}

function DollarCircleIcon({ className }: { className?: string }) {
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
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="6" x2="12" y2="18" />
      <path d="M15.5 9.5c0-1.38-1.57-2.5-3.5-2.5S8.5 8.12 8.5 9.5 10.07 12 12 12s3.5 1.12 3.5 2.5-1.57 2.5-3.5 2.5-3.5-1.12-3.5-2.5" />
    </svg>
  )
}
