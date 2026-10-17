import type { ComponentType, SVGProps } from 'react'
import styles from './BottomNav.module.css'
import { cx } from './cx.ts'
import { ActivityIcon, HomeIcon, PlazasIcon, ProfileIcon, ShopIcon } from './icons.tsx'

export type NavKey = 'home' | 'activity' | 'shop' | 'plazas' | 'profile'

const ITEMS: Array<{ key: NavKey; label: string; Icon: ComponentType<SVGProps<SVGSVGElement>> }> = [
  { key: 'home', label: 'Home', Icon: HomeIcon },
  { key: 'activity', label: 'Activity', Icon: ActivityIcon },
  { key: 'shop', label: 'Shop', Icon: ShopIcon },
  { key: 'plazas', label: 'Plazas', Icon: PlazasIcon },
  { key: 'profile', label: 'Profile', Icon: ProfileIcon },
]

export interface BottomNavProps {
  active: NavKey
  onSelect: (key: NavKey) => void
  className?: string
}

export function BottomNav({ active, onSelect, className }: BottomNavProps) {
  return (
    <nav className={cx(styles.nav, className)} aria-label="Main">
      {ITEMS.map(({ key, label, Icon }) => (
        <button
          key={key}
          type="button"
          className={cx(styles.item, key === active && styles.active)}
          aria-current={key === active ? 'page' : undefined}
          onClick={() => onSelect(key)}
        >
          <span className={styles.icon}>
            <Icon />
          </span>
          {label}
        </button>
      ))}
    </nav>
  )
}
