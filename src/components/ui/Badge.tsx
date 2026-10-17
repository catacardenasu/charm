import type { ReactNode } from 'react'
import styles from './Badge.module.css'
import { cx } from './cx.ts'
import { SPRITES } from './sprites.ts'

/**
 * label  – dark pill: Owned / Trying (sm), Trying on / Mascot (md)
 * status – orange box on Plaza cards: Unlocked / 0/40
 * streak – orange pill with a flame: "4 day streak"
 * reward – dark box on the tap in screen: +10 Points / +5 Coins
 */
export type BadgeVariant = 'label' | 'status' | 'streak' | 'reward'
export type BadgeSize = 'sm' | 'md'

export interface BadgeProps {
  variant?: BadgeVariant
  /** Only affects the label variant. */
  size?: BadgeSize
  /** Leading icon. The streak variant shows the flame by default. */
  icon?: ReactNode
  className?: string
  children: ReactNode
}

export function Badge({ variant = 'label', size = 'md', icon, className, children }: BadgeProps) {
  const leading =
    icon ?? (variant === 'streak' ? <img className={styles.flame} src={SPRITES.flameDark} alt="" /> : null)

  return (
    <span className={cx(styles.badge, styles[variant], variant === 'label' && styles[size], className)}>
      {leading}
      {children}
    </span>
  )
}
