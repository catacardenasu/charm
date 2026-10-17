import type { ReactNode } from 'react'
import styles from './Card.module.css'
import { cx } from './cx.ts'

/**
 * cream    – Plaza cards, prompt card, memory tiles
 * dark     – "Charmed since" / "Charm linked since" chips, reward chips
 * outlined – Profile stat boxes (dark fill, orange border)
 * panel    – Shop / Closet info panels (teal)
 */
export type CardVariant = 'cream' | 'dark' | 'outlined' | 'panel'
export type CardPadding = 'none' | 'sm' | 'md'

export interface CardProps {
  variant?: CardVariant
  padding?: CardPadding
  /** Makes the whole card a button. */
  onClick?: () => void
  disabled?: boolean
  /** Accessible name when the card is a button and its text isn't descriptive enough. */
  ariaLabel?: string
  className?: string
  children?: ReactNode
}

export function Card({
  variant = 'cream',
  padding = 'sm',
  onClick,
  disabled = false,
  ariaLabel,
  className,
  children,
}: CardProps) {
  const classes = cx(styles.card, styles[variant], styles[`pad-${padding}`], className)

  if (onClick) {
    return (
      <button
        type="button"
        className={cx(classes, styles.button)}
        onClick={onClick}
        disabled={disabled}
        aria-label={ariaLabel}
      >
        {children}
      </button>
    )
  }

  return <div className={classes}>{children}</div>
}
