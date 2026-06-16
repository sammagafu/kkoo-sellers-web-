/**
 * Build metadata from Vite `define` (see vite.config.ts).
 * Use for footers / support — not for security-sensitive logic.
 */
export const appVersion: string = __APP_VERSION__
export const gitSha: string = __GIT_SHA__

/** Short display label, e.g. `1.0` from `1.0.0` */
export const displayVersion = appVersion.replace(/(\.\d+)$/, '')

/** e.g. `1.0.0 · a1b2c3d` */
export const buildLabel = `${appVersion} · ${gitSha}`
