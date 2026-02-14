'use client'

import { useState } from 'react'
import type { AnalyticsData, TimeRange } from '../types'
import { exportToCSV } from '../utils/exportHelpers'

interface ExportButtonProps {
  data: AnalyticsData
  timeRange: TimeRange
}

export function ExportButton({ data, timeRange }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const timestamp = new Date().toISOString().split('T')[0]
      const filename = `featune-analytics-${timeRange}-${timestamp}`
      exportToCSV(data, filename)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      className="flex items-center gap-2 rounded-lg border border-border-default bg-bg-elevated px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-bg-card disabled:cursor-not-allowed disabled:opacity-50"
    >
      <DownloadIcon className="h-4 w-4" />
      {isExporting ? 'Exporting...' : 'Export CSV'}
    </button>
  )
}

function DownloadIcon({ className }: { className?: string }) {
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
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}
