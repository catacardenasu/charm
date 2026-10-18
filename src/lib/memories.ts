import type { SupabaseClient } from '@supabase/supabase-js'
import type { Memory, MemoryEntry, MemoryRow } from '../types.ts'

// Memory photos (supabase/sql/012_memories.sql). Pass the client from useSupabase(),
// which sends the Auth0 token, so Storage RLS knows who's asking.
//
//   upload:  compressPhoto(file) → uploadMemory(supabase, { tapInId, uploaderId, photo })
//   view:    listMemories(supabase, otherUserId?)   (signed URLs, valid 5 minutes)
//   delete:  deleteMemory(supabase, { tapInId, uploaderId })
//
// uploaderId is the logged-in user's Auth0 `sub` (useAuth0().user.sub). Storage only
// accepts your own path, so passing someone else's id just fails.

export const MEMORIES_BUCKET = 'memories'
/** Same limit as the bucket. */
export const MEMORY_MAX_BYTES = 5 * 1024 * 1024
/**
 * How long a signed URL works. A URL keeps working until it expires, even if the tap in
 * is removed in the meantime, so keep this short and re-sign (listMemories) when needed.
 */
export const MEMORY_URL_TTL_SECONDS = 5 * 60

/** Storage rejects '|', so the Auth0 sub is written with ':' (matches memory_user_key() in SQL). */
export function memoryUserKey(userId: string): string {
  return userId.replace(/\|/g, ':')
}

/** Where a person's photo for a tap in lives in the bucket (matches memory_object_name() in SQL). */
export function memoryPath(tapInId: string, uploaderId: string): string {
  return `${tapInId}/${memoryUserKey(uploaderId)}.jpg`
}

/**
 * Re-encodes any photo the browser can show (including iPhone HEIC) as a JPEG no bigger than
 * maxDimension on its longest side, lowering quality until it fits MEMORY_MAX_BYTES.
 */
export async function compressPhoto(file: Blob, { maxDimension = 1600, quality = 0.82 } = {}): Promise<Blob> {
  const url = URL.createObjectURL(file)
  try {
    const image = new Image()
    image.decoding = 'async'
    image.src = url
    await image.decode()

    const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Could not process the photo.')
    context.drawImage(image, 0, 0, canvas.width, canvas.height)

    for (let q = quality; q >= 0.4; q -= 0.12) {
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', q))
      if (blob && blob.size <= MEMORY_MAX_BYTES) return blob
    }
    throw new Error('This photo is too large to save, even after compressing it.')
  } finally {
    URL.revokeObjectURL(url)
  }
}

/**
 * Uploads (or replaces) my photo for a tap in, then saves the memory row.
 * `photo` must already be a JPEG of at most 5 MB: run it through compressPhoto() first.
 */
export async function uploadMemory(
  supabase: SupabaseClient,
  { tapInId, uploaderId, photo }: { tapInId: string; uploaderId: string; photo: Blob },
): Promise<MemoryRow> {
  if (photo.type !== 'image/jpeg') throw new Error('Memories must be JPEG photos. Use compressPhoto() first.')
  if (photo.size > MEMORY_MAX_BYTES) throw new Error('Memories must be 5 MB or smaller.')

  const path = memoryPath(tapInId, uploaderId)
  const upload = await supabase.storage
    .from(MEMORIES_BUCKET)
    .upload(path, photo, { contentType: 'image/jpeg', upsert: true })
  if (upload.error) throw upload.error

  const { data, error } = await supabase.rpc('save_memory', { p_tap_in_id: tapInId })
  if (error) throw error
  return data as MemoryRow
}

/** Signed URLs for memories, in one request. Failed ones get url: null. */
export async function signMemories(supabase: SupabaseClient, entries: MemoryEntry[]): Promise<Memory[]> {
  if (entries.length === 0) return []
  const { data, error } = await supabase.storage
    .from(MEMORIES_BUCKET)
    .createSignedUrls(
      entries.map((e) => e.storage_path),
      MEMORY_URL_TTL_SECONDS,
    )
  if (error) throw error
  const urls = new Map(data.map((d) => [d.path, d.error ? null : d.signedUrl]))
  return entries.map((e) => ({ ...e, url: urls.get(e.storage_path) ?? null }))
}

/**
 * My memories, newest first, with signed URLs. Pass a user id for the memories I share
 * with that person (/u/:userId), or leave it out for all of mine (Profile → Memories).
 * Memories from removed tap ins are never returned.
 */
export async function listMemories(supabase: SupabaseClient, otherUserId?: string): Promise<Memory[]> {
  const { data, error } = await supabase.rpc('my_memories', { p_other_user_id: otherUserId ?? null })
  if (error) throw error
  return signMemories(supabase, data as MemoryEntry[])
}

/** Deletes my photo and memory row for a tap in. */
export async function deleteMemory(
  supabase: SupabaseClient,
  { tapInId, uploaderId }: { tapInId: string; uploaderId: string },
): Promise<void> {
  const removed = await supabase.storage.from(MEMORIES_BUCKET).remove([memoryPath(tapInId, uploaderId)])
  if (removed.error) throw removed.error

  const { error } = await supabase.from('memories').delete().eq('tap_in_id', tapInId).eq('uploader_id', uploaderId)
  if (error) throw error
}
