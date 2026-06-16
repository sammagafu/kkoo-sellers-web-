export const baseBrand = 'KKOOAPP — Shop, order, and run your business in one place'

export function setTitle(title: string) {
  const base = 'KKOOAPP — Business tools'
  return title ? `${title} | ${base}` : base
}

export function setLandingTitle(title: string) {
  return title ? `${title} | ${baseBrand}` : baseBrand
}
