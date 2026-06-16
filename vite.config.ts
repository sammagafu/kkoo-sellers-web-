import { readFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import { BootstrapVueNextResolver } from 'unplugin-vue-components/resolvers'

const pkgPath = fileURLToPath(new URL('./package.json', import.meta.url))
const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8')) as { version: string }

function getGitSha(): string {
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim()
  } catch {
    return 'unknown'
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  base: '/',
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __GIT_SHA__: JSON.stringify(getGitSha()),
  },
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 700,
    cssCodeSplit: true,
    reportCompressedSize: true,
    assetsInlineLimit: 2048,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return
          }

          if (
            id.includes('/vue/') ||
            id.includes('/vue-router/') ||
            id.includes('/pinia/') ||
            id.includes('/vue-i18n/')
          ) {
            return 'framework'
          }

          if (
            id.includes('/bootstrap/') ||
            id.includes('/bootstrap-vue-next/') ||
            id.includes('/@popperjs/')
          ) {
            return 'ui-bootstrap'
          }

          if (id.includes('/@fullcalendar/')) {
            return 'calendar'
          }

          if (id.includes('/apexcharts/') || id.includes('/vue3-apexcharts/')) {
            return 'charts'
          }

          if (
            id.includes('/@vueup/vue-quill/') ||
            id.includes('/choices.js/') ||
            id.includes('/flatpickr/') ||
            id.includes('/inputmask/') ||
            id.includes('/@vuelidate/') ||
            id.includes('/yup/') ||
            id.includes('/dropzone/')
          ) {
            return 'forms-editor'
          }

          if (
            id.includes('/gridjs/') ||
            id.includes('/vue3-google-map/') ||
            id.includes('/swiper/') ||
            id.includes('/simplebar/')
          ) {
            return 'ux-extras'
          }

          if (id.includes('/jsvectormap/')) {
            return 'maps'
          }

          if (id.includes('/dayjs/') || id.includes('/moment/')) {
            return 'date-utils'
          }

          return 'vendor'
        },
      },
    },
    minify: 'esbuild',
  },
  css: {
    preprocessorOptions: {
      scss: {
        quietDeps: true,
      },
    },
  },
  plugins: [
    vue(),
    Components({
      resolvers: [BootstrapVueNextResolver()],
    }),
  ],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      // Dev only — production uses Docker nginx (docker/nginx.conf.template) + host nginx
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/media': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
