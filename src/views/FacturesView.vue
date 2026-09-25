<template>
  <div class="app-surface space-y-4">
    <!-- Filtres -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div class="flex flex-col md:flex-row gap-3">
        <input v-model="filters.search" @input="onSearchInput" type="search" placeholder="🔍 Numéro, objet, client, email, téléphone..." class="input flex-1" />
        <select v-model="filters.statut" @change="onFactureFilterChange" class="input md:w-44">
          <option value="">Tous statuts</option>
          <option value="brouillon">Brouillon</option>
          <option value="validee">Validée</option>
          <option value="envoyee">Envoyée</option>
          <option value="partiellement_payee">Partiel. payée</option>
          <option value="payee">Payée</option>
          <option value="impayee">Impayée</option>
          <option value="annulee">Annulée</option>
        </select>
        <select v-model="filters.type" @change="onFactureFilterChange" class="input md:w-36">
          <option value="">Tous types</option>
          <option value="standard">Standard</option>
          <option value="avoir">Avoir</option>
          <option value="acompte">Acompte</option>
        </select>
        <button @click="exporterCSV" :disabled="exportLoading" class="btn-secondary whitespace-nowrap">
          <span v-if="exportLoading">⏳ Export...</span>
          <span v-else>📥 Exporter CSV</span>
        </button>
        <button @click="openCreate" class="btn-primary whitespace-nowrap">+ Nouvelle facture</button>
      </div>
    </div>

    <div data-inline-modal-workspace></div>

    <!-- Mini filtres -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
      <div class="flex flex-wrap items-center gap-2">
        <button
          v-for="chip in filterChips"
          :key="`${chip.kind}-${chip.key}`"
          type="button"
          class="inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition hover:-translate-y-0.5 hover:shadow-sm"
          :class="filterChipClass(chip)"
          @click="applyFilterChip(chip)"
        >
          <span>{{ chip.label }}</span>
          <span v-if="chip.count !== null" class="rounded-full bg-white/80 px-2 py-0.5 font-black">{{ chip.count || 0 }}</span>
          <span v-if="chip.amount !== null" class="font-black">{{ formatPrice(chip.amount) }}</span>
        </button>
        <button
          v-if="hasActiveFilters"
          type="button"
          @click="clearFactureFilters"
          class="ml-auto rounded-full border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50"
        >
          Réinitialiser
        </button>
      </div>
    </div>

    <div v-if="loading" class="bg-white rounded-lg p-12 text-center text-gray-500">Chargement...</div>

    <div v-else class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <SortableTh column="numero" :active="sort.key === 'numero'" :icon="sortIcon('numero')" @sort="toggleSort">N°</SortableTh>
              <SortableTh column="client" :active="sort.key === 'client'" :icon="sortIcon('client')" @sort="toggleSort">Client</SortableTh>
              <SortableTh column="date" :active="sort.key === 'date'" :icon="sortIcon('date')" align="center" @sort="toggleSort">Date</SortableTh>
              <SortableTh column="echeance" :active="sort.key === 'echeance'" :icon="sortIcon('echeance')" align="center" @sort="toggleSort">Échéance</SortableTh>
              <SortableTh column="total" :active="sort.key === 'total'" :icon="sortIcon('total')" align="right" @sort="toggleSort">Total TTC</SortableTh>
              <SortableTh column="reste" :active="sort.key === 'reste'" :icon="sortIcon('reste')" align="right" @sort="toggleSort">Reste</SortableTh>
              <SortableTh column="statut" :active="sort.key === 'statut'" :icon="sortIcon('statut')" align="center" @sort="toggleSort">Statut</SortableTh>
              <th class="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="f in sortedFactures" :key="f.id" class="hover:bg-gray-50">
              <td class="px-3 py-3 text-xs font-mono text-gray-600">
                <button type="button" class="font-mono font-black text-xelltekk-700 hover:underline" @click="openEdit(f)">
                  {{ f.numero }}
                </button>
                <span v-if="f.type === 'avoir'" class="ml-1 text-red-600 text-[10px]">AVOIR</span>
              </td>
              <td class="px-3 py-3">
                <div class="compact-row-primary text-gray-900" :title="f.client?.nom || 'Client non renseigné'">
                  {{ f.client?.nom || 'Client non renseigné' }}
                </div>
                <div class="compact-row-meta">
                  <span>{{ f.client?.code || '–' }}</span>
                  <span v-if="f.client?.email" class="text-xelltekk-700">
                    {{ f.client.email }}
                  </span>
                  <span class="text-blue-600">Commercial : {{ f.commercial?.name || 'Non affecté' }}</span>
                </div>
              </td>
              <td class="px-3 py-3 text-xs text-center text-gray-600">{{ formatDate(f.date_facture) }}</td>
              <td class="px-3 py-3 text-xs text-center" :class="isEnRetard(f) ? 'text-red-600 font-semibold' : 'text-gray-600'">
                {{ formatDate(f.date_echeance) }}
              </td>
              <td class="px-3 py-3 text-right font-mono text-sm font-semibold text-gray-900">{{ formatPrice(f.total_ttc) }}</td>
              <td class="px-3 py-3 text-right font-mono text-sm" :class="parseFloat(f.reste_a_payer) > 0 ? 'text-orange-700 font-semibold' : 'text-gray-400'">
                {{ parseFloat(f.reste_a_payer) > 0 ? formatPrice(f.reste_a_payer) : '–' }}
              </td>
              <td class="px-3 py-3 text-center">
                <span class="badge text-[10px]" :class="statutBadge(commercialStatus(f))">{{ statutLabel(commercialStatus(f)) }}</span>
              </td>
              <td class="px-3 py-3 text-right">
                <div class="flex flex-wrap justify-end gap-2">
                <EmailActionButtons
                  v-if="canRelancer(f)"
                  :draft="relanceFactureEmailDraft(f)"
                  :filename="`relance-facture-${f.numero || f.id}`"
                  dialog
                  compact
                />
                <button @click="ouvrirPdf(f)" class="text-xelltekk-600 hover:text-xelltekk-800 mr-2" title="PDF">📄</button>
                <button
                  @click="openPilotage(f)"
                  class="text-sky-700 hover:text-sky-900 mr-2 text-sm font-medium"
                  title="Suivi complet de la facture"
                >
                  Suivi
                </button>
                <button
                  v-if="canValidateInvoices && f.type !== 'avoir' && f.statut === 'brouillon'"
                  @click="handleValider(f)"
                  :disabled="validatingId === `valider-${f.id}`"
                  class="text-blue-700 hover:text-blue-900 mr-2 text-sm font-medium disabled:opacity-50"
                  title="Valider la facture et sortir le stock"
                >
                  Valider
                </button>
                <button
                  v-if="canValidateInvoices && f.type !== 'avoir' && f.statut === 'brouillon'"
                  @click="handleEnvoyer(f)"
                  :disabled="validatingId === `envoyer-${f.id}`"
                  class="text-indigo-700 hover:text-indigo-900 mr-2 text-sm font-medium disabled:opacity-50"
                  title="Valider puis marquer comme envoyée"
                >
                  Valider + envoyée
                </button>
                <button
                  v-if="canValidateInvoices && f.type !== 'avoir' && f.statut === 'validee'"
                  @click="handleEnvoyer(f)"
                  :disabled="validatingId === `envoyer-${f.id}`"
                  class="text-indigo-700 hover:text-indigo-900 mr-2 text-sm font-medium disabled:opacity-50"
                  title="Marquer comme envoyée au client"
                >
                  Marquer envoyée
                </button>
                <button
                  v-if="canManagePayments && f.type !== 'avoir' && !['brouillon','payee','annulee'].includes(f.statut)"
                  @click="openEncaisser(f)"
                  class="text-emerald-700 hover:text-emerald-900 mr-2 text-sm font-medium"
                  title="Encaisser un paiement"
                >
                  Encaisser
                </button>
                <button
                  v-if="canManagePayments && f.type !== 'avoir' && !['brouillon','payee','annulee'].includes(f.statut)"
                  @click="openMarquerPayee(f)"
                  class="text-green-600 hover:text-green-800 mr-2"
                  title="Marquer comme payée"
                >
                  ✅
                </button>
                <button
                  v-if="f.type !== 'avoir' && !['payee','annulee'].includes(f.statut) && !parseFloat(f.montant_paye)"
                  @click="openAnnuler(f)"
                  class="text-orange-600 hover:text-orange-800 mr-2"
                  title="Annuler la facture"
                >
                  🚫
                </button>
                <button
                  v-if="f.type !== 'avoir' && f.statut !== 'brouillon' && f.statut !== 'annulee'"
                  @click="openCreateAvoir(f)"
                  class="text-red-600 hover:text-red-800 mr-2"
                  title="Créer un avoir"
                >
                  ↩️
                </button>
                <button
                  @click="handleCloner(f)"
                  :disabled="cloningId === f.id"
                  class="text-cyan-700 hover:text-cyan-900 mr-2 text-sm font-medium disabled:opacity-50"
                  title="Cloner cette facture"
                >
                  Cloner
                </button>
                <button @click="openEdit(f)" class="text-xelltekk-600 hover:text-xelltekk-800 mr-2" title="Modifier">✏️</button>
                <button v-if="isAdmin" @click="openAssignFacture(f)" class="text-indigo-600 hover:text-indigo-800 mr-2 text-sm font-medium" title="Affecter">Affecter</button>
                <button @click="confirmDelete(f)" class="text-red-600 hover:text-red-800" title="Supprimer">🗑️</button>
                </div>
              </td>
            </tr>
            <tr v-if="factures.length === 0">
              <td colspan="8" class="px-4 py-12 text-center text-gray-400 text-sm">Aucune facture</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="meta.total > 0" class="px-4 py-3 border-t border-gray-200 flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
        <div class="text-gray-600">
          <strong>{{ meta.from }}</strong>–<strong>{{ meta.to }}</strong> sur <strong>{{ meta.total }}</strong> factures
        </div>
        <div class="flex gap-2">
          <button @click="loadFactures(meta.current_page - 1)" :disabled="meta.current_page === 1" class="btn-secondary px-3 py-1.5 disabled:opacity-40">←</button>
          <span class="px-3 py-1.5 text-gray-600">{{ meta.current_page }} / {{ meta.last_page }}</span>
          <button @click="loadFactures(meta.current_page + 1)" :disabled="meta.current_page === meta.last_page" class="btn-secondary px-3 py-1.5 disabled:opacity-40">→</button>
        </div>
      </div>
    </div>

    <AssignCommercialModal
      v-if="assignTarget"
      v-model="showAssignModal"
      :endpoint="assignEndpoint"
      :current-commercial-id="assignTarget?.commercial_id"
      :item-label="assignTarget ? `${assignTarget.numero} - ${assignTarget.client?.nom || ''}` : ''"
      title="Affecter facture"
      @assigned="onAssigned"
    />

    <AppModal v-model="showDeleteModal" title="Confirmer la suppression" size="sm">
      <p class="text-gray-700">Supprimer la facture <strong>{{ factureToDelete.numero }}</strong> </p>
      <template #footer>
        <button @click="showDeleteModal = false" class="btn-secondary">Annuler</button>
        <button @click="handleDelete" :disabled="deleting" class="btn-danger">
          <span v-if="deleting">...</span><span v-else>Supprimer</span>
        </button>
      </template>
    </AppModal>

  </div>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router'
