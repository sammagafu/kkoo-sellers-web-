/// <reference types="vite/client" />

// Asset imports (with @/ alias) so IDEs resolve them
declare module '@/assets/images/*.svg' {
  const src: string
  export default src
}
declare module '@/assets/images/*.jpg' {
  const src: string
  export default src
}
declare module '@/assets/images/*.jpeg' {
  const src: string
  export default src
}
declare module '@/assets/images/*.png' {
  const src: string
  export default src
}

/** Injected by Vite `define` (see `vite.config.ts`). */
declare const __APP_VERSION__: string
declare const __GIT_SHA__: string
