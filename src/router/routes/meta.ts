export const baseBrand = 'KKOOAPP — Shop, order, and run your business in one place'

export function setTitle(title: string) {
  const base = 'KKOOAPP — Admin'
  return title ? `[Admin] ${title} | ${base}` : `[Admin] ${base}`
}

export function setLandingTitle(title: string) {
  return title ? `${title} | ${baseBrand}` : baseBrand
}
