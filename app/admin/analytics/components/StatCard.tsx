'use client'

import { ReactNode } from 'react'

interface StatCardProps {
  label: string
  value: string
  icon: ReactNode
  iconBg: string
  iconColor: string
  trend?: {
    value: number
    isPositive: boolean
  }
}

export function StatCard({
  label,
  value,
  icon,
  iconBg,
  iconColor,
  trend,
}: StatCardProps) {
  return (
    <div className="rounded-xl border border-border-default bg-bg-elevated p-5">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconBg}`}
        >
          <span className={iconColor}>{icon}</span>
        </div>
        <div className="flex-1">
          <p className="text-sm text-text-muted">{label}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold text-text-primary">{value}</p>
            {trend && (
              <span
                className={`text-sm font-medium ${
                  trend.isPositive ? 'text-success' : 'text-error'
                }`}
              >
                {trend.isPositive ? '+' : ''}
                {trend.value.toFixed(1)}%
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
