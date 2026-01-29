import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

interface RouteParams {
  params: Promise<{ id: string }>
}

// PATCH: Update a section (title, is_active, display_order)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { title, is_active, display_order } = body

    const adminClient = createAdminClient()

    // Build update object with only provided fields
    const updates: Record<string, unknown> = {}
    if (title !== undefined) updates.title = title
    if (is_active !== undefined) updates.is_active = is_active
    if (display_order !== undefined) updates.display_order = display_order

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      )
    }

    const { data: updatedSection, error } = await adminClient
      .from('homepage_sections')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating section:', error)
      return NextResponse.json(
        { error: 'Failed to update section' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, section: updatedSection })
  } catch (err) {
    console.error('Error in PATCH section:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE: Delete a genre section (featured section cannot be deleted)
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const adminClient = createAdminClient()

    // Check if this is the featured section (cannot be deleted)
    const { data: section } = await adminClient
      .from('homepage_sections')
      .select('section_type')
      .eq('id', id)
      .single()

    if (!section) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 })
    }

    if (section.section_type === 'featured') {
      return NextResponse.json(
        { error: 'The Featured section cannot be deleted' },
        { status: 400 }
      )
    }

    // Delete the section (cascade will delete associated track pins)
    const { error } = await adminClient
      .from('homepage_sections')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting section:', error)
      return NextResponse.json(
        { error: 'Failed to delete section' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Error in DELETE section:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
