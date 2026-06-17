/** KKOO Account OAuth client (Sign in with KKOO). */
export const oauthClientId =
  (import.meta.env.VITE_OAUTH_CLIENT_ID as string | undefined) || 'kkoo_admin_web'

export const oauthRedirectUri =
  typeof window !== 'undefined'
    ? `${window.location.origin}/auth/oauth/callback`
    : 'https://admin.kkooapp.co.tz/auth/oauth/callback'

export const oauthDefaultScope = 'openid profile phone email offline_access admin'
