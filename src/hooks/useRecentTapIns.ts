import { useAuth0 } from '@auth0/auth0-react'
import { useEffect, useState } from 'react'
import { useSupabase } from '../lib/supabase.ts'
import type { Avatar, RecentTapIn } from '../types.ts'
import { toAvatar } from './usePlaza.ts'

// My tap ins from the last 7 days, newest first (rpc my_recent_tap_ins,
// 008_review.sql). Removed ones are left out. Empty when logged out.

type RecentTapInRow = Omit<RecentTapIn, 'avatar'> & { avatar: Partial<Avatar> | null }

interface RecentTapInsResult {
  tapIns: RecentTapIn[]
  error: string | null
}

const NO_TAP_INS: RecentTapIn[] = []

export function useRecentTapIns() {
  const supabase = useSupabase()
  const { isLoading: authLoading, isAuthenticated } = useAuth0()
  const [result, setResult] = useState<RecentTapInsResult | null>(null)
  const [reloads, setReloads] = useState(0)

  useEffect(() => {
    if (authLoading) return
    let cancelled = false
    void (async () => {
      let next: RecentTapInsResult = { tapIns: NO_TAP_INS, error: null }
      if (isAuthenticated) {
        const res = await supabase.rpc('my_recent_tap_ins')
        if (res.error) next = { ...next, error: res.error.message }
        else next = { tapIns: (res.data as RecentTapInRow[]).map((row) => ({ ...row, avatar: toAvatar(row.avatar) })), error: null }
      }
      if (!cancelled) setResult(next)
    })()
    return () => {
      cancelled = true
    }
  }, [authLoading, isAuthenticated, supabase, reloads])

  return {
    tapIns: result?.tapIns ?? NO_TAP_INS,
    loading: result === null,
    error: result?.error ?? null,
    /** Re-fetch, e.g. after removing one. */
    refresh: () => setReloads((n) => n + 1),
  }
}
