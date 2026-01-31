import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

const SIGNED_URL_EXPIRY = 3600 // 1 hour in seconds

type FileType = 'acapella' | 'instrumental' | 'license'

function isValidFileType(type: string | null): type is FileType {
  return type === 'acapella' || type === 'instrumental' || type === 'license'
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ trackId: string }> }
) {
  const { trackId } = await params
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')

  if (!isValidFileType(type)) {
    return NextResponse.json(
      { error: 'Invalid file type. Must be acapella, instrumental, or license.' },
      { status: 400 }
    )
  }

  // Authenticate user
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify user has purchased this track
  const { data: orderItem, error: orderError } = await supabase
    .from('order_items')
    .select(
      `
      id,
      license_pdf_url,
      orders!inner (
        id,
        user_id,
        status
      ),
      tracks!inner (
        id,
        acapella_url,
        instrumental_url
      )
    `
    )
    .eq('track_id', trackId)
    .eq('orders.user_id', user.id)
    .eq('orders.status', 'completed')
    .limit(1)
    .single()

  if (orderError || !orderItem) {
    return NextResponse.json(
      { error: 'You have not purchased this track.' },
      { status: 403 }
    )
  }

  // Get the file path based on type
  // Supabase may return tracks as an array or object depending on the relation
  const tracksRaw = orderItem.tracks as unknown
  const track = Array.isArray(tracksRaw)
    ? (tracksRaw[0] as { id: string; acapella_url: string | null; instrumental_url: string | null })
    : (tracksRaw as { id: string; acapella_url: string | null; instrumental_url: string | null })

  let filePath: string | null = null

  switch (type) {
    case 'acapella':
      filePath = track.acapella_url
      break
    case 'instrumental':
      filePath = track.instrumental_url
      break
    case 'license':
      filePath = orderItem.license_pdf_url
      break
  }

  if (!filePath) {
    return NextResponse.json(
      { error: `No ${type} file available for this track.` },
      { status: 404 }
    )
  }

  // Use admin client to generate signed URL (bypasses RLS)
  const adminSupabase = createAdminClient()

  // Determine bucket based on file type
  // License PDFs and private audio files are in 'private' bucket
  const bucket = 'private'

  // Extract the storage path from the URL if it's a full URL
  let storagePath = filePath
  if (filePath.startsWith('http')) {
    // Extract path after /storage/v1/object/public/ or /storage/v1/object/sign/
    const match = filePath.match(/\/storage\/v1\/object\/(?:public|sign)\/[^/]+\/(.+)/)
    if (match) {
      storagePath = match[1]
    } else {
      // Try extracting after bucket name in URL
      const bucketMatch = filePath.match(/\/(?:public|private)\/(.+)$/)
      if (bucketMatch) {
        storagePath = bucketMatch[1]
      }
    }
  }

  const { data: signedUrlData, error: signedUrlError } =
    await adminSupabase.storage
      .from(bucket)
      .createSignedUrl(storagePath, SIGNED_URL_EXPIRY, {
        download: true,
      })

  if (signedUrlError || !signedUrlData?.signedUrl) {
    console.error('Failed to create signed URL:', signedUrlError)
    return NextResponse.json(
      { error: 'Failed to generate download link.' },
      { status: 500 }
    )
  }

  // Redirect to the signed URL
  return NextResponse.redirect(signedUrlData.signedUrl)
}
