import styles from './ColorSwatch.module.css'
import { cx } from './cx.ts'
import { CheckIcon } from './icons.tsx'

/** sm = 35x20 (Closet equipped list), md = 90x52 (hair colors), lg = 113x64 (skin colors). */
export type ColorSwatchSize = 'sm' | 'md' | 'lg'

export interface ColorSwatchProps {
  /** Any CSS color. Use the palette tokens, e.g. "var(--swatch-hair-brown)". */
  color: string
  /** Color name for screen readers, e.g. "Brown". */
  label: string
  selected?: boolean
  size?: ColorSwatchSize
  disabled?: boolean
  /** Makes the swatch a button. Without it the swatch is display only. */
  onSelect?: () => void
  className?: string
}

export function ColorSwatch({
  color,
  label,
  selected = false,
  size = 'md',
  disabled = false,
  onSelect,
  className,
}: ColorSwatchProps) {
  const content = (
    <>
      <span className={styles.fill} style={{ background: color }} />
      {selected && size !== 'sm' && (
        <span className={styles.check}>
          <CheckIcon />
        </span>
      )}
    </>
  )

  if (!onSelect) {
    return (
      <span className={cx(styles.swatch, styles[size], className)} role="img" aria-label={label}>
        {content}
      </span>
    )
  }

  return (
    <button
      type="button"
      className={cx(styles.swatch, styles.button, styles[size], className)}
      aria-label={label}
      aria-pressed={selected}
      disabled={disabled}
      onClick={onSelect}
    >
      {content}
    </button>
  )
}
