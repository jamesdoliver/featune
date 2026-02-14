'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import type { GenreDataPoint } from '../../types'
import {
  GENRE_COLORS,
  chartAxisStyle,
  chartTooltipStyle,
  chartGridStyle,
} from '../../utils/chartTheme'

interface GenreChartProps {
  data: GenreDataPoint[]
  onGenreClick?: (genre: string) => void
  selectedGenre?: string | null
}

export function GenreChart({ data, onGenreClick, selectedGenre }: GenreChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center rounded-xl border border-border-default bg-bg-elevated">
        <p className="text-text-muted">No genre data available</p>
      </div>
    )
  }

  const formatCurrency = (value: number | undefined) => `$${(value ?? 0).toLocaleString()}`

  const handleClick = (entry: { genre?: string } | null) => {
    if (onGenreClick && entry?.genre) {
      onGenreClick(entry.genre)
    }
  }

  return (
    <div className="rounded-xl border border-border-default bg-bg-elevated p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-text-primary">
          Sales by Genre
        </h3>
        {selectedGenre && (
          <button
            onClick={() => onGenreClick?.('')}
            className="text-sm text-accent hover:text-accent-hover"
          >
            Clear filter
          </button>
        )}
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid {...chartGridStyle} horizontal={false} />
          <XAxis
            type="number"
            tickFormatter={formatCurrency}
            {...chartAxisStyle}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="genre"
            {...chartAxisStyle}
            tickLine={false}
            axisLine={false}
            width={80}
          />
          <Tooltip
            {...chartTooltipStyle}
            formatter={(value, name) => {
              const numValue = typeof value === 'number' ? value : 0
              if (name === 'revenue') return [formatCurrency(numValue), 'Revenue']
              return [numValue, 'Sales']
            }}
          />
          <Bar
            dataKey="revenue"
            radius={[0, 4, 4, 0]}
            cursor="pointer"
            onClick={(barData) => handleClick(barData as { genre?: string })}
          >
            {data.map((entry, index) => (
              <Cell
                key={entry.genre}
                fill={GENRE_COLORS[index % GENRE_COLORS.length]}
                opacity={
                  selectedGenre && selectedGenre !== entry.genre ? 0.3 : 1
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
