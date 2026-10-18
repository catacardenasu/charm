import { useCallback, useMemo, useState } from 'react'
import { MOCK_SHOP_ITEMS, SLOT_BY_CATEGORY, type ShopCategory, type ShopItem, type ShopSlot } from '../../data/shopMock.ts'
import { useMyProfile } from '../../hooks/useMyProfile.ts'
import { useShop } from '../../hooks/useShop.ts'
import type { ShopCosmetic } from '../../types.ts'

// Real shop data (Katie's useShop / 007_shop.sql) in the same shape the Shop and Closet
// pages used with useMockShop, so the pages only swap one line.
//
// - Prices, names and owned flags come from the database.
// - Order, tags and descriptions come from Naty's catalog in shopMock.ts (matched by id),
//   so the grids keep the Figma order. Paid items missing from the catalog are added at the end.
// - Free items (price 0, the basic outfits) are left out of the shop; the Closet adds those itself.
// - Points come from my profile and update right after a purchase.

const CATEGORY_BY_SLOT: Record<ShopSlot, ShopCategory> = {
  hat: 'hats',
  accessory: 'accessories',
  outfit: 'clothing',
}

const isShopSlot = (slot: string): slot is ShopSlot => slot in CATEGORY_BY_SLOT

export interface ShopState {
  items: ShopItem[]
  points: number
  ownedIds: ReadonlySet<string>
  /** Buys the item. Resolves true when it was bought. */
  buy: (item: ShopItem) => Promise<boolean>
  loading: boolean
  /** Loading the list, or the last purchase, failed. */
  error: string | null
  /** Id of the item being bought right now. */
  pending: string | null
}

export function useShopState(): ShopState {
  const shop = useShop()
  const { profile, refresh: refreshProfile } = useMyProfile()
  // Points returned by the last purchase, until the profile refetch catches up.
  const [pointsAfterBuy, setPointsAfterBuy] = useState<number | null>(null)

  const items = useMemo(() => {
    const fromDb = new Map<string, ShopCosmetic>(shop.cosmetics.map((c) => [c.id, c]))
    // Before the list loads, show the catalog so the page has items to render.
    if (fromDb.size === 0) return MOCK_SHOP_ITEMS

    const known = MOCK_SHOP_ITEMS.filter((item) => fromDb.has(item.id)).map((item) => {
      const db = fromDb.get(item.id)!
      return { ...item, name: db.name, price: db.price }
    })
    const knownIds = new Set(known.map((item) => item.id))
    const extra: ShopItem[] = shop.cosmetics
      .filter((c) => c.price > 0 && !knownIds.has(c.id) && isShopSlot(c.slot))
      .map((c) => {
        const slot = c.slot as ShopSlot
        const category = CATEGORY_BY_SLOT[slot]
        return { id: c.id, category, slot: SLOT_BY_CATEGORY[category], name: c.name, price: c.price, tag: '', description: '' }
      })
    return [...known, ...extra]
  }, [shop.cosmetics])

  const ownedIds = useMemo(
    () => new Set(shop.cosmetics.filter((c) => c.owned).map((c) => c.id)) as ReadonlySet<string>,
    [shop.cosmetics],
  )

  const points = pointsAfterBuy ?? profile?.points ?? 0

  const { buyCosmetic } = shop
  const buy = useCallback(
    async (item: ShopItem) => {
      try {
        const result = await buyCosmetic(item.id)
        if (result.status === 'bought') {
          setPointsAfterBuy(result.points)
          refreshProfile()
          return true
        }
        return false
      } catch {
        return false // shown through `error`
      }
    },
    [buyCosmetic, refreshProfile],
  )

  return {
    items,
    points,
    ownedIds,
    buy,
    loading: shop.loading,
    error: shop.error ?? shop.actionError?.message ?? null,
    pending: shop.pending,
  }
}
