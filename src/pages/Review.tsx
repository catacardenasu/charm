import { useAuth0 } from '@auth0/auth0-react'
import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Avatar } from '../components/Avatar.tsx'
import { Button, Modal } from '../components/ui/index.ts'
import rowStyles from '../components/ui/ListRow.module.css'
import { cx } from '../components/ui/cx.ts'
import { useRecentTapIns } from '../hooks/useRecentTapIns.ts'
import { useRemoveTapIn } from '../hooks/useRemoveTapIn.ts'
import type { RecentTapIn } from '../types.ts'
import styles from './Review.module.css'

/** Today in America/New_York as 'YYYY-MM-DD', the same day boundary the database uses. */
function todayInNewYork() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date())
}

/** 'today', 'yesterday', or 'on Monday' for a 'YYYY-MM-DD' day in the last week. */
function whenLabel(day: string) {
  const daysAgo = Math.round((Date.parse(todayInNewYork()) - Date.parse(day)) / 86_400_000)
  if (daysAgo <= 0) return 'today'
  if (daysAgo === 1) return 'yesterday'
  return `on ${new Date(`${day}T12:00:00Z`).toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' })}`
}

/** "Maya tapped in with you today" / "You tapped in with Maya yesterday" */
function describe(tapIn: RecentTapIn) {
  const when = whenLabel(tapIn.day)
  return tapIn.scanned_by_me ? `You tapped in with ${tapIn.nickname} ${when}` : `${tapIn.nickname} tapped in with you ${when}`
}

/** /review: tap ins from the last 7 days, each with a remove option. */
export default function Review() {
  const { isAuthenticated, isLoading: authLoading } = useAuth0()
  const { tapIns, loading, error, refresh } = useRecentTapIns()
  const { removeTapIn, removing } = useRemoveTapIn()
  const [confirming, setConfirming] = useState<RecentTapIn | null>(null)
  const [removeError, setRemoveError] = useState<string | null>(null)

  if (!authLoading && !isAuthenticated) return <Navigate to="/" replace />

  const closeModal = () => {
    if (removing) return
    setConfirming(null)
    setRemoveError(null)
  }

  const confirmRemove = async () => {
    if (!confirming) return
    setRemoveError(null)
    try {
      await removeTapIn(confirming.id)
      setConfirming(null)
      refresh()
    } catch {
      setRemoveError('Couldn’t remove it. Try again.')
    }
  }

  return (
    <main className={styles.screen}>
      <header className={styles.header}>
        <Link to="/settings" className={styles.back}>
          ‹ Back
        </Link>
        <h1 className={styles.title}>Tap in review</h1>
      </header>

      <p className={styles.intro}>
        Everyone who tapped in with you this week. Don’t recognize someone? Remove the tap in.
      </p>

      {authLoading || loading ? (
        <p className={styles.message}>Loading…</p>
      ) : error ? (
        <p role="alert" className={styles.message}>
          Couldn’t load your tap ins. {error}
        </p>
      ) : tapIns.length === 0 ? (
        <p className={styles.message}>No tap ins in the last 7 days.</p>
      ) : (
        <ul className={styles.list}>
          {tapIns.map((tapIn) => (
            <li key={tapIn.id} className={cx(rowStyles.row, rowStyles.noRank, styles.row)}>
              <span className={styles.head} aria-hidden="true">
                <Avatar avatar={tapIn.avatar} size="plaza" idle={false} />
              </span>
              <span className={styles.text}>{describe(tapIn)}</span>
              <button
                type="button"
                className={styles.remove}
                onClick={() => setConfirming(tapIn)}
                aria-label={`Remove tap in with ${tapIn.nickname}`}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={confirming != null}
        onClose={closeModal}
        dismissible={!removing}
        title={confirming ? `Remove tap in with ${confirming.nickname}?` : ''}
        actions={
          <>
            <Button variant="secondary" size="md" onClick={closeModal} disabled={removing}>
              Cancel
            </Button>
            <Button size="md" onClick={() => void confirmRemove()} disabled={removing}>
              {removing ? 'Removing…' : 'Remove'}
            </Button>
          </>
        }
      >
        {confirming && (
          <p>
            {confirming.points_awarded > 0
              ? `You’ll both lose the ${confirming.points_awarded} points it earned, and your streak will be recalculated.`
              : 'Your streak will be recalculated.'}
          </p>
        )}
        {removeError && <p role="alert">{removeError}</p>}
      </Modal>
    </main>
  )
}
