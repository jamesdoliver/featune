export type TimeRange = '7d' | '30d' | '90d' | '1y' | 'all'

export interface AnalyticsSummary {
  totalRevenue: number
  totalSales: number
  avgOrderValue: number
  growthRate: number
  totalTracks: number
  activeCreators: number
  pendingPayouts: number
  exclusivePercentage: number
}

export interface RevenueDataPoint {
  date: string
  revenue: number
  orders: number
}

export interface GenreDataPoint {
  genre: string
  count: number
  revenue: number
}

export interface LicenseDataPoint {
  type: string
  count: number
  percentage: number
}

export interface CustomerDataPoint {
  period: string
  new: number
  returning: number
}

export interface TopTrack {
  id: string
  title: string
  creator: string
  sales: number
  revenue: number
}

export interface TopCreator {
  id: string
  name: string
  tracks: number
  sales: number
  earnings: number
}

export interface AnalyticsData {
  summary: AnalyticsSummary
  revenue: RevenueDataPoint[]
  genres: GenreDataPoint[]
  licenses: LicenseDataPoint[]
  customers: CustomerDataPoint[]
  topTracks: TopTrack[]
  topCreators: TopCreator[]
}

export interface FilterState {
  timeRange: TimeRange
  genre: string | null
  licenseType: string | null
}
