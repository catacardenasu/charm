import { Link } from 'react-router-dom'

/** No keychain with this code (mistyped or made-up link). */
export default function KeychainNotFoundScreen() {
  return (
    <section>
      <h1>We couldn't find this keychain.</h1>
      <Link to="/">Go home</Link>
    </section>
  )
}
