import { useState } from 'react'
import { Card } from './ui/index.ts'
import { cx } from './ui/cx.ts'
import styles from './InstallHint.module.css'

// "Add Charm to your Home Screen" for iPhone Safari, which has no install prompt of its own.
// Hidden once installed (the home screen app runs with navigator.standalone = true) and once
// dismissed. localStorage can throw in private mode, so every access is guarded.
const DISMISSED_KEY = 'charm:install-hint-dismissed'

/** iPhone Safari only: other iOS browsers and in-app browsers (Instagram, Google…) can't add to the home screen. */
function isIPhoneSafari() {
  const ua = navigator.userAgent
  return /iPhone/.test(ua) && /Safari\//.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS|GSA|Instagram|FBAN|FBAV|Line\//.test(ua)
}

function isInstalled() {
  return (navigator as Navigator & { standalone?: boolean }).standalone === true
}

function wasDismissed() {
  try {
    return localStorage.getItem(DISMISSED_KEY) === '1'
  } catch {
    return false
  }
}

export function InstallHint({ className }: { className?: string }) {
  const [visible, setVisible] = useState(() => isIPhoneSafari() && !isInstalled() && !wasDismissed())
  if (!visible) return null

  const dismiss = () => {
    setVisible(false)
    try {
      localStorage.setItem(DISMISSED_KEY, '1')
    } catch {
      // Storage unavailable: it just shows again next visit.
    }
  }

  return (
    <Card className={cx(styles.hint, className)}>
      <p className={styles.text}>
        Add Charm to your Home Screen: tap Share → Add to Home Screen
      </p>
      <button type="button" className={styles.close} aria-label="Dismiss" onClick={dismiss}>
        ×
      </button>
    </Card>
  )
}
