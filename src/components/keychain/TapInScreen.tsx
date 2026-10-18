import { Link } from 'react-router-dom'
import type { PromptStatus } from '../../hooks/useTapIn.ts'
import type { Profile, TapInResult } from '../../types.ts'
import { Avatar } from '../Avatar.tsx'
import { Badge, Button, Card, InterestTag, SPRITES } from '../ui/index.ts'
import buttonStyles from '../ui/Button.module.css'
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

type Variant = 'first' | 'again' | 'already'

/**
 * The tap in result, from Figma "Meeting Somone" (33:781) and "Seeing you" (39:1347).
 * 'already' (tapped in earlier today) is a simpler version with no title arc or rewards.
 */
export default function TapInScreen({ me, result, prompt, promptStatus }: Props) {
  const { other, shared_interests, streak_weeks, points_earned, newly_unlocked } = result
  const variant: Variant =
    result.status === 'already_today'
      ? 'already'
      : streak_weeks === 1 && points_earned === FIRST_MEETING_POINTS
        ? 'first'
        : 'again'
  const myName = me?.nickname ?? 'You'

  return (
    <section className={cx(styles.screen, styles[variant])}>
      {variant === 'already' ? (
        <header className={styles.simpleHeader}>
          <h1 className={styles.simpleTitle}>Already charm’d today!</h1>
          <Pair me={me} other={other} />
          <p className={styles.caption}>
            {myName} and {other.nickname} already tapped in today. Tap in again tomorrow.
          </p>
        </header>
      ) : (
        <header className={styles.hero}>
          <ArcTitle variant={variant} />
          <Pair me={me} other={other} />
        </header>
      )}

      {variant === 'first' && (
        <p className={styles.caption}>
          {myName} and {other.nickname} meet!
          <br />
          You will now see {other.nickname} in your plaza.
        </p>
      )}

      {variant === 'again' && (
        <>
          <p className={styles.caption}>
            {myName} and {other.nickname} tapped in again!
            <br />
            Another day, another charm.
          </p>
          <Badge variant="streak" className={styles.streak}>
            {streak_weeks} week streak
          </Badge>
        </>
      )}

      {variant !== 'already' && (
        <>
          {shared_interests.length > 0 ? (
            <ul className={styles.interests} aria-label="Shared interests">
              {shared_interests.map((interest) => (
                <li key={interest}>
                  <InterestTag label={interest} selected />
                </li>
              ))}
            </ul>
          ) : (
            <p className={cx(styles.caption, styles.interests)}>No shared interests yet. Go find one!</p>
          )}

          {points_earned > 0 && (
            <div className={styles.rewards}>
              <Badge variant="reward">+{points_earned} Points</Badge>
            </div>
          )}

          {newly_unlocked.map((location) => (
            <Badge key={location.id} variant="status" className={styles.unlock}>
              New plaza unlocked: {location.name}
            </Badge>
          ))}
        </>
      )}

      <Card variant="cream" padding="none" className={styles.prompt}>
        <p className={styles.promptLabel}>Your Prompt</p>
        <p className={styles.promptText} aria-live="polite">
          {promptStatus === 'ready' && prompt}
          {(promptStatus === 'idle' || promptStatus === 'loading') && 'Thinking of something to talk about…'}
          {promptStatus === 'failed' && "Ask what they're up to this week!"}
        </p>
      </Card>

      {variant === 'again' && (
        // Memory photos aren't built yet (build order step 6).
        <Button
          variant="pill"
          className={styles.memory}
          icon={<img className={styles.camera} src={SPRITES.camera} alt="" />}
          disabled
        >
          Snap a memory
        </Button>
      )}

      <footer className={styles.footer}>
        <Link
          to={`/u/${encodeURIComponent(other.id)}`}
          className={cx(buttonStyles.button, buttonStyles.secondary, buttonStyles.lg, styles.footerButton)}
        >
          <span className={buttonStyles.label}>See {other.nickname}</span>
        </Link>
        <Link
          to="/plaza"
          className={cx(buttonStyles.button, buttonStyles.primary, buttonStyles.lg, styles.footerButton)}
        >
          <span className={buttonStyles.label}>Done</span>
        </Link>
      </footer>
    </section>
  )
}

function Pair({ me, other }: { me: Profile | null; other: Profile }) {
  return (
    <div className={styles.pair}>
      {me && <Avatar avatar={me.avatar} label={me.nickname} />}
      <Avatar avatar={other.avatar} label={other.nickname} />
    </div>
  )
}

/**
 * "Charm'd to / meet you!" (or "see you!") curved around the avatars. Arc radii and letter
 * spacing are fitted to the per-letter rotations in the Figma frames; coordinates are in the
 * hero box, whose top is the bottom of the status bar.
 */
function ArcTitle({ variant }: { variant: 'first' | 'again' }) {
  const lower = variant === 'first' ? 'meet you!' : 'see you!'
  const upperPath =
    variant === 'first' ? 'M 44.2 163.5 A 181 181 0 0 1 357.8 163.5' : 'M 44.2 146.5 A 181 181 0 0 1 357.8 146.5'
  const lowerPath =
    variant === 'first' ? 'M 25.2 251.5 A 203 203 0 0 0 376.8 251.5' : 'M 6.2 255.6 A 303 303 0 0 0 395.8 255.6'
  const upperId = `tapin-arc-upper-${variant}`
  const lowerId = `tapin-arc-lower-${variant}`

  return (
    <h1 className={styles.title}>
      <span className={styles.srOnly}>Charm'd to {lower}</span>
      <svg className={styles.arc} viewBox={`0 0 402 ${variant === 'first' ? 376 : 348}`} aria-hidden="true">
        <defs>
          <path id={upperId} d={upperPath} />
          <path id={lowerId} d={lowerPath} />
        </defs>
        <text>
          <textPath href={`#${upperId}`} startOffset="50%" textAnchor="middle">
            charm’d to
          </textPath>
        </text>
        <text>
          <textPath href={`#${lowerId}`} startOffset="50%" textAnchor="middle">
            {lower}
          </textPath>
        </text>
      </svg>
    </h1>
  )
}
