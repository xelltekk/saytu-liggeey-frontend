<template>
  <div>
    <!-- Header -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
      <div class="flex flex-col md:flex-row gap-3">
        <input
          v-model="filters.search"
          @input="onSearchInput"
          type="search"
          placeholder="🔍 Numéro, objet, nom du client..."
          class="input flex-1"
        />

        <select v-model="filters.statut" @change="loadDevis(1)" class="input md:w-44">
          <option value="">Tous statuts</option>
          <option value="brouillon">Brouillon</option>
          <option value="envoye">Envoyé</option>
          <option value="accepte">Accepté</option>
          <option value="refuse">Refusé</option>
          <option value="expire">Expiré</option>
          <option value="facture">Facturé</option>
        </select>

        <button @click="exporterCSV" :disabled="exportLoading" class="btn-secondary whitespace-nowrap">
          {{ exportLoading ? 'Export...' : 'Exporter CSV' }}
        </button>

        <button @click="openCreate" class="btn-primary whitespace-nowrap">
          + Nouveau devis
        </button>
      </div>
    </div>

    <!-- Stats -->
    <div class="stat-grid grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 mb-4">
      <button type="button" @click="applyStatutFilter('')" class="text-left bg-white rounded-lg border p-3 transition hover:-translate-y-0.5 hover:border-xelltekk-300 hover:shadow-sm" :class="statCardClass('')">
        <div class="text-xs text-gray-500 uppercase">Total</div>
        <div class="text-2xl font-bold text-gray-900">{{ stats.total || 0 }}</div>
      </button>
      <button type="button" @click="applyStatutFilter('brouillon')" class="text-left bg-white rounded-lg border p-3 transition hover:-translate-y-0.5 hover:border-xelltekk-300 hover:shadow-sm" :class="statCardClass('brouillon')">
        <div class="text-xs text-gray-500 uppercase">Brouillons</div>
        <div class="text-2xl font-bold text-gray-500">{{ stats.brouillons || 0 }}</div>
      </button>
      <button type="button" @click="applyStatutFilter('envoye')" class="text-left bg-white rounded-lg border p-3 transition hover:-translate-y-0.5 hover:border-xelltekk-300 hover:shadow-sm" :class="statCardClass('envoye')">
        <div class="text-xs text-gray-500 uppercase">Envoyés</div>
        <div class="text-2xl font-bold text-blue-600">{{ stats.envoyes || 0 }}</div>
      </button>
      <button type="button" @click="applyStatutFilter('accepte')" class="text-left bg-white rounded-lg border p-3 transition hover:-translate-y-0.5 hover:border-xelltekk-300 hover:shadow-sm" :class="statCardClass('accepte')">
        <div class="text-xs text-gray-500 uppercase">Acceptés</div>
        <div class="text-2xl font-bold text-green-600">{{ stats.acceptes || 0 }}</div>
      </button>
      <button type="button" @click="applyStatutFilter('accepte')" class="text-left bg-white rounded-lg border p-3 transition hover:-translate-y-0.5 hover:border-xelltekk-300 hover:shadow-sm" :class="statCardClass('accepte')">
        <div class="text-xs text-gray-500 uppercase">Montant accepté</div>
        <div class="text-base font-bold text-xelltekk-700">{{ formatPrice(stats.montant_total_acceptes) }}</div>
      </button>
    </div>

    <!-- Loader -->
    <div v-if="loading" class="bg-white rounded-lg p-12 text-center text-gray-500">
      Chargement...
    </div>

    <!-- Tableau -->
    <div v-else class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <SortableTh column="numero" :active="sort.key === 'numero'" :icon="sortIcon('numero')" @sort="toggleSort">N°</SortableTh>
              <SortableTh column="client" :active="sort.key === 'client'" :icon="sortIcon('client')" @sort="toggleSort">Client</SortableTh>
              <SortableTh column="objet" :active="sort.key === 'objet'" :icon="sortIcon('objet')" @sort="toggleSort">Objet</SortableTh>
              <SortableTh column="date" :active="sort.key === 'date'" :icon="sortIcon('date')" align="center" @sort="toggleSort">Date</SortableTh>
              <SortableTh column="validite" :active="sort.key === 'validite'" :icon="sortIcon('validite')" align="center" @sort="toggleSort">Validité</SortableTh>
              <SortableTh column="total" :active="sort.key === 'total'" :icon="sortIcon('total')" align="right" @sort="toggleSort">Total TTC</SortableTh>
              <SortableTh column="statut" :active="sort.key === 'statut'" :icon="sortIcon('statut')" align="center" @sort="toggleSort">Statut</SortableTh>
              <th class="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="devi in sortedDevis" :key="devi.id" class="hover:bg-gray-50">
              <td class="px-4 py-3 text-sm font-mono text-gray-600">{{ devi.numero }}</td>
              <td class="px-4 py-3">
                <div class="font-medium text-gray-900">{{ devi.client?.nom || 'Client non renseigné' }}</div>
                <div class="text-xs text-gray-500">{{ devi.client?.code || '–' }}</div>
                <div class="text-xs text-blue-600">Commercial : {{ devi.commercial?.name || 'Non affecté' }}</div>
              </td>
              <td class="px-4 py-3 text-sm text-gray-700">{{ devi.objet || '–' }}</td>
              <td class="px-4 py-3 text-sm text-center text-gray-600">{{ formatDate(devi.date_devis) }}</td>
              <td class="px-4 py-3 text-sm text-center text-gray-600">{{ formatDate(devi.date_validite) }}</td>
              <td class="px-4 py-3 text-right font-mono font-semibold text-gray-900">
                {{ formatPrice(devi.total_ttc) }}
              </td>
              <td class="px-4 py-3 text-center">
                <span class="badge" :class="statutBadge(devi.statut)">{{ devi.statut }}</span>
              </td>
              <td class="px-4 py-3 text-right whitespace-nowrap">
                <button @click="ouvrirPdf(devi)" class="text-xelltekk-600 hover:text-xelltekk-800 text-sm font-medium mr-2" title="Voir PDF">
                  📄
                </button>
                <button
                  v-if="devi.statut !== 'facture' && devi.statut !== 'refuse'"
                  @click="confirmConvertir(devi)"
                  class="text-green-600 hover:text-green-800 text-sm font-medium mr-2"
                  title="Convertir en facture"
                >
                  🔄
                </button>
                <button
                  @click="handleCloner(devi)"
                  :disabled="cloningId === devi.id"
                  class="text-cyan-700 hover:text-cyan-900 text-sm font-medium mr-2 disabled:opacity-50"
                  title="Cloner ce devis"
                >
                  Cloner
                </button>
                <button @click="openEdit(devi)" class="text-xelltekk-600 hover:text-xelltekk-800 text-sm font-medium mr-2" title="Modifier">
                  ✏️
                </button>
                <button v-if="isAdmin" @click="openAssignDevis(devi)" class="text-indigo-600 hover:text-indigo-800 text-sm font-medium mr-2" title="Affecter">
                  Affecter
                </button>
                <button @click="confirmDelete(devi)" class="text-red-600 hover:text-red-800 text-sm font-medium" title="Supprimer">
                  🗑️
                </button>
              </td>
            </tr>
            <tr v-if="devis.length === 0">
              <td colspan="8" class="px-4 py-12 text-center text-gray-400 text-sm">
                Aucun devis. Cliquez sur "Nouveau devis" pour commencer.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="meta.total > 0" class="px-4 py-3 border-t border-gray-200 flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
        <div class="text-gray-600">
          Affichage de <strong>{{ meta.from }}</strong> à <strong>{{ meta.to }}</strong>
          sur <strong>{{ meta.total }}</strong> devis
        </div>
        <div class="flex gap-2">
          <button @click="loadDevis(meta.current_page - 1)" :disabled="meta.current_page === 1" class="btn-secondary px-3 py-1.5 disabled:opacity-40">← Précédent</button>
          <span class="px-3 py-1.5 text-gray-600">Page {{ meta.current_page }} / {{ meta.last_page }}</span>
          <button @click="loadDevis(meta.current_page + 1)" :disabled="meta.current_page === meta.last_page" class="btn-secondary px-3 py-1.5 disabled:opacity-40">Suivant →</button>
        </div>
      </div>
    </div>

    <!-- Modal création/édition -->
    <AppModal
      v-model="showModal"
      :title="editingDevis ? `Modifier ${editingDevis.numero}` : 'Nouveau devis'"
      size="xl"
      :before-close="requestCloseSaisie"
    >
      <DevisForm
        :devis="editingDevis"
        :client="creatingClient"
        @saved="onSaved"
        @cancel="closeSaisie"
        @dirty-change="formDirty = $event"
      />
    </AppModal>

    <AppConfirmModal
      v-model="showLeaveConfirm"
      title="Quitter la saisie ?"
      message="Voulez-vous quitter la saisie du devis ? Les informations non enregistrées seront perdues."
      hint="Choisissez « Rester » pour continuer votre saisie."
      cancel-label="Rester"
      confirm-label="Quitter sans enregistrer"
      tone="danger"
      @confirm="discardDevisForm"
    />

    <AssignCommercialModal
      v-if="assignTarget"
      v-model="showAssignModal"
      :endpoint="assignEndpoint"
      :current-commercial-id="assignTarget?.commercial_id"
      :item-label="assignTarget ? `${assignTarget.numero} - ${assignTarget.client?.nom || ''}` : ''"
      title="Affecter devis"
      @assigned="onAssigned"
    />

    <!-- Modal suppression -->
    <AppModal v-model="showDeleteModal" title="Confirmer la suppression" size="sm">
      <p class="text-gray-700">Supprimer le devis <strong>{{ devisToDelete.numero }}</strong> </p>
      <template #footer>
        <button @click="showDeleteModal = false" class="btn-secondary">Annuler</button>
        <button @click="handleDelete" :disabled="deleting" class="btn-danger">
          <span v-if="deleting">Suppression...</span>
          <span v-else>Supprimer</span>
        </button>
      </template>
    </AppModal>

    <!-- Modal conversion devis → facture -->
    <AppModal v-model="showConvertModal" title="Convertir en facture" size="sm">
      <p class="text-gray-700">
        Convertir le devis <strong>{{ devisToConvert.numero }}</strong> en facture 
      </p>
      <div class="mt-3 p-3 bg-blue-50 rounded text-sm text-blue-800">
        <p class="mb-1">✓ Une nouvelle facture sera créée en brouillon</p>
        <p class="mb-1">✓ Toutes les lignes du devis seront copiées</p>
        <p>✓ Le devis passera au statut "Facturé"</p>
      </div>
      <template #footer>
        <button @click="showConvertModal = false" class="btn-secondary">Annuler</button>
        <button @click="handleConvertir" :disabled="converting" class="btn-primary">
          <span v-if="converting">Conversion...</span>
          <span v-else>Confirmer la conversion</span>
        </button>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { computed, ref, reactive, onMounted, watch } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import api from '@/services/api'
