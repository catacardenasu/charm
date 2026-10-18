import { useAuth0 } from '@auth0/auth0-react'
import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { ArcText } from '../components/ArcText.tsx'
import { WORDMARK, type ArcLetter } from '../components/arcLetters.ts'
import { Button, SPRITES, TextField } from '../components/ui/index.ts'
import buttonStyles from '../components/ui/Button.module.css'
import styles from './Home.module.css'

// "Charm'd to meet you!" under the keychain, from Figma "Log In Screen" (1:61). Same format as
// WORDMARK: letter centers in em of the 24px tagline, from the top of the logo block.
const TAGLINE: ArcLetter[] = [
  { char: 'C', x: 4.4261, y: 7.9679, rotate: 73.1 },
  { char: 'h', x: 4.6719, y: 8.5987, rotate: 64.32 },
  { char: 'a', x: 5.0112, y: 9.1845, rotate: 55.53 },
  { char: 'r', x: 5.3954, y: 9.668, rotate: 47.53 },
  { char: 'm', x: 5.8892, y: 10.131, rotate: 38.75 },
  { char: '’', x: 6.3797, y: 10.4723, rotate: 31 },
  { char: 'd', x: 6.8565, y: 10.721, rotate: 24.02 },
  { char: ' ', x: 7.3603, y: 10.9094, rotate: 17.05 },
  { char: 't', x: 7.8241, y: 11.0247, rotate: 10.85 },
  { char: 'o', x: 8.437, y: 11.0984, rotate: 2.84 },
  { char: ' ', x: 8.9749, y: 11.0925, rotate: -4.13 },
  { char: 'm', x: 9.5667, y: 11.009, rotate: -11.88 },
  { char: 'e', x: 10.2539, y: 10.8053, rotate: -21.18 },
  { char: 'e', x: 10.83, y: 10.5326, rotate: -29.45 },
  { char: 't', x: 11.3291, y: 10.2046, rotate: -37.2 },
  { char: ' ', x: 11.6938, y: 9.8953, rotate: -43.39 },
  { char: 'y', x: 12.0612, y: 9.5027, rotate: -50.37 },
  { char: 'o', x: 12.452, y: 8.9498, rotate: -59.15 },
  { char: 'u', x: 12.7535, y: 8.3437, rotate: -67.93 },
  { char: '!', x: 12.9249, y: 7.8337, rotate: -74.91 },
]

// Facebook and Apple are in the Figma frame for looks only: Google is the one login (CLAUDE.md).
const DECORATIVE_LOGINS = [
  { label: 'Continue with Facebook', icon: '/sprites/ui/facebook.png' },
  { label: 'Continue with Apple', icon: '/sprites/ui/apple.png' },
] as const

/** `/`: logged in goes to the plaza; logged out sees the Log In screen. Auth0 owns login (redirect only). */
export default function Home() {
  const { isLoading, isAuthenticated, loginWithRedirect, error } = useAuth0()
  const [username, setUsername] = useState('')

  if (isLoading) return <p className={styles.loading}>Loading…</p>
  if (isAuthenticated) return <Navigate to="/plaza" replace />

  // Username / password happens on Auth0's own page; we just prefill the username there.
  const logIn = (e: FormEvent) => {
    e.preventDefault()
    const loginHint = username.trim()
    loginWithRedirect(loginHint ? { authorizationParams: { login_hint: loginHint } } : undefined)
  }

  return (
    <main className={styles.screen}>
      <div className={styles.logo}>
        <h1 className={styles.wordmark} aria-label="Charm">
          <ArcText letters={WORDMARK} />
        </h1>
        <img className={styles.sparkle} src="/sprites/charm/sparkle.png" alt="" />
        <img className={styles.keychain} src="/sprites/charm/keychain.png" alt="" />
        <img className={styles.character} src="/sprites/charm/keychain-character.png" alt="" />
        <p className={styles.tagline} aria-label="Charm’d to meet you!">
          <ArcText letters={TAGLINE} />
        </p>
      </div>

      <form className={styles.login} onSubmit={logIn}>
        <TextField
          label="Username"
          hideLabel
          size="md"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          className={styles.field}
        />
        <Button type="submit" className={styles.logInButton}>
          Log In
        </Button>
      </form>

      <div className={styles.divider} role="separator">
        <span>or</span>
      </div>

      <div className={styles.social}>
        <Button
          variant="social"
          fullWidth
          icon={<img src={SPRITES.google} alt="" />}
          onClick={() => loginWithRedirect({ authorizationParams: { connection: 'google-oauth2' } })}
        >
          Continue with Google
        </Button>
        {/* Look like the social buttons, but aren't buttons: not tappable, not focusable, hidden from screen readers. */}
        {DECORATIVE_LOGINS.map(({ label, icon }) => (
          <div key={label} className={styles.decorative} aria-hidden="true">
            <span className={buttonStyles.icon}>
              <img src={icon} alt="" />
            </span>
            <span className={buttonStyles.label}>{label}</span>
          </div>
        ))}
        {error && (
          <p role="alert" className={styles.error}>
            Couldn’t log in: {error.message}
          </p>
        )}
      </div>

      <p className={styles.terms}>
        By signing up, I agree to Charm’s <span className={styles.underline}>Terms of Service</span> and{' '}
        <span className={styles.underline}>Privacy Policy.</span>
      </p>
    </main>
  )
}
