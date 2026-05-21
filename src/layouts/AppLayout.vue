<template>
  <div class="min-h-screen bg-[#f4f7fb] text-slate-700 lg:flex">
    <div
      v-if="mobileSidebarOpen"
      class="fixed inset-0 z-30 bg-slate-950/50 backdrop-blur-sm lg:hidden"
      @click="mobileSidebarOpen = false"
    ></div>
    
    <!-- ================= SIDEBAR ================= -->
    <aside
      :class="[
        'fixed inset-y-0 left-0 z-40 flex h-screen w-72 flex-col bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white shadow-2xl transition-all duration-300 lg:translate-x-0',
        mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full',
        sidebarOpen ? 'lg:w-72' : 'lg:w-24'
      ]"
    >
      <!-- Logo -->
      <div class="h-20 flex items-center px-5 border-b border-slate-700">
        <div
          class="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg"
        >
          <span class="text-xl font-black">SL</span>
        </div>

        <transition name="fade">
          <div v-if="sidebarOpen" class="ml-4">
            <h1 class="font-bold text-lg tracking-wide">Saytu Liggéey 2.0</h1>
            <p class="text-xs text-slate-400">Business Suite</p>
          </div>
        </transition>
      </div>

      <!-- Menu -->
      <nav class="flex-1 px-4 py-5 overflow-y-auto space-y-2">
        <router-link
          v-if="!sidebarOpen"
          v-for="item in menuItems"
          :key="item.to"
          :to="item.to"
          @click="mobileSidebarOpen = false"
          class="group relative flex items-center rounded-2xl px-4 py-3 transition-all duration-300 hover:bg-white/10 hover:translate-x-1"
          :class="isActive(item.to)
            ? 'bg-white/10 backdrop-blur-lg border border-white/10 shadow-lg'
            : ''"
        >
          <!-- Active bar -->
          <div
            v-if="isActive(item.to)"
            class="absolute left-0 top-2 bottom-2 w-1 rounded-full bg-cyan-400"
          ></div>

          <!-- Icon -->
          <component
            :is="item.icon"
            class="w-5 h-5 shrink-0"
          />

          <!-- Label -->
          <transition name="fade">
            <span
              v-if="sidebarOpen"
              class="ml-4 font-medium text-sm flex-1"
            >
              {{ item.label }}
            </span>
          </transition>

          <!-- Badge -->
          <span
            v-if="getBadgeCount(item.to) > 0 && sidebarOpen"
            class="px-2 py-0.5 text-[10px] font-bold rounded-full"
            :class="getBadgeColor(item.to)"
          >
            {{ getBadgeCount(item.to) > 99 ? '99+' : getBadgeCount(item.to) }}
          </span>
        </router-link>

        <router-link
          v-if="sidebarOpen && dashboardMenuItem"
          :to="dashboardMenuItem.to"
          @click="mobileSidebarOpen = false"
          class="group relative flex items-center rounded-2xl px-4 py-3 transition-all duration-300 hover:bg-white/10 hover:translate-x-1"
          :class="isActive(dashboardMenuItem.to)
            ? 'bg-white/10 backdrop-blur-lg border border-white/10 shadow-lg'
            : ''"
        >
          <div
            v-if="isActive(dashboardMenuItem.to)"
            class="absolute left-0 top-2 bottom-2 w-1 rounded-full bg-cyan-400"
          ></div>
          <component :is="dashboardMenuItem.icon" class="h-5 w-5 shrink-0" />
          <span class="ml-4 flex-1 text-sm font-semibold">{{ dashboardMenuItem.label }}</span>
        </router-link>

        <div v-if="sidebarOpen" v-for="group in groupedMenuItems" :key="group.key" class="space-y-1">
          <button
            type="button"
            @click="toggleMenuGroup(group.key)"
            class="flex w-full items-center rounded-2xl px-4 py-3 text-left transition-all duration-300 hover:bg-white/10"
            :class="isGroupActive(group) ? 'bg-white/10 border border-white/10' : ''"
          >
            <component :is="group.icon" class="h-5 w-5 shrink-0" />
            <span class="ml-4 flex-1 text-sm font-semibold">{{ group.label }}</span>
            <span
              v-if="groupBadgeCount(group) > 0"
              class="mr-2 rounded-full px-2 py-0.5 text-[10px] font-bold"
              :class="groupBadgeColor(group)"
            >
              {{ groupBadgeCount(group) > 99 ? '99+' : groupBadgeCount(group) }}
            </span>
            <ChevronDown
              class="h-4 w-4 transition-transform"
              :class="openMenuGroups[group.key] ? 'rotate-180' : ''"
            />
          </button>

          <div v-show="openMenuGroups[group.key]" class="ml-3 space-y-1 border-l border-white/10 pl-3">
            <router-link
              v-for="item in group.items"
              :key="item.to"
              :to="item.to"
              @click="mobileSidebarOpen = false"
              class="group relative flex items-center rounded-xl px-3 py-2.5 transition-all duration-300 hover:bg-white/10"
              :class="isActive(item.to) ? 'bg-white/10 text-cyan-100' : 'text-slate-200'"
            >
              <div
                v-if="isActive(item.to)"
                class="absolute left-0 top-2 bottom-2 w-1 rounded-full bg-cyan-400"
              ></div>
              <component :is="item.icon" class="h-4 w-4 shrink-0" />
              <span class="ml-3 flex-1 text-sm font-medium">{{ item.label }}</span>
              <span
                v-if="getBadgeCount(item.to) > 0"
                class="rounded-full px-2 py-0.5 text-[10px] font-bold"
                :class="getBadgeColor(item.to)"
              >
                {{ getBadgeCount(item.to) > 99 ? '99+' : getBadgeCount(item.to) }}
              </span>
            </router-link>
          </div>
        </div>
      </nav>

      <!-- Bottom -->
      <div class="p-4 border-t border-slate-700">
        <div class="flex items-center">
          <div
            class="w-11 h-11 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center font-bold shadow-lg"
          >
            {{ userInitials }}
          </div>

          <transition name="fade">
            <div v-if="sidebarOpen" class="ml-3 overflow-hidden">
              <p class="font-semibold truncate text-sm">
                {{ auth.user?.name }}
              </p>

              <p class="text-xs text-slate-400 capitalize">
                {{ auth.user?.role }}
              </p>
            </div>
          </transition>
        </div>

      </div>
    </aside>

    <!-- ================= CONTENT ================= -->
    <div
      :class="[
        'flex min-h-screen min-w-0 flex-1 flex-col overflow-hidden transition-all duration-300',
        sidebarOpen ? 'lg:ml-72' : 'lg:ml-24'
      ]"
    >

      <!-- ================= HEADER ================= -->
      <header
        class="min-h-20 bg-white/80 backdrop-blur-xl border-b border-slate-200 px-4 py-3 sm:px-6 flex flex-col gap-3 shadow-sm md:flex-row md:items-center md:justify-between"
      >
        <!-- Left -->
        <div class="flex min-w-0 items-center gap-3 sm:gap-4">
          <!-- Toggle -->
          <button
            @click="toggleSidebar"
            class="w-11 h-11 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-slate-100 transition"
            title="Menu"
          >
            <PanelLeftClose v-if="sidebarOpen && !mobileSidebarOpen" class="w-5 h-5" />
            <PanelLeftOpen v-else class="w-5 h-5" />
          </button>

          <!-- Page title -->
          <div class="min-w-0">
            <h2 class="truncate text-lg font-bold text-slate-800 sm:text-xl">
              {{ pageTitle }}
            </h2>

            <p class="hidden text-xs text-slate-500 sm:block">
              Bienvenue sur Saytu Liggéey 2.0
            </p>
          </div>
        </div>

        <!-- Right -->
        <div class="flex w-full min-w-0 items-center justify-end gap-2 sm:gap-3 md:w-auto">

          <!-- Search (Ctrl+K) -->
          <button
            type="button"
            @click="showCommandPalette = true"
            class="relative hidden xl:flex items-center w-64 2xl:w-80 rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-400 hover:border-cyan-400 hover:text-slate-600 transition focus:outline-none focus:ring-2 focus:ring-cyan-400"
            title="Recherche globale"
          >
            <Search class="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <span class="flex-1 text-left">Rechercher...</span>
            <kbd class="px-1.5 py-0.5 text-[10px] bg-slate-100 rounded border border-slate-300 font-mono text-slate-500">
              {{ isMac ? '⌘K' : 'Ctrl+K' }}
            </kbd>
          </button>

          <!-- Bouton recherche compact (mobile/tablette) -->
          <button
            type="button"
            @click="showCommandPalette = true"
            class="w-11 h-11 xl:hidden rounded-xl border border-slate-200 flex items-center justify-center hover:bg-slate-100 transition"
            title="Recherche (Ctrl+K)"
          >
            <Search class="w-5 h-5" />
          </button>

          <!-- Notifications -->
          <div v-if="auth.user?.role !== 'caissier'" class="relative">
            <NotificationsBell />
          </div>

          <!-- Date -->
          <div class="hidden lg:block text-sm text-slate-500">
            {{ today }}
          </div>

          <button
            v-if="auth.user?.role === 'caissier' && !isFullscreen"
            @click="entrerPleinEcran"
            class="inline-flex h-11 items-center gap-2 rounded-xl border border-cyan-100 bg-cyan-50 px-3 text-sm font-medium text-cyan-700 transition hover:bg-cyan-100"
            title="Plein ecran"
          >
            <Maximize class="h-4 w-4 shrink-0" />
            <span class="hidden xl:inline">Plein ecran</span>
          </button>

          <!-- Logout -->
          <button
            @click="handleLogout"
            class="inline-flex h-11 items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3 text-sm font-medium text-red-600 transition hover:bg-red-100 hover:text-red-700"
            title="Déconnexion"
          >
            <LogOut class="h-4 w-4 shrink-0" />
            <span class="hidden xl:inline">Déconnexion</span>
          </button>
        </div>
      </header>

      <!-- ================= MAIN ================= -->
      <main class="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6">
        <!-- Dynamic Page -->
        <div
          class="min-w-0 bg-white rounded-2xl lg:rounded-3xl border border-slate-100 shadow-sm p-3 sm:p-4 lg:p-6"
        >
          <router-view />
        </div>
      </main>
    </div>

    <ToastContainer />

    <!-- Command Palette (Ctrl+K) -->
    <CommandPalette v-model="showCommandPalette" />
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useNotificationsStore } from '@/stores/notifications'

