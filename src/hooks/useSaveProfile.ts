import { useAuth0 } from '@auth0/auth0-react'
import { useCallback, useState } from 'react'
import { useSupabase } from '../lib/supabase.ts'
import type { Profile } from '../types.ts'

/** The profile fields a user can write (001_schema.sql grants these columns, never points). */
export type ProfileFields = Pick<Profile, 'nickname' | 'major' | 'year' | 'interests' | 'greeting' | 'avatar'>

/** Creates the user's profile, or updates it if it already exists. */
export function useSaveProfile() {
  const { user } = useAuth0()
  const sub = user?.sub
  const supabase = useSupabase()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const saveProfile = useCallback(
    async (fields: ProfileFields): Promise<Profile> => {
      if (!sub) throw new Error('Not logged in')
      setSaving(true)
      setError(null)
      try {
        const updated = await supabase.from('profiles').update(fields).eq('id', sub).select()
        if (updated.error) throw updated.error
        if (updated.data.length > 0) return updated.data[0] as Profile

        // No row yet: id defaults to the token's sub.
        const inserted = await supabase.from('profiles').insert(fields).select().single()
        if (inserted.error) throw inserted.error
        return inserted.data as Profile
      } catch (e) {
        setError(e as Error)
        throw e
      } finally {
        setSaving(false)
      }
    },
    [supabase, sub],
  )

  return { saveProfile, saving, error }
}
