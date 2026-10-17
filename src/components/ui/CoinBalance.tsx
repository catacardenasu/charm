import styles from './CoinBalance.module.css'
import { cx } from './cx.ts'
import { SPRITES } from './sprites.ts'

/** boxed = the balance in the Shop header. inline = a price on item tiles and the Buy button. */
export type CoinBalanceVariant = 'boxed' | 'inline'
/** md = 20px number (header, tiles). lg = 32px number (Buy button). */
export type CoinBalanceSize = 'md' | 'lg'

export interface CoinBalanceProps {
  amount: number
  variant?: CoinBalanceVariant
  size?: CoinBalanceSize
  className?: string
}

export function CoinBalance({ amount, variant = 'boxed', size = 'md', className }: CoinBalanceProps) {
  return (
    <span className={cx(styles.coins, styles[variant], styles[size], className)} aria-label={`${amount} coins`}>
      <img className={styles.icon} src={SPRITES.coin} alt="" />
      <span aria-hidden="true">{amount}</span>
    </span>
  )
}
