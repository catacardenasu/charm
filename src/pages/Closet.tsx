import { useAuth0 } from '@auth0/auth0-react'
import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Avatar } from '../components/Avatar.tsx'
import { HAIR_COLORS, HAIR_STYLE_NAMES, SKINS } from '../components/avatarOptions.ts'
import { ClosetItemTile } from '../components/shop/ClosetItemTile.tsx'
import { useMockShop } from '../components/shop/useMockShop.ts'
import { CategoryTabs, CoinBalance, ColorSwatch, ItemTile, SegmentedTabs } from '../components/ui/index.ts'
import { spriteSrc, type ShopItem, type ShopSlot } from '../data/shopMock.ts'
import { useMyProfile } from '../hooks/useMyProfile.ts'
import { useSaveProfile } from '../hooks/useSaveProfile.ts'
import { onboardingPath } from '../lib/returnTo.ts'
import type { Avatar as AvatarData } from '../types.ts'
import styles from './Closet.module.css'

type Category = 'skin' | 'hair' | 'clothing' | 'hats' | 'accessories'

const CATEGORIES = [
  { value: 'skin', label: 'Skin' },
  { value: 'hair', label: 'Hair' },
  { value: 'clothing', label: 'Clothing' },
  { value: 'hats', label: 'Hats' },
  { value: 'accessories', label: 'Accessories' },
] as const

// The 24 basic outfits are free starter clothes, so they always show. Special fits need to be owned.
const BASIC_OUTFITS: ShopItem[] = Array.from({ length: 24 }, (_, i) => {
  const number = String(i + 1).padStart(2, '0')
  return {
    id: `basic-${number}`,
    category: 'clothing',
    slot: 'outfit',
    name: `Outfit ${i + 1}`,
    price: 0,
    tag: 'Basic',
    description: '',
  }
})

const SLOT_BY_TAB: Partial<Record<Category, ShopSlot>> = { clothing: 'outfit', hats: 'hat', accessories: 'accessory' }

