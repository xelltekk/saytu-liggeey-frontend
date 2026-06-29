<template>
  <div class="space-y-4">
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div class="flex flex-col gap-3 lg:flex-row">
        <input v-model="filters.search" @input="onSearchInput" type="search" placeholder="Référence, libellé, bénéficiaire..." class="input flex-1" />
        <select v-model="filters.categorie" @change="loadDepenses(1)" class="input lg:w-52">
          <option value="">Toutes catégories</option>
          <option v-for="(label, key) in categories" :key="key" :value="key">{{ label }}</option>
        </select>
        <select v-model="filters.statut" @change="loadDepenses(1)" class="input lg:w-44">
          <option value="">Tous statuts</option>
          <option value="en_attente">En attente</option>
          <option value="validee">Validées</option>
          <option value="rejetee">Rejetées</option>
          <option value="annulee">Annulées</option>
        </select>
        <button @click="exporterCSV" :disabled="exportLoading" class="btn-secondary whitespace-nowrap">
          {{ exportLoading ? 'Export...' : 'Exporter CSV' }}
        </button>
        <button @click="openCreate" class="btn-primary whitespace-nowrap">+ Nouvelle dépense</button>
      </div>
    </div>

    <div class="stat-grid grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
      <button type="button" @click="applyStatut('')" class="text-left bg-white rounded-lg border p-3 transition hover:-translate-y-0.5 hover:border-xelltekk-300 hover:shadow-sm" :class="cardClass('')">
        <div class="text-xs text-gray-500 uppercase">Total</div>
        <div class="text-2xl font-bold text-gray-900">{{ stats.total || 0 }}</div>
      </button>
      <button type="button" @click="applyStatut('en_attente')" class="text-left bg-white rounded-lg border p-3 transition hover:-translate-y-0.5 hover:border-xelltekk-300 hover:shadow-sm" :class="cardClass('en_attente')">
        <div class="text-xs text-gray-500 uppercase">À valider</div>
        <div class="text-2xl font-bold text-orange-600">{{ stats.en_attente || 0 }}</div>
      </button>
      <button type="button" @click="applyPeriod('mois')" class="text-left bg-white rounded-lg border p-3 transition hover:-translate-y-0.5 hover:border-xelltekk-300 hover:shadow-sm" :class="period === 'mois' ? 'border-xelltekk-500 bg-xelltekk-50 ring-2 ring-xelltekk-100' : 'border-gray-200'">
        <div class="text-xs text-gray-500 uppercase">Dépenses du mois</div>
        <div class="text-xl font-bold text-red-600">{{ formatPrice(stats.mois) }}</div>
      </button>
      <button type="button" @click="applyPeriod('annee')" class="text-left bg-white rounded-lg border p-3 transition hover:-translate-y-0.5 hover:border-xelltekk-300 hover:shadow-sm" :class="period === 'annee' ? 'border-xelltekk-500 bg-xelltekk-50 ring-2 ring-xelltekk-100' : 'border-gray-200'">
        <div class="text-xs text-gray-500 uppercase">Dépenses année</div>
        <div class="text-xl font-bold text-red-700">{{ formatPrice(stats.annee) }}</div>
      </button>
    </div>

    <div v-if="loading" class="bg-white rounded-lg p-12 text-center text-gray-500">Chargement...</div>

    <div v-else class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <SortableTh column="reference" :active="sort.key === 'reference'" :icon="sortIcon('reference')" @sort="toggleSort">Référence</SortableTh>
              <SortableTh column="date" :active="sort.key === 'date'" :icon="sortIcon('date')" align="center" @sort="toggleSort">Date</SortableTh>
              <SortableTh column="categorie" :active="sort.key === 'categorie'" :icon="sortIcon('categorie')" @sort="toggleSort">Catégorie</SortableTh>
              <SortableTh column="libelle" :active="sort.key === 'libelle'" :icon="sortIcon('libelle')" @sort="toggleSort">Libellé</SortableTh>
              <SortableTh column="montant" :active="sort.key === 'montant'" :icon="sortIcon('montant')" align="right" @sort="toggleSort">Montant</SortableTh>
              <SortableTh column="mode" :active="sort.key === 'mode'" :icon="sortIcon('mode')" align="center" @sort="toggleSort">Mode</SortableTh>
              <SortableTh column="statut" :active="sort.key === 'statut'" :icon="sortIcon('statut')" align="center" @sort="toggleSort">Statut</SortableTh>
              <SortableTh column="user" :active="sort.key === 'user'" :icon="sortIcon('user')" @sort="toggleSort">Utilisateur</SortableTh>
              <th class="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="d in sortedDepenses" :key="d.id" class="hover:bg-gray-50">
              <td class="px-4 py-3 text-sm font-mono text-gray-600">{{ d.reference }}</td>
              <td class="px-4 py-3 text-sm text-center text-gray-600">{{ formatDate(d.date_depense) }}</td>
              <td class="px-4 py-3 text-sm text-gray-700">{{ categorieLabel(d.categorie) }}</td>
              <td class="px-4 py-3">
                <div class="text-sm font-medium text-gray-900">{{ d.libelle }}</div>
                <div class="text-xs text-gray-500">{{ d.beneficiaire || '-' }}</div>
              </td>
              <td class="px-4 py-3 text-right font-mono font-semibold text-red-700">{{ formatPrice(d.montant) }}</td>
              <td class="px-4 py-3 text-center">
                <span class="badge text-xs bg-gray-100 text-gray-700">{{ modeLabel(d.mode_paiement) }}</span>
              </td>
              <td class="px-4 py-3 text-center">
                <span class="badge text-xs" :class="statutBadge(d.statut)">{{ statutLabel(d.statut) }}</span>
              </td>
              <td class="px-4 py-3 text-sm text-gray-600">
                <div>{{ d.user?.name || '-' }}</div>
                <div v-if="d.tresorerie_compte" class="text-xs text-gray-400">
                  {{ d.tresorerie_compte?.code || '' }} - {{ d.tresorerie_compte?.libelle || '' }}
                </div>
              </td>
              <td class="px-4 py-3 text-right">
                <div class="flex justify-end gap-2">
                  <a v-if="d.justificatif_path" :href="`/${d.justificatif_path}`" target="_blank" class="text-sm text-blue-600 hover:text-blue-800">Pièce</a>
                  <button v-if="canValidate && d.statut === 'en_attente'" @click="validerDepense(d)" class="text-sm text-green-700 hover:text-green-900">Valider</button>
                  <button v-if="canValidate && d.statut === 'en_attente'" @click="rejeterDepense(d)" class="text-sm text-orange-700 hover:text-orange-900">Rejeter</button>
                  <button v-if="d.statut === 'en_attente'" @click="confirmDelete(d)" class="text-sm text-red-600 hover:text-red-800">Supprimer</button>
                </div>
              </td>
            </tr>
            <tr v-if="depenses.length === 0">
              <td colspan="9" class="px-4 py-12 text-center text-gray-400 text-sm">Aucune dépense</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="meta.total > 0" class="px-4 py-3 border-t border-gray-200 flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
        <div class="text-gray-600"><strong>{{ meta.from }}</strong>-<strong>{{ meta.to }}</strong> sur <strong>{{ meta.total }}</strong></div>
        <div class="flex gap-2">
          <button @click="loadDepenses(meta.current_page - 1)" :disabled="meta.current_page === 1" class="btn-secondary px-3 py-1.5 disabled:opacity-40">Précédent</button>
          <span class="px-3 py-1.5 text-gray-600">{{ meta.current_page }} / {{ meta.last_page }}</span>
          <button @click="loadDepenses(meta.current_page + 1)" :disabled="meta.current_page === meta.last_page" class="btn-secondary px-3 py-1.5 disabled:opacity-40">Suivant</button>
        </div>
      </div>
    </div>

    <AppModal v-model="showModal" title="Nouvelle dépense" size="lg">
      <form class="space-y-4" @submit.prevent="saveDepense">
        <div class="grid gap-4 md:grid-cols-2">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Date dépense</label>
            <input v-model="form.date_depense" type="date" class="input" required />
            <p v-if="errors.date_depense" class="mt-1 text-xs text-red-600">{{ errors.date_depense }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
            <select v-model="form.categorie" class="input" required>
              <option v-for="(label, key) in categories" :key="key" :value="key">{{ label }}</option>
            </select>
            <p v-if="errors.categorie" class="mt-1 text-xs text-red-600">{{ errors.categorie }}</p>
          </div>
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-1">Libellé</label>
            <input v-model="form.libelle" class="input" required placeholder="Ex: carburant livraison client" />
            <p v-if="errors.libelle" class="mt-1 text-xs text-red-600">{{ errors.libelle }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Bénéficiaire / fournisseur</label>
            <input v-model="form.beneficiaire" class="input" placeholder="Nom du bénéficiaire" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Montant</label>
            <input v-model.number="form.montant" type="number" min="0" step="1" class="input" required />
            <p v-if="errors.montant" class="mt-1 text-xs text-red-600">{{ errors.montant }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Mode paiement</label>
            <select v-model="form.mode_paiement" class="input" required @change="selectCompteParDefaut">
              <option value="especes">Espèces</option>
              <option value="virement">Virement</option>
              <option value="cheque">Chèque</option>
              <option value="carte_bancaire">Carte bancaire</option>
              <option value="wave">Wave</option>
              <option value="orange_money">Orange Money</option>
              <option value="free_money">Free Money</option>
              <option value="mobile_money">Mobile money</option>
              <option value="autre">Autre</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Référence paiement</label>
            <input v-model="form.reference_paiement" class="input" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Compte à débiter</label>
            <select v-model="form.tresorerie_compte_id" class="input">
              <option value="">Compte par défaut du mode</option>
              <option v-for="compte in comptesTresorerieFiltres" :key="compte.id" :value="compte.id">
                {{ compte.code }} - {{ compte.libelle }}{{ compte.is_default ? ' (par défaut)' : '' }}
              </option>
            </select>
            <p class="mt-1 text-xs text-gray-500">Banque, caisse principale, Wave, Orange Money, etc.</p>
          </div>
          <div v-if="form.mode_paiement === 'especes' && canValidate">
            <label class="block text-sm font-medium text-gray-700 mb-1">Session caisse POS (optionnel)</label>
            <select v-model="form.caisse_session_id" class="input">
              <option value="">Ne pas impacter une session POS</option>
              <option v-for="session in sessionsOuvertes" :key="session.id" :value="session.id">
                {{ session.reference }} - {{ session.user?.name || 'Utilisateur' }}
              </option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Justificatif</label>
            <input type="file" accept=".jpg,.jpeg,.png,.pdf" class="input" @change="onFileChange" />
            <p v-if="errors.justificatif" class="mt-1 text-xs text-red-600">{{ errors.justificatif }}</p>
          </div>
          <div v-if="canValidate" class="md:col-span-2">
            <label class="inline-flex items-center gap-2 text-sm text-gray-700">
              <input v-model="form.valider_directement" type="checkbox" class="rounded border-gray-300" />
              Valider directement cette dépense
            </label>
          </div>
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea v-model="form.notes" class="input min-h-24"></textarea>
          </div>
        </div>

        <div class="flex justify-end gap-2 border-t pt-4">
          <button type="button" class="btn-secondary" @click="showModal = false">Annuler</button>
          <button type="submit" class="btn-primary" :disabled="saving">{{ saving ? 'Enregistrement...' : 'Enregistrer' }}</button>
        </div>
      </form>
    </AppModal>

    <AppModal v-model="showDeleteModal" title="Supprimer la dépense" size="sm">
      <p class="text-gray-700">Supprimer la dépense <strong>{{ depenseToDelete.reference }}</strong> </p>
      <template #footer>
        <button @click="showDeleteModal = false" class="btn-secondary">Annuler</button>
        <button @click="deleteDepense" :disabled="deleting" class="btn-danger">{{ deleting ? '...' : 'Supprimer' }}</button>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/services/api'
import AppModal from '@/components/AppModal.vue'
import SortableTh from '@/components/SortableTh.vue'
import { useToast } from '@/composables/useToast'
import { telechargerCSV } from '@/services/exports'
import { useAuthStore } from '@/stores/auth'
import { useNotificationsStore } from '@/stores/notifications'
import { useTableSort } from '@/composables/useTableSort'

const toast = useToast()
const route = useRoute()
const auth = useAuthStore()
const notifications = useNotificationsStore()
const canValidate = computed(() => ['admin', 'gerant', 'comptable'].includes(auth.user?.role))
const depenses = ref([])
const categories = ref({})
const sessionsOuvertes = ref([])
const comptesTresorerie = ref([])
const loading = ref(false)
const saving = ref(false)
const deleting = ref(false)
const exportLoading = ref(false)
const showModal = ref(false)
const showDeleteModal = ref(false)
const depenseToDelete = ref(null)
const period = ref('')
const errors = reactive({})
const stats = reactive({ total: 0, en_attente: 0, mois: 0, annee: 0, par_categorie: {} })
const meta = reactive({ current_page: 1, last_page: 1, total: 0, from: 0, to: 0 })
const filters = reactive({ search: '', categorie: '', statut: '', mode_paiement: '', date_from: '', date_to: '' })
const form = reactive(defaultForm())
const { sort, toggleSort, sortIcon, sortedRows } = useTableSort('date', 'desc')

const sortedDepenses = computed(() => sortedRows(depenses.value, {
  reference: 'reference',
  date: 'date_depense',
  categorie: (depense) => categorieLabel(depense.categorie),
  libelle: 'libelle',
  montant: (depense) => parseFloat(depense.montant || 0),
  mode: 'mode_paiement',
  statut: 'statut',
  user: (depense) => depense.user?.name || '',
}))

const comptesTresorerieFiltres = computed(() => {
  const actifs = comptesTresorerie.value.filter((compte) => compte.is_active !== false)
  const memeMode = actifs.filter((compte) => compte.mode_paiement === form.mode_paiement)
  return memeMode.length ? memeMode : actifs
})

let searchTimeout = null
function onSearchInput() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => loadDepenses(1), 350)
}

function defaultForm() {
  return {
    date_depense: new Date().toISOString().slice(0, 10),
    categorie: 'autre',
    libelle: '',
    beneficiaire: '',
    montant: null,
    mode_paiement: 'especes',
    reference_paiement: '',
    tresorerie_compte_id: '',
    caisse_session_id: '',
    justificatif: null,
    notes: '',
    valider_directement: false,
  }
}

function resetForm() {
  Object.keys(errors).forEach((key) => delete errors[key])
  Object.assign(form, defaultForm())
}

async function loadDepenses(page = 1) {
  loading.value = true
  try {
    const { data } = await api.get('/depenses', {
      params: {
        page,
        per_page: 25,
        search: filters.search || undefined,
        categorie: filters.categorie || undefined,
        statut: filters.statut || undefined,
        mode_paiement: filters.mode_paiement || undefined,
        date_from: filters.date_from || undefined,
        date_to: filters.date_to || undefined,
      },
    })
    depenses.value = data.data
    Object.assign(meta, { current_page: data.current_page, last_page: data.last_page, total: data.total, from: data.from || 0, to: data.to || 0 })
  } catch (e) {
    toast.error('Erreur de chargement des dépenses')
  } finally {
    loading.value = false
  }
}

async function loadStats() {
  try {
    const { data } = await api.get('/depenses/stats')
    Object.assign(stats, data)
  } catch (e) {}
}

async function loadCategories() {
  const { data } = await api.get('/depenses/categories')
  categories.value = data
}

async function loadComptesTresorerie() {
  try {
    const { data } = await api.get('/tresorerie-comptes', { params: { is_active: 1, per_page: 100 } })
    comptesTresorerie.value = data.data || []
    selectCompteParDefaut()
  } catch (e) {
    comptesTresorerie.value = []
  }
}

async function loadSessionsOuvertes() {
  if (!canValidate.value) return
  try {
    const { data } = await api.get('/caisse/sessions', { params: { statut: 'ouverte', per_page: 100 } })
    sessionsOuvertes.value = data.data || []
  } catch (e) {}
}

function openCreate() {
  resetForm()
  showModal.value = true
  loadComptesTresorerie()
  loadSessionsOuvertes()
}

async function saveDepense() {
  saving.value = true
  Object.keys(errors).forEach((key) => delete errors[key])
  try {
    const payload = new FormData()
    payload.append('date_depense', form.date_depense)
    payload.append('categorie', form.categorie)
    payload.append('libelle', form.libelle)
    payload.append('montant', form.montant)
    payload.append('mode_paiement', form.mode_paiement)
    if (form.beneficiaire) payload.append('beneficiaire', form.beneficiaire)
    if (form.reference_paiement) payload.append('reference_paiement', form.reference_paiement)
    if (form.tresorerie_compte_id) payload.append('tresorerie_compte_id', form.tresorerie_compte_id)
    if (form.caisse_session_id) payload.append('caisse_session_id', form.caisse_session_id)
    if (form.notes) payload.append('notes', form.notes)
    if (form.justificatif) payload.append('justificatif', form.justificatif)
    if (form.valider_directement) payload.append('statut', 'validee')

    await api.post('/depenses', payload, { headers: { 'Content-Type': 'multipart/form-data' } })
    toast.success('Dépense enregistrée')
    showModal.value = false
    loadDepenses(1)
    loadStats()
    notifications.fetchBadges()
  } catch (err) {
    const data = err?.response?.data || {}
    if (data.errors) {
      Object.entries(data.errors).forEach(([key, value]) => { errors[key] = Array.isArray(value) ? value[0] : value })
    }
    toast.error(data.message || 'Erreur lors de l’enregistrement')
  } finally {
    saving.value = false
  }
}

async function validerDepense(depense) {
  try {
    await api.post(`/depenses/${depense.id}/valider`)
    toast.success('Dépense validée')
    loadDepenses(meta.current_page)
    loadStats()
    notifications.fetchBadges()
  } catch (err) {
    toast.error(err?.response?.data?.message || 'Validation impossible')
  }
}

async function rejeterDepense(depense) {
  try {
    await api.post(`/depenses/${depense.id}/rejeter`)
    toast.success('Dépense rejetée')
    loadDepenses(meta.current_page)
    loadStats()
    notifications.fetchBadges()
  } catch (err) {
    toast.error(err?.response?.data?.message || 'Rejet impossible')
  }
}

function confirmDelete(depense) {
  depenseToDelete.value = depense
  showDeleteModal.value = true
}

async function deleteDepense() {
  deleting.value = true
  try {
    await api.delete(`/depenses/${depenseToDelete.value.id}`)
    toast.success('Dépense supprimée')
    showDeleteModal.value = false
    loadDepenses(meta.current_page)
    loadStats()
    notifications.fetchBadges()
  } catch (err) {
    toast.error(err?.response?.data?.message || 'Suppression impossible')
  } finally {
    deleting.value = false
  }
}

async function exporterCSV() {
  exportLoading.value = true
  try {
    await telechargerCSV('/exports/depenses', {
      search: filters.search || undefined,
      categorie: filters.categorie || undefined,
      statut: filters.statut || undefined,
      mode_paiement: filters.mode_paiement || undefined,
      date_from: filters.date_from || undefined,
      date_to: filters.date_to || undefined,
    }, 'depenses_saytu.csv')
    toast.success('Export téléchargé')
  } catch (e) {
    toast.error('Erreur lors de l’export')
  } finally {
    exportLoading.value = false
  }
}

function applyStatut(statut) {
  filters.statut = statut
  period.value = ''
  filters.date_from = ''
  filters.date_to = ''
  loadDepenses(1)
}

function applyPeriod(value) {
  period.value = value
  filters.statut = 'validee'
  filters.date_to = ''
  const now = new Date()
  filters.date_from = value === 'mois' ?
     new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
    : new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10)
  loadDepenses(1)
}

