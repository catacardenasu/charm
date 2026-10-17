import type { ReactNode } from 'react'
import styles from './SpeechBubble.module.css'
import { cx } from './cx.ts'
import { BubbleTail } from './icons.tsx'

export interface SpeechBubbleProps {
  children: ReactNode
  className?: string
}

/** The greeting bubble that sits to the right of an avatar, with its tail pointing down-left. */
export function SpeechBubble({ children, className }: SpeechBubbleProps) {
  return (
    <div className={cx(styles.bubble, className)}>
      <BubbleTail className={styles.tail} />
      <p className={styles.body}>{children}</p>
    </div>
  )
}
