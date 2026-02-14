import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function UploadLayout({
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

  // Only approved creators can upload
  const { data: creator } = await supabase
    .from('creators')
    .select('status')
    .eq('user_id', user.id)
    .single()

  if (!creator || creator.status !== 'approved') {
    redirect('/dashboard')
  }

  return <>{children}</>
}
