'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import type { Creator } from '@/lib/types/database'

interface DashboardSidebarProps {
  creator: Creator
}

const navItems = [
  {
    label: 'Overview',
    href: '/dashboard',
    icon: ChartIcon,
  },
  {
    label: 'Upload Track',
    href: '/dashboard/upload',
    icon: UploadIcon,
  },
  {
    label: 'My Tracks',
    href: '/dashboard/tracks',
    icon: MusicIcon,
  },
  {
    label: 'Sales',
    href: '/dashboard/sales',
    icon: DollarIcon,
  },
  {
    label: 'Earnings',
    href: '/dashboard/earnings',
    icon: WalletIcon,
  },
]

export default function DashboardSidebar({ creator }: DashboardSidebarProps) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const statusColor =
    creator.status === 'approved'
      ? 'bg-success/20 text-success'
      : creator.status === 'pending'
        ? 'bg-warning/20 text-warning'
        : 'bg-error/20 text-error'

  const statusLabel =
    creator.status === 'approved'
      ? 'Approved'
      : creator.status === 'pending'
        ? 'Pending'
        : 'Rejected'

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-border-default lg:bg-bg-primary">
        {/* Creator info */}
        <div className="border-b border-border-default px-5 py-6">
          <h2 className="truncate text-lg font-bold text-text-primary">
            {creator.display_name}
          </h2>
          <span
            className={`mt-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColor}`}
          >
            {statusLabel}
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const isActive =
              item.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname.startsWith(item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-accent/10 text-accent'
                    : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary'
                }`}
              >
                <item.icon
                  className={`h-5 w-5 flex-shrink-0 ${
                    isActive ? 'text-accent' : 'text-text-muted'
                  }`}
                />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Mobile bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border-default bg-bg-primary lg:hidden">
        {/* Hamburger row when menu is closed, show compact nav */}
        <nav className="flex items-center justify-around px-2 py-2">
          {navItems.map((item) => {
            const isActive =
              item.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname.startsWith(item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${
                  isActive
                    ? 'text-accent'
                    : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                <item.icon
                  className={`h-5 w-5 ${
                    isActive ? 'text-accent' : 'text-text-muted'
                  }`}
                />
                <span className="hidden sm:block">{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Mobile creator info + hamburger (top bar area for mobile) */}
      <div className="flex items-center justify-between border-b border-border-default bg-bg-primary px-4 py-3 lg:hidden">
        <div className="flex items-center gap-3">
          <h2 className="truncate text-base font-bold text-text-primary">
            {creator.display_name}
          </h2>
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${statusColor}`}
          >
            {statusLabel}
          </span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text-primary lg:hidden"
          aria-label="Toggle navigation menu"
        >
          <HamburgerIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile expanded menu (overlay) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Menu panel */}
          <div className="absolute right-0 top-0 h-full w-72 border-l border-border-default bg-bg-primary shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border-default px-5 py-4">
              <div>
                <h2 className="truncate text-lg font-bold text-text-primary">
                  {creator.display_name}
                </h2>
                <span
                  className={`mt-1 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColor}`}
                >
                  {statusLabel}
                </span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text-primary"
                aria-label="Close navigation menu"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>
            {/* Nav links */}
            <nav className="space-y-1 px-3 py-4">
              {navItems.map((item) => {
                const isActive =
                  item.href === '/dashboard'
                    ? pathname === '/dashboard'
                    : pathname.startsWith(item.href)

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-accent/10 text-accent'
                        : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary'
                    }`}
                  >
                    <item.icon
                      className={`h-5 w-5 flex-shrink-0 ${
                        isActive ? 'text-accent' : 'text-text-muted'
                      }`}
                    />
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>
      )}
    </>
  )
}

/* ─── Icon Components ─── */

function ChartIcon({ className }: { className?: string }) {
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
      <path d="M3 3v18h18" />
      <path d="M7 16l4-4 4 4 5-6" />
    </svg>
  )
}

function UploadIcon({ className }: { className?: string }) {
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
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
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
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M2 10h20" />
      <circle cx="17" cy="14" r="1" />
    </svg>
  )
}

function HamburgerIcon({ className }: { className?: string }) {
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
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  )
}

function CloseIcon({ className }: { className?: string }) {
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
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}
