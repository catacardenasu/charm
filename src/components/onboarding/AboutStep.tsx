import { YEARS } from '../../data/profileOptions.ts'
import type { ProfileFields } from '../../hooks/useSaveProfile.ts'
import { TextField } from '../ui/index.ts'
import { cx } from '../ui/cx.ts'
import OnboardingLayout from './OnboardingLayout.tsx'
import styles from './steps.module.css'

interface Props {
  draft: ProfileFields
  onChange: (changes: Partial<ProfileFields>) => void
  onNext: () => void
}

/** Step 1, Figma "About You" (10:104): nickname, major, year. */
export default function AboutStep({ draft, onChange, onNext }: Props) {
  return (
    <OnboardingLayout
      step={1}
      title="About you"
      subtitle="Just the basics. Only your nickname shows to people you meet."
      onNext={onNext}
      nextDisabled={!draft.nickname.trim()}
    >
      <div className={styles.fields}>
        <TextField
          label="Nickname"
          value={draft.nickname}
          onChange={(e) => onChange({ nickname: e.target.value })}
          maxLength={30}
          autoComplete="nickname"
          required
        />
        <TextField
          label="Major"
          value={draft.major ?? ''}
          onChange={(e) => onChange({ major: e.target.value || null })}
        />
        <div role="radiogroup" aria-labelledby="onboarding-year" className={styles.yearGroup}>
          <p id="onboarding-year" className={styles.label}>
            Year
          </p>
          <div className={styles.years}>
            {YEARS.map((year) => {
              const selected = draft.year === year
              return (
                <button
                  key={year}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  className={cx(styles.year, selected && styles.selected)}
                  onClick={() => onChange({ year })}
                >
                  {year}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </OnboardingLayout>
  )
}
