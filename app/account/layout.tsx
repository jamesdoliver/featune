import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AccountTabs from './AccountTabs'

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <AccountTabs />
      <div className="mt-6">{children}</div>
    </div>
  )
}
