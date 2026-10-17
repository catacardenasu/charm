import { useAuth0 } from '@auth0/auth0-react'

// Temporary: becomes Plaza (logged in) / landing (logged out).
export default function Home() {
  const { isLoading, isAuthenticated, user, loginWithRedirect, logout, error } = useAuth0()

  if (isLoading) return <p>Loading…</p>

  return (
    <main>
      <h1>Charm</h1>
      {error && <p>Login error: {error.message}</p>}
      {isAuthenticated ? (
        <>
          <p>Logged in as <code>{user?.sub}</code></p>
          <button onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}>
            Log out
          </button>
        </>
      ) : (
        <button onClick={() => loginWithRedirect()}>Log in</button>
      )}
    </main>
  )
}
