/**
 * Gamification API — XP, streaks, achievements, scratch cards
 * Docs: https://kkooapp-backend-fiber/docs/INTEGRATION.md#9-gamification
 */
import client from './client'
import type {
  UserXP,
  Streak,
  Achievement,
  ScratchCard,
  XPEvent,
  GameLeaderboardEntry,
} from '../types/gamification'

// Public endpoints (no auth required)
export async function listAchievements(params?: {
  page?: number
  page_size?: number
  category?: string
}): Promise<{ results: Achievement[]; total: number }> {
  return client.get('/gamification/achievements/', { params }).then((r) => r.data)
}

export async function getLeaderboard(params?: {
  limit?: number
  offset?: number
}): Promise<GameLeaderboardEntry[]> {
  return client.get('/gamification/leaderboard/', { params }).then((r) => r.data)
}

// Authenticated user endpoints
export async function getMyXP(): Promise<UserXP> {
  return client.get('/gamification/xp/').then((r) => r.data)
}

export async function getXPHistory(params?: {
  page?: number
  page_size?: number
}): Promise<{ results: XPEvent[]; total: number; page: number }> {
  return client.get('/gamification/xp/history/', { params }).then((r) => r.data)
}

export async function getMyStreak(): Promise<Streak> {
  return client.get('/gamification/streak/').then((r) => r.data)
}

export async function useStreakFreeze(): Promise<{ message: string }> {
  return client.post('/gamification/streak/freeze/', {}).then((r) => r.data)
}

export async function getMyAchievements(): Promise<Achievement[]> {
  return client.get('/gamification/achievements/me/').then((r) => r.data)
}

export async function listMyScratchCards(): Promise<ScratchCard[]> {
  return client.get('/gamification/scratch-cards/').then((r) => r.data)
}

export async function scratchCard(cardId: number): Promise<ScratchCard> {
  return client
    .post(`/gamification/scratch-cards/${cardId}/scratch/`, {})
    .then((r) => r.data)
}

// Admin endpoints
export async function adminListAchievements(params?: {
  page?: number
  is_active?: boolean
}): Promise<{ results: Achievement[]; total: number }> {
  return client.get('/admin/gamification/achievements/', { params }).then((r) => r.data)
}

export async function adminCreateAchievement(
  data: Partial<Achievement>
): Promise<Achievement> {
  return client.post('/admin/gamification/achievements/', data).then((r) => r.data)
}

export async function adminPatchAchievement(
  id: number,
  data: Partial<Achievement>
): Promise<Achievement> {
  return client
    .patch(`/admin/gamification/achievements/${id}/`, data)
    .then((r) => r.data)
}

export async function adminGrantAchievement(data: {
  user_id: number
  achievement_id: number
}): Promise<{ message: string }> {
  return client
    .post('/admin/gamification/achievements/grant/', data)
    .then((r) => r.data)
}
