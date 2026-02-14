'use client'

import { useState, useEffect, useCallback } from 'react'
import type { AnalyticsData, TimeRange, FilterState } from './types'
import { StatCard } from './components/StatCard'
import { TimeRangeSelector } from './components/TimeRangeSelector'
import { RevenueChart } from './components/charts/RevenueChart'
import { GenreChart } from './components/charts/GenreChart'
import { LicenseTypeChart } from './components/charts/LicenseTypeChart'
import { CustomerChart } from './components/charts/CustomerChart'
import { TopTracksTable } from './components/TopTracksTable'
import { TopCreatorsTable } from './components/TopCreatorsTable'
import { ExportButton } from './components/ExportButton'

export function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<FilterState>({
    timeRange: '30d',
    genre: null,
    licenseType: null,
  })

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    const params = new URLSearchParams()
    params.set('range', filters.timeRange)
    if (filters.genre) params.set('genre', filters.genre)
    if (filters.licenseType) params.set('licenseType', filters.licenseType)

    try {
      const response = await fetch(`/api/admin/analytics?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to fetch analytics data')
      }
      const result = await response.json()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleTimeRangeChange = (timeRange: TimeRange) => {
    setFilters((prev) => ({ ...prev, timeRange }))
  }

  const handleGenreClick = (genre: string) => {
    setFilters((prev) => ({
      ...prev,
      genre: genre === prev.genre || genre === '' ? null : genre,
    }))
  }

  const handleLicenseClick = (licenseType: string) => {
    setFilters((prev) => ({
      ...prev,
      licenseType:
        licenseType === prev.licenseType || licenseType === ''
          ? null
          : licenseType,
    }))
  }

  const clearFilters = () => {
    setFilters((prev) => ({
      ...prev,
      genre: null,
      licenseType: null,
    }))
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl">
        <div className="rounded-xl border border-error/30 bg-error/10 p-6 text-center">
          <p className="text-error">{error}</p>
          <button
            onClick={fetchData}
            className="mt-4 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  const hasActiveFilters = filters.genre || filters.licenseType

  return (
    <div className="mx-auto max-w-6xl">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            Analytics
          </h1>
          {hasActiveFilters && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-sm text-text-muted">Filtered by:</span>
              {filters.genre && (
                <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                  {filters.genre}
                </span>
              )}
              {filters.licenseType && (
                <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                  {filters.licenseType === 'non_exclusive'
                    ? 'Non-Exclusive'
                    : 'Exclusive'}
                </span>
              )}
              <button
                onClick={clearFilters}
                className="text-xs text-text-muted hover:text-text-primary"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <TimeRangeSelector
            value={filters.timeRange}
            onChange={handleTimeRangeChange}
          />
          {data && <ExportButton data={data} timeRange={filters.timeRange} />}
        </div>
      </div>

      {isLoading ? (
        <LoadingSkeleton />
      ) : data ? (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Total Revenue"
              value={`$${data.summary.totalRevenue.toFixed(2)}`}
              icon={<DollarIcon className="h-5 w-5" />}
              iconBg="bg-success/10"
              iconColor="text-success"
              trend={{
                value: data.summary.growthRate,
                isPositive: data.summary.growthRate >= 0,
              }}
            />
            <StatCard
              label="Total Sales"
              value={data.summary.totalSales.toLocaleString()}
              icon={<CartIcon className="h-5 w-5" />}
              iconBg="bg-accent/10"
              iconColor="text-accent"
            />
            <StatCard
              label="Avg Order Value"
              value={`$${data.summary.avgOrderValue.toFixed(2)}`}
              icon={<TrendIcon className="h-5 w-5" />}
              iconBg="bg-warning/10"
              iconColor="text-warning"
            />
            <StatCard
              label="Pending Payouts"
              value={`$${data.summary.pendingPayouts.toFixed(2)}`}
              icon={<WalletIcon className="h-5 w-5" />}
              iconBg="bg-error/10"
              iconColor="text-error"
            />
          </div>

          {/* Secondary Stats */}
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              label="Total Tracks"
              value={data.summary.totalTracks.toLocaleString()}
              icon={<MusicIcon className="h-5 w-5" />}
              iconBg="bg-accent/10"
              iconColor="text-accent"
            />
            <StatCard
              label="Active Creators"
              value={data.summary.activeCreators.toLocaleString()}
              icon={<UsersIcon className="h-5 w-5" />}
              iconBg="bg-success/10"
              iconColor="text-success"
            />
            <StatCard
              label="Exclusive Sales"
              value={`${data.summary.exclusivePercentage.toFixed(1)}%`}
              icon={<StarIcon className="h-5 w-5" />}
              iconBg="bg-warning/10"
              iconColor="text-warning"
            />
          </div>

          {/* Charts - Row 1 */}
          <div className="mt-8">
            <RevenueChart data={data.revenue} />
          </div>

          {/* Charts - Row 2 */}
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <GenreChart
              data={data.genres}
              onGenreClick={handleGenreClick}
              selectedGenre={filters.genre}
            />
            <LicenseTypeChart
              data={data.licenses}
              onLicenseClick={handleLicenseClick}
              selectedLicense={filters.licenseType}
            />
          </div>

          {/* Charts - Row 3 */}
          <div className="mt-6">
            <CustomerChart data={data.customers} />
          </div>

          {/* Tables */}
          <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div>
              <h2 className="mb-4 text-lg font-semibold text-text-primary">
                Top Tracks by Sales
              </h2>
              <TopTracksTable tracks={data.topTracks} />
            </div>
            <div>
              <h2 className="mb-4 text-lg font-semibold text-text-primary">
                Top Creators by Earnings
              </h2>
              <TopCreatorsTable creators={data.topCreators} />
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Stats skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-24 rounded-xl border border-border-default bg-bg-elevated"
          />
        ))}
      </div>

      {/* Secondary stats skeleton */}
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="h-24 rounded-xl border border-border-default bg-bg-elevated"
          />
        ))}
      </div>

      {/* Chart skeletons */}
      <div className="mt-8 h-[360px] rounded-xl border border-border-default bg-bg-elevated" />
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="h-[360px] rounded-xl border border-border-default bg-bg-elevated" />
        <div className="h-[360px] rounded-xl border border-border-default bg-bg-elevated" />
      </div>
      <div className="mt-6 h-[360px] rounded-xl border border-border-default bg-bg-elevated" />

      {/* Table skeletons */}
      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="h-64 rounded-xl border border-border-default bg-bg-elevated" />
        <div className="h-64 rounded-xl border border-border-default bg-bg-elevated" />
      </div>
    </div>
  )
}

/* --- Icon Components --- */

function DollarIcon({ className }: { className?: string }) {
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
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
    </svg>
  )
}

function CartIcon({ className }: { className?: string }) {
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
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
    </svg>
  )
}

function MusicIcon({ className }: { className?: string }) {
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
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  )
}

function UsersIcon({ className }: { className?: string }) {
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
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  )
}

function TrendIcon({ className }: { className?: string }) {
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
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  )
}

function WalletIcon({ className }: { className?: string }) {
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
      <path d="M21 4H3a2 2 0 00-2 2v12a2 2 0 002 2h18a2 2 0 002-2V6a2 2 0 00-2-2z" />
      <path d="M1 10h22" />
    </svg>
  )
}

function StarIcon({ className }: { className?: string }) {
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
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}
