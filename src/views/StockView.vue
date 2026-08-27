<template>
  <div>
    <!-- Onglets -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
      <div class="flex overflow-x-auto border-b border-gray-200">
        <button @click="onglet = 'stock'" class="px-6 py-3 text-sm font-medium transition-colors"
                :class="onglet === 'stock' ? 'text-xelltekk-700 border-b-2 border-xelltekk-700' : 'text-gray-500 hover:text-gray-700'">
          📦 Stock par emplacement
        </button>
        <button @click="onglet = 'mouvements'" class="px-6 py-3 text-sm font-medium transition-colors"
                :class="onglet === 'mouvements' ? 'text-xelltekk-700 border-b-2 border-xelltekk-700' : 'text-gray-500 hover:text-gray-700'">
          🔄 Mouvements
        </button>
        <button @click="onglet = 'alertes'" class="px-6 py-3 text-sm font-medium transition-colors"
                :class="onglet === 'alertes' ? 'text-xelltekk-700 border-b-2 border-xelltekk-700' : 'text-gray-500 hover:text-gray-700'">
          ⚠️ Alertes
        </button>
      </div>
    </div>

    <!-- Actions globales -->
    <div class="flex flex-col gap-2 mb-4 sm:flex-row sm:flex-wrap">
      <button @click="openMouvement('entree')" class="btn-secondary text-sm">📥 Entrée stock</button>
      <button @click="openMouvement('sortie')" class="btn-secondary text-sm">📤 Sortie stock</button>
      <button @click="openMouvement('ajustement')" class="btn-secondary text-sm">⚙️ Ajustement</button>
      <button @click="exporterCSV" :disabled="exportLoading" class="btn-secondary text-sm">
        {{ exportLoading ? 'Export...' : 'Exporter CSV' }}
      </button>
    </div>

    <!-- Filtres -->
    <div class="bg-white rounded-lg border border-gray-200 p-3 mb-4">
      <div class="flex flex-col gap-2 md:flex-row">
        <input v-model="filters.search" @input="onSearchInput" type="search" placeholder="🔍 Rechercher un produit..." class="input flex-1" />
        <select v-model="filters.entrepot_id" @change="reload" class="input md:w-48">
          <option value="">Tous entrepôts</option>
          <option v-for="e in entrepots" :key="e.id" :value="e.id">{{ e.libelle }}</option>
        </select>
        <select v-if="onglet === 'mouvements'" v-model="filters.type" @change="reload" class="input md:w-40">
          <option value="">Tous types</option>
          <option value="entree">Entrées</option>
          <option value="sortie">Sorties</option>
          <option value="ajustement">Ajustements</option>
        </select>
      </div>
    </div>

    <div v-if="loading" class="bg-white rounded-lg p-12 text-center text-gray-500">Chargement...</div>

    <!-- TAB: Stock -->
    <div v-else-if="onglet === 'stock'" class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div class="border-b border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
        Un produit peut apparaître sur plusieurs lignes lorsqu'il est rangé dans plusieurs emplacements. La colonne « Total produit » affiche sa quantité globale.
      </div>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <SortableTh column="reference" :active="stockSort.key === 'reference'" :icon="stockSortIcon('reference')" @sort="toggleStockSort">Référence</SortableTh>
              <SortableTh column="produit" :active="stockSort.key === 'produit'" :icon="stockSortIcon('produit')" @sort="toggleStockSort">Produit</SortableTh>
              <SortableTh column="entrepot" :active="stockSort.key === 'entrepot'" :icon="stockSortIcon('entrepot')" @sort="toggleStockSort">Entrepôt</SortableTh>
              <SortableTh column="emplacement" :active="stockSort.key === 'emplacement'" :icon="stockSortIcon('emplacement')" @sort="toggleStockSort">Emplacement</SortableTh>
              <SortableTh column="quantite" :active="stockSort.key === 'quantite'" :icon="stockSortIcon('quantite')" align="right" @sort="toggleStockSort">Quantité</SortableTh>
              <SortableTh column="total_produit" :active="stockSort.key === 'total_produit'" :icon="stockSortIcon('total_produit')" align="right" @sort="toggleStockSort">Total produit</SortableTh>
              <SortableTh column="pmp" :active="stockSort.key === 'pmp'" :icon="stockSortIcon('pmp')" align="right" @sort="toggleStockSort">PMP</SortableTh>
              <SortableTh column="valeur" :active="stockSort.key === 'valeur'" :icon="stockSortIcon('valeur')" align="right" @sort="toggleStockSort">Valeur</SortableTh>
              <th class="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="s in sortedStocks" :key="s.id" class="hover:bg-gray-50">
              <td class="px-4 py-3 text-sm font-mono text-gray-600">{{ s.produit?.reference || '-' }}</td>
              <td class="px-4 py-3 text-sm font-medium">{{ s.produit?.libelle || 'Produit' }}</td>
              <td class="px-4 py-3 text-sm text-gray-600">{{ s.entrepot?.libelle || 'Entrepôt' }}</td>
              <td class="px-4 py-3 text-sm text-gray-600">
                <div v-if="s.emplacement">
                  <div class="font-medium text-gray-900">{{ s.emplacement?.zone?.libelle || s.emplacement?.zone?.code || 'Zone' }}</div>
                  <div class="text-xs text-gray-500">{{ emplacementLabel(s.emplacement) }}</div>
                </div>
                <span v-else class="badge bg-orange-100 text-orange-800">À affecter</span>
              </td>
              <td class="px-4 py-3 text-sm text-right font-mono font-semibold"
                  :class="parseFloat(s.quantite) <= parseFloat(s.produit?.stock_alerte || 0) ? 'text-orange-600' : 'text-gray-900'">
                {{ formatQte(s.quantite) }} {{ s.produit?.unite || '' }}
              </td>
              <td class="px-4 py-3 text-sm text-right font-mono font-semibold text-blue-700">
                {{ formatQte(s.stock_total_produit) }} {{ s.produit?.unite || '' }}
              </td>
              <td class="px-4 py-3 text-sm text-right text-gray-600">{{ formatPrice(s.pmp) }}</td>
              <td class="px-4 py-3 text-sm text-right font-semibold text-xelltekk-700">
                {{ formatPrice(s.quantite * s.pmp) }}
              </td>
              <td class="px-4 py-3 text-right">
                <button class="btn-secondary px-3 py-1.5 text-xs" @click="openDeplacement(s)">Déplacer</button>
              </td>
            </tr>
            <tr v-if="stocks.length === 0">
              <td colspan="9" class="px-4 py-12 text-center text-gray-400 text-sm">
                Aucun stock. Faites une entrée pour commencer.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <Pagination v-if="meta.total > 0" :meta="meta" @page="reload" />
    </div>

    <!-- TAB: Mouvements -->
    <div v-else-if="onglet === 'mouvements'" class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div class="overflow-x-auto">
      <table class="w-full">
        <thead class="bg-gray-50 border-b border-gray-200">
          <tr>
            <SortableTh column="date" :active="mouvementSort.key === 'date'" :icon="mouvementSortIcon('date')" @sort="toggleMouvementSort">Date</SortableTh>
            <SortableTh column="type" :active="mouvementSort.key === 'type'" :icon="mouvementSortIcon('type')" @sort="toggleMouvementSort">Type</SortableTh>
            <SortableTh column="produit" :active="mouvementSort.key === 'produit'" :icon="mouvementSortIcon('produit')" @sort="toggleMouvementSort">Produit</SortableTh>
            <SortableTh column="entrepot" :active="mouvementSort.key === 'entrepot'" :icon="mouvementSortIcon('entrepot')" @sort="toggleMouvementSort">Entrepôt</SortableTh>
            <SortableTh column="emplacement" :active="mouvementSort.key === 'emplacement'" :icon="mouvementSortIcon('emplacement')" @sort="toggleMouvementSort">Emplacement</SortableTh>
            <SortableTh column="quantite" :active="mouvementSort.key === 'quantite'" :icon="mouvementSortIcon('quantite')" align="right" @sort="toggleMouvementSort">Quantité</SortableTh>
            <SortableTh column="motif" :active="mouvementSort.key === 'motif'" :icon="mouvementSortIcon('motif')" @sort="toggleMouvementSort">Motif</SortableTh>
            <SortableTh column="user" :active="mouvementSort.key === 'user'" :icon="mouvementSortIcon('user')" @sort="toggleMouvementSort">Par</SortableTh>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="m in sortedMouvements" :key="m.id" class="hover:bg-gray-50">
            <td class="px-4 py-3 text-xs text-gray-600">{{ formatDateTime(m.date_mouvement) }}</td>
            <td class="px-4 py-3"><span class="badge text-xs" :class="typeBadge(m.type)">{{ typeLabel(m.type) }}</span></td>
            <td class="px-4 py-3 text-sm">
              <div class="font-medium">{{ m.produit?.libelle || 'Produit' }}</div>
              <div class="text-xs font-mono text-gray-500">{{ m.produit?.reference || '-' }}</div>
            </td>
            <td class="px-4 py-3 text-sm text-gray-600">{{ m.entrepot?.libelle || 'Entrepôt' }}</td>
            <td class="px-4 py-3 text-xs text-gray-600">
              <span v-if="m.emplacement">{{ emplacementLabel(m.emplacement) }}</span>
              <span v-else class="text-gray-400">Sans emplacement</span>
            </td>
            <td class="px-4 py-3 text-sm text-right font-mono font-semibold"
                :class="m.type === 'transfert' ? 'text-blue-700' : ['entree', 'ajustement'].includes(m.type) && parseFloat(m.quantite) >= 0 ? 'text-green-600' : 'text-red-600'">
              {{ m.type === 'transfert' ? '→ ' : ['sortie'].includes(m.type) ? '-' : (parseFloat(m.quantite) > 0 ? '+' : '') }}{{ formatQte(Math.abs(m.quantite)) }}
            </td>
            <td class="px-4 py-3 text-xs text-gray-600">{{ m.motif || '–' }}</td>
            <td class="px-4 py-3 text-xs text-gray-500">{{ m.user?.name || 'Utilisateur' }}</td>
          </tr>
          <tr v-if="mouvements.length === 0">
            <td colspan="8" class="px-4 py-12 text-center text-gray-400 text-sm">Aucun mouvement</td>
          </tr>
        </tbody>
      </table>
      </div>
      <Pagination v-if="meta.total > 0" :meta="meta" @page="reload" />
    </div>

    <!-- TAB: Alertes -->
    <div v-else-if="onglet === 'alertes'" class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div class="overflow-x-auto">
      <table class="w-full">
        <thead class="bg-gray-50 border-b border-gray-200">
          <tr>
            <SortableTh column="reference" :active="alerteSort.key === 'reference'" :icon="alerteSortIcon('reference')" @sort="toggleAlerteSort">Référence</SortableTh>
            <SortableTh column="produit" :active="alerteSort.key === 'produit'" :icon="alerteSortIcon('produit')" @sort="toggleAlerteSort">Produit</SortableTh>
            <SortableTh column="stock" :active="alerteSort.key === 'stock'" :icon="alerteSortIcon('stock')" align="right" @sort="toggleAlerteSort">Stock actuel</SortableTh>
            <SortableTh column="seuil" :active="alerteSort.key === 'seuil'" :icon="alerteSortIcon('seuil')" align="right" @sort="toggleAlerteSort">Seuil d'alerte</SortableTh>
            <SortableTh column="statut" :active="alerteSort.key === 'statut'" :icon="alerteSortIcon('statut')" align="center" @sort="toggleAlerteSort">Statut</SortableTh>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="a in sortedAlertes" :key="a.id" class="hover:bg-gray-50">
            <td class="px-4 py-3 text-sm font-mono text-gray-600">{{ a.reference }}</td>
            <td class="px-4 py-3 text-sm font-medium">{{ a.libelle }}</td>
            <td class="px-4 py-3 text-sm text-right font-mono font-bold text-red-600">{{ formatQte(a.stock_total) }}</td>
            <td class="px-4 py-3 text-sm text-right font-mono text-gray-600">{{ a.stock_alerte }}</td>
            <td class="px-4 py-3 text-center">
              <span v-if="parseFloat(a.stock_total) === 0" class="badge bg-red-100 text-red-800">RUPTURE</span>
              <span v-else class="badge bg-orange-100 text-orange-800">ALERTE</span>
            </td>
          </tr>
          <tr v-if="alertes.length === 0">
            <td colspan="5" class="px-4 py-12 text-center text-green-600 text-sm">
              ✅ Aucun produit en alerte de stock !
            </td>
          </tr>
        </tbody>
      </table>
      </div>
    </div>

    <!-- Modal mouvement -->
    <AppModal v-model="showMouvementModal" :title="mouvementTitle" size="md">
      <MouvementForm :type="mouvementType" :entrepots="entrepots" @saved="onMouvementSaved" @cancel="showMouvementModal = false" />
    </AppModal>

    <AppModal v-model="showDeplacementModal" title="Déplacer le stock" size="md">
      <form class="space-y-4" @submit.prevent="deplacerStock">
        <div class="rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
          <strong>{{ stockADeplacer.produit?.reference || '' }} — {{ stockADeplacer.produit?.libelle || 'Produit' }}</strong>
          <p class="mt-1">Quantité à déplacer : {{ formatQte(stockADeplacer.quantite) }} {{ stockADeplacer.produit?.unite || '' }}</p>
          <p>Entrepôt : {{ stockADeplacer.entrepot?.libelle || '-' }}</p>
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700">Nouvel emplacement <span class="text-red-500">*</span></label>
          <select v-model.number="deplacementForm.emplacement_id" class="input" required>
            <option :value="null">— Sélectionnez —</option>
            <option v-for="emp in emplacementsDeplacement" :key="emp.id" :value="emp.id">{{ emplacementLabel(emp) }}</option>
          </select>
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700">Motif</label>
          <input v-model="deplacementForm.motif" class="input" placeholder="Rangement, correction d'emplacement..." />
        </div>
        <div class="flex justify-end gap-2 border-t border-gray-200 pt-3">
          <button type="button" class="btn-secondary" @click="showDeplacementModal = false">Annuler</button>
          <button class="btn-primary" :disabled="deplacementSaving">{{ deplacementSaving ? 'Déplacement...' : 'Déplacer le stock' }}</button>
        </div>
      </form>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, computed, h, watch } from 'vue'
