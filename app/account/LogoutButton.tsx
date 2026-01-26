'use client'

import { signOut } from '@/app/(auth)/actions'

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut()}
      className="rounded-lg border border-border-default px-5 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:border-border-hover hover:text-text-primary"
    >
      Log Out
    </button>
  )
}
