import { Link } from 'react-router-dom'

/** You tapped your own keychain. */
export default function OwnKeychainScreen() {
  return (
    <section>
      <h1>This is your keychain</h1>
      <p>Tap it on a friend's phone to tap in with them.</p>
      <Link to="/plaza">Go to your plaza</Link>
    </section>
  )
}