import { ouvrirPDF } from '@/services/pdf'
import AppModal from '@/components/AppModal.vue'
import AppConfirmModal from '@/components/AppConfirmModal.vue'
import DevisForm from '@/components/DevisForm.vue'
import AssignCommercialModal from '@/components/AssignCommercialModal.vue'
import SortableTh from '@/components/SortableTh.vue'
import { useToast } from '@/composables/useToast'
import { useTableSort } from '@/composables/useTableSort'
import { useAuthStore } from '@/stores/auth'
import { telechargerCSV } from '@/services/exports'

const toast = useToast()
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const isAdmin = computed(() => ['admin', 'gerant'].includes(auth.user?.role))

const devis = ref([])
const { sort, toggleSort, sortIcon, sortedRows } = useTableSort('numero', 'desc')
const loading = ref(false)
const exportLoading = ref(false)
const stats = reactive({ total: 0, brouillons: 0, envoyes: 0, acceptes: 0, refuses: 0, montant_total_acceptes: 0 })
const meta = reactive({ current_page: 1, last_page: 1, total: 0, from: 0, to: 0 })
const filters = reactive({ search: '', statut: '' })

const showModal = ref(false)
const editingDevis = ref(null)
const creatingClient = ref(null)
const formDirty = ref(false)
const showLeaveConfirm = ref(false)
const pendingLeaveRoute = ref(null)
const showDeleteModal = ref(false)
const devisToDelete = ref(null)
const deleting = ref(false)