import api from '@/services/api'
import AppModal from '@/components/AppModal.vue'
import MouvementForm from '@/components/MouvementForm.vue'
import SortableTh from '@/components/SortableTh.vue'
import { useToast } from '@/composables/useToast'
import { useTableSort } from '@/composables/useTableSort'
import { telechargerCSV } from '@/services/exports'

const toast = useToast()
const onglet = ref('stock')
const stocks = ref([])
const mouvements = ref([])
const alertes = ref([])
const {
  sort: stockSort,
  toggleSort: toggleStockSort,
  sortIcon: stockSortIcon,
  sortedRows: sortedStockRows,
} = useTableSort('produit')
const {
  sort: mouvementSort,
  toggleSort: toggleMouvementSort,
  sortIcon: mouvementSortIcon,
  sortedRows: sortedMouvementRows,
} = useTableSort('date', 'desc')
const {
  sort: alerteSort,
  toggleSort: toggleAlerteSort,
  sortIcon: alerteSortIcon,
  sortedRows: sortedAlerteRows,
} = useTableSort('produit')
const entrepots = ref([])
const loading = ref(false)
const exportLoading = ref(false)
const meta = reactive({ current_page: 1, last_page: 1, total: 0, from: 0, to: 0 })
const filters = reactive({ search: '', entrepot_id: '', type: '' })

