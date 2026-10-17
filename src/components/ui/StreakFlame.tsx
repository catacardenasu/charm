import styles from './StreakFlame.module.css'
import { cx } from './cx.ts'
import { SPRITES } from './sprites.ts'

/** orange on cream/teal backgrounds, dark on orange backgrounds. */
export type StreakFlameTone = 'orange' | 'dark'

/**
 * sm = 17x22 (streak rows)   md = 18x23 (streak badge)
 * lg = 46x59 (Charmling profile)   xl = 56x72 (Streaks header)
 */
export type StreakFlameSize = 'sm' | 'md' | 'lg' | 'xl'

export interface StreakFlameProps {
  tone?: StreakFlameTone
  size?: StreakFlameSize
  /** Shows the streak number to the left of the flame. */
  count?: number
  className?: string
}

export function StreakFlame({ tone = 'orange', size = 'sm', count, className }: StreakFlameProps) {
  const src = tone === 'orange' ? SPRITES.flameOrange : SPRITES.flameDark

  return (
    <span
      className={cx(styles.flame, styles[size], styles[tone], className)}
      role={count != null ? 'img' : undefined}
      aria-label={count != null ? `${count} week streak` : undefined}
      aria-hidden={count == null ? true : undefined}
    >
      {count != null && (
        <span className={styles.count} aria-hidden="true">
          {count}
        </span>
      )}
      <img className={styles.icon} src={src} alt="" />
    </span>
  )
}
