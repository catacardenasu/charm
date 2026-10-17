import { useState, type CSSProperties } from 'react'
import type { Avatar as AvatarData, HairColor, SkinTone } from '../types.ts'
import { cx } from './ui/cx.ts'
import styles from './Avatar.module.css'

/** plaza = 2x (42x62), profile = 5x (105x155). Scales live in tokens.css. */
export type AvatarSize = 'plaza' | 'profile'

export interface AvatarProps {
  avatar: AvatarData
  size?: AvatarSize
  /** 2-frame idle bob. Always off when the user prefers reduced motion. */
  idle?: boolean
  /** Seconds to offset the idle loop, so a plaza full of avatars doesn't bob in sync. */
  idleOffset?: number
  /** Accessible name, e.g. the nickname. Without it the avatar is decorative. */
  label?: string
  className?: string
}

const SPRITE_ROOT = '/sprites/avatar'
const SKINS: readonly SkinTone[] = ['pale', 'tan', 'dark']
const HAIR_COLORS: readonly HairColor[] = ['brown', 'black', 'blonde', 'red', 'blue', 'purple', 'pink', 'green']
const HAIR_STYLE_COUNT = 12
const BASIC_OUTFIT = /^basic-(0[1-9]|1\d|2[0-4])$/

// Sprites that exist on the shared 21x31 canvas, exported from the "Avatar Parts" page in Figma
// into /public/sprites/avatar/{hat,accessory,outfit}/<id>.png. Anything not listed is skipped.
const SPECIAL_OUTFITS: ReadonlySet<string> = new Set([
  'special-black-dress',
  'special-flannel',
  'special-hawaiian',
  'special-gym',
  'special-suit',
  'special-astronaut',
  'special-pajamas',
  'special-lab-coat',
  'special-gator-costume',
])
const HATS: ReadonlySet<string> = new Set([
  'beanie',
  'blue-cap',
  'bucket',
  'cowboy',
  'cream-cap',
  'gator',
  'grad-cap',
  'red-beanie',
  'straw',
])
const ACCESSORIES: ReadonlySet<string> = new Set([
  'blush',
  'eyepatch',
  'face-paint',
  'freckles',
  'gator-sunglasses',
  'heart-glasses',
  'round-glasses',
  'sunglasses',
  'square-glasses',
])

function outfitSrc(outfit: string | null): string | null {
  if (!outfit) return null
  if (BASIC_OUTFIT.test(outfit) || SPECIAL_OUTFITS.has(outfit)) return `${SPRITE_ROOT}/outfit/${outfit}.png`
  return null
}

function layerSrc(folder: 'hat' | 'accessory', id: string | null, known: ReadonlySet<string>): string | null {
  return id && known.has(id) ? `${SPRITE_ROOT}/${folder}/${id}.png` : null
}

/**
 * A Charmling, stacked base → outfit → hat → accessory.
 * The base (body, skin and hair) is one cell of the hair sheet for that skin and hair color.
 * Unknown, null or failed layers are skipped.
 */
export function Avatar({ avatar, size = 'profile', idle = true, idleOffset = 0, label, className }: AvatarProps) {
  const [failed, setFailed] = useState<ReadonlySet<string>>(() => new Set())

  const hasBase =
    SKINS.includes(avatar.skin) &&
    HAIR_COLORS.includes(avatar.hairColor) &&
    Number.isInteger(avatar.hairStyle) &&
    avatar.hairStyle >= 1 &&
    avatar.hairStyle <= HAIR_STYLE_COUNT

  const layers = [
    outfitSrc(avatar.outfit),
    layerSrc('hat', avatar.hat, HATS),
    layerSrc('accessory', avatar.accessory, ACCESSORIES),
  ].filter((src): src is string => src != null && !failed.has(src))

  const style = {
    '--hair-column': hasBase ? avatar.hairStyle - 1 : 0,
    animationDelay: idleOffset ? `${-Math.abs(idleOffset)}s` : undefined,
  } as CSSProperties

  return (
    <span
      className={cx(styles.avatar, styles[size], idle && styles.idle, className)}
      style={style}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {hasBase && (
        <span
          className={cx(styles.layer, styles.base)}
          style={{ backgroundImage: `url(${SPRITE_ROOT}/base/${avatar.skin}-${avatar.hairColor}.png)` }}
        />
      )}
      {layers.map((src) => (
        <img
          key={src}
          className={styles.layer}
          src={src}
          alt=""
          draggable={false}
          onError={() => setFailed((prev) => new Set(prev).add(src))}
        />
      ))}
    </span>
  )
}