const showMouvementModal = ref(false)
const mouvementType = ref('entree')
const showDeplacementModal = ref(false)
const stockADeplacer = ref(null)
const emplacementsDeplacement = ref([])
const deplacementSaving = ref(false)
const deplacementForm = reactive({ emplacement_id: null, motif: '' })

const mouvementTitle = computed(() => ({
  entree: '📥 Entrée en stock',
  sortie: '📤 Sortie de stock',
  ajustement: '⚙️ Ajustement d\'inventaire',
}[mouvementType.value]))

const sortedStocks = computed(() => sortedStockRows(stocks.value, {
  reference: (stock) => stock.produit?.reference || '',
  produit: (stock) => stock.produit?.libelle || '',
  entrepot: (stock) => stock.entrepot?.libelle || '',
  emplacement: (stock) => emplacementLabel(stock.emplacement),
  quantite: (stock) => parseFloat(stock.quantite || 0),
  total_produit: (stock) => parseFloat(stock.stock_total_produit || 0),
  pmp: (stock) => parseFloat(stock.pmp || 0),
  valeur: (stock) => parseFloat(stock.quantite || 0) * parseFloat(stock.pmp || 0),
}))

const sortedMouvements = computed(() => sortedMouvementRows(mouvements.value, {
  date: 'date_mouvement',
  type: 'type',
  produit: (mouvement) => mouvement.produit?.libelle || '',
  entrepot: (mouvement) => mouvement.entrepot?.libelle || '',
  emplacement: (mouvement) => emplacementLabel(mouvement.emplacement),
  quantite: (mouvement) => parseFloat(mouvement.quantite || 0),
  motif: 'motif',
  user: (mouvement) => mouvement.user?.name || '',
}))

