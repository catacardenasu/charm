import type { CSSProperties } from 'react'
import { cx } from './ui/cx.ts'
import type { ArcLetter } from './arcLetters.ts'
import styles from './ArcText.module.css'

export interface ArcTextProps {
  letters: ArcLetter[]
  /** Drops the letters in one after another (the tap in celebration). */
  animate?: boolean
  className?: string
}

/**
 * Letters set on a curve, as in the Figma titles. Fill a positioned parent whose font size is the
 * 64px title size (in em, so it scales with the screen). Decorative: give the title its own accessible name.
 */
export function ArcText({ letters, animate = false, className }: ArcTextProps) {
  return (
    <span className={cx(styles.arc, className)} aria-hidden="true">
      {letters.map((letter, i) => (
        <span
          key={i}
          className={cx(styles.letter, animate && styles.animate)}
          style={{ left: `${letter.x}em`, top: `${letter.y}em`, '--rotate': `${letter.rotate}deg`, '--i': i } as CSSProperties}
        >
          {letter.char}
        </span>
      ))}
    </span>
  )
}