import { ref, reactive, onMounted, computed, watch } from 'vue'
import api from '@/services/api'
import { ouvrirPDF } from '@/services/pdf'
import { telechargerCSV } from '@/services/exports'
import AppModal from '@/components/InlinePanelModal.vue'
import AssignCommercialModal from '@/components/AssignCommercialModal.vue'
import EmailActionButtons from '@/components/EmailActionButtons.vue'
import SortableTh from '@/components/SortableTh.vue'
import { useToast } from '@/composables/useToast'
import { useTableSort } from '@/composables/useTableSort'
import { useAuthStore } from '@/stores/auth'
import { buildEmailDraft } from '@/utils/emailComposer'
import { hasAnyRole } from '@/utils/access'

const toast = useToast()
const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const isCommercial = computed(() => hasAnyRole(auth.user, 'commercial'))
const isAdmin = computed(() => hasAnyRole(auth.user, ['admin', 'gerant']))
const canManagePayments = computed(() => hasAnyRole(auth.user, ['admin', 'gerant', 'comptable']))
const canValidateInvoices = computed(() => hasAnyRole(auth.user, ['admin', 'gerant', 'commercial']))
const factures = ref([])
const { sort, toggleSort, sortIcon, sortedRows } = useTableSort('numero', 'desc')
const loading = ref(false)
const exportLoading = ref(false)
const validatingId = ref(null)
const stats = reactive({
  total: 0,
  brouillons: 0,
  validees: 0,
  envoyees: 0,
  partiellement_payees: 0,
  payees: 0,
  annulees: 0,
  impayees: 0,
  en_retard: 0,
  a_envoyer: 0,
  echeance_proche: 0,
  factures_ouvertes: 0,
  ca_mois: 0,
  ca_annee: 0,
  encours_total: 0,
  montant_retard: 0,
  montant_partiel: 0,
  montant_echeance_proche: 0,
  montant_total_facture: 0,
  montant_total_paye: 0,
  taux_recouvrement: 0,
})
const meta = reactive({ current_page: 1, last_page: 1, total: 0, from: 0, to: 0 })
const filters = reactive({ search: '', statut: '', type: '', quick: '' })

