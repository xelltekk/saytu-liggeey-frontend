<template>
  <div class="space-y-4">
    <section class="rounded-lg border border-slate-200 bg-white p-4">
      <div class="flex flex-col gap-3 lg:flex-row lg:items-end">
        <div class="flex-1">
          <h2 class="text-xl font-bold text-slate-900">Centre de notifications</h2>
          <p class="text-sm text-slate-500">Alertes de gestion, achats, RH, stock, ventes et validations.</p>
        </div>
        <select v-model="filters.module" class="input lg:w-48" @change="load">
          <option value="">Tous modules</option>
          <option v-for="module in modules" :key="module.id" :value="module.id">{{ module.label }}</option>
        </select>
        <select v-model="filters.statut" class="input lg:w-44" @change="load">
          <option value="non_lues">Non lues</option>
          <option value="lues">Lues</option>
          <option value="toutes">Toutes</option>
        </select>
        <button class="btn-secondary" @click="load">Actualiser</button>
        <button class="btn-primary" :disabled="stats.non_lues === 0" @click="markAllRead">Tout marquer comme lu</button>
      </div>
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
        <button v-for="item in items" :key="item.key" type="button" class="block w-full p-4 text-left transition hover:bg-slate-50" @click="openNotification(item)">
          <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <span class="badge" :class="moduleClass(item.module)">{{ moduleLabel(item.module) }}</span>
                <span class="badge" :class="levelClass(item.level)">{{ item.level || 'info' }}</span>
                <span class="badge" :class="item.read ? 'bg-slate-100 text-slate-600' : 'bg-red-100 text-red-700'">{{ item.read ? 'Lu' : 'Non lu' }}</span>
              </div>
              <h3 class="mt-2 font-bold text-slate-900">{{ item.title }}</h3>
              <p class="mt-1 text-sm text-slate-500">{{ item.message }}</p>
            </div>
            <p class="shrink-0 text-xs text-slate-500">{{ formatDate(item.date) }}</p>
          </div>
        </button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'
import { useNotificationsStore } from '@/stores/notifications'

const router = useRouter()
const toast = useToast()
const notifications = useNotificationsStore()
const loading = ref(false)
const items = ref([])
const modules = ref([])
const stats = reactive({ total: 0, non_lues: 0, lues: 0 })
const filters = reactive({ module: '', statut: 'non_lues' })

async function load() {
  loading.value = true
  try {
    const { data } = await api.get('/notifications/centre', { params: filters })
    items.value = data.data || []
    modules.value = data.modules || []
    Object.assign(stats, data.stats || {})
  } catch (e) {
    toast.error(e.response.data.message || 'Impossible de charger les notifications.')
  } finally {
    loading.value = false
  }
}

async function markAllRead() {
  try {
    await api.post('/notifications/read-all')
    await Promise.all([load(), notifications.fetchBadges()])
    toast.success('Toutes les notifications ont ete marquees comme lues.')
  } catch (e) {
    toast.error(e.response.data.message || 'Action impossible.')
  }
}

function setStatus(statut) {
  filters.statut = statut
  load()
}

async function openNotification(item) {
  await notifications.markRead(item.key)
  await load()
  router.push({ path: item.route || '/', query: item.query || {} })
}

function moduleLabel(value) { return modules.value.find(module => module.id === value)?.label || value || 'General' }
function formatDate(value) { return value ? new Date(value.replace(' ', 'T')).toLocaleString('fr-FR') : '-' }
function moduleClass(value) { return { achats: 'bg-violet-100 text-violet-800', rh: 'bg-emerald-100 text-emerald-800', stock: 'bg-orange-100 text-orange-800', ventes: 'bg-blue-100 text-blue-800', validation: 'bg-purple-100 text-purple-800' }[value] || 'bg-slate-100 text-slate-700' }
function levelClass(value) { return { danger: 'bg-red-100 text-red-800', warning: 'bg-orange-100 text-orange-800', info: 'bg-blue-100 text-blue-800' }[value] || 'bg-slate-100 text-slate-700' }
function statCardClass(statut) { return filters.statut === statut ? 'border-blue-400 ring-2 ring-blue-100' : 'border-slate-200' }

onMounted(load)
</script>
