import { useNavigate } from 'react-router-dom'
import { Avatar } from '../components/Avatar.tsx'
import rowStyles from '../components/ui/ListRow.module.css'
import { cx } from '../components/ui/cx.ts'
import { useLeaderboard } from '../hooks/useLeaderboard.ts'
import type { LeaderboardEntry } from '../types.ts'
import styles from './LeaderboardTab.module.css'

// Podium spots by position in the list: 1st in the middle, 2nd left, 3rd right.
const PODIUM = [
  { place: 1, className: styles.first },
  { place: 2, className: styles.second },
  { place: 3, className: styles.third },
]

function displayName(entry: LeaderboardEntry) {
  return entry.is_me ? 'You' : entry.nickname
}

/** Leaderboard tab of /activity, Figma "Activity - Leaderboard" (38:1000). */
export function LeaderboardTab() {
  const { entries, loading, error } = useLeaderboard()
  const navigate = useNavigate()
  const open = (entry: LeaderboardEntry) => navigate(`/u/${encodeURIComponent(entry.id)}`)

  if (loading) return <p className={styles.message}>Loading…</p>
  if (error) {
    return (
      <p role="alert" className={styles.message}>
        Couldn’t load the leaderboard. {error}
      </p>
    )
  }
  // Just me (or no profile yet): nobody to compete with.
  if (entries.length <= 1) return <p className={styles.message}>Tap someone’s charm to start competing!</p>

  return (
    <>
      <ol className={styles.podium} aria-label="Top 3">
        {PODIUM.filter(({ place }) => place <= entries.length).map(({ place, className }) => (
          <li key={place} className={cx(styles.spot, className)}>
            <PodiumSpot entry={entries[place - 1]} first={place === 1} onOpen={open} />
          </li>
        ))}
      </ol>

      <ol className={styles.list} aria-label="Leaderboard">
        {entries.map((entry) => (
          <li key={entry.id}>
            <LeaderboardRow entry={entry} onOpen={open} />
          </li>
        ))}
      </ol>
    </>
  )
}

interface EntryProps {
  entry: LeaderboardEntry
  onOpen: (entry: LeaderboardEntry) => void
}

/** Full Charmling standing on its block, name and points in the block. 1st and mine are orange; mine isn't tappable. */
function PodiumSpot({ entry, first, onOpen }: EntryProps & { first: boolean }) {
  const content = (
    <>
      <Avatar avatar={entry.avatar} idle={false} className={styles.podiumAvatar} />
      <span className={cx(styles.block, (first || entry.is_me) && styles.highlighted)}>
        <span className={styles.blockName}>{displayName(entry)}</span>
        <span className={styles.blockPoints}>{entry.points} pts</span>
      </span>
    </>
  )

  if (entry.is_me) return <div className={styles.spotInner}>{content}</div>
  return (
    <button type="button" className={cx(styles.spotInner, styles.spotButton)} onClick={() => onOpen(entry)}>
      {content}
    </button>
  )
}

/** Naty's ListRow look (orange for me), with the Charmling's head from <Avatar> instead of an image. */
function LeaderboardRow({ entry, onOpen }: EntryProps) {
  const content = (
    <>
      <span className={rowStyles.rank}>#{entry.rank}</span>
      <span className={styles.head} aria-hidden="true">
        <Avatar avatar={entry.avatar} size="plaza" idle={false} />
      </span>
      <span className={rowStyles.name}>{displayName(entry)}</span>
      <span className={rowStyles.value}>{entry.points} pts</span>
    </>
  )

  const classes = cx(rowStyles.row, entry.is_me && rowStyles.highlighted)
  if (entry.is_me) return <div className={classes}>{content}</div>
  return (
    <button type="button" className={cx(classes, rowStyles.button)} onClick={() => onOpen(entry)}>
      {content}
    </button>
  )
}
