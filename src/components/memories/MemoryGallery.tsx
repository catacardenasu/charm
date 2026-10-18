import { useCallback, useEffect, useRef, useState } from 'react'
import type { Memory } from '../../types.ts'
import { Button, Modal, SPRITES } from '../ui/index.ts'
import styles from './MemoryGallery.module.css'

interface Props {
  memories: Memory[]
  loading: boolean
  /** Any message means the list couldn't load; the text itself is not shown. */
  error: string | null
  /** Re-fetches the list and re-signs every photo URL. */
  onRetry: () => void
  /** Deletes my photo for a tap in. Only offered on photos I took. */
  onDelete: (tapInId: string) => Promise<void>
  /** Empty-state line under "No memories yet." */
  emptyHint?: string
}

// Signed URLs only last a few minutes. A photo that fails to load (or a tab that was asleep) asks for fresh ones,
// at most this often, so a photo that is really gone can't cause a refresh loop.
const RESIGN_COOLDOWN_MS = 15_000

// `day` is a plain 'YYYY-MM-DD' (America/New_York): noon keeps it on the same date in any time zone.
const formatDay = (day: string) =>
  new Date(`${day}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

const describe = (memory: Memory) => `Memory with ${memory.other_nickname}, ${formatDay(memory.day)}`

/** Square memory thumbnails, newest first (the list arrives sorted). Tap one to see it full size. */
export function MemoryGallery({
  memories,
  loading,
  error,
  onRetry,
  onDelete,
  emptyHint = 'Snap a photo after you Charm someone and it will live here!',
}: Props) {
  const [openId, setOpenId] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(false)
  const lastResign = useRef(0)
  const open = memories.find((m) => m.id === openId)

  const resign = useCallback(() => {
    const now = Date.now()
    if (now - lastResign.current < RESIGN_COOLDOWN_MS) return
    lastResign.current = now
    onRetry()
  }, [onRetry])

  // Coming back to the app after the phone was locked: the URLs may have expired.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') resign()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [resign])

  const closeOpen = () => {
    setOpenId(null)
    setConfirming(false)
    setDeleteError(false)
  }

  const confirmDelete = async () => {
    if (!open) return
    setDeleting(true)
    setDeleteError(false)
    try {
      await onDelete(open.tap_in_id)
      closeOpen()
    } catch {
      setDeleteError(true)
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className={styles.grid} aria-busy="true" aria-label="Loading memories">
        {Array.from({ length: 6 }, (_, i) => (
          <span key={i} className={styles.skeleton} />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.message} role="alert">
        <p>Couldn’t load your memories.</p>
        <Button variant="pill" onClick={onRetry}>
          Try again
        </Button>
      </div>
    )
  }

  if (memories.length === 0) {
    return (
      <div className={styles.message}>
        <img src={SPRITES.camera} alt="" width={60} height={48} className={styles.cameraArt} />
        <p>No memories yet.</p>
        <p className={styles.hint}>{emptyHint}</p>
      </div>
    )
  }

  return (
    <>
      <ul className={styles.grid} aria-label="Memories">
        {memories.map((memory) => (
          <li key={memory.id}>
            {memory.url ? (
              <button type="button" className={styles.thumb} aria-label={describe(memory)} onClick={() => setOpenId(memory.id)}>
                <img src={memory.url} alt="" loading="lazy" draggable={false} onError={resign} />
              </button>
            ) : (
              // Signing failed: the file is missing or the link expired. Tapping asks for a fresh link.
              <button type="button" className={styles.thumb} aria-label={`${describe(memory)} (couldn’t load, tap to retry)`} onClick={onRetry}>
                <span className={styles.unavailable} aria-hidden="true">
                  Tap to retry
                </span>
              </button>
            )}
          </li>
        ))}
      </ul>

      <Modal
        open={Boolean(open?.url)}
        onClose={closeOpen}
        dismissible={!deleting}
        title={open ? `With ${open.other_nickname}` : ''}
        actions={
          open?.uploaded_by_me ? (
            confirming ? (
              <>
                <Button variant="secondary" size="md" onClick={() => setConfirming(false)} disabled={deleting}>
                  Keep
                </Button>
                <Button size="md" onClick={confirmDelete} disabled={deleting}>
                  {deleting ? 'Deleting…' : 'Delete'}
                </Button>
              </>
            ) : (
              <Button variant="secondary" size="md" onClick={() => setConfirming(true)}>
                Delete photo
              </Button>
            )
          ) : undefined
        }
      >
        {open?.url && (
          <>
            <img className={styles.full} src={open.url} alt={describe(open)} onError={resign} />
            <p className={styles.date}>{formatDay(open.day)}</p>
            {confirming && <p className={styles.date}>Delete this photo for good?</p>}
            {deleteError && (
              <p role="alert" className={styles.date}>
                Couldn’t delete it. Try again.
              </p>
            )}
          </>
        )}
      </Modal>
    </>
  )
}
