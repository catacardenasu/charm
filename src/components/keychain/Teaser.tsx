import type { KeychainOwner } from '../../types.ts'
import AvatarView from '../AvatarView.tsx'

interface Props {
  owner: KeychainOwner
  onLogIn: () => void
}

/** Logged out, keychain has an owner: shown before sending them to login. */
export default function Teaser({ owner, onLogIn }: Props) {
  return (
    <section>
      <AvatarView avatar={owner.avatar} name={owner.nickname} />
      <h1>{owner.nickname} wants to tap in with you!</h1>
      <button onClick={onLogIn}>Log in to tap in</button>
    </section>
  )
}
