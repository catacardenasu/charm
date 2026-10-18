import { useState } from 'react'
import type { Avatar as AvatarData } from '../types.ts'
import { Avatar } from './Avatar.tsx'
import { HAIR_COLORS, HAIR_STYLE_NAMES, SKINS } from './avatarOptions.ts'
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
