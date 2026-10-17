import styles from './CategoryTabs.module.css'
import { cx } from './cx.ts'
import type { TabOption } from './SegmentedTabs.tsx'

/**
 * sm = 39px, 11px label (Closet: Skin/Hair/Clothing/Hats/Accessories)
 * md = 44px, 18px label (Shop: Hats/Accessories/Clothing)
 * lg = 55px, 22px label (Build your Charmling: Skin/Hair/Clothing)
 */
export type CategoryTabsSize = 'sm' | 'md' | 'lg'

export interface CategoryTabsProps<T extends string> {
  options: TabOption<T>[]
  value: T
  onChange: (value: T) => void
  ariaLabel: string
  size?: CategoryTabsSize
  className?: string
}

export function CategoryTabs<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  size = 'md',
  className,
}: CategoryTabsProps<T>) {
  return (
    <div role="tablist" aria-label={ariaLabel} className={cx(styles.row, styles[size], className)}>
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
