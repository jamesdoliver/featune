import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import OrderList from './OrderList'

export const metadata: Metadata = {
  title: 'Purchase History - FEATUNE',
  description: 'View your order history and download purchased tracks.',
}

export default async function PurchaseHistoryPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: orders, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items(
        *,
        tracks(id, title, artwork_url, acapella_url, instrumental_url, creators!inner(id, display_name))
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching orders:', error)
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      {/* Back link + heading */}
      <div className="mb-8">
        <Link
          href="/account"
          className="inline-flex items-center gap-1.5 text-sm text-text-secondary transition-colors hover:text-text-primary"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            className="shrink-0"
          >
            <path
              d="M10 12L6 8L10 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Back to Account
        </Link>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-text-primary">
          Purchase History
        </h1>
      </div>

      {/* Order list or empty state */}
      {orders && orders.length > 0 ? (
        <OrderList orders={orders} />
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border-default bg-bg-card px-6 py-16">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            className="mb-4 text-text-muted"
          >
            <path
              d="M6 2L3 6V20C3 20.5304 3.21071 21.0391 3.58579 21.4142C3.96086 21.7893 4.46957 22 5 22H19C19.5304 22 20.0391 21.7893 20.4142 21.4142C20.7893 21.0391 21 20.5304 21 20V6L18 2H6Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M3 6H21"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M16 10C16 11.0609 15.5786 12.0783 14.8284 12.8284C14.0783 13.5786 13.0609 14 12 14C10.9391 14 9.92172 13.5786 9.17157 12.8284C8.42143 12.0783 8 11.0609 8 10"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <p className="mb-1 text-lg font-semibold text-text-primary">
            No purchases yet
          </p>
          <p className="mb-6 text-sm text-text-muted">
            Browse our catalog to find your next vocal topline.
          </p>
          <Link
            href="/search"
            className="rounded-lg bg-accent px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
          >
            Browse Tracks
          </Link>
        </div>
      )}
    </div>
  )
}
