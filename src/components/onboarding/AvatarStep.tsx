import type { Avatar } from '../../types.ts'
import { AvatarCreator } from '../AvatarCreator.tsx'
import OnboardingLayout from './OnboardingLayout.tsx'

interface Props {
  avatar: Avatar
  onChange: (avatar: Avatar) => void
  onBack: () => void
  onNext: () => void
}

/** Step 3, Figma "Build your Charmling" (10:274). */
export default function AvatarStep({ avatar, onChange, onBack, onNext }: Props) {
  return (
    <OnboardingLayout
      step={3}
      title="Build your Charmling"
      subtitle="A little character with a lot of charm. This is how you’ll appear to everyone you meet!"
      onBack={onBack}
      onNext={onNext}
    >
      <AvatarCreator value={avatar} onChange={onChange} />
    </OnboardingLayout>
  )
}
