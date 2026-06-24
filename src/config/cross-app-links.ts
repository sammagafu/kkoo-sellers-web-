/** Origins for the split KKOO web apps — env override, else localhost ports, else production. */
const env = import.meta.env

const PRODUCTION_ORIGINS = {
  buyer: 'https://kkooapp.co.tz',
  admin: 'https://admin.kkooapp.co.tz',
  biz: 'https://biz.kkooapp.co.tz',
} as const

/** Local `npm run dev` ports (see docs/LOCAL_DEV.md). */
const LOCAL_PORTS = {
  buyer: 5175,
  admin: 5173,
  biz: 5174,
} as const

type WebApp = keyof typeof PRODUCTION_ORIGINS

function trimOrigin(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed.replace(/\/$/, '') : undefined
}

function isLocalHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1'
}

function localOrigin(port: number): string {
  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location
    return `${protocol}//${hostname}:${port}`
  }
  return `http://localhost:${port}`
}

function resolveAppOrigin(envValue: string | undefined, app: WebApp): string {
  const fromEnv = trimOrigin(envValue)
  if (fromEnv) return fromEnv

  if (typeof window !== 'undefined' && isLocalHost(window.location.hostname)) {
    return localOrigin(LOCAL_PORTS[app])
  }

  return PRODUCTION_ORIGINS[app]
}

export const buyerWebOrigin = resolveAppOrigin(
  env.VITE_BUYER_WEB_ORIGIN as string | undefined,
  'buyer',
)

export const adminWebOrigin = resolveAppOrigin(
  env.VITE_ADMIN_WEB_ORIGIN as string | undefined,
  'admin',
)

export const bizWebOrigin = resolveAppOrigin(
  env.VITE_BIZ_WEB_ORIGIN as string | undefined,
  'biz',
)

function joinOrigin(origin: string, path: string) {
  return `${origin.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`
}

export const buyerWebPath = (path: string) => joinOrigin(buyerWebOrigin, path)
export const adminWebPath = (path: string) => joinOrigin(adminWebOrigin, path)
export const bizWebPath = (path: string) => joinOrigin(bizWebOrigin, path)
