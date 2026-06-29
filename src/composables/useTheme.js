import { computed, ref } from 'vue'

const STORAGE_KEY = 'saytu_theme'

export const themes = [
  {
    id: 'saytu-light',
    name: 'Saytu Clair',
    description: 'Interface claire et sobre',
    mode: 'light',
    swatches: ['#f4f7fb', '#2563eb', '#0f172a'],
  },
  {
    id: 'saytu-dark',
    name: 'Saytu Sombre',
    description: 'Confort visuel en faible lumiere',
    mode: 'dark',
    swatches: ['#020617', '#2563eb', '#e2e8f0'],
  },
  {
    id: 'blue-pro',
    name: 'Bleu Pro',
    description: 'Bleu plus vif pour le bureau',
    mode: 'light',
    swatches: ['#eaf4ff', '#0284c7', '#082f49'],
  },
  {
    id: 'cashier',
    name: 'Saytu Caisse',
    description: 'Contraste fort pour la vente',
    mode: 'dark',
    swatches: ['#07130f', '#10b981', '#f8fafc'],
  },
]

const themeId = ref(readInitialTheme())

function readInitialTheme() {
  if (typeof window === 'undefined') return 'saytu-light'

  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved === 'light') return 'saytu-light'
  if (saved === 'dark') return 'saytu-dark'
  if (themes.some(theme => theme.id === saved)) return saved

  return window.matchMedia('(prefers-color-scheme: dark)').matches ?
     'saytu-dark'
    : 'saytu-light'
}

function getTheme(value) {
  return themes.find(theme => theme.id === value) || themes[0]
}

function applyTheme(value = themeId.value) {
  const nextTheme = getTheme(value)
  themeId.value = nextTheme.id

  if (typeof document === 'undefined') return

  const root = document.documentElement
  root.dataset.theme = nextTheme.id
  root.classList.toggle('dark', nextTheme.mode === 'dark')
  root.style.colorScheme = nextTheme.mode

  localStorage.setItem(STORAGE_KEY, nextTheme.id)
}

function setTheme(value) {
  applyTheme(value)
}

function toggleThemeMode() {
  const nextTheme = getTheme(themeId.value).mode === 'dark' ? 'saytu-light' : 'saytu-dark'
  setTheme(nextTheme)
}

export function useTheme() {
  const selectedTheme = computed(() => getTheme(themeId.value))
  const isDark = computed(() => selectedTheme.value.mode === 'dark')

  return {
    themes,
    themeId,
    selectedTheme,
    isDark,
    applyTheme,
    setTheme,
    toggleThemeMode,
  }
}