const showDeleteModal = ref(false)
const factureToDelete = ref(null)
const deleting = ref(false)
const cloningId = ref(null)
const showAssignModal = ref(false)
const assignTarget = ref(null)
const assignEndpoint = computed(() => assignTarget.value ? `/factures/${assignTarget.value.id}/assign-commercial` : '/factures/0/assign-commercial')

const sortedFactures = computed(() => sortedRows(factures.value, {
  numero: 'numero',
  client: (facture) => facture.client?.nom || '',
  date: 'date_facture',
  echeance: 'date_echeance',
  total: (facture) => parseFloat(facture.total_ttc || 0),
  reste: (facture) => parseFloat(facture.reste_a_payer || 0),
  statut: 'statut',
}))

const filterChips = computed(() => {
  const chips = [
    { kind: 'quick', key: 'standard', label: 'Toutes', count: stats.total, amount: null, tone: 'blue' },
    { kind: 'statut', key: 'brouillon', label: 'Brouillons', count: stats.brouillons, amount: null, tone: 'gray' },
    { kind: 'statut', key: 'payee', label: 'Payées', count: stats.payees, amount: null, tone: 'green' },
  ]

  if (!isCommercial.value) {
    chips.splice(1, 0,
      { kind: 'quick', key: 'a_encaisser', label: 'À encaisser', count: stats.impayees, amount: stats.encours_total, tone: 'orange' },
      { kind: 'quick', key: 'en_retard', label: 'En retard', count: stats.en_retard, amount: stats.montant_retard, tone: 'red' },
      { kind: 'quick', key: 'partiels', label: 'Partiels', count: stats.partiellement_payees, amount: stats.montant_partiel, tone: 'yellow' },
      { kind: 'quick', key: 'echeance_proche', label: 'Échéance proche', count: stats.echeance_proche, amount: stats.montant_echeance_proche, tone: 'cyan' },
      { kind: 'quick', key: 'a_envoyer', label: 'À envoyer', count: stats.a_envoyer, amount: null, tone: 'indigo' },
    )
    chips.push(
      { kind: 'quick', key: 'ca_mois', label: 'CA facturation mois', count: null, amount: stats.ca_mois, tone: 'blue' },
      { kind: 'quick', key: 'ca_annee', label: 'CA facturation année', count: null, amount: stats.ca_annee, tone: 'green' },
    )
  }

  return chips
})

