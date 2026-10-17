import { createRemoteJWKSet, jwtVerify } from 'jose'

// Verifies the Auth0 access token sent as "Authorization: Bearer <token>".
// Checks signature (Auth0's public keys), issuer, audience and expiry.
// Returns the caller's Auth0 `sub` (e.g. 'google-oauth2|1234'), or null.

const AUDIENCE = process.env.AUTH0_AUDIENCE ?? 'https://api.charm'

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null

function auth0Domain(): string {
  const domain = (process.env.AUTH0_DOMAIN ?? '').replace(/^https?:\/\//, '').replace(/\/+$/, '')
  if (!domain) throw new Error('AUTH0_DOMAIN is not set')
  return domain
}

export async function verifyAuth0(request: Request): Promise<string | null> {
  const header = request.headers.get('authorization') ?? ''
  const match = /^Bearer\s+(.+)$/i.exec(header)
  if (!match) return null

  const domain = auth0Domain()
  jwks ??= createRemoteJWKSet(new URL(`https://${domain}/.well-known/jwks.json`))

  try {
    const { payload } = await jwtVerify(match[1], jwks, {
      issuer: `https://${domain}/`,
      audience: AUDIENCE,
    })
    return typeof payload.sub === 'string' ? payload.sub : null
  } catch {
    return null
  }
}
