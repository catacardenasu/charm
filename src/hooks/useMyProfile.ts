import { useAuth0 } from '@auth0/auth0-react'
import type { PostgrestError } from '@supabase/supabase-js'
import { useCallback, useEffect, useState } from 'react'
import { useSupabase } from '../lib/supabase.ts'
import type { Profile } from '../types.ts'

interface Loaded {
  key: string
  profile: Profile | null
  error: PostgrestError | null
}

/** The logged-in user's profile. `profile` is null when logged out or before onboarding. */
export function useMyProfile() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth0()
  const supabase = useSupabase()
  const sub = isAuthenticated ? user?.sub : undefined
  const [version, setVersion] = useState(0)
  const [loaded, setLoaded] = useState<Loaded | null>(null)

  // Results are tagged with the request key so a stale response never shows for a new user.
  const key = sub ? `${sub}:${version}` : null

  useEffect(() => {
    if (!sub || !key) return
    let cancelled = false
    supabase
      .from('profiles')
      .select('*')
      .eq('id', sub)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!cancelled) setLoaded({ key, profile: data as Profile | null, error })
      })
    return () => {
      cancelled = true
    }
  }, [supabase, sub, key])

  const refresh = useCallback(() => setVersion((v) => v + 1), [])
  const current = loaded?.key === key ? loaded : null

  return {
    profile: current?.profile ?? null,
    loading: authLoading || (key !== null && !current),
    error: current?.error ?? null,
    refresh,
  }
}
