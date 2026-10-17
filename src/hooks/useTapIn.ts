import { useAuth0 } from '@auth0/auth0-react'
import { useCallback, useRef, useState } from 'react'
import { useSupabase } from '../lib/supabase.ts'
import type { TapInResult } from '../types.ts'

// The server falls back to the backup bank after 3s, so this only catches a hung request.
const PROMPT_TIMEOUT_MS = 10_000

export type PromptStatus = 'idle' | 'loading' | 'ready' | 'failed'

/**
 * Taps in with a keychain. tapIn(code) resolves as soon as the tap in is saved;
 * the prompt is fetched afterwards and shows up in `prompt` (it never blocks the tap in).
 */
export function useTapIn() {
  const supabase = useSupabase()
  const { getAccessTokenSilently } = useAuth0()
  const [result, setResult] = useState<TapInResult | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [prompt, setPrompt] = useState<string | null>(null)
  const [promptStatus, setPromptStatus] = useState<PromptStatus>('idle')

  // One request per code per mount, so StrictMode's double effect doesn't tap in twice
  // (the second call would come back 'already_today' and overwrite the real result).
  const inFlight = useRef(new Map<string, Promise<TapInResult>>())

  const fetchPrompt = useCallback(
    async (tapInId: string) => {
      setPromptStatus('loading')
      try {
        const token = await getAccessTokenSilently()
        const res = await fetch('/api/prompt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ tap_in_id: tapInId }),
          signal: AbortSignal.timeout(PROMPT_TIMEOUT_MS),
        })
        if (!res.ok) throw new Error(`/api/prompt failed: ${res.status}`)
        const { prompt } = (await res.json()) as { prompt?: string }
        if (!prompt) throw new Error('/api/prompt returned no prompt')
        setPrompt(prompt)
        setPromptStatus('ready')
      } catch {
        setPromptStatus('failed')
      }
    },
    [getAccessTokenSilently],
  )

  const tapIn = useCallback(
    (code: string): Promise<TapInResult> => {
      const existing = inFlight.current.get(code)
      if (existing) return existing

      const request = (async () => {
        setError(null)
        const { data, error } = await supabase.rpc('tap_in', { code })
        if (error) throw error
        const tapInResult = data as TapInResult
        setResult(tapInResult)
        void fetchPrompt(tapInResult.tap_in_id)
        return tapInResult
      })()

      inFlight.current.set(code, request)
      request.catch((e: Error) => {
        inFlight.current.delete(code) // allow a retry
        setError(e)
      })
      return request
    },
    [supabase, fetchPrompt],
  )

  return { tapIn, result, error, prompt, promptStatus }
}
