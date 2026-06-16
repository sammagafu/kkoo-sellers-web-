<template>
  <div class="gamification-hub">
    <!-- Header -->
    <div class="hub-header mb-4">
      <h2 class="mb-2">🎮 Gamification Hub</h2>
      <p class="text-muted">Track XP, achievements, and leaderboard status</p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>

    <!-- Main Content -->
    <div v-else class="row">
      <!-- XP & Level Card -->
      <div class="col-lg-4 mb-4">
        <div class="card h-100 shadow-sm">
          <div class="card-body">
            <h5 class="card-title mb-3">Your Level</h5>
            <div class="text-center mb-4">
              <div class="display-4 text-primary fw-bold">{{ xp?.level || 1 }}</div>
              <p class="text-muted">{{ xp?.level_name || 'Explorer' }}</p>
            </div>
            <div class="mb-3">
              <div class="progress" style="height: 8px">
                <div
                  class="progress-bar bg-success"
                  :style="{ width: xpProgress + '%' }"
                ></div>
              </div>
              <small class="text-muted">{{ xp?.total_xp || 0 }} / {{ nextLevelXP }} XP</small>
            </div>
            <div class="d-flex justify-content-between text-sm">
              <span>🔥 Streak: <strong>{{ streak?.current_streak || 0 }}</strong></span>
              <button
                v-if="canUseFreeze"
                type="button"
                class="btn btn-sm btn-outline-primary"
                @click="freezeStreak"
              >
                Use freeze
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Achievements Card -->
      <div class="col-lg-4 mb-4">
        <div class="card h-100 shadow-sm">
          <div class="card-body">
            <h5 class="card-title mb-3">Achievements</h5>
            <div class="achievements-list" style="max-height: 300px; overflow-y: auto">
              <div
                v-for="ach in myAchievements"
                :key="ach.id"
                class="d-flex align-items-center mb-2 p-2 rounded"
                :class="achievementRowClass(ach)"
              >
                <div class="flex-shrink-0 achievement-badge">{{ achievementBadge(ach) }}</div>
                <div class="flex-grow-1 ms-2">
                  <small class="d-block fw-bold">{{ ach.title }}</small>
                  <small class="text-muted">{{ ach.description || 'Achievement unlocked' }}</small>
                </div>
                <small class="badge bg-success">Unlocked</small>
              </div>
            </div>
            <div class="mt-3">
              <small class="text-muted">{{ myAchievements.length || 0 }} unlocked</small>
            </div>
          </div>
        </div>
      </div>

      <!-- Scratch Cards Card -->
      <div class="col-lg-4 mb-4">
        <div class="card h-100 shadow-sm">
          <div class="card-body">
            <h5 class="card-title mb-3">Scratch Cards</h5>
            <div class="row g-2">
              <div
                v-for="card in scratchCards"
                :key="card.id"
                class="col-6"
              >
                <div
                  class="scratch-card text-center p-3 rounded cursor-pointer"
                  :class="{ 'bg-warning': !card.is_scratched, 'bg-success': card.is_scratched }"
                  @click="scratchCard(card.id)"
                >
                  <div style="font-size: 32px" class="mb-2">
                    {{ card.is_scratched ? '✓' : '🎫' }}
                  </div>
                  <small>{{ card.is_scratched ? formatScratchReward(card.reward_type, card.reward_value) : 'Scratch!' }}</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Leaderboard -->
      <div class="col-12 mb-4">
        <div class="card shadow-sm">
          <div class="card-body">
            <h5 class="card-title mb-3">🏆 Top Leaderboard</h5>
            <div class="table-responsive">
              <table class="table table-sm table-hover mb-0">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>User</th>
                    <th>Level</th>
                    <th>XP</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(user, idx) in leaderboard" :key="user.user_id">
                    <td>
                      <strong>{{ idx + 1 }}</strong>
                      <span v-if="idx === 0">🥇</span>
                      <span v-else-if="idx === 1">🥈</span>
                      <span v-else-if="idx === 2">🥉</span>
                    </td>
                    <td>{{ user.display_name }}</td>
                    <td><span :class="['badge', levelVariantClass(user.level_name)]">{{ user.level_name }}</span></td>
                    <td><strong>{{ user.total_xp }}</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useGamification } from '@/composables/useGamification'

const {
  xp,
  streak,
  myAchievements,
  scratchCards,
  leaderboard,
  fetchMyXP,
  fetchMyStreak,
  fetchMyAchievements,
  fetchScratchCards,
  fetchLeaderboard,
  scratchCard: scratch,
  useFreeze,
} = useGamification()

const loading = ref(true)

const xpProgress = computed(() => {
  if (!xp.value) return 0
  const current = xp.value.total_xp % 1000 // XP needed per level
  return (current / 1000) * 100
})

const nextLevelXP = computed(() => {
  if (!xp.value) return 1000
  return ((xp.value.level + 1) * 1000)
})

const canUseFreeze = computed(
  () => !!streak.value?.streak_freeze_available_at && !streak.value?.streak_freeze_used
)

const levelVariantClass = (levelName: string) => {
  const normalized = levelName.toLowerCase()
  if (normalized.includes('legend')) return 'bg-danger-subtle text-danger-emphasis'
  if (normalized.includes('gold') || normalized.includes('pro')) return 'bg-warning-subtle text-warning-emphasis'
  if (normalized.includes('silver') || normalized.includes('elite')) return 'bg-info-subtle text-info-emphasis'
  return 'bg-primary-subtle text-primary-emphasis'
}

const freezeStreak = async () => {
  try {
    await useFreeze()
  } catch (err) {
    console.error('Failed to use streak freeze:', err)
  }
}

const scratchCard = async (cardId: number) => {
  try {
    await scratch(cardId)
    alert('Card scratched! Check your reward.')
  } catch (err) {
    console.error('Failed to scratch card:', err)
  }
}

onMounted(async () => {
  try {
    loading.value = true
    await Promise.all([
      fetchMyXP(),
      fetchMyStreak(),
      fetchMyAchievements(),
      fetchScratchCards(),
      fetchLeaderboard()
    ])
  } catch (err) {
    console.error('Failed to load gamification:', err)
  } finally {
    loading.value = false
  }
})

const achievementBadge = (achievement: { rarity: string }) => {
  switch (achievement.rarity) {
    case 'legendary':
      return '👑'
    case 'epic':
      return '💎'
    case 'rare':
      return '⭐'
    default:
      return '🏅'
  }
}

const achievementRowClass = (achievement: { rarity: string }) => ({
  'bg-warning-subtle': achievement.rarity === 'legendary',
  'bg-info-subtle': achievement.rarity === 'epic',
})

const formatScratchReward = (rewardType: string, rewardValue: number) => {
  if (rewardType === 'xp') return `${rewardValue} XP`
  if (rewardType === 'wallet_credit') return `TSH ${rewardValue}`
  if (rewardType === 'discount_percent') return `${rewardValue}% off`
  if (rewardType === 'free_delivery') return 'Free delivery'
  return 'No reward'
}
</script>

<style scoped>
.gamification-hub {
  padding: 1.5rem 0;
}

.hub-header h2 {
  font-size: 1.75rem;
  font-weight: 600;
}

.scratch-card {
  transition: transform 0.2s;
}

.scratch-card:hover {
  transform: scale(1.05);
  cursor: pointer;
}

.achievement-badge {
  font-size: 24px;
}

.achievements-list::-webkit-scrollbar {
  width: 6px;
}

.achievements-list::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.achievements-list::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 3px;
}
</style>
