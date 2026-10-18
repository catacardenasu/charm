import { useAuth0 } from '@auth0/auth0-react'
import { useEffect, useState } from 'react'
import { useSupabase } from '../lib/supabase.ts'
import type { Location } from '../types.ts'

// Every plaza with whether I've unlocked it, plus how many different people
// I've met (rpc my_locations, 004_plaza.sql). Plugs straight into
// <PlazaSwitcher locations uniquePeopleMet />.

export interface UnlockedLocation extends Location {
  unlocked: boolean
}

interface LocationsResult {
  locations: UnlockedLocation[]
  uniquePeopleMet: number
  error: string | null
}

const NO_LOCATIONS: UnlockedLocation[] = []

export function useLocations(refreshKey = 0) {
  const supabase = useSupabase()
  const { isLoading: authLoading, isAuthenticated } = useAuth0()
  const [result, setResult] = useState<LocationsResult | null>(null)
  const [reloads, setReloads] = useState(0)

  useEffect(() => {
    if (authLoading) return
    let cancelled = false
    void (async () => {
      let next: LocationsResult = { locations: NO_LOCATIONS, uniquePeopleMet: 0, error: null }
      if (isAuthenticated) {
        const res = await supabase.rpc('my_locations')
        if (res.error) {
          next = { ...next, error: res.error.message }
        } else {
          const data = res.data as { unique_people_met: number; locations: UnlockedLocation[] }
          next = { locations: data.locations, uniquePeopleMet: data.unique_people_met, error: null }
        }
      }
      if (!cancelled) setResult(next)
    })()
    return () => {
      cancelled = true
    }
  }, [authLoading, isAuthenticated, supabase, reloads, refreshKey])

  return {
    locations: result?.locations ?? NO_LOCATIONS,
    uniquePeopleMet: result?.uniquePeopleMet ?? 0,
    loading: result === null,
    error: result?.error ?? null,
    /** Re-fetch, e.g. after a tap in unlocks a new plaza. */
    refresh: () => setReloads((n) => n + 1),
  }
}
