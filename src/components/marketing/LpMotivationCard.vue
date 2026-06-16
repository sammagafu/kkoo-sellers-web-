<template>
  <article :class="['lp-motivation-card', `lp-motivation-card--${layout}`, toneClass]" :style="cardStyle">
    <div v-if="image" class="lp-motivation-media">
      <img :src="image" :alt="title" />
    </div>
    <div class="lp-motivation-content">
      <span v-if="icon" class="lp-motivation-icon">
        <Icon :icon="icon" />
      </span>
      <h3>{{ title }}</h3>
      <p>{{ copy }}</p>
      <slot />
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@iconify/vue'

const props = defineProps({
  title: { type: String, required: true },
  copy: { type: String, required: true },
  image: { type: String, default: '' },
  icon: { type: String, default: '' },
  layout: { type: String, default: 'stacked' }, // stacked, split, media
  gradient: { type: String, default: 'linear-gradient(135deg, rgba(92,48,143,0.9), rgba(247,168,41,0.8))' },
  tone: { type: String, default: 'light' }, // light, dark
})

const toneClass = computed(() => `lp-motivation-card--${props.tone}`)

const cardStyle = computed(() => {
  return {
    background: props.image && props.layout === 'media' ? `linear-gradient(135deg, rgba(0,0,0,0.45), rgba(0,0,0,0.35)), rgba(31,21,41,0.85)` : props.gradient,
  }
})
</script>

<style scoped>
.lp-motivation-card {
  border-radius: 22px;
  padding: 1.6rem;
  color: #fff;
  display: grid;
  gap: 1rem;
  box-shadow: 0 20px 45px rgba(15, 7, 26, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.lp-motivation-card img {
  width: 100%;
  height: 140px;
  object-fit: cover;
  border-radius: 16px;
  filter: saturate(1.2);
}

.lp-motivation-content h3 {
  margin: 0;
  font-size: 1.35rem;
  line-height: 1.3;
  font-weight: 800;
}

.lp-motivation-content p {
  margin: 0;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.85);
}

.lp-motivation-card--split {
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.lp-motivation-card--media {
  background: var(--lp-primary-dark);
}

.lp-motivation-card--dark {
  color: #f2e9ff;
}

.lp-motivation-card--light {
  border-color: rgba(255, 255, 255, 0.4);
}

.lp-motivation-icon {
  width: 3rem;
  height: 3rem;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.15);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
}
</style>
