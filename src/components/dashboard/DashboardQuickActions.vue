<template>
  <section class="qa-panel" :aria-labelledby="panelTitleId">
    <div class="qa-panel__aurora" aria-hidden="true" />
    <header class="qa-panel__head">
      <div class="qa-panel__head-copy">
        <span class="qa-panel__badge" aria-hidden="true">
          <Icon icon="solar:bolt-circle-bold-duotone" />
        </span>
        <div>
          <h2 :id="panelTitleId" class="qa-panel__title">{{ title }}</h2>
          <p class="qa-panel__subtitle">{{ subtitle }}</p>
        </div>
      </div>
      <span class="qa-panel__meta">{{ items.length }} shortcuts</span>
    </header>

    <div class="qa-panel__grid">
      <template v-for="(item, index) in items" :key="item.key ?? item.label">
        <router-link
          v-if="item.to"
          :to="item.to"
          class="qa-tile"
          :class="`qa-tile--${item.tone ?? 'primary'}`"
          :style="{ '--qa-i': index }"
        >
          <DashboardQuickActionsTile :item="item" />
        </router-link>
        <a
          v-else-if="item.href"
          :href="item.href"
          class="qa-tile"
          :class="`qa-tile--${item.tone ?? 'primary'}`"
          :style="{ '--qa-i': index }"
          target="_blank"
          rel="noopener noreferrer"
        >
          <DashboardQuickActionsTile :item="item" />
        </a>
      </template>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'
import { Icon } from '@iconify/vue'
import DashboardQuickActionsTile from './DashboardQuickActionsTile.vue'

export type QuickActionTone =
  | 'teal'
  | 'purple'
  | 'pink'
  | 'orange'
  | 'red'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'dark'
  | 'secondary'

export type QuickActionItem = {
  key?: string
  label: string
  icon: string
  tone?: QuickActionTone
  hint?: string
  to?: RouteLocationRaw
  href?: string
}

const props = withDefaults(
  defineProps<{
    title?: string
    subtitle?: string
    panelId?: string
    items: QuickActionItem[]
  }>(),
  {
    title: 'Quick actions',
    subtitle: 'Jump to the area you need.',
    panelId: 'dashboard-quick-actions',
  },
)

const panelTitleId = `${props.panelId}-title`
</script>

<style scoped>
.qa-panel {
  position: relative;
  margin-top: 1.5rem;
  margin-bottom: 1.5rem;
  padding: 1.15rem 1.15rem 1.25rem;
  border-radius: 1.25rem;
  border: 1px solid color-mix(in srgb, var(--bs-primary) 14%, transparent);
  background:
    radial-gradient(120% 80% at 0% 0%, color-mix(in srgb, var(--bs-primary) 10%, transparent), transparent 55%),
    radial-gradient(90% 70% at 100% 0%, color-mix(in srgb, var(--bs-warning) 8%, transparent), transparent 50%),
    var(--bs-body-bg);
  box-shadow:
    0 18px 40px color-mix(in srgb, var(--bs-primary) 8%, transparent),
    inset 0 1px 0 color-mix(in srgb, #fff 55%, transparent);
  overflow: hidden;
}

.qa-panel__aurora {
  position: absolute;
  inset: 0 0 auto;
  height: 3px;
  background: linear-gradient(
    90deg,
    #14b8a6,
    #8b5cf6,
    #ec4899,
    #f59e0b,
    #5c308f
  );
  background-size: 200% 100%;
  animation: qa-aurora 8s linear infinite;
  opacity: 0.9;
}

@keyframes qa-aurora {
  to {
    background-position: 200% 0;
  }
}

.qa-panel__head {
  position: relative;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
  padding-top: 0.15rem;
}

.qa-panel__head-copy {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  min-width: 0;
}

.qa-panel__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.35rem;
  height: 2.35rem;
  border-radius: 0.85rem;
  flex-shrink: 0;
  color: var(--bs-primary);
  background: color-mix(in srgb, var(--bs-primary) 12%, var(--bs-body-bg));
  border: 1px solid color-mix(in srgb, var(--bs-primary) 18%, transparent);
  box-shadow: 0 8px 20px color-mix(in srgb, var(--bs-primary) 12%, transparent);
}

.qa-panel__badge :deep(svg) {
  width: 1.35rem;
  height: 1.35rem;
}

.qa-panel__title {
  margin: 0;
  font-size: 1rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--bs-emphasis-color);
}

.qa-panel__subtitle {
  margin: 0.2rem 0 0;
  font-size: 0.82rem;
  color: var(--bs-secondary-color);
  line-height: 1.45;
}

