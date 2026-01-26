import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Browse Tracks - FEATUNE',
  description:
    'Search and browse premium vocal toplines. Filter by genre, mood, BPM, and more.',
}

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
