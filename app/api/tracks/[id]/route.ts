import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const PUBLIC_TRACK_FIELDS = `
  id, title, vocalist_type, genre, mood, bpm, key, length_seconds,
  license_type, license_limit, licenses_sold,
  price_non_exclusive, price_exclusive,
  lyrics, artwork_url, listening_file_url,
  preview_clip_url, preview_clip_start, full_preview_url,
  waveform_data, is_ai_generated, status, created_at, approved_at,
  creators!inner(id, display_name, bio, profile_image_url)
`

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('tracks')
    .select(PUBLIC_TRACK_FIELDS)
    .eq('id', id)
    .eq('status', 'approved')
    .single()

  if (error || !data) {
    return NextResponse.json(
      { error: 'Track not found' },
      { status: 404 }
    )
  }

  return NextResponse.json({ track: data })
}