const hasActiveFilters = computed(() => Boolean(filters.quick || filters.statut || filters.type || filters.search))

const allowedQuickFilters = computed(() => (
  isCommercial.value ?
     ['standard']
    : ['standard', 'impayees', 'a_encaisser', 'en_retard', 'partiels', 'echeance_proche', 'a_envoyer', 'ca_mois', 'ca_annee', 'encours']
))

let searchTimeout = null
function onSearchInput() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => loadFactures(1), 350)
}

function syncFiltersFromRoute() {
  const quick = typeof route.query.quick === 'string' ? route.query.quick : ''
  filters.quick = allowedQuickFilters.value.includes(quick) ? quick : ''
  filters.search = typeof route.query.search === 'string' ? route.query.search : ''
  filters.statut = filters.quick ? '' : typeof route.query.statut === 'string' ? route.query.statut : ''
  filters.type = filters.quick ? '' : typeof route.query.type === 'string' ? route.query.type : ''
}

function onFactureFilterChange() {
  filters.quick = ''
  loadFactures(1)
}

function applyQuickFilter(quick) {
  if (!allowedQuickFilters.value.includes(quick)) return
  filters.quick = quick
  filters.statut = ''
  filters.type = ''
  loadFactures(1)
}

function applyFilterChip(chip) {
  if (chip.kind === 'quick') return applyQuickFilter(chip.key)

  filters.quick = ''
  filters.statut = chip.key
  filters.type = ''
  loadFactures(1)
}

