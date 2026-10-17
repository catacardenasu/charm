import styles from './SegmentedTabs.module.css'
import { cx } from './cx.ts'

export interface TabOption<T extends string> {
  value: T
  label: string
  disabled?: boolean
}

/**
 * pill   – teal track with an orange active segment (Shop/Closet, Leaderboard/Streaks)
 * folder – the active tab joins a teal panel below it (Interests/Memories on Profile)
 */
export type SegmentedTabsVariant = 'pill' | 'folder'

export interface SegmentedTabsProps<T extends string> {
  options: TabOption<T>[]
  value: T
  onChange: (value: T) => void
  /** Describes the tab group for screen readers, e.g. "Shop sections". */
  ariaLabel: string
  variant?: SegmentedTabsVariant
  className?: string
}

export function SegmentedTabs<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  variant = 'pill',
  className,
}: SegmentedTabsProps<T>) {
  return (
    <div role="tablist" aria-label={ariaLabel} className={cx(styles.track, styles[variant], className)}>
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            disabled={option.disabled}
            className={cx(styles.tab, active && styles.active)}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
