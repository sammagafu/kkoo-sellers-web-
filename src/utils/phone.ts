/** Light phone helpers for Tanzanian CRM invites (E.164). */
export function normalizeInvitePhone(raw: string): string {
  let s = String(raw ?? '').trim().replace(/[\s\-()]/g, '')
  if (!s) return ''
  if (s.startsWith('00')) s = `+${s.slice(2)}`
  if (s.startsWith('0') && s.length >= 9) s = `+255${s.slice(1)}`
  if (/^255\d{9}$/.test(s)) s = `+${s}`
  if (!s.startsWith('+') && /^\d{9,15}$/.test(s)) s = `+${s}`
  return s
}

export function isLikelyE164(phone: string): boolean {
  return /^\+[1-9]\d{7,14}$/.test(phone)
}