function filterChipClass(chip) {
  const active = chip.kind === 'quick' ? filters.quick === chip.key : filters.statut === chip.key
  if (active) return 'border-xelltekk-500 bg-xelltekk-50 text-xelltekk-800 ring-2 ring-xelltekk-100'

  return {
    red: 'border-red-200 bg-red-50 text-red-700 hover:border-red-300',
    orange: 'border-orange-200 bg-orange-50 text-orange-700 hover:border-orange-300',
    yellow: 'border-yellow-200 bg-yellow-50 text-yellow-700 hover:border-yellow-300',
    green: 'border-green-200 bg-green-50 text-green-700 hover:border-green-300',
    cyan: 'border-cyan-200 bg-cyan-50 text-cyan-700 hover:border-cyan-300',
    indigo: 'border-indigo-200 bg-indigo-50 text-indigo-700 hover:border-indigo-300',
    gray: 'border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300',
    blue: 'border-blue-200 bg-blue-50 text-blue-700 hover:border-blue-300',
  }[chip.tone] || 'border-gray-200 bg-gray-50 text-gray-700'
}

function clearFactureFilters() {
  filters.search = ''
  filters.statut = ''
  filters.type = ''
  filters.quick = 'standard'
  loadFactures(1)
}

async function loadFactures(page = 1) {
  loading.value = true
  try {
    const { data } = await api.get('/factures', {
      params: {
        page,
        per_page: 25,
        search: filters.search || undefined,
        statut: filters.quick ? undefined : filters.statut || undefined,
        type: filters.quick ? undefined : filters.type || undefined,
        quick: filters.quick || undefined,
        source: 'facturation',
      },
    })
    factures.value = data.data
    Object.assign(meta, {
      current_page: data.current_page, last_page: data.last_page,
      total: data.total, from: data.from || 0, to: data.to || 0,
    })
  } catch (e) {
    toast.error('Erreur de chargement')
  } finally {
    loading.value = false
  }
}

async function loadStats() {
  try {
    const { data } = await api.get('/factures/stats', { params: { source: 'facturation' } })
    Object.assign(stats, data)
  } catch (e) {}
}

