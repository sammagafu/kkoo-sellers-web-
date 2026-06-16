import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { i18n } from './i18n'
import { wow } from './directives/wow'
import { initOfflineDB } from './utils/offlineStorage'

import {createBootstrap} from 'bootstrap-vue-next'

import 'simplebar'
import 'swiper/css'
import 'swiper/css/scrollbar'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import 'swiper/css/effect-fade'
import 'swiper/css/effect-flip'
import 'swiper/css/effect-creative'
import 'flatpickr/dist/flatpickr.css'
import 'nouislider/dist/nouislider.css'
import 'choices.js/src/styles/choices.scss'
import '@vueup/vue-quill/dist/vue-quill.snow.css'
import '@vueup/vue-quill/dist/vue-quill.bubble.css'

import 'bootstrap-vue-next/dist/bootstrap-vue-next.css'
import '@/assets/scss/app.scss'
import '@/assets/scss/icons.scss'

const app = createApp(App)

app.directive('wow', wow)
app.use(createPinia())
app.use(router)
app.use(i18n)
app.use(createBootstrap())

app.mount('#app')

const scheduleOfflineBootstrap = () => {
  const idleWindow = window as Window & {
    requestIdleCallback?: (callback: () => void) => number
  }

  if (idleWindow.requestIdleCallback) {
    idleWindow.requestIdleCallback(() => {
      void initOfflineDB()
    })
    return
  }

  window.setTimeout(() => {
    void initOfflineDB()
  }, 1000)
}

scheduleOfflineBootstrap()

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js')
  })
}
