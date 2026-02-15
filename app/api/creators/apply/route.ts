import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendCreatorApplicationEmail, sendCreatorApplicationReceivedEmail } from '@/lib/email'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Auth check
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if already a creator
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_creator')
      .eq('id', user.id)
      .single()

    if (profile?.is_creator) {
      return NextResponse.json(
        { error: 'You are already a creator' },
        { status: 400 }
      )
    }

    // Check if there is already a pending/approved creator record
    const { data: existingCreator } = await supabase
      .from('creators')
      .select('id, status')
      .eq('user_id', user.id)
      .single()

    if (existingCreator) {
      return NextResponse.json(
        { error: `You already have a creator application (${existingCreator.status})` },
        { status: 400 }
      )
    }

    // Parse form data
    const formData = await request.formData()
    const displayName = formData.get('display_name') as string | null
    const bio = formData.get('bio') as string | null
    const profileImageFile = formData.get('profile_image') as File | null
    const payoutMethod = formData.get('payout_method') as string | null
    const sampleTrackFile = formData.get('sample_track') as File | null

    if (!displayName?.trim()) {
      return NextResponse.json(
        { error: 'Display name is required' },
        { status: 400 }
      )
    }

    // Validate payout method
    if (!payoutMethod || (payoutMethod !== 'paypal' && payoutMethod !== 'bank')) {
      return NextResponse.json(
        { error: 'Please select a payout method (paypal or bank)' },
        { status: 400 }
      )
    }

    // Build payout details JSON
    let payoutDetails: Record<string, string>
    if (payoutMethod === 'paypal') {
      const paypalEmail = formData.get('paypal_email') as string | null
      if (!paypalEmail?.trim()) {
        return NextResponse.json(
          { error: 'PayPal email is required' },
          { status: 400 }
        )
      }
      payoutDetails = { method: 'paypal', paypal_email: paypalEmail.trim() }
    } else {
      const accountHolder = formData.get('bank_account_holder') as string | null
      const bankNameVal = formData.get('bank_name') as string | null
      const sortCode = formData.get('bank_sort_code') as string | null
      const accountNumber = formData.get('bank_account_number') as string | null
      if (!accountHolder?.trim() || !bankNameVal?.trim() || !sortCode?.trim() || !accountNumber?.trim()) {
        return NextResponse.json(
          { error: 'All bank transfer fields are required' },
          { status: 400 }
        )
      }
      payoutDetails = {
        method: 'bank',
        account_holder: accountHolder.trim(),
        bank_name: bankNameVal.trim(),
        sort_code: sortCode.trim(),
        account_number: accountNumber.trim(),
      }
    }

    // Validate sample track
    if (!sampleTrackFile || sampleTrackFile.size === 0) {
      return NextResponse.json(
        { error: 'A sample track is required' },
        { status: 400 }
      )
    }

    if (!sampleTrackFile.type.startsWith('audio/')) {
      return NextResponse.json(
        { error: 'Sample track must be an audio file (MP3, WAV)' },
        { status: 400 }
      )
    }

    if (sampleTrackFile.size > 50 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Sample track must be smaller than 50MB' },
        { status: 400 }
      )
    }

    // Use admin client to bypass RLS for inserts
    const admin = createAdminClient()

    let profileImageUrl: string | null = null

    // Upload profile image if provided
    if (profileImageFile && profileImageFile.size > 0) {
      // Validate file type
      if (!profileImageFile.type.startsWith('image/')) {
        return NextResponse.json(
          { error: 'Profile image must be an image file' },
          { status: 400 }
        )
      }

      // Validate file size (max 5MB)
      if (profileImageFile.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: 'Profile image must be smaller than 5MB' },
          { status: 400 }
        )
      }

      const fileExt = profileImageFile.name.split('.').pop()
      const filePath = `${user.id}/avatar.${fileExt}`

      const { error: uploadError } = await admin.storage
        .from('avatars')
        .upload(filePath, profileImageFile, {
          upsert: true,
          contentType: profileImageFile.type,
        })

      if (uploadError) {
        console.error('Avatar upload error:', uploadError)
        return NextResponse.json(
          { error: 'Failed to upload profile image' },
          { status: 500 }
        )
      }

      const { data: publicUrl } = admin.storage
        .from('avatars')
        .getPublicUrl(filePath)

      profileImageUrl = publicUrl.publicUrl
    }

    // Upload sample track
    let sampleTrackUrl: string | undefined
    try {
      const ext = sampleTrackFile.name.split('.').pop() || 'mp3'
      const samplePath = `${user.id}/sample-track.${ext}`

      const { error: sampleUploadError } = await admin.storage
        .from('avatars')
        .upload(samplePath, sampleTrackFile, {
          upsert: true,
          contentType: sampleTrackFile.type,
        })

      if (sampleUploadError) {
        console.error('Sample track upload error:', sampleUploadError)
      } else {
        const { data: samplePublicUrl } = admin.storage
          .from('avatars')
          .getPublicUrl(samplePath)
        sampleTrackUrl = samplePublicUrl.publicUrl
      }
    } catch (err) {
      console.error('Sample track upload failed:', err)
    }

    // Create creator record
    const { error: creatorError } = await admin
      .from('creators')
      .insert({
        user_id: user.id,
        display_name: displayName.trim(),
        bio: bio?.trim() || null,
        profile_image_url: profileImageUrl,
        payout_details: payoutDetails,
        status: 'pending',
        revenue_split: 0.70,
      })

    if (creatorError) {
      console.error('Creator insert error:', creatorError)
      return NextResponse.json(
        { error: 'Failed to create creator application' },
        { status: 500 }
      )
    }

    // Note: is_creator flag is set to true only when admin approves the creator
    // (handled in app/api/admin/creators/[id]/approve/route.ts)
    // Do NOT set is_creator=true here -- the application is still pending.

    // Send notification emails (non-blocking)
    sendCreatorApplicationEmail({ creatorName: displayName.trim(), sampleTrackUrl }).catch(() => {})
    sendCreatorApplicationReceivedEmail({
      to: user.email!,
      creatorName: displayName.trim(),
    }).catch(() => {})

    return NextResponse.json(
      { message: 'Application submitted successfully' },
      { status: 201 }
    )
  } catch (err) {
    console.error('Creator application error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
