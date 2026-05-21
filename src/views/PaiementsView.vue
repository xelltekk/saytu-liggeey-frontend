<template>
  <div>
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
      <div class="flex flex-col md:flex-row gap-3">
        <input v-model="filters.search" @input="onSearchInput" type="search" placeholder="🔍 Référence, client..." class="input flex-1" />
        <select v-model="filters.mode_paiement" @change="loadPaiements(1)" class="input md:w-48">
          <option value="">Tous modes</option>
          <option value="virement">Virement</option>
          <option value="cheque">Chèque</option>
          <option value="especes">Espèces</option>
          <option value="wave">Wave</option>
          <option value="orange_money">Orange Money</option>
          <option value="free_money">Free Money</option>
          <option value="carte_bancaire">Carte bancaire</option>
          <option value="autre">Autre</option>
        </select>
        <button v-if="!isCaissier" @click="exporterCSV" :disabled="exportLoading" class="btn-secondary whitespace-nowrap">
          <span v-if="exportLoading">⏳ Export...</span>
          <span v-else>📥 Exporter CSV</span>
        </button>
        <button v-if="!isCaissier" @click="openCreate" class="btn-primary whitespace-nowrap">+ Nouveau paiement</button>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
      <div class="bg-white rounded-lg border border-gray-200 p-3">
        <div class="text-xs text-gray-500 uppercase">{{ isCaissier ? 'Mes paiements' : 'Total paiements' }}</div>
        <div class="text-2xl font-bold text-gray-900">{{ stats.total || 0 }}</div>
      </div>
      <div class="bg-white rounded-lg border border-gray-200 p-3">
        <div class="text-xs text-gray-500 uppercase">Mois en cours</div>
        <div class="text-xl font-bold text-blue-600">{{ formatPrice(stats.mois) }}</div>
      </div>
      <div class="bg-white rounded-lg border border-gray-200 p-3">
        <div class="text-xs text-gray-500 uppercase">Année en cours</div>
        <div class="text-xl font-bold text-green-600">{{ formatPrice(stats.annee) }}</div>
      </div>
    </div>

    <div v-if="loading" class="bg-white rounded-lg p-12 text-center text-gray-500">Chargement...</div>

    <div v-else class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Référence</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Client</th>
              <th class="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Date</th>
              <th class="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Montant</th>
              <th class="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Mode</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Factures</th>
              <th v-if="!isCaissier" class="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="p in paiements" :key="p.id" class="hover:bg-gray-50">
              <td class="px-4 py-3 text-sm font-mono text-gray-600">{{ p.reference }}</td>
              <td class="px-4 py-3">
                <div class="text-sm font-medium text-gray-900">{{ p.client?.nom }}</div>
                <div class="text-xs text-gray-500">{{ p.client?.code }}</div>
              </td>
              <td class="px-4 py-3 text-sm text-center text-gray-600">{{ formatDate(p.date_paiement) }}</td>
              <td class="px-4 py-3 text-right font-mono font-semibold text-green-700">{{ formatPrice(p.montant) }}</td>
              <td class="px-4 py-3 text-center">
                <span class="badge text-xs" :class="modeBadge(p.mode_paiement)">{{ modeLabel(p.mode_paiement) }}</span>
              </td>
              <td class="px-4 py-3 text-xs text-gray-600">
                <span v-if="p.factures?.length">{{ p.factures.map(f => f.numero).join(', ') }}</span>
                <span v-else class="text-gray-400">–</span>
              </td>
              <td v-if="!isCaissier" class="px-4 py-3 text-right">
                <button @click="confirmDelete(p)" class="text-red-600 hover:text-red-800" title="Supprimer">🗑️</button>
              </td>
            </tr>
            <tr v-if="paiements.length === 0">
              <td :colspan="isCaissier ? 6 : 7" class="px-4 py-12 text-center text-gray-400 text-sm">Aucun paiement</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="meta.total > 0" class="px-4 py-3 border-t border-gray-200 flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
        <div class="text-gray-600"><strong>{{ meta.from }}</strong>–<strong>{{ meta.to }}</strong> sur <strong>{{ meta.total }}</strong></div>
        <div class="flex gap-2">
          <button @click="loadPaiements(meta.current_page - 1)" :disabled="meta.current_page === 1" class="btn-secondary px-3 py-1.5 disabled:opacity-40">←</button>
          <span class="px-3 py-1.5 text-gray-600">{{ meta.current_page }} / {{ meta.last_page }}</span>
          <button @click="loadPaiements(meta.current_page + 1)" :disabled="meta.current_page === meta.last_page" class="btn-secondary px-3 py-1.5 disabled:opacity-40">→</button>
        </div>
      </div>
    </div>

    <AppModal v-model="showModal" title="Nouveau paiement" size="lg">
      <PaiementForm @saved="onSaved" @cancel="showModal = false" />
    </AppModal>

    <AppModal v-model="showDeleteModal" title="Supprimer le paiement" size="sm">
      <p class="text-gray-700">Supprimer le paiement <strong>{{ paiementToDelete?.reference }}</strong> ?</p>
      <p class="text-xs text-gray-500 mt-2">Les factures liées seront recalculées automatiquement.</p>
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
import { ref, reactive, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'
import AppModal from '@/components/AppModal.vue'
import PaiementForm from '@/components/PaiementForm.vue'
import { useToast } from '@/composables/useToast'
import { telechargerCSV } from '@/services/exports'
import { useAuthStore } from '@/stores/auth'

const toast = useToast()
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const isCaissier = auth.user?.role === 'caissier'
const paiements = ref([])
const loading = ref(false)
const exportLoading = ref(false)
const stats = reactive({ total: 0, mois: 0, annee: 0 })
const meta = reactive({ current_page: 1, last_page: 1, total: 0, from: 0, to: 0 })
const filters = reactive({ search: '', mode_paiement: '' })

const showModal = ref(false)
const showDeleteModal = ref(false)
const paiementToDelete = ref(null)
const deleting = ref(false)

let searchTimeout = null
function onSearchInput() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => loadPaiements(1), 350)
}

