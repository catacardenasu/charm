import { useAuth0 } from '@auth0/auth0-react'
import { useEffect, useRef, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import CharmLinkedScreen from '../components/keychain/CharmLinkedScreen.tsx'
import ClaimScreen from '../components/keychain/ClaimScreen.tsx'
import DeactivatedScreen from '../components/keychain/DeactivatedScreen.tsx'
import KeychainNotFoundScreen from '../components/keychain/KeychainNotFoundScreen.tsx'
import OwnKeychainScreen from '../components/keychain/OwnKeychainScreen.tsx'
import TapInScreen from '../components/keychain/TapInScreen.tsx'
import Teaser from '../components/keychain/Teaser.tsx'
import { Button } from '../components/ui/index.ts'
import { useClaimKeychain } from '../hooks/useClaimKeychain.ts'
import { useKeychain } from '../hooks/useKeychain.ts'
import { useMyProfile } from '../hooks/useMyProfile.ts'
import { useTapIn } from '../hooks/useTapIn.ts'
import { clearLinking, isLinkingRecent } from '../lib/linking.ts'
import { onboardingPath } from '../lib/returnTo.ts'
import type { ClaimKeychainStatus } from '../types.ts'

// /k/:code, following the decision tree in CLAUDE.md.
export default function Keychain() {
  const { code = '' } = useParams()
  const { isAuthenticated, isLoading: authLoading, loginWithRedirect } = useAuth0()
  const keychain = useKeychain(code)
  const returnTo = `/k/${code}`
  // Read once: the auto-claim clears the flag, and this screen shouldn't flip back to Claim.
  const [linking] = useState(isLinkingRecent)

  // 1. Not logged in: go to login, unless there's an owner to show a teaser for first.
  const logIn = () => loginWithRedirect({ appState: { returnTo } })
  const redirectToLogin = !authLoading && !isAuthenticated && !keychain.loading && !keychain.owner
  const redirected = useRef(false)
  useEffect(() => {
    if (redirectToLogin && !redirected.current) {
      redirected.current = true
      loginWithRedirect({ appState: { returnTo } })
    }
  }, [redirectToLogin, loginWithRedirect, returnTo])

  if (authLoading || keychain.loading) return <p>Loading…</p>
  if (keychain.error) {
    return (
      <div role="alert">
        <p>Something went wrong loading this keychain.</p>
        <p>{keychain.error.message}</p>
        <Button variant="secondary" onClick={keychain.refresh}>
          Try again
        </Button>
      </div>
    )
  }

  if (!isAuthenticated) {
    return keychain.owner ? <Teaser owner={keychain.owner} onLogIn={logIn} /> : <p>Taking you to log in…</p>
  }

  // Dead ends first, so a bad or deactivated code doesn't send anyone through onboarding.
  if (keychain.status === 'not_found') return <KeychainNotFoundScreen />
  if (keychain.status === 'inactive') return <DeactivatedScreen /> // 5.

  // 2. Logged in with no profile: onboarding, then back here.
  if (!keychain.hasProfile) return <Navigate to={onboardingPath(returnTo)} replace />

  switch (keychain.status) {
    case 'unclaimed': // 3. Straight from onboarding's Link step: claim without asking.
      return linking ? <AutoClaimFlow code={code} /> : <ClaimFlow code={code} onClaimed={keychain.refresh} />
    case 'mine': // 4.
      return <OwnKeychainScreen />
    default: // 6. 'owned' by someone else
      return <TapInFlow code={code} />
  }
}

const CLAIM_MESSAGES: Partial<Record<ClaimKeychainStatus, string>> = {
  already_have_one: 'You already have a keychain. Deactivate it in Settings to link this one.',
  owned: 'Someone else just claimed this keychain.',
  inactive: 'This keychain was deactivated.',
  not_found: "We couldn't find this keychain.",
  no_profile: 'Finish setting up your profile first.',
}

function ClaimFlow({ code, onClaimed }: { code: string; onClaimed: () => void }) {
  const { claimKeychain, claiming } = useClaimKeychain()
  const [message, setMessage] = useState<string | null>(null)

  const claim = async () => {
    setMessage(null)
    try {
      const status = await claimKeychain(code)
      if (status === 'claimed' || status === 'mine') onClaimed() // reloads as 'mine'
      else setMessage(CLAIM_MESSAGES[status] ?? 'Could not claim this keychain.')
    } catch {
      setMessage('Something went wrong. Try again.')
    }
  }

  return <ClaimScreen onClaim={claim} claiming={claiming} message={message} />
}

/** Onboarding's Link step is waiting in another tab: claim right away, then send them back to it. */
function AutoClaimFlow({ code }: { code: string }) {
  const { claimKeychain } = useClaimKeychain()
  const [status, setStatus] = useState<ClaimKeychainStatus | 'error' | null>(null)
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return // StrictMode runs effects twice in dev
    started.current = true
    claimKeychain(code)
      .then(setStatus, () => setStatus('error'))
      .finally(clearLinking)
  }, [claimKeychain, code])

  if (status === null) return <p>Linking your charm…</p>
  if (status === 'claimed' || status === 'mine') return <CharmLinkedScreen />
  return (
    <p role="alert">
      {(status !== 'error' && CLAIM_MESSAGES[status]) || 'Something went wrong linking this charm. Tap it again.'}
    </p>
  )
}

function TapInFlow({ code }: { code: string }) {
  const { tapIn, result, error, prompt, promptStatus } = useTapIn()
  const { profile: me } = useMyProfile()

  useEffect(() => {
    tapIn(code).catch(() => {}) // shown through `error`
  }, [tapIn, code])

  if (error) return <p role="alert">Couldn't Charm them. Tap the charm again.</p>
  if (!result) return <p>Charming…</p>
  return <TapInScreen me={me} result={result} prompt={prompt} promptStatus={promptStatus} />
}
