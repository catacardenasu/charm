import { Auth0Provider, type AppState } from '@auth0/auth0-react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

// Must render inside <BrowserRouter> so the redirect callback can navigate.
export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()

  const onRedirectCallback = (appState?: AppState) => {
    navigate(appState?.returnTo ?? '/', { replace: true })
  }

  return (
    <Auth0Provider
      domain={import.meta.env.VITE_AUTH0_DOMAIN}
      clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
      authorizationParams={{
        audience: import.meta.env.VITE_AUTH0_AUDIENCE,
        redirect_uri: window.location.origin,
      }}
      useRefreshTokens
      cacheLocation="localstorage"
      onRedirectCallback={onRedirectCallback}
    >
      {children}
    </Auth0Provider>
  )
}