const showConvertModal = ref(false)
const devisToConvert = ref(null)
const converting = ref(false)
const cloningId = ref(null)
const showAssignModal = ref(false)
const assignTarget = ref(null)
const assignEndpoint = computed(() => assignTarget.value ? `/devis/${assignTarget.value.id}/assign-commercial` : '/devis/0/assign-commercial')

const sortedDevis = computed(() => sortedRows(devis.value, {
  numero: 'numero',
  client: (devi) => devi.client?.nom || '',
  objet: 'objet',
  date: 'date_devis',
  validite: 'date_validite',
  total: (devi) => parseFloat(devi.total_ttc || 0),
  statut: 'statut',
}))

let searchTimeout = null
function onSearchInput() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => loadDevis(1), 350)
}

function syncFiltersFromRoute() {
  filters.search = typeof route.query.search === 'string' ? route.query.search : ''
  filters.statut = typeof route.query.statut === 'string' ? route.query.statut : ''
}

function applyStatutFilter(statut) {
  filters.statut = statut
  loadDevis(1)
}

function statCardClass(statut) {
  return filters.statut === statut ?
     'border-xelltekk-500 bg-xelltekk-50 ring-2 ring-xelltekk-100'
    : 'border-gray-200'
}

async function loadDevis(page = 1) {
  loading.value = true
  try {
    const { data } = await api.get('/devis', {
      params: {
        page,
        per_page: 20,
        search: filters.search || undefined,
        statut: filters.statut || undefined,
      },
    })
    devis.value = data.data
    Object.assign(meta, {
      current_page: data.current_page,
      last_page: data.last_page,
      total: data.total,
      from: data.from || 0,
      to: data.to || 0,
    })
  } catch (e) {
    toast.error('Erreur de chargement des devis')
  } finally {
    loading.value = false
  }
}

