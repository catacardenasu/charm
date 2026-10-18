import { Link } from 'react-router-dom'
import { StepFrame } from '../StepFrame.tsx'
import { KeychainArt } from './KeychainArt.tsx'
import styles from './keychain.module.css'

/** No keychain with this code (mistyped or made-up link). */
export default function KeychainNotFoundScreen() {
  return (
    <StepFrame
      title="We couldn't find this keychain."
      wideFooter
      footer={
        <Link to="/" className={styles.primary}>
          Go home
        </Link>
      }
    >
      <div className={styles.stage}>
        <KeychainArt dim />
      </div>
    </StepFrame>
  )
}
