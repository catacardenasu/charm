import type { ReactNode } from 'react'
import styles from './ListRow.module.css'
import { cx } from './cx.ts'
import { StreakFlame } from './StreakFlame.tsx'

export interface ListRowProps {
  name: string
  /** Avatar image; the top of it (the head) is shown. */
  avatarSrc?: string
  /** Leaderboard position. Omit on streak rows. */
  rank?: number
  /** Right-hand value, e.g. "60 pts". */
  value?: ReactNode
  /** Weekly streak count. Shows the number and a flame on the right. */
  streak?: number
  /** Orange row: you on the leaderboard, or an active streak. */
  highlighted?: boolean
  /** Makes the row a button (opens the person's profile). */
  onClick?: () => void
  className?: string
}

/** Leaderboard and streak rows: rank, avatar, name, value. */
export function ListRow({
  name,
  avatarSrc,
  rank,
  value,
  streak,
  highlighted = false,
  onClick,
  className,
}: ListRowProps) {
  const classes = cx(styles.row, highlighted && styles.highlighted, rank == null && styles.noRank, className)

  const content = (
    <>
      {rank != null && <span className={styles.rank}>#{rank}</span>}
      <span className={styles.avatar}>{avatarSrc && <img src={avatarSrc} alt="" />}</span>
      <span className={styles.name}>{name}</span>
      {value != null && <span className={styles.value}>{value}</span>}
      {streak != null && <StreakFlame count={streak} size="sm" tone={highlighted ? 'dark' : 'orange'} />}
    </>
  )

  if (onClick) {
    return (
      <button type="button" className={cx(classes, styles.button)} onClick={onClick}>
        {content}
      </button>
    )
  }

  return <div className={classes}>{content}</div>
}
