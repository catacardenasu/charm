import { useAuth0 } from '@auth0/auth0-react'
import { useCallback, useEffect, useState } from 'react'
import { useSupabase } from '../lib/supabase.ts'
import type { Keychain } from '../types.ts'

interface Loaded {
  key: string
  keychain: Keychain | null
}

/** My active keychain, or null if I haven't linked one (RLS lets you read your own). */
export function useMyKeychain() {
  const { user, isAuthenticated } = useAuth0()
  const sub = isAuthenticated ? user?.sub : undefined
  const supabase = useSupabase()
  const [version, setVersion] = useState(0)
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const key = sub ? `${sub}:${version}` : null

  useEffect(() => {
    if (!sub || !key) return
    let cancelled = false
    supabase
      .from('keychains')
      .select('code, owner_id, active, claimed_at')
      .eq('owner_id', sub)
      .eq('active', true)
      .order('claimed_at', { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (!cancelled) setLoaded({ key, keychain: (data?.[0] as Keychain | undefined) ?? null })
      })
    return () => {
      cancelled = true
    }
  }, [supabase, sub, key])

  const refresh = useCallback(() => setVersion((v) => v + 1), [])
  const current = loaded?.key === key ? loaded : null

  return { keychain: current?.keychain ?? null, loading: key !== null && !current, refresh }
}
