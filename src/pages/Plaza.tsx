import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { PlazaScene } from '../components/PlazaScene.tsx'
import { PlazaSwitcher } from '../components/PlazaSwitcher.tsx'
import { AppNav } from '../components/AppNav.tsx'
import { PointsBalance } from '../components/PointsBalance.tsx'
import { cx } from '../components/ui/cx.ts'
import { DEFAULT_LOCATION_ID, PLAZA_SCENES } from '../data/plazas.ts'
import { mockLocations, mockPlaza, mockUniquePeopleMet } from '../data/mock.ts'
import styles from './Plaza.module.css'

// Dev only: ?met=50 unlocks everything, ?walk outlines the walkable ground.
const devParams = import.meta.env.DEV ? new URLSearchParams(window.location.search) : null

export default function Plaza() {
  const { locationId = DEFAULT_LOCATION_ID } = useParams()
  const [search] = useSearchParams()
  const navigate = useNavigate()

  // Mock data. Swap these three lines for usePlaza(locationId) and the real locations / people met later.
  const people = mockPlaza(locationId)
  const locations = mockLocations
  const uniquePeopleMet = Number(devParams?.get('met') ?? mockUniquePeopleMet)

  const location = locations.find((l) => l.id === locationId)
  const scene = PLAZA_SCENES[locationId]
  if (!location || !scene || uniquePeopleMet < location.unlock_at) return <Navigate to="/plaza" replace />

  const switching = search.has('plazas')
  const unlocked = locations.filter((l) => uniquePeopleMet >= l.unlock_at)


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
