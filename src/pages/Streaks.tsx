import { useNavigate } from 'react-router-dom'
import { Avatar } from '../components/Avatar.tsx'
import { SegmentedTabs, StreakFlame } from '../components/ui/index.ts'
import rowStyles from '../components/ui/ListRow.module.css'
import { cx } from '../components/ui/cx.ts'
import { useStreaks } from '../hooks/useStreaks.ts'
import type { StreakEntry } from '../types.ts'
import styles from './Streaks.module.css'

/** At-risk first ("tap in by Sunday"), then longest streak, then name. */
function byUrgency(a: StreakEntry, b: StreakEntry) {
  return Number(b.at_risk) - Number(a.at_risk) || b.weeks - a.weeks || a.nickname.localeCompare(b.nickname)
}

/** /streaks, Figma "Activity - Streaks" (40:685). */
export default function Streaks() {
  const { streaks, loading, error } = useStreaks()
  const navigate = useNavigate()
  const sorted = [...streaks].sort(byUrgency)

  return (
    <main className={styles.screen}>
      <h1 className={styles.title}>Activity</h1>

      <SegmentedTabs
        ariaLabel="Activity"
        value="streaks"
        onChange={() => {}}
        options={[
          { value: 'leaderboard', label: 'Leaderboard (soon)', disabled: true },
          { value: 'streaks', label: 'Streaks' },
        ]}
        className={styles.tabs}
      />

      <p className={styles.intro}>Meet once a week with your charmlings to keep a streak!</p>
      <StreakFlame size="xl" className={styles.flame} />

      {loading ? (
        <p className={styles.message}>Loading…</p>
      ) : error ? (
        <p role="alert" className={styles.message}>
          Couldn’t load your streaks. {error}
        </p>
      ) : sorted.length === 0 ? (
        <p className={styles.message}>No streaks yet. Tap in with someone to start one!</p>
      ) : (
        <ul className={styles.list}>
          {sorted.map((streak) => (
            <li key={streak.id}>
              <StreakRow streak={streak} onOpen={() => navigate(`/u/${encodeURIComponent(streak.id)}`)} />
            </li>
          ))}
        </ul>
      )}
    </main>
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
        {streak.at_risk && <span className={styles.warning}>Tap in by Sunday</span>}
      </span>
      <StreakFlame count={streak.weeks} size="sm" tone={streak.at_risk ? 'dark' : 'orange'} />
    </button>
  )
}
