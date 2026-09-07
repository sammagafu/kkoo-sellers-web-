/** Swahili aliases and icons for category recognition (search matches EN + SW + slug). */
export const CATEGORY_SWAHILI: Record<string, string> = {
  clothes: 'Nguo',
  clothing: 'Nguo',
  fashion: 'Mitindo',
  sport: 'Michezo',
  sports: 'Michezo',
  drinks: 'Vinywaji',
  beverages: 'Vinywaji',
  food: 'Vyakula',
  foods: 'Vyakula',
  pharmacy: 'Dawa',
  medicine: 'Dawa',
  'personal care': 'Vipodozi',
  care: 'Vipodozi',
  cosmetics: 'Vipodozi',
  fresh: 'Mboga',
  groceries: 'Mboga',
  vegetables: 'Mboga',
  electronics: 'Vifaa vya umeme',
  phones: 'Simu',
  home: 'Nyumbani',
  household: 'Nyumbani',
  bakery: 'Mkate',
  snacks: 'Vitafunwa',
  alcohol: 'Pombe',
  frozen: 'Vilivyogandishwa',
  hotel: 'Hoteli',
  restaurant: 'Mkahawa',
}

const SLUG_ICON: Record<string, string> = {
  clothes: '👕',
  clothing: '👕',
  fashion: '👗',
  sport: '⚽',
  drinks: '🥤',
  beverages: '🥤',
  food: '🍲',
  pharmacy: '💊',
  medicine: '💊',
  care: '🧴',
  cosmetics: '🧴',
  fresh: '🥬',
  groceries: '🛒',
  electronics: '📱',
  phones: '📱',
  home: '🏠',
  household: '🏠',
  bakery: '🥐',
  snacks: '🍿',
  alcohol: '🍺',
  frozen: '❄️',
  hotel: '🏨',
  restaurant: '🍽️',
}

export function swahiliLabel(name: string, slug?: string): string {
  const key = name.trim().toLowerCase()
  if (CATEGORY_SWAHILI[key]) return CATEGORY_SWAHILI[key]
  const slugKey = (slug ?? '').replace(/-/g, ' ').toLowerCase()
  for (const [en, sw] of Object.entries(CATEGORY_SWAHILI)) {
    if (slugKey.includes(en) || key.includes(en)) return sw
  }
  return ''
}

export function categoryIcon(name: string, slug?: string, iconField?: string): string {
  if (iconField?.trim()) {
    const v = iconField.trim()
    if (/^[\p{Emoji}\p{Extended_Pictographic}]/u.test(v)) return v.slice(0, 2)
    return v.slice(0, 1).toUpperCase()
  }
  const slugKey = (slug ?? name).toLowerCase().replace(/-/g, ' ')
  for (const [key, emoji] of Object.entries(SLUG_ICON)) {
    if (slugKey.includes(key)) return emoji
  }
  const letter = name.trim().charAt(0).toUpperCase()
  return letter || '📦'
}

export function matchesCategoryQuery(
  name: string,
  slug: string,
  pathLabel: string,
  query: string
): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  const sw = swahiliLabel(name, slug).toLowerCase()
  const hay = [name, slug, pathLabel, sw].join(' ').toLowerCase()
  return hay.includes(q)
}
