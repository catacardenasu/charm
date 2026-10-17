import { useState, type FormEvent } from 'react'
import { INTERESTS, YEARS } from '../../data/profileOptions.ts'
import type { ProfileFields } from '../../hooks/useSaveProfile.ts'
import { Button, CategoryTabs, InterestTag, TextField } from '../ui/index.ts'
import { StepFrame } from '../StepFrame.tsx'
import styles from './SignUpStep.module.css'

interface Props {
  draft: ProfileFields
  onChange: (changes: Partial<ProfileFields>) => void
  onNext: () => void
}

// How the Interests screen groups the interest tags. Anything not listed here lands under "More".
const INTEREST_GROUPS: Array<[title: string, interests: readonly string[]]> = [
  ['Games', ['video games', 'board games']],
  ['Creative', ['pixel art', 'photography']],
  ['Music & Film', ['guitar', 'k-pop', 'film', 'anime', 'reading']],
  ['Sports', ['basketball', 'gators football', 'gym', 'running', 'volleyball', 'hiking']],
  ['Food & Drinks', ['coffee', 'baking', 'cooking']],
  ['Campus', ['hackathons', 'robotics']],
  ['Lifestyle', ['thrifting']],
]

// The year picker shows short labels. The stored values stay as they were.
const YEAR_LABELS: Record<(typeof YEARS)[number], string> = {
  Freshman: '1st',
  Sophomore: '2nd',
  Junior: '3rd',
  Senior: '4th',
  Grad: 'Grad',
}

/** Step 1: About you (nickname, major, year), then Interests. */
export default function SignUpStep({ draft, onChange, onNext }: Props) {
  const [part, setPart] = useState<'about' | 'interests'>('about')

  const toggleInterest = (interest: string) =>
    onChange({
      interests: draft.interests.includes(interest)
        ? draft.interests.filter((i) => i !== interest)
        : [...draft.interests, interest],
    })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (draft.nickname.trim()) setPart('interests')
  }

  if (part === 'about') {
    return (
      <StepFrame
        step={1}
        title="About you"
        intro="Just the basics. Only your nickname shows to people you meet."
        onSubmit={submit}
        footer={<Button type="submit" fullWidth>Next</Button>}
      >
        <TextField
          label="Nickname"
          value={draft.nickname}
          onChange={(e) => onChange({ nickname: e.target.value })}
          maxLength={30}
          required
          autoComplete="nickname"
        />

        <TextField
          label="Major"
          value={draft.major ?? ''}
          onChange={(e) => onChange({ major: e.target.value || null })}
        />

        <div className={styles.year}>
          <p className={styles.label}>Year</p>
          <CategoryTabs
            ariaLabel="Year"
            size="lg"
            value={draft.year ?? ''}
            onChange={(year) => onChange({ year })}
            options={YEARS.map((year) => ({ value: year, label: YEAR_LABELS[year] }))}
          />
        </div>
      </StepFrame>
    )
  }

  const known = new Set(INTEREST_GROUPS.flatMap(([, interests]) => interests))
  const others = INTERESTS.filter((interest) => !known.has(interest))
  const groups = [...INTEREST_GROUPS, ...(others.length > 0 ? [['More', others] as const] : [])]
  const count = draft.interests.length

  return (
    <StepFrame
      step={2}
      title="Interests"
      intro="Pick 3 or more, this helps us find what you have in common"
      stickyFooter
      footerNote={`${count} ${count === 1 ? 'Interest' : 'Interests'} Picked`}
      footer={
        <>
          <Button variant="secondary" fullWidth onClick={() => setPart('about')}>
            Back
          </Button>
          <Button fullWidth onClick={onNext}>
            Next
          </Button>
        </>
      }
    >
      <div className={styles.picked} aria-label="Picked interests">
        {count > 0 ? (
          draft.interests.map((interest) => (
            <InterestTag key={interest} label={interest} onRemove={() => toggleInterest(interest)} />
          ))
        ) : (
          <p className={styles.empty}>Tap an interest to add it</p>
        )}
      </div>

      {groups.map(([title, interests]) => {
        const available = interests.filter((interest) => (INTERESTS as readonly string[]).includes(interest))
        if (available.length === 0) return null
        return (
          <fieldset key={title} className={styles.group}>
            <legend className={styles.legend}>{title}</legend>
            <div className={styles.tags}>
              {available.map((interest) => (
                <InterestTag
                  key={interest}
                  label={interest}
                  selected={draft.interests.includes(interest)}
                  onToggle={() => toggleInterest(interest)}
                />
              ))}
            </div>
          </fieldset>
        )
      })}
    </StepFrame>
  )
}
