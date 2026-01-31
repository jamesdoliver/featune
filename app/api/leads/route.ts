import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendLeadWelcomeEmail } from '@/lib/email'

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export async function POST(request: Request) {
  try {
    const { email, name, source } = await request.json()

    // Validate email
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const normalizedEmail = email.trim().toLowerCase()

    if (!isValidEmail(normalizedEmail)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    // Use admin client to bypass RLS
    const admin = createAdminClient()

    // Upsert lead (update subscribed_at if exists and was unsubscribed)
    const { error: upsertError } = await admin
      .from('leads')
      .upsert(
        {
          email: normalizedEmail,
          name: name?.trim() || null,
          source: source || 'website',
          subscribed_at: new Date().toISOString(),
          unsubscribed_at: null,
        },
        {
          onConflict: 'email',
          ignoreDuplicates: false,
        }
      )

    if (upsertError) {
      console.error('Lead upsert error:', upsertError)
      return NextResponse.json(
        { error: 'Failed to subscribe' },
        { status: 500 }
      )
    }

    // Send welcome email (non-blocking)
    sendLeadWelcomeEmail({
      to: normalizedEmail,
      name: name?.trim(),
    }).catch(() => {})

    return NextResponse.json({ success: true, message: 'Subscribed successfully' })
  } catch (err) {
    console.error('Lead subscription error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
