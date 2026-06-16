const PREFIX = 'kkoo_backup_codes_'

export type StoredBackupCodes = {
  codes: string[]
  saved_at: string
}

export function backupCodesStorageKey(userId: string | number | undefined): string {
  return `${PREFIX}${userId ?? 'unknown'}`
}

export function loadStoredBackupCodes(userId: string | number | undefined): string[] {
  if (typeof localStorage === 'undefined' || userId == null) return []
  try {
    const raw = localStorage.getItem(backupCodesStorageKey(userId))
    if (!raw) return []
    const parsed = JSON.parse(raw) as StoredBackupCodes
    if (!Array.isArray(parsed.codes)) return []
    return parsed.codes.map(String).filter((s) => s.trim())
  } catch {
    return []
  }
}

export function saveStoredBackupCodes(userId: string | number | undefined, codes: string[]): void {
  if (typeof localStorage === 'undefined' || userId == null || !codes.length) return
  const payload: StoredBackupCodes = {
    codes,
    saved_at: new Date().toISOString(),
  }
  localStorage.setItem(backupCodesStorageKey(userId), JSON.stringify(payload))
}

export function clearStoredBackupCodes(userId: string | number | undefined): void {
  if (typeof localStorage === 'undefined' || userId == null) return
  localStorage.removeItem(backupCodesStorageKey(userId))
}
