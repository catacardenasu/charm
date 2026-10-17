import styles from './InterestTag.module.css'
import { cx } from './cx.ts'

/** md = 48px (Interests picker, tap in screen). sm = 38px (Profile interests panel). */
export type InterestTagSize = 'md' | 'sm'

export interface InterestTagProps {
  label: string
  selected?: boolean
  size?: InterestTagSize
  disabled?: boolean
  /** Makes the tag a toggle button (Interests picker). */
  onToggle?: (selected: boolean) => void
  /** Shows the "x" and makes the tag a remove button (selected strip at the top of Interests). */
  onRemove?: () => void
  className?: string
}

export function InterestTag({
  label,
  selected = false,
  size = 'md',
  disabled = false,
  onToggle,
  onRemove,
  className,
}: InterestTagProps) {
  const classes = cx(styles.tag, styles[size], (selected || onRemove) && styles.selected, className)

  if (onRemove) {
    return (
      <button
        type="button"
        className={cx(classes, styles.button)}
        aria-label={`Remove ${label}`}
        disabled={disabled}
        onClick={onRemove}
      >
        {label}
        <span aria-hidden="true">x</span>
      </button>
    )
  }

  if (onToggle) {
    return (
      <button
        type="button"
        className={cx(classes, styles.button)}
        aria-pressed={selected}
        disabled={disabled}
        onClick={() => onToggle(!selected)}
      >
        {label}
      </button>
    )
  }

  return <span className={classes}>{label}</span>
}
