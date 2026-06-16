<template>
  <router-link
    :to="to"
    class="lp-link-button"
    :class="variantClass"
  >
    <slot>{{ label }}</slot>
  </router-link>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps({
  to: { type: [String, Object], required: true },
  label: { type: String, default: '' },
  variant: { type: String, default: 'beige' }, // beige or light
})

const variantClass = computed(() => `lp-link-button--${props.variant}`)
</script>

<style scoped>
.lp-link-button {
  border-radius: 999px;
  padding: 0.65rem 1.2rem;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  text-decoration: none;
}

.lp-link-button--beige {
  background: rgba(255, 255, 255, 0.18);
  border: 1px solid rgba(255, 255, 255, 0.35);
  color: #fff;
}

.lp-link-button--light {
  color: var(--lp-primary);
  border: 1px solid rgba(255, 255, 255, 0.4);
}
</style>
