<template>
  <div
    class="app-shell min-h-screen bg-[#f4f7fb] text-slate-700 transition-colors dark:bg-slate-950 dark:text-slate-200 lg:flex"
    :class="viewportClass"
    :data-device="deviceType"
  >
    <div
      v-if="mobileSidebarOpen"
      class="fixed inset-0 z-30 bg-slate-950/50 backdrop-blur-sm lg:hidden"
      @click="mobileSidebarOpen = false"
    ></div>
    
    <!-- ================= SIDEBAR ================= -->
    <aside
      id="main-sidebar"
      aria-label="Navigation principale"
      :class="[
        'app-sidebar fixed inset-y-0 left-0 z-40 flex h-screen w-72 flex-col bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white shadow-2xl transition-all duration-300 lg:translate-x-0',
        mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full',
        sidebarOpen ? 'lg:w-72' : 'lg:w-24'
      ]"
    >
      <!-- Logo -->
      <div class="h-20 flex items-center px-5 border-b border-slate-700">
        <div
          class="app-brand-chip flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 shadow-lg ring-1 ring-white/10"
        >
          <img
            v-if="companyLogoUrl"
            :src="companyLogoUrl"
            :alt="company.nom || 'Logo société'"
            class="h-full w-full bg-white/95 object-contain p-1.5"
            @error="handleCompanyLogoError"
          />
          <span v-else class="text-xl font-black">SL</span>
        </div>

        <transition name="fade">
          <div v-if="sidebarOpen" class="ml-4">
            <h1 class="font-bold text-lg tracking-wide">Saytu Liggéey 2.0</h1>
            <p class="text-xs text-slate-400">Business Suite</p>
          </div>
        </transition>
      </div>

      <!-- Menu -->
      <nav aria-label="Rubriques de l'application" class="flex-1 px-4 py-5 overflow-y-auto space-y-2">
        <router-link
          v-if="!sidebarOpen"
          v-for="item in menuItems"
          :key="item.to"
          :to="item.to"
          @click="mobileSidebarOpen = false"
          class="app-sidebar-link group relative flex items-center rounded-2xl px-4 py-3 transition-all duration-300 hover:bg-white/10 hover:translate-x-1"
          :class="isActive(item.to)
            ? 'app-sidebar-link-active bg-white/10 backdrop-blur-lg border border-white/10 shadow-lg'
            : 'app-sidebar-link-idle'"
        >
          <!-- Active bar -->
          <div
            v-if="isActive(item.to)"
            class="app-sidebar-active-bar absolute left-0 top-2 bottom-2 w-1 rounded-full"
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
          class="app-sidebar-link group relative flex items-center rounded-2xl px-4 py-3 transition-all duration-300 hover:bg-white/10 hover:translate-x-1"
          :class="isActive(dashboardMenuItem.to)
            ? 'app-sidebar-link-active bg-white/10 backdrop-blur-lg border border-white/10 shadow-lg'
            : 'app-sidebar-link-idle'"
        >
          <div
            v-if="isActive(dashboardMenuItem.to)"
            class="app-sidebar-active-bar absolute left-0 top-2 bottom-2 w-1 rounded-full"
          ></div>
          <component :is="dashboardMenuItem.icon" class="h-5 w-5 shrink-0" />
          <span class="ml-4 flex-1 text-sm font-semibold">{{ dashboardMenuItem.label }}</span>
        </router-link>

        <div v-if="sidebarOpen" v-for="group in groupedMenuItems" :key="group.key" class="space-y-1">
          <button
            type="button"
            @click="toggleMenuGroup(group.key)"
            class="app-sidebar-group-button flex w-full items-center rounded-2xl px-4 py-3 text-left transition-all duration-300 hover:bg-white/10"
            :class="isGroupActive(group) ? 'app-sidebar-group-active bg-white/10 border border-white/10' : ''"
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
              class="app-sidebar-link app-sidebar-sub-link group relative flex items-center rounded-xl px-3 py-2.5 transition-all duration-300 hover:bg-white/10"
              :class="isActive(item.to) ? 'app-sidebar-link-active bg-white/10' : 'app-sidebar-link-idle text-slate-200'"
            >
              <div
                v-if="isActive(item.to)"
                class="app-sidebar-active-bar absolute left-0 top-2 bottom-2 w-1 rounded-full"
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
            class="app-user-chip flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 font-bold shadow-lg ring-2 ring-white/10"
          >
            <img
              v-if="userPhotoUrl"
              :src="userPhotoUrl"
              :alt="auth.user?.name || 'Utilisateur'"
              class="h-full w-full object-cover"
              @error="hideUserPhoto = true"
            />
            <span v-else>{{ userInitials }}</span>
          </div>

          <transition name="fade">
            <div v-if="sidebarOpen" class="ml-3 overflow-hidden">
              <p class="font-semibold truncate text-sm">
                {{ auth.user?.name || 'Utilisateur' }}
              </p>

              <p class="text-xs text-slate-400 capitalize">
                {{ roleLabel(auth.user?.role) }}
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
        class="app-topbar min-h-20 bg-white/80 backdrop-blur-xl border-b border-slate-200 px-4 py-3 sm:px-6 flex flex-col gap-3 shadow-sm transition-colors dark:border-slate-700 dark:bg-slate-900/85 md:flex-row md:items-center md:justify-between"
      >
        <!-- Left -->
        <div class="flex min-w-0 items-center gap-3 sm:gap-4">
          <!-- Toggle -->
          <button
            type="button"
            @click="toggleSidebar"
            class="w-11 h-11 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-slate-100 transition dark:border-slate-700 dark:hover:bg-slate-800"
            title="Menu"
            aria-label="Ouvrir ou réduire le menu principal"
            aria-controls="main-sidebar"
            :aria-expanded="isDesktop ? sidebarOpen : mobileSidebarOpen"
          >
            <PanelLeftClose v-if="sidebarOpen && !mobileSidebarOpen" class="w-5 h-5" />
            <PanelLeftOpen v-else class="w-5 h-5" />
          </button>

          <!-- Page title -->
          <div class="min-w-0">
            <h2 class="app-page-title truncate text-lg font-bold text-slate-800 dark:text-slate-100 sm:text-xl">
              {{ pageTitle }}
            </h2>

            <p class="app-page-subtitle hidden text-xs text-slate-500 dark:text-slate-400 sm:block">
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
            class="relative hidden xl:flex items-center w-64 2xl:w-80 rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-400 hover:border-cyan-400 hover:text-slate-600 transition focus:outline-none focus:ring-2 focus:ring-cyan-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
            title="Recherche globale"
            aria-label="Ouvrir la recherche globale"
          >
            <Search class="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <span class="flex-1 text-left">Rechercher...</span>
            <kbd class="px-1.5 py-0.5 text-[10px] bg-slate-100 rounded border border-slate-300 font-mono text-slate-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {{ isMac ? '⌘K' : 'Ctrl+K' }}
            </kbd>
          </button>

          <!-- Bouton recherche compact (mobile/tablette) -->
          <button
            type="button"
            @click="showCommandPalette = true"
            class="w-11 h-11 xl:hidden rounded-xl border border-slate-200 flex items-center justify-center hover:bg-slate-100 transition dark:border-slate-700 dark:hover:bg-slate-800"
            title="Recherche (Ctrl+K)"
            aria-label="Ouvrir la recherche globale"
          >
            <Search class="w-5 h-5" />
          </button>

          <!-- Theme -->
          <button
            type="button"
            @click="toggleThemeMode"
            class="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
            :title="isDark ? 'Passer en mode clair' : 'Passer en mode sombre'"
            :aria-label="isDark ? 'Passer en mode clair' : 'Passer en mode sombre'"
          >
            <Sun v-if="isDark" class="h-5 w-5" />
            <Moon v-else class="h-5 w-5" />
          </button>

          <!-- Notifications -->
          <div v-if="auth.user?.role !== 'caissier'" class="relative">
            <NotificationsBell />
          </div>

          <!-- Date -->
          <div class="hidden lg:block text-sm text-slate-500 dark:text-slate-400">
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
            aria-label="Se déconnecter"
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
          class="app-surface min-w-0 bg-white rounded-2xl lg:rounded-3xl border border-slate-100 shadow-sm p-3 transition-colors dark:border-slate-800 dark:bg-slate-900 sm:p-4 lg:p-6"
        >
          <router-view v-slot="{ Component, route: viewRoute }">
            <KeepAlive :max="18">
              <component :is="Component" :key="viewRoute.name || viewRoute.path" />
            </KeepAlive>
          </router-view>
        </div>
      </main>
    </div>

    <ToastContainer />

    <!-- Command Palette (Ctrl+K) -->
    <CommandPalette v-model="showCommandPalette" />

    <div
      v-if="minimizedWindows.length"
      class="fixed bottom-4 right-4 z-[100] w-[min(24rem,calc(100vw-2rem))] rounded-3xl border border-[var(--theme-border,#bfdbfe)] bg-white/95 p-3 shadow-2xl backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/95"
    >
      <div class="mb-2 flex items-center justify-between gap-2 px-1">
        <div class="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[var(--theme-primary,#2563eb)]">
          <Minus class="h-4 w-4" />
          Fenêtres réduites
        </div>
        <span class="rounded-full bg-[var(--theme-soft,#eef6ff)] px-2 py-0.5 text-[11px] font-bold text-[var(--theme-primary,#2563eb)]">
          {{ minimizedWindows.length }}
        </span>
      </div>

      <div class="space-y-2">
        <div
          v-for="windowItem in minimizedWindows"
          :key="windowItem.id"
          class="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm shadow-sm transition hover:border-[var(--theme-primary,#2563eb)] hover:bg-white dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-800/80"
        >
          <button
            type="button"
            class="min-w-0 flex-1 text-left"
            @click="restoreMinimizedWindow(windowItem)"
          >
            <span class="block truncate font-semibold text-slate-800 dark:text-slate-100">{{ windowItem.title }}</span>
            <span class="block truncate text-xs text-slate-500 dark:text-slate-400">Cliquez pour reprendre la saisie</span>
          </button>

          <button
            type="button"
            class="inline-flex h-8 w-8 items-center justify-center rounded-xl text-[var(--theme-primary,#2563eb)] transition hover:bg-[var(--theme-soft,#eef6ff)]"
            title="Reprendre"
            aria-label="Reprendre la fenêtre"
            @click="restoreMinimizedWindow(windowItem)"
          >
            <RotateCcw class="h-4 w-4" />
          </button>

          <button
            type="button"
            class="inline-flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition hover:bg-red-50 hover:text-red-600"
            title="Fermer"
            aria-label="Fermer la fenêtre réduite"
            @click="closeMinimizedWindow(windowItem)"
          >
            <X class="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useNotificationsStore } from '@/stores/notifications'
