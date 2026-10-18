import { useEffect } from 'react'
import { useKeychainLinked } from '../../hooks/useKeychainLinked.ts'
import { clearLinking, startLinking } from '../../lib/linking.ts'
import { KeychainArt } from '../keychain/KeychainArt.tsx'
import keychainStyles from '../keychain/keychain.module.css'
import { StepFrame } from '../StepFrame.tsx'
import { Button } from '../ui/index.ts'
import styles from './LinkStep.module.css'

interface Props {
  onBack: () => void
  /** Leave onboarding (Done, or "I don't have a charm yet"). */
  onDone: () => void
}

/**
 * Step 5, Figma "Linking Screen" (24:78). The user taps their own keychain on this phone; that
 * opens /k/:code, which claims it because of the linking flag. Here we just wait for it to show up.
 */
export default function LinkStep({ onBack, onDone }: Props) {
  const linked = useKeychainLinked(true)

  useEffect(() => {
    startLinking()
  }, [])

  useEffect(() => {
    if (linked) clearLinking()
  }, [linked])

  const skip = () => {
    clearLinking()
    onDone()
  }

  return (
    <StepFrame
      step={5}
      title="Link your charm"
      intro="Hold up your charm to the back of your phone, near your camera. It becomes your pass for meeting people."
      footer={
        <>
          <Button variant="secondary" fullWidth onClick={onBack}>
            Back
          </Button>
          <Button fullWidth onClick={onDone} disabled={!linked}>
            Done
          </Button>
        </>
      }
    >
      <div className={keychainStyles.stage}>
        <KeychainArt waves pulsing={!linked} />
        <p className={keychainStyles.status} aria-live="polite">
          {linked ? 'Linked! ✓' : 'Linking...'}
        </p>
        {!linked && (
          <button type="button" className={styles.skip} onClick={skip}>
            I don’t have a charm yet
          </button>
        )}
      </div>
    </StepFrame>
  )
}
