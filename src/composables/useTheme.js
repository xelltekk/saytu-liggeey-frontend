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
  {
    id: 'login-aqua',
    name: 'Connexion Aqua',
    description: 'Bleu et cyan inspires du login',
    mode: 'light',
    swatches: ['#14384a', '#0ea5e9', '#22d3ee'],
  },
  {
    id: 'ocean-business',
    name: 'Ocean Business',
    description: 'Bleu profond et turquoise calme',
    mode: 'light',
    swatches: ['#e0f7ff', '#0284c7', '#0f3a4a'],
  },
  {
    id: 'emerald-finance',
    name: 'Vert Finance',
    description: 'Ambiance claire pour tresorerie',
    mode: 'light',
    swatches: ['#ecfdf5', '#10b981', '#064e3b'],
  },
  {
    id: 'amber-premium',
    name: 'Ambre Premium',
    description: 'Tons chauds et professionnels',
    mode: 'light',
    swatches: ['#fff7ed', '#f97316', '#7c2d12'],
  },
  {
    id: 'violet-direction',
    name: 'Violet Direction',
    description: 'Violet moderne pour pilotage',
    mode: 'light',
    swatches: ['#f5f3ff', '#7c3aed', '#2e1065'],
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
