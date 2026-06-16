/**
 * Invite Challenges API — time-boxed "invite N friends → earn reward"
 * Docs: https://kkooapp-backend-fiber/docs/INTEGRATION.md#11-invite-challenges
 */
import client from './client'
import type {
  InviteChallenge,
  UserChallengeProgress,
} from '../types/inviteChallenges'

// Public: list active challenges
export async function listActiveChallenges(): Promise<InviteChallenge[]> {
  return client.get('/invite-challenges/').then((r) => r.data)
}

// User: get my progress on all active challenges
export async function getMyChallengeProgress(): Promise<UserChallengeProgress[]> {
  return client.get('/invite-challenges/my-progress/').then((r) => r.data)
}

// User: claim reward when challenge is completed
export async function claimChallengeReward(
  challengeId: number
): Promise<{
  reward_type: string
  reward_value: number
  message: string
}> {
  return client
    .post(`/invite-challenges/${challengeId}/claim/`, {})
    .then((r) => r.data)
}

// Admin: list all challenges (including inactive)
export async function adminListChallenges(params?: {
  page?: number
  is_active?: boolean
}): Promise<{ results: InviteChallenge[]; total: number }> {
  return client.get('/admin/invite-challenges/', { params }).then((r) => r.data)
}

// Admin: create challenge
export async function adminCreateChallenge(
  data: Partial<InviteChallenge>
): Promise<InviteChallenge> {
  return client.post('/admin/invite-challenges/', data).then((r) => r.data)
}

// Admin: update challenge
export async function adminPatchChallenge(
  id: number,
  data: Partial<InviteChallenge>
): Promise<InviteChallenge> {
  return client.patch(`/admin/invite-challenges/${id}/`, data).then((r) => r.data)
}

// Admin: delete challenge
export async function adminDeleteChallenge(id: number): Promise<{ message: string }> {
  return client.delete(`/admin/invite-challenges/${id}/`).then((r) => r.data)
}

// Admin: get leaderboard for a challenge
export async function adminGetChallengeLeaderboard(
  id: number,
  params?: { limit?: number }
): Promise<
  Array<{ user_id: number; display_name: string; invites_completed: number }>
> {
  return client
    .get(`/admin/invite-challenges/${id}/leaderboard/`, { params })
    .then((r) => r.data)
}
