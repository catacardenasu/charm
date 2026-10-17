import styles from './ProgressSteps.module.css'
import { cx } from './cx.ts'

export interface ProgressStepsProps {
  /** Current step, 1-based. Steps up to and including it are filled. */
  current: number
  total?: number
  className?: string
}

/** The segmented bar at the top of every onboarding screen. */
export function ProgressSteps({ current, total = 5, className }: ProgressStepsProps) {
  return (
    <div
      className={cx(styles.steps, className)}
      role="progressbar"
      aria-label="Sign up progress"
      aria-valuemin={1}
      aria-valuemax={total}
      aria-valuenow={current}
      aria-valuetext={`Step ${current} of ${total}`}
    >
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={cx(styles.step, i < current && styles.done)} />
      ))}
    </div>
  )
}
