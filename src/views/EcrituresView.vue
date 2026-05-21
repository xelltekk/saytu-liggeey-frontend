<template>
  <div>
    <!-- Filtres -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
      <div class="flex flex-col md:flex-row gap-3">
        <input v-model="filters.search" @input="onSearchInput" type="search"
               placeholder="🔍 Numéro, libellé, référence pièce..." class="input flex-1" />

        <select v-model="filters.journal_id" @change="loadEcritures(1)" class="input md:w-48">
          <option value="">Tous journaux</option>
          <option v-for="j in journaux" :key="j.id" :value="j.id">{{ j.code }} - {{ j.libelle }}</option>
        </select>

        <select v-model="filters.source" @change="loadEcritures(1)" class="input md:w-44">
          <option value="">Toutes sources</option>
          <option value="manuelle">Manuelle</option>
          <option value="auto_facture">Auto facture</option>
          <option value="auto_paiement">Auto paiement</option>
          <option value="auto_avoir">Auto avoir</option>
        </select>

        <input v-model="filters.date_from" @change="loadEcritures(1)" type="date" class="input md:w-40" title="Date début" />
        <input v-model="filters.date_to" @change="loadEcritures(1)" type="date" class="input md:w-40" title="Date fin" />
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-4">
      <div class="bg-white rounded-lg border border-gray-200 p-3">
        <div class="text-xs text-gray-500 uppercase">Total écritures</div>
        <div class="text-2xl font-bold text-gray-900">{{ stats.nb_ecritures || 0 }}</div>
      </div>
      <div class="bg-white rounded-lg border border-gray-200 p-3">
        <div class="text-xs text-gray-500 uppercase">Lignes</div>
        <div class="text-2xl font-bold text-blue-600">{{ stats.nb_lignes || 0 }}</div>
      </div>
      <div class="bg-white rounded-lg border border-gray-200 p-3">
        <div class="text-xs text-gray-500 uppercase">Ce mois-ci</div>
        <div class="text-2xl font-bold text-green-600">{{ stats.ecritures_mois || 0 }}</div>
      </div>
      <div class="bg-white rounded-lg border border-gray-200 p-3">
        <div class="text-xs text-gray-500 uppercase">Cette année</div>
        <div class="text-2xl font-bold text-purple-600">{{ stats.ecritures_annee || 0 }}</div>
      </div>
    </div>

    <div v-if="loading" class="bg-white rounded-lg p-12 text-center text-gray-500">Chargement...</div>

    <div v-else class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <table class="w-full">
        <thead class="bg-gray-50 border-b border-gray-200">
          <tr>
            <th class="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">N°</th>
            <th class="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Journal</th>
            <th class="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Date</th>
            <th class="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Libellé</th>
            <th class="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Pièce</th>
            <th class="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Débit</th>
            <th class="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Crédit</th>
            <th class="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Statut</th>
            <th class="px-3 py-3"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="e in ecritures" :key="e.id" class="hover:bg-gray-50">
            <td class="px-3 py-3 text-xs font-mono text-gray-600">{{ e.numero }}</td>
            <td class="px-3 py-3">
              <span class="badge text-xs bg-xelltekk-100 text-xelltekk-800">{{ e.journal?.code }}</span>
            </td>
            <td class="px-3 py-3 text-xs text-center text-gray-600">{{ formatDate(e.date_ecriture) }}</td>
            <td class="px-3 py-3 text-sm text-gray-700 truncate max-w-xs">{{ e.libelle }}</td>
            <td class="px-3 py-3 text-xs font-mono text-gray-500">{{ e.reference_piece || '–' }}</td>
            <td class="px-3 py-3 text-right font-mono text-sm text-blue-700">{{ formatPrice(e.total_debit) }}</td>
            <td class="px-3 py-3 text-right font-mono text-sm text-purple-700">{{ formatPrice(e.total_credit) }}</td>
            <td class="px-3 py-3 text-center">
              <span class="badge text-xs" :class="statutBadge(e.statut)">{{ e.statut }}</span>
            </td>
            <td class="px-3 py-3 text-right">
              <button @click="openDetails(e)" class="text-xelltekk-600 hover:text-xelltekk-800 text-xs">👁️</button>
            </td>
          </tr>
          <tr v-if="ecritures.length === 0">
            <td colspan="9" class="px-4 py-12 text-center text-gray-400 text-sm">Aucune écriture</td>
          </tr>
        </tbody>
      </table>

      <div v-if="meta.total > 0" class="px-4 py-3 border-t border-gray-200 flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
        <div class="text-gray-600">
          <strong>{{ meta.from }}</strong>–<strong>{{ meta.to }}</strong> sur <strong>{{ meta.total }}</strong> écritures
        </div>
        <div class="flex gap-2">
          <button @click="loadEcritures(meta.current_page - 1)" :disabled="meta.current_page === 1" class="btn-secondary px-3 py-1.5 disabled:opacity-40">←</button>
          <span class="px-3 py-1.5 text-gray-600">{{ meta.current_page }} / {{ meta.last_page }}</span>
          <button @click="loadEcritures(meta.current_page + 1)" :disabled="meta.current_page === meta.last_page" class="btn-secondary px-3 py-1.5 disabled:opacity-40">→</button>
        </div>
      </div>
    </div>

    <!-- Modal détails écriture -->
    <AppModal v-model="showDetails" :title="detailsEcriture ? `Écriture ${detailsEcriture.numero}` : ''" size="lg">
      <div v-if="detailsEcriture" class="space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div><strong>Journal :</strong> {{ detailsEcriture.journal?.code }} - {{ detailsEcriture.journal?.libelle }}</div>
          <div><strong>Date :</strong> {{ formatDate(detailsEcriture.date_ecriture) }}</div>
          <div><strong>Pièce :</strong> {{ detailsEcriture.reference_piece || '–' }}</div>
          <div><strong>Source :</strong> {{ sourceLabel(detailsEcriture.source) }}</div>
          <div class="col-span-2"><strong>Libellé :</strong> {{ detailsEcriture.libelle }}</div>
        </div>

        <table class="w-full border border-gray-200 rounded">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-3 py-2 text-left text-xs font-semibold uppercase">Compte</th>
              <th class="px-3 py-2 text-left text-xs font-semibold uppercase">Libellé</th>
              <th class="px-3 py-2 text-right text-xs font-semibold uppercase">Débit</th>
              <th class="px-3 py-2 text-right text-xs font-semibold uppercase">Crédit</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="l in detailsEcriture.lignes" :key="l.id">
              <td class="px-3 py-2">
                <div class="font-mono text-sm font-semibold">{{ l.compte?.numero }}</div>
                <div class="text-xs text-gray-500">{{ l.compte?.libelle }}</div>
                <div v-if="l.compte_auxiliaire" class="text-xs text-xelltekk-600 mt-1">
                  Aux: {{ l.compte_auxiliaire.numero_auxiliaire }} ({{ l.compte_auxiliaire.libelle }})
                </div>
              </td>
              <td class="px-3 py-2 text-sm text-gray-700">{{ l.libelle }}</td>
              <td class="px-3 py-2 text-right font-mono text-sm">
                <span v-if="parseFloat(l.debit) > 0" class="text-blue-700 font-semibold">{{ formatPrice(l.debit) }}</span>
                <span v-else class="text-gray-300">–</span>
              </td>
              <td class="px-3 py-2 text-right font-mono text-sm">
                <span v-if="parseFloat(l.credit) > 0" class="text-purple-700 font-semibold">{{ formatPrice(l.credit) }}</span>
                <span v-else class="text-gray-300">–</span>
              </td>
            </tr>
          </tbody>
          <tfoot class="bg-gray-50 font-bold">
            <tr>
              <td colspan="2" class="px-3 py-2 text-right text-sm">TOTAUX</td>
              <td class="px-3 py-2 text-right font-mono text-blue-700">{{ formatPrice(detailsEcriture.total_debit) }}</td>
              <td class="px-3 py-2 text-right font-mono text-purple-700">{{ formatPrice(detailsEcriture.total_credit) }}</td>
            </tr>
          </tfoot>
        </table>

        <div v-if="!estEquilibree" class="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          ⚠️ Cette écriture n'est pas équilibrée (débit ≠ crédit) !
        </div>
        <div v-else class="p-3 bg-green-50 border border-green-200 rounded text-sm text-green-700">
          ✅ Écriture équilibrée (partie double respectée)
        </div>
      </div>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import api from '@/services/api'
