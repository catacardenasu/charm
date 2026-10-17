import type { KeychainOwner } from '../../types.ts'
import { Avatar } from '../Avatar.tsx'

interface Props {
  owner: KeychainOwner
  onLogIn: () => void
}

/** Logged out, keychain has an owner: shown before sending them to login. */
export default function Teaser({ owner, onLogIn }: Props) {
  return (
    <section>
      <Avatar avatar={owner.avatar} label={owner.nickname} />
      <h1>{owner.nickname} wants to tap in with you!</h1>
      <button onClick={onLogIn}>Log in to tap in</button>
    </section>
  )
}
