import { useLocation, useNavigate } from 'react-router-dom'
import { BottomNav, type NavKey } from './ui/index.ts'

const ROUTES: Record<NavKey, string> = {
  home: '/plaza',
  activity: '/activity',
  shop: '/shop',
  plazas: '/plaza?plazas',
  profile: '/me',
}

function activeFor(pathname: string): NavKey {
  if (pathname.startsWith('/activity') || pathname.startsWith('/streaks')) return 'activity'
  if (pathname.startsWith('/shop') || pathname.startsWith('/closet')) return 'shop'
  if (pathname.startsWith('/me') || pathname.startsWith('/settings')) return 'profile'
  return 'home'
}

interface Props {
  /** Defaults to the tab for the current route. */
  active?: NavKey
  /** Plaza keeps you on the plaza you're looking at, e.g. { home: '/plaza/lake-alice' }. */
  routes?: Partial<Record<NavKey, string>>
}

/** Naty's BottomNav wired to the app's routes. */
export function AppNav({ active, routes }: Props) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  return (
    <BottomNav active={active ?? activeFor(pathname)} onSelect={(key) => navigate(routes?.[key] ?? ROUTES[key])} />
  )
}
