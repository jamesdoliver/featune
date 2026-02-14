'use client'

import type { TopCreator } from '../types'

interface TopCreatorsTableProps {
  creators: TopCreator[]
}

export function TopCreatorsTable({ creators }: TopCreatorsTableProps) {
  if (creators.length === 0) {
    return (
      <div className="rounded-xl border border-border-default bg-bg-elevated p-8 text-center">
        <p className="text-text-muted">
          No creator earnings data available yet.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border-default bg-bg-elevated">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border-default text-left text-xs font-semibold uppercase tracking-wider text-text-muted">
            <th className="px-5 py-3">#</th>
            <th className="px-5 py-3">Creator</th>
            <th className="hidden px-5 py-3 text-right sm:table-cell">
              Tracks
            </th>
            <th className="px-5 py-3 text-right">Sales</th>
            <th className="px-5 py-3 text-right">Earnings</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-default">
          {creators.map((creator, index) => (
            <tr
              key={creator.id}
              className="transition-colors hover:bg-bg-card"
            >
              <td className="px-5 py-4 text-sm text-text-muted">
                {index + 1}
              </td>
              <td className="px-5 py-4 text-sm font-medium text-text-primary">
                {creator.name}
              </td>
              <td className="hidden px-5 py-4 text-right text-sm text-text-secondary sm:table-cell">
                {creator.tracks}
              </td>
              <td className="px-5 py-4 text-right text-sm text-text-primary">
                {creator.sales.toLocaleString()}
              </td>
              <td className="px-5 py-4 text-right text-sm text-text-primary">
                ${creator.earnings.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
