import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendNewSubmissionEmail } from '@/lib/email'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Auth check
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get creator's display name
    const { data: creator } = await supabase
      .from('creators')
      .select('display_name')
      .eq('user_id', user.id)
      .single()

    if (!creator) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 })
    }

    // Parse request body
    const { trackTitle } = await request.json()

    if (!trackTitle) {
      return NextResponse.json({ error: 'Track title is required' }, { status: 400 })
    }

    // Send notification email to admin (non-blocking)
    sendNewSubmissionEmail({
      trackTitle,
      creatorName: creator.display_name,
    }).catch(() => {})

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Notify submission error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
