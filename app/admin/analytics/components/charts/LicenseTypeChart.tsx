'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import type { LicenseDataPoint } from '../../types'
import { LICENSE_COLORS, chartTooltipStyle } from '../../utils/chartTheme'

interface LicenseTypeChartProps {
  data: LicenseDataPoint[]
  onLicenseClick?: (licenseType: string) => void
  selectedLicense?: string | null
}

export function LicenseTypeChart({
  data,
  onLicenseClick,
  selectedLicense,
}: LicenseTypeChartProps) {
  if (data.length === 0 || data.every((d) => d.count === 0)) {
    return (
      <div className="flex h-[300px] items-center justify-center rounded-xl border border-border-default bg-bg-elevated">
        <p className="text-text-muted">No license data available</p>
      </div>
    )
  }

  const totalSales = data.reduce((sum, d) => sum + d.count, 0)

  const handleClick = (entry: LicenseDataPoint) => {
    if (onLicenseClick) {
      onLicenseClick(entry.type)
    }
  }

  const formatLabel = (type: string) => {
    return type === 'non_exclusive' ? 'Non-Exclusive' : 'Exclusive'
  }

  return (
    <div className="rounded-xl border border-border-default bg-bg-elevated p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-text-primary">
          License Types
        </h3>
        {selectedLicense && (
          <button
            onClick={() => onLicenseClick?.('')}
            className="text-sm text-accent hover:text-accent-hover"
          >
            Clear filter
          </button>
        )}
      </div>
      <div className="relative">
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              dataKey="count"
              nameKey="type"
              cursor="pointer"
              onClick={(_, index) => handleClick(data[index])}
            >
              {data.map((entry) => (
                <Cell
                  key={entry.type}
                  fill={
                    LICENSE_COLORS[entry.type as keyof typeof LICENSE_COLORS] ||
                    LICENSE_COLORS.non_exclusive
                  }
                  opacity={
                    selectedLicense && selectedLicense !== entry.type ? 0.3 : 1
                  }
                />
              ))}
            </Pie>
            <Tooltip
              {...chartTooltipStyle}
              formatter={(value, name) => {
                const numValue = typeof value === 'number' ? value : 0
                const strName = typeof name === 'string' ? name : ''
                return [
                  `${numValue} (${((numValue / totalSales) * 100).toFixed(1)}%)`,
                  formatLabel(strName),
                ]
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
          <p className="text-2xl font-bold text-text-primary">{totalSales}</p>
          <p className="text-sm text-text-muted">Total</p>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-center gap-6">
        {data.map((entry) => (
          <button
            key={entry.type}
            onClick={() => handleClick(entry)}
            className={`flex items-center gap-2 transition-opacity ${
              selectedLicense && selectedLicense !== entry.type
                ? 'opacity-40'
                : ''
            }`}
          >
            <div
              className="h-3 w-3 rounded-full"
              style={{
                backgroundColor:
                  LICENSE_COLORS[entry.type as keyof typeof LICENSE_COLORS] ||
                  LICENSE_COLORS.non_exclusive,
              }}
            />
            <span className="text-sm text-text-secondary">
              {formatLabel(entry.type)} ({entry.percentage.toFixed(0)}%)
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
