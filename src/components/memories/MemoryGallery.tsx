import { useState } from 'react'
import type { Memory } from '../../hooks/useMemories.ts'
import { Button, Modal, SPRITES } from '../ui/index.ts'
import styles from './MemoryGallery.module.css'

interface Props {
  memories: Memory[]
  loading: boolean
  error: string | null
  onRetry: () => void
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

/** Square memory thumbnails, newest first (the list arrives sorted). Tap one to see it full size. */
export function MemoryGallery({ memories, loading, error, onRetry }: Props) {
  const [openId, setOpenId] = useState<string | null>(null)
  const open = memories.find((m) => m.id === openId)

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
        <p>{error}</p>
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
        <p className={styles.hint}>Snap a photo after your next tap in and it will live here!</p>
      </div>
    )
  }

  return (
    <>
      <ul className={styles.grid} aria-label="Memories">
        {memories.map((memory) => (
          <li key={memory.id}>
            <button
              type="button"
              className={styles.thumb}
              aria-label={`Memory from ${formatDate(memory.createdAt)}`}
              onClick={() => setOpenId(memory.id)}
            >
              <img src={memory.url} alt="" loading="lazy" draggable={false} />
            </button>
          </li>
        ))}
      </ul>

      <Modal
        open={Boolean(open)}
        onClose={() => setOpenId(null)}
        title={open ? formatDate(open.createdAt) : ''}
      >
        {open && <img className={styles.full} src={open.url} alt={`Memory from ${formatDate(open.createdAt)}`} />}
      </Modal>
    </>
  )
}
