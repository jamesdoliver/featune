import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { createAdminClient } from '@/lib/supabase/admin'

// PATCH: Bulk update display_order for all sections
// Body: { order: [{ id: string, display_order: number }] }
export async function PATCH(request: NextRequest) {
  try {
    const { user, error: authError } = await requireAdmin()
    if (authError) return authError

    const body = await request.json()
    const { order } = body as {
      order: { id: string; display_order: number }[]
    }

    if (!order || !Array.isArray(order) || order.length === 0) {
      return NextResponse.json(
        { error: 'Order array is required' },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()

    // Update each section's display_order
    const updates = order.map(({ id, display_order }) =>
      adminClient
        .from('homepage_sections')
        .update({ display_order })
        .eq('id', id)
    )

    const results = await Promise.all(updates)

    // Check for any errors
    const errors = results.filter((r) => r.error)
    if (errors.length > 0) {
      console.error('Errors updating section order:', errors)
      return NextResponse.json(
        { error: 'Failed to update some sections' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Error in PATCH reorder:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