const sortedAlertes = computed(() => sortedAlerteRows(alertes.value, {
  reference: 'reference',
  produit: 'libelle',
  stock: (alerte) => parseFloat(alerte.stock_total || 0),
  seuil: (alerte) => parseFloat(alerte.stock_alerte || 0),
  statut: (alerte) => (parseFloat(alerte.stock_total || 0) === 0 ? 'rupture' : 'alerte'),
}))

// Composant Pagination inline
const Pagination = {
  props: ['meta'],
  emits: ['page'],
  setup(props, { emit }) {
    return () => h('div', { class: 'px-4 py-3 border-t border-gray-200 flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between' }, [
      h('div', { class: 'text-gray-600' }, [`${props.meta.from}-${props.meta.to} sur ${props.meta.total}`]),
      h('div', { class: 'flex gap-2' }, [
        h('button', {
          onClick: () => emit('page', props.meta.current_page - 1),
          disabled: props.meta.current_page === 1,
          class: 'btn-secondary px-3 py-1.5 disabled:opacity-40',
        }, '←'),
        h('span', { class: 'px-3 py-1.5 text-gray-600' }, `${props.meta.current_page} / ${props.meta.last_page}`),
        h('button', {
          onClick: () => emit('page', props.meta.current_page + 1),
          disabled: props.meta.current_page === props.meta.last_page,
          class: 'btn-secondary px-3 py-1.5 disabled:opacity-40',
        }, '→'),
      ]),
    ])
  },
}

