<template>
  <div>
    <div v-if="!canSeeActivities" class="rounded-2xl border border-orange-200 bg-orange-50 p-6 text-orange-800 shadow-sm">
      <h3 class="text-lg font-bold">Accès réservé</h3>
      <p class="mt-1 text-sm">Le journal des activités est visible uniquement par les administrateurs et les gérants.</p>
    </div>

    <template v-else>
      <div class="mb-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div class="flex flex-col gap-4 xl:flex-row xl:items-end">
          <div class="flex-1">
            <div class="inline-flex rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-700">
              Administration · Admin & gérants
            </div>
            <h3 class="mt-2 text-xl font-bold text-gray-900">Journal des activités</h3>
            <p class="mt-1 text-sm text-gray-500">
              Suivi détaillé des actions : devis, factures, paiements, dépenses, achats, stock, caisse, leasing et utilisateurs.
            </p>
            <p v-if="updatedAt" class="mt-1 text-xs text-gray-400">
              Dernière actualisation : {{ formatDateTime(updatedAt) }}
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <button
              type="button"
              class="btn-secondary whitespace-nowrap"
              :disabled="!hasActiveFilters"
              @click="resetFilters"
            >
              Réinitialiser
            </button>
            <button
              type="button"
              class="btn-secondary whitespace-nowrap"
              :disabled="filteredActivites.length === 0"
              @click="exportCsv"
            >
              Export CSV
            </button>
            <button @click="loadActivites" :disabled="loading" class="btn-primary whitespace-nowrap">
              {{ loading ? 'Chargement...' : 'Actualiser' }}
            </button>
          </div>
        </div>

        <div class="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
          <input
            v-model="filters.search"
            type="search"
            class="input xl:col-span-2"
            placeholder="Rechercher utilisateur, référence, client, action..."
          />

          <select v-model="filters.category" class="input">
            <option value="">Toutes catégories</option>
            <option v-for="category in availableCategories" :key="category" :value="category">
              {{ categoryLabel(category) }}
            </option>
          </select>

          <select v-model="filters.user_id" class="input">
            <option value="">Tous utilisateurs</option>
            <option v-for="user in availableUsers" :key="user.id" :value="String(user.id)">
              {{ user.name }} · {{ roleLabel(user.role) }}
            </option>
          </select>

          <select v-model="filters.status" class="input">
            <option value="">Tous statuts</option>
            <option value="success">Réussies</option>
            <option value="error">Erreurs</option>
          </select>

          <div class="grid grid-cols-2 gap-2">
            <input v-model="filters.date_from" type="date" class="input" />
            <input v-model="filters.date_to" type="date" class="input" />
          </div>
        </div>

        <div v-if="topCategories.length" class="mt-3 flex flex-wrap items-center gap-2">
          <span class="text-xs font-semibold uppercase tracking-wide text-gray-400">Accès rapide</span>
          <button
            v-for="item in topCategories"
            :key="item.category"
            type="button"
            class="rounded-full border px-3 py-1 text-xs font-semibold transition"
            :class="filters.category === item.category ? 'border-cyan-500 bg-cyan-50 text-cyan-700' : 'border-gray-200 bg-white text-gray-600 hover:border-cyan-300 hover:text-cyan-700'"
            @click="filters.category = item.category"
          >
            {{ categoryLabel(item.category) }} · {{ item.count }}
          </button>
        </div>
      </div>

      <div class="stat-grid mb-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        <div class="rounded-2xl border border-blue-200 bg-blue-50 p-4">
          <div class="text-xs font-semibold uppercase text-blue-600">Activités affichées</div>
          <div class="mt-1 text-2xl font-bold text-blue-800">{{ filteredActivites.length }}</div>
        </div>
        <div class="rounded-2xl border border-green-200 bg-green-50 p-4">
          <div class="text-xs font-semibold uppercase text-green-600">Actions réussies</div>
          <div class="mt-1 text-2xl font-bold text-green-700">{{ successCount }}</div>
        </div>
        <div class="rounded-2xl border border-red-200 bg-red-50 p-4">
          <div class="text-xs font-semibold uppercase text-red-600">Erreurs</div>
          <div class="mt-1 text-2xl font-bold text-red-700">{{ errorCount }}</div>
        </div>
        <div class="rounded-2xl border border-cyan-200 bg-cyan-50 p-4">
          <div class="text-xs font-semibold uppercase text-cyan-600">Catégories actives</div>
          <div class="mt-1 text-2xl font-bold text-cyan-800">{{ availableCategories.length }}</div>
        </div>
      </div>


      <div class="mb-4 overflow-hidden rounded-2xl border border-red-100 bg-white shadow-sm">
        <div class="flex flex-col gap-3 border-b border-red-100 bg-red-50/60 p-4 lg:flex-row lg:items-end">
          <div class="flex-1">
            <div class="text-xs font-semibold uppercase tracking-wide text-red-600">Corbeille des suppressions</div>
            <h3 class="mt-1 text-lg font-bold text-gray-900">&Eacute;l&eacute;ments supprim&eacute;s restaurables</h3>
            <p class="mt-1 text-sm text-gray-500">
              Les suppressions r&eacute;versibles de l&rsquo;application sont centralis&eacute;es ici. Restauration r&eacute;serv&eacute;e aux administrateurs et g&eacute;rants.
            </p>
          </div>
          <div class="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:w-[680px]">
            <input v-model="trashFilters.search" type="search" class="input" placeholder="Rechercher dans la corbeille..." @keyup.enter="loadCorbeille" />
            <select v-model="trashFilters.type" class="input" @change="loadCorbeille">
              <option value="">Tous les types</option>
              <option v-for="type in trashTypes" :key="type.type" :value="type.type">{{ type.label }}</option>
            </select>
            <button type="button" class="btn-secondary" :disabled="trashLoading" @click="loadCorbeille">
              {{ trashLoading ? 'Chargement...' : 'Actualiser corbeille' }}
            </button>
          </div>
        </div>

        <div v-if="trashLoading" class="p-8 text-center text-sm text-gray-500">Chargement de la corbeille...</div>
        <div v-else-if="trashItems.length === 0" class="p-8 text-center text-sm text-gray-400">Aucune suppression restaurable pour le moment.</div>
        <div v-else class="overflow-x-auto">
          <table class="w-full min-w-[1080px]">
            <thead class="bg-white text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th class="px-4 py-3 text-left">Suppression</th>
                <th class="px-4 py-3 text-left">Type / module</th>
                <th class="px-4 py-3 text-left">&Eacute;l&eacute;ment</th>
                <th class="px-4 py-3 text-left">D&eacute;tails</th>
                <th class="px-4 py-3 text-right">Montant</th>
                <th class="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="item in trashItems" :key="`${item.type}-${item.id}`" class="hover:bg-red-50/30">
                <td class="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                  <div class="font-medium text-gray-900">{{ formatDate(item.deleted_at) }}</div>
                  <div class="text-xs text-gray-400">{{ formatTime(item.deleted_at) }}</div>
                </td>
                <td class="px-4 py-3">
                  <span class="inline-flex rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-700">{{ item.type_label }}</span>
                  <div class="mt-1 text-xs text-gray-500">{{ item.module }}</div>
                </td>
                <td class="px-4 py-3">
                  <div class="font-mono text-xs font-semibold text-gray-800">{{ item.reference || item.label }}</div>
                  <div class="mt-1 text-sm text-gray-600">{{ item.label }}</div>
                  <RouterLink v-if="item.route" :to="item.route" class="mt-1 inline-flex text-xs font-semibold text-cyan-700 hover:underline">Ouvrir le module</RouterLink>
                </td>
                <td class="px-4 py-3">
                  <div v-if="item.details?.length" class="grid max-w-xl grid-cols-1 gap-1 text-xs sm:grid-cols-2">
                    <div v-for="detail in item.details" :key="`${item.type}-${item.id}-${detail.label}`" class="rounded-lg bg-gray-50 px-2 py-1">
                      <span class="font-semibold text-gray-500">{{ detail.label }} :</span>
                      <span class="ml-1 text-gray-800">{{ formatShortValue(detail.value) }}</span>
                    </div>
                  </div>
                  <span v-else class="text-xs text-gray-400">-</span>
                </td>
                <td class="px-4 py-3 text-right text-sm font-bold text-gray-900">
                  <span v-if="item.amount !== null && item.amount !== undefined">{{ formatAmount(item.amount) }}</span>
                  <span v-else class="text-gray-300">-</span>
                </td>
                <td class="px-4 py-3 text-right">
                  <button type="button" class="rounded-full bg-green-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-green-700 disabled:opacity-50" :disabled="trashLoading" @click="restoreTrashItem(item)">
                    Restaurer
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-if="loading" class="rounded-2xl bg-white p-12 text-center text-gray-500 shadow-sm">
        Chargement du journal...
      </div>

      <div v-else class="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div class="overflow-x-auto">
          <table class="w-full min-w-[1180px]">
            <thead class="border-b border-gray-200 bg-gray-50">
              <tr>
                <SortableTh column="date" :active="sort.key === 'date'" :icon="sortIcon('date')" @sort="toggleSort">Date</SortableTh>
                <SortableTh column="utilisateur" :active="sort.key === 'utilisateur'" :icon="sortIcon('utilisateur')" @sort="toggleSort">Utilisateur</SortableTh>
                <SortableTh column="categorie" :active="sort.key === 'categorie'" :icon="sortIcon('categorie')" @sort="toggleSort">Catégorie</SortableTh>
                <SortableTh column="activite" :active="sort.key === 'activite'" :icon="sortIcon('activite')" @sort="toggleSort">Activité</SortableTh>
                <SortableTh column="reference" :active="sort.key === 'reference'" :icon="sortIcon('reference')" @sort="toggleSort">Objet / montant</SortableTh>
                <th class="px-4 py-2 text-left text-xs font-bold uppercase tracking-wide text-gray-600">D&eacute;tails</th>
                <SortableTh column="statut" :active="sort.key === 'statut'" :icon="sortIcon('statut')" align="center" @sort="toggleSort">Statut</SortableTh>
                <SortableTh column="ip" :active="sort.key === 'ip'" :icon="sortIcon('ip')" @sort="toggleSort">Technique</SortableTh>
              </tr>
            </thead>

            <tbody class="divide-y divide-gray-100">
              <tr v-for="(item, index) in paginatedActivites" :key="`${item.date}-${item.id || index}`" class="align-middle hover:bg-gray-50">
                <td class="whitespace-nowrap px-4 py-2 text-sm text-gray-600">
                  <div class="font-medium text-gray-900">{{ formatDate(item.date) }}</div>
                  <div class="text-xs text-gray-400">{{ formatTime(item.date) }}</div>
                </td>

                <td class="px-4 py-2">
                  <div class="text-sm font-semibold text-gray-900">{{ item.user_name || 'Système' }}</div>
                  <div class="text-xs text-gray-500">{{ roleLabel(item.user_role) }}</div>
                </td>

                <td class="px-4 py-2">
                  <span class="inline-flex rounded-full px-2.5 py-1 text-xs font-bold" :class="categoryClass(item.category)">
                    {{ categoryLabel(item.category) }}
                  </span>
                  <div class="mt-2 max-w-[170px] truncate font-mono text-[11px] text-gray-400">{{ item.event || '-' }}</div>
                </td>

                <td class="px-4 py-2">
                  <div class="text-sm font-semibold text-gray-900">{{ item.title || item.action || '-' }}</div>
                  <div v-if="item.description" class="mt-1 max-w-md truncate text-xs text-gray-500">{{ item.description }}</div>
                  <div v-if="item.error" class="mt-1 rounded-lg bg-red-50 px-2 py-1 text-xs text-red-700">{{ item.error }}</div>
                </td>

                <td class="px-4 py-2">
                  <div class="font-mono text-xs font-semibold text-gray-700">{{ item.subject_label || item.reference || '-' }}</div>
                  <div v-if="item.subject_module || item.subject_type" class="mt-1 text-[11px] text-gray-400">
                    {{ item.subject_module || subjectTypeLabel(item.subject_type) }}<span v-if="item.subject_id"> #{{ item.subject_id }}</span>
                  </div>
                  <RouterLink
                    v-if="item.subject_route"
                    :to="item.subject_route"
                    class="mt-2 inline-flex rounded-full bg-cyan-50 px-2.5 py-1 text-[11px] font-semibold text-cyan-700 hover:bg-cyan-100"
                  >
                    Ouvrir le module
                  </RouterLink>
                  <div v-if="item.amount !== null && item.amount !== undefined" class="mt-2 text-sm font-bold text-gray-900">
                    {{ formatAmount(item.amount) }}
                  </div>
                </td>

                <td class="px-4 py-2 text-center">
                  <button
                    v-if="activityHasDetails(item)"
                    type="button"
                    class="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-700 hover:bg-cyan-100"
                    @click="openActivityDetails(item)"
                  >
                    Visualiser
                  </button>
                  <span v-else class="text-xs text-gray-300">-</span>
                </td>

                <td class="px-4 py-2 text-center">
                  <span class="rounded-full px-2 py-1 text-xs font-bold" :class="statusClass(item.status)">
                    {{ statusText(item.status) }}
                  </span>
                </td>

                <td class="px-4 py-2 text-xs text-gray-500">
                  <div class="font-mono">{{ item.ip || '-' }}</div>
                  <div v-if="item.method || item.path" class="mt-1 max-w-[190px] truncate font-mono text-[11px] text-gray-400">
                    {{ item.method || '' }} {{ item.path || '' }}
                  </div>
                </td>
              </tr>

              <tr v-if="filteredActivites.length === 0">
                <td colspan="8" class="px-4 py-12 text-center text-sm text-gray-400">
                  Aucune activité trouvée
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <AppPagination v-if="pageMeta.total > 0" :meta="pageMeta" label="activités" @page="page = $event" />
      </div>
    </template>

    <div v-if="selectedActivity" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4" @click.self="closeActivityDetails">
      <div class="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div class="flex items-start justify-between gap-4 border-b border-gray-100 p-5">
          <div>
            <div class="inline-flex rounded-full px-2.5 py-1 text-xs font-bold" :class="categoryClass(selectedActivity.category)">
              {{ categoryLabel(selectedActivity.category) }}
            </div>
            <h3 class="mt-2 text-lg font-bold text-gray-900">Visualisation de l&rsquo;activit&eacute;</h3>
            <p class="mt-1 text-sm text-gray-500">
              {{ formatDateTime(selectedActivity.date) }} &middot; {{ selectedActivity.user_name || 'Syst\u00e8me' }}
            </p>
          </div>
          <button type="button" class="rounded-full px-3 py-1 text-2xl leading-none text-gray-400 hover:bg-gray-100 hover:text-gray-700" @click="closeActivityDetails">&times;</button>
        </div>

        <div class="max-h-[70vh] overflow-y-auto p-5">
          <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div class="rounded-xl bg-gray-50 p-3">
              <div class="text-xs font-semibold uppercase text-gray-400">Action</div>
              <div class="mt-1 text-sm font-bold text-gray-900">{{ selectedActivity.title || selectedActivity.action || '-' }}</div>
              <div v-if="selectedActivity.description" class="mt-1 text-sm text-gray-600">{{ selectedActivity.description }}</div>
            </div>
            <div class="rounded-xl bg-gray-50 p-3">
              <div class="text-xs font-semibold uppercase text-gray-400">Objet</div>
              <div class="mt-1 font-mono text-sm font-bold text-gray-900">{{ selectedActivity.subject_label || selectedActivity.reference || '-' }}</div>
              <div class="mt-1 text-xs text-gray-500">{{ selectedActivity.subject_module || subjectTypeLabel(selectedActivity.subject_type) || '-' }}</div>
            </div>
            <div class="rounded-xl bg-gray-50 p-3">
              <div class="text-xs font-semibold uppercase text-gray-400">Utilisateur</div>
              <div class="mt-1 text-sm font-bold text-gray-900">{{ selectedActivity.user_name || 'Syst\u00e8me' }}</div>
              <div class="mt-1 text-xs text-gray-500">{{ roleLabel(selectedActivity.user_role) }}</div>
            </div>
            <div class="rounded-xl bg-gray-50 p-3">
              <div class="text-xs font-semibold uppercase text-gray-400">Technique</div>
              <div class="mt-1 font-mono text-xs text-gray-700">{{ selectedActivity.method || '-' }} {{ selectedActivity.path || '' }}</div>
              <div class="mt-1 font-mono text-xs text-gray-500">IP : {{ selectedActivity.ip || '-' }}</div>
            </div>
          </div>

          <div v-if="selectedActivity.error" class="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
            {{ selectedActivity.error }}
          </div>

          <div v-if="selectedActivityDetails.length" class="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2">
            <div v-for="detail in selectedActivityDetails" :key="`${detail.label}-${detail.value}`" class="rounded-xl border border-gray-100 bg-white px-3 py-2 text-sm">
              <span class="font-semibold text-gray-500">{{ detail.label }} :</span>
              <span class="ml-1 text-gray-900">{{ detail.value }}</span>
            </div>
          </div>

          <div v-if="hasPayload(selectedActivity)" class="mt-4">
            <div class="mb-2 text-xs font-semibold uppercase text-gray-400">Donn&eacute;es techniques compl&egrave;tes</div>
            <pre class="max-h-72 overflow-auto rounded-xl bg-slate-950 p-3 text-[11px] leading-5 text-slate-100">{{ formatPayload(selectedActivity.payload) }}</pre>
          </div>
        </div>
      </div>
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
import { useAuthStore } from '@/stores/auth'

