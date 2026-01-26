import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

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

    if (!displayName?.trim()) {
      return NextResponse.json(
        { error: 'Display name is required' },
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

    // Create creator record
    const { error: creatorError } = await admin
      .from('creators')
      .insert({
        user_id: user.id,
        display_name: displayName.trim(),
        bio: bio?.trim() || null,
        profile_image_url: profileImageUrl,
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

    // Update profile to mark as creator
    const { error: profileError } = await admin
      .from('profiles')
      .update({ is_creator: true })
      .eq('id', user.id)

    if (profileError) {
      console.error('Profile update error:', profileError)
      // Don't fail the whole request -- creator record was created
    }

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
