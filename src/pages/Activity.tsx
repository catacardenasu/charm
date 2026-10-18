import { useSearchParams } from 'react-router-dom'
import { SegmentedTabs } from '../components/ui/index.ts'
import { LeaderboardTab } from './LeaderboardTab.tsx'
import { StreaksTab } from './StreaksTab.tsx'
import styles from './Activity.module.css'

type ActivityTab = 'leaderboard' | 'streaks'

/** /activity: Leaderboard (default) and Streaks (?tab=streaks). Figma 38:1000 and 40:685. */
export default function Activity() {
  const [search, setSearch] = useSearchParams()
  const tab: ActivityTab = search.get('tab') === 'streaks' ? 'streaks' : 'leaderboard'

  return (
    <main className={styles.screen}>
      <h1 className={styles.title}>Activity</h1>

      <SegmentedTabs
        ariaLabel="Activity"
        value={tab}
        onChange={(next) => setSearch(next === 'streaks' ? { tab: 'streaks' } : {}, { replace: true })}
        options={[
          { value: 'leaderboard', label: 'Leaderboard' },
          { value: 'streaks', label: 'Streaks' },
        ]}
        className={styles.tabs}
      />

      {tab === 'streaks' ? <StreaksTab /> : <LeaderboardTab />}
    </main>
  )
}
