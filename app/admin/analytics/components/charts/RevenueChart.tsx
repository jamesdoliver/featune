'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  ComposedChart,
} from 'recharts'
import type { RevenueDataPoint } from '../../types'
import {
  CHART_COLORS,
  chartAxisStyle,
  chartTooltipStyle,
  chartGridStyle,
} from '../../utils/chartTheme'

interface RevenueChartProps {
  data: RevenueDataPoint[]
}

export function RevenueChart({ data }: RevenueChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center rounded-xl border border-border-default bg-bg-elevated">
        <p className="text-text-muted">No revenue data available</p>
      </div>
    )
  }

  const formatDate = (dateStr: unknown) => {
    if (typeof dateStr !== 'string') return String(dateStr)
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const formatCurrency = (value: number | undefined) => `$${(value ?? 0).toLocaleString()}`

  return (
    <div className="rounded-xl border border-border-default bg-bg-elevated p-5">
      <h3 className="mb-4 text-lg font-semibold text-text-primary">
        Revenue Trend
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={data}>
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.3} />
              <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid {...chartGridStyle} vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            {...chartAxisStyle}
            tickLine={false}
          />
          <YAxis
            yAxisId="revenue"
            tickFormatter={formatCurrency}
            {...chartAxisStyle}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            yAxisId="orders"
            orientation="right"
            {...chartAxisStyle}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            {...chartTooltipStyle}
            formatter={(value, name) => {
              const numValue = typeof value === 'number' ? value : 0
              if (name === 'revenue') return [formatCurrency(numValue), 'Revenue']
              return [numValue, 'Orders']
            }}
            labelFormatter={formatDate}
          />
          <Area
            yAxisId="revenue"
            type="monotone"
            dataKey="revenue"
            stroke={CHART_COLORS.primary}
            fill="url(#revenueGradient)"
            strokeWidth={2}
          />
          <Line
            yAxisId="orders"
            type="monotone"
            dataKey="orders"
            stroke={CHART_COLORS.secondary}
            strokeWidth={2}
            dot={false}
            strokeDasharray="5 5"
          />
        </ComposedChart>
      </ResponsiveContainer>
      <div className="mt-3 flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: CHART_COLORS.primary }}
          />
          <span className="text-text-secondary">Revenue</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="h-0.5 w-3"
            style={{
              backgroundColor: CHART_COLORS.secondary,
              borderStyle: 'dashed',
            }}
          />
          <span className="text-text-secondary">Orders</span>
        </div>
      </div>
    </div>
  )
}
