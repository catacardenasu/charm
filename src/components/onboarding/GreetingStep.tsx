import type { FormEvent } from 'react'

interface Props {
  greeting: string
  onChange: (greeting: string) => void
  onBack: () => void
  onFinish: () => void
  saving: boolean
  error: string | null
}

/** Step 3: greeting, then save. */
export default function GreetingStep({ greeting, onChange, onBack, onFinish, saving, error }: Props) {
  const submit = (e: FormEvent) => {
    e.preventDefault()
    onFinish()
  }

  return (
    <form onSubmit={submit}>
      <h1>Say hi</h1>
      <label>
        Greeting
        <input
          value={greeting}
          onChange={(e) => onChange(e.target.value)}
          maxLength={80}
          placeholder="Ask me about my sketchbook!"
        />
      </label>
      <p>People see this when they tap in with you.</p>

      <button type="button" onClick={onBack} disabled={saving}>
        Back
      </button>
      <button type="submit" disabled={saving}>
        {saving ? 'Saving…' : 'Finish'}
      </button>
      {error && <p role="alert">{error}</p>}
    </form>
  )
}
