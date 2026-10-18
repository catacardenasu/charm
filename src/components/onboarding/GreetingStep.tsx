import { useState } from 'react'
import { GREETING_MAX_LENGTH, GREETING_SUGGESTIONS } from '../../data/profileOptions.ts'
import type { Avatar as AvatarData } from '../../types.ts'
import { Avatar } from '../Avatar.tsx'
import { SpeechBubble, TextField } from '../ui/index.ts'
import OnboardingLayout from './OnboardingLayout.tsx'
import styles from './steps.module.css'

const SUGGESTION_COUNT = 3

interface Props {
  greeting: string
  avatar: AvatarData
  onChange: (greeting: string) => void
  onBack: () => void
  onFinish: () => void
  saving: boolean
  error: string | null
}

/** Three suggestions, none of them the ones currently showing. */
function pickSuggestions(current: readonly string[]): string[] {
  const pool = GREETING_SUGGESTIONS.filter((s) => !current.includes(s))
  return [...pool].sort(() => Math.random() - 0.5).slice(0, SUGGESTION_COUNT)
}

/** Step 4, Figma "Line Screen" (26:138): greeting with a live speech bubble preview, then save. */
export default function GreetingStep({ greeting, avatar, onChange, onBack, onFinish, saving, error }: Props) {
  const [suggestions, setSuggestions] = useState<string[]>(() => GREETING_SUGGESTIONS.slice(0, SUGGESTION_COUNT))

  return (
    <OnboardingLayout
      step={4}
      title="Say hi!"
      subtitle="A one liner people see when they enter your profile. Keep it short & charming!"
      onBack={saving ? undefined : onBack}
      onNext={onFinish}
      nextLabel={saving ? 'Saving…' : 'Done'}
      nextDisabled={saving}
    >
      <div className={styles.greetingPreview} aria-hidden="true">
        <Avatar avatar={avatar} idle={false} />
        <SpeechBubble className={styles.bubble}>{greeting.trim() || 'Hi!'}</SpeechBubble>
      </div>

      <TextField
        label="Your greeting:"
        value={greeting}
        onChange={(e) => onChange(e.target.value)}
        maxLength={GREETING_MAX_LENGTH}
        showCount
        className={styles.greetingField}
      />

      <p className={styles.label}>Suggestions:</p>
      <ul className={styles.suggestions}>
        {suggestions.map((suggestion) => (
          <li key={suggestion}>
            <button type="button" className={styles.suggestion} onClick={() => onChange(suggestion)}>
              {suggestion}
            </button>
          </li>
        ))}
      </ul>
      <button type="button" className={styles.randomize} onClick={() => setSuggestions(pickSuggestions)}>
        Randomize
        <img className={styles.dice} src="/sprites/ui/dice.png" alt="" />
      </button>

      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
    </OnboardingLayout>
  )
}
