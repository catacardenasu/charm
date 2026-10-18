import { ItemTile } from '../ui/index.ts'
import { useSpriteThumb } from './useSpriteThumb.ts'

interface Props {
  name: string
  /** Full-canvas part sprite. Omit for the "No hat" / "No accessory" tile. */
  sprite?: string
  worn: boolean
  onSelect: () => void
}

/** One closet grid cell: a part I can wear, or the "none" tile. */
export function ClosetItemTile({ name, sprite, worn, onSelect }: Props) {
  const imageSrc = useSpriteThumb(sprite ?? '')
  return (
    <ItemTile
      name={name}
      imageSrc={sprite ? imageSrc : undefined}
      empty={!sprite}
      selected={worn}
      onSelect={onSelect}
    />
  )
}
