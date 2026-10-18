import type { KeychainOwner } from '../../types.ts'
import { Avatar } from '../Avatar.tsx'
import { ArcText } from '../ArcText.tsx'
import { WORDMARK } from '../arcLetters.ts'
import { Button, SPRITES } from '../ui/index.ts'
import styles from './Teaser.module.css'

interface Props {
  owner: KeychainOwner
  onLogIn: () => void
}

/** Logged out, keychain has an owner: shown before sending them to login. Styled after the Log In frame. */
export default function Teaser({ owner, onLogIn }: Props) {
  return (
    <section className={styles.screen}>
      <div className={styles.logo}>
        <p className={styles.wordmark} aria-label="Charm">
          <ArcText letters={WORDMARK} />
        </p>
        <img className={styles.sparkle} src="/sprites/charm/sparkle.png" alt="" />
      </div>

      <div className={styles.owner}>
        <Avatar avatar={owner.avatar} label={owner.nickname} />
        <h1 className={styles.title}>{owner.nickname} wants to Charm you!</h1>
      </div>

      <div className={styles.actions}>
        <div className={styles.signIn}>
          <Button variant="social" fullWidth icon={<img src={SPRITES.google} alt="" />} onClick={onLogIn}>
            Continue with Google
          </Button>
        </div>
        <p className={styles.terms}>
          By signing up, I agree to Charm’s <span className={styles.underline}>Terms of Service</span> and{' '}
          <span className={styles.underline}>Privacy Policy.</span>
        </p>
      </div>
    </section>
  )
}
