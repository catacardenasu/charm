import { Link } from 'react-router-dom'
import type { PromptStatus } from '../../hooks/useTapIn.ts'
import type { Profile, TapInResult } from '../../types.ts'
import AvatarView from '../AvatarView.tsx'

interface Props {
  me: Profile | null
  result: TapInResult
  prompt: string | null
  promptStatus: PromptStatus
}

/** The tap in result: both avatars, shared interests, prompt, streak, points and unlocks. */
export default function TapInScreen({ me, result, prompt, promptStatus }: Props) {
  const { other, shared_interests, streak_weeks, points_earned, newly_unlocked } = result

  return (
    <section>
      <h1>
        {result.status === 'already_today'
          ? `You already tapped in with ${other.nickname} today`
          : `You tapped in with ${other.nickname}!`}
      </h1>

      <div>
        {me && <AvatarView avatar={me.avatar} name={me.nickname} />}
        <AvatarView avatar={other.avatar} name={other.nickname} />
      </div>

      <h2>Shared interests</h2>
      {shared_interests.length > 0 ? (
        <ul>
          {shared_interests.map((interest) => (
            <li key={interest}>{interest}</li>
          ))}
        </ul>
      ) : (
        <p>No shared interests yet. Go find one!</p>
      )}

      <h2>Conversation starter</h2>
      <p>
        {promptStatus === 'ready' && prompt}
        {(promptStatus === 'idle' || promptStatus === 'loading') && 'Thinking of something to talk about…'}
        {promptStatus === 'failed' && "Ask what they're up to this week!"}
      </p>

      <p>
        Streak: {streak_weeks} {streak_weeks === 1 ? 'week' : 'weeks'}
      </p>
      {points_earned > 0 && <p>+{points_earned} points</p>}

      {newly_unlocked.map((location) => (
        <p key={location.id}>New location unlocked: {location.name}</p>
      ))}

      <Link to="/plaza">Go to your plaza</Link>
    </section>
  )
}
