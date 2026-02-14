import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://lyzmwtvfvyxlpqpcctxm.supabase.co'
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SERVICE_ROLE_KEY) {
  console.error('SUPABASE_SERVICE_ROLE_KEY not set')
  process.exit(1)
}

const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// Buckets based on actual codebase usage
const REQUIRED_BUCKETS = [
  { name: 'avatars', public: true },
  { name: 'licenses', public: true },
  { name: 'previews', public: true },
  { name: 'deliverables', public: false },
  { name: 'private', public: false },
]

async function testStorageCheck() {
  console.log('Testing Supabase Storage Diagnostic...\n')

  const errors = []
  const bucketStatuses = {}

  // Get list of existing buckets
  console.log('1. Listing existing buckets...')
  const { data: existingBuckets, error: listError } =
    await adminClient.storage.listBuckets()

  if (listError) {
    console.error('Failed to list buckets:', listError.message)
    process.exit(1)
  }

  console.log('   Existing buckets:', existingBuckets?.map((b) => b.name).join(', ') || 'none')
  const existingBucketNames = new Set(existingBuckets?.map((b) => b.name) || [])

  // Check/create each required bucket
  for (const bucket of REQUIRED_BUCKETS) {
    console.log(`\n2. Checking bucket: ${bucket.name}`)

    const status = {
      exists: existingBucketNames.has(bucket.name),
      created: false,
      upload: 'skipped',
    }

    // Create bucket if missing
    if (!status.exists) {
      console.log(`   Creating bucket (public: ${bucket.public})...`)
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
        console.log(`   ❌ ${status.error}`)
        continue
      }

      status.exists = true
      status.created = true
      console.log('   ✅ Bucket created')
    } else {
      console.log('   ✅ Bucket already exists')
    }

    // Test upload
    const testFileName = `_test_${Date.now()}.txt`
    const testContent = `Storage diagnostic test - ${new Date().toISOString()}`

    console.log(`   Testing upload (${testFileName})...`)
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
      console.log(`   ❌ ${status.error}`)
      continue
    }

    status.upload = 'ok'
    console.log('   ✅ Upload successful')

    // Test download/URL generation
    if (bucket.public) {
      console.log('   Testing public URL...')
      const { data: publicUrlData } = adminClient.storage
        .from(bucket.name)
        .getPublicUrl(testFileName)

      if (publicUrlData?.publicUrl) {
        status.download = 'ok'
        console.log(`   ✅ Public URL: ${publicUrlData.publicUrl}`)
      } else {
        status.download = 'error'
        status.error = 'Failed to generate public URL'
        errors.push(`${bucket.name}: ${status.error}`)
        console.log(`   ❌ ${status.error}`)
      }
    } else {
      console.log('   Testing signed URL...')
      const { data: signedUrlData, error: signedUrlError } =
        await adminClient.storage
          .from(bucket.name)
          .createSignedUrl(testFileName, 3600)

      if (signedUrlError || !signedUrlData?.signedUrl) {
        status.signedUrl = 'error'
        status.error = `Failed to create signed URL: ${signedUrlError?.message || 'No URL returned'}`
        errors.push(`${bucket.name}: ${status.error}`)
        console.log(`   ❌ ${status.error}`)
      } else {
        status.signedUrl = 'ok'
        console.log(`   ✅ Signed URL generated (expires in 1 hour)`)
      }
    }

    // Cleanup test file
    console.log('   Cleaning up test file...')
    const { error: deleteError } = await adminClient.storage
      .from(bucket.name)
      .remove([testFileName])

    if (deleteError) {
      console.log(`   ⚠️ Cleanup warning: ${deleteError.message}`)
      errors.push(`${bucket.name}: Cleanup warning - ${deleteError.message}`)
    } else {
      console.log('   ✅ Test file deleted')
    }

    bucketStatuses[bucket.name] = status
  }

  // Summary
  console.log('\n' + '='.repeat(50))
  console.log('SUMMARY')
  console.log('='.repeat(50))

  const response = {
    success: errors.length === 0,
    buckets: bucketStatuses,
    errors,
  }

  console.log(JSON.stringify(response, null, 2))

  if (response.success) {
    console.log('\n✅ All storage checks passed!')
  } else {
    console.log('\n❌ Some checks failed. See errors above.')
  }
}

testStorageCheck().catch(console.error)
