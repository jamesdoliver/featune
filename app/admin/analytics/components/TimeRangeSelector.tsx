'use client'

import type { TimeRange } from '../types'

interface TimeRangeSelectorProps {
  value: TimeRange
  onChange: (value: TimeRange) => void
}

const timeRanges: { value: TimeRange; label: string }[] = [
  { value: '7d', label: '7d' },
  { value: '30d', label: '30d' },
  { value: '90d', label: '90d' },
  { value: '1y', label: '1y' },
  { value: 'all', label: 'All' },
]

export function TimeRangeSelector({ value, onChange }: TimeRangeSelectorProps) {
  return (
    <div className="flex items-center gap-1 rounded-lg bg-bg-card p-1">
      {timeRanges.map((range) => (
        <button
          key={range.value}
          onClick={() => onChange(range.value)}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            value === range.value
              ? 'bg-accent text-white'
              : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary'
          }`}
        >
          {range.label}
        </button>
      ))}
    </div>
  )
}
