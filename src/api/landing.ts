import client from './client'

export interface LandingStatItem {
  key: string
  label: string
  value: string
  icon: string
  featured: boolean
}

export interface LandingStatsResponse {
  section_label: string
  section_headline: string
  section_headline_accent: string
  stats: LandingStatItem[]
}

interface PublicLandingResponse {
  stats_section?: LandingStatsResponse
}

function isLandingStatsResponse(data: unknown): data is LandingStatsResponse {
  if (!data || typeof data !== 'object') return false
  const d = data as LandingStatsResponse
  return Array.isArray(d.stats)
}

/** Loads landing stats; tolerates 404 when the dedicated route is not deployed yet. */
export async function fetchLandingStats(): Promise<LandingStatsResponse | null> {
  try {
    const statsRes = await client.get<LandingStatsResponse>('/public/landing/stats/', {
      validateStatus: (status) => status === 200 || status === 404,
    })
    if (statsRes.status === 200 && isLandingStatsResponse(statsRes.data)) {
      return statsRes.data
    }
  } catch {
    // Network / CORS — try combined landing payload below.
  }

  try {
    const landingRes = await client.get<PublicLandingResponse>('/public/landing/', {
      validateStatus: (status) => status === 200 || status === 404,
    })
    if (
      landingRes.status === 200 &&
      isLandingStatsResponse(landingRes.data.stats_section)
    ) {
      return landingRes.data.stats_section
    }
  } catch {
    // Ignore — caller uses i18n defaults.
  }

  return null
}

export const landingApi = {
  stats: fetchLandingStats,
}