const toast = useToast()
const auth = useAuthStore()
const loading = ref(false)
const activites = ref([])
const logFile = ref('')
const updatedAt = ref(null)
const apiCategories = ref([])
const apiUsers = ref([])
const trashLoading = ref(false)
const trashItems = ref([])
const trashTypes = ref([])
const trashFilters = reactive({ search: '', type: '' })
const selectedActivity = ref(null)
const filters = reactive({ search: '', status: '', category: '', user_id: '', date_from: '', date_to: '' })
const page = ref(1)
const perPage = 25
const { sort, toggleSort, sortIcon, sortedRows } = useTableSort('date', 'desc')

const canSeeActivities = computed(() => ['admin', 'gerant'].includes(auth.user?.role))

const availableCategories = computed(() => {
  const values = new Set(apiCategories.value)
  activites.value.forEach(item => item.category && values.add(item.category))
  return Array.from(values).sort((a, b) => categoryLabel(a).localeCompare(categoryLabel(b)))
})

const availableUsers = computed(() => {
  const map = new Map()
  apiUsers.value.forEach(user => user?.id && map.set(String(user.id), user))
  activites.value.forEach((item) => {
    if (item.user_id) map.set(String(item.user_id), { id: item.user_id, name: item.user_name || `Utilisateur ${item.user_id}`, role: item.user_role })
  })
  return Array.from(map.values()).sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')))
})


