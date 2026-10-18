import { useAuth0 } from '@auth0/auth0-react'
import { useEffect, useState } from 'react'
import { useSupabase } from '../lib/supabase.ts'
import type { Avatar, StreakEntry } from '../types.ts'
import { toAvatar } from './usePlaza.ts'

// Everyone I have a pair streak with, most weeks first (rpc my_streaks,
// 006_helpers.sql). Empty when logged out.

type StreakRow = Omit<StreakEntry, 'avatar'> & { avatar: Partial<Avatar> | null }

interface StreaksResult {
  streaks: StreakEntry[]
  error: string | null
}

const NO_STREAKS: StreakEntry[] = []

export function useStreaks() {
  const supabase = useSupabase()
  const { isLoading: authLoading, isAuthenticated } = useAuth0()
  const [result, setResult] = useState<StreaksResult | null>(null)
  const [reloads, setReloads] = useState(0)

  useEffect(() => {
    if (authLoading) return
    let cancelled = false
    void (async () => {
      let next: StreaksResult = { streaks: NO_STREAKS, error: null }
      if (isAuthenticated) {
        const res = await supabase.rpc('my_streaks')
        if (res.error) next = { ...next, error: res.error.message }
        else next = { streaks: (res.data as StreakRow[]).map((row) => ({ ...row, avatar: toAvatar(row.avatar) })), error: null }
      }
      if (!cancelled) setResult(next)
    })()
    return () => {
      cancelled = true
    }
  }, [authLoading, isAuthenticated, supabase, reloads])

  return {
    streaks: result?.streaks ?? NO_STREAKS,
    loading: result === null,
    error: result?.error ?? null,
    /** Re-fetch, e.g. after a tap in. */
    refresh: () => setReloads((n) => n + 1),
  }
}
