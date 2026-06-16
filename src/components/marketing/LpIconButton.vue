<template>
  <b-button
    :variant="variant"
    :class="['lp-icon-button', { 'lp-icon-button--slim': slim }]"
    v-bind="buttonAttrs"
  >
    <span class="lp-icon-button__label">{{ label }}</span>
    <span v-if="icon" class="lp-icon-button__orb">
      <Icon :icon="icon" />
    </span>
  </b-button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@iconify/vue'

const props = defineProps({
  label: { type: String, required: true },
  icon: { type: String, default: '' },
  variant: { type: String, default: 'primary' },
  to: { type: [Object, String], default: null },
  href: { type: String, default: '' },
  slim: { type: Boolean, default: false },
})

const emits = defineEmits(['click'])

const buttonAttrs = computed(() => {
  if (props.to) return { to: props.to }
  if (props.href) return { href: props.href, target: '_self' }
  return {}
})
</script>

<style scoped>
.lp-icon-button {
  border-radius: 999px;
  padding: 0.75rem 1.6rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.65rem;
  font-weight: 700;
  text-transform: none;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
  border: 0;
}

.lp-icon-button--slim {
  padding: 0.55rem 1.2rem;
  font-size: 0.9rem;
}

.lp-icon-button__orb {
  width: 2.1rem;
  height: 2.1rem;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
}

.lp-icon-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.2);
}
</style>
