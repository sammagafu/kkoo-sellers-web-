<template>
  <div class="leaderboard">
    <div class="leaderboard-header">
      <h3>Leaderboard</h3>
      <div class="filter-buttons">
        <b-button
          v-for="period in periods"
          :key="period"
          :variant="activeFilter === period ? 'primary' : 'outline-primary'"
          size="sm"
          @click="activeFilter = period"
        >
          {{ period }}
        </b-button>
      </div>
    </div>

    <div class="leaderboard-table">
      <div class="table-header">
        <div class="rank">Rank</div>
        <div class="player">Player</div>
        <div class="score">Score</div>
        <div class="change">Change</div>
      </div>

      <div v-for="(entry, index) in leaderboard" :key="entry.id" :class="['table-row', getRankClass(index)]">
        <div class="rank">
          <span class="rank-badge" v-if="index < 3">
            {{ getRankMedal(index) }}
          </span>
          <span v-else>{{ index + 1 }}</span>
        </div>

        <div class="player">
          <div class="player-avatar">
            <b-avatar :src="entry.avatar" :alt="entry.name" size="md" />
          </div>
          <div class="player-info">
            <div class="player-name">{{ entry.name }}</div>
            <small class="player-tier">{{ entry.tier }}</small>
          </div>
        </div>

        <div class="score">
          <strong>{{ formatNumber(entry.score) }}</strong>
          <span class="score-label">points</span>
        </div>

        <div class="change" :class="entry.change > 0 ? 'positive' : entry.change < 0 ? 'negative' : 'neutral'">
          <i :class="getChangeIcon(entry.change)" />
          {{ Math.abs(entry.change) }}
        </div>
      </div>
    </div>

    <div class="leaderboard-footer">
      <div v-if="currentUserRank" class="current-user-rank">
        <strong>Your Rank: #{{ currentUserRank }}</strong> with {{ formatNumber(currentUserScore) }} points
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface LeaderboardEntry {
  id: string
  name: string
  avatar: string
  score: number
  tier: string
  change: number
}

const activeFilter = ref('Weekly')
const periods = ['Weekly', 'Monthly', 'All-Time']

const currentUserRank = ref(42)
const currentUserScore = ref(15680)

const leaderboard = ref<LeaderboardEntry[]>([
  {
    id: '1',
    name: 'Sarah Johnson',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah',
    score: 89450,
    tier: 'Platinum',
    change: 2,
  },
  {
    id: '2',
    name: 'Alex Chen',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex',
    score: 87230,
    tier: 'Gold',
    change: 1,
  },
  {
    id: '3',
    name: 'Maria Garcia',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=maria',
    score: 84920,
    tier: 'Gold',
    change: -1,
  },
  {
    id: '4',
    name: 'James Wilson',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=james',
    score: 78540,
    tier: 'Silver',
    change: 3,
  },
  {
    id: '5',
    name: 'Emma Davis',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=emma',
    score: 76320,
    tier: 'Silver',
    change: -2,
  },
])

const getRankClass = (index: number) => {
  if (index === 0) return 'rank-first'
  if (index === 1) return 'rank-second'
  if (index === 2) return 'rank-third'
  return ''
}

const getRankMedal = (index: number) => {
  const medals = ['🥇', '🥈', '🥉']
  return medals[index] || (index + 1).toString()
}

const getChangeIcon = (change: number) => {
  if (change > 0) return 'bi bi-arrow-up'
  if (change < 0) return 'bi bi-arrow-down'
  return 'bi bi-dash'
}

const formatNumber = (num: number) => {
  return num.toLocaleString('en-US')
}
</script>

<style scoped lang="scss">
.leaderboard {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;

  .leaderboard-header {
    padding: 1.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #e0e0e0;

    h3 {
      margin: 0;
      font-weight: 700;
      color: #333;
    }

    .filter-buttons {
      display: flex;
      gap: 0.5rem;

      .btn {
        font-size: 0.85rem;
      }
    }
  }

  .leaderboard-table {
    .table-header {
      display: grid;
      grid-template-columns: 60px 1fr 120px 100px;
      gap: 1rem;
      padding: 1rem 1.5rem;
      background: #f8f9fa;
      border-bottom: 1px solid #e0e0e0;
      font-weight: 600;
      color: #666;
      font-size: 0.85rem;
    }

    .table-row {
      display: grid;
      grid-template-columns: 60px 1fr 120px 100px;
      gap: 1rem;
      padding: 1.2rem 1.5rem;
      border-bottom: 1px solid #e0e0e0;
      align-items: center;
      transition: background-color 0.3s ease;

      &:hover {
        background-color: #f8f9fa;
      }

      &.rank-first {
        background: rgba(255, 193, 7, 0.08);

        .rank {
          font-weight: 700;
          color: #ffc107;
        }
      }

      &.rank-second {
        background: rgba(192, 192, 192, 0.08);

        .rank {
          font-weight: 700;
          color: #c0c0c0;
        }
      }

      &.rank-third {
        background: rgba(205, 127, 50, 0.08);

        .rank {
          font-weight: 700;
          color: #cd7f32;
        }
      }

      .rank {
        text-align: center;
        font-weight: 600;
        font-size: 1.1rem;

        .rank-badge {
          font-size: 1.5rem;
        }
      }

      .player {
        display: flex;
        align-items: center;
        gap: 1rem;

        .player-avatar {
          flex-shrink: 0;
        }

        .player-info {
          .player-name {
            font-weight: 600;
            color: #333;
            margin-bottom: 0.25rem;
          }

          .player-tier {
            color: #999;
          }
        }
      }

      .score {
        text-align: right;

        strong {
          display: block;
          font-size: 1.2rem;
          color: #667eea;
        }

        .score-label {
          font-size: 0.75rem;
          color: #999;
        }
      }

      .change {
        text-align: right;
        font-weight: 600;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 0.5rem;

        i {
          font-size: 1rem;
        }

        &.positive {
          color: #10b981;
        }

        &.negative {
          color: #ef4444;
        }

        &.neutral {
          color: #999;
        }
      }
    }
  }

  .leaderboard-footer {
    padding: 1.5rem;
    background: #f8f9fa;
    border-top: 1px solid #e0e0e0;
    text-align: center;

    .current-user-rank {
      color: #667eea;
      font-weight: 600;
    }
  }
}
</style>
