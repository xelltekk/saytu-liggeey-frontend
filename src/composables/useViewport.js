import { computed, onMounted, onUnmounted, ref } from 'vue'

const width = ref(typeof window !== 'undefined' ? window.innerWidth : 1280)
const height = ref(typeof window !== 'undefined' ? window.innerHeight : 800)
const isTouch = ref(false)
let listeners = 0

function refreshViewport() {
  if (typeof window === 'undefined') return
  width.value = window.innerWidth
  height.value = window.innerHeight
  isTouch.value = window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0
}

export function useViewport() {
  onMounted(() => {
    listeners += 1
    refreshViewport()
    if (listeners === 1) {
      window.addEventListener('resize', refreshViewport, { passive: true })
      window.addEventListener('orientationchange', refreshViewport, { passive: true })
    }
  })

  onUnmounted(() => {
    listeners = Math.max(listeners - 1, 0)
    if (listeners === 0 && typeof window !== 'undefined') {
      window.removeEventListener('resize', refreshViewport)
      window.removeEventListener('orientationchange', refreshViewport)
    }
  })

  const isMobile = computed(() => width.value < 640)
  const isTablet = computed(() => width.value >= 640 && width.value < 1024)
  const isDesktop = computed(() => width.value >= 1024)
  const deviceType = computed(() => {
    if (isMobile.value) return 'mobile'
    if (isTablet.value) return 'tablet'
    return 'desktop'
  })

  const viewportClass = computed(() => ({
    'device-mobile': isMobile.value,
    'device-tablet': isTablet.value,
    'device-desktop': isDesktop.value,
    'device-touch': isTouch.value,
  }))

  return {
    width,
    height,
    isTouch,
    isMobile,
    isTablet,
    isDesktop,
    deviceType,
    viewportClass,
    refreshViewport,
  }
}