/** /closet, Figma "Closet" (34:2052) with the Hair (78:556) and Skin (78:557) panels. */
export default function Closet() {
  const { isAuthenticated, isLoading: authLoading } = useAuth0()
  const { profile, loading } = useMyProfile()
  const { saveProfile, error: saveError } = useSaveProfile()
  // MOCK: swap this one line for Katie's my_cosmetics when it exists. It only needs `items`, `ownedIds` and `points`.
  const { items, ownedIds, points } = useMockShop()
  const navigate = useNavigate()

  const [category, setCategory] = useState<Category>('hats')
  const [draft, setDraft] = useState<AvatarData | null>(null)

  if (authLoading || loading) return <p className={styles.loading}>Loading…</p>
  if (!isAuthenticated) return <Navigate to="/" replace />
  if (!profile) return <Navigate to={onboardingPath('/closet')} replace />

  const avatar = draft ?? profile.avatar

  // Updates the preview right away, then saves the avatar field. Skin and hair are free; the rest are owned parts.
  const change = (changes: Partial<AvatarData>) => {
    const next = { ...avatar, ...changes }
    setDraft(next)
    const { nickname, major, year, interests, greeting } = profile
    saveProfile({ nickname, major, year, interests, greeting, avatar: next }).catch(() => {})
  }

  const slot = SLOT_BY_TAB[category]
  const mine = slot
    ? [...(slot === 'outfit' ? BASIC_OUTFITS : []), ...items.filter((i) => i.slot === slot && ownedIds.has(i.id))]
    : []
  const nameOf = (id: string | null) =>
    id ? ([...BASIC_OUTFITS, ...items].find((i) => i.id === id)?.name ?? id) : 'None'

  const hairStyleName = HAIR_STYLE_NAMES[avatar.hairStyle - 1] ?? 'Hair'
  const skinLabel = SKINS.find((s) => s.id === avatar.skin)?.label ?? ''
  const hairColorLabel = HAIR_COLORS.find((c) => c.id === avatar.hairColor)?.label ?? ''

  const equipped: Array<{ category: Category; label: string; value: string }> = [
    { category: 'hats', label: 'Hat', value: nameOf(avatar.hat) },
    { category: 'accessories', label: 'Accessory', value: nameOf(avatar.accessory) },
    { category: 'hair', label: 'Hair', value: `${hairColorLabel} ${hairStyleName}` },
    { category: 'clothing', label: 'Clothing', value: nameOf(avatar.outfit) },
    { category: 'skin', label: 'Skin', value: skinLabel },
  ]

  return (
    <main className={styles.screen}>
      <header className={styles.header}>
        <h1 className={styles.title}>Closet</h1>
        <CoinBalance amount={points} className={styles.balance} />
      </header>

      <SegmentedTabs
        ariaLabel="Shop sections"
        value="closet"
        onChange={(tab) => {
          if (tab === 'shop') navigate('/shop')
        }}
        options={[
          { value: 'shop', label: 'Shop' },
          { value: 'closet', label: 'Closet' },
        ]}
        className={styles.sections}
      />

      <section className={styles.preview} aria-label="Your Charmling">
        <div className={styles.panel}>
          <Avatar avatar={avatar} label="Your Charmling" idle={false} />
        </div>
        <ul className={styles.equipped} aria-label="Wearing now">
          {equipped.map((row) => (
            <li key={row.label}>
              <button type="button" className={styles.row} onClick={() => setCategory(row.category)}>
                <span className={styles.rowLabel}>{row.label}</span>
                <span className={styles.rowValue}>{row.value}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <CategoryTabs
        ariaLabel="Closet categories"
        size="sm"
        value={category}
        onChange={setCategory}
        options={CATEGORIES.map(({ value, label }) => ({ value, label }))}
        className={styles.categories}
      />

      {category === 'skin' && (
        <div className={`${styles.swatches} ${styles.skins}`}>
          {SKINS.map((s) => (
            <ColorSwatch
              key={s.id}
              size="lg"
              color={s.color}
              label={s.label}
              className={styles.swatch}
              selected={avatar.skin === s.id}
              onSelect={() => change({ skin: s.id })}
            />
          ))}
        </div>
      )}

      {category === 'hair' && (
        <>
          <div className={`${styles.swatches} ${styles.hairColors}`}>
            {HAIR_COLORS.map((c) => (
              <ColorSwatch
                key={c.id}
                color={c.color}
                label={c.label}
                className={styles.swatch}
                selected={avatar.hairColor === c.id}
                onSelect={() => change({ hairColor: c.id })}
              />
            ))}
          </div>
          <ul className={styles.grid} aria-label="Hairstyles">
            {HAIR_STYLE_NAMES.map((name, i) => (
              <li key={name}>
                <ItemTile name={name} selected={avatar.hairStyle === i + 1} onSelect={() => change({ hairStyle: i + 1 })} />
              </li>
            ))}
          </ul>
        </>
      )}

      {slot && (
        <ul className={styles.grid} aria-label={CATEGORIES.find((c) => c.value === category)?.label}>
          {slot !== 'outfit' && (
            <li>
              <ClosetItemTile
                name={slot === 'hat' ? 'No hat' : 'No accessory'}
                worn={avatar[slot] === null}
                onSelect={() => change({ [slot]: null })}
              />
            </li>
          )}
          {mine.map((item) => (
            <li key={item.id}>
              <ClosetItemTile
                name={item.name}
                sprite={spriteSrc(item)}
                worn={avatar[slot] === item.id}
                onSelect={() => change({ [slot]: item.id })}
              />
            </li>
          ))}
        </ul>
      )}

      {slot && slot !== 'outfit' && mine.length === 0 && (
        <p className={styles.empty}>Nothing here yet. Buy something in the Shop!</p>
      )}

      {saveError && (
        <p role="alert" className={styles.error}>
          Couldn’t save your Charmling. Try again.
        </p>
      )}
    </main>
  )
}
