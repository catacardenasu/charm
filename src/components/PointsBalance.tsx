import { useState } from 'react'
import { useMyProfile } from '../hooks/useMyProfile.ts'
import { usePlazaVersion } from '../lib/plazaRefresh.ts'
import { CoinBalance } from './ui/index.ts'

/**
 * profiles.points in Naty's CoinBalance. Refetches when the plaza version bumps (a Realtime tap in),
 * and keeps showing the last value while it reloads instead of blinking out.
 */
export function PointsBalance({ className }: { className?: string }) {
  const { profile } = useMyProfile(usePlazaVersion())
  const [shown, setShown] = useState<number | null>(null)

  const points = profile?.points ?? null
  if (points !== null && points !== shown) setShown(points)

  if (shown === null) return null
  return <CoinBalance amount={shown} className={className} />
}
