import { useAuth0 } from '@auth0/auth0-react'
import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Avatar } from '../components/Avatar.tsx'
import { Card, InterestTag, ProgressBar, SegmentedTabs } from '../components/ui/index.ts'
import { MemoryGallery } from '../components/memories/MemoryGallery.tsx'
import { useLocations } from '../hooks/useLocations.ts'
import { useMemories } from '../hooks/useMemories.ts'
import { useMyProfile } from '../hooks/useMyProfile.ts'
import { usePlazaVersion } from '../lib/plazaRefresh.ts'
import { onboardingPath } from '../lib/returnTo.ts'
import styles from './Me.module.css'

type Tab = 'interests' | 'memories'

/** /me, Figma "Personal Profile" (74:2727, alternate 71:2596). */
export default function Me() {
  const { isAuthenticated, isLoading: authLoading } = useAuth0()
  const { profile, loading } = useMyProfile(usePlazaVersion())
  const { locations, uniquePeopleMet, loading: locationsLoading } = useLocations()
  const [tab, setTab] = useState<Tab>('interests')
  const {
    memories,
    loading: memoriesLoading,
    error: memoriesError,
    refresh: reloadMemories,
    removeMemory,
  } = useMemories()

  if (authLoading || loading) return <p className={styles.loading}>Loading…</p>
  if (!isAuthenticated) return <Navigate to="/" replace />
  if (!profile) return <Navigate to={onboardingPath('/me')} replace />

  const details = [profile.major, profile.year && `${profile.year} year`].filter(Boolean).join(' · ')
  const nextPlaza = locations.find((l) => !l.unlocked)

  return (
    <main className={styles.screen}>
      <header className={styles.header}>
        <h1 className={styles.title}>Profile</h1>
        <Link to="/settings" className={styles.settings} aria-label="Settings">
          <img src="/sprites/ui/settings.svg" alt="" width={44} height={44} />
        </Link>
      </header>

      <section className={styles.identity}>
        <Avatar avatar={profile.avatar} size="profile" label={profile.nickname} />
        <h2 className={styles.nickname}>{profile.nickname}</h2>
        <p className={styles.details}>
          {details && <span>{details}</span>}
          <Link to="/settings/profile" className={styles.edit}>
            Edit profile
          </Link>
        </p>

        <Card variant="dark" padding="none" className={styles.saying}>
          <p>{profile.greeting ? `“${profile.greeting}”` : 'No saying yet.'}</p>
          <Link to="/settings/line" className={styles.edit} aria-label="Edit saying">
            Edit
          </Link>
        </Card>
      </section>

      <section className={styles.stats} aria-label="Stats">
        {!locationsLoading && (
          <Card variant="outlined" padding="none" className={styles.stat}>
            <span className={styles.statLabel}>Charmlings Collected</span>
            <span className={styles.statValue}>{uniquePeopleMet}</span>
          </Card>
        )}
        <Card variant="outlined" padding="none" className={styles.stat}>
          <span className={styles.statLabel}>Points</span>
          <span className={styles.statValue}>{profile.points}</span>
        </Card>
      </section>

      <section className={styles.tabs}>
        <SegmentedTabs
          variant="folder"
          ariaLabel="Profile sections"
          value={tab}
          onChange={setTab}
          options={[
            { value: 'interests', label: 'Interests' },
            { value: 'memories', label: 'Memories' },
          ]}
          className={styles.tabBar}
        />
        <div className={styles.panel} role="tabpanel">
          {tab === 'interests' ? (
            <>
              {profile.interests.length > 0 ? (
                <ul className={styles.interests}>
                  {profile.interests.map((interest) => (
                    <li key={interest}>
                      <InterestTag label={interest} size="sm" selected />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={styles.empty}>No interests yet.</p>
              )}
              <Link to="/settings/interests" className={styles.edit}>
                Edit interests
              </Link>
            </>
          ) : (
            <MemoryGallery
              memories={memories}
              loading={memoriesLoading}
              error={memoriesError}
              onRetry={reloadMemories}
              onDelete={removeMemory}
            />
          )}
        </div>
      </section>

      {nextPlaza && (
        <ProgressBar
          className={styles.progress}
          value={uniquePeopleMet}
          max={nextPlaza.unlock_at}
          valueLabel={`${uniquePeopleMet}/${nextPlaza.unlock_at} Charmlings`}
          endLabel={nextPlaza.name}
        />
      )}
    </main>
  )
}
