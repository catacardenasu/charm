import { useCallback, useState } from 'react'
import { useSupabase } from '../lib/supabase.ts'

/**
 * "Lost my charm". Katie's deactivate function isn't in supabase/sql yet, so Settings keeps the
 * button disabled until this is true. When it lands, flip it and check the RPC name and argument
 * below match (002_keychains.sql style: p_code).
 */
export const DEACTIVATE_AVAILABLE = false

export function useDeactivateKeychain() {
  const supabase = useSupabase()
  const [deactivating, setDeactivating] = useState(false)

  const deactivateKeychain = useCallback(
    async (code: string) => {
      setDeactivating(true)
      try {
        const { error } = await supabase.rpc('deactivate_keychain', { p_code: code })
        if (error) throw error
      } finally {
        setDeactivating(false)
      }
    },
    [supabase],
  )

  return { deactivateKeychain, deactivating }
}
