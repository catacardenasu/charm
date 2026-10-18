import { cx } from '../ui/cx.ts'
import styles from './KeychainArt.module.css'

export interface KeychainArtProps {
  /** Signal waves on both sides (Linking, Found, your own keychain). */
  waves?: boolean
  /** Waves pulse while a link is in progress. */
  pulsing?: boolean
  /** Grey and faded, for a deactivated or missing keychain. */
  dim?: boolean
  className?: string
}

/** The orange charm keychain with the gator on it, from the Linking frames. Decorative. */
export function KeychainArt({ waves = false, pulsing = false, dim = false, className }: KeychainArtProps) {
  return (
    <div className={cx(styles.art, dim && styles.dim, className)} aria-hidden="true">
      {waves && <img className={cx(styles.waves, styles.left, pulsing && styles.pulse)} src="/sprites/charm/signal-waves.png" alt="" />}
      <img className={styles.keychain} src="/sprites/charm/keychain.png" alt="" />
      <img className={styles.character} src="/sprites/charm/keychain-character.png" alt="" />
      {waves && <img className={cx(styles.waves, styles.right, pulsing && styles.pulse)} src="/sprites/charm/signal-waves.png" alt="" />}
    </div>
  )
}
