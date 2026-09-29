<template>
  <div class="space-y-4">
    <section class="rounded-lg border border-slate-200 bg-white p-4">
      <div class="flex flex-col gap-3 lg:flex-row lg:items-end">
        <div class="flex-1">
          <h2 class="text-xl font-bold text-slate-900">Centre de notifications</h2>
          <p class="text-sm text-slate-500">Alertes de gestion, achats, RH, stock, ventes et validations.</p>
        </div>
        <select v-model="filters.module" class="input lg:w-48" @change="applyFilters">
          <option value="">Tous modules</option>
          <option v-for="module in modules" :key="module.id" :value="module.id">{{ module.label }}</option>
        </select>
        <select v-model="filters.statut" class="input lg:w-44" @change="applyFilters">
          <option value="non_lues">Non lues</option>
          <option value="lues">Lues</option>
          <option value="toutes">Toutes</option>
        </select>
        <button class="btn-secondary" :disabled="loading || markingAll" @click="refreshCenter">
          {{ loading ? 'Chargement...' : 'Actualiser' }}
        </button>
        <button class="btn-primary" :disabled="markingAll || stats.non_lues === 0" @click="markAllRead">
          {{ markingAll ? 'Traitement...' : 'Tout marquer comme lu' }}
        </button>
      </div>
      <p v-if="lastLoadedAt" class="mt-3 text-xs text-slate-400">
        Dernière mise à jour : {{ formatDate(lastLoadedAt) }}
      </p>
    </section>

    <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <button type="button" class="rounded-lg border bg-white p-4 text-left transition hover:-translate-y-0.5 hover:shadow-sm" :class="statCardClass('toutes')" @click="setStatus('toutes')">
        <p class="text-xs uppercase text-slate-500">Total</p>
        <strong class="mt-1 block text-2xl text-slate-900">{{ stats.total || 0 }}</strong>
      </button>
      <button type="button" class="rounded-lg border bg-white p-4 text-left transition hover:-translate-y-0.5 hover:shadow-sm" :class="statCardClass('non_lues')" @click="setStatus('non_lues')">
        <p class="text-xs uppercase text-slate-500">Non lues</p>
        <strong class="mt-1 block text-2xl text-red-600">{{ stats.non_lues || 0 }}</strong>
      </button>
      <button type="button" class="rounded-lg border bg-white p-4 text-left transition hover:-translate-y-0.5 hover:shadow-sm" :class="statCardClass('lues')" @click="setStatus('lues')">
        <p class="text-xs uppercase text-slate-500">Lues</p>
        <strong class="mt-1 block text-2xl text-emerald-700">{{ stats.lues || 0 }}</strong>
      </button>
    </div>

    <section class="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div v-if="loading" class="p-12 text-center text-sm text-slate-500">Chargement...</div>
      <div v-else-if="items.length === 0" class="p-12 text-center text-sm text-slate-400">Aucune notification.</div>
      <div v-else class="divide-y divide-slate-100">
        <button
          v-for="item in items"
          :key="item.key"
          type="button"
          class="block w-full p-4 text-left transition hover:bg-slate-50"
          :class="!item.read ? 'bg-cyan-50/40' : ''"
          @click="openNotification(item)"
        >
          <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <span class="badge" :class="moduleClass(item.module)">{{ moduleLabel(item.module) }}</span>
                <span class="badge" :class="levelClass(item.level)">{{ item.level || 'info' }}</span>
                <span class="badge" :class="item.read ? 'bg-slate-100 text-slate-600' : 'bg-red-100 text-red-700'">{{ item.read ? 'Lu' : 'Non lu' }}</span>
              </div>
              <h3 class="mt-2 font-bold text-slate-900">{{ item.title || 'Notification' }}</h3>
              <p class="mt-1 text-sm text-slate-500">{{ item.message || 'Aucun détail disponible.' }}</p>
            </div>
            <div class="shrink-0 text-left sm:text-right">
              <p class="text-xs text-slate-500">{{ formatDate(item.date) }}</p>
              <span class="mt-2 inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-100">
                Ouvrir
              </span>
            </div>
          </div>
        </button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'
import { useNotificationsStore } from '@/stores/notifications'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const notifications = useNotificationsStore()
const loading = ref(false)
const markingAll = ref(false)
const lastLoadedAt = ref(null)
const items = ref([])
const modules = ref([])
const stats = reactive({ total: 0, non_lues: 0, lues: 0 })
const filters = reactive({ module: '', statut: 'non_lues' })
const allowedStatuses = ['non_lues', 'lues', 'toutes']

async function load() {
  if (loading.value) return
  loading.value = true
  try {
    const { data } = await api.get('/notifications/centre', { params: filters })
    items.value = data.data || []
    modules.value = data.modules || []
    Object.assign(stats, data.stats || {})
    lastLoadedAt.value = new Date().toISOString()
  } catch (e) {
    toast.error(apiErrorMessage(e, 'Impossible de charger les notifications.'))
  } finally {
    loading.value = false
  }
}

async function markAllRead() {
  if (markingAll.value || stats.non_lues === 0) return
  markingAll.value = true
  try {
    await api.post('/notifications/read-all')
    await Promise.all([
      load(),
      notifications.fetchBadges({ force: true }),
      notifications.fetchDetails({ force: true }),
    ])
    toast.success('Toutes les notifications ont été marquées comme lues.')
  } catch (e) {
    toast.error(apiErrorMessage(e, 'Action impossible.'))
  } finally {
    markingAll.value = false
  }
}

function setStatus(statut) {
  filters.statut = statut
  applyFilters()
}

function refreshCenter() {
  load()
  notifications.fetchBadges({ force: true })
}

async function applyFilters() {
  await syncRoute()
  await load()
}

async function syncRoute() {
  const query = {}
  if (filters.module) query.module = filters.module
  if (filters.statut && filters.statut !== 'non_lues') query.statut = filters.statut

  await router.replace({ path: route.path, query })
}

async function openNotification(item) {
  if (item.key && !item.read) {
    await notifications.markRead(item.key)
    await load()
  }

  router.push({ path: item.route || '/', query: item.query || {} })
}

function moduleLabel(value) { return modules.value.find(module => module.id === value)?.label || value || 'General' }
function formatDate(value) {
  if (!value) return '-'
  const normalized = typeof value === 'string' ? value.replace(' ', 'T') : value
  return new Date(normalized).toLocaleString('fr-FR')
}
function moduleClass(value) { return { achats: 'bg-violet-100 text-violet-800', alertes: 'bg-cyan-100 text-cyan-800', rh: 'bg-emerald-100 text-emerald-800', stock: 'bg-orange-100 text-orange-800', ventes: 'bg-blue-100 text-blue-800', validation: 'bg-purple-100 text-purple-800' }[value] || 'bg-slate-100 text-slate-700' }
function levelClass(value) { return { danger: 'bg-red-100 text-red-800', warning: 'bg-orange-100 text-orange-800', info: 'bg-blue-100 text-blue-800' }[value] || 'bg-slate-100 text-slate-700' }
function statCardClass(statut) { return filters.statut === statut ? 'border-blue-400 ring-2 ring-blue-100' : 'border-slate-200' }
function apiErrorMessage(error, fallback) { return error?.response?.data?.message || fallback }

onMounted(() => {
  filters.module = typeof route.query.module === 'string' ? route.query.module : ''
  filters.statut = allowedStatuses.includes(route.query.statut) ? route.query.statut : 'non_lues'
  load()
})
</script>
