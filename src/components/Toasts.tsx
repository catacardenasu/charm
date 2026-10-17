import { useEffect } from 'react'

export interface ToastMessage {
  id: string
  text: string
}

const TOAST_MS = 4000

interface Props {
  toasts: ToastMessage[]
  onDismiss: (id: string) => void
}

/** Plain toast stack, fixed to the top of the screen below the iOS safe area. */
export default function Toasts({ toasts, onDismiss }: Props) {
  return (
    <div
      aria-live="polite"
      style={{ position: 'fixed', top: 'env(safe-area-inset-top)', left: 0, right: 0, zIndex: 1000 }}
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

function Toast({ toast, onDismiss }: { toast: ToastMessage; onDismiss: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), TOAST_MS)
    return () => clearTimeout(timer)
  }, [toast.id, onDismiss])

  return (
    <div role="status" onClick={() => onDismiss(toast.id)}>
      {toast.text}
    </div>
  )
}