function cardClass(statut) {
  return filters.statut === statut && !period.value ?
     'border-xelltekk-500 bg-xelltekk-50 ring-2 ring-xelltekk-100'
    : 'border-gray-200'
}

function onFileChange(event) {
  form.justificatif = event.target.files?.[0] || null
}

function selectCompteParDefaut() {
  const compte = comptesTresorerie.value.find((item) => item.mode_paiement === form.mode_paiement && item.is_default)
    || comptesTresorerie.value.find((item) => item.mode_paiement === form.mode_paiement)
  form.tresorerie_compte_id = compte?.id || ''
}

function categorieLabel(key) { return categories.value[key] || key || '-' }
function formatPrice(n) { return new Intl.NumberFormat('fr-FR').format(Math.round(n || 0)) + ' XOF' }
function formatDate(d) { return d ? new Date(d).toLocaleDateString('fr-FR') : '-' }
function modeLabel(m) {
  return { virement: 'Virement', cheque: 'Chèque', especes: 'Espèces', carte_bancaire: 'Carte',
    wave: 'Wave', orange_money: 'Orange Money', free_money: 'Free Money', mobile_money: 'Mobile money',
    compensation: 'Compensation', autre: 'Autre' }[m] || m
}
function statutLabel(s) {
  return { en_attente: 'En attente', validee: 'Validée', rejetee: 'Rejetée', annulee: 'Annulée' }[s] || s
}
function statutBadge(s) {
  return {
    en_attente: 'bg-yellow-100 text-yellow-800',
    validee: 'bg-green-100 text-green-800',
    rejetee: 'bg-red-100 text-red-800',
    annulee: 'bg-gray-200 text-gray-700',
  }[s] || 'bg-gray-100 text-gray-700'
}

onMounted(() => {
  if (route.query.statut) {
    filters.statut = String(route.query.statut)
  }
  loadCategories()
  loadComptesTresorerie()
  loadDepenses()
  loadStats()
})

watch(
  () => route.query.statut,
  (statut) => {
    const nextStatut = statut ? String(statut) : ''
    if (filters.statut !== nextStatut) {
      filters.statut = nextStatut
      period.value = ''
      loadDepenses(1)
    }
  }
)
</script>
