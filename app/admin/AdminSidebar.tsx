'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const navItems = [
  {
    label: 'Overview',
    href: '/admin',
    icon: ChartIcon,
  },
  {
    label: 'Submissions',
    href: '/admin/submissions',
    icon: InboxIcon,
  },
  {
    label: 'Tracks',
    href: '/admin/tracks',
    icon: MusicIcon,
  },
  {
    label: 'Creators',
    href: '/admin/creators',
    icon: UsersIcon,
  },
  {
    label: 'Payouts',
    href: '/admin/payouts',
    icon: DollarIcon,
  },
  {
    label: 'Analytics',
    href: '/admin/analytics',
    icon: BarChartIcon,
  },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-border-default lg:bg-bg-primary">
        {/* Admin panel title */}
        <div className="border-b border-border-default px-5 py-6">
          <h2 className="text-lg font-bold text-text-primary">Admin Panel</h2>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const isActive =
              item.href === '/admin'
                ? pathname === '/admin'
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
        <nav className="flex items-center justify-around px-2 py-2">
          {navItems.map((item) => {
            const isActive =
              item.href === '/admin'
                ? pathname === '/admin'
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

      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b border-border-default bg-bg-primary px-4 py-3 lg:hidden">
        <h2 className="text-base font-bold text-text-primary">Admin Panel</h2>
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
              <h2 className="text-lg font-bold text-text-primary">
                Admin Panel
              </h2>
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
                  item.href === '/admin'
                    ? pathname === '/admin'
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

/* --- Icon Components --- */

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

function InboxIcon({ className }: { className?: string }) {
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
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
      <path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" />
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

function BarChartIcon({ className }: { className?: string }) {
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
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
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
