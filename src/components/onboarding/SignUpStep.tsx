import type { FormEvent } from 'react'
import { INTERESTS, YEARS } from '../../data/profileOptions.ts'
import type { ProfileFields } from '../../hooks/useSaveProfile.ts'

interface Props {
  draft: ProfileFields
  onChange: (changes: Partial<ProfileFields>) => void
  onNext: () => void
}

/** Step 1: nickname, interests, major, year. */
export default function SignUpStep({ draft, onChange, onNext }: Props) {
  const toggleInterest = (interest: string) =>
    onChange({
      interests: draft.interests.includes(interest)
        ? draft.interests.filter((i) => i !== interest)
        : [...draft.interests, interest],
    })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (draft.nickname.trim()) onNext()
  }

  return (
    <form onSubmit={submit}>
      <h1>Sign up</h1>
      <p>Only your nickname is shown to people you meet. Never share contact info.</p>

      <label>
        Nickname
        <input
          value={draft.nickname}
          onChange={(e) => onChange({ nickname: e.target.value })}
          maxLength={30}
          required
          autoComplete="nickname"
        />
      </label>

      <fieldset>
        <legend>Interests</legend>
        {INTERESTS.map((interest) => (
          <label key={interest}>
            <input
              type="checkbox"
              checked={draft.interests.includes(interest)}
              onChange={() => toggleInterest(interest)}
            />
            {interest}
          </label>
        ))}
      </fieldset>

      <label>
        Major
        <input value={draft.major ?? ''} onChange={(e) => onChange({ major: e.target.value || null })} />
      </label>

      <label>
        Year
        <select value={draft.year ?? ''} onChange={(e) => onChange({ year: e.target.value || null })}>
          <option value="">Choose…</option>
          {YEARS.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </label>

      <button type="submit">Next</button>
    </form>
  )
}
