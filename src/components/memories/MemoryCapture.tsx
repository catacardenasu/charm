import { useAuth0 } from '@auth0/auth0-react'
import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { compressPhoto, uploadMemory } from '../../lib/memories.ts'
import { useSupabase } from '../../lib/supabase.ts'
import { Button, Modal, SPRITES } from '../ui/index.ts'
import styles from './MemoryCapture.module.css'

type Step = 'idle' | 'preparing' | 'preview' | 'saving' | 'saved'

/**
 * "Snap a memory": opens the iPhone camera, previews the photo, then saves it for this tap in.
 * iOS Safari opens the camera for <input type="file" capture>; the second input (no capture) is the
 * photo-library fallback. Nothing is shown as saved until the upload and the database row both succeed.
 * Storage and the save_memory() call are Katie's (src/lib/memories.ts); this is only the UI around them.
 */
export function MemoryCapture({ tapInId }: { tapInId: string }) {
  const supabase = useSupabase()
  const { user } = useAuth0()
  const cameraInput = useRef<HTMLInputElement>(null)
  const libraryInput = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<Step>('idle')
  const [photo, setPhoto] = useState<{ blob: Blob; url: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!photo) return
    return () => URL.revokeObjectURL(photo.url)
  }, [photo])

  const reset = () => {
    setPhoto(null)
    setError(null)
    setStep('idle')
  }

  const onPick = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = '' // so picking the same photo again still fires onChange
    if (!file) return // cancelled in the camera sheet
    setError(null)
    setStep('preparing')
    try {
      // Re-encodes as a JPEG (iPhone HEIC included) under the bucket's 5 MB limit, so what you preview is what's uploaded.
      const blob = await compressPhoto(file)
      setPhoto({ blob, url: URL.createObjectURL(blob) })
      setStep('preview')
    } catch (e) {
      const tooLarge = e instanceof Error && /too large/i.test(e.message)
      setError(tooLarge ? 'That photo is too large to save. Try another.' : 'Couldn’t read that photo. Try another.')
      setStep('idle')
    }
  }

  const onSave = async () => {
    if (!photo) return
    if (!user?.sub) {
      setError('Log in to save memories.')
      return
    }
    setError(null)
    setStep('saving')
    try {
      await uploadMemory(supabase, { tapInId, uploaderId: user.sub, photo: photo.blob })
      setPhoto(null)
      setStep('saved')
    } catch {
      setError('Couldn’t save your memory. Check your connection and try again.')
      setStep('preview')
    }
  }

  if (step === 'saved') {
    return (
      <p className={styles.saved} role="status">
        Memory saved! Find it on your profile.
      </p>
    )
  }

  const busy = step === 'preparing' || step === 'saving'

  return (
    <div className={styles.wrap}>
      <input
        ref={cameraInput}
        type="file"
        accept="image/*"
        capture="environment"
        className={styles.input}
        onChange={onPick}
        tabIndex={-1}
        aria-hidden="true"
      />
      <input
        ref={libraryInput}
        type="file"
        accept="image/*"
        className={styles.input}
        onChange={onPick}
        tabIndex={-1}
        aria-hidden="true"
      />

      <Button
        variant="pill"
        disabled={busy}
        onClick={() => cameraInput.current?.click()}
        icon={<img src={SPRITES.camera} alt="" width={30} height={24} />}
      >
        {step === 'preparing' ? 'Getting your photo…' : 'Snap a memory'}
      </Button>
      <button type="button" className={styles.library} disabled={busy} onClick={() => libraryInput.current?.click()}>
        or choose a photo
      </button>
      {error && step === 'idle' && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}

      <Modal
        open={step === 'preview' || step === 'saving'}
        onClose={reset}
        title="Keep this memory?"
        dismissible={step !== 'saving'}
        actions={
          <>
            <Button variant="secondary" size="md" onClick={reset} disabled={step === 'saving'}>
              Cancel
            </Button>
            <Button size="md" onClick={onSave} disabled={step === 'saving'}>
              {step === 'saving' ? 'Saving…' : 'Save'}
            </Button>
          </>
        }
      >
        {photo && <img className={styles.preview} src={photo.url} alt="Your photo, before saving" />}
        {error && (
          <p role="alert" className={styles.error}>
            {error}
          </p>
        )}
      </Modal>
    </div>
  )
}
