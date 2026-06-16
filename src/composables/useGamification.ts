/**
 * Composable: useGamification
 * Manages XP, streaks, achievements, and scratch cards state
 */
import { ref, computed } from 'vue'
import * as api from '../api/gamification'
import type {
  UserXP,
  Streak,
  Achievement,
  ScratchCard,
  XPEvent,
  GameLeaderboardEntry,
} from '../types/gamification'

// State
const xp = ref<UserXP | null>(null)
const streak = ref<Streak | null>(null)
const myAchievements = ref<Achievement[]>([])
const scratchCards = ref<ScratchCard[]>([])
const leaderboard = ref<GameLeaderboardEntry[]>([])
const allAchievements = ref<Achievement[]>([])
const xpHistory = ref<{ results: XPEvent[]; total: number; page: number }>({
  results: [],
  total: 0,
  page: 1,
})
const isLoading = ref(false)
const error = ref<string | null>(null)

/**
 * Fetch current user's XP and level
 */
export async function fetchMyXP() {
  isLoading.value = true
  error.value = null
  try {
    xp.value = await api.getMyXP()
  } catch (err: any) {
    error.value = err.message || 'Failed to fetch XP'
    console.error('fetchMyXP error:', err)
  } finally {
    isLoading.value = false
  }
}

/**
 * Fetch XP event history (paginated)
 */
export async function fetchXPHistory(page = 1) {
  isLoading.value = true
  error.value = null
  try {
    xpHistory.value = await api.getXPHistory({ page, page_size: 20 })
  } catch (err: any) {
    error.value = err.message || 'Failed to fetch XP history'
    console.error('fetchXPHistory error:', err)
  } finally {
    isLoading.value = false
  }
}

/**
 * Fetch current user's streak
 */
export async function fetchMyStreak() {
  isLoading.value = true
  error.value = null
  try {
    streak.value = await api.getMyStreak()
  } catch (err: any) {
    error.value = err.message || 'Failed to fetch streak'
    console.error('fetchMyStreak error:', err)
  } finally {
    isLoading.value = false
  }
}

/**
 * Use a streak freeze (if available)
 */
export async function useFreeze() {
  error.value = null
  try {
    await api.useStreakFreeze()
    // Refetch streak after freeze
    await fetchMyStreak()
  } catch (err: any) {
    error.value = err.message || 'Failed to use freeze'
    console.error('useFreeze error:', err)
  }
}

/**
 * Fetch all achievements (public catalog)
 */
export async function fetchAllAchievements() {
  isLoading.value = true
  error.value = null
  try {
    const result = await api.listAchievements({ page_size: 100 })
    allAchievements.value = result.results
  } catch (err: any) {
    error.value = err.message || 'Failed to fetch achievements'
    console.error('fetchAllAchievements error:', err)
  } finally {
    isLoading.value = false
  }
}

/**
 * Fetch user's unlocked achievements
 */
export async function fetchMyAchievements() {
  isLoading.value = true
  error.value = null
  try {
    myAchievements.value = await api.getMyAchievements()
  } catch (err: any) {
    error.value = err.message || 'Failed to fetch my achievements'
    console.error('fetchMyAchievements error:', err)
  } finally {
    isLoading.value = false
  }
}

/**
 * Fetch scratch cards
 */
export async function fetchScratchCards() {
  isLoading.value = true
  error.value = null
  try {
    scratchCards.value = await api.listMyScratchCards()
  } catch (err: any) {
    error.value = err.message || 'Failed to fetch scratch cards'
    console.error('fetchScratchCards error:', err)
  } finally {
    isLoading.value = false
  }
}

/**
 * Scratch a card
 */
export async function scratchCard(cardId: number) {
  error.value = null
  try {
    const result = await api.scratchCard(cardId)
    // Update local card
    const idx = scratchCards.value.findIndex((c) => c.id === cardId)
    if (idx !== -1) {
      scratchCards.value[idx] = result
    }
    return result
  } catch (err: any) {
    error.value = err.message || 'Failed to scratch card'
    console.error('scratchCard error:', err)
    throw err
  }
}

/**
 * Fetch leaderboard
 */
export async function fetchLeaderboard() {
  isLoading.value = true
  error.value = null
  try {
    leaderboard.value = await api.getLeaderboard({ limit: 10 })
  } catch (err: any) {
    error.value = err.message || 'Failed to fetch leaderboard'
    console.error('fetchLeaderboard error:', err)
  } finally {
    isLoading.value = false
  }
}

/**
 * Computed: is level-up pending?
 */
export const nextLevelXP = computed(() => {
  if (!xp.value) return 0
  const levelThresholds: { [key: number]: number } = {
    1: 0,
    2: 100,
    3: 300,
    4: 700,
    5: 1500,
  }
  return levelThresholds[xp.value.level + 1] || 0
})

export const xpProgress = computed(() => {
  if (!xp.value) return 0
  const current = xp.value.total_xp
  const levelThresholds: { [key: number]: number } = {
    1: 0,
    2: 100,
    3: 300,
    4: 700,
    5: 1500,
  }
  const currentLevelStart = levelThresholds[xp.value.level] || 0
  const nextLevelStart = levelThresholds[xp.value.level + 1] || nextLevelXP.value
  const progress = current - currentLevelStart
  const total = nextLevelStart - currentLevelStart
  return total > 0 ? (progress / total) * 100 : 0
})

/**
 * Composable export
 */
export function useGamification() {
  return {
    // State
    xp,
    streak,
    myAchievements,
    scratchCards,
    leaderboard,
    allAchievements,
    xpHistory,
    isLoading,
    error,
    // Computed
    nextLevelXP,
    xpProgress,
    // Methods
    fetchMyXP,
    fetchXPHistory,
    fetchMyStreak,
    useFreeze,
    fetchAllAchievements,
    fetchMyAchievements,
    fetchScratchCards,
    scratchCard,
    fetchLeaderboard,
  }
}
