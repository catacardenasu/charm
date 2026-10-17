import type { ButtonHTMLAttributes, ReactNode } from 'react'
import styles from './Button.module.css'
import { cx } from './cx.ts'

/**
 * primary   – orange fill (Next, Done, Log In, Buy)
 * secondary – cream outline (Back, See Blake)
 * social    – darker cream fill with a leading logo (Continue with Google)
 * pill      – rounded cream outline in the body font (Snap a memory)
 */
export type ButtonVariant = 'primary' | 'secondary' | 'social' | 'pill'

/** lg = 53px tall, 32px label (footer buttons). md = 44px tall, 20px label. */
export type ButtonSize = 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  /** Leading icon, e.g. the Google logo or camera. */
  icon?: ReactNode
  /** Right-aligned content, e.g. the price on the Buy button. */
  trailing?: ReactNode
  fullWidth?: boolean
}

export function Button({
  variant = 'primary',
  size = 'lg',
  icon,
  trailing,
  fullWidth = false,
  type = 'button',
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cx(
        styles.button,
        styles[variant],
        variant !== 'social' && variant !== 'pill' && styles[size],
        fullWidth && styles.fullWidth,
        trailing != null && styles.withTrailing,
        className,
      )}
      {...rest}
    >
      {icon && <span className={styles.icon}>{icon}</span>}
      <span className={styles.label}>{children}</span>
      {trailing != null && <span className={styles.trailing}>{trailing}</span>}
    </button>
  )
}
