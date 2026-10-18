import { useAuth0 } from '@auth0/auth0-react'
import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import AboutStep from '../components/onboarding/AboutStep.tsx'
import AvatarStep from '../components/onboarding/AvatarStep.tsx'
import GreetingStep from '../components/onboarding/GreetingStep.tsx'
import InterestsStep from '../components/onboarding/InterestsStep.tsx'
import { DEFAULT_AVATAR } from '../data/profileOptions.ts'
import { useMyProfile } from '../hooks/useMyProfile.ts'
import { useSaveProfile, type ProfileFields } from '../hooks/useSaveProfile.ts'
import { onboardingPath, safeReturnTo } from '../lib/returnTo.ts'

type Step = 'about' | 'interests' | 'avatar' | 'greeting'

// /onboarding?returnTo=/k/x7f3q9 → about you, interests, avatar, greeting, then back to returnTo.
export default function Onboarding() {
  const [params] = useSearchParams()
  const returnTo = safeReturnTo(params.get('returnTo'))
  const navigate = useNavigate()
  const { isAuthenticated, isLoading: authLoading, loginWithRedirect } = useAuth0()
  const { profile, loading: profileLoading } = useMyProfile()
  const { saveProfile, saving } = useSaveProfile()

  const [step, setStep] = useState<Step>('about')
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

  // Each step starts at the top (Interests is a long scroll).
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [step])

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
    } catch (e) {
      // PostgrestError has message + code; a plain Error only has message.
      const { message, code } = e as { message?: string; code?: string }
      const detail = [message || 'Unknown error', code && `(code ${code})`].filter(Boolean).join(' ')
      setError(`Couldn't save your profile. Try again.\n${detail}`)
    }
  }

  switch (step) {
    case 'about':
      return <AboutStep draft={draft} onChange={update} onNext={() => setStep('interests')} />
    case 'interests':
      return (
        <InterestsStep
          interests={draft.interests}
          onChange={(interests) => update({ interests })}
          onBack={() => setStep('about')}
          onNext={() => setStep('avatar')}
        />
      )
    case 'avatar':
      return (
        <AvatarStep
          avatar={draft.avatar}
          onChange={(avatar) => update({ avatar })}
          onBack={() => setStep('interests')}
          onNext={() => setStep('greeting')}
        />
      )
    case 'greeting':
      return (
        <GreetingStep
          greeting={draft.greeting ?? ''}
          avatar={draft.avatar}
          onChange={(greeting) => update({ greeting })}
          onBack={() => setStep('avatar')}
          onFinish={finish}
          saving={saving}
          error={error}
        />
      )
  }
}
