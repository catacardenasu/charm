import { useAuth0 } from '@auth0/auth0-react'
import { useEffect, useState } from 'react'
import { useSupabase } from '../lib/supabase.ts'
import type { Avatar, PlazaPerson } from '../types.ts'

// Everyone I've met, for the plaza at `locationId` (rpc my_plaza, 004_plaza.sql).
// Empty when logged out or when that plaza is still locked.

interface PlazaRow {
  id: string
  nickname: string
  avatar: Partial<Avatar> | null
  greeting: string | null
  streak_weeks: number
  at_risk: boolean
  last_met: string
}

// Profiles made before onboarding have an empty avatar ({}); fill in a default
// Charmling so the plaza never renders a broken sprite.
const DEFAULT_AVATAR: Avatar = {
  skin: 'pale',
  hairStyle: 1,
  hairColor: 'brown',
  outfit: 'basic-01',
  hat: null,
  accessory: null,
}

export function toAvatar(avatar: Partial<Avatar> | null | undefined): Avatar {
  return { ...DEFAULT_AVATAR, ...avatar }
}

function toPerson(row: PlazaRow): PlazaPerson {
  return {
    id: row.id,
    nickname: row.nickname,
    avatar: toAvatar(row.avatar),
    streak_weeks: row.streak_weeks,
    at_risk: row.at_risk,
    greeting: row.greeting,
    last_met: row.last_met,
  }
}

// One shared empty array, so the scene doesn't restart while loading.
const NO_PEOPLE: PlazaPerson[] = []

export function usePlaza(locationId: string, refreshKey = 0) {
  const supabase = useSupabase()
  const { isLoading: authLoading, isAuthenticated } = useAuth0()
  const [result, setResult] = useState<{ key: string; people: PlazaPerson[]; error: string | null } | null>(null)
  const [reloads, setReloads] = useState(0)

  useEffect(() => {
    if (authLoading) return
    let cancelled = false
    void (async () => {
      let people = NO_PEOPLE
      let error: string | null = null
      if (isAuthenticated) {
        const res = await supabase.rpc('my_plaza', { p_location_id: locationId })
        if (res.error) error = res.error.message
        else people = (res.data as PlazaRow[]).map(toPerson)
      }
      if (!cancelled) setResult({ key: locationId, people, error })
    })()
    return () => {
      cancelled = true
    }
  }, [authLoading, isAuthenticated, supabase, locationId, reloads, refreshKey])

  const loading = result?.key !== locationId
  return {
    /** Same array between renders until the data changes. */
    people: loading ? NO_PEOPLE : result.people,
    loading,
    error: loading ? null : result.error,
    /** Re-fetch, e.g. after a tap in. */
    refresh: () => setReloads((n) => n + 1),
  }
}
