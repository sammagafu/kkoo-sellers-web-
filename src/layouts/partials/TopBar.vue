<template>
  <header class="topbar">
    <b-container fluid>
      <div class="navbar-header">
        <div class="d-flex align-items-center gap-2">
          <!-- Menu Toggle Button -->
          <div class="topbar-item">
            <button type="button" class="button-toggle-menu topbar-button">
              <Icon icon="solar:hamburger-menu-broken" class="fs-24 align-middle" @click="toggleLeftSideBar" />
            </button>
          </div>

          <router-link
            to="/"
            class="topbar-brand-logo d-flex align-items-center flex-shrink-0 text-decoration-none"
            aria-label="KKOO home"
            title="Home"
          >
            <img
              class="topbar-brand-logo-img"
              :src="topbarLogoSrc"
              alt=""
              width="32"
              height="32"
              decoding="async"
            />
            <span class="topbar-brand-title">KKOO</span>
          </router-link>

          <PortalBadge portal="admin" />

          <!-- CRM company (multi-business users) -->
          <CrmCompanySwitcher class="flex-shrink-1" />

          <!-- App Search-->
          <form class="app-search d-none d-md-block me-auto" @submit.prevent="onSearchSubmit">
            <div class="position-relative">
              <input
                v-model="searchQuery"
                type="search"
                class="form-control"
                :placeholder="$t('common.search') + '…'"
                autocomplete="off"
              />
              <Icon icon="solar:magnifer-broken" class="search-widget-icon" />
            </div>
          </form>
        </div>

        <div class="d-flex align-items-center gap-1">
          <!-- Seller: Display microsite link -->
          <a
            v-if="auth.isSeller && hasSellerStoreLink"
            :href="sellerStoreLinkUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="topbar-item topbar-button d-flex align-items-center gap-1 text-nowrap px-2"
            title="Open your public store in a new tab"
          >
            <Icon icon="solar:monitor-bold" class="fs-20 align-middle" />
            <span class="d-none d-lg-inline small">Display microsite</span>
          </a>

          <!-- Profile completion indicator -->
          <router-link
            v-if="profileCompletion.showInTopBar"
            :to="profileRouteTo"
            class="topbar-profile-progress d-flex align-items-center gap-2 text-decoration-none px-2 py-1 rounded"
            title="Complete your profile"
          >
            <span class="topbar-profile-progress-label small text-nowrap">Profile</span>
            <div class="topbar-profile-progress-bar-wrap" style="width: 64px;">
              <b-progress :value="profileCompletion.percentage" :max="100" class="topbar-profile-progress-bar" style="height: 6px;" />
            </div>
            <span class="topbar-profile-progress-pct small fw-semibold">{{ profileCompletion.percentage }}%</span>
          </router-link>

          <!-- KKOO web apps -->
          <DropDown class="topbar-item">
            <button
              type="button"
              class="topbar-button"
              id="page-header-apps-dropdown"
              data-bs-toggle="dropdown"
              aria-haspopup="true"
              aria-expanded="false"
              title="Switch KKOO app"
            >
              <Icon icon="solar:widget-5-broken" class="fs-24 align-middle" />
            </button>
            <div class="dropdown-menu dropdown-menu-end py-2" aria-labelledby="page-header-apps-dropdown">
              <span class="dropdown-header small text-muted">KKOO apps</span>
              <a
                v-for="item in kkooAppSwitcherItems"
                :key="item.key"
                :href="item.href"
                class="dropdown-item d-flex align-items-center gap-2"
              >
                <Icon :icon="item.icon" class="fs-18 text-muted" />
                <span>{{ item.label }}</span>
              </a>
            </div>
          </DropDown>

          <!-- Notification -->
          <DropDown class="topbar-item">
            <button type="button" class="topbar-button position-relative" id="page-header-notifications-dropdown"
              data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
              <Icon icon="solar:bell-bing-broken" class="fs-24 align-middle" />
              <span v-if="notificationUnreadCount > 0" class="position-absolute topbar-badge fs-10 translate-middle badge bg-danger rounded-pill">{{ notificationUnreadCount }}<span class="visually-hidden">unread</span></span>
            </button>
            <div class="dropdown-menu py-0 dropdown-lg dropdown-menu-end"
              aria-labelledby="page-header-notifications-dropdown">
              <div class="p-3 border-top-0 border-start-0 border-end-0 border-dashed border">
                <b-row class="align-items-center">
                  <div class="col">
                    <h6 class="m-0 fs-16 fw-semibold">Notifications</h6>
                  </div>
                  <div class="col-auto">
                    <button v-if="notificationUnreadCount > 0" type="button" class="btn btn-link btn-sm p-0 text-decoration-underline" :disabled="notificationMarkingAll" @click="notificationMarkAllRead">
                      Clear all
                    </button>
                  </div>
                </b-row>
              </div>
              <simplebar data-simplebar style="max-height: 280px;">
                <router-link v-for="n in notificationItems" :key="n.id" :to="notificationOrderLink(n)" class="dropdown-item py-3 border-bottom text-wrap text-dark text-decoration-none d-block" @click="notificationMarkRead(n)">
                  <div class="d-flex gap-2">
                    <span class="rounded-circle flex-shrink-0 d-flex align-items-center justify-content-center bg-soft-primary text-primary" style="width: 36px; height: 36px;">
                      <Icon icon="solar:bell-bing-broken" class="fs-18" />
                    </span>
                    <div class="flex-grow-1 min-w-0">
                      <p class="mb-0 fw-semibold text-wrap">{{ n.title || 'Notification' }}</p>
                      <p v-if="n.message" class="mb-0 small text-muted text-wrap">{{ n.message }}</p>
                      <small class="text-muted">{{ notificationFormatDate(n.created_at) }}</small>
                    </div>
                  </div>
                </router-link>
                <div v-if="!notificationLoading && !notificationItems.length" class="text-center py-4 text-muted small">
                  No notifications
                </div>
                <div v-if="notificationLoading" class="text-center py-3">
                  <b-spinner small />
                </div>
              </simplebar>
              <div class="text-center py-3">
                <router-link :to="{ name: 'account.notifications' }" class="btn btn-primary btn-sm">View all</router-link>
              </div>
            </div>
          </DropDown>

          <!-- User -->
          <DropDown class="topbar-item">
            <a type="button" class="topbar-button topbar-user-trigger" id="page-header-user-dropdown" data-bs-toggle="dropdown"
              aria-haspopup="true" aria-expanded="false">
              <span class="d-flex align-items-center gap-2">
                <span class="topbar-user-avatar flex-shrink-0">
                  <img
                    v-if="topbarAvatarUrl"
                    class="rounded-circle object-fit-cover"
                    width="32"
                    height="32"
                    :src="topbarAvatarUrl"
                    alt=""
                  />
                  <span
                    v-else
                    class="topbar-user-avatar-placeholder rounded-circle d-inline-flex align-items-center justify-content-center"
                    aria-hidden="true"
                  >
                    <Icon icon="solar:user-circle-bold-duotone" class="fs-24 text-muted" />
                  </span>
                </span>
                <span v-if="topbarUserShortName" class="d-none d-xl-inline small text-truncate topbar-user-name">
                  {{ topbarUserShortName }}
                </span>
              </span>
            </a>
            <div class="dropdown-menu dropdown-menu-end">
              <div class="dropdown-header d-flex align-items-center gap-2 py-2">
                <span class="topbar-user-avatar flex-shrink-0">
                  <img
                    v-if="topbarAvatarUrl"
                    class="rounded-circle object-fit-cover"
                    width="40"
                    height="40"
                    :src="topbarAvatarUrl"
                    alt=""
                  />
                  <span
                    v-else
                    class="topbar-user-avatar-placeholder topbar-user-avatar-placeholder--lg rounded-circle d-inline-flex align-items-center justify-content-center"
                    aria-hidden="true"
                  >
                    <Icon icon="solar:user-circle-bold-duotone" class="fs-32 text-muted" />
                  </span>
                </span>
                <span class="min-w-0 fw-semibold text-truncate">{{ userWelcomeText }}</span>
              </div>

              <router-link class="dropdown-item" :to="{ name: item.route?.name }"
                v-for="(item, idx) in profileMenuItems" :key="idx">
                <i :class="`bx ${item.icon} text-muted fs-18 align-middle me-1`"></i><span class="align-middle">{{
                  item.label }}</span>
              </router-link>

              <div class="dropdown-divider my-1"></div>

              <span class="dropdown-header small text-muted">Language</span>
              <button
                v-for="loc in supportedLocales"
                :key="loc.code"
                type="button"
                class="dropdown-item small"
                :class="{ active: locale === loc.code }"
                @click="setLocale(loc.code)"
              >
                {{ loc.name }}
              </button>

              <div class="dropdown-divider my-1"></div>

              <button type="button" class="dropdown-item" @click="toggleTheme">
                <Icon
                  :icon="useLayout.layout.theme === 'dark' ? 'solar:sun-2-broken' : 'solar:moon-broken'"
                  class="fs-18 align-middle me-1 text-muted"
                />
                <span class="align-middle">{{ useLayout.layout.theme === 'dark' ? 'Light mode' : 'Dark mode' }}</span>
              </button>

              <div class="dropdown-divider my-1"></div>

              <button type="button" class="dropdown-item text-danger" @click="onLogout">
                <i class="bx bx-log-out fs-18 align-middle me-1"></i><span class="align-middle">Logout</span>
              </button>
            </div>
          </DropDown>
        </div>
      </div>
    </b-container>
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter, type RouteLocationRaw } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { Icon } from "@iconify/vue";
import simplebar from 'simplebar-vue';

