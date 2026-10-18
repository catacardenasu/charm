import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Avatar } from '../components/Avatar.tsx'
import { ShopItemTile } from '../components/shop/ShopItemTile.tsx'
import { useShopState } from '../components/shop/useShopState.ts'
import { Badge, Button, CategoryTabs, CoinBalance, Modal, SegmentedTabs } from '../components/ui/index.ts'
import { DEFAULT_AVATAR } from '../data/profileOptions.ts'
import type { ShopCategory, ShopItem } from '../data/shopMock.ts'
import { useMyProfile } from '../hooks/useMyProfile.ts'
import type { Avatar as AvatarData } from '../types.ts'
import styles from './Shop.module.css'

const CATEGORIES = [
  { value: 'hats', label: 'Hats' },
  { value: 'accessories', label: 'Accessories' },
  { value: 'clothing', label: 'Clothing' },
] as const

/** My Charmling wearing the item, in the slot the item belongs to. */
function wearing(avatar: AvatarData, item: ShopItem | undefined): AvatarData {
  return item ? { ...avatar, [item.slot]: item.id } : avatar
}

/** /shop, Figma "Shop" (34:955) with the grids Hats (95:541), Accessories (95:542) and Clothing (95:543). */
export default function Shop() {
  // MOCK: swap this one line for Katie's useShop() when it exists. It needs the same shape as useMockShop's result.
  const { items, points: coins, ownedIds, buy } = useShopState()

  const navigate = useNavigate()
  const { profile } = useMyProfile()
  const myAvatar = profile?.avatar ?? DEFAULT_AVATAR

  const [category, setCategory] = useState<ShopCategory>('hats')
  const [tryingId, setTryingId] = useState<string>(() => items.find((i) => i.category === 'hats')?.id ?? '')
  const [confirming, setConfirming] = useState(false)

  const visible = items.filter((item) => item.category === category)
  const trying = items.find((item) => item.id === tryingId)
  const owned = trying ? ownedIds.has(trying.id) : false
  const shortBy = trying ? trying.price - coins : 0

  const changeCategory = (next: ShopCategory) => {
    setCategory(next)
    setTryingId(items.find((item) => item.category === next)?.id ?? '')
  }

  const confirmBuy = () => {
    if (trying) buy(trying)
    setConfirming(false)
  }

  let buyLabel = 'Buy'
  if (owned) buyLabel = 'Owned'
  else if (shortBy > 0) buyLabel = 'Not enough coins'

  return (
    <main className={styles.screen}>
      <header className={styles.header}>
        <h1 className={styles.title}>Shop</h1>
        <CoinBalance amount={coins} className={styles.balance} />
      </header>

      <SegmentedTabs
        ariaLabel="Shop sections"
        value="shop"
        onChange={(tab) => {
          if (tab === 'closet') navigate('/closet')
        }}
        options={[
          { value: 'shop', label: 'Shop' },
          { value: 'closet', label: 'Closet' },
        ]}
        className={styles.sections}
      />

      <section className={styles.preview} aria-label="Item preview">
        <div className={styles.panel}>
          <Badge className={styles.label}>Trying on</Badge>
          <Avatar avatar={wearing(myAvatar, trying)} label="Your Charmling" idle={false} />
        </div>
        <div className={styles.panel}>
          {trying && (
            <>
              <Badge className={styles.label}>{trying.tag}</Badge>
              <h2 className={styles.itemName}>{trying.name}</h2>
              <p className={styles.itemText}>{trying.description}</p>
            </>
          )}
        </div>
      </section>

      <CategoryTabs
        ariaLabel="Shop categories"
        value={category}
        onChange={changeCategory}
        options={CATEGORIES.map(({ value, label }) => ({ value, label }))}
        className={styles.categories}
      />

      <ul className={styles.grid} aria-label={CATEGORIES.find((c) => c.value === category)?.label}>
        {visible.map((item) => (
          <li key={item.id}>
            <ShopItemTile
              item={item}
              owned={ownedIds.has(item.id)}
              tooExpensive={item.price > coins}
              trying={item.id === tryingId}
              onSelect={() => setTryingId(item.id)}
            />
          </li>
        ))}
      </ul>

      <div className={styles.buyBar}>
        <Button
          fullWidth
          disabled={!trying || owned || shortBy > 0}
          trailing={trying && !owned ? <CoinBalance amount={trying.price} variant="inline" size="lg" /> : undefined}
          onClick={() => setConfirming(true)}
        >
          {buyLabel}
        </Button>
      </div>

      <Modal
        open={confirming && trying !== undefined}
        onClose={() => setConfirming(false)}
        title={`Buy ${trying?.name ?? 'item'}?`}
        actions={
          <>
            <Button variant="secondary" fullWidth onClick={() => setConfirming(false)}>
              Cancel
            </Button>
            <Button fullWidth onClick={confirmBuy}>
              Buy
            </Button>
          </>
        }
      >
        {trying && (
          <div className={styles.confirm}>
            <Avatar avatar={wearing(myAvatar, trying)} label={`Your Charmling wearing ${trying.name}`} idle={false} />
            <CoinBalance amount={trying.price} variant="inline" size="lg" />
            <p className={styles.afterBuy}>
              {coins - trying.price} {coins - trying.price === 1 ? 'coin' : 'coins'} left after this
            </p>
          </div>
        )}
      </Modal>
    </main>
  )
}