.qa-panel__meta {
  flex-shrink: 0;
  align-self: center;
  padding: 0.28rem 0.65rem;
  border-radius: 999px;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--bs-secondary-color);
  background: color-mix(in srgb, var(--bs-body-color) 5%, var(--bs-body-bg));
  border: 1px solid color-mix(in srgb, var(--bs-body-color) 8%, transparent);
}

.qa-panel__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(9.5rem, 1fr));
  gap: 0.75rem;
}

@media (min-width: 992px) {
  .qa-panel__grid {
    grid-template-columns: repeat(auto-fill, minmax(10.5rem, 1fr));
  }
}

.qa-tile {
  position: relative;
  display: flex;
  min-height: 6.75rem;
  padding: 0.95rem 0.85rem;
  border-radius: 1rem;
  text-decoration: none;
  color: inherit;
  background:
    linear-gradient(
      145deg,
      color-mix(in srgb, var(--qa-accent, var(--bs-primary)) 10%, var(--bs-body-bg)) 0%,
      var(--bs-body-bg) 58%
    );
  border: 1px solid color-mix(in srgb, var(--qa-accent, var(--bs-primary)) 16%, transparent);
  box-shadow:
    0 10px 24px color-mix(in srgb, var(--qa-accent, var(--bs-primary)) 10%, transparent),
    inset 0 1px 0 color-mix(in srgb, #fff 42%, transparent);
  overflow: hidden;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease;
  animation: qa-tile-in 0.45s ease both;
  animation-delay: calc(var(--qa-i, 0) * 35ms);
}

.qa-tile::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--qa-accent, var(--bs-primary)) 18%, transparent),
    transparent 58%
  );
  opacity: 0.55;
  transition: opacity 0.2s ease;
}

.qa-tile::after {
  content: '';
  position: absolute;
  top: -28%;
  right: -18%;
  width: 62%;
  height: 78%;
  background: radial-gradient(circle, color-mix(in srgb, var(--qa-accent, var(--bs-primary)) 24%, transparent), transparent 68%);
  pointer-events: none;
  opacity: 0.85;
}

.qa-tile:hover,
.qa-tile:focus-visible {
  transform: translateY(-3px);
  border-color: color-mix(in srgb, var(--qa-accent, var(--bs-primary)) 28%, transparent);
  box-shadow:
    0 16px 34px color-mix(in srgb, var(--qa-accent, var(--bs-primary)) 16%, transparent),
    0 0 0 1px color-mix(in srgb, var(--qa-accent, var(--bs-primary)) 10%, transparent);
}

.qa-tile:hover::before,
.qa-tile:focus-visible::before {
  opacity: 0.95;
}

.qa-tile:hover::after,
.qa-tile:focus-visible::after {
  opacity: 1;
}

.qa-tile:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--qa-accent, var(--bs-primary)) 45%, transparent);
  outline-offset: 2px;
}

.qa-tile:hover :deep(.qa-tile__arrow),
.qa-tile:focus-visible :deep(.qa-tile__arrow) {
  opacity: 1;
  transform: translate(0, 0);
}

@keyframes qa-tile-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.qa-tile--teal { --qa-accent: #14b8a6; }
.qa-tile--purple { --qa-accent: #8b5cf6; }
.qa-tile--pink { --qa-accent: #ec4899; }
.qa-tile--orange { --qa-accent: #f59e0b; }
.qa-tile--red { --qa-accent: #dc2626; }
.qa-tile--primary { --qa-accent: var(--bs-primary); }
.qa-tile--success { --qa-accent: var(--bs-success); }
.qa-tile--warning { --qa-accent: var(--bs-warning); }
.qa-tile--danger { --qa-accent: var(--bs-danger); }
.qa-tile--info { --qa-accent: var(--bs-info); }
.qa-tile--dark { --qa-accent: #334155; }
.qa-tile--secondary { --qa-accent: var(--bs-secondary); }

[data-bs-theme='dark'] .qa-panel {
  box-shadow:
    0 18px 40px rgba(0, 0, 0, 0.28),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

[data-bs-theme='dark'] .qa-tile {
  background:
    linear-gradient(
      145deg,
      color-mix(in srgb, var(--qa-accent, var(--bs-primary)) 16%, var(--bs-secondary-bg)) 0%,
      var(--bs-secondary-bg) 58%
    );
  box-shadow:
    0 12px 28px rgba(0, 0, 0, 0.28),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

@media (prefers-reduced-motion: reduce) {
  .qa-panel__aurora,
  .qa-tile {
    animation: none;
  }

  .qa-tile {
    transition: none;
  }
}
</style>
