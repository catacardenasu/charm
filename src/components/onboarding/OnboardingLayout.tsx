import type { FormEvent, ReactNode } from 'react'
import { Button, ProgressSteps } from '../ui/index.ts'
import { cx } from '../ui/cx.ts'
import styles from './OnboardingLayout.module.css'

export const ONBOARDING_STEPS = 5

interface Props {
  /** 1-based, for the progress bar. Omit for no bar (Settings edit screens). */
  step?: number
  title: string
  subtitle: string
  children: ReactNode
  /** Omit on the first step: Back shows but is disabled. */
  onBack?: () => void
  onNext: () => void
  nextLabel?: string
  nextDisabled?: boolean
  /** Shown above the buttons, e.g. "12/15 Interests Picked". */
  footerNote?: ReactNode
  /** Interests: dark footer pinned to the bottom while the tags scroll. */
  pinnedFooter?: boolean
  /** Shown above the footer, e.g. a failed save. */
  error?: string | null
}

/** The frame shared by every onboarding step in Figma: progress bar, title, subtitle, Back / Next. */
export default function OnboardingLayout({
  step,
  title,
  subtitle,
  children,
  onBack,
  onNext,
  nextLabel = 'Next',
  nextDisabled = false,
  footerNote,
  pinnedFooter = false,
  error,
}: Props) {
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!nextDisabled) onNext()
  }

  return (
    <form className={styles.screen} onSubmit={submit} noValidate>
      <header className={styles.header}>
        {step != null && <ProgressSteps current={step} total={ONBOARDING_STEPS} />}
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.subtitle}>{subtitle}</p>
      </header>

      <div className={styles.body}>{children}</div>
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}

      <footer className={cx(styles.footer, pinnedFooter && styles.pinned)}>
        {footerNote != null && <p className={styles.note}>{footerNote}</p>}
        <div className={styles.buttons}>
          <Button variant="secondary" onClick={onBack} disabled={!onBack} fullWidth>
            Back
          </Button>
          <Button type="submit" disabled={nextDisabled} fullWidth>
            {nextLabel}
          </Button>
        </div>
      </footer>
    </form>
  )
}