import AppModal from '@/components/AppModal.vue'
import { useToast } from '@/composables/useToast'

const toast = useToast()
const ecritures = ref([])
const journaux = ref([])
const stats = reactive({ nb_ecritures: 0, nb_lignes: 0, ecritures_mois: 0, ecritures_annee: 0 })
const loading = ref(false)
const meta = reactive({ current_page: 1, last_page: 1, total: 0, from: 0, to: 0 })
const filters = reactive({ search: '', journal_id: '', source: '', date_from: '', date_to: '' })

const showDetails = ref(false)
const detailsEcriture = ref(null)

const estEquilibree = computed(() => {
  if (!detailsEcriture.value) return true
  return Math.abs(parseFloat(detailsEcriture.value.total_debit) - parseFloat(detailsEcriture.value.total_credit)) < 0.01
})

let searchTimeout = null
function onSearchInput() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => loadEcritures(1), 350)
}

async function loadEcritures(page = 1) {
  loading.value = true
  try {
    const { data } = await api.get('/compta/ecritures', {
      params: {
        page, per_page: 25,
        search: filters.search || undefined,
        journal_id: filters.journal_id || undefined,
        source: filters.source || undefined,
        date_from: filters.date_from || undefined,
        date_to: filters.date_to || undefined,
      },
    })
    ecritures.value = data.data
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
  try { const { data } = await api.get('/compta/stats'); Object.assign(stats, data) } catch (e) {}
}

async function loadJournaux() {
  try { const { data } = await api.get('/compta/journaux'); journaux.value = data } catch (e) {}
}

async function openDetails(e) {
  const { data } = await api.get(`/compta/ecritures/${e.id}`)
  detailsEcriture.value = data
  showDetails.value = true
}

function formatPrice(n) { return new Intl.NumberFormat('fr-FR').format(Math.round(n || 0)) }
function formatDate(d) { return d ? new Date(d).toLocaleDateString('fr-FR') : '–' }

function sourceLabel(s) {
  return {
    manuelle: 'Manuelle',
    auto_facture: 'Auto - Facture',
    auto_paiement: 'Auto - Paiement',
    auto_avoir: 'Auto - Avoir',
    import: 'Importée',
  }[s] || s
}

function statutBadge(s) {
  return {
    brouillon: 'bg-gray-100 text-gray-700',
    validee: 'bg-green-100 text-green-700',
    cloturee: 'bg-purple-100 text-purple-700',
  }[s] || 'bg-gray-100'
}

onMounted(() => { loadEcritures(); loadStats(); loadJournaux() })
</script>
