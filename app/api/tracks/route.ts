import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const PUBLIC_TRACK_FIELDS = `
  id, title, vocalist_type, genre, mood, bpm, key, length_seconds,
  license_type, license_limit, licenses_sold,
  price_non_exclusive, price_exclusive,
  artwork_url, preview_clip_url, full_preview_url,
  waveform_data, is_ai_generated, status, created_at,
  creators!inner(id, display_name, profile_image_url)
`

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const supabase = await createClient()

  // Parse pagination params
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
  const offset = (page - 1) * limit

  // Build query - only approved tracks
  let query = supabase
    .from('tracks')
    .select(PUBLIC_TRACK_FIELDS, { count: 'exact' })
    .eq('status', 'approved')

  // Apply filters
  const genre = searchParams.get('genre')
  if (genre) {
    query = query.eq('genre', genre)
  }

  const mood = searchParams.get('mood')
  if (mood) {
    query = query.eq('mood', mood)
  }

  const vocalistType = searchParams.get('vocalist_type')
  if (vocalistType) {
    query = query.eq('vocalist_type', vocalistType)
  }

  const licenseType = searchParams.get('license_type')
  if (licenseType) {
    query = query.eq('license_type', licenseType)
  }

  const isAiGenerated = searchParams.get('is_ai_generated')
  if (isAiGenerated === 'true' || isAiGenerated === 'false') {
    query = query.eq('is_ai_generated', isAiGenerated === 'true')
  }

  const bpmMin = searchParams.get('bpm_min')
  if (bpmMin) {
    const bpmMinVal = parseInt(bpmMin, 10)
    if (!isNaN(bpmMinVal)) {
      query = query.gte('bpm', bpmMinVal)
    }
  }

  const bpmMax = searchParams.get('bpm_max')
  if (bpmMax) {
    const bpmMaxVal = parseInt(bpmMax, 10)
    if (!isNaN(bpmMaxVal)) {
      query = query.lte('bpm', bpmMaxVal)
    }
  }

  const key = searchParams.get('key')
  if (key) {
    query = query.eq('key', key)
  }

  const search = searchParams.get('search')
  if (search) {
    query = query.ilike('title', `%${search}%`)
  }

  // Apply sorting
  const sort = searchParams.get('sort') || 'newest'
  switch (sort) {
    case 'price_low':
      query = query.order('price_non_exclusive', { ascending: true })
      break
    case 'price_high':
      query = query.order('price_non_exclusive', { ascending: false })
      break
    case 'popular':
      query = query.order('licenses_sold', { ascending: false })
      break
    case 'newest':
    default:
      query = query.order('created_at', { ascending: false })
      break
  }

  // Apply pagination
  query = query.range(offset, offset + limit - 1)

  const { data, count, error } = await query

  if (error) {
    return NextResponse.json(
      { error: 'Failed to fetch tracks' },
      { status: 500 }
    )
  }

  const total = count ?? 0
  const totalPages = Math.ceil(total / limit)

  return NextResponse.json({
    tracks: data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  })
}