import { useTheme } from '@/composables/useTheme'
import { setCurrency, syncAmountTableNotes } from '@/composables/useCurrency'
import { useViewport } from '@/composables/useViewport'
import { useWindowDock } from '@/composables/useWindowDock'
import api from '@/services/api'

import ToastContainer from '@/components/ToastContainer.vue'
import NotificationsBell from '@/components/NotificationsBell.vue'
import CommandPalette from '@/components/CommandPalette.vue'

import {
  LayoutDashboard,
  Users,
  Target,
  Package,
  FolderTree,
  Warehouse,
  Boxes,
  FileText,
  Receipt,
  CreditCard,
  Wallet,
  Truck,
  ShoppingCart,
  Printer,
  BookOpen,
  ScrollText,
  BookMarked,
  Scale,
  Settings,
  UserCog,
  ShieldCheck,
  ClipboardList,
  Sparkles,
  CalendarDays,
  Search,
  PanelLeftOpen,
  PanelLeftClose,
  ChevronDown,
  Minus,
  Maximize,
  LogOut,
  RotateCcw,
  Moon,
  Sun,
  X
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()

const auth = useAuthStore()
const notif = useNotificationsStore()
const dock = useWindowDock()

const sidebarOpen = ref(true)
const mobileSidebarOpen = ref(false)
const showCommandPalette = ref(false)
const isFullscreen = ref(false)
const { isDark, applyTheme, toggleThemeMode } = useTheme()
const { isDesktop, isMobile, deviceType, viewportClass } = useViewport()
const logoVersion = ref(Date.now())
const hideUserPhoto = ref(false)
const INACTIVITY_LIMIT_MS = 30 * 60 * 1000
const INACTIVITY_CHECK_MS = 30 * 1000
const inactivityEvents = ['click', 'keydown', 'mousemove', 'mousedown', 'scroll', 'touchstart', 'pointerdown']
const lastActivityAt = ref(Date.now())
let inactivityCheckTimer = null
let inactivityLogoutRunning = false
let amountTableObserver = null
const company = reactive({
  nom: 'Saytu Liggéey 2.0',
  logo: '',
  devise_defaut: 'XOF',
})
const openMenuGroups = ref({
  ventes: false,
  boutique: false,
  achats: false,
  stock: false,
  analyse: false,
  comptabilite: false,
  rh: false,
  administration: false,
})

const isMac = computed(() => {
  if (typeof navigator === 'undefined') return false
  return /Mac|iPhone|iPad/.test(navigator.platform)
})

const minimizedWindows = computed(() => dock.windows.value)

const tousLesMenus = [
  {
    to: '/',
    label: 'Tableau de bord',
    icon: LayoutDashboard,
    permission: 'dashboard.view',
    roles: ['admin', 'gerant', 'commercial', 'magasinier', 'comptable']
  },

  {
    to: '/aujourdhui',
    label: "Aujourd'hui",
    icon: Sparkles,
    permission: 'pilotage.view',
    roles: ['admin', 'gerant', 'commercial', 'magasinier', 'comptable', 'caissier']
  },

  {
    to: '/agenda',
    label: 'Agenda',
    icon: CalendarDays,
    permission: 'agenda.view',
    roles: ['admin', 'gerant', 'commercial', 'magasinier', 'comptable', 'caissier']
  },

  {
    to: '/clients',
    label: 'Clients',
    icon: Users,
    permission: 'clients.view',
    roles: ['admin', 'gerant', 'commercial', 'comptable']
  },

  {
    to: '/prospection',
    label: 'Prospection',
    icon: Target,
    permission: 'prospection.view',
    roles: ['admin', 'gerant', 'commercial']
  },

  {
    to: '/devis',
    label: 'Devis',
    icon: FileText,
    permission: 'devis.view',
    roles: ['admin', 'gerant', 'commercial', 'comptable']
  },

  {
    to: '/factures',
    label: 'Factures',
    icon: Receipt,
    permission: 'factures.view',
    roles: ['admin', 'gerant', 'commercial', 'comptable']
  },

  {
    to: '/caisse',
    label: 'Caisse',
    icon: Wallet,
    permission: 'caisse.view',
    roles: ['admin', 'gerant', 'comptable', 'caissier']
  },

  {
    to: '/achats',
    label: 'Achats fournisseurs',
    icon: ShoppingCart,
    permission: 'achats.view',
    roles: ['admin', 'gerant', 'magasinier', 'comptable']
  },

  {
    to: '/produits',
    label: 'Produits',
    icon: Package,
    permission: 'produits.view',
    roles: ['admin', 'gerant', 'commercial', 'magasinier', 'comptable']
  },

  {
    to: '/categories-produits',
    label: 'Catégories',
    icon: FolderTree,
    permission: 'produits.view',
    roles: ['admin', 'gerant', 'commercial', 'magasinier', 'comptable']
  },

  {
    to: '/entrepots',
    label: 'Entrepôts',
    icon: Warehouse,
    permission: 'stock.view',
    roles: ['admin', 'gerant', 'magasinier', 'comptable']
  },

  {
    to: '/stock',
    label: 'Stock',
    icon: Boxes,
    permission: 'stock.view',
    roles: ['admin', 'gerant', 'magasinier', 'comptable']
  },

  {
    to: '/tresorerie-comptes',
    label: 'Trésorerie',
    icon: Wallet,
    permission: 'tresorerie.view',
    roles: ['admin', 'gerant', 'comptable']
  },

  {
    to: '/compta/plan',
    label: 'Plan comptable',
    icon: BookOpen,
    permission: 'comptabilite.view',
    roles: ['admin', 'gerant', 'comptable']
  },

  {
    to: '/compta/grand-livre',
    label: 'Grand livre',
    icon: BookMarked,
    permission: 'comptabilite.view',
    roles: ['admin', 'gerant', 'comptable']
  },

  {
    to: '/compta/balance',
    label: 'Balance',
    icon: Scale,
    permission: 'comptabilite.view',
    roles: ['admin', 'gerant', 'comptable']
  },

  {
    to: '/paiements',
    label: 'Paiements clients',
    icon: CreditCard,
    permission: 'paiements.view',
    roles: ['admin', 'gerant', 'comptable', 'caissier']
  },

  {
    to: '/fournisseurs-reglements',
    label: 'Règlements fournisseurs',
    icon: Truck,
    permission: 'fournisseurs_reglements.view',
    roles: ['admin', 'gerant', 'comptable']
  },

  {
    to: '/compta/ecritures',
    label: 'Écritures',
    icon: ScrollText,
    permission: 'comptabilite.view',
    roles: ['admin', 'gerant', 'comptable']
  },

  {
    to: '/depenses',
    label: 'Dépenses',
    icon: Wallet,
    permission: 'depenses.view',
    roles: ['admin', 'gerant', 'comptable', 'caissier', 'commercial', 'magasinier']
  },

  {
    to: '/rh',
    label: 'Ressources humaines',
    icon: Users,
    permission: 'rh.view',
    roles: ['admin', 'gerant', 'commercial', 'magasinier', 'comptable']
  },

  {
    to: '/leasing',
    label: 'Leasing imprimantes',
    icon: Printer,
    permission: 'leasing.view',
    roles: ['admin', 'gerant', 'commercial', 'magasinier', 'comptable']
  },

  {
    to: '/utilisateurs',
    label: 'Accès & Utilisateurs',
    icon: UserCog,
    permission: 'utilisateurs.view',
    roles: ['admin']
  },

  {
    to: '/roles-permissions',
    label: 'Rôles & permissions',
    icon: ShieldCheck,
    permission: 'access_control.view',
    roles: ['admin']
  },

  {
    to: '/parametres',
    label: 'Paramètres',
    icon: Settings,
    permission: 'parametres.view',
    roles: ['admin']
  },

  {
    to: '/activites',
    label: 'Activités',
    icon: ClipboardList,
    permission: 'activites.view',
    roles: ['admin', 'gerant']
  }
]

const menuItems = computed(() => {
  const role = auth.user?.role
  if (!role) return []

  return tousLesMenus.filter(canAccessMenuItem)
})

function canAccessMenuItem(item) {
  const role = auth.user?.role
  if (!role) return false
  if (role === 'admin') return true
  if (item.roles.includes(role)) return true
  if (item.permission && userHasPermission(item.permission)) return true

  return false
}

function userHasPermission(permission) {
  const permissions = auth.user?.permissions?.flat
  return Array.isArray(permissions) && permissions.includes(permission)
}

const companyLogoUrl = computed(() => {
  if (!company.logo) return ''
  if (company.logo.startsWith('http')) return `${company.logo}${company.logo.includes('') ? '&' : ''}v=${logoVersion.value}`
  return `${company.logo}${company.logo.includes('') ? '&' : ''}v=${logoVersion.value}`
})

const userPhotoUrl = computed(() => {
  const photo = auth.user?.photo
  if (!photo || hideUserPhoto.value) return ''
  if (photo.startsWith('http')) return photo
  return photo
})

function roleLabel(role) {
  return {
    admin: 'Administrateur',
    gerant: 'Gérant',
    commercial: 'Commercial',
    magasinier: 'Gestionnaire de stock',
    comptable: 'Comptable',
    caissier: 'Caissier',
  }[role] || role || ''
}

watch(
  () => auth.user?.photo,
  () => {
    hideUserPhoto.value = false
  }
)

async function loadCompanyIdentity() {
  try {
    const { data } = await api.get('/societe/identite')
    Object.assign(company, {
      nom: data.nom || 'Saytu Liggéey 2.0',
      logo: data.logo || '',
      devise_defaut: data.devise_defaut || 'XOF',
    })
    setCurrency(company.devise_defaut)
    logoVersion.value = Date.now()
  } catch (e) {
    company.logo = ''
  }
}

function handleCompanyLogoError() {
  company.logo = ''
}

function handleCompanyIdentityUpdated(event) {
  const detail = event.detail || {}
  Object.assign(company, {
    nom: detail.nom || company.nom,
    logo: detail.logo || '',
    devise_defaut: detail.devise_defaut || company.devise_defaut || 'XOF',
  })
  setCurrency(company.devise_defaut)
  logoVersion.value = Date.now()
}

const dashboardMenuItem = computed(() => {
  return menuItems.value.find(item => item.to === '/') || null
})

const menuGroupDefinitions = [
  {
    key: 'pilotage',
    label: 'Pilotage',
    icon: Sparkles,
    items: ['/aujourdhui', '/agenda']
  },
  {
    key: 'ventes',
    label: 'Ventes',
    icon: Users,
    items: ['/clients', '/prospection', '/devis', '/factures']
  },
  {
    key: 'boutique',
    label: 'Caisse',
    icon: Wallet,
    items: ['/caisse']
  },
  {
    key: 'achats',
    label: 'Achats',
    icon: ShoppingCart,
    items: ['/achats']
  },
  {
    key: 'stock',
    label: 'Stock',
    icon: Boxes,
    items: ['/produits', '/categories-produits', '/entrepots', '/stock']
  },
  {
    key: 'analyse',
    label: 'Analyse',
    icon: Scale,
    items: ['/tresorerie-comptes', '/compta/plan', '/compta/grand-livre', '/compta/balance']
  },
  {
    key: 'comptabilite',
    label: 'Comptabilité',
    icon: BookOpen,
    items: ['/paiements', '/fournisseurs-reglements', '/compta/ecritures', '/depenses']
  },
  {
    key: 'rh',
    label: 'Ressources humaines',
    icon: Users,
    items: ['/rh']
  },
  {
    key: 'administration',
    label: 'Administration',
    icon: Settings,
    items: ['/leasing', '/utilisateurs', '/roles-permissions', '/parametres', '/activites']
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

function menuTarget(to) {
  if (typeof to !== 'string') {
    return {
      path: to?.path || '/',
      hash: to?.hash || '',
    }
  }

  const [pathAndQuery, hash] = to.split('#')
  return {
    path: pathAndQuery.split('?')[0] || '/',
    hash: hash ? `#${hash}` : '',
  }
}

function isActive(to) {
  const target = menuTarget(to)

  if (target.path === '/') return route.path === '/' && !target.hash
  if (!route.path.startsWith(target.path)) return false
  if (target.hash) return route.hash === target.hash
  if (target.path === '/aujourdhui' && route.hash) return false

  return true
}

function isGroupActive(group) {
  return group.items.some(item => isActive(item.to))
}

watch(
  [() => route.path, groupedMenuItems],
  () => {
    groupedMenuItems.value.forEach((group) => {
      if (isGroupActive(group)) openMenuGroups.value[group.key] = true
    })
  },
  { immediate: true }
)

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
  const path = menuTarget(to).path
  if (path === '/factures') return notif.badges.factures_retard
  if (path === '/devis') return notif.badges.devis_attente
  if (path === '/stock') return notif.badges.stock_alerte
  if (path === '/depenses') return notif.badges.demandes_validation

  return 0
}

function getBadgeColor(to) {
  const path = menuTarget(to).path
  if (path === '/factures') return 'bg-red-500 text-white'
  if (path === '/devis') return 'bg-yellow-500 text-white'
  if (path === '/stock') return 'bg-orange-500 text-white'
  if (path === '/depenses') return 'bg-blue-500 text-white'

  return 'bg-slate-500 text-white'
}

const pageTitle = computed(() => {
  return menuItems.value.find(item => isActive(item.to)).label || 'Saytu Liggéey'
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
  inactivityLogoutRunning = true
  await quitterPleinEcran()
  await auth.logout()

  router.push({
    name: 'login'
  })
}

function markActivity() {
  if (!auth.isAuthenticated || inactivityLogoutRunning) return
  lastActivityAt.value = Date.now()
}

async function handleInactivityLogout() {
  if (inactivityLogoutRunning || !auth.isAuthenticated) return
  inactivityLogoutRunning = true

  await quitterPleinEcran()
  await auth.logout()

  router.push({
    name: 'login',
    query: { expired: '1' },
  })
}

function checkInactivity() {
  if (!auth.isAuthenticated || inactivityLogoutRunning) return

  if (Date.now() - lastActivityAt.value >= INACTIVITY_LIMIT_MS) {
    handleInactivityLogout()
  }
}

function startInactivityWatcher() {
  lastActivityAt.value = Date.now()
  inactivityLogoutRunning = false

  inactivityEvents.forEach((eventName) => {
    window.addEventListener(eventName, markActivity, { passive: true })
  })

  inactivityCheckTimer = window.setInterval(checkInactivity, INACTIVITY_CHECK_MS)
}

function stopInactivityWatcher() {
  inactivityEvents.forEach((eventName) => {
    window.removeEventListener(eventName, markActivity)
  })

  if (inactivityCheckTimer) {
    window.clearInterval(inactivityCheckTimer)
    inactivityCheckTimer = null
  }
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
  if (!isDesktop.value) {
    mobileSidebarOpen.value = !mobileSidebarOpen.value
    return
  }

  sidebarOpen.value = !sidebarOpen.value
}

function handleResize() {
  if (isDesktop.value) {
    mobileSidebarOpen.value = false
  }

  if (isMobile.value) {
    sidebarOpen.value = true
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
  async () => {
    mobileSidebarOpen.value = false
    await nextTick()
    syncAmountTableNotes(document)
  }
)

function handleCurrencyChanged() {
  syncAmountTableNotes(document)
}

async function restoreMinimizedWindow(windowItem) {
  if (windowItem.route && route.fullPath !== windowItem.route) {
    await router.push(windowItem.route)
    await nextTick()
  }

  window.dispatchEvent(new CustomEvent('app-modal:restore', {
    detail: { id: windowItem.id },
  }))
}

async function closeMinimizedWindow(windowItem) {
  await restoreMinimizedWindow(windowItem)
  await nextTick()

  window.dispatchEvent(new CustomEvent('app-modal:close', {
    detail: { id: windowItem.id },
  }))
}

function startAmountTableObserver() {
  syncAmountTableNotes(document)
  amountTableObserver = new MutationObserver(() => {
    window.requestAnimationFrame(() => syncAmountTableNotes(document))
  })
  amountTableObserver.observe(document.body, { childList: true, subtree: true })
  window.addEventListener('currency:changed', handleCurrencyChanged)
  document.addEventListener('change', handleCurrencyChanged, true)
}

function stopAmountTableObserver() {
  amountTableObserver?.disconnect()
  amountTableObserver = null
  window.removeEventListener('currency:changed', handleCurrencyChanged)
  document.removeEventListener('change', handleCurrencyChanged, true)
}

onMounted(() => {
  applyTheme()
  loadCompanyIdentity()
  notif.fetchBadges()
  syncFullscreenState()
  if (auth.user?.role === 'caissier') {
    entrerPleinEcran()
  }
  startInactivityWatcher()
  window.addEventListener('resize', handleResize)
  document.addEventListener('fullscreenchange', syncFullscreenState)
  document.addEventListener('keydown', handleGlobalKeydown)
  window.addEventListener('societe:updated', handleCompanyIdentityUpdated)
  startAmountTableObserver()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  document.removeEventListener('fullscreenchange', syncFullscreenState)
  document.removeEventListener('keydown', handleGlobalKeydown)
  window.removeEventListener('societe:updated', handleCompanyIdentityUpdated)
  stopAmountTableObserver()
  stopInactivityWatcher()
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
