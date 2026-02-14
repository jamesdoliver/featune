'use client'

import type { TopTrack } from '../types'

interface TopTracksTableProps {
  tracks: TopTrack[]
}

export function TopTracksTable({ tracks }: TopTracksTableProps) {
  if (tracks.length === 0) {
    return (
      <div className="rounded-xl border border-border-default bg-bg-elevated p-8 text-center">
        <p className="text-text-muted">No sales data available yet.</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border-default bg-bg-elevated">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border-default text-left text-xs font-semibold uppercase tracking-wider text-text-muted">
            <th className="px-5 py-3">#</th>
            <th className="px-5 py-3">Track</th>
            <th className="px-5 py-3">Creator</th>
            <th className="px-5 py-3 text-right">Sales</th>
            <th className="hidden px-5 py-3 text-right sm:table-cell">
              Revenue
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-default">
          {tracks.map((track, index) => (
            <tr
              key={track.id}
              className="transition-colors hover:bg-bg-card"
            >
              <td className="px-5 py-4 text-sm text-text-muted">
                {index + 1}
              </td>
              <td className="px-5 py-4 text-sm font-medium text-text-primary">
                {track.title}
              </td>
              <td className="px-5 py-4 text-sm text-text-secondary">
                {track.creator}
              </td>
              <td className="px-5 py-4 text-right text-sm text-text-primary">
                {track.sales.toLocaleString()}
              </td>
              <td className="hidden px-5 py-4 text-right text-sm text-text-primary sm:table-cell">
                ${track.revenue.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
