import { useAuth0 } from '@auth0/auth0-react'
import { useEffect, useState, type ReactNode } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Button, Modal } from '../components/ui/index.ts'
import { cx } from '../components/ui/cx.ts'
import { useDeactivateKeychain } from '../hooks/useDeactivateKeychain.ts'
import { useKeychainLinked } from '../hooks/useKeychainLinked.ts'
import { useMyKeychain } from '../hooks/useMyKeychain.ts'
import { useMyProfile } from '../hooks/useMyProfile.ts'
import { clearLinking, startLinking } from '../lib/linking.ts'
import { onboardingPath } from '../lib/returnTo.ts'
import styles from './Settings.module.css'

/** "Anime, Art, Video Games, +9" */
function summarize(interests: string[]) {
  const shown = interests.slice(0, 3).join(', ')
  return interests.length > 3 ? `${shown}, +${interests.length - 3}` : shown
}

const formatDay = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

/** /settings, Figma "Settings" (49:2100). */
export default function Settings() {
  const { isAuthenticated, isLoading: authLoading, logout } = useAuth0()
  const { profile, loading } = useMyProfile()

  if (authLoading || loading) return <p className={styles.loading}>Loading…</p>
  if (!isAuthenticated) return <Navigate to="/" replace />
  if (!profile) return <Navigate to={onboardingPath('/settings')} replace />

  return (
    <main className={styles.screen}>
      <header className={styles.header}>
        <h1 className={styles.title}>Settings</h1>
        <Link to="/me" className={styles.gear} aria-label="Back to profile">
          <img src="/sprites/ui/settings.svg" alt="" width={44} height={44} />
        </Link>
      </header>

      <Section title="Profile">
        <RowLink to="/settings/interests" label="Edit Interests" detail={summarize(profile.interests)} />
        <RowLink to="/settings/profile" label="Edit Profile" />
        <RowLink to="/settings/line" label="Edit Saying" />
      </Section>

      <Section title="My charm">
        <MyCharm />
      </Section>

      <Section title="Account">
        <button
          type="button"
          className={styles.row}
          onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
        >
          Log Out
        </button>
      </Section>
    </main>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      <div className={styles.rows}>{children}</div>
    </section>
  )
}

function RowLink({ to, label, detail }: { to: string; label: string; detail?: string }) {
  return (
    <Link to={to} className={cx(styles.row, detail && styles.tall)}>
      <span className={styles.rowText}>
        {label}
        {detail && <span className={styles.detail}>{detail}</span>}
      </span>
      <span className={styles.chevron} aria-hidden="true">
        &gt;
      </span>
    </Link>
  )
}

/** Linked charm + "Lost my charm", or the "Got a charm?" card that starts linking. */
function MyCharm() {
  const { keychain, loading, refresh } = useMyKeychain()
  const [linking, setLinking] = useState(false)
  const linked = useKeychainLinked(linking && !keychain)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { deactivateKeychain, deactivating } = useDeactivateKeychain()

  // Tapping the charm opens /k/:code in Safari, which claims it (charm:linking). Pick it up here.
  useEffect(() => {
    if (!linked) return
    clearLinking()
    refresh()
  }, [linked, refresh])

  if (loading) return <p className={styles.note}>Loading…</p>

  if (!keychain) {
    const start = () => {
      startLinking()
      setLinking(true)
    }
    return (
      <div className={styles.card}>
        <p>Got a charm? Tap it on your phone to link it.</p>
        {linking ? (
          <p className={styles.note} aria-live="polite">
            Linking… hold your charm to the back of your phone, near the camera.
          </p>
        ) : (
          <Button size="md" onClick={start}>
            Link my charm
          </Button>
        )}
      </div>
    )
  }

  const lose = async () => {
    setError(null)
    try {
      const status = await deactivateKeychain(keychain.code)
      if (status === 'not_yours') {
        setError('This charm isn’t linked to you anymore.')
        return
      }
      // 'deactivated' or 'already_inactive': either way it's off, so show the "Got a charm?" card.
      setConfirming(false)
      setLinking(false)
      refresh()
    } catch (e) {
      setError((e as { message?: string }).message ?? 'Something went wrong. Try again.')
    }
  }

  return (
    <>
      <div className={styles.row}>
        <span className={styles.rowText}>
          {keychain.claimed_at ? `Charm linked since ${formatDay(keychain.claimed_at)}` : 'Charm linked'}
        </span>
      </div>
      <button type="button" className={styles.row} onClick={() => setConfirming(true)}>
        <span className={styles.rowText}>Lost my charm</span>
      </button>

      <Modal
        open={confirming}
        onClose={() => setConfirming(false)}
        title="Lost your charm?"
        actions={
          <>
            <Button variant="secondary" size="md" onClick={() => setConfirming(false)} disabled={deactivating}>
              Cancel
            </Button>
            <Button size="md" onClick={lose} disabled={deactivating}>
              {deactivating ? 'Deactivating…' : 'Deactivate'}
            </Button>
          </>
        }
      >
        <p>We’ll turn it off so nobody can Charm you with it. You can link a new charm after.</p>
        {error && <p role="alert">{error}</p>}
      </Modal>
    </>
  )
}
