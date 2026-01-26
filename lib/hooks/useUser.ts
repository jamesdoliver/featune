'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/lib/types/database'

interface UseUserReturn {
  user: User | null
  profile: Profile | null
  loading: boolean
  error: Error | null
}

export function useUser(): UseUserReturn {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const supabase = createClient()

    const fetchProfile = async (userId: string): Promise<Profile | null> => {
      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (profileError) throw profileError
      return data
    }

    // Get initial session
    const getInitialSession = async () => {
      try {
        const {
          data: { user: currentUser },
          error: userError,
        } = await supabase.auth.getUser()
        if (userError) throw userError

        setUser(currentUser)

        if (currentUser) {
          const profileData = await fetchProfile(currentUser.id)
          setProfile(profileData)
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to get user'))
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)

      if (currentUser) {
        try {
          const profileData = await fetchProfile(currentUser.id)
          setProfile(profileData)
        } catch {
          // Profile fetch failed on auth change — leave profile as null
          setProfile(null)
        }
      } else {
        setProfile(null)
      }

      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return { user, profile, loading, error }
}
