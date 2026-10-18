import { useCallback, useSyncExternalStore } from 'react'
import { MOCK_OWNED_IDS, MOCK_POINTS, MOCK_SHOP_ITEMS, type ShopItem } from '../../data/shopMock.ts'

export interface ShopState {
  items: ShopItem[]
  points: number
  ownedIds: ReadonlySet<string>
  /** Spends the points and marks the item owned. Returns false if it's owned already or too expensive. */
  buy: (item: ShopItem) => boolean
}

// One store shared by every page that calls useMockShop, so buying in the Shop shows up in the Closet.
// It resets on a full page reload, like any mock.
interface Snapshot {
  points: number
  ownedIds: ReadonlySet<string>
}

let snapshot: Snapshot = { points: MOCK_POINTS, ownedIds: new Set(MOCK_OWNED_IDS) }
const listeners = new Set<() => void>()

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
const getSnapshot = () => snapshot

function buyItem(item: ShopItem): boolean {
  if (snapshot.ownedIds.has(item.id) || snapshot.points < item.price) return false
  snapshot = { points: snapshot.points - item.price, ownedIds: new Set(snapshot.ownedIds).add(item.id) }
  listeners.forEach((listener) => listener())
  return true
}

/** MOCK. Same shape the real useShop should have; swap the one call in src/pages/Shop.tsx (and Closet.tsx) when it lands. */
export function useMockShop(): ShopState {
  const { points, ownedIds } = useSyncExternalStore(subscribe, getSnapshot)
  const buy = useCallback((item: ShopItem) => buyItem(item), [])
  return { items: MOCK_SHOP_ITEMS, points, ownedIds, buy }
}
