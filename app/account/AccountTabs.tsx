'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { label: 'Library', href: '/account/library' },
  { label: 'Orders', href: '/account/purchases' },
  { label: 'Settings', href: '/account/settings' },
]

export default function AccountTabs() {
  const pathname = usePathname()

  return (
    <nav className="flex gap-1 border-b border-border-default">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`relative px-4 py-3 text-sm font-medium transition-colors ${
              isActive
                ? 'text-accent'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            {tab.label}
            {isActive && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
            )}
          </Link>
        )
      })}
    </nav>
  )
}
