import { useState, type FormEvent } from 'react'
import type { Avatar as AvatarData } from '../../types.ts'
import { Avatar } from '../Avatar.tsx'
import { Button, SpeechBubble, SPRITES, TextField } from '../ui/index.ts'
import { StepFrame } from '../StepFrame.tsx'
import styles from './GreetingStep.module.css'

interface Props {
  greeting: string
  onChange: (greeting: string) => void
  onBack: () => void
  onFinish: () => void
  saving: boolean
  error: string | null
  /** The avatar to show next to the speech bubble. Without it the bubble stands alone. */
  avatar?: AvatarData
}

// Ideas to tap, three at a time. Friendly, short and campus-appropriate.
const SUGGESTIONS = [
  'I’ll drive anywhere for a good coffee',
  'You can always find me in Marston!',
  'Ask me about any fantasy book',
  'Go Gators! Ask me about game day',
  'Currently on the hunt for the best study spot',
  'Ask me what I’m building this week',
  'I will talk about my favorite show for hours',
  'Always down for a walk by Lake Alice',
  'Ask me about my sketchbook!',
  'Looking for a gym buddy',
  'I make a mean batch of cookies',
  'Teach me your favorite board game',
]
const SUGGESTION_COUNT = 3

function pickSuggestions(avoid: string[] = []) {
  const fresh = SUGGESTIONS.filter((s) => !avoid.includes(s))
  const pool = fresh.length >= SUGGESTION_COUNT ? fresh : SUGGESTIONS
  return [...pool].sort(() => Math.random() - 0.5).slice(0, SUGGESTION_COUNT)
}

/** Step 4: greeting, then save. */
export default function GreetingStep({ greeting, onChange, onBack, onFinish, saving, error, avatar }: Props) {
  const [suggestions, setSuggestions] = useState(() => pickSuggestions())

  const submit = (e: FormEvent) => {
    e.preventDefault()
    onFinish()
  }

  return (
    <StepFrame
      step={4}
      title="Say hi!"
      intro="A one liner people see when they enter your profile. Keep it short & charming!"
      onSubmit={submit}
      footer={
        <>
          <Button variant="secondary" fullWidth onClick={onBack} disabled={saving}>
            Back
          </Button>
          <Button type="submit" fullWidth disabled={saving}>
            {saving ? 'Saving…' : 'Next'}
          </Button>
        </>
      }
    >
      <div className={styles.preview}>
        {avatar && <Avatar avatar={avatar} label="Your Charmling" />}
        <SpeechBubble className={styles.bubble}>{greeting || 'Hi!'}</SpeechBubble>
      </div>

      <TextField
        label="Your greeting:"
        value={greeting}
        onChange={(e) => onChange(e.target.value)}
        maxLength={80}
        showCount
        placeholder="Ask me about my sketchbook!"
      />

      <div className={styles.suggestions}>
        <p className={styles.label}>Suggestions:</p>
        {suggestions.map((suggestion) => (
          <button key={suggestion} type="button" className={styles.suggestion} onClick={() => onChange(suggestion)}>
            {suggestion}
          </button>
        ))}
        <button type="button" className={styles.randomize} onClick={() => setSuggestions((current) => pickSuggestions(current))}>
          Randomize
          <img src={SPRITES.dice} alt="" width={22} height={22} />
        </button>
      </div>

      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
    </StepFrame>
  )
}