async function exporterCSV() {
  exportLoading.value = true
  try {
    await telechargerCSV('/exports/factures', {
      search: filters.search || undefined,
      statut: filters.quick ? undefined : filters.statut || undefined,
      type: filters.quick ? undefined : filters.type || undefined,
      quick: filters.quick || undefined,
      source: 'facturation',
    }, 'factures_xelltekk.csv')
    toast.success('Export téléchargé')
  } catch (e) {
    toast.error('Erreur lors de l\'export')
  } finally {
    exportLoading.value = false
  }
}

function openCreate(client = null) {
  router.push({
    name: 'facture-create',
    query: client?.id ? { client_id: client.id, tab: 'saisie' } : { tab: 'saisie' },
  })
}

async function openEdit(f) {
  router.push({ name: 'facture-detail', params: { id: f.id }, query: { tab: 'fiche' } })
}

function openAssignFacture(f) {
  assignTarget.value = f
  showAssignModal.value = true
}

function onAssigned() {
  loadFactures(meta.current_page)
  loadStats()
}

function confirmDelete(f) { factureToDelete.value = f; showDeleteModal.value = true }

async function handleCloner(f) {
  cloningId.value = f.id
  try {
    const { data } = await api.post(`/factures/${f.id}/cloner`)
    toast.success(data.message || `Facture ${f.numero} clonée`)
    router.push({ name: 'facture-detail', params: { id: data.facture.id }, query: { tab: 'saisie' } })
    await loadFactures(meta.current_page)
    loadStats()
  } catch (err) {
    toast.error(err.response?.data?.message || 'Erreur lors du clonage de la facture')
  } finally {
    cloningId.value = null
  }
}

async function handleDelete() {
  deleting.value = true
  try {
    await api.delete(`/factures/${factureToDelete.value.id}`)
    toast.success(`Facture supprimée`)
    showDeleteModal.value = false
    loadFactures(meta.current_page)
    loadStats()
  } catch (err) {
    toast.error(err.response?.data?.message || 'Erreur')
  } finally {
    deleting.value = false
  }
}

async function ouvrirPdf(f) {
  try { await ouvrirPDF(`/factures/${f.id}/pdf`, `${f.numero}.pdf`) }
  catch (e) { toast.error('Impossible d\'ouvrir le PDF') }
}

async function handleValider(f) {
  validatingId.value = `valider-${f.id}`
  try {
    await api.post(`/factures/${f.id}/valider`)
    toast.success(`Facture ${f.numero} validée`)
    await loadFactures(meta.current_page)
    loadStats()
  } catch (err) {
    const errors = err.response?.data?.errors || err.response?.data?.validation_controle?.erreurs
    const firstError = Array.isArray(errors) ? errors[0] : errors ? Object.values(errors).flat()[0] : null
    toast.error(firstError || err.response?.data?.message || 'Erreur lors de la validation')
  } finally {
    validatingId.value = null
  }
}

async function handleEnvoyer(f) {
  validatingId.value = `envoyer-${f.id}`
  try {
    const { data } = await api.post(`/factures/${f.id}/envoyer`)
    toast.success(data.message || `Facture ${f.numero} marquée envoyée`)
    await loadFactures(meta.current_page)
    loadStats()
  } catch (err) {
    const errors = err.response?.data?.errors || err.response?.data?.validation_controle?.erreurs
    const firstError = Array.isArray(errors) ? errors[0] : errors ? Object.values(errors).flat()[0] : null
    toast.error(firstError || err.response?.data?.message || 'Erreur lors du changement de statut')
  } finally {
    validatingId.value = null
  }
}

function openCreateAvoir(f) {
  router.push({ name: 'facture-detail', params: { id: f.id }, query: { tab: 'avoirs' } })
}

function openMarquerPayee(f) {
  router.push({ name: 'facture-detail', params: { id: f.id }, query: { tab: 'paiements' } })
}

function openEncaisser(f) {
  router.push({ name: 'facture-detail', params: { id: f.id }, query: { tab: 'paiements' } })
}

