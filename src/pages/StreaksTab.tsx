import { useNavigate } from 'react-router-dom'
import { Avatar } from '../components/Avatar.tsx'
import { StreakFlame } from '../components/ui/index.ts'
import rowStyles from '../components/ui/ListRow.module.css'
import { cx } from '../components/ui/cx.ts'
import { useStreaks } from '../hooks/useStreaks.ts'
import type { StreakEntry } from '../types.ts'
import styles from './StreaksTab.module.css'

/** At-risk first ("Charm by Sunday"), then longest streak, then name. */
function byUrgency(a: StreakEntry, b: StreakEntry) {
  return Number(b.at_risk) - Number(a.at_risk) || b.weeks - a.weeks || a.nickname.localeCompare(b.nickname)
}

/** Streaks tab of /activity (?tab=streaks), Figma "Activity - Streaks" (40:685). */
export function StreaksTab() {
  const { streaks, loading, error } = useStreaks()
  const navigate = useNavigate()
  const sorted = [...streaks].sort(byUrgency)

  return (
    <>
      <p className={styles.intro}>Meet once a week with your charmlings to keep a streak!</p>
      <StreakFlame size="xl" className={styles.flame} />

      {loading ? (
        <p className={styles.message}>Loading…</p>
      ) : error ? (
        <p role="alert" className={styles.message}>
          Couldn’t load your streaks. {error}
        </p>
      ) : sorted.length === 0 ? (
        <p className={styles.message}>No streaks yet. Charm someone to start one!</p>
      ) : (
        <ul className={styles.list}>
          {sorted.map((streak) => (
            <li key={streak.id}>
              <StreakRow streak={streak} onOpen={() => navigate(`/u/${encodeURIComponent(streak.id)}`)} />
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

/** Naty's ListRow look (orange when at risk), with the Charmling's head from <Avatar> instead of an image. */
function StreakRow({ streak, onOpen }: { streak: StreakEntry; onOpen: () => void }) {
  return (
    <button
      type="button"
      className={cx(rowStyles.row, rowStyles.button, rowStyles.noRank, streak.at_risk && rowStyles.highlighted)}
      onClick={onOpen}
    >
      <span className={styles.head} aria-hidden="true">
        <Avatar avatar={streak.avatar} size="plaza" idle={false} />
      </span>
      <span className={styles.name}>
        <span className={rowStyles.name}>{streak.nickname}</span>
        {streak.at_risk && <span className={styles.warning}>Charm by Sunday</span>}
      </span>
      <StreakFlame count={streak.weeks} size="sm" tone={streak.at_risk ? 'dark' : 'orange'} />
    </button>
  )
}
