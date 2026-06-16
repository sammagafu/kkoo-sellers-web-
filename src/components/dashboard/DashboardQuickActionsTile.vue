<template>
  <div class="qa-tile__inner">
    <span class="qa-tile__icon" :class="`qa-tile__icon--${item.tone ?? 'primary'}`" aria-hidden="true">
      <Icon :icon="item.icon" />
    </span>
    <span class="qa-tile__copy">
      <span class="qa-tile__label">{{ item.label }}</span>
      <span v-if="item.hint" class="qa-tile__hint">{{ item.hint }}</span>
    </span>
    <Icon icon="solar:arrow-right-up-linear" class="qa-tile__arrow" aria-hidden="true" />
  </div>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import type { QuickActionItem } from './DashboardQuickActions.vue'

defineProps<{
  item: QuickActionItem
}>()
</script>

<style scoped>
.qa-tile__inner {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  width: 100%;
  height: 100%;
  text-align: center;
}

.qa-tile__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.95rem;
  height: 2.95rem;
  border-radius: 0.85rem;
  border: 1px solid transparent;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.45);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.qa-tile__icon :deep(svg) {
  width: 1.45rem;
  height: 1.45rem;
}

:global(.qa-tile:hover) .qa-tile__icon,
:global(.qa-tile:focus-visible) .qa-tile__icon {
  transform: scale(1.06);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.55),
    0 8px 18px color-mix(in srgb, var(--qa-accent, var(--bs-primary)) 24%, transparent);
}

.qa-tile__icon--teal {
  background: linear-gradient(135deg, #d0f8f7 0%, #a5efea 100%);
  color: #14b8a6;
  border-color: rgba(20, 184, 166, 0.22);
}
.qa-tile__icon--purple {
  background: linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%);
  color: #8b5cf6;
  border-color: rgba(139, 92, 246, 0.22);
}
.qa-tile__icon--pink {
  background: linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%);
  color: #ec4899;
  border-color: rgba(236, 72, 153, 0.22);
}
.qa-tile__icon--orange {
  background: linear-gradient(135deg, #fed7aa 0%, #fcd34d 100%);
  color: #f59e0b;
  border-color: rgba(245, 158, 11, 0.22);
}
.qa-tile__icon--red {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  color: #dc2626;
  border-color: rgba(220, 38, 38, 0.22);
}
.qa-tile__icon--primary {
  background: linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%);
  color: #5c308f;
  border-color: rgba(92, 48, 143, 0.22);
}
.qa-tile__icon--success {
  background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
  color: #10b981;
  border-color: rgba(16, 185, 129, 0.22);
}
.qa-tile__icon--warning {
  background: linear-gradient(135deg, #fff3d6 0%, #fde4a8 100%);
  color: #9a5f12;
  border-color: rgba(247, 168, 41, 0.28);
}
.qa-tile__icon--danger {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  color: #dc2626;
  border-color: rgba(220, 38, 38, 0.22);
}
.qa-tile__icon--info {
  background: linear-gradient(135deg, #cffafe 0%, #a5f3fc 100%);
  color: #0891b2;
  border-color: rgba(8, 145, 178, 0.22);
}
.qa-tile__icon--dark {
  background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%);
  color: #334155;
  border-color: rgba(51, 65, 85, 0.22);
}
.qa-tile__icon--secondary {
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  color: #64748b;
  border-color: rgba(100, 116, 139, 0.22);
}

.qa-tile__copy {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;
}

.qa-tile__label {
  font-size: 0.8rem;
  font-weight: 700;
  line-height: 1.35;
  color: var(--bs-emphasis-color);
}

.qa-tile__hint {
  font-size: 0.68rem;
  line-height: 1.3;
  color: var(--bs-secondary-color);
}

.qa-tile__arrow {
  position: absolute;
  top: 0.55rem;
  right: 0.55rem;
  width: 0.95rem;
  height: 0.95rem;
  opacity: 0;
  transform: translate(-4px, 4px);
  color: var(--qa-accent, var(--bs-primary));
  transition: opacity 0.2s ease, transform 0.2s ease;
}

[data-bs-theme='dark'] .qa-tile__icon {
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
}
[data-bs-theme='dark'] .qa-tile__icon--teal {
  background: linear-gradient(135deg, rgba(20, 184, 166, 0.34), rgba(20, 184, 166, 0.12));
  color: #5eead4;
}
[data-bs-theme='dark'] .qa-tile__icon--purple,
[data-bs-theme='dark'] .qa-tile__icon--primary {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.34), rgba(92, 48, 143, 0.14));
  color: #c4b5fd;
}
[data-bs-theme='dark'] .qa-tile__icon--pink {
  background: linear-gradient(135deg, rgba(236, 72, 153, 0.34), rgba(236, 72, 153, 0.12));
  color: #f9a8d4;
}
[data-bs-theme='dark'] .qa-tile__icon--orange,
[data-bs-theme='dark'] .qa-tile__icon--warning {
  background: linear-gradient(135deg, rgba(247, 168, 41, 0.34), rgba(247, 168, 41, 0.12));
  color: #fcd34d;
}
[data-bs-theme='dark'] .qa-tile__icon--red,
[data-bs-theme='dark'] .qa-tile__icon--danger {
  background: linear-gradient(135deg, rgba(220, 38, 38, 0.34), rgba(220, 38, 38, 0.12));
  color: #fca5a5;
}
[data-bs-theme='dark'] .qa-tile__icon--success {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.34), rgba(16, 185, 129, 0.12));
  color: #6ee7b7;
}
[data-bs-theme='dark'] .qa-tile__icon--info {
  background: linear-gradient(135deg, rgba(8, 145, 178, 0.34), rgba(8, 145, 178, 0.12));
  color: #67e8f9;
}
[data-bs-theme='dark'] .qa-tile__icon--dark,
[data-bs-theme='dark'] .qa-tile__icon--secondary {
  background: linear-gradient(135deg, rgba(148, 163, 184, 0.28), rgba(51, 65, 85, 0.18));
  color: #e2e8f0;
}
</style>
