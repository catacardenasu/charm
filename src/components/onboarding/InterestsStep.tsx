import { INTEREST_CATEGORIES, MAX_INTERESTS, MIN_INTERESTS } from '../../data/profileOptions.ts'
import { InterestTag } from '../ui/index.ts'
import OnboardingLayout from './OnboardingLayout.tsx'
import styles from './steps.module.css'

interface Props {
  interests: string[]
  onChange: (interests: string[]) => void
  onBack: () => void
  onNext: () => void
  /** Settings edit screens: their own title, no progress bar, "Done". */
  title?: string
  progress?: boolean
  nextLabel?: string
  nextDisabled?: boolean
  error?: string | null
}

/** Step 2, Figma "Interests" (18:201): picked tags strip, tags by category, pinned counter footer. */
export default function InterestsStep({
  interests,
  onChange,
  onBack,
  onNext,
  title = 'Interests',
  progress = true,
  nextLabel,
  nextDisabled = false,
  error,
}: Props) {
  const full = interests.length >= MAX_INTERESTS
  const toggle = (interest: string, selected: boolean) =>
    onChange(selected ? [...interests, interest] : interests.filter((i) => i !== interest))

  return (
    <OnboardingLayout
      step={progress ? 2 : undefined}
      title={title}
      subtitle={`Pick ${MIN_INTERESTS} or more, this helps us find what you have in common`}
      onBack={onBack}
      onNext={onNext}
      nextLabel={nextLabel}
      nextDisabled={nextDisabled || interests.length < MIN_INTERESTS}
      error={error}
      footerNote={`${interests.length}/${MAX_INTERESTS} Interests Picked`}
      pinnedFooter
    >
      {interests.length > 0 && (
        <div className={styles.picked} aria-label="Picked interests">
          {interests.map((interest) => (
            <InterestTag key={interest} label={interest} onRemove={() => toggle(interest, false)} />
          ))}
        </div>
      )}

      {INTEREST_CATEGORIES.map((category) => (
        <section key={category.name} className={styles.category} aria-labelledby={`interests-${category.name}`}>
          <h2 id={`interests-${category.name}`} className={styles.categoryName}>
            {category.name}
          </h2>
          <div className={styles.tags}>
            {category.interests.map((interest) => {
              const selected = interests.includes(interest)
              return (
                <InterestTag
                  key={interest}
                  label={interest}
                  selected={selected}
                  disabled={full && !selected}
                  onToggle={(next) => toggle(interest, next)}
                />
              )
            })}
          </div>
        </section>
      ))}
    </OnboardingLayout>
  )
}
