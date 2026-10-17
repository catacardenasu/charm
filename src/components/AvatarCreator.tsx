import { useState } from 'react'
import type { Avatar as AvatarData, HairColor, SkinTone } from '../types.ts'
import { Avatar } from './Avatar.tsx'
import { CategoryTabs, ColorSwatch } from './ui/index.ts'
import { cx } from './ui/cx.ts'
import styles from './AvatarCreator.module.css'

export interface AvatarCreatorProps {
  value: AvatarData
  onChange: (avatar: AvatarData) => void
  className?: string
}

type Tab = 'skin' | 'hair' | 'clothing'

const TABS = [
  { value: 'skin', label: 'Skin' },
  { value: 'hair', label: 'Hair' },
  { value: 'clothing', label: 'Clothing' },
] as const

// Skin and hair palettes, in Figma order. Swatch colors come from tokens.css.
const SKINS: ReadonlyArray<{ id: SkinTone; label: string; color: string }> = [
  { id: 'pale', label: 'Light', color: 'var(--swatch-skin-light)' },
  { id: 'tan', label: 'Medium', color: 'var(--swatch-skin-medium)' },
  { id: 'dark', label: 'Dark', color: 'var(--swatch-skin-dark)' },
]

const HAIR_COLORS: ReadonlyArray<{ id: HairColor; label: string; color: string }> = [
  { id: 'brown', label: 'Brown', color: 'var(--swatch-hair-brown)' },
  { id: 'black', label: 'Black', color: 'var(--swatch-hair-black)' },
  { id: 'blonde', label: 'Gold', color: 'var(--swatch-hair-gold)' },
  { id: 'red', label: 'Red', color: 'var(--swatch-hair-red)' },
  { id: 'blue', label: 'Blue', color: 'var(--swatch-hair-blue)' },
  { id: 'purple', label: 'Purple', color: 'var(--swatch-hair-purple)' },
  { id: 'pink', label: 'Pink', color: 'var(--swatch-hair-pink)' },
  { id: 'green', label: 'Green', color: 'var(--swatch-hair-green)' },
]

// Hairstyle names from Figma "Closet - Hair", in hair sheet order (style 1 to 12).
const HAIR_STYLE_NAMES = [
  'Fluffy Mess',
  'Side Sweep',
  'Bowl Cut',
  'Tousled',
  'Soft Bob',
  'Straight',
  'Beach Waves',
  'High Pony',
  'Side Pony',
  'Space Buns',
  'Top Knot',
  'Twin Braids',
] as const

const STYLE_COUNT = HAIR_STYLE_NAMES.length

const wrapStyle = (style: number) => ((((style - 1) % STYLE_COUNT) + STYLE_COUNT) % STYLE_COUNT) + 1

/**
 * "Build your Charmling": live preview with hairstyle arrows, and Skin / Hair / Clothing tabs.
 * Skin and hair color are picked here. Hairstyle is picked with the arrows around the preview.
 * Hats, accessories and special fits are unlocked in the Shop later, so the Clothing tab is just a note.
 * Controlled and fetch-free: it only calls onChange.
 */
export function AvatarCreator({ value, onChange, className }: AvatarCreatorProps) {
  const [tab, setTab] = useState<Tab>('skin')

  const styleName = HAIR_STYLE_NAMES[wrapStyle(value.hairStyle) - 1]
  const step = (delta: number) => onChange({ ...value, hairStyle: wrapStyle(value.hairStyle + delta) })

  return (
    <div className={cx(styles.creator, className)}>
      <div className={styles.preview}>
        <button
          type="button"
          className={cx(styles.arrow, styles.previous)}
          aria-label="Previous hairstyle"
          onClick={() => step(-1)}
        >
          <span className={styles.arrowImage} />
        </button>
        <Avatar avatar={value} idle={false} label="Your Charmling" className={styles.avatar} />
        <button
          type="button"
          className={styles.arrow}
          aria-label="Next hairstyle"
          onClick={() => step(1)}
        >
          <span className={styles.arrowImage} />
        </button>
        <p className={styles.srOnly} role="status">
          Hairstyle: {styleName}
        </p>
      </div>

      <CategoryTabs ariaLabel="Charmling parts" size="lg" value={tab} onChange={setTab} options={[...TABS]} />

      {tab === 'skin' && (
        <div className={cx(styles.swatches, styles.skins)}>
          {SKINS.map((s) => (
            <ColorSwatch
              key={s.id}
              size="lg"
              color={s.color}
              label={s.label}
              className={styles.swatch}
              selected={value.skin === s.id}
              onSelect={() => onChange({ ...value, skin: s.id })}
            />
          ))}
        </div>
      )}

      {tab === 'hair' && (
        <div className={cx(styles.swatches, styles.hairColors)}>
          {HAIR_COLORS.map((c) => (
            <ColorSwatch
              key={c.id}
              color={c.color}
              label={c.label}
              className={styles.swatch}
              selected={value.hairColor === c.id}
              onSelect={() => onChange({ ...value, hairColor: c.id })}
            />
          ))}
        </div>
      )}

      {tab === 'clothing' && (
        <p className={styles.note}>
          More <b>clothing</b> and <b>accessories</b> will be available later on in the <b>shop</b>!
        </p>
      )}
    </div>
  )
}
