import { useAuth0 } from '@auth0/auth0-react'
import { createClient } from '@supabase/supabase-js'
import { useMemo } from 'react'

// Auth0 owns login: Supabase reads the Auth0 access token on every request.
// Never call supabase.auth.signIn*.
export function useSupabase() {
  const { getAccessTokenSilently } = useAuth0()

  return useMemo(
    () =>
      createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY,
        {
          accessToken: async () => {
            try {
              return (await getAccessTokenSilently()) ?? null
            } catch {
              // Logged out: fall back to anon access.
              return null
            }
          },
        },
      ),
    [getAccessTokenSilently],
  )
}
