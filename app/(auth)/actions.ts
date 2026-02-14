'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const PASSWORD_MIN_LENGTH = 8
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/
const PASSWORD_ERROR = 'Password must be at least 8 characters with one uppercase letter, one lowercase letter, and one number'

export async function signUp(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('fullName') as string

  if (!password || password.length < PASSWORD_MIN_LENGTH || !PASSWORD_REGEX.test(password)) {
    return { error: PASSWORD_ERROR }
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/login?message=Check your email to confirm your account')
}

export async function signIn(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')

  // Check for redirect param (validated to prevent open redirects)
  const redirectTo = formData.get('redirect') as string
  const safeRedirect =
    redirectTo && redirectTo.startsWith('/') && !redirectTo.startsWith('//')
      ? redirectTo
      : '/account'
  redirect(safeRedirect)
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}

export async function resetPassword(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  if (!siteUrl) {
    return { error: 'Site URL not configured. Please contact support.' }
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/callback?next=/account`,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: 'Check your email for a password reset link' }
}

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const fullName = formData.get('fullName') as string

  const { error } = await supabase
    .from('profiles')
    .update({ full_name: fullName })
    .eq('id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/account')
  return { success: 'Profile updated successfully' }
}

export async function updateEmail(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const newEmail = formData.get('email') as string

  if (!newEmail || newEmail === user.email) {
    return { error: 'Please enter a different email address' }
  }

  const { error } = await supabase.auth.updateUser({ email: newEmail })

  if (error) {
    return { error: error.message }
  }

  return { success: 'Verification email sent to your new address. Please check your inbox.' }
}

export async function updatePassword(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const newPassword = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (!newPassword || newPassword.length < PASSWORD_MIN_LENGTH || !PASSWORD_REGEX.test(newPassword)) {
    return { error: PASSWORD_ERROR }
  }

  if (newPassword !== confirmPassword) {
    return { error: 'Passwords do not match' }
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword })

  if (error) {
    return { error: error.message }
  }

  return { success: 'Password updated successfully' }
}
