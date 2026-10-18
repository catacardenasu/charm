import { useAuth0 } from '@auth0/auth0-react'
import { useEffect, useState } from 'react'
import { retryOnAuthError, useSupabase } from '../lib/supabase.ts'
import type { Avatar, LeaderboardEntry } from '../types.ts'
import { toAvatar } from './usePlaza.ts'

// Me plus everyone I've tapped in with, most points first (rpc my_leaderboard,
// 010_leaderboard.sql). Empty when logged out.

type LeaderboardRow = Omit<LeaderboardEntry, 'avatar'> & { avatar: Partial<Avatar> | null }

interface LeaderboardResult {
  entries: LeaderboardEntry[]
  error: string | null
}

const NO_ENTRIES: LeaderboardEntry[] = []

export function useLeaderboard() {
  const supabase = useSupabase()
  const { isLoading: authLoading, isAuthenticated } = useAuth0()
  const [result, setResult] = useState<LeaderboardResult | null>(null)
  const [reloads, setReloads] = useState(0)

  useEffect(() => {
    if (authLoading) return
    let cancelled = false
    void (async () => {
      let next: LeaderboardResult = { entries: NO_ENTRIES, error: null }
      if (isAuthenticated) {
        const res = await retryOnAuthError(() => supabase.rpc('my_leaderboard'))
        if (res.error) next = { ...next, error: res.error.message }
        else next = { entries: (res.data as LeaderboardRow[]).map((row) => ({ ...row, avatar: toAvatar(row.avatar) })), error: null }
      }
      if (!cancelled) setResult(next)
    })()
    return () => {
      cancelled = true
    }
  }, [authLoading, isAuthenticated, supabase, reloads])

  return {
    entries: result?.entries ?? NO_ENTRIES,
    loading: result === null,
    error: result?.error ?? null,
    /** Re-fetch, e.g. after a tap in. */
    refresh: () => setReloads((n) => n + 1),
  }
}