const activeModulesCount = computed(() => {
  const modules = new Set()
  filteredActivites.value.forEach((item) => {
    const label = item.subject_module || subjectTypeLabel(item.subject_type)
    if (label) modules.add(label)
  })
  return modules.size
})

const topCategories = computed(() => {
  const counts = new Map()
  activites.value.forEach((item) => {
    if (!item.category) return
    counts.set(item.category, (counts.get(item.category) || 0) + 1)
  })
  return Array.from(counts.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count || categoryLabel(a.category).localeCompare(categoryLabel(b.category)))
    .slice(0, 8)
})

const hasActiveFilters = computed(() => Object.values(filters).some(value => String(value || '').trim() !== ''))

const filteredActivites = computed(() => {
  const search = filters.search.trim().toLowerCase()

  return activites.value.filter((item) => {
    const status = Number(item.status || 0)
    const statusOk = !filters.status
      || (filters.status === 'success' && status >= 200 && status < 400)
      || (filters.status === 'error' && status >= 400)

    if (!statusOk) return false
    if (filters.category && item.category !== filters.category) return false
    if (filters.user_id && String(item.user_id || '') !== String(filters.user_id)) return false
    if (filters.date_from && dateOnly(item.date) < filters.date_from) return false
    if (filters.date_to && dateOnly(item.date) > filters.date_to) return false
    if (!search) return true

    return searchableValues(item).some(value => String(value || '').toLowerCase().includes(search))
  })
})

