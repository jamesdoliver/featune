export const CHART_COLORS = {
  primary: '#FF6B00',
  primaryHover: '#FF8533',
  secondary: '#A0A0A0',
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  grid: '#2A2A2A',
  background: '#222222',
  text: '#FFFFFF',
  textMuted: '#666666',
}

export const GENRE_COLORS = [
  '#FF6B00', // accent
  '#22C55E', // success
  '#F59E0B', // warning
  '#3B82F6', // blue
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#14B8A6', // teal
  '#EF4444', // error
  '#6366F1', // indigo
  '#84CC16', // lime
]

export const LICENSE_COLORS = {
  non_exclusive: '#FF6B00',
  exclusive: '#22C55E',
}

export const CUSTOMER_COLORS = {
  new: '#FF6B00',
  returning: '#3B82F6',
}

export const chartAxisStyle = {
  tick: { fill: CHART_COLORS.secondary, fontSize: 12 },
  axisLine: { stroke: CHART_COLORS.grid },
}

export const chartTooltipStyle = {
  contentStyle: {
    backgroundColor: CHART_COLORS.background,
    border: `1px solid ${CHART_COLORS.grid}`,
    borderRadius: '8px',
    color: CHART_COLORS.text,
  },
  labelStyle: { color: CHART_COLORS.text },
}

export const chartGridStyle = {
  strokeDasharray: '3 3',
  stroke: CHART_COLORS.grid,
}
