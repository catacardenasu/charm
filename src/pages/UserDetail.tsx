import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { Avatar } from '../components/Avatar.tsx'
import { MemoryGallery } from '../components/memories/MemoryGallery.tsx'
import { Card, InterestTag, SpeechBubble, StreakFlame } from '../components/ui/index.ts'
import { useMemories } from '../hooks/useMemories.ts'
import { usePerson } from '../hooks/usePerson.ts'
import styles from './UserDetail.module.css'

/** 'YYYY-MM-DD' → "Oct 16", read as a calendar day (no UTC shift). */
function formatDay(day: string) {
  const [y, m, d] = day.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/** /u/:userId, Figma "Charmling Profile" (40:904). Opened from plaza avatars and streak rows. */
export default function UserDetail() {
  const { userId } = useParams()
  const { person, loading, error } = usePerson(userId)
  // Only the memories from tap ins between me and this person (my_memories filters by both user ids, whoever took the photo).
  const together = useMemories(userId)
  const navigate = useNavigate()
  const location = useLocation()

  // Back to wherever they came from; straight to the plaza if they landed here directly.
  const back = () => (location.key === 'default' ? navigate('/plaza') : navigate(-1))

  const header = (title: string) => (
    <header className={styles.header}>
      <button type="button" className={styles.back} onClick={back} aria-label="Back">
        &lt;
      </button>
      <h1 className={styles.nickname}>{title}</h1>
    </header>
  )

  if (loading) return <main className={styles.screen}>{header('')}<p className={styles.message}>Loading…</p></main>
  if (error || !person) {
    return (
      <main className={styles.screen}>
        {header('')}
        <p role={error ? 'alert' : undefined} className={styles.message}>
          {error ? `Couldn’t load this Charmling. ${error}` : 'You haven’t Charm’d this Charmling yet.'}
        </p>
      </main>
    )
  }

  const { profile, shared_interests, weeks, first_met, last_day } = person
  const shared = new Set(shared_interests.map((i) => i.trim().toLowerCase()))
  // Shared ones first, so the highlights lead.
  const interests = [...profile.interests].sort(
    (a, b) => Number(shared.has(b.trim().toLowerCase())) - Number(shared.has(a.trim().toLowerCase())),
  )
  const since = [
    first_met && `Charmed since ${formatDay(first_met)}.`,
    last_day && first_met !== last_day && `Last Charm’d on ${formatDay(last_day)}.`,
  ].filter(Boolean)

  return (
    <main className={styles.screen}>
      {header(profile.nickname)}

      <section className={styles.hero}>
        <Avatar avatar={profile.avatar} size="profile" label={profile.nickname} />
        <div className={styles.heroSide}>
          {profile.greeting && <SpeechBubble className={styles.bubble}>{profile.greeting}</SpeechBubble>}
          <p className={styles.streak} aria-label={`${weeks} week streak`}>
            <span aria-hidden="true">{weeks}</span>
            <StreakFlame size="lg" />
          </p>
        </div>
      </section>

      {since.length > 0 && (
        <Card variant="dark" padding="none" className={styles.since}>
          {since.map((line) => (
            <p key={line as string}>{line}</p>
          ))}
        </Card>
      )}

      <section className={styles.section}>
        <h2 className={styles.label}>Shared interests:</h2>
        {interests.length > 0 ? (
          <ul className={styles.interests}>
            {interests.map((interest) => (
              <li key={interest}>
                <InterestTag label={interest} selected={shared.has(interest.trim().toLowerCase())} />
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.empty}>No interests yet.</p>
        )}
        {interests.length > 0 && shared.size === 0 && <p className={styles.empty}>Nothing in common yet. Ask what they’re into!</p>}
      </section>

      <section className={styles.section}>
        <h2 className={styles.label}>Memories Together:</h2>
        <MemoryGallery
          memories={together.memories}
          loading={together.loading}
          error={together.error}
          onRetry={together.refresh}
          onDelete={together.removeMemory}
          emptyHint={`Snap a photo when you Charm ${profile.nickname} and it will live here!`}
        />
      </section>
    </main>
  )
}
