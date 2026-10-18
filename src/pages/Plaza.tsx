import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { PlazaScene } from '../components/PlazaScene.tsx'
import { PlazaSwitcher } from '../components/PlazaSwitcher.tsx'
import { AppNav } from '../components/AppNav.tsx'
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

export default function Plaza() {
  const { locationId = DEFAULT_LOCATION_ID } = useParams()
  const [search] = useSearchParams()
  const navigate = useNavigate()

  // Bumped by NotificationsProvider when a tap in arrives over Realtime, so both reload.
  const plazaVersion = usePlazaVersion()
  const { people, loading: peopleLoading } = usePlaza(locationId, plazaVersion)
  const { locations, uniquePeopleMet: realPeopleMet, loading: locationsLoading } = useLocations(plazaVersion)
  const devMet = devParams?.get('met')
  const uniquePeopleMet = devMet != null ? Number(devMet) : realPeopleMet

  const location = locations.find((l) => l.id === locationId)
  const scene = PLAZA_SCENES[locationId]
  // Wait for locations before bouncing a locked plaza. The default plaza is always open (unlock_at 0).
  const locked = !locationsLoading && (!location || uniquePeopleMet < location.unlock_at)
  if (!scene || (locked && locationId !== DEFAULT_LOCATION_ID)) return <Navigate to="/plaza" replace />

  const switching = search.has('plazas')
  const unlocked = locations.filter((l) => uniquePeopleMet >= l.unlock_at)
  const empty = !peopleLoading && people.length === 0

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
            <PlazaScene
              key={locationId}
              scene={scene}
              people={people}
              onSelectPerson={(userId) => navigate(`/u/${encodeURIComponent(userId)}`)}
              debug={devParams?.has('walk')}
            />
            {empty && (
              <Card className={styles.empty}>
                <p>Tap someone’s charm to fill your plaza!</p>
              </Card>
            )}
            <PointsBalance className={styles.points} />
            {unlocked.length > 1 && (
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