async function loadStats() {
  try {
    const { data } = await api.get('/devis/stats')
    Object.assign(stats, data)
  } catch (e) {}
}

async function exporterCSV() {
  exportLoading.value = true
  try {
    await telechargerCSV('/exports/devis', {
      search: filters.search || undefined,
      statut: filters.statut || undefined,
    }, 'devis_saytu.csv')
    toast.success('Export des devis téléchargé.')
  } catch (e) {
    toast.error('Export impossible pour le moment.')
  } finally {
    exportLoading.value = false
  }
}

function openCreate(client = null) {
  editingDevis.value = null
  creatingClient.value = client
  formDirty.value = false
  showModal.value = true
}

async function openEdit(devi) {
  const { data } = await api.get(`/devis/${devi.id}`)
  creatingClient.value = null
  editingDevis.value = data
  formDirty.value = false
  showModal.value = true
}

function openAssignDevis(devi) {
  assignTarget.value = devi
  showAssignModal.value = true
}

function onAssigned() {
  loadDevis(meta.current_page)
  loadStats()
}

function onSaved() {
  formDirty.value = false
  showModal.value = false
  loadDevis(meta.current_page)
  loadStats()
}

function requestCloseSaisie() {
  if (!formDirty.value) return true
  showLeaveConfirm.value = true
  return false
}
function closeSaisie() {
  requestCloseSaisie()
}
function discardDevisForm() {
  showLeaveConfirm.value = false
  formDirty.value = false
  showModal.value = false
  const nextRoute = pendingLeaveRoute.value
  pendingLeaveRoute.value = null
  if (nextRoute) router.push(nextRoute)
}
function confirmDelete(devi) {
  devisToDelete.value = devi
  showDeleteModal.value = true
}

