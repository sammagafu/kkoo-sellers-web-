/** Origins for the split KKOO web apps (override via Vite env in staging). */
const env = import.meta.env

export const buyerWebOrigin =
  (env.VITE_BUYER_WEB_ORIGIN as string | undefined) || 'https://kkooapp.co.tz'

export const adminWebOrigin =
  (env.VITE_ADMIN_WEB_ORIGIN as string | undefined) || 'https://admin.kkooapp.co.tz'

export const bizWebOrigin =
  (env.VITE_BIZ_WEB_ORIGIN as string | undefined) || 'https://biz.kkooapp.co.tz'

function joinOrigin(origin: string, path: string) {
  return `${origin.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`
}

export const buyerWebPath = (path: string) => joinOrigin(buyerWebOrigin, path)
export const adminWebPath = (path: string) => joinOrigin(adminWebOrigin, path)
export const bizWebPath = (path: string) => joinOrigin(bizWebOrigin, path)
