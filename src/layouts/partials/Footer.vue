<template>
  <footer class="footer footer--playful" :style="spotlightStyle" @mousemove="onMove" @mouseleave="onLeave">
    <div class="footer__glow" aria-hidden="true" />
    <div class="container-fluid position-relative">
      <div class="footer__inner">
        <div class="footer__brand-block">
          <p class="footer__copyright mb-0">
            <span class="footer-brand">{{ new Date().getFullYear() }} © </span>
            <span class="footer-text">KKOO Admin</span>
            <span class="footer__version" :title="`Build ${buildLabel}`">v{{ displayVersion }}</span>
          </p>
          <p class="footer__meta mb-0">
            <span class="footer-mood" :title="moodHint">{{ moodLine }}</span>
            <span
              class="footer__api"
              :class="{
                'footer__api--ok': apiStatus === 'ok',
                'footer__api--error': apiStatus === 'error',
              }"
              :title="apiStatus === 'ok' ? 'Backend reachable' : apiStatus === 'error' ? 'Backend unreachable' : 'Checking…'"
            >
              <span class="footer__api-dot" aria-hidden="true" />
              {{ apiStatus === 'ok' ? 'API OK' : apiStatus === 'error' ? 'API unavailable' : 'Checking API…' }}
            </span>
          </p>
        </div>

        <div class="footer__links-block">
          <span class="footer__links-label">Get the apps</span>
          <div class="footer__app-links">
            <a
              :href="appLinks.marketplace.appStore"
              target="_blank"
              rel="noopener noreferrer"
              class="footer-app-link"
              title="App Store"
            >
              <Icon icon="logos:apple-app-store" class="footer-app-icon" aria-hidden="true" />
              App Store
            </a>
            <a
              :href="appLinks.marketplace.googlePlay"
              target="_blank"
              rel="noopener noreferrer"
              class="footer-app-link"
              title="Google Play"
            >
              <Icon icon="logos:google-play-icon" class="footer-app-icon" aria-hidden="true" />
              Google Play
            </a>
          </div>
          <p class="footer__credit mb-0">
            Powered by <strong class="footer-text footer-text--sm">kkooapps</strong>
            <span class="footer__sep" aria-hidden="true">·</span>
            Developed by
            <a href="https://neotelabs.com" target="_blank" rel="noopener noreferrer" class="footer-agency">Neotelabs Digital Agency</a>
          </p>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import { healthApi } from '@/api'
import { appLinks } from '@/config/app-links'
import { buildLabel, displayVersion } from '@/config/buildInfo'

const apiStatus = ref<'idle' | 'ok' | 'error'>('idle')
const spotlightStyle = ref<Record<string, string>>({ '--fx-x': '50%', '--fx-y': '50%' })

const moodLine = computed(() => {
  const h = new Date().getHours()
  if (h < 6) return 'Night ops'
  if (h < 12) return 'Morning dashboards'
  if (h < 17) return 'Afternoon dispatch'
  if (h < 21) return 'Evening riders'
  return 'Late-shift heroes'
})

const moodHint = computed(() => 'Mood changes with the hour — because admins are human too.')

function onMove(e: MouseEvent) {
  const el = e.currentTarget as HTMLElement
  const r = el.getBoundingClientRect()
  spotlightStyle.value = {
    '--fx-x': `${((e.clientX - r.left) / r.width) * 100}%`,
    '--fx-y': `${((e.clientY - r.top) / r.height) * 100}%`,
  }
}

function onLeave() {
  spotlightStyle.value = { '--fx-x': '50%', '--fx-y': '50%' }
}

onMounted(async () => {
  onLeave()
  try {
    const { data } = await healthApi.getHealth()
    apiStatus.value = data?.status === 'ok' ? 'ok' : 'error'
  } catch {
    apiStatus.value = 'error'
  }
})
</script>

<style scoped>
.footer--playful {
  position: relative;
  overflow: hidden;
}

.footer__glow {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(
    280px circle at var(--fx-x, 50%) var(--fx-y, 50%),
    rgba(var(--bs-primary-rgb), 0.12),
    transparent 65%
  );
}

.footer__inner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.85rem 1.5rem;
  padding: 0.65rem 0;
}

.footer__brand-block,
.footer__links-block {
  min-width: 0;
}

.footer__copyright {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem 0.5rem;
  font-size: 0.875rem;
}

.footer__version {
  display: inline-flex;
  align-items: center;
  padding: 0.12rem 0.45rem;
  border-radius: 999px;
  font-size: 0.68rem;
  font-weight: 700;
  font-family: var(--bs-font-monospace);
  letter-spacing: 0.02em;
  color: var(--bs-secondary-color);
  background: rgba(var(--bs-primary-rgb), 0.08);
  border: 1px solid rgba(var(--bs-primary-rgb), 0.14);
}

.footer__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem 0.75rem;
  margin-top: 0.2rem;
  font-size: 0.75rem;
  color: var(--bs-secondary-color);
}

.footer-mood {
  white-space: nowrap;
}

.footer__api {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  white-space: nowrap;
}

.footer__api-dot {
  width: 0.45rem;
  height: 0.45rem;
  border-radius: 50%;
  background: currentColor;
  opacity: 0.45;
}

.footer__api--ok {
  color: var(--bs-success);
}

.footer__api--ok .footer__api-dot {
  opacity: 1;
  animation: footer-dot-pulse 2.2s ease-in-out infinite;
}

.footer__api--error {
  color: var(--bs-danger);
}

.footer__api--error .footer__api-dot {
  opacity: 1;
}

@keyframes footer-dot-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.45;
  }
}

.footer__links-block {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.35rem;
}

.footer__links-label {
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--bs-secondary-color);
}

.footer__app-links {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.footer__credit {
  font-size: 0.75rem;
  color: var(--bs-secondary-color);
  line-height: 1.45;
}

.footer__sep {
  margin: 0 0.35rem;
  opacity: 0.55;
}

.footer-text--sm {
  font-size: 0.85em;
}

.footer-agency {
  color: inherit;
  text-decoration: none;
}

.footer-agency:hover {
  color: var(--bs-primary);
}

@media (min-width: 768px) {
  .footer__links-block {
    align-items: flex-end;
    text-align: right;
  }

  .footer__credit {
    max-width: 28rem;
  }
}

@media (max-width: 575px) {
  .footer__inner {
    flex-direction: column;
    align-items: stretch;
  }

  .footer__links-block {
    padding-top: 0.35rem;
    border-top: 1px solid rgba(var(--bs-body-color-rgb), 0.08);
  }

  .footer-mood {
    display: none;
  }
}
</style>
