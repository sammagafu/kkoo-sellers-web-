import client from '@/api/client'
import { oauthClientId, oauthDefaultScope, oauthRedirectUri } from '@/config/kkooOAuth'

const PKCE_KEY = 'kkoo_oauth_pkce'
const STATE_KEY = 'kkoo_oauth_state'
const RETURN_KEY = 'kkoo_oauth_return'

function apiBaseURL() {
  const base = import.meta.env.VITE_API_BASE_URL as string | undefined
  return (base || '/api/v1').replace(/\/$/, '')
}

function randomUrlSafe(len: number) {
  const arr = new Uint8Array(len)
  crypto.getRandomValues(arr)
  return btoa(String.fromCharCode(...arr))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

async function pkceChallenge(verifier: string) {
  const data = new TextEncoder().encode(verifier)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return btoa(String.fromCharCode(...new Uint8Array(hash)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

export type OAuthChallenge = {
  challenge_id: string
  client_id: string
  client_name: string
  redirect_uri: string
  scopes: string[]
  state?: string
  first_party?: boolean
  expires_at?: string
}

export async function fetchOAuthChallenge(challengeId: string) {
  const { data } = await client.get<OAuthChallenge>(`/oauth/challenges/${encodeURIComponent(challengeId)}`)
  return data
}

export async function approveOAuthChallenge(challengeId: string, approve = true) {
  const { data } = await client.post<{ redirect_uri: string }>('/oauth/authorize/approve', {
    challenge_id: challengeId,
    approve,
  })
  return data
}

/** Redirect to KKOO Account (central OAuth authorize). */
export async function startKkooOAuth(opts?: { scope?: string; returnTo?: string }) {
  const verifier = randomUrlSafe(32)
  const challenge = await pkceChallenge(verifier)
  const state = randomUrlSafe(16)
  sessionStorage.setItem(PKCE_KEY, verifier)
  sessionStorage.setItem(STATE_KEY, state)
  if (opts?.returnTo) sessionStorage.setItem(RETURN_KEY, opts.returnTo)

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: oauthClientId,
    redirect_uri: oauthRedirectUri,
    scope: opts?.scope || oauthDefaultScope,
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
  })
  window.location.href = `${apiBaseURL()}/oauth/authorize?${params.toString()}`
}

export type OAuthTokenResponse = {
  access_token: string
  refresh_token: string
  token_type?: string
  expires_in?: number
  scope?: string
  id_token?: string
}

export async function exchangeOAuthCode(code: string, state: string): Promise<OAuthTokenResponse> {
  const storedState = sessionStorage.getItem(STATE_KEY)
  const verifier = sessionStorage.getItem(PKCE_KEY)
  if (!verifier || !storedState || state !== storedState) {
    throw new Error('Invalid OAuth state')
  }
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: oauthRedirectUri,
    client_id: oauthClientId,
    code_verifier: verifier,
  })
  const res = await fetch(`${apiBaseURL()}/oauth/token`, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  const data = (await res.json()) as OAuthTokenResponse & { error?: string }
  if (!res.ok) throw new Error(data.error || 'Token exchange failed')
  sessionStorage.removeItem(PKCE_KEY)
  sessionStorage.removeItem(STATE_KEY)
  return data
}

export function consumeOAuthReturnPath(): string | null {
  const path = sessionStorage.getItem(RETURN_KEY)
  sessionStorage.removeItem(RETURN_KEY)
  return path
}

/** Build authorize URL for mobile deep link (Flutter opens in browser). */
export function buildMobileOAuthAuthorizeUrl(opts: {
  clientId?: string
  redirectUri: string
  codeChallenge: string
  state: string
  scope?: string
}) {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: opts.clientId || 'kkoo_buyers_app',
    redirect_uri: opts.redirectUri,
    scope: opts.scope || oauthDefaultScope,
    state: opts.state,
    code_challenge: opts.codeChallenge,
    code_challenge_method: 'S256',
  })
  return `${apiBaseURL()}/oauth/authorize?${params.toString()}`
}
