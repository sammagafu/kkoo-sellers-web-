/** Canonical KKOO logo — same assets as the index.html splash screen. */
export const brandLogo = {
  light: '/logo-icon.svg',
  dark: '/logo-icon-dark.svg',
} as const

export function brandLogoForTheme(theme: 'light' | 'dark'): string {
  return theme === 'dark' ? brandLogo.dark : brandLogo.light
}
