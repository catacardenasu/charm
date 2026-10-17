import { Link } from 'react-router-dom'
import { StepFrame } from '../StepFrame.tsx'
import { KeychainArt } from './KeychainArt.tsx'
import styles from './keychain.module.css'

/** Keychain was deactivated (reported lost). */
export default function DeactivatedScreen() {
  return (
    <StepFrame
      title="This keychain was deactivated."
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
