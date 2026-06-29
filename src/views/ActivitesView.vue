<template>
  <div>
    <div class="mb-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div class="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div class="flex-1">
          <h3 class="text-lg font-bold text-gray-900">Journal des activités</h3>
          <p class="text-sm text-gray-500">Historique métier en temps réel : caisse, ventes, devis, factures, paiements.</p>
        </div>

        <input
          v-model="filters.search"
          type="search"
          class="input lg:w-80"
          placeholder="Rechercher utilisateur, action, chemin..."
        />

        <select v-model="filters.status" class="input lg:w-44">
          <option value="">Tous statuts</option>
          <option value="success">Réussies</option>
          <option value="error">Erreurs</option>
        </select>

        <button @click="loadActivites" :disabled="loading" class="btn-primary whitespace-nowrap">
          {{ loading ? 'Chargement...' : 'Actualiser' }}
        </button>
      </div>
    </div>

    <div class="stat-grid mb-4 grid grid-cols-1 sm:grid-cols-3">
      <div class="rounded-lg border border-gray-200 bg-white p-4">
        <div class="text-xs font-semibold uppercase text-gray-500">Activités affichées</div>
        <div class="mt-1 text-2xl font-bold text-gray-900">{{ filteredActivites.length }}</div>
      </div>
      <div class="rounded-lg border border-gray-200 bg-white p-4">
        <div class="text-xs font-semibold uppercase text-gray-500">Actions réussies</div>
        <div class="mt-1 text-2xl font-bold text-green-700">{{ successCount }}</div>
      </div>
      <div class="rounded-lg border border-gray-200 bg-white p-4">
        <div class="text-xs font-semibold uppercase text-gray-500">Erreurs</div>
        <div class="mt-1 text-2xl font-bold text-red-700">{{ errorCount }}</div>
      </div>
    </div>

    <div v-if="loading" class="rounded-lg bg-white p-12 text-center text-gray-500">
      Chargement du journal...
    </div>

    <div v-else class="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="border-b border-gray-200 bg-gray-50">
            <tr>
              <SortableTh column="date" :active="sort.key === 'date'" :icon="sortIcon('date')" @sort="toggleSort">Date</SortableTh>
              <SortableTh column="utilisateur" :active="sort.key === 'utilisateur'" :icon="sortIcon('utilisateur')" @sort="toggleSort">Utilisateur</SortableTh>
              <SortableTh column="activite" :active="sort.key === 'activite'" :icon="sortIcon('activite')" @sort="toggleSort">Activité</SortableTh>
              <SortableTh column="reference" :active="sort.key === 'reference'" :icon="sortIcon('reference')" @sort="toggleSort">Référence</SortableTh>
              <SortableTh column="statut" :active="sort.key === 'statut'" :icon="sortIcon('statut')" align="center" @sort="toggleSort">Statut</SortableTh>
              <SortableTh column="ip" :active="sort.key === 'ip'" :icon="sortIcon('ip')" @sort="toggleSort">IP</SortableTh>
            </tr>
          </thead>

          <tbody class="divide-y divide-gray-100">
            <tr v-for="(item, index) in paginatedActivites" :key="`${item.date}-${index}`" class="hover:bg-gray-50">
              <td class="whitespace-nowrap px-4 py-3 text-sm text-gray-600">{{ item.date || '-' }}</td>
              <td class="px-4 py-3">
                <div class="text-sm font-semibold text-gray-900">{{ item.user_name || 'Invité' }}</div>
                <div class="text-xs text-gray-500">{{ item.user_role || '-' }}</div>
              </td>
              <td class="px-4 py-3">
                <div class="text-sm font-medium text-gray-900">{{ item.title || item.action || '-' }}</div>
                <div class="mt-1 text-xs uppercase tracking-wide text-cyan-700">{{ item.category || 'activité' }}</div>
                <div v-if="item.description" class="mt-1 text-xs text-gray-500">{{ item.description }}</div>
                <div v-if="item.error" class="mt-1 text-xs text-red-600">{{ item.error }}</div>
              </td>
              <td class="px-4 py-3">
                <div class="font-mono text-xs text-gray-600">{{ item.reference || '-' }}</div>
                <div v-if="item.amount !== null && item.amount !== undefined" class="mt-1 text-sm font-semibold text-gray-900">
                  {{ formatAmount(item.amount) }}
                </div>
                <details v-if="hasPayload(item)" class="mt-1 text-xs text-gray-500">
                  <summary class="cursor-pointer text-cyan-700">Détails</summary>
                  <pre class="mt-2 max-w-xl overflow-x-auto rounded bg-gray-50 p-2">{{ formatPayload(item.payload) }}</pre>
                </details>
              </td>
              <td class="px-4 py-3 text-center">
                <span class="rounded-full px-2 py-1 text-xs font-bold" :class="statusClass(item.status)">
                  {{ item.status || '-' }}
                </span>
              </td>
              <td class="whitespace-nowrap px-4 py-3 font-mono text-xs text-gray-600">{{ item.ip || '-' }}</td>
            </tr>

            <tr v-if="filteredActivites.length === 0">
              <td colspan="6" class="px-4 py-12 text-center text-sm text-gray-400">
                Aucune activité trouvée
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <AppPagination v-if="pageMeta.total > 0" :meta="pageMeta" label="activités" @page="page = $event" />
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import api from '@/services/api'
import AppPagination from '@/components/AppPagination.vue'
import SortableTh from '@/components/SortableTh.vue'
import { useToast } from '@/composables/useToast'
import { useTableSort } from '@/composables/useTableSort'

