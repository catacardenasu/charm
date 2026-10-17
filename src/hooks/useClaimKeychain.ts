import { useCallback, useState } from 'react'
import { useSupabase } from '../lib/supabase.ts'
import type { ClaimKeychainStatus } from '../types.ts'

/** "Claim this keychain?" via claim_keychain(). Call useKeychain's refresh() after a claim. */
export function useClaimKeychain() {
  const supabase = useSupabase()
  const [claiming, setClaiming] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const claimKeychain = useCallback(
    async (code: string): Promise<ClaimKeychainStatus> => {
      setClaiming(true)
      setError(null)
      try {
        const { data, error } = await supabase.rpc('claim_keychain', { p_code: code })
        if (error) throw error
        return (data as { status: ClaimKeychainStatus }).status
      } catch (e) {
        setError(e as Error)
        throw e
      } finally {
        setClaiming(false)
      }
    },
    [supabase],
  )

  return { claimKeychain, claiming, error }
}
