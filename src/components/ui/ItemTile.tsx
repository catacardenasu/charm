import { Badge } from './Badge.tsx'
import { CoinBalance } from './CoinBalance.tsx'
import styles from './ItemTile.module.css'
import { cx } from './cx.ts'
import { NoneIcon } from './icons.tsx'

export type ItemTileBadge = 'owned' | 'trying'

export interface ItemTileProps {
  name: string
  imageSrc?: string
  /** Shop: shows the coin price at the bottom. Closet: omit it to show the name instead. */
  price?: number
  badge?: ItemTileBadge
  /** Orange tile: the item being tried on (Shop) or worn (Closet). */
  selected?: boolean
  /** The "No hat" / "No accessory" tile: outlined, with the none icon. */
  empty?: boolean
  disabled?: boolean
  onSelect?: () => void
  className?: string
}

const BADGE_TEXT: Record<ItemTileBadge, string> = { owned: 'Owned', trying: 'Trying' }

/** Shop and Closet grid items. Fills its grid cell at the Figma 118:89 ratio. */
export function ItemTile({
  name,
  imageSrc,
  price,
  badge,
  selected = false,
  empty = false,
  disabled = false,
  onSelect,
  className,
}: ItemTileProps) {
  const description = [name, price != null && `${price} coins`, badge && BADGE_TEXT[badge]]
    .filter(Boolean)
    .join(', ')

  return (
    <button
      type="button"
      className={cx(styles.tile, selected && styles.selected, empty && styles.empty, className)}
      aria-label={description}
      aria-pressed={selected}
      disabled={disabled}
      onClick={onSelect}
    >
      {badge && (
        <Badge size="sm" className={styles.badge}>
          {BADGE_TEXT[badge]}
        </Badge>
      )}
      <span className={styles.image} aria-hidden="true">
        {empty ? <NoneIcon /> : imageSrc && <img src={imageSrc} alt="" />}
      </span>
      <span className={styles.footer} aria-hidden="true">
        {price != null ? <CoinBalance amount={price} variant="inline" /> : name}
      </span>
    </button>
  )
}
