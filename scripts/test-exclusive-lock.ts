/**
 * Test script for verifying exclusive purchase concurrency locking
 *
 * This script simulates concurrent exclusive purchase attempts to verify
 * that the database function `process_track_purchase` correctly prevents
 * race conditions using row-level locking.
 *
 * Run with: npx tsx scripts/test-exclusive-lock.ts
 *
 * Requirements:
 * - NEXT_PUBLIC_SUPABASE_URL environment variable
 * - SUPABASE_SERVICE_ROLE_KEY environment variable
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Load environment variables from .env.local
function loadEnvFile() {
  try {
    const envPath = resolve(process.cwd(), '.env.local')
    const envContent = readFileSync(envPath, 'utf-8')
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=')
        const value = valueParts.join('=').replace(/^["']|["']$/g, '')
        if (key && !process.env[key]) {
          process.env[key] = value
        }
      }
    }
  } catch {
    // .env.local may not exist, that's fine
  }
}

loadEnvFile()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing required environment variables:')
  if (!supabaseUrl) console.error('  - NEXT_PUBLIC_SUPABASE_URL')
  if (!serviceRoleKey) console.error('  - SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false }
})

interface PurchaseResult {
  success: boolean
  licenses_sold?: number
  new_status?: string
  error?: string
}

async function testExclusiveLock() {
  console.log('\n=== Exclusive Purchase Lock Test ===\n')

  let testTrackId: string | null = null
  let testCreatorId: string | null = null

  try {
    // 1. Find an existing creator (service role bypasses RLS)
    console.log('1. Finding a creator for test track...')
    const { data: creator, error: creatorError } = await supabase
      .from('creators')
      .select('id')
      .limit(1)
      .single()

    if (creatorError || !creator) {
      console.error('   No creator found. Creating a test creator requires a user account.')
      console.log('   Skipping test - please ensure at least one creator exists in the database.')
      return
    }

    testCreatorId = creator.id
    console.log(`   Found creator: ${testCreatorId}`)

    // 2. Create test track
    console.log('\n2. Creating test track...')
    const { data: track, error: trackError } = await supabase
      .from('tracks')
      .insert({
        creator_id: testCreatorId,
        title: 'TEST_EXCLUSIVE_LOCK_' + Date.now(),
        vocalist_type: 'male',
        license_type: 'unlimited',
        price_non_exclusive: 29.99,
        price_exclusive: 299.99,
        status: 'approved',
        licenses_sold: 0,
      })
      .select('id, status, licenses_sold')
      .single()

    if (trackError || !track) {
      console.error('   Failed to create test track:', trackError?.message)
      return
    }

    testTrackId = track.id
    console.log(`   Created track: ${testTrackId}`)
    console.log(`   Initial status: ${track.status}`)
    console.log(`   Initial licenses_sold: ${track.licenses_sold}`)

    // 3. Simulate concurrent exclusive purchases
    console.log('\n3. Simulating concurrent exclusive purchases...')
    console.log('   Launching 3 simultaneous purchase attempts...')

    const purchasePromises = [
      supabase.rpc('process_track_purchase', {
        p_track_id: testTrackId,
        p_license_type: 'exclusive'
      }),
      supabase.rpc('process_track_purchase', {
        p_track_id: testTrackId,
        p_license_type: 'exclusive'
      }),
      supabase.rpc('process_track_purchase', {
        p_track_id: testTrackId,
        p_license_type: 'exclusive'
      }),
    ]

    const results = await Promise.all(purchasePromises)

    // 4. Analyze results
    console.log('\n4. Analyzing results...')

    const successes: PurchaseResult[] = []
    const failures: PurchaseResult[] = []

    results.forEach((result, index) => {
      const data = result.data as PurchaseResult | null
      console.log(`   Purchase attempt ${index + 1}:`, JSON.stringify(data))

      if (data?.success) {
        successes.push(data)
      } else {
        failures.push(data || { success: false, error: 'Unknown error' })
      }
    })

    console.log(`\n   Successful purchases: ${successes.length}`)
    console.log(`   Failed purchases: ${failures.length}`)

    // 5. Verify final state
    console.log('\n5. Verifying final track state...')
    const { data: finalTrack, error: finalError } = await supabase
      .from('tracks')
      .select('status, licenses_sold')
      .eq('id', testTrackId)
      .single()

    if (finalError) {
      console.error('   Failed to fetch final track state:', finalError.message)
      return
    }

    console.log(`   Final status: ${finalTrack.status}`)
    console.log(`   Final licenses_sold: ${finalTrack.licenses_sold}`)

    // 6. Cleanup
    console.log('\n6. Cleaning up test track...')
    const { error: deleteError } = await supabase
      .from('tracks')
      .delete()
      .eq('id', testTrackId)

    if (deleteError) {
      console.warn(`   Warning: Failed to delete test track: ${deleteError.message}`)
    } else {
      console.log('   Test track deleted successfully')
    }

    // 7. Assert and report
    console.log('\n=== Test Results ===\n')

    const expectedSuccesses = 1
    const expectedFailures = 2
    const expectedStatus = 'removed'
    const expectedLicensesSold = 1

    const passed =
      successes.length === expectedSuccesses &&
      failures.length === expectedFailures &&
      finalTrack.status === expectedStatus &&
      finalTrack.licenses_sold === expectedLicensesSold

    if (passed) {
      console.log('PASS: Exclusive locking works correctly')
      console.log('  - Only 1 purchase succeeded out of 3 concurrent attempts')
      console.log('  - Track status changed to "removed"')
      console.log('  - licenses_sold incremented exactly once')
    } else {
      console.log('FAIL: Locking did not work as expected')
      console.log(`  Expected ${expectedSuccesses} success, got ${successes.length}`)
      console.log(`  Expected ${expectedFailures} failures, got ${failures.length}`)
      console.log(`  Expected status "${expectedStatus}", got "${finalTrack.status}"`)
      console.log(`  Expected licenses_sold ${expectedLicensesSold}, got ${finalTrack.licenses_sold}`)
    }

    console.log('')
    process.exit(passed ? 0 : 1)

  } catch (err) {
    console.error('\nTest failed with error:', err)

    // Attempt cleanup on error
    if (testTrackId) {
      console.log('\nAttempting cleanup...')
      await supabase.from('tracks').delete().eq('id', testTrackId)
    }

    process.exit(1)
  }
}

// Run the test
testExclusiveLock()
