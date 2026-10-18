import { useState, type FormEvent } from 'react'
import type { Avatar as AvatarData } from '../../types.ts'
import { GREETING_MAX_LENGTH, GREETING_SUGGESTIONS } from '../../data/profileOptions.ts'
import { Avatar } from '../Avatar.tsx'
import { Button, SpeechBubble, SPRITES, TextField } from '../ui/index.ts'
import { StepFrame } from '../StepFrame.tsx'
import styles from './GreetingStep.module.css'

interface Props {
  greeting: string
  avatar: AvatarData
  onChange: (greeting: string) => void
  onBack: () => void
  onFinish: () => void
  saving: boolean
  error: string | null
}

const SUGGESTION_COUNT = 3

/** Three suggestions, none of them the ones currently showing. */
function pickSuggestions(current: readonly string[]): string[] {
  const pool = GREETING_SUGGESTIONS.filter((s) => !current.includes(s))
  return [...pool].sort(() => Math.random() - 0.5).slice(0, SUGGESTION_COUNT)
}

/** Step 4: greeting, then save. */
export default function GreetingStep({ greeting, avatar, onChange, onBack, onFinish, saving, error }: Props) {
  const [suggestions, setSuggestions] = useState<string[]>(() => GREETING_SUGGESTIONS.slice(0, SUGGESTION_COUNT))

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
        <Avatar avatar={avatar} label="Your Charmling" />
        <SpeechBubble className={styles.bubble}>{greeting || 'Hi!'}</SpeechBubble>
      </div>

      <TextField
        label="Your greeting:"
        value={greeting}
        onChange={(e) => onChange(e.target.value)}
        maxLength={GREETING_MAX_LENGTH}
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
