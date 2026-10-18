import { spriteSrc, type ShopItem } from '../../data/shopMock.ts'
import { ItemTile } from '../ui/index.ts'
import { cx } from '../ui/cx.ts'
import styles from './ShopItemTile.module.css'
import { useSpriteThumb } from './useSpriteThumb.ts'

interface Props {
  item: ShopItem
  owned: boolean
  /** Not enough points. The tile still opens in the preview, so you can try the item on. */
  tooExpensive: boolean
  trying: boolean
  onSelect: () => void
}

/** One shop grid cell: owned, can afford, or not enough points. */
export function ShopItemTile({ item, owned, tooExpensive, trying, onSelect }: Props) {
  const imageSrc = useSpriteThumb(spriteSrc(item))
  return (
    <ItemTile
      name={item.name}
      imageSrc={imageSrc}
      price={item.price}
      badge={owned ? 'owned' : trying ? 'trying' : undefined}
      selected={trying}
      onSelect={onSelect}
      className={cx(!owned && tooExpensive && !trying && styles.tooExpensive)}
    />
  )
}
