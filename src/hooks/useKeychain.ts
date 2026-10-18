import { useAuth0 } from '@auth0/auth0-react'
import type { PostgrestError } from '@supabase/supabase-js'
import { useCallback, useEffect, useState } from 'react'
import { retryOnAuthError, useSupabase } from '../lib/supabase.ts'
import type { KeychainLookup } from '../types.ts'

interface Loaded {
  key: string
  lookup: KeychainLookup | null
  error: PostgrestError | null
}

/**
 * Looks up a keychain for /k/:code via keychain_lookup(). Works logged out,
 * so the teaser can show the owner's nickname and avatar before login.
 */
export function useKeychain(code: string | undefined) {
  const { isAuthenticated, isLoading: authLoading } = useAuth0()
  const supabase = useSupabase()
  const [version, setVersion] = useState(0)
  const [loaded, setLoaded] = useState<Loaded | null>(null)

  // Wait for Auth0 so the lookup runs with the right token ('mine' vs 'owned', has_profile).
  const key = code && !authLoading ? `${code}:${isAuthenticated}:${version}` : null

  useEffect(() => {
    if (!code || !key) return
    let cancelled = false
    retryOnAuthError(() => supabase.rpc('keychain_lookup', { p_code: code }), isAuthenticated).then(
      ({ data, error }) => {
        if (!cancelled) setLoaded({ key, lookup: data as KeychainLookup | null, error })
      },
    )
    return () => {
      cancelled = true
    }
  }, [supabase, code, key, isAuthenticated])

  const refresh = useCallback(() => setVersion((v) => v + 1), [])
  const current = loaded?.key === key ? loaded : null
  const lookup = current?.lookup ?? null

  return {
    status: lookup?.status ?? null,
    owner: lookup?.owner ?? null,
    exists: lookup ? lookup.status !== 'not_found' : null,
    active: lookup ? lookup.status !== 'not_found' && lookup.status !== 'inactive' : null,
    claimed: lookup ? lookup.status === 'mine' || lookup.status === 'owned' : null,
    hasProfile: lookup?.has_profile ?? null,
    loading: !!code && !current,
    error: current?.error ?? null,
    refresh,
  }
}
