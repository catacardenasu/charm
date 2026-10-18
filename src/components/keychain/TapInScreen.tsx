import { Link } from 'react-router-dom'
import type { PromptStatus } from '../../hooks/useTapIn.ts'
import type { Profile, TapInResult } from '../../types.ts'
import { Avatar } from '../Avatar.tsx'
import { ArcText } from '../ArcText.tsx'
import { ALREADY_LOWER, ALREADY_UPPER, MEET_LOWER, MEET_UPPER, SEE_LOWER } from '../arcLetters.ts'
import { Badge, Button, Card, InterestTag, SPRITES } from '../ui/index.ts'
import { cx } from '../ui/cx.ts'
import styles from './TapInScreen.module.css'

interface Props {
  me: Profile | null
  result: TapInResult
  prompt: string | null
  promptStatus: PromptStatus
}

// CLAUDE.md game rules: a first meeting earns 50 points and starts a 1-week streak.
// A later tap in with weeks = 1 earns 10, so this pair only happens on a first meeting.
const FIRST_MEETING_POINTS = 50

/** The tap in result: both avatars, shared interests, prompt, streak, points and unlocks. */
export default function TapInScreen({ me, result, prompt, promptStatus }: Props) {
  const { other, shared_interests, streak_weeks, points_earned, newly_unlocked, status } = result
  const alreadyToday = status === 'already_today'
  const firstMeeting = !alreadyToday && streak_weeks === 1 && points_earned === FIRST_MEETING_POINTS
  const myName = me?.nickname ?? 'You'

  const title = alreadyToday ? "Already charm'd today!" : firstMeeting ? "Charm'd to meet you!" : "Charm'd to see you!"
  const [line1, line2] = alreadyToday
    ? [`${myName} and ${other.nickname} already tapped in today!`, 'Come back tomorrow for more.']
    : firstMeeting
      ? [`${myName} and ${other.nickname} meet!`, `You will now see ${other.nickname} in your plaza.`]
      : [`${myName} and ${other.nickname} tapped in again!`, 'Another day, another charm.']

  return (
    <section className={styles.screen}>
      <div className={styles.hero}>
        <h1 className={styles.title} aria-label={title}>
          <ArcText letters={alreadyToday ? ALREADY_UPPER : MEET_UPPER} animate />
          <ArcText letters={alreadyToday ? ALREADY_LOWER : firstMeeting ? MEET_LOWER : SEE_LOWER} animate />
        </h1>

        {me && (
          <span className={cx(styles.avatar, styles.mine)}>
            <Avatar avatar={me.avatar} label={me.nickname} />
          </span>
        )}
        <span className={cx(styles.avatar, styles.theirs)}>
          <Avatar avatar={other.avatar} label={other.nickname} />
        </span>
        <img className={styles.sparkle} src="/sprites/charm/sparkle.png" alt="" />
        {!alreadyToday && points_earned > 0 && (
          <p className={styles.points} aria-hidden="true">
            +{points_earned} points
          </p>
        )}
      </div>

      <div className={styles.details}>
        <p className={styles.intro}>
          {line1}
          <br />
          {line2}
        </p>

        {!firstMeeting && streak_weeks > 0 && (
          <Badge variant="streak">
            {streak_weeks} {streak_weeks === 1 ? 'week' : 'weeks'} streak
          </Badge>
        )}

        {shared_interests.length > 0 ? (
          <ul className={styles.interests} aria-label="Shared interests">
            {shared_interests.map((interest) => (
              <li key={interest}>
                <InterestTag label={interest} selected />
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.muted}>No shared interests yet. Go find one!</p>
        )}

        {!alreadyToday && (points_earned > 0 || newly_unlocked.length > 0) && (
          <div className={styles.rewards}>
            {points_earned > 0 && (
              <Badge variant="reward" className={styles.reward}>
                +{points_earned} {points_earned === 1 ? 'Point' : 'Points'}
              </Badge>
            )}
            {newly_unlocked.map((location) => (
              <Badge key={location.id} variant="reward" className={styles.reward}>
                Unlocked: {location.name}
              </Badge>
            ))}
          </div>
        )}

        <Card padding="md" className={styles.prompt}>
          <span className={styles.promptLabel}>Your Prompt</span>
          <span className={styles.promptText}>
            {promptStatus === 'ready' && prompt}
            {(promptStatus === 'idle' || promptStatus === 'loading') && 'Thinking of something to talk about…'}
            {promptStatus === 'failed' && "Ask what they're up to this week!"}
          </span>
        </Card>

        {!alreadyToday && !firstMeeting && (
          <Button variant="pill" disabled icon={<img src={SPRITES.camera} alt="" width={30} height={24} />}>
            Snap a memory
          </Button>
        )}
      </div>

      <footer className={styles.footer}>
        <Link to={`/u/${encodeURIComponent(other.id)}`} className={styles.secondaryLink}>
          See {other.nickname}
        </Link>
        <Link to="/plaza" className={styles.primaryLink}>
          Done
        </Link>
      </footer>
    </section>
  )
}
