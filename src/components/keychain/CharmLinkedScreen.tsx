import { StepFrame } from '../StepFrame.tsx'
import { KeychainArt } from './KeychainArt.tsx'
import styles from './keychain.module.css'

/**
 * Shown in the tab the NFC tap opened, after the keychain was claimed automatically.
 * The onboarding tab (Link your charm) picks the link up on its own; this one just points back to it.
 */
export default function CharmLinkedScreen() {
  return (
    <StepFrame
      step={5}
      title="Charm linked!"
      intro="Go back to finish setup."
      footer={null}
    >
      <div className={styles.stage}>
        <KeychainArt waves />
        <p className={styles.status}>Linked! ✓</p>
      </div>
    </StepFrame>
  )
}
