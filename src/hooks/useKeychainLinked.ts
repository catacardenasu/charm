import { useAuth0 } from '@auth0/auth0-react'
import { useEffect, useState } from 'react'
import { useSupabase } from '../lib/supabase.ts'

const POLL_MS = 2000

/**
 * While `enabled`, checks every 2s whether the current user owns an active keychain
 * (RLS lets you read your own). Turns true once one appears, then stops polling.
 */
export function useKeychainLinked(enabled: boolean) {
  const { user } = useAuth0()
  const sub = user?.sub
  const supabase = useSupabase()
  const [linked, setLinked] = useState(false)

  useEffect(() => {
    if (!enabled || !sub || linked) return
    let cancelled = false

    const check = async () => {
      const { data } = await supabase
        .from('keychains')
        .select('code')
        .eq('owner_id', sub)
        .eq('active', true)
        .limit(1)
      if (!cancelled && data && data.length > 0) setLinked(true)
    }

    void check()
    const timer = setInterval(check, POLL_MS)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [enabled, sub, linked, supabase])

  return linked
}
