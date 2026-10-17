interface Props {
  onClaim: () => void
  claiming: boolean
  /** Shown when a claim didn't go through. */
  message: string | null
}

/** Keychain has no owner yet: the Link keychain flow. */
export default function ClaimScreen({ onClaim, claiming, message }: Props) {
  return (
    <section>
      <h1>Claim this keychain?</h1>
      <p>It'll be linked to you, and tapping it on a friend's phone will tap in with them.</p>
      <button onClick={onClaim} disabled={claiming}>
        {claiming ? 'Claiming…' : 'Claim keychain'}
      </button>
      {message && <p role="alert">{message}</p>}
    </section>
  )
}
