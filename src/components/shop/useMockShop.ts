import { useCallback, useState } from 'react'
import { MOCK_OWNED_IDS, MOCK_POINTS, MOCK_SHOP_ITEMS, type ShopItem } from '../../data/shopMock.ts'

export interface ShopState {
  items: ShopItem[]
  points: number
  ownedIds: ReadonlySet<string>
  /** Spends the points and marks the item owned. Returns false if it's owned already or too expensive. */
  buy: (item: ShopItem) => boolean
}

/** MOCK. Same shape the real useShop should have; swap the one call in src/pages/Shop.tsx when it lands. */
export function useMockShop(): ShopState {
  const [points, setPoints] = useState(MOCK_POINTS)
  const [ownedIds, setOwnedIds] = useState<ReadonlySet<string>>(() => new Set(MOCK_OWNED_IDS))

  const buy = useCallback(
    (item: ShopItem) => {
      if (ownedIds.has(item.id) || points < item.price) return false
      setPoints(points - item.price)
      setOwnedIds(new Set(ownedIds).add(item.id))
      return true
    },
    [ownedIds, points],
  )

  return { items: MOCK_SHOP_ITEMS, points, ownedIds, buy }
}
