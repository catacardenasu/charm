import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import styles from './Modal.module.css'

export interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children?: ReactNode
  /** Buttons along the bottom, e.g. <Button variant="secondary">Cancel</Button><Button>OK</Button>. */
  actions?: ReactNode
  /** Tapping the backdrop or pressing Escape closes it. Default true. */
  dismissible?: boolean
}

/** Pop-up card over a dimmed screen. Not in Figma yet, so it reuses the card, type and button styles. */
export function Modal({ open, onClose, title, children, actions, dismissible = true }: ModalProps) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const previouslyFocused = document.activeElement as HTMLElement | null
    panelRef.current?.focus()
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && dismissible) onClose()
    }
    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = overflow
      previouslyFocused?.focus()
    }
  }, [open, dismissible, onClose])

  if (!open) return null

  return createPortal(
    <div className={styles.overlay} onClick={dismissible ? onClose : undefined}>
      <div
        ref={panelRef}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        {dismissible && (
          <button type="button" className={styles.close} aria-label="Close" onClick={onClose}>
            <span aria-hidden="true">x</span>
          </button>
        )}
        <h2 id={titleId} className={styles.title}>
          {title}
        </h2>
        {children && <div className={styles.body}>{children}</div>}
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
    </div>,
    document.body,
  )
}