let searchTimeout = null
let reloadRequestId = 0
function onSearchInput() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => reload(1), 350)
}

async function reload(page = 1) {
  const requestId = ++reloadRequestId
  const tab = onglet.value
  loading.value = true
  try {
    if (tab === 'stock') {
      const { data } = await api.get('/stocks', { params: { page, per_page: 25, search: filters.search || undefined, entrepot_id: filters.entrepot_id || undefined } })
      if (requestId !== reloadRequestId || tab !== onglet.value) return
      stocks.value = data.data
      Object.assign(meta, { current_page: data.current_page, last_page: data.last_page, total: data.total, from: data.from || 0, to: data.to || 0 })
    } else if (tab === 'mouvements') {
      const { data } = await api.get('/stocks/mouvements', { params: { page, per_page: 25, search: filters.search || undefined, entrepot_id: filters.entrepot_id || undefined, type: filters.type || undefined } })
      if (requestId !== reloadRequestId || tab !== onglet.value) return
      mouvements.value = data.data
      Object.assign(meta, { current_page: data.current_page, last_page: data.last_page, total: data.total, from: data.from || 0, to: data.to || 0 })
    } else if (tab === 'alertes') {
      const { data } = await api.get('/stocks/alerts', { params: { search: filters.search || undefined } })
      if (requestId !== reloadRequestId || tab !== onglet.value) return
      alertes.value = data
    }
  } catch (e) {
    toast.error('Erreur de chargement')
  } finally {
    if (requestId === reloadRequestId) {
      loading.value = false
    }
  }
}