import ToastContainer from '@/components/ToastContainer.vue'
import NotificationsBell from '@/components/NotificationsBell.vue'
import CommandPalette from '@/components/CommandPalette.vue'

import {
  LayoutDashboard,
  Users,
  Package,
  Warehouse,
  Boxes,
  FileText,
  Receipt,
  CreditCard,
  Wallet,
  BookOpen,
  ScrollText,
  BookMarked,
  Scale,
  Settings,
  UserCog,
  ClipboardList,
  Search,
  PanelLeftOpen,
  PanelLeftClose,
  ChevronDown,
  Maximize,
  LogOut
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()

const auth = useAuthStore()
const notif = useNotificationsStore()

const sidebarOpen = ref(true)
const mobileSidebarOpen = ref(false)
const showCommandPalette = ref(false)
const isFullscreen = ref(false)
const openMenuGroups = ref({
  ventes: true,
  boutique: true,
  stock: true,
  comptabilite: true,
  administration: true,
})

const isMac = computed(() => {
  if (typeof navigator === 'undefined') return false
  return /Mac|iPhone|iPad/.test(navigator.platform)
})

const tousLesMenus = [
  {
    to: '/',
    label: 'Tableau de bord',
    icon: LayoutDashboard,
    roles: ['admin', 'commercial', 'magasinier', 'comptable']
  },

  {
    to: '/clients',
    label: 'Clients',
    icon: Users,
    roles: ['admin', 'commercial', 'comptable', 'magasinier']
  },

  {
    to: '/produits',
    label: 'Produits',
    icon: Package,
    roles: ['admin', 'commercial', 'magasinier', 'comptable']
  },

  {
    to: '/entrepots',
    label: 'Entrepôts',
    icon: Warehouse,
    roles: ['admin', 'magasinier', 'comptable']
  },

  {
    to: '/stock',
    label: 'Stock',
    icon: Boxes,
    roles: ['admin', 'magasinier', 'commercial', 'comptable']
  },

  {
    to: '/devis',
    label: 'Devis',
    icon: FileText,
    roles: ['admin', 'commercial', 'comptable']
  },

  {
    to: '/factures',
    label: 'Factures',
    icon: Receipt,
    roles: ['admin', 'commercial', 'comptable']
  },

  {
    to: '/paiements',
    label: 'Paiements',
    icon: CreditCard,
    roles: ['admin', 'commercial', 'comptable', 'caissier']
  },

  {
    to: '/caisse',
    label: 'Caisse',
    icon: Wallet,
    roles: ['admin', 'commercial', 'comptable', 'caissier']
  },

  {
    to: '/compta/plan',
    label: 'Plan comptable',
    icon: BookOpen,
    roles: ['admin', 'comptable']
  },

  {
    to: '/compta/ecritures',
    label: 'Écritures',
    icon: ScrollText,
    roles: ['admin', 'comptable']
  },

  {
    to: '/compta/grand-livre',
    label: 'Grand livre',
    icon: BookMarked,
    roles: ['admin', 'comptable']
  },

  {
    to: '/compta/balance',
    label: 'Balance',
    icon: Scale,
    roles: ['admin', 'comptable']
  },

  {
    to: '/utilisateurs',
    label: 'Utilisateurs',
    icon: UserCog,
    roles: ['admin']
  },

  {
    to: '/activites',
    label: 'Activités',
    icon: ClipboardList,
    roles: ['admin']
  },

  {
    to: '/parametres',
    label: 'Paramètres',
    icon: Settings,
    roles: ['admin']
  }
]

const menuItems = computed(() => {
  const role = auth.user?.role
  if (!role) return []

  return tousLesMenus.filter(m => m.roles.includes(role))
})

const dashboardMenuItem = computed(() => {
  return menuItems.value.find(item => item.to === '/') || null
})

const menuGroupDefinitions = [
  {
    key: 'ventes',
    label: 'Ventes & Clients',
    icon: Users,
    items: ['/clients', '/devis', '/factures', '/paiements']
  },
  {
    key: 'boutique',
    label: 'Boutique / Caisse',
    icon: Wallet,
    items: ['/caisse']
  },
  {
    key: 'stock',
    label: 'Stock & Produits',
    icon: Boxes,
    items: ['/produits', '/entrepots', '/stock']
  },
  {
    key: 'comptabilite',
    label: 'Comptabilité',
    icon: BookOpen,
    items: ['/compta/plan', '/compta/ecritures', '/compta/grand-livre', '/compta/balance']
  },
  {
    key: 'administration',
    label: 'Administration',
    icon: Settings,
    items: ['/utilisateurs', '/parametres', '/activites']
  },
]

const groupedMenuItems = computed(() => {
  const visibleItems = menuItems.value

  return menuGroupDefinitions
    .map(group => ({
      ...group,
      items: group.items
        .map(to => visibleItems.find(item => item.to === to))
        .filter(Boolean)
    }))
    .filter(group => group.items.length > 0)
})

function isActive(to) {
  if (to === '/') return route.path === '/'
  return route.path.startsWith(to)
}

function isGroupActive(group) {
  return group.items.some(item => isActive(item.to))
}

function toggleMenuGroup(key) {
  openMenuGroups.value[key] = !openMenuGroups.value[key]
}

function groupBadgeCount(group) {
  return group.items.reduce((total, item) => total + getBadgeCount(item.to), 0)
}

function groupBadgeColor(group) {
  const colors = group.items
    .filter(item => getBadgeCount(item.to) > 0)
    .map(item => getBadgeColor(item.to))

  return colors[0] || 'bg-slate-500 text-white'
}

function getBadgeCount(to) {
  if (to === '/factures') return notif.badges.factures_retard
  if (to === '/devis') return notif.badges.devis_attente
  if (to === '/stock') return notif.badges.stock_alerte

  return 0
}

function getBadgeColor(to) {
  if (to === '/factures') return 'bg-red-500 text-white'
  if (to === '/devis') return 'bg-yellow-500 text-white'
  if (to === '/stock') return 'bg-orange-500 text-white'

  return 'bg-slate-500 text-white'
}

const pageTitle = computed(() => {
  return menuItems.value.find(item => isActive(item.to))?.label || 'Saytu Liggéey'
})

const userInitials = computed(() => {
  const name = auth.user?.name || ''

  return name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
})

const today = computed(() => {
  return new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})

async function handleLogout() {
  await quitterPleinEcran()
  await auth.logout()

  router.push({
    name: 'login'
  })
}

async function entrerPleinEcran() {
  if (typeof document === 'undefined' || document.fullscreenElement) return
  try {
    await document.documentElement.requestFullscreen()
  } catch (e) {
    // Le navigateur peut exiger une action utilisateur.
  } finally {
    syncFullscreenState()
  }
}

async function quitterPleinEcran() {
  if (typeof document === 'undefined' || !document.fullscreenElement) return
  try {
    await document.exitFullscreen()
  } catch (e) {}
}

function syncFullscreenState() {
  isFullscreen.value = !!document.fullscreenElement
}

function toggleSidebar() {
  if (window.innerWidth < 1024) {
    mobileSidebarOpen.value = !mobileSidebarOpen.value
    return
  }

  sidebarOpen.value = !sidebarOpen.value
}

function handleResize() {
  if (window.innerWidth >= 1024) {
    mobileSidebarOpen.value = false
  }
}

// ===== Raccourci clavier global Ctrl+K / Cmd+K =====
function handleGlobalKeydown(event) {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault()
    showCommandPalette.value = true
  }
}

watch(
  () => route.fullPath,
  () => {
    mobileSidebarOpen.value = false
    const activeGroup = groupedMenuItems.value.find(group => isGroupActive(group))
    if (activeGroup) {
      openMenuGroups.value[activeGroup.key] = true
    }
  }
)

onMounted(() => {
  notif.fetchBadges()
  syncFullscreenState()
  if (auth.user?.role === 'caissier') {
    entrerPleinEcran()
  }
  window.addEventListener('resize', handleResize)
  document.addEventListener('fullscreenchange', syncFullscreenState)
  document.addEventListener('keydown', handleGlobalKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  document.removeEventListener('fullscreenchange', syncFullscreenState)
  document.removeEventListener('keydown', handleGlobalKeydown)
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: all 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}
</style>
