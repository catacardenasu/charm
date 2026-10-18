import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { useSaveMemory } from '../../hooks/useMemories.ts'
import { compressImage } from '../../lib/image.ts'
import { Button, Modal, SPRITES } from '../ui/index.ts'
import styles from './MemoryCapture.module.css'

type Step = 'idle' | 'preparing' | 'preview' | 'saving' | 'saved'

/**
 * "Snap a memory": opens the iPhone camera, previews the photo, then saves it for this tap in.
 * iOS Safari opens the camera for <input type="file" capture>; the second input (no capture) is the
 * photo-library fallback. Nothing is shown as saved until the upload and the database row both succeed.
 */
export function MemoryCapture({ tapInId }: { tapInId: string }) {
  const saveMemory = useSaveMemory()
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
      const blob = await compressImage(file)
      setPhoto({ blob, url: URL.createObjectURL(blob) })
      setStep('preview')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read that photo.')
      setStep('idle')
    }
  }

  const onSave = async () => {
    if (!photo) return
    setError(null)
    setStep('saving')
    const result = await saveMemory(tapInId, photo.blob)
    if (result.ok) {
      setPhoto(null)
      setStep('saved')
    } else {
      setError(result.message)
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
