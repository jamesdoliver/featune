import type { AnalyticsData } from '../types'

export function exportToCSV(data: AnalyticsData, filename: string): void {
  const sections: string[] = []

  // Summary section
  sections.push('SUMMARY')
  sections.push('Metric,Value')
  sections.push(`Total Revenue,$${data.summary.totalRevenue.toFixed(2)}`)
  sections.push(`Total Sales,${data.summary.totalSales}`)
  sections.push(`Average Order Value,$${data.summary.avgOrderValue.toFixed(2)}`)
  sections.push(`Growth Rate (MoM),${data.summary.growthRate.toFixed(1)}%`)
  sections.push(`Total Tracks,${data.summary.totalTracks}`)
  sections.push(`Active Creators,${data.summary.activeCreators}`)
  sections.push(`Pending Payouts,$${data.summary.pendingPayouts.toFixed(2)}`)
  sections.push(`Exclusive %,${data.summary.exclusivePercentage.toFixed(1)}%`)
  sections.push('')

  // Revenue by date
  sections.push('REVENUE BY DATE')
  sections.push('Date,Revenue,Orders')
  for (const row of data.revenue) {
    sections.push(`${row.date},$${row.revenue.toFixed(2)},${row.orders}`)
  }
  sections.push('')

  // Genre breakdown
  sections.push('GENRE BREAKDOWN')
  sections.push('Genre,Sales,Revenue')
  for (const row of data.genres) {
    sections.push(`${row.genre},${row.count},$${row.revenue.toFixed(2)}`)
  }
  sections.push('')

  // License type breakdown
  sections.push('LICENSE TYPE BREAKDOWN')
  sections.push('Type,Count,Percentage')
  for (const row of data.licenses) {
    sections.push(`${row.type},${row.count},${row.percentage.toFixed(1)}%`)
  }
  sections.push('')

  // Customer acquisition
  sections.push('CUSTOMER ACQUISITION')
  sections.push('Period,New Customers,Returning Customers')
  for (const row of data.customers) {
    sections.push(`${row.period},${row.new},${row.returning}`)
  }
  sections.push('')

  // Top tracks
  sections.push('TOP TRACKS')
  sections.push('Title,Creator,Sales,Revenue')
  for (const row of data.topTracks) {
    sections.push(`"${row.title}","${row.creator}",${row.sales},$${row.revenue.toFixed(2)}`)
  }
  sections.push('')

  // Top creators
  sections.push('TOP CREATORS')
  sections.push('Name,Tracks,Sales,Earnings')
  for (const row of data.topCreators) {
    sections.push(`"${row.name}",${row.tracks},${row.sales},$${row.earnings.toFixed(2)}`)
  }

  const csvContent = sections.join('\n')
  downloadFile(csvContent, `${filename}.csv`, 'text/csv')
}

function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value)
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value)
}

export function formatPercentage(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
}
