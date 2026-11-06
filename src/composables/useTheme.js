import { computed, ref } from 'vue'

const STORAGE_KEY = 'saytu_theme'
const FIXED_THEME_ID = 'login-aqua'

export const themes = [
  {
    id: 'login-aqua',
    name: 'Saytu Clair',
    description: 'Surfaces claires, textes contrastés et actions bleues',
    mode: 'light',
    swatches: ['#163c58', '#2563eb', '#f1f5f9'],
  },
]

const themeId = ref(readInitialTheme())

function readInitialTheme() {
  return FIXED_THEME_ID
}

function getTheme(value) {
  return themes.find(theme => theme.id === value) || themes[0]
}

function applyTheme() {
  const nextTheme = getTheme(FIXED_THEME_ID)
  themeId.value = nextTheme.id

  if (typeof document === 'undefined') return

  const root = document.documentElement
  root.dataset.theme = nextTheme.id
  root.classList.remove('dark')
  root.style.colorScheme = 'light'

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, nextTheme.id)
  }
}

export function useTheme() {
  const selectedTheme = computed(() => getTheme(themeId.value))

  return {
    themes,
    themeId,
    selectedTheme,
    applyTheme,
  }
}