const toast = useToast()
const loading = ref(false)
const activites = ref([])
const logFile = ref('')
const filters = reactive({ search: '', status: '' })
const page = ref(1)
const perPage = 25
const { sort, toggleSort, sortIcon, sortedRows } = useTableSort('date', 'desc')

const filteredActivites = computed(() => {
  const search = filters.search.trim().toLowerCase()

  return activites.value.filter((item) => {
    const status = Number(item.status || 0)
    const statusOk = !filters.status
      || (filters.status === 'success' && status >= 200 && status < 400)
      || (filters.status === 'error' && status >= 400)

    if (!statusOk) return false
    if (!search) return true

    return [
      item.date,
      item.user_name,
      item.user_role,
      item.category,
      item.event,
      item.title,
      item.description,
      item.reference,
      item.action,
      item.method,
      item.path,
      item.ip,
      item.error,
    ].some(value => String(value || '').toLowerCase().includes(search))
  })
})

const successCount = computed(() => filteredActivites.value.filter(item => Number(item.status || 0) < 400).length)
const errorCount = computed(() => filteredActivites.value.filter(item => Number(item.status || 0) >= 400).length)
const sortedActivites = computed(() => sortedRows(filteredActivites.value, {
  date: 'date',
  utilisateur: (item) => item.user_name || '',
  activite: (item) => item.title || item.action || '',
  reference: 'reference',
  statut: (item) => Number(item.status || 0),
  ip: 'ip',
}))

const paginatedActivites = computed(() => {
  const start = (page.value - 1) * perPage
  return sortedActivites.value.slice(start, start + perPage)
})

const pageMeta = computed(() => {
  const total = sortedActivites.value.length
  const lastPage = Math.max(Math.ceil(total / perPage), 1)
  const current = Math.min(page.value, lastPage)
  const from = total ? (current - 1) * perPage + 1 : 0
  const to = Math.min(current * perPage, total)

  return { current_page: current, last_page: lastPage, total, from, to }
})

async function loadActivites() {
  loading.value = true
  try {
    const { data } = await api.get('/activites', { params: { limit: 500 } })
    activites.value = data.data || []
    logFile.value = data.file || ''
    page.value = 1
  } catch (e) {
    toast.error(e.response.data.message || 'Impossible de charger les activités')
  } finally {
    loading.value = false
  }
}

function statusClass(status) {
  const code = Number(status || 0)
  if (code >= 500) return 'bg-red-100 text-red-700'
  if (code >= 400) return 'bg-orange-100 text-orange-700'
  if (code >= 300) return 'bg-blue-100 text-blue-700'
  return 'bg-green-100 text-green-700'
}

function hasPayload(item) {
  return item.payload && Object.keys(item.payload).length > 0
}

function formatPayload(payload) {
  return JSON.stringify(payload, null, 2)
}

function formatAmount(amount) {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Number(amount || 0))
}

onMounted(loadActivites)

watch(filters, () => {
  page.value = 1
})
</script>
