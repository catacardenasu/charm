// /dev/screens?s=<name>: the keychain and onboarding screens with mock data, for checking against Figma on a phone.
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import ClaimScreen from '../components/keychain/ClaimScreen.tsx'
import DeactivatedScreen from '../components/keychain/DeactivatedScreen.tsx'
import KeychainNotFoundScreen from '../components/keychain/KeychainNotFoundScreen.tsx'
import OwnKeychainScreen from '../components/keychain/OwnKeychainScreen.tsx'
import TapInScreen from '../components/keychain/TapInScreen.tsx'
import Teaser from '../components/keychain/Teaser.tsx'
import AboutStep from '../components/onboarding/AboutStep.tsx'
import AvatarStep from '../components/onboarding/AvatarStep.tsx'
import GreetingStep from '../components/onboarding/GreetingStep.tsx'
import InterestsStep from '../components/onboarding/InterestsStep.tsx'
import { DEFAULT_AVATAR } from '../data/profileOptions.ts'
import { mockLocations, mockProfiles } from '../data/mock.ts'
import type { ProfileFields } from '../hooks/useSaveProfile.ts'
import type { TapInResult } from '../types.ts'

const me = mockProfiles[0]
const prompt = 'If you wrote a book about your life right now, what would the title be?'

const tapIn = (changes: Partial<TapInResult>): TapInResult => ({
  status: 'ok',
  tap_in_id: 'mock',
  other: mockProfiles[1],
  shared_interests: ['coffee', 'hiking'],
  streak_weeks: 1,
  points_earned: 20,
  coins_earned: 10,
  newly_unlocked: [],
  ...changes,
})

function Onboarding({ start }: { start: 'about' | 'interests' | 'avatar' | 'greeting' }) {
  const [draft, setDraft] = useState<ProfileFields>({
    nickname: 'Katie Rose',
    major: 'Computer Science',
    year: 'Sophomore',
    interests: ['anime', 'coffee', 'video games'],
    greeting: 'I love SwampHacks!',
    avatar: DEFAULT_AVATAR,
  })
  const update = (changes: Partial<ProfileFields>) => setDraft((d) => ({ ...d, ...changes }))
  const noop = () => {}

  if (start === 'avatar') {
    return <AvatarStep avatar={draft.avatar} onChange={(avatar) => update({ avatar })} onBack={noop} onNext={noop} />
  }
  if (start === 'greeting') {
    return (
      <GreetingStep
        greeting={draft.greeting ?? ''}
        onChange={(greeting) => update({ greeting })}
        onBack={noop}
        onFinish={noop}
        saving={false}
        error={null}
        avatar={draft.avatar}
      />
    )
  }
  if (start === 'interests') {
    return (
      <InterestsStep interests={draft.interests} onChange={(interests) => update({ interests })} onBack={noop} onNext={noop} />
    )
  }
  return <AboutStep draft={draft} onChange={update} onNext={noop} />
}

export default function ScreensPreview() {
  const [params] = useSearchParams()
  const noop = () => {}

  switch (params.get('s')) {
    case 'tapin-first':
      return (
        <TapInScreen
          me={me}
          result={tapIn({ newly_unlocked: [mockLocations[1]] })}
          prompt={prompt}
          promptStatus="ready"
        />
      )
    case 'tapin-repeat':
      return (
        <TapInScreen
          me={me}
          result={tapIn({ streak_weeks: 4, points_earned: 10, coins_earned: 5 })}
          prompt="Would you rather do yoga outside or in a studio?"
          promptStatus="ready"
        />
      )
    case 'tapin-today':
      return <TapInScreen me={me} result={tapIn({ status: 'already_today', streak_weeks: 4, points_earned: 0, coins_earned: 0 })} prompt={null} promptStatus="loading" />
    case 'claim':
      return <ClaimScreen onClaim={noop} claiming={false} message={null} />
    case 'claim-busy':
      return <ClaimScreen onClaim={noop} claiming message={null} />
    case 'claim-error':
      return <ClaimScreen onClaim={noop} claiming={false} message="You already have a keychain. Deactivate it in Settings to link this one." />
    case 'own':
      return <OwnKeychainScreen />
    case 'deactivated':
      return <DeactivatedScreen />
    case 'notfound':
      return <KeychainNotFoundScreen />
    case 'teaser':
      return <Teaser owner={mockProfiles[0]} onLogIn={noop} />
    case 'interests':
      return <Onboarding start="interests" />
    case 'avatar':
      return <Onboarding start="avatar" />
    case 'greeting':
      return <Onboarding start="greeting" />
    default:
      return <Onboarding start="about" />
  }
}
