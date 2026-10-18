import { useAuth0 } from '@auth0/auth0-react'
import { useCallback, useEffect, useState } from 'react'
import { compressPhoto, deleteMemory, listMemories, MEMORY_URL_TTL_SECONDS, uploadMemory } from '../lib/memories.ts'
import { useSupabase } from '../lib/supabase.ts'
import type { Memory, MemoryRow } from '../types.ts'

// Memories for the Profile tab (no argument) or "Memories Together" on /u/:userId
// (pass their id), plus save/delete for the camera. Signed URLs are refreshed
// before they expire, so <img src={memory.url}> keeps working while the page is open.

// Re-sign a minute before the URLs expire.
const RESIGN_MS = (MEMORY_URL_TTL_SECONDS - 60) * 1000

const NO_MEMORIES: Memory[] = []

export function useMemories(otherUserId?: string) {
  const supabase = useSupabase()
  const { isLoading: authLoading, isAuthenticated, user } = useAuth0()
  const me = isAuthenticated ? user?.sub : undefined
  const [result, setResult] = useState<{ key: string; memories: Memory[]; error: string | null } | null>(null)
  const [reloads, setReloads] = useState(0)
  const [saving, setSaving] = useState(false)

  const key = `${me ?? ''}:${otherUserId ?? ''}`

  useEffect(() => {
    if (authLoading) return
    let cancelled = false
    const load = async () => {
      let memories = NO_MEMORIES
      let error: string | null = null
      if (me) {
        try {
          memories = await listMemories(supabase, otherUserId)
        } catch (e) {
          error = (e as { message?: string }).message ?? 'Couldn’t load memories.'
        }
      }
      if (!cancelled) setResult({ key, memories, error })
    }
    void load()
    const timer = me ? window.setInterval(() => void load(), RESIGN_MS) : undefined
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [authLoading, me, supabase, otherUserId, key, reloads])

  const refresh = useCallback(() => setReloads((n) => n + 1), [])

  /** Compresses and saves my photo for a tap in (replacing any earlier one), then reloads. */
  const saveMemory = useCallback(
    async (tapInId: string, photo: Blob): Promise<MemoryRow> => {
      if (!me) throw new Error('Log in to save memories.')
      setSaving(true)
      try {
        const row = await uploadMemory(supabase, { tapInId, uploaderId: me, photo: await compressPhoto(photo) })
        refresh()
        return row
      } finally {
        setSaving(false)
      }
    },
    [supabase, me, refresh],
  )

  /** Deletes my photo for a tap in, then reloads. */
  const removeMemory = useCallback(
    async (tapInId: string): Promise<void> => {
      if (!me) throw new Error('Log in to delete memories.')
      await deleteMemory(supabase, { tapInId, uploaderId: me })
      refresh()
    },
    [supabase, me, refresh],
  )

  const current = result?.key === key ? result : null
  return {
    memories: current?.memories ?? NO_MEMORIES,
    loading: !current,
    error: current?.error ?? null,
    refresh,
    saveMemory,
    removeMemory,
    saving,
  }
}
