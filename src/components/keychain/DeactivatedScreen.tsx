import { Link } from 'react-router-dom'

/** Keychain was deactivated (reported lost). */
export default function DeactivatedScreen() {
  return (
    <section>
      <h1>This keychain was deactivated.</h1>
      <Link to="/">Go home</Link>
    </section>
  )
}
