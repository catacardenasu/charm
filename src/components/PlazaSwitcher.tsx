import type { Location } from '../types.ts'
import { PLAZA_SCENES } from '../data/plazas.ts'
import { Badge, Card, SPRITES } from './ui/index.ts'
import { cx } from './ui/cx.ts'
import styles from './PlazaSwitcher.module.css'

export interface PlazaSwitcherProps {
  locations: Location[]
  /** Unique people the user has met. Locations unlock at `unlock_at`. */
  uniquePeopleMet: number
  onSelect: (locationId: string) => void
  className?: string
}

/** The "Plazas" screen: every location, with locked ones showing a lock and how many people they need. */
export function PlazaSwitcher({ locations, uniquePeopleMet, onSelect, className }: PlazaSwitcherProps) {
  return (
    <div className={cx(styles.screen, className)}>
      <h1 className={styles.title}>Plazas</h1>
      <p className={styles.intro}>Meet more people to unlock new places to hangout!</p>
      <ul className={styles.list}>
        {locations.map((location) => {
          const scene = PLAZA_SCENES[location.id]
          const unlocked = uniquePeopleMet >= location.unlock_at
          const content = (
            <span className={styles.row}>
              <span className={cx(styles.thumb, !unlocked && styles.locked)}>
                {unlocked ? (
                  <img src={scene?.thumbnail} alt="" draggable={false} />
                ) : (
                  <img className={styles.lock} src={SPRITES.lock} alt="" width={21} height={24} />
                )}
              </span>
              <span className={styles.text}>
                <span className={styles.name}>{location.name}</span>
                <span className={styles.description}>{scene?.description}</span>
              </span>
              <Badge variant="status" className={styles.badge}>
                {unlocked ? 'Unlocked' : `${uniquePeopleMet}/${location.unlock_at}`}
              </Badge>
            </span>
          )

          return (
            <li key={location.id}>
              {unlocked ? (
                <Card padding="none" onClick={() => onSelect(location.id)} ariaLabel={`${location.name}, unlocked`}>
                  {content}
                </Card>
              ) : (
                <Card padding="none">
                  <span className={styles.srOnly}>{`${location.name} is locked. Met ${uniquePeopleMet} of ${location.unlock_at} people.`}</span>
                  <span aria-hidden="true">{content}</span>
                </Card>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
