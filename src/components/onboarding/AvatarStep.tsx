import type { Avatar } from '../../types.ts'
import { AvatarCreator } from '../AvatarCreator.tsx'
import { Button } from '../ui/index.ts'
import { StepFrame } from '../StepFrame.tsx'

interface Props {
  avatar: Avatar
  onChange: (avatar: Avatar) => void
  onBack: () => void
  onNext: () => void
}

/** Step 3: avatar. */
export default function AvatarStep({ avatar, onChange, onBack, onNext }: Props) {
  return (
    <StepFrame
      step={3}
      title="Build your Charmling"
      intro="A little character with a lot of charm. This is how you’ll appear to everyone you meet!"
      footer={
        <>
          <Button variant="secondary" fullWidth onClick={onBack}>
            Back
          </Button>
          <Button fullWidth onClick={onNext}>
            Next
          </Button>
        </>
      }
    >
      <AvatarCreator value={avatar} onChange={onChange} />
    </StepFrame>
  )
}
