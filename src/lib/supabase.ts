import { useAuth0 } from '@auth0/auth0-react'
import { createClient } from '@supabase/supabase-js'
import { useMemo } from 'react'

// Right after the Auth0 redirect, the token can briefly be unavailable or rejected.
const AUTH_RETRY_DELAY_MS = 500

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Auth0 owns login: Supabase reads the Auth0 access token on every request.
// Never call supabase.auth.signIn*.
export function useSupabase() {
  const { getAccessTokenSilently, getIdTokenClaims } = useAuth0()

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
              // Logged out: fall back to anon access. Auth0's isAuthenticated is "there are
              // cached ID token claims", read here without recreating the client on login.
              const claims = await getIdTokenClaims().catch(() => undefined)
              if (!claims) return null
              // Logged in but the token isn't ready yet: try once more.
              await sleep(AUTH_RETRY_DELAY_MS)
              try {
                return (await getAccessTokenSilently()) ?? null
              } catch {
                return null
              }
            }
          },
        },
      ),
    [getAccessTokenSilently, getIdTokenClaims],
  )
}

interface MaybeAuthError {
  code?: string
  message?: string
}

/** JWT missing/expired/invalid (PostgREST PGRST3xx), or a permission / RLS denial (42501). */
export function isAuthError(error: MaybeAuthError | null | undefined): boolean {
  if (!error) return false
  if (error.code === '42501' || error.code?.startsWith('PGRST3')) return true
  return /jwt|permission denied|row-level security|unauthori[sz]ed/i.test(error.message ?? '')
}

/**
 * Runs a Supabase request; if it fails with an auth error, waits briefly and runs it once more.
 * Pass enabled = false when logged out, where an auth error is the real answer.
 */
export async function retryOnAuthError<R extends { error: MaybeAuthError | null }>(
  request: () => PromiseLike<R>,
  enabled = true,
): Promise<R> {
  const first = await request()
  if (!enabled || !isAuthError(first.error)) return first
  await sleep(AUTH_RETRY_DELAY_MS)
  return request()
}
