import { Link } from 'react-router-dom'
import { StepFrame } from '../StepFrame.tsx'
import { KeychainArt } from './KeychainArt.tsx'
import styles from './keychain.module.css'

/** You tapped your own keychain. */
export default function OwnKeychainScreen() {
  return (
    <StepFrame
      title="This is your keychain"
      intro="Tap it on a friend's phone to Charm them."
      wideFooter
      footer={
        <Link to="/plaza" className={styles.primary}>
          Go to your plaza
        </Link>
      }
    >
      <div className={styles.stage}>
        <KeychainArt waves />
      </div>
    </StepFrame>
  )
}