async function handleDelete() {
  deleting.value = true
  try {
    await api.delete(`/devis/${devisToDelete.value.id}`)
    toast.success(`Devis ${devisToDelete.value.numero} supprimé`)
    showDeleteModal.value = false
    devisToDelete.value = null
    loadDevis(meta.current_page)
    loadStats()
  } catch (err) {
    toast.error(err.response.data.message || 'Erreur de suppression')
  } finally {
    deleting.value = false
  }
}

function confirmConvertir(devi) {
  devisToConvert.value = devi
  showConvertModal.value = true
}

async function handleConvertir() {
  converting.value = true
  try {
    const { data } = await api.post(`/devis/${devisToConvert.value.id}/convertir-en-facture`)
    toast.success(`Facture ${data.facture?.numero || ''} créée !`)
    showConvertModal.value = false
    devisToConvert.value = null
    setTimeout(() => router.push('/factures'), 800)
  } catch (err) {
    toast.error(err.response.data.message || 'Erreur de conversion')
  } finally {
    converting.value = false
  }
}

async function handleCloner(devi) {
  cloningId.value = devi.id
  try {
    const { data } = await api.post(`/devis/${devi.id}/cloner`)
    toast.success(data.message || `Devis ${devi.numero} cloné`)
    creatingClient.value = null
    editingDevis.value = data.devis
    formDirty.value = false
    showModal.value = true
    await loadDevis(meta.current_page)
    loadStats()
  } catch (err) {
    toast.error(err.response.data.message || 'Erreur lors du clonage du devis')
  } finally {
    cloningId.value = null
  }
}

async function ouvrirPdf(devi) {
  try {
    await ouvrirPDF(`/devis/${devi.id}/pdf`, `${devi.numero}.pdf`)
  } catch (e) {
    toast.error('Impossible d\'ouvrir le PDF')
  }
}

function formatPrice(n) {
  return new Intl.NumberFormat('fr-FR').format(Math.round(n || 0))
}

function formatDate(d) {
  if (!d) return '–'
  return new Date(d).toLocaleDateString('fr-FR')
}

function statutBadge(statut) {
  return {
    brouillon: 'bg-gray-100 text-gray-700',
    envoye: 'bg-blue-100 text-blue-800',
    accepte: 'bg-green-100 text-green-800',
    refuse: 'bg-red-100 text-red-800',
    expire: 'bg-yellow-100 text-yellow-800',
    facture: 'bg-purple-100 text-purple-800',
  }[statut] || 'bg-gray-100'
}

async function openFromRoute(id) {
  if (!id) return
  try {
    const { data } = await api.get(`/devis/${parseInt(id)}`)
    editingDevis.value = data
    formDirty.value = false
    showModal.value = true
    router.replace({ path: '/devis', query: {} })
  } catch (e) {
    toast.error('Devis introuvable')
  }
}

async function openCreateFromRoute(clientId) {
  if (!clientId) return
  try {
    const { data } = await api.get(`/clients/${parseInt(clientId)}`)
    openCreate(data)
    router.replace({ path: '/devis', query: {} })
  } catch (e) {
    toast.error('Client introuvable')
  }
}

onMounted(async () => {
  syncFiltersFromRoute()
  await loadDevis()
  loadStats()
  openFromRoute(route.query.open)
  openCreateFromRoute(route.query.create_client)
})

watch(() => route.query.open, (id) => {
  openFromRoute(id)
})

watch(() => route.query.create_client, (id) => {
  openCreateFromRoute(id)
})

watch(
  () => [route.query.statut, route.query.search],
  async () => {
    syncFiltersFromRoute()
    await loadDevis(1)
  }
)

onBeforeRouteLeave((to) => {
  if (showModal.value && formDirty.value) {
    pendingLeaveRoute.value = to.fullPath
    showLeaveConfirm.value = true
    return false
  }
  formDirty.value = false
  return true
})
</script>
