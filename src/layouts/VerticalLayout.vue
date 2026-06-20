<template>
  <div class="wrapper">
    <a href="#main-content" class="skip-link">Skip to main content</a>
    <TopBar />
    <LeftSideBar />
    <main id="main-content" class="page-content" role="main">
      <b-container fluid>
        <b-alert
          v-if="showSellerFinalizeWarning"
          variant="warning"
          dismissible
          show
          class="mb-3"
          @dismissed="markSellerWarningShown"
        >
          <p class="mb-2 mb-md-0 me-md-3 d-md-inline"><strong>Complete registration</strong> — verify your profile to unlock seller tools.</p>
          <router-link :to="{ name: 'seller.profile' }" class="alert-link fw-semibold">Finalize registration →</router-link>
        </b-alert>
        <b-alert
          v-if="profileCompletion.showBanner && !showSellerFinalizeWarning"
          variant="info"
          dismissible
          show
          class="mb-3"
          @dismissed="profileCompletion.dismiss()"
        >
          <div class="d-flex flex-wrap align-items-center gap-2 gap-md-3">
            <span class="me-md-2"><strong>Profile {{ profileCompletion.percentage }}% complete.</strong></span>
            <div class="d-flex align-items-center gap-2 flex-grow-1 flex-md-grow-0">
              <b-progress :value="profileCompletion.percentage" :max="100" class="flex-grow-1" style="min-width: 80px; max-width: 120px;" />
              <router-link :to="profileUpdateTo" class="alert-link fw-semibold">Update profile →</router-link>
            </div>
          </div>
        </b-alert>
        <AdminToolbar v-if="isAdminPanel" />
        <slot />
      </b-container>
      <Footer />
      <RightSideBar />
    </main>
  </div>
</template>

<style scoped>
.skip-link {
  position: absolute;
  top: -100%;
  left: 0.5rem;
  z-index: 9999;
  padding: 0.5rem 1rem;
  background: var(--bs-primary);
  color: white;
  text-decoration: none;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  transition: top 0.2s;
}
.skip-link:focus {
  top: 0.5rem;
  outline: 2px solid white;
  outline-offset: 2px;
}
</style>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import type { RouteLocationRaw } from 'vue-router'
import TopBar from "@/layouts/partials/TopBar.vue";
import Footer from "@/layouts/partials/Footer.vue";
import LeftSideBar from "@/layouts/partials/LeftSideBar.vue";
import RightSideBar from "@/layouts/partials/RightSideBar.vue";
import AdminToolbar from '@/layouts/partials/AdminToolbar.vue'
import { useAuthStore } from '@/stores/auth'
import { useProfileCompletion } from '@/composables/useProfileCompletion'

const route = useRoute()
const auth = useAuthStore()
const profileCompletion = useProfileCompletion()
const isAdminPanel = computed(() => route.path.startsWith('/admin'))
const profileUpdateTo = computed<RouteLocationRaw>(() => {
  const r = profileCompletion.profileRoute
  return (typeof r === 'object' && r && 'value' in r ? (r as { value: RouteLocationRaw }).value : r) as RouteLocationRaw
})
const SELLER_WARNING_KEY = 'kkoo_seller_finalize_warning_shown'

const showSellerFinalizeWarning = computed(() => {
  if (!auth.isSeller || auth.isSellerVerified) return false
  try {
    return !sessionStorage.getItem(SELLER_WARNING_KEY)
  } catch {
    return true
  }
})

function markSellerWarningShown() {
  try {
    sessionStorage.setItem(SELLER_WARNING_KEY, '1')
  } catch {}
}
</script>