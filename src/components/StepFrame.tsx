import type { FormEvent, ReactNode } from 'react'
import { ProgressSteps } from './ui/index.ts'
import { cx } from './ui/cx.ts'
import styles from './StepFrame.module.css'

export interface StepFrameProps {
  /** 1-based step in the five-step sign up. Leave out for screens with no progress bar. */
  step?: number
  title: ReactNode
  intro?: ReactNode
  /** Back / Next buttons, pinned to the bottom. */
  footer: ReactNode
  /** One wide button instead of a Back / Next pair. */
  wideFooter?: boolean
  /** Keeps the footer on screen while a long step scrolls (Interests). */
  stickyFooter?: boolean
  /** Shown above the footer buttons, inside the sticky bar (Interests count). */
  footerNote?: ReactNode
  /** Renders the screen as a form, so Next / Finish can be a submit button. */
  onSubmit?: (event: FormEvent) => void
  className?: string
  children?: ReactNode
}

/** The shared onboarding screen: progress bar, 64px title, intro line, content, then Back / Next. */
export function StepFrame({ step, title, intro, footer, stickyFooter = false, wideFooter = false, footerNote, onSubmit, className, children }: StepFrameProps) {
  const Root = onSubmit ? 'form' : 'section'
  return (
    <Root className={cx(styles.frame, className)} onSubmit={onSubmit}>
      {step != null && <ProgressSteps current={step} />}
      <header className={styles.header}>
        <h1 className={styles.title}>{title}</h1>
        {intro && <p className={styles.intro}>{intro}</p>}
      </header>
      <div className={styles.body}>{children}</div>
      <footer className={cx(styles.footer, stickyFooter && styles.sticky, wideFooter && styles.wide)}>
        {footerNote && <p className={styles.note}>{footerNote}</p>}
        <div className={styles.buttons}>{footer}</div>
      </footer>
    </Root>
  )
}
