import { useAuth0 } from '@auth0/auth0-react'
import { useEffect, useState } from 'react'
import { useSupabase } from '../lib/supabase.ts'
import type { Avatar, PersonDetail } from '../types.ts'
import { toAvatar } from './usePlaza.ts'

// Avatar detail for /u/:userId (rpc person_detail, 006_helpers.sql).
// `person` is null when logged out or when we've never met.

type PersonRow = Omit<PersonDetail, 'profile'> & {
  profile: Omit<PersonDetail['profile'], 'avatar'> & { avatar: Partial<Avatar> | null }
}

interface PersonResult {
  key: string
  person: PersonDetail | null
  error: string | null
}

export function usePerson(userId: string | undefined) {
  const supabase = useSupabase()
  const { isLoading: authLoading, isAuthenticated } = useAuth0()
  const [result, setResult] = useState<PersonResult | null>(null)
  const [reloads, setReloads] = useState(0)

  useEffect(() => {
    if (authLoading || !userId) return
    let cancelled = false
    void (async () => {
      let person: PersonDetail | null = null
      let error: string | null = null
      if (isAuthenticated) {
        const res = await supabase.rpc('person_detail', { p_user_id: userId })
        if (res.error) {
          error = res.error.message
        } else if (res.data) {
          const row = res.data as PersonRow
          person = { ...row, profile: { ...row.profile, avatar: toAvatar(row.profile.avatar) } }
        }
      }
      if (!cancelled) setResult({ key: userId, person, error })
    })()
    return () => {
      cancelled = true
    }
  }, [authLoading, isAuthenticated, supabase, userId, reloads])

  const current = userId && result?.key === userId ? result : null
  return {
    person: current?.person ?? null,
    loading: !!userId && !current,
    error: current?.error ?? null,
    /** Re-fetch, e.g. after a tap in. */
    refresh: () => setReloads((n) => n + 1),
  }
}