import { useLayoutStore } from '@/stores/layout';
import { useAuthStore } from '@/stores/auth';
import { useProfileCompletion } from '@/composables/useProfileCompletion';
import { useSellerStoreLink } from '@/composables/useSellerStoreLink';
import { toggleDocumentAttribute } from "@/helpers";
import { profileMenuItems } from "@/layouts/partials/data";
import { notificationsApi } from '@/api';
import { ROLES } from '@/acl';
import { supportedLocales, setLocale as setLocaleStorage, type LocaleCode } from '@/i18n';

const { locale } = useI18n();
function setLocale(code: LocaleCode) {
  setLocaleStorage(code);
}

import { kkooAppSwitcherItems } from '@/config/app-portal-links'
import DropDown from "@/components/DropDown.vue";
import PortalBadge from '@/components/PortalBadge.vue';
import CrmCompanySwitcher from '@/components/crm/CrmCompanySwitcher.vue';
import { resolveAssetUrl } from '@/utils/assetUrl';
import logoLight from '@/assets/images/logo-mark-light.svg';
import logoDark from '@/assets/images/logo-mark-dark.svg';

const router = useRouter();
const searchQuery = ref('');

function onSearchSubmit() {
  const q = searchQuery.value?.trim();
  if (!q) return;
  const auth = useAuthStore();
  const isAdmin = auth.role === ROLES.ADMIN || auth.role === ROLES.STAFF;
  if (isAdmin) {
    router.push({ name: 'admin.catalog.products', query: { search: q } });
  } else {
    router.push({ name: 'seller.products', query: { search: q } });
  }
}

