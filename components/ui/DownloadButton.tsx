'use client'

import { useState } from 'react'

function SpinnerIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="animate-spin">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="28" strokeDashoffset="10" />
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path
        d="M14 10V12.6667C14 13.0203 13.8595 13.3594 13.6095 13.6095C13.3594 13.8595 13.0203 14 12.6667 14H3.33333C2.97971 14 2.64057 13.8595 2.39052 13.6095C2.14048 13.3594 2 13.0203 2 12.6667V10"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4.66669 6.66669L8.00002 10L11.3334 6.66669"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8 10V2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function DownloadButton({
  href,
  label,
  ariaLabel,
  title,
}: {
  href: string
  label: string
  ariaLabel: string
  title: string
}) {
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    setLoading(true)
    try {
      const res = await fetch(href)
      if (!res.ok) throw new Error('Download failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const disposition = res.headers.get('content-disposition')
      const match = disposition?.match(/filename="?(.+?)"?$/i)
      a.download = match?.[1] ?? label.toLowerCase()
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      window.location.href = href
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="flex h-8 items-center justify-center gap-1 rounded-lg border border-border-default px-2 text-xs font-medium text-text-secondary transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
      aria-label={ariaLabel}
      title={title}
    >
      {loading ? <SpinnerIcon /> : <DownloadIcon />}
      <span className="hidden sm:inline">{label}</span>
    </button>
  )
}
