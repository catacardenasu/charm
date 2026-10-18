import { useCallback, useState } from 'react'
import { useSupabase } from '../lib/supabase.ts'
import type { DeactivateKeychainStatus } from '../types.ts'

/** Lost keychain in /settings via deactivate_my_keychain(). The user then claims a new one through /k/:code. */
export function useDeactivateKeychain() {
  const supabase = useSupabase()
  const [deactivating, setDeactivating] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const deactivateKeychain = useCallback(
    async (code: string): Promise<DeactivateKeychainStatus> => {
      setDeactivating(true)
      setError(null)
      try {
        const { data, error } = await supabase.rpc('deactivate_my_keychain', { p_code: code })
        if (error) throw error
        return (data as { status: DeactivateKeychainStatus }).status
      } catch (e) {
        setError(e as Error)
        throw e
      } finally {
        setDeactivating(false)
      }
    },
    [supabase],
  )

  return { deactivateKeychain, deactivating, error }
}