async function loadPaiements(page = 1) {
  loading.value = true
  try {
    const { data } = await api.get('/paiements', {
      params: { page, per_page: 25, search: filters.search || undefined, mode_paiement: filters.mode_paiement || undefined },
    })
    paiements.value = data.data
    Object.assign(meta, { current_page: data.current_page, last_page: data.last_page, total: data.total, from: data.from || 0, to: data.to || 0 })
  } catch (e) { toast.error('Erreur de chargement') }
  finally { loading.value = false }
}

async function loadStats() {
  try { const { data } = await api.get('/paiements-stats'); Object.assign(stats, data) } catch (e) {}
}

async function exporterCSV() {
  exportLoading.value = true
  try {
    await telechargerCSV('/exports/paiements', {
      mode_paiement: filters.mode_paiement || undefined,
    }, 'paiements_xelltekk.csv')
    toast.success('Export téléchargé')
  } catch (e) {
    toast.error('Erreur lors de l\'export')
  } finally {
    exportLoading.value = false
  }
}

function openCreate() { showModal.value = true }
function onSaved() { showModal.value = false; loadPaiements(meta.current_page); loadStats() }
function confirmDelete(p) { paiementToDelete.value = p; showDeleteModal.value = true }

async function handleDelete() {
  deleting.value = true
  try {
    await api.delete(`/paiements/${paiementToDelete.value.id}`)
    toast.success('Paiement supprimé')
    showDeleteModal.value = false
    loadPaiements(meta.current_page)
    loadStats()
  } catch (err) { toast.error(err.response?.data?.message || 'Erreur') }
  finally { deleting.value = false }
}

function formatPrice(n) { return new Intl.NumberFormat('fr-FR').format(Math.round(n || 0)) + ' XOF' }
function formatDate(d) { return d ? new Date(d).toLocaleDateString('fr-FR') : '–' }
function modeLabel(m) {
  return { virement: 'Virement', cheque: 'Chèque', especes: 'Espèces', carte_bancaire: 'CB',
    wave: '🌊 Wave', orange_money: '🟠 OM', free_money: 'Free', mobile_money: 'Mobile',
    compensation: 'Compensation', autre: 'Autre' }[m] || m
}
function modeBadge(m) {
  return { virement: 'bg-blue-100 text-blue-800', cheque: 'bg-purple-100 text-purple-800',
    especes: 'bg-green-100 text-green-800', wave: 'bg-cyan-100 text-cyan-800',
    orange_money: 'bg-orange-100 text-orange-800', free_money: 'bg-indigo-100 text-indigo-800' }[m] || 'bg-gray-100'
}

function applySearchFromRoute(search) {
  if (!search) return
  filters.search = String(search)
  loadPaiements(1)
  router.replace({ path: '/paiements', query: {} })
}

onMounted(() => {
  applySearchFromRoute(route.query.search)
  if (!route.query.search) loadPaiements()
  loadStats()
})

watch(() => route.query.search, (search) => {
  applySearchFromRoute(search)
})
</script>
