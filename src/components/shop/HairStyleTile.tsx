import type { HairColor, SkinTone } from '../../types.ts'
import { ItemTile } from '../ui/index.ts'
import { useSpriteThumb } from './useSpriteThumb.ts'

interface Props {
  name: string
  /** 1-based hairstyle, the column in the hair sheet. */
  style: number
  skin: SkinTone
  hairColor: HairColor
  selected: boolean
  onSelect: () => void
}

// One cell of the hair sheet is 21x31; the bottom row is head only.
const CELL_WIDTH = 21
const CELL_HEIGHT = 31

/** One closet hairstyle cell, showing the head in my skin tone and the current hair color. */
export function HairStyleTile({ name, style, skin, hairColor, selected, onSelect }: Props) {
  const imageSrc = useSpriteThumb(`/sprites/avatar/base/${skin}-${hairColor}.png`, {
    x: (style - 1) * CELL_WIDTH,
    y: CELL_HEIGHT,
    w: CELL_WIDTH,
    h: CELL_HEIGHT,
  })
  return <ItemTile name={name} imageSrc={imageSrc} selected={selected} onSelect={onSelect} />
}
