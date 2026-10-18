import { useLayoutEffect, useRef } from 'react'
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { PlazaScene } from '../components/PlazaScene.tsx'
import { PlazaSwitcher } from '../components/PlazaSwitcher.tsx'
import { AppNav } from '../components/AppNav.tsx'
import { InstallHint } from '../components/InstallHint.tsx'
import { PointsBalance } from '../components/PointsBalance.tsx'
import { Card } from '../components/ui/index.ts'
import { cx } from '../components/ui/cx.ts'
import { DEFAULT_LOCATION_ID, PLAZA_SCENES } from '../data/plazas.ts'
import { useLocations } from '../hooks/useLocations.ts'
import { usePlaza } from '../hooks/usePlaza.ts'
import { usePlazaVersion } from '../lib/plazaRefresh.ts'
import styles from './Plaza.module.css'

// Dev only: ?met=50 unlocks everything, ?walk outlines the walkable ground.
const devParams = import.meta.env.DEV ? new URLSearchParams(window.location.search) : null

// How long scrolling has to stop before a swipe counts as landing on a plaza.
const SETTLE_MS = 120

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

export default function Plaza() {
  const { locationId = DEFAULT_LOCATION_ID } = useParams()
  const [search] = useSearchParams()
  const navigate = useNavigate()
  const trackRef = useRef<HTMLDivElement>(null)
  const settleTimer = useRef<number | undefined>(undefined)
  const shownSlides = useRef<string | null>(null)

  // Bumped by NotificationsProvider when a tap in arrives over Realtime, so both reload.
  const plazaVersion = usePlazaVersion()
  const { locations, uniquePeopleMet: realPeopleMet, loading: locationsLoading } = useLocations(plazaVersion)
  const devMet = devParams?.get('met')
  const uniquePeopleMet = devMet != null ? Number(devMet) : realPeopleMet

  const switching = search.has('plazas')
  const unlocked = locations.filter((l) => uniquePeopleMet >= l.unlock_at && PLAZA_SCENES[l.id])
  // One slide per unlocked plaza, swiped left and right. Just this one until locations load.
  const slides = unlocked.some((l) => l.id === locationId) ? unlocked.map((l) => l.id) : [locationId]
  const index = slides.indexOf(locationId)
  const slidesKey = slides.join(',')

  // Keep the carousel on the plaza in the URL: jump on first show or when the plazas change,
  // glide when a dot is tapped. After a swipe it's already there, so this does nothing.
  useLayoutEffect(() => {
    const track = trackRef.current
    if (!track) return
    const left = index * track.clientWidth
    if (Math.abs(track.scrollLeft - left) < 2) {
      shownSlides.current = slidesKey
      return
    }
    const jump = shownSlides.current !== slidesKey || prefersReducedMotion()
    track.scrollTo({ left, behavior: jump ? 'instant' : 'smooth' })
    shownSlides.current = slidesKey
  }, [index, slidesKey, switching])

  useLayoutEffect(() => () => window.clearTimeout(settleTimer.current), [])

  const location = locations.find((l) => l.id === locationId)
  const scene = PLAZA_SCENES[locationId]
  // Wait for locations before bouncing a locked plaza. The default plaza is always open (unlock_at 0).
  const locked = !locationsLoading && (!location || uniquePeopleMet < location.unlock_at)
  if (!scene || (locked && locationId !== DEFAULT_LOCATION_ID)) return <Navigate to="/plaza" replace />

  // When a swipe comes to rest, put that plaza in the URL (replace, so swiping doesn't fill history).
  const onScroll = () => {
    window.clearTimeout(settleTimer.current)
    settleTimer.current = window.setTimeout(() => {
      const track = trackRef.current
      if (!track || track.clientWidth === 0) return
      const landed = slides[Math.round(track.scrollLeft / track.clientWidth)]
      if (landed && landed !== locationId) navigate(`/plaza/${landed}`, { replace: true })
    }, SETTLE_MS)
  }

  return (
    <div className={styles.screen}>
      <div className={styles.map}>
        {switching ? (
          <PlazaSwitcher
            locations={locations}
            uniquePeopleMet={uniquePeopleMet}
            onSelect={(id) => navigate(`/plaza/${id}`)}
          />
        ) : (
          <>
            <div ref={trackRef} className={styles.track} onScroll={onScroll}>
              {slides.map((id, i) => (
                <PlazaSlide
                  key={id}
                  locationId={id}
                  name={locations.find((l) => l.id === id)?.name ?? id}
                  current={i === index}
                  // The plazas either side render too, so they're already there mid-swipe.
                  nearby={Math.abs(i - index) <= 1}
                  plazaVersion={plazaVersion}
                  onSelectPerson={(userId) => navigate(`/u/${encodeURIComponent(userId)}`)}
                />
              ))}
            </div>
            <PointsBalance className={styles.points} />
            <InstallHint />
            {slides.length > 1 && (
              <nav className={styles.dots} aria-label="Plazas">
                {unlocked.map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    className={cx(styles.dot, l.id === locationId && styles.currentDot)}
                    aria-label={l.name}
                    aria-current={l.id === locationId ? 'page' : undefined}
                    onClick={() => navigate(`/plaza/${l.id}`)}
                  />
                ))}
              </nav>
            )}
          </>
        )}
      </div>
      <div className={styles.nav}>
        <AppNav
          active={switching ? 'plazas' : 'home'}
          routes={{ home: `/plaza/${locationId}`, plazas: `/plaza/${locationId}?plazas` }}
        />
      </div>
    </div>
  )
}

interface PlazaSlideProps {
  locationId: string
  name: string
  /** The plaza in the URL. Off-screen slides are inert so focus and screen readers skip them. */
  current: boolean
  /** Render the scene (this plaza or a neighbor). Farther slides stay empty until you get close. */
  nearby: boolean
  plazaVersion: number
  onSelectPerson: (userId: string) => void
}

/** One plaza in the carousel: its scene and the people I met there. */
function PlazaSlide({ locationId, name, current, nearby, plazaVersion, onSelectPerson }: PlazaSlideProps) {
  const { people, loading } = usePlaza(locationId, plazaVersion)
  const scene = PLAZA_SCENES[locationId]
  const empty = !loading && people.length === 0

  return (
    <section className={styles.slide} aria-label={name} inert={!current}>
      {nearby && scene && (
        <PlazaScene scene={scene} people={people} onSelectPerson={onSelectPerson} debug={devParams?.has('walk')} />
      )}
      {nearby && empty && (
        <Card className={styles.empty}>
          <p>Tap someone’s charm to fill your plaza!</p>
        </Card>
      )}
    </section>
  )
}
