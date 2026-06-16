<template>
  <div class="badges-gallery">
    <div class="gallery-grid">
      <div v-for="badge in badges" :key="badge.id" class="badge-item">
        <div class="badge-icon">
          <img :src="badge.icon" :alt="badge.name" />
        </div>
        <div class="badge-info">
          <h5>{{ badge.name }}</h5>
          <p>{{ badge.description }}</p>
          <small class="text-muted">{{ badge.rarity }}</small>
        </div>
        <div class="badge-status">
          <b-badge :variant="badge.unlocked ? 'success' : 'secondary'">
            {{ badge.unlocked ? 'Unlocked' : 'Locked' }}
          </b-badge>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Badge {
  id: string
  name: string
  description: string
  icon: string
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary'
  unlocked: boolean
}

const badges = ref<Badge[]>([
  {
    id: '1',
    name: 'First Purchase',
    description: 'Complete your first purchase',
    icon: '🛍️',
    rarity: 'Common',
    unlocked: true,
  },
  {
    id: '2',
    name: 'Speed Shopper',
    description: 'Complete 5 purchases in one week',
    icon: '⚡',
    rarity: 'Rare',
    unlocked: true,
  },
  {
    id: '3',
    name: 'Loyal Customer',
    description: 'Purchase for 30 consecutive days',
    icon: '👑',
    rarity: 'Epic',
    unlocked: false,
  },
  {
    id: '4',
    name: 'Master Collector',
    description: 'Collect all available badges',
    icon: '💎',
    rarity: 'Legendary',
    unlocked: false,
  },
])
</script>

<style scoped lang="scss">
.badges-gallery {
  padding: 1rem;

  .gallery-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1.5rem;

    .badge-item {
      background: #fff;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      transition: all 0.3s ease;
      cursor: pointer;

      &:hover {
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
        transform: translateY(-4px);
        border-color: #007bff;
      }

      .badge-icon {
        font-size: 3rem;
        margin-bottom: 1rem;

        img {
          max-width: 100%;
          height: auto;
        }
      }

      .badge-info {
        flex-grow: 1;
        margin-bottom: 1rem;

        h5 {
          margin: 0.5rem 0;
          font-weight: 600;
          color: #333;
        }

        p {
          margin: 0.5rem 0;
          color: #666;
          font-size: 0.9rem;
        }
      }

      .badge-status {
        width: 100%;
      }
    }
  }
}
</style>
