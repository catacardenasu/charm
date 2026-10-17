import type { Avatar } from '../../types.ts'
import AvatarView from '../AvatarView.tsx'

interface Props {
  avatar: Avatar
  onChange: (avatar: Avatar) => void
  onBack: () => void
  onNext: () => void
}

/** Step 2: avatar. */
export default function AvatarStep({ avatar, onChange, onBack, onNext }: Props) {
  void onChange // used once AvatarCreator is in

  return (
    <section>
      <h1>Make your avatar</h1>

      {/* ┌──────────────────────────────────────────────────────────────────────┐
          │ SLOT: Naty's AvatarCreator goes here. Replace the default preview with │
          │   <AvatarCreator value={avatar} onChange={onChange} />                 │
          │ `avatar` starts as DEFAULT_AVATAR (src/data/profileOptions.ts).        │
          └──────────────────────────────────────────────────────────────────────┘ */}
      <AvatarView avatar={avatar} />
      <p>You'll get the default avatar for now.</p>

      <button type="button" onClick={onBack}>
        Back
      </button>
      <button type="button" onClick={onNext}>
        Next
      </button>
    </section>
  )
}
