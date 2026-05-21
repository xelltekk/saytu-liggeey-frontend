<template>
  <div>
    <!-- Onglets -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
      <div class="flex overflow-x-auto border-b border-gray-200">
        <button @click="onglet = 'stock'" class="px-6 py-3 text-sm font-medium transition-colors"
                :class="onglet === 'stock' ? 'text-xelltekk-700 border-b-2 border-xelltekk-700' : 'text-gray-500 hover:text-gray-700'">
          📦 Stock par produit
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
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Référence</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Produit</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Entrepôt</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Emplacement</th>
              <th class="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Quantité</th>
              <th class="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">PMP</th>
              <th class="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Valeur</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="s in stocks" :key="s.id" class="hover:bg-gray-50">
              <td class="px-4 py-3 text-sm font-mono text-gray-600">{{ s.produit?.reference }}</td>
              <td class="px-4 py-3 text-sm font-medium">{{ s.produit?.libelle }}</td>
              <td class="px-4 py-3 text-sm text-gray-600">{{ s.entrepot?.libelle }}</td>
              <td class="px-4 py-3 text-sm text-gray-600">
                <div v-if="s.emplacement">
                  <div class="font-medium text-gray-900">{{ s.emplacement.zone?.libelle || s.emplacement.zone?.code || 'Zone' }}</div>
                  <div class="text-xs text-gray-500">{{ emplacementLabel(s.emplacement) }}</div>
                </div>
                <span v-else class="text-gray-400">Sans emplacement</span>
              </td>
              <td class="px-4 py-3 text-sm text-right font-mono font-semibold"
                  :class="parseFloat(s.quantite) <= parseFloat(s.produit?.stock_alerte || 0) ? 'text-orange-600' : 'text-gray-900'">
                {{ formatQte(s.quantite) }} {{ s.produit?.unite }}
              </td>
              <td class="px-4 py-3 text-sm text-right text-gray-600">{{ formatPrice(s.pmp) }}</td>
              <td class="px-4 py-3 text-sm text-right font-semibold text-xelltekk-700">
                {{ formatPrice(s.quantite * s.pmp) }}
              </td>
            </tr>
            <tr v-if="stocks.length === 0">
              <td colspan="7" class="px-4 py-12 text-center text-gray-400 text-sm">
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
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Type</th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Produit</th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Entrepôt</th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Emplacement</th>
            <th class="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Quantité</th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Motif</th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Par</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="m in mouvements" :key="m.id" class="hover:bg-gray-50">
            <td class="px-4 py-3 text-xs text-gray-600">{{ formatDateTime(m.date_mouvement) }}</td>
            <td class="px-4 py-3"><span class="badge text-xs" :class="typeBadge(m.type)">{{ typeLabel(m.type) }}</span></td>
            <td class="px-4 py-3 text-sm">
              <div class="font-medium">{{ m.produit?.libelle }}</div>
              <div class="text-xs font-mono text-gray-500">{{ m.produit?.reference }}</div>
            </td>
            <td class="px-4 py-3 text-sm text-gray-600">{{ m.entrepot?.libelle }}</td>
            <td class="px-4 py-3 text-xs text-gray-600">
              <span v-if="m.emplacement">{{ emplacementLabel(m.emplacement) }}</span>
              <span v-else class="text-gray-400">Sans emplacement</span>
            </td>
            <td class="px-4 py-3 text-sm text-right font-mono font-semibold"
                :class="['entree', 'ajustement'].includes(m.type) && parseFloat(m.quantite) >= 0 ? 'text-green-600' : 'text-red-600'">
              {{ ['sortie'].includes(m.type) ? '-' : (parseFloat(m.quantite) > 0 ? '+' : '') }}{{ formatQte(Math.abs(m.quantite)) }}
            </td>
            <td class="px-4 py-3 text-xs text-gray-600">{{ m.motif || '–' }}</td>
            <td class="px-4 py-3 text-xs text-gray-500">{{ m.user?.name }}</td>
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
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Référence</th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Produit</th>
            <th class="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Stock actuel</th>
            <th class="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Seuil d'alerte</th>
            <th class="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Statut</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="a in alertes" :key="a.id" class="hover:bg-gray-50">
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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, h } from 'vue'
import api from '@/services/api'
import AppModal from '@/components/AppModal.vue'
import MouvementForm from '@/components/MouvementForm.vue'
import { useToast } from '@/composables/useToast'

const toast = useToast()
const onglet = ref('stock')
const stocks = ref([])
const mouvements = ref([])
const alertes = ref([])
const entrepots = ref([])
const loading = ref(false)
const meta = reactive({ current_page: 1, last_page: 1, total: 0, from: 0, to: 0 })
const filters = reactive({ search: '', entrepot_id: '', type: '' })

const showMouvementModal = ref(false)
const mouvementType = ref('entree')

const mouvementTitle = computed(() => ({
  entree: '📥 Entrée en stock',
  sortie: '📤 Sortie de stock',
  ajustement: '⚙️ Ajustement d\'inventaire',
}[mouvementType.value]))

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
function onSearchInput() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => reload(1), 350)
}

async function reload(page = 1) {
  loading.value = true
  try {
    if (onglet.value === 'stock') {
      const { data } = await api.get('/stocks', { params: { page, per_page: 25, search: filters.search || undefined, entrepot_id: filters.entrepot_id || undefined } })
      stocks.value = data.data
      Object.assign(meta, { current_page: data.current_page, last_page: data.last_page, total: data.total, from: data.from || 0, to: data.to || 0 })
    } else if (onglet.value === 'mouvements') {
      const { data } = await api.get('/stocks/mouvements', { params: { page, per_page: 25, entrepot_id: filters.entrepot_id || undefined, type: filters.type || undefined } })
      mouvements.value = data.data
      Object.assign(meta, { current_page: data.current_page, last_page: data.last_page, total: data.total, from: data.from || 0, to: data.to || 0 })
    } else if (onglet.value === 'alertes') {
      const { data } = await api.get('/stocks/alerts')
      alertes.value = data
    }
  } catch (e) {
    toast.error('Erreur de chargement')
  } finally {
    loading.value = false
  }
}

async function loadEntrepots() {
  const { data } = await api.get('/entrepots', { params: { actifs_seulement: 1 } })
  entrepots.value = data
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
function formatPrice(n) { return new Intl.NumberFormat('fr-FR').format(Math.round(n || 0)) + ' XOF' }
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

function typeBadge(t) {
  return {
    entree: 'bg-green-100 text-green-800',
    sortie: 'bg-red-100 text-red-800',
    ajustement: 'bg-blue-100 text-blue-800',
    transfert: 'bg-purple-100 text-purple-800',
    inventaire: 'bg-yellow-100 text-yellow-800',
  }[t] || 'bg-gray-100'
}

import { watch } from 'vue'
watch(onglet, () => reload(1))

onMounted(async () => {
  await loadEntrepots()
  reload()
})
</script>
