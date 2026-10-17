import type { Avatar } from '../../types.ts'
import { AvatarCreator } from '../AvatarCreator.tsx'

interface Props {
  avatar: Avatar
  onChange: (avatar: Avatar) => void
  onBack: () => void
  onNext: () => void
}

/** Step 2: avatar. */
export default function AvatarStep({ avatar, onChange, onBack, onNext }: Props) {
  return (
    <section>
      <h1>Build your Charmling</h1>

      <AvatarCreator value={avatar} onChange={onChange} />

      <button type="button" onClick={onBack}>
        Back
      </button>
      <button type="button" onClick={onNext}>
        Next
      </button>
    </section>
  )
}