function openPilotage(f) {
  router.push({ name: 'facture-detail', params: { id: f.id }, query: { tab: 'suivi' } })
}

function openAnnuler(f) {
  router.push({ name: 'facture-detail', params: { id: f.id }, query: { tab: 'avoirs' } })
}

function formatPrice(n) { return new Intl.NumberFormat('fr-FR').format(Math.round(n || 0)) }
function formatDate(d) { return d ? new Date(d).toLocaleDateString('fr-FR') : '–' }
function isEnRetard(f) {
  if (!['validee', 'envoyee', 'partiellement_payee', 'impayee'].includes(f.statut)) return false
  return new Date(f.date_echeance) < new Date()
}
function statutLabel(s) {
  return { brouillon: 'Brouillon', validee: 'Validée', envoyee: 'Envoyée',
    partiellement_payee: 'Partiel.', payee: 'Payée', impayee: 'Impayée', annulee: 'Annulée',
    avoir: 'Avoir', avoir_partiel: 'Avoir partiel', avoir_total: 'Avoir total' }[s] || s
}
function statutBadge(s) {
  return { brouillon: 'bg-gray-100 text-gray-700', validee: 'bg-blue-100 text-blue-800',
    envoyee: 'bg-indigo-100 text-indigo-800', partiellement_payee: 'bg-yellow-100 text-yellow-800',
    payee: 'bg-green-100 text-green-800', impayee: 'bg-orange-100 text-orange-800',
    annulee: 'bg-red-100 text-red-800', avoir: 'bg-red-50 text-red-700',
    avoir_partiel: 'bg-rose-100 text-rose-800', avoir_total: 'bg-red-100 text-red-800' }[s] || 'bg-gray-100'
}
function commercialStatus(f) {
  return f?.statut_commercial || f?.avoir_resume?.statut_commercial || f?.statut
}

function canRelancer(f) {
  return Boolean(f.client?.email)
    && f.type !== 'avoir'
    && !['payee', 'annulee', 'brouillon'].includes(f.statut)
    && parseFloat(f.reste_a_payer || 0) > 0
}

function relanceFactureEmailDraft(f) {
  const client = f.client || {}
  if (!client.email) return buildEmailDraft()

  const subject = `Relance facture ${f.numero || ''} - ${client.nom || ''}`.trim()
  const reste = parseFloat(f.reste_a_payer || 0)
  const bodyLines = [
    `Bonjour${client.nom ? ` ${client.nom}` : ''},`,
    '',
    `Nous revenons vers vous concernant la facture ${f.numero || ''}${f.objet ? ` (${f.objet})` : ''}.`,
    `Date facture : ${formatDate(f.date_facture)}.`,
    `Échéance : ${formatDate(f.date_echeance)}.`,
    `Montant total : ${formatPrice(f.total_ttc)}.`,
    reste > 0 ? `Reste à payer : ${formatPrice(reste)}.` : '',
    '',
    'Pouvez-vous nous confirmer la date de règlement prévue ?',
    '',
    'Cordialement,',
    auth.user?.name || 'XELLTEKK',
  ].filter(Boolean)

  return buildEmailDraft({
    to: client.email,
    subject,
    body: bodyLines.join('\n'),
    context_type: 'facture',
    context_id: f.id,
  })
}

async function openFromRoute(id) {
  if (!id) return
  router.replace({ name: 'facture-detail', params: { id: parseInt(id) }, query: { tab: 'fiche' } })
}

async function openCreateFromRoute(clientId) {
  if (!clientId) return
  router.replace({ name: 'facture-create', query: { client_id: parseInt(clientId), tab: 'saisie' } })
}

onMounted(async () => {
  syncFiltersFromRoute()
  await loadFactures()
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
  () => [route.query.quick, route.query.statut, route.query.type, route.query.search],
  async () => {
    syncFiltersFromRoute()
    await loadFactures(1)
  }
)
</script>