const useLayout = useLayoutStore();
const auth = useAuthStore();

/** KKOO mark: light SVG on light topbar, dark variant when app theme is dark (readable on topbar bg). */
const topbarLogoSrc = computed(() => (useLayout.layout.theme === 'dark' ? logoDark : logoLight));
const profileCompletion = useProfileCompletion();
const { storeLink: sellerStoreLinkUrl, hasStoreLink: hasSellerStoreLink } = useSellerStoreLink();
/** Unwrap for router-link :to (template expects RouteLocationRaw, not ComputedRef). */
const profileRouteTo = computed<RouteLocationRaw>(() => (profileCompletion.profileRoute as { value: RouteLocationRaw }).value);

const notificationItems = ref<{ id: number; title?: string; message?: string; created_at?: string; read_at?: string | null; data?: Record<string, unknown> }[]>([]);
const notificationUnreadCount = ref(0);
const notificationLoading = ref(false);
const notificationMarkingAll = ref(false);

function notificationFormatDate(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function notificationOrderLink(n: { data?: Record<string, unknown> }) {
  const rawId = n.data?.order_id;
  const id = typeof rawId === 'string' || typeof rawId === 'number' ? rawId : undefined;
  if (id !== undefined && auth.isSeller) return { name: 'seller.orders.detail', params: { id } };
  if (id !== undefined && (auth.role === ROLES.ADMIN || auth.role === ROLES.STAFF)) return { name: 'admin.orders.detail', params: { id } };
  return { name: 'account.notifications' };
}

function notificationMarkRead(n: { id: number; read_at?: string | null }) {
  if (n.read_at) return;
  notificationsApi.markRead(n.id).then(() => {
    n.read_at = new Date().toISOString();
    notificationUnreadCount.value = Math.max(0, notificationUnreadCount.value - 1);
  }).catch(() => {});
}

function notificationMarkAllRead() {
  notificationMarkingAll.value = true;
  notificationsApi.markAllRead().then(() => {
    notificationItems.value.forEach((n) => { n.read_at = n.read_at || new Date().toISOString(); });
    notificationUnreadCount.value = 0;
  }).catch(() => {}).finally(() => { notificationMarkingAll.value = false; });
}

function loadNotifications() {
  notificationLoading.value = true;
  Promise.all([
    notificationsApi.list({ unread_only: true }).catch(() => ({ data: [] })),
    notificationsApi.getUnreadCount().catch(() => ({ data: { unread_count: 0 } })),
  ]).then(([listRes, countRes]) => {
    const raw = listRes.data;
    const list = Array.isArray(raw) ? raw : (raw as { results?: unknown[] })?.results ?? [];
    notificationItems.value = (list as typeof notificationItems.value) || [];
    notificationUnreadCount.value = (countRes.data?.unread_count ?? 0) as number;
  }).finally(() => { notificationLoading.value = false; });
}

const topbarAvatarUrl = computed(() => {
  const u = auth.user as { avatar_url?: string; avatar?: string } | null;
  return resolveAssetUrl(u?.avatar_url ?? u?.avatar) ?? '';
});

const topbarUserShortName = computed(() => {
  const u = auth.user;
  if (!u) return '';
  const first = (u as { first_name?: string }).first_name;
  const last = (u as { last_name?: string }).last_name;
  const name = [first, last].filter(Boolean).join(' ');
  if (name) return name;
  return (u as { phone_number?: string }).phone_number ?? '';
});

const userWelcomeText = computed(() => {
  const short = topbarUserShortName.value;
  if (short) return `Welcome, ${short}`;
  return 'Account';
});

const toggleTheme = () => {
  const next = useLayout.layout.theme === 'dark' ? 'light' : 'dark';
  useLayout.setTheme(next);
};

const onLogout = () => {
  auth.logout();
};

const toggleLeftSideBar = () => {
  if (useLayout.layout.leftSideBarSize === 'default') {
    return useLayout.setLeftSideBarSize('condensed');
  }
  if (useLayout.layout.leftSideBarSize === 'condensed') {
    return useLayout.setLeftSideBarSize('default');
  }
  toggleDocumentAttribute('class', 'sidebar-enable');
  showBackdrop();
};

const showBackdrop = () => {
  let backdrop = document.createElement('div') as HTMLDivElement;
  if (backdrop) {
    backdrop.classList.add('offcanvas-backdrop', 'fade', 'show');
    document.body.appendChild(backdrop);
    document.body.style.overflow = 'hidden';
    if (window.innerWidth > 1040) {
      document.body.style.paddingRight = '15px';
    }

    backdrop.addEventListener('click', function (e) {
      toggleDocumentAttribute('class', '');
      document.body.removeChild(backdrop);
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    });
  }
};

onMounted(() => {
  useLayout.init();
  loadNotifications();
});
</script>

<style scoped>
.topbar-profile-progress {
  color: var(--bs-topbar-item-color, var(--bs-body-color));
}
.topbar-profile-progress:hover {
  color: var(--bs-primary);
  background-color: rgba(var(--bs-primary-rgb, 92, 48, 143), 0.1);
}
.topbar-profile-progress-bar-wrap :deep(.progress) {
  background-color: rgba(255, 255, 255, 0.2);
}
.topbar-profile-progress-bar-wrap :deep(.progress-bar) {
  background-color: var(--bs-primary);
}
html[data-bs-theme="dark"] .topbar-profile-progress-bar-wrap :deep(.progress) {
  background-color: rgba(255, 255, 255, 0.15);
}
html[data-bs-theme="dark"] .topbar-profile-progress-bar-wrap :deep(.progress-bar) {
  background-color: var(--bs-secondary);
}
.topbar-user-trigger {
  border-radius: 999px;
  padding-left: 0.35rem;
  padding-right: 0.5rem;
}
.topbar-user-name {
  max-width: 8rem;
  color: var(--bs-topbar-item-color, var(--bs-body-color));
}
.topbar-user-avatar img,
.topbar-user-avatar-placeholder {
  width: 32px;
  height: 32px;
}
.topbar-user-avatar-placeholder {
  background: rgba(var(--bs-primary-rgb, 92, 48, 143), 0.12);
}
.topbar-user-avatar-placeholder--lg {
  width: 40px;
  height: 40px;
}
</style>

<style>
.topbar-brand-logo-img {
  height: 32px;
  width: 32px;
  object-fit: contain;
  display: block;
}
</style>
