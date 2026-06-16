import type { Directive } from 'vue'

const observerOptions: IntersectionObserverInit = {
  root: null,
  rootMargin: '0px 0px -40px 0px',
  threshold: 0.1,
}

let observer: IntersectionObserver | null = null

function getObserver(): IntersectionObserver {
  if (!observer) {
    observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('wow-visible')
        }
      })
    }, observerOptions)
  }
  return observer
}

/**
 * Directive: v-wow
 * Add to any element to fade it in when it scrolls into view.
 * Element gets classes: wow wow-fade-in; when visible: wow-visible
 */
export const wow: Directive = {
  mounted(el: HTMLElement) {
    el.classList.add('wow', 'wow-fade-in')
    getObserver().observe(el)
  },
  unmounted(el: HTMLElement) {
    getObserver().unobserve(el)
  },
}
