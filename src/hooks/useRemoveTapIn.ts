import { useCallback, useState } from 'react'
import { useSupabase } from '../lib/supabase.ts'
import type { RemoveTapInResult } from '../types.ts'

/**
 * Removes a tap in via remove_tap_in() (008_review.sql): takes back its points from
 * both people and recomputes the pair's streak. Call useRecentTapIns' refresh() after.
 */
export function useRemoveTapIn() {
  const supabase = useSupabase()
  const [removing, setRemoving] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const removeTapIn = useCallback(
    async (tapInId: string): Promise<RemoveTapInResult> => {
      setRemoving(true)
      setError(null)
      try {
        const { data, error } = await supabase.rpc('remove_tap_in', { p_tap_in_id: tapInId })
        if (error) throw error
        return data as RemoveTapInResult
      } catch (e) {
        setError(e as Error)
        throw e
      } finally {
        setRemoving(false)
      }
    },
    [supabase],
  )

  return { removeTapIn, removing, error }
}
