import { useAuth0 } from '@auth0/auth0-react'
import { useCallback, useEffect, useState } from 'react'
import { useSupabase } from '../lib/supabase.ts'

/**
 * Frontend side of memory photos. Everything that touches Supabase for memories lives in this file,
 * so Katie's backend only has to be reconciled here.
 *
 * Contract (CLAUDE.md + supabase/sql/001_schema.sql), all of it TO CONFIRM against Katie's backend:
 *  - Private Storage bucket `memories`, object path `{tap_in_id}/{uploader_id}.jpg`.
 *  - Table `memories` (id, tap_in_id, uploader_id, storage_path, created_at), unique per (tap_in_id, uploader_id).
 *    `storage_path` follows the schema comment: `memories/{tap_in_id}/{uploader_id}.jpg`.
 *  - Reads: select from `memories` (RLS limits it to my tap ins), then signed URLs for the photos.
 *  - Writes: upload the JPEG, then insert the row. Nothing is reported as saved unless both succeed.
 */
const BUCKET = 'memories'
const SIGNED_URL_SECONDS = 60 * 60
const GALLERY_LIMIT = 60

/** Object path inside the bucket. Auth0 ids contain "|"; if Storage rejects that, change it here only. */
const objectPath = (tapInId: string, uploaderId: string) => `${tapInId}/${uploaderId}.jpg`
/** The value stored in memories.storage_path. */
const storagePathColumn = (path: string) => `${BUCKET}/${path}`
/** Back to a bucket-relative path. */
const fromStoragePathColumn = (column: string) => column.replace(new RegExp(`^${BUCKET}/`), '')

interface MemoryRow {
  id: string
  tap_in_id: string
  uploader_id: string
  storage_path: string
  created_at: string
}

export interface Memory {
  id: string
  tapInId: string
  uploaderId: string
  createdAt: string
  /** Short-lived signed URL. */
  url: string
}

export function useMemories(enabled = true) {
  const supabase = useSupabase()
  const { user, isAuthenticated } = useAuth0()
  const sub = isAuthenticated ? user?.sub : undefined
  const [version, setVersion] = useState(0)
  const [loaded, setLoaded] = useState<{ key: string; memories: Memory[]; error: string | null } | null>(null)

  const key = enabled && sub ? `${sub}:${version}` : null

  useEffect(() => {
    if (!key) return
    let cancelled = false

    async function load() {
      const { data, error } = await supabase
        .from('memories')
        .select('id, tap_in_id, uploader_id, storage_path, created_at')
        .order('created_at', { ascending: false })
        .limit(GALLERY_LIMIT)
      if (error) throw error
      const rows = (data ?? []) as MemoryRow[]
      if (rows.length === 0) return []

      const paths = rows.map((row) => fromStoragePathColumn(row.storage_path))
      const signed = await supabase.storage.from(BUCKET).createSignedUrls(paths, SIGNED_URL_SECONDS)
      if (signed.error) throw signed.error
      const urlByPath = new Map(signed.data.map((entry) => [entry.path, entry.signedUrl]))

      // A photo that can't be signed (missing file, no access) is left out rather than shown broken.
      return rows.flatMap((row): Memory[] => {
        const url = urlByPath.get(fromStoragePathColumn(row.storage_path))
        return url
          ? [{ id: row.id, tapInId: row.tap_in_id, uploaderId: row.uploader_id, createdAt: row.created_at, url }]
          : []
      })
    }

    load().then(
      (memories) => {
        if (!cancelled) setLoaded({ key, memories, error: null })
      },
      () => {
        if (!cancelled) setLoaded({ key, memories: [], error: 'Couldn’t load your memories.' })
      },
    )
    return () => {
      cancelled = true
    }
  }, [supabase, key])

  const reload = useCallback(() => setVersion((v) => v + 1), [])
  const current = loaded?.key === key ? loaded : null

  return {
    memories: current?.memories ?? [],
    loading: key !== null && !current,
    error: current?.error ?? null,
    reload,
  }
}

export type SaveMemoryResult = { ok: true } | { ok: false; message: string }

/** Uploads one compressed photo for a tap in and records it. Resolves with ok: false and a message on any failure. */
export function useSaveMemory() {
  const supabase = useSupabase()
  const { user } = useAuth0()
  const sub = user?.sub

  return useCallback(
    async (tapInId: string, photo: Blob): Promise<SaveMemoryResult> => {
      if (!sub) return { ok: false, message: 'Log in to save memories.' }
      const path = objectPath(tapInId, sub)

      const upload = await supabase.storage.from(BUCKET).upload(path, photo, { contentType: 'image/jpeg' })
      // A file that already exists means an earlier try uploaded but didn't record it: go on to the insert.
      if (upload.error && !/already exists|duplicate/i.test(upload.error.message)) {
        return { ok: false, message: 'Couldn’t upload your photo. Try again.' }
      }

      const insert = await supabase
        .from('memories')
        .insert({ tap_in_id: tapInId, uploader_id: sub, storage_path: storagePathColumn(path) })
      if (insert.error) {
        const saved = insert.error.code === '23505'
        return {
          ok: false,
          message: saved ? 'You already saved a memory for this tap in.' : 'Couldn’t save your memory. Try again.',
        }
      }
      return { ok: true }
    },
    [supabase, sub],
  )
}
