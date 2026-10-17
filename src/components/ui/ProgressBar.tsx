import styles from './ProgressBar.module.css'
import { cx } from './cx.ts'

export interface ProgressBarProps {
  value: number
  max: number
  /** Top-left heading. */
  label?: string
  /** Top-right count, e.g. "18/25 Charmlings". Defaults to "value/max". */
  valueLabel?: string
  /** Text to the right of the bar, e.g. the next plaza's name. */
  endLabel?: string
  className?: string
}

/** The "Next Plaza" bar on Profile. */
export function ProgressBar({
  value,
  max,
  label = 'Next Plaza',
  valueLabel = `${value}/${max}`,
  endLabel,
  className,
}: ProgressBarProps) {
  const percent = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0

  return (
    <div className={cx(styles.root, className)}>
      <div className={styles.header}>
        <span className={styles.label}>{label}</span>
        <span className={styles.value}>{valueLabel}</span>
      </div>
      <div className={styles.row}>
        <div
          className={styles.track}
          role="progressbar"
          aria-label={endLabel ? `${label}: ${endLabel}` : label}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-valuenow={value}
          aria-valuetext={valueLabel}
        >
          <div className={styles.fill} style={{ width: `${percent}%` }} />
        </div>
        {endLabel && <span className={styles.end}>{endLabel}</span>}
      </div>
    </div>
  )
}