async function loadEntrepots() {
  const { data } = await api.get('/entrepots', { params: { actifs_seulement: 1 } })
  entrepots.value = Array.isArray(data) ? data : data.data || []
}

async function exporterCSV() {
  exportLoading.value = true
  try {
    if (onglet.value === 'mouvements') {
      await telechargerCSV('/exports/stocks-mouvements', {
        search: filters.search || undefined,
        entrepot_id: filters.entrepot_id || undefined,
        type: filters.type || undefined,
      }, 'mouvements_stock_saytu.csv')
      toast.success('Export des mouvements de stock téléchargé.')
      return
    }

    await telechargerCSV('/exports/stocks', {
      search: filters.search || undefined,
      entrepot_id: filters.entrepot_id || undefined,
    }, 'stock_saytu.csv')
    toast.success('Export du stock téléchargé.')
  } catch (e) {
    toast.error('Export impossible pour le moment.')
  } finally {
    exportLoading.value = false
  }
}

function openMouvement(type) {
  mouvementType.value = type
  showMouvementModal.value = true
}

function onMouvementSaved() {
  showMouvementModal.value = false
  reload()
}

function formatQte(n) { return parseFloat(n || 0).toLocaleString('fr-FR', { maximumFractionDigits: 3 }) }
function formatPrice(n) { return new Intl.NumberFormat('fr-FR').format(Math.round(n || 0))  }
function formatDateTime(d) { return d ? new Date(d).toLocaleString('fr-FR') : '–' }
function typeLabel(t) { return { entree: 'Entrée', sortie: 'Sortie', transfert: 'Transfert', ajustement: 'Ajustement', inventaire: 'Inventaire' }[t] || t }
function emplacementLabel(emp) {
  if (!emp) return 'Sans emplacement'
  return [
    emp.allee && `Rayon ${emp.allee}`,
    emp.rangee && `Rangée ${emp.rangee}`,
    emp.niveau && `Niveau ${emp.niveau}`,
    emp.code,
  ].filter(Boolean).join(' / ')
}

async function openDeplacement(stock) {
  stockADeplacer.value = stock
  deplacementForm.emplacement_id = null
  deplacementForm.motif = stock.emplacement ? 'Déplacement de stock' : 'Affectation d’un emplacement'
  try {
    const { data } = await api.get(`/entrepots/${stock.entrepot_id}`)
    emplacementsDeplacement.value = (data.entrepot?.zones || []).filter(zone => zone.is_active !== false).flatMap(zone =>
      (zone.emplacements || []).filter(emp => emp.is_active !== false && emp.id !== stock.emplacement_id).map(emp => ({ ...emp, zone }))
    )
    if (emplacementsDeplacement.value.length === 0) {
      toast.error('Aucun autre emplacement disponible dans cet entrepôt.')
      return
    }
    showDeplacementModal.value = true
  } catch (e) {
    toast.error('Impossible de charger les emplacements.')
  }
}

async function deplacerStock() {
  if (!stockADeplacer.value) return
  deplacementSaving.value = true
  try {
    await api.post(`/stocks/${stockADeplacer.value.id}/deplacer`, deplacementForm)
    toast.success('Stock déplacé vers le nouvel emplacement.')
    showDeplacementModal.value = false
    await reload(meta.current_page)
  } catch (e) {
    toast.error(e.response.data.errors.emplacement_id?.[0] || e.response.data.message || 'Déplacement impossible.')
  } finally {
    deplacementSaving.value = false
  }
}

function typeBadge(t) {
  return {
    entree: 'bg-green-100 text-green-800',
    sortie: 'bg-red-100 text-red-800',
    ajustement: 'bg-blue-100 text-blue-800',
    transfert: 'bg-purple-100 text-purple-800',
    inventaire: 'bg-yellow-100 text-yellow-800',
  }[t] || 'bg-gray-100'
}

watch(onglet, () => reload(1))

onUnmounted(() => {
  clearTimeout(searchTimeout)
})

onMounted(async () => {
  await loadEntrepots()
  reload()
})
</script>
