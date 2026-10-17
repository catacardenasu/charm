import { useAuth0 } from '@auth0/auth0-react'
import { useEffect, useRef, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import ClaimScreen from '../components/keychain/ClaimScreen.tsx'
import DeactivatedScreen from '../components/keychain/DeactivatedScreen.tsx'
import KeychainNotFoundScreen from '../components/keychain/KeychainNotFoundScreen.tsx'
import OwnKeychainScreen from '../components/keychain/OwnKeychainScreen.tsx'
import TapInScreen from '../components/keychain/TapInScreen.tsx'
import Teaser from '../components/keychain/Teaser.tsx'
import { useClaimKeychain } from '../hooks/useClaimKeychain.ts'
import { useKeychain } from '../hooks/useKeychain.ts'
import { useMyProfile } from '../hooks/useMyProfile.ts'
import { useTapIn } from '../hooks/useTapIn.ts'
import { onboardingPath } from '../lib/returnTo.ts'
import type { ClaimKeychainStatus } from '../types.ts'

// /k/:code, following the decision tree in CLAUDE.md.
export default function Keychain() {
  const { code = '' } = useParams()
  const { isAuthenticated, isLoading: authLoading, loginWithRedirect } = useAuth0()
  const keychain = useKeychain(code)
  const returnTo = `/k/${code}`

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
  if (keychain.error) return <p role="alert">Something went wrong loading this keychain.</p>

  if (!isAuthenticated) {
    return keychain.owner ? <Teaser owner={keychain.owner} onLogIn={logIn} /> : <p>Taking you to log in…</p>
  }

  // 2. Logged in with no profile: onboarding, then back here.
  if (!keychain.hasProfile) return <Navigate to={onboardingPath(returnTo)} replace />

  switch (keychain.status) {
    case 'unclaimed': // 3.
      return <ClaimFlow code={code} onClaimed={keychain.refresh} />
    case 'mine': // 4.
      return <OwnKeychainScreen />
    case 'inactive': // 5.
      return <DeactivatedScreen />
    case 'not_found':
      return <KeychainNotFoundScreen />
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

function TapInFlow({ code }: { code: string }) {
  const { tapIn, result, error, prompt, promptStatus } = useTapIn()
  const { profile: me } = useMyProfile()

  useEffect(() => {
    tapIn(code).catch(() => {}) // shown through `error`
  }, [tapIn, code])

  if (error) return <p role="alert">Couldn't tap in. Try tapping again.</p>
  if (!result) return <p>Tapping in…</p>
  return <TapInScreen me={me} result={result} prompt={prompt} promptStatus={promptStatus} />
}