const selectedActivityDetails = computed(() => selectedActivity.value ? detailsFor(selectedActivity.value) : [])

const successCount = computed(() => filteredActivites.value.filter(item => Number(item.status || 0) < 400).length)
const errorCount = computed(() => filteredActivites.value.filter(item => Number(item.status || 0) >= 400).length)
const sortedActivites = computed(() => sortedRows(filteredActivites.value, {
  date: 'date',
  utilisateur: (item) => item.user_name || '',
  categorie: (item) => categoryLabel(item.category),
  activite: (item) => item.title || item.action || '',
  reference: (item) => item.subject_label || item.reference || '',
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
  if (!canSeeActivities.value) return

  loading.value = true
  try {
    const { data } = await api.get('/activites', { params: { limit: 1000 } })
    activites.value = data.data || []
    apiCategories.value = data.categories || []
    apiUsers.value = data.users || []
    logFile.value = data.file || ''
    updatedAt.value = new Date()
    page.value = 1
  } catch (e) {
    toast.error(e.response?.data?.message || 'Impossible de charger les activités')
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  Object.assign(filters, { search: '', status: '', category: '', user_id: '', date_from: '', date_to: '' })
}

async function loadCorbeille() {
  if (!canSeeActivities.value) return

  trashLoading.value = true
  try {
    const { data } = await api.get('/corbeille', {
      params: {
        limit: 200,
        search: trashFilters.search || undefined,
        type: trashFilters.type || undefined,
      },
    })
    trashItems.value = data.data || []
    trashTypes.value = data.types || []
  } catch (e) {
    toast.error(e.response?.data?.message || 'Impossible de charger la corbeille')
  } finally {
    trashLoading.value = false
  }
}

async function restoreTrashItem(item) {
  if (!window.confirm(`Restaurer ${item.type_label} ${item.reference || item.label} ?`)) return

  trashLoading.value = true
  try {
    const { data } = await api.post(`/corbeille/${item.type}/${item.id}/restaurer`)
    toast.success(data.message || '\u00c9l\u00e9ment restaur\u00e9')
    await Promise.all([loadCorbeille(), loadActivites()])
  } catch (e) {
    toast.error(e.response?.data?.message || 'Restauration impossible')
  } finally {
    trashLoading.value = false
  }
}

function exportCsv() {
  const headers = ['Date', 'Utilisateur', 'Rôle', 'Catégorie', 'Événement', 'Titre', 'Description', 'Référence', 'Objet', 'Module', 'Montant', 'Statut', 'IP']
  const rows = filteredActivites.value.map(item => [
    formatDateTime(item.date),
    item.user_name || 'Système',
    roleLabel(item.user_role),
    categoryLabel(item.category),
    item.event || '',
    item.title || item.action || '',
    item.description || '',
    item.reference || '',
    item.subject_label || '',
    item.subject_module || subjectTypeLabel(item.subject_type),
    item.amount !== null && item.amount !== undefined ? formatAmount(item.amount) : '',
    statusText(item.status),
    item.ip || '',
  ])

  const csv = [headers, ...rows].map(row => row.map(csvEscape).join(';')).join('\n')
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `journal-activites-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
  toast.success('Export CSV généré')
}

function csvEscape(value) {
  const text = String(value ?? '').replace(/\r?\n/g, ' ')
  return /[;"\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

function searchableValues(item) {
  return [
    item.date,
    item.user_name,
    item.user_role,
    item.category,
    item.event,
    item.title,
    item.description,
    item.reference,
    item.subject_label,
    item.subject_module,
    subjectTypeLabel(item.subject_type),
    JSON.stringify(item.details || []),
    item.action,
    item.method,
    item.path,
    item.ip,
    item.error,
    JSON.stringify(item.payload || {}),
  ]
}

function detailsFor(item) {
  const details = []
  const payload = item.payload || {}
  const metadata = item.metadata || payload.metadata || {}

  if (Array.isArray(item.details)) {
    item.details.forEach((detail) => {
      if (!detail?.label || detail.value === null || detail.value === undefined || detail.value === '') return
      details.push({ label: detail.label, value: formatShortValue(detail.value) })
    })
  }

  appendObjectDetails(details, metadata, 'Meta')

  Object.entries(payload).forEach(([key, value]) => {
    if (key === 'metadata') return
    appendValueDetail(details, key, value)
  })

  return uniqueDetails(details)
}

function appendObjectDetails(details, object, prefix = '') {
  if (!object || typeof object !== 'object' || Array.isArray(object)) return

  Object.entries(object).forEach(([key, value]) => {
    appendValueDetail(details, prefix ? `${prefix} ${key}` : key, value)
  })
}

function appendValueDetail(details, key, value) {
  if (value === null || value === undefined || value === '') return

  if (Array.isArray(value)) {
    details.push({ label: humanizeKey(key), value: `${value.length} élément(s)` })
    return
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value).filter(([, child]) => child !== null && child !== undefined && child !== '')
    const short = entries.slice(0, 3).map(([childKey, childValue]) => `${humanizeKey(childKey)}: ${formatShortValue(childValue)}`).join(' · ')
    details.push({ label: humanizeKey(key), value: short || 'Objet renseigné' })
    return
  }

  details.push({ label: humanizeKey(key), value: formatShortValue(value) })
}

function uniqueDetails(details) {
  const seen = new Set()
  return details.filter((detail) => {
    const key = `${detail.label}:${detail.value}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function humanizeKey(key) {
  return String(key || '')
    .replace(/_/g, ' ')
    .replace(/\bid\b/gi, 'ID')
    .replace(/\bttc\b/gi, 'TTC')
    .replace(/\bht\b/gi, 'HT')
    .replace(/\btva\b/gi, 'TVA')
    .replace(/^./, char => char.toUpperCase())
}

function formatShortValue(value) {
  if (value === true) return 'Oui'
  if (value === false) return 'Non'
  if (typeof value === 'number') return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(value)
  const text = String(value)
  return text.length > 90 ? `${text.slice(0, 87)}...` : text
}

function activityHasDetails(item) {
  return detailsFor(item).length > 0 || hasPayload(item) || Boolean(item.error)
}

function openActivityDetails(item) {
  selectedActivity.value = item
}

function closeActivityDetails() {
  selectedActivity.value = null
}

function hasPayload(item) {
  return item?.payload && Object.keys(item.payload).length > 0
}

function formatPayload(payload) {
  return JSON.stringify(payload, null, 2)
}

function formatAmount(amount) {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Number(amount || 0))
}

function dateOnly(value) {
  if (!value) return ''
  return String(value).slice(0, 10)
}

function formatDate(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10)
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date)
}

function formatTime(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value).slice(11, 16)
  return new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(date)
}

