import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { createAdminClient } from '@/lib/supabase/admin'

interface BucketStatus {
  exists: boolean
  created: boolean
  upload: 'ok' | 'error' | 'skipped'
  download?: 'ok' | 'error' | 'skipped'
  signedUrl?: 'ok' | 'error' | 'skipped'
  error?: string
}

interface DiagnosticResponse {
  success: boolean
  buckets: Record<string, BucketStatus>
  errors: string[]
}

// Buckets based on actual codebase usage:
// - avatars: creator profile images (public)
// - licenses: generated license PDFs (public - used with getPublicUrl)
// - previews: watermarked preview audio (public)
// - deliverables: original uploaded files for delivery (private)
// - private: downloaded purchased files (private - used in downloads API)
const REQUIRED_BUCKETS = [
  { name: 'avatars', public: true },
  { name: 'licenses', public: true },
  { name: 'previews', public: true },
  { name: 'deliverables', public: false },
  { name: 'private', public: false },
] as const

export async function GET() {
  try {
    const { user, error: authError } = await requireAdmin()
    if (authError) return authError

    // Use admin client for storage operations
    const adminClient = createAdminClient()
    const errors: string[] = []
    const bucketStatuses: Record<string, BucketStatus> = {}

    // Get list of existing buckets
    const { data: existingBuckets, error: listError } =
      await adminClient.storage.listBuckets()

    if (listError) {
      return NextResponse.json(
        {
          success: false,
          buckets: {},
          errors: [`Failed to list buckets: ${listError.message}`],
        },
        { status: 500 }
      )
    }

    const existingBucketNames = new Set(existingBuckets?.map((b) => b.name) || [])

    // Check/create each required bucket
    for (const bucket of REQUIRED_BUCKETS) {
      const status: BucketStatus = {
        exists: existingBucketNames.has(bucket.name),
        created: false,
        upload: 'skipped',
      }

      // Create bucket if missing
      if (!status.exists) {
        const { error: createError } = await adminClient.storage.createBucket(
          bucket.name,
          {
            public: bucket.public,
          }
        )

        if (createError) {
          status.upload = 'error'
          status.error = `Failed to create bucket: ${createError.message}`
          errors.push(`${bucket.name}: ${status.error}`)
          bucketStatuses[bucket.name] = status
          continue
        }

        status.exists = true
        status.created = true
      }

      // Test upload
      const testFileName = `_test_${Date.now()}.txt`
      const testContent = `Storage diagnostic test - ${new Date().toISOString()}`

      const { error: uploadError } = await adminClient.storage
        .from(bucket.name)
        .upload(testFileName, testContent, {
          contentType: 'text/plain',
          upsert: true,
        })

      if (uploadError) {
        status.upload = 'error'
        status.error = `Upload failed: ${uploadError.message}`
        errors.push(`${bucket.name}: ${status.error}`)
        bucketStatuses[bucket.name] = status
        continue
      }

      status.upload = 'ok'

      // Test download/URL generation
      if (bucket.public) {
        // Test public URL
        const { data: publicUrlData } = adminClient.storage
          .from(bucket.name)
          .getPublicUrl(testFileName)

        if (publicUrlData?.publicUrl) {
          status.download = 'ok'
        } else {
          status.download = 'error'
          status.error = 'Failed to generate public URL'
          errors.push(`${bucket.name}: ${status.error}`)
        }
      } else {
        // Test signed URL for private buckets
        const { data: signedUrlData, error: signedUrlError } =
          await adminClient.storage
            .from(bucket.name)
            .createSignedUrl(testFileName, 3600) // 1 hour expiry

        if (signedUrlError || !signedUrlData?.signedUrl) {
          status.signedUrl = 'error'
          status.error = `Failed to create signed URL: ${signedUrlError?.message || 'No URL returned'}`
          errors.push(`${bucket.name}: ${status.error}`)
        } else {
          status.signedUrl = 'ok'
        }
      }

      // Cleanup test file
      const { error: deleteError } = await adminClient.storage
        .from(bucket.name)
        .remove([testFileName])

      if (deleteError) {
        errors.push(`${bucket.name}: Cleanup warning - ${deleteError.message}`)
      }

      bucketStatuses[bucket.name] = status
    }

    const response: DiagnosticResponse = {
      success: errors.length === 0,
      buckets: bucketStatuses,
      errors,
    }

    return NextResponse.json(response)
  } catch (err) {
    console.error('Storage check error:', err)
    return NextResponse.json(
      {
        success: false,
        buckets: {},
        errors: [
          `Internal server error: ${err instanceof Error ? err.message : 'Unknown error'}`,
        ],
      },
      { status: 500 }
    )
  }
}
