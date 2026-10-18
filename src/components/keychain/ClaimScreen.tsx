import { Link } from 'react-router-dom'
import { Button } from '../ui/index.ts'
import { StepFrame } from '../StepFrame.tsx'
import { KeychainArt } from './KeychainArt.tsx'
import styles from './keychain.module.css'

interface Props {
  onClaim: () => void
  claiming: boolean
  /** Shown when a claim didn't go through. */
  message: string | null
}

/** Keychain has no owner yet: the Link keychain flow, step 5 of sign up ("Linking Found" / "Linking Screen"). */
export default function ClaimScreen({ onClaim, claiming, message }: Props) {
  return (
    <StepFrame
      step={5}
      title="Link your charm"
      intro="Hold up your charm to the back of your phone, near your camera. It becomes your pass for meeting people."
      footer={
        <>
          <Link to="/plaza" className={styles.secondary}>
            Back
          </Link>
          <Button fullWidth onClick={onClaim} disabled={claiming}>
            Done
          </Button>
        </>
      }
    >
      <div className={styles.stage}>
        <KeychainArt waves pulsing={claiming} />
        <p className={styles.status} aria-live="polite">
          {claiming ? 'Linking...' : 'Found!'}
        </p>
        {message && (
          <p role="alert" className={styles.message}>
            {message}
          </p>
        )}
      </div>
    </StepFrame>
  )
}