function formatDateTime(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function statusText(status) {
  const code = Number(status || 0)
  if (!code) return '-'
  if (code >= 500) return `${code} Erreur`
  if (code >= 400) return `${code} Rejetée`
  if (code >= 300) return `${code} Redirection`
  return `${code} OK`
}

function statusClass(status) {
  const code = Number(status || 0)
  if (code >= 500) return 'bg-red-100 text-red-700'
  if (code >= 400) return 'bg-orange-100 text-orange-700'
  if (code >= 300) return 'bg-blue-100 text-blue-700'
  return 'bg-green-100 text-green-700'
}

function categoryLabel(category) {
  return {
    achat: 'Achat',
    client: 'Client',
    caisse: 'Caisse',
    depense: 'Dépense',
    devis: 'Devis',
    facture: 'Facture',
    general: 'Général',
    leasing: 'Leasing',
    paiement: 'Paiement',
    restauration: 'Restauration',
    suppression: 'Suppression',
    prospection: 'Prospection',
    rh: 'RH',
    stock: 'Stock',
    utilisateur: 'Utilisateur',
  }[category] || humanizeKey(category || 'activité')
}

function categoryClass(category) {
  if (String(category || '').startsWith('rh')) return 'bg-purple-100 text-purple-700'
  return {
    achat: 'bg-orange-100 text-orange-700',
    client: 'bg-cyan-100 text-cyan-700',
    caisse: 'bg-green-100 text-green-700',
    depense: 'bg-red-100 text-red-700',
    devis: 'bg-blue-100 text-blue-700',
    facture: 'bg-indigo-100 text-indigo-700',
    general: 'bg-slate-100 text-slate-700',
    leasing: 'bg-violet-100 text-violet-700',
    paiement: 'bg-emerald-100 text-emerald-700',
    restauration: 'bg-green-100 text-green-700',
    suppression: 'bg-red-100 text-red-700',
    prospection: 'bg-sky-100 text-sky-700',
    stock: 'bg-amber-100 text-amber-700',
  }[category] || 'bg-gray-100 text-gray-700'
}

function subjectTypeLabel(subjectType) {
  if (!subjectType) return ''
  const name = String(subjectType).split('\\').pop()
  return {
    AchatCommande: 'Bon de commande fournisseur',
    AchatDemande: 'Demande achat',
    CaisseMouvement: 'Mouvement caisse',
    CaisseSession: 'Session caisse',
    Client: 'Client/Fournisseur',
    Depense: 'Dépense',
    Devis: 'Devis',
    Facture: 'Facture',
    FournisseurFacture: 'Facture fournisseur',
    FournisseurReglement: 'Règlement fournisseur',
    LeasingContrat: 'Contrat leasing',
    LeasingImprimante: 'Imprimante leasing',
    LeasingIntervention: 'Intervention leasing',
    LeasingReleve: 'Relevé leasing',
    Paiement: 'Paiement',
    Produit: 'Produit',
    User: 'Utilisateur',
  }[name] || name
}

function roleLabel(role) {
  return {
    admin: 'Administrateur',
    gerant: 'Gérant',
    commercial: 'Commercial',
    magasinier: 'Gestionnaire de stock',
    comptable: 'Comptable',
    caissier: 'Caissier',
  }[role] || role || '-'
}

onMounted(() => {
  loadActivites()
  loadCorbeille()
})

watch(filters, () => {
  page.value = 1
})

watch(trashFilters, () => {
  loadCorbeille()
})
</script>
