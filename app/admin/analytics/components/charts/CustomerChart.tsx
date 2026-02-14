'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import type { CustomerDataPoint } from '../../types'
import {
  CUSTOMER_COLORS,
  CHART_COLORS,
  chartAxisStyle,
  chartTooltipStyle,
  chartGridStyle,
} from '../../utils/chartTheme'

interface CustomerChartProps {
  data: CustomerDataPoint[]
}

export function CustomerChart({ data }: CustomerChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center rounded-xl border border-border-default bg-bg-elevated">
        <p className="text-text-muted">No customer data available</p>
      </div>
    )
  }

  const formatPeriod = (period: unknown) => {
    if (typeof period !== 'string') return String(period)
    if (period.includes('-') && period.length === 7) {
      const [year, month] = period.split('-')
      const date = new Date(parseInt(year), parseInt(month) - 1)
      return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    }
    const date = new Date(period)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="rounded-xl border border-border-default bg-bg-elevated p-5">
      <h3 className="mb-4 text-lg font-semibold text-text-primary">
        Customer Acquisition
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid {...chartGridStyle} vertical={false} />
          <XAxis
            dataKey="period"
            tickFormatter={formatPeriod}
            {...chartAxisStyle}
            tickLine={false}
          />
          <YAxis {...chartAxisStyle} tickLine={false} axisLine={false} />
          <Tooltip
            {...chartTooltipStyle}
            labelFormatter={formatPeriod}
            formatter={(value, name) => [
              value ?? 0,
              name === 'new' ? 'New Customers' : 'Returning Customers',
            ]}
          />
          <Legend
            iconType="circle"
            formatter={(value) =>
              value === 'new' ? 'New Customers' : 'Returning Customers'
            }
            wrapperStyle={{ color: CHART_COLORS.text }}
          />
          <Bar
            dataKey="new"
            stackId="a"
            fill={CUSTOMER_COLORS.new}
            radius={[0, 0, 0, 0]}
          />
          <Bar
            dataKey="returning"
            stackId="a"
            fill={CUSTOMER_COLORS.returning}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
