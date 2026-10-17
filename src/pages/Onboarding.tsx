import { useAuth0 } from '@auth0/auth0-react'
import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import AvatarStep from '../components/onboarding/AvatarStep.tsx'
import GreetingStep from '../components/onboarding/GreetingStep.tsx'
import SignUpStep from '../components/onboarding/SignUpStep.tsx'
import { DEFAULT_AVATAR } from '../data/profileOptions.ts'
import { useMyProfile } from '../hooks/useMyProfile.ts'
import { useSaveProfile, type ProfileFields } from '../hooks/useSaveProfile.ts'
import { onboardingPath, safeReturnTo } from '../lib/returnTo.ts'

type Step = 'signup' | 'avatar' | 'greeting'

// /onboarding?returnTo=/k/x7f3q9 → sign up, avatar, greeting, then back to returnTo.
export default function Onboarding() {
  const [params] = useSearchParams()
  const returnTo = safeReturnTo(params.get('returnTo'))
  const navigate = useNavigate()
  const { isAuthenticated, isLoading: authLoading, loginWithRedirect } = useAuth0()
  const { profile, loading: profileLoading } = useMyProfile()
  const { saveProfile, saving } = useSaveProfile()

  const [step, setStep] = useState<Step>('signup')
  const [error, setError] = useState<string | null>(null)
  const [draft, setDraft] = useState<ProfileFields>({
    nickname: '',
    major: null,
    year: null,
    interests: [],
    greeting: null,
    avatar: DEFAULT_AVATAR,
  })
  const update = (changes: Partial<ProfileFields>) => setDraft((d) => ({ ...d, ...changes }))

  const redirected = useRef(false)
  useEffect(() => {
    if (!authLoading && !isAuthenticated && !redirected.current) {
      redirected.current = true
      loginWithRedirect({ appState: { returnTo: onboardingPath(returnTo) } })
    }
  }, [authLoading, isAuthenticated, loginWithRedirect, returnTo])

  if (authLoading || !isAuthenticated || profileLoading) return <p>Loading…</p>
  if (profile) return <Navigate to={returnTo} replace /> // already onboarded

  const finish = async () => {
    setError(null)
    try {
      await saveProfile({
        ...draft,
        nickname: draft.nickname.trim(),
        major: draft.major?.trim() || null,
        greeting: draft.greeting?.trim() || null,
      })
      navigate(returnTo, { replace: true })
    } catch {
      setError("Couldn't save your profile. Try again.")
    }
  }

  switch (step) {
    case 'signup':
      return <SignUpStep draft={draft} onChange={update} onNext={() => setStep('avatar')} />
    case 'avatar':
      return (
        <AvatarStep
          avatar={draft.avatar}
          onChange={(avatar) => update({ avatar })}
          onBack={() => setStep('signup')}
          onNext={() => setStep('greeting')}
        />
      )
    case 'greeting':
      return (
        <GreetingStep
          greeting={draft.greeting ?? ''}
          onChange={(greeting) => update({ greeting })}
          onBack={() => setStep('avatar')}
          onFinish={finish}
          saving={saving}
          error={error}
        />
      )
  }
}
