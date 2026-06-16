<template>
  <div class="streak-counter">
    <div class="streak-display">
      <div class="streak-fire-icon">🔥</div>
      <div class="streak-main">
        <div class="streak-number">{{ currentStreak }}</div>
        <div class="streak-label">Day Streak</div>
      </div>
    </div>

    <div class="streak-info">
      <div class="info-item">
        <span class="info-label">Best Streak:</span>
        <span class="info-value">{{ bestStreak }}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Last Activity:</span>
        <span class="info-value">{{ lastActivityDay }}</span>
      </div>
    </div>

    <div class="streak-progress">
      <div class="progress-title">This Week</div>
      <div class="week-days">
        <div
          v-for="(day, index) in weekDays"
          :key="index"
          :class="['day-badge', day.active ? 'active' : '']"
          :title="day.label"
        >
          {{ day.label.charAt(0) }}
        </div>
      </div>
    </div>

    <div class="streak-rewards">
      <div class="milestone" v-for="(reward, index) in milestones" :key="index">
        <div :class="['milestone-marker', currentStreak >= reward.day ? 'achieved' : '']">
          <span>{{ reward.day }}</span>
        </div>
        <span class="milestone-label">{{ reward.reward }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface WeekDay {
  label: string
  active: boolean
}

interface Milestone {
  day: number
  reward: string
}

const currentStreak = ref(7)
const bestStreak = ref(42)
const lastActivityDay = ref('Today')

const weekDays = ref<WeekDay[]>([
  { label: 'Monday', active: true },
  { label: 'Tuesday', active: true },
  { label: 'Wednesday', active: true },
  { label: 'Thursday', active: true },
  { label: 'Friday', active: true },
  { label: 'Saturday', active: false },
  { label: 'Sunday', active: false },
])

const milestones = ref<Milestone[]>([
  { day: 7, reward: '🎁 7-Day' },
  { day: 14, reward: '⭐ 2-Week' },
  { day: 30, reward: '👑 1-Month' },
  { day: 100, reward: '💎 Legend' },
])
</script>

<style scoped lang="scss">
.streak-counter {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 2rem;
  color: white;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);

  .streak-display {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1.5rem;
    margin-bottom: 2rem;

    .streak-fire-icon {
      font-size: 4rem;
      animation: bounce 2s infinite;
    }

    .streak-main {
      text-align: center;

      .streak-number {
        font-size: 3rem;
        font-weight: 700;
        line-height: 1;
        margin-bottom: 0.5rem;
      }

      .streak-label {
        font-size: 1.1rem;
        opacity: 0.9;
      }
    }
  }

  .streak-info {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    margin-bottom: 2rem;
    padding: 1.5rem;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 8px;

    .info-item {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .info-label {
        opacity: 0.9;
      }

      .info-value {
        font-weight: 600;
        font-size: 1.2rem;
      }
    }
  }

  .streak-progress {
    margin-bottom: 2rem;

    .progress-title {
      margin-bottom: 0.8rem;
      font-weight: 600;
      font-size: 0.9rem;
      opacity: 0.9;
    }

    .week-days {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 0.5rem;

      .day-badge {
        aspect-ratio: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(255, 255, 255, 0.2);
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-radius: 8px;
        font-weight: 600;
        font-size: 0.85rem;
        cursor: pointer;
        transition: all 0.3s ease;

        &:hover {
          transform: scale(1.05);
        }

        &.active {
          background: rgba(255, 255, 255, 0.9);
          color: #667eea;
          border-color: #fff;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }
      }
    }
  }

  .streak-rewards {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1rem;

    .milestone {
      text-align: center;

      .milestone-marker {
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.2);
        border: 2px dashed rgba(255, 255, 255, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 0.5rem;
        font-weight: 600;
        font-size: 0.9rem;
        transition: all 0.3s ease;

        &.achieved {
          background: rgba(255, 255, 255, 0.9);
          color: #667eea;
          border-color: #fff;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
          transform: scale(1.1);
        }
      }

      .milestone-label {
        display: block;
        font-size: 0.85rem;
        opacity: 0.9;
      }
    }
  }

  @keyframes bounce {
    0%,
    100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-10px);
    }
  }
}
</style>
