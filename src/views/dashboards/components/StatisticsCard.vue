<template>
  <component :is="item.to ? 'router-link' : 'div'" :to="item.to" class="dashboard-stat-card-wrapper" :class="{ 'dashboard-stat-card-wrapper--link': item.to }">
    <b-card no-body class="dashboard-stat-card" :class="`dashboard-stat-card--${colorVariant}`">
      <b-card-body>
        <b-row class="g-0">
          <b-col cols="6">
            <div class="stat-card-icon-wrap rounded" :class="`stat-card-icon-bg--${colorVariant}`">
              <Icon :icon="item.icon" class="stat-card-icon" />
            </div>
          </b-col>
          <b-col cols="6" class="d-flex flex-column justify-content-center ps-3">
            <p class="stat-card-title mb-1 text-truncate">{{ item.title }}</p>
            <h3 class="stat-card-value m-0">{{ displayString }}</h3>
          </b-col>
        </b-row>
      </b-card-body>
      <b-card-footer v-if="item.to || item.growth" class="stat-card-footer border-0 py-2">
        <div class="d-flex align-items-center justify-content-between">
          <div v-if="item.growth">
            <span :class="item.growth > 0 ? 'text-success' : 'text-danger'" class="stat-card-growth">
              <i class="bx stat-card-growth-icon" :class="item.growth > 0 ? 'bxs-up-arrow' : 'bxs-down-arrow'"></i>
              {{ Math.abs(item.growth) }}%
            </span>
            <span class="text-muted ms-1 stat-card-meta">Last Month</span>
          </div>
          <span v-if="item.to" class="stat-card-link">View details →</span>
        </div>
      </b-card-footer>
    </b-card>
  </component>
</template>

<script setup lang="ts">
import type { PropType } from "vue";
import type { StatisticCardType } from "@/types";
import { Icon } from "@iconify/vue";
import { useCountUp } from "@/composables/useCountUp";
import { computed } from "vue";

const props = defineProps({
  item: {
    type: Object as PropType<StatisticCardType>,
    required: true
  },
  variant: {
    type: String as PropType<'primary' | 'success' | 'danger' | 'warning' | 'info' | 'purple' | 'teal' | 'pink' | 'orange'>,
    default: 'primary'
  }
});

const target = () => Number(props.item.statistic) || 0;
const decimals = computed(() => (Number.isInteger(target()) ? 0 : 2));
const { displayValue } = useCountUp(target, { duration: 1200, from: 0 });

const displayString = computed(() => {
  const n = displayValue.value;
  const fix = decimals.value > 0 ? n.toFixed(decimals.value) : Math.round(n).toString();
  return (props.item.prefix ?? "") + fix + (props.item.suffix ?? "");
});

// Cycle through colors based on item index or use provided variant
const colorVariants = ['purple', 'orange', 'gold', 'primary', 'green', 'purple', 'orange', 'gold'];
const colorVariant = computed(() => {
  if (props.variant !== 'primary') return props.variant;
  // Generate color based on title hash for consistent colors
  const hash = props.item.title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colorVariants[hash % colorVariants.length];
});
</script>

<style scoped>
/* Whole card links to details when item.to is set */
.dashboard-stat-card-wrapper {
  display: block;
  text-decoration: none;
  color: inherit;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.dashboard-stat-card-wrapper--link:hover .dashboard-stat-card {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
}
.dashboard-stat-card-wrapper--link {
  cursor: pointer;
}

/* Dashboard stat card base styles */
.dashboard-stat-card {
  border: 1px solid #eee;
  transition: all 0.3s ease;
  border-radius: 12px;
}

/* Golden ratio scale: φ ≈ 1.618. Numbers big like dashboard (2rem) */
.dashboard-stat-card .stat-card-icon-wrap {
  width: 3rem;
  height: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: 10px;
  transition: all 0.3s ease;
}

/* Color variants for icon backgrounds */
.stat-card-icon-bg--teal { background: linear-gradient(135deg, #d0f8f7 0%, #a5efea 100%); }
.stat-card-icon-bg--teal .stat-card-icon { color: #14b8a6 !important; }

.stat-card-icon-bg--purple { background: linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%); }
.stat-card-icon-bg--purple .stat-card-icon { color: #8b5cf6 !important; }

.stat-card-icon-bg--pink { background: linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%); }
.stat-card-icon-bg--pink .stat-card-icon { color: #ec4899 !important; }

.stat-card-icon-bg--orange { background: linear-gradient(135deg, #fed7aa 0%, #fcd34d 100%); }
.stat-card-icon-bg--orange .stat-card-icon { color: #f59e0b !important; }

.stat-card-icon-bg--red { background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); }
.stat-card-icon-bg--red .stat-card-icon { color: #dc2626 !important; }

.stat-card-icon-bg--green { background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%); }
.stat-card-icon-bg--green .stat-card-icon { color: #10b981 !important; }

.stat-card-icon-bg--cyan { background: linear-gradient(135deg, #cffafe 0%, #a5f3fc 100%); }
.stat-card-icon-bg--cyan .stat-card-icon { color: #0891b2 !important; }

.stat-card-icon-bg--blue { background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); }
.stat-card-icon-bg--blue .stat-card-icon { color: #2563eb !important; }

.stat-card-icon-bg--gold { background: linear-gradient(135deg, #fff3d6 0%, #fde4a8 100%); }
.stat-card-icon-bg--gold .stat-card-icon { color: #9a5f12 !important; }

.stat-card-icon-bg--primary { background: linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%); }
.stat-card-icon-bg--primary .stat-card-icon { color: #5c308f !important; }

.dashboard-stat-card .stat-card-icon {
  width: 1.618rem;
  height: 1.618rem;
}
.dashboard-stat-card .stat-card-title {
  font-size: 0.875rem;
  line-height: 1.5;
  color: #666 !important;
  font-weight: 500;
}
.dashboard-stat-card .stat-card-value {
  font-size: 2rem;
  line-height: 1.2;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--bs-body-color) !important;
}
.dashboard-stat-card .stat-card-footer {
  background: var(--bs-tertiary-bg);
  font-size: 0.8125rem;
}
.dashboard-stat-card .stat-card-growth,
.dashboard-stat-card .stat-card-meta {
  font-size: 0.8125rem;
  line-height: 1.5;
}
.dashboard-stat-card .stat-card-growth-icon {
  font-size: 0.75rem;
  vertical-align: 0.05em;
}
.dashboard-stat-card .stat-card-link {
  font-size: 0.8125rem;
  font-weight: 600;
  line-height: 1.5;
  color: var(--bs-primary);
}
/* Positive trend in KKOO orange */
.dashboard-stat-card .text-success {
  color: #F7A829 !important;
}
[data-bs-theme="dark"] .dashboard-stat-card .stat-card-icon-wrap {
  background: linear-gradient(135deg, rgba(var(--bs-primary-rgb, 92, 48, 143), 0.32), rgba(var(--bs-primary-rgb, 92, 48, 143), 0.1));
}
[data-bs-theme="dark"] .dashboard-stat-card .stat-card-footer {
  background: rgba(var(--bs-primary-rgb, 92, 48, 143), 0.1);
}
</style>