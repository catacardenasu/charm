import { useAuth0 } from '@auth0/auth0-react'
import { useCallback, useEffect, useState } from 'react'
import { useSupabase } from '../lib/supabase.ts'
import type { Avatar, BuyCosmeticResult, EquipCosmeticResult, ShopCosmetic } from '../types.ts'
import { toAvatar } from './usePlaza.ts'

// The costume shop (007_shop.sql, buying with coins since 011_coins.sql): every cosmetic with owned/equipped flags,
// plus buyCosmetic() and equipCosmetic(). Both update the list in place, so
// there's no refetch after a purchase. Call useMyProfile's refresh() afterwards
// if a screen shows coins or the avatar from the profile.

interface ShopResult {
  cosmetics: ShopCosmetic[]
  error: string | null
}

const NO_COSMETICS: ShopCosmetic[] = []

export function useShop() {
  const supabase = useSupabase()
  const { isLoading: authLoading, isAuthenticated } = useAuth0()
  const [result, setResult] = useState<ShopResult | null>(null)
  const [reloads, setReloads] = useState(0)
  /** Id of the cosmetic being bought or equipped. */
  const [pending, setPending] = useState<string | null>(null)
  const [actionError, setActionError] = useState<Error | null>(null)

  useEffect(() => {
    if (authLoading) return
    let cancelled = false
    void (async () => {
      let next: ShopResult = { cosmetics: NO_COSMETICS, error: null }
      if (isAuthenticated) {
        const res = await supabase.rpc('my_cosmetics')
        if (res.error) next = { ...next, error: res.error.message }
        else next = { cosmetics: res.data as ShopCosmetic[], error: null }
      }
      if (!cancelled) setResult(next)
    })()
    return () => {
      cancelled = true
    }
  }, [authLoading, isAuthenticated, supabase, reloads])

  const updateCosmetics = (update: (cosmetics: ShopCosmetic[]) => ShopCosmetic[]) =>
    setResult((prev) => (prev ? { ...prev, cosmetics: update(prev.cosmetics) } : prev))

  const buyCosmetic = useCallback(
    async (cosmeticId: string): Promise<BuyCosmeticResult> => {
      setPending(cosmeticId)
      setActionError(null)
      try {
        const { data, error } = await supabase.rpc('buy_cosmetic', { p_cosmetic_id: cosmeticId })
        if (error) throw error
        const bought = data as BuyCosmeticResult
        if (bought.status === 'bought') {
          updateCosmetics((list) => list.map((c) => (c.id === cosmeticId ? { ...c, owned: true } : c)))
        }
        return bought
      } catch (e) {
        setActionError(e as Error)
        throw e
      } finally {
        setPending(null)
      }
    },
    [supabase],
  )

  const equipCosmetic = useCallback(
    async (cosmeticId: string): Promise<EquipCosmeticResult> => {
      setPending(cosmeticId)
      setActionError(null)
      try {
        const { data, error } = await supabase.rpc('equip_cosmetic', { p_cosmetic_id: cosmeticId })
        if (error) throw error
        const raw = data as { status: EquipCosmeticResult['status']; avatar?: Partial<Avatar> | null }
        if (raw.status !== 'equipped') return { status: raw.status }
        updateCosmetics((list) => {
          const slot = list.find((c) => c.id === cosmeticId)?.slot
          return list.map((c) => (c.slot === slot ? { ...c, equipped: c.id === cosmeticId } : c))
        })
        return { status: raw.status, avatar: toAvatar(raw.avatar) }
      } catch (e) {
        setActionError(e as Error)
        throw e
      } finally {
        setPending(null)
      }
    },
    [supabase],
  )

  return {
    cosmetics: result?.cosmetics ?? NO_COSMETICS,
    loading: result === null,
    /** Loading the list failed. */
    error: result?.error ?? null,
    buyCosmetic,
    equipCosmetic,
    pending,
    /** The last buy or equip failed. */
    actionError,
    refresh: () => setReloads((n) => n + 1),
  }
}
