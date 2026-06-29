<template>
  <div>
    <!-- Filtres -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
      <div class="flex flex-col md:flex-row gap-3 items-center">
        <input v-model="filters.date_from" @change="charger" type="date" class="input md:w-40" />
        <span class="text-gray-500 text-sm">→</span>
        <input v-model="filters.date_to" @change="charger" type="date" class="input md:w-40" />

        <select v-model="filters.classe" @change="charger" class="input md:w-48">
          <option value="">Toutes classes</option>
          <option v-for="c in [1,2,3,4,5,6,7,8]" :key="c" :value="c">Classe {{ c }}</option>
        </select>

        <label class="flex items-center gap-2 text-sm text-gray-700">
          <input v-model="filters.inclure_vides" @change="charger" type="checkbox" class="h-4 w-4" />
          Inclure comptes vides
        </label>

        <div class="ml-auto flex gap-2">
          <button @click="exporterCSV" :disabled="exportLoading" class="btn-secondary">
            <span v-if="exportLoading">⏳</span>
            <span v-else>📥 Exporter CSV</span>
          </button>
          <button @click="charger" class="btn-primary">🔄 Actualiser</button>
        </div>
      </div>
    </div>

    <div v-if="loading" class="bg-white rounded-lg p-12 text-center text-gray-500">Chargement...</div>

    <div v-else-if="data" class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div class="p-4 bg-gradient-to-r from-xelltekk-50 to-blue-50 border-b border-gray-200 dark:from-slate-900 dark:to-blue-950">
        <h3 class="text-lg font-bold text-black dark:text-white">Balance générale</h3>
        <p class="text-sm text-gray-600">
          Du {{ formatDate(data.periode.from) }} au {{ formatDate(data.periode.to) }}
          — <strong>{{ data.comptes.length }}</strong> comptes
        </p>
      </div>

      <table class="w-full">
        <thead class="bg-gray-50 border-b border-gray-200 text-gray-600">
          <tr>
            <SortableTh column="numero" :active="sort.key === 'numero'" :icon="sortIcon('numero')" @sort="toggleSort">N°</SortableTh>
            <SortableTh column="libelle" :active="sort.key === 'libelle'" :icon="sortIcon('libelle')" @sort="toggleSort">Libellé</SortableTh>
            <SortableTh column="classe" :active="sort.key === 'classe'" :icon="sortIcon('classe')" align="center" @sort="toggleSort">Cl.</SortableTh>
            <SortableTh column="total_debit" :active="sort.key === 'total_debit'" :icon="sortIcon('total_debit')" align="right" @sort="toggleSort">Total débit</SortableTh>
            <SortableTh column="total_credit" :active="sort.key === 'total_credit'" :icon="sortIcon('total_credit')" align="right" @sort="toggleSort">Total crédit</SortableTh>
            <SortableTh column="solde_debit" :active="sort.key === 'solde_debit'" :icon="sortIcon('solde_debit')" align="right" @sort="toggleSort">Solde débit</SortableTh>
            <SortableTh column="solde_credit" :active="sort.key === 'solde_credit'" :icon="sortIcon('solde_credit')" align="right" @sort="toggleSort">Solde crédit</SortableTh>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="c in paginatedComptes" :key="c.id" class="hover:bg-gray-50">
            <td class="px-3 py-2 text-xs font-mono font-bold" :class="classeColor(c.classe)">{{ c.numero }}</td>
            <td class="px-3 py-2 text-sm text-gray-900">{{ c.libelle }}</td>
            <td class="px-3 py-2 text-center text-xs text-gray-700">{{ c.classe }}</td>
            <td class="px-3 py-2 text-right font-mono text-xs text-gray-700">{{ formatPrice(c.total_debit) }}</td>
            <td class="px-3 py-2 text-right font-mono text-xs text-gray-700">{{ formatPrice(c.total_credit) }}</td>
            <td class="px-3 py-2 text-right font-mono text-sm font-semibold text-blue-700">
              {{ parseFloat(c.solde_debit) > 0 ? formatPrice(c.solde_debit) : '–' }}
            </td>
            <td class="px-3 py-2 text-right font-mono text-sm font-semibold text-purple-700">
              {{ parseFloat(c.solde_credit) > 0 ? formatPrice(c.solde_credit) : '–' }}
            </td>
          </tr>
        </tbody>
        <tfoot class="bg-gray-100 font-bold text-gray-900">
          <tr>
            <td colspan="3" class="px-3 py-3 text-right text-sm">TOTAUX</td>
            <td class="px-3 py-3 text-right font-mono text-blue-700">{{ formatPrice(data.totaux.total_debit) }}</td>
            <td class="px-3 py-3 text-right font-mono text-purple-700">{{ formatPrice(data.totaux.total_credit) }}</td>
            <td class="px-3 py-3 text-right font-mono text-blue-700">{{ formatPrice(data.totaux.total_solde_debit) }}</td>
            <td class="px-3 py-3 text-right font-mono text-purple-700">{{ formatPrice(data.totaux.total_solde_credit) }}</td>
          </tr>
        </tfoot>
      </table>
      <AppPagination v-if="pageMeta.total > 0" :meta="pageMeta" label="comptes" @page="page = $event" />

      <!-- Contrôle d'équilibre -->
      <div class="p-3 text-sm" :class="estEquilibree ? 'bg-green-50 border-t border-green-200 text-green-700' : 'bg-red-50 border-t border-red-200 text-red-700'">
        <strong>{{ estEquilibree ? '✅' : '⚠️' }} Contrôle d'équilibre :</strong>
        Total débit = {{ formatPrice(data.totaux.total_debit) }} •
        Total crédit = {{ formatPrice(data.totaux.total_credit) }}
        {{ estEquilibree ? '— La partie double est respectée' : '— Déséquilibre détecté !' }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import api from '@/services/api'
import AppPagination from '@/components/AppPagination.vue'
import SortableTh from '@/components/SortableTh.vue'
import { useToast } from '@/composables/useToast'
import { telechargerCSV } from '@/services/exports'
import { useTableSort } from '@/composables/useTableSort'

const toast = useToast()
const data = ref(null)
const loading = ref(false)
const exportLoading = ref(false)
const page = ref(1)
const perPage = 25
const { sort, toggleSort, sortIcon, sortedRows } = useTableSort('numero')

const filters = reactive({
  date_from: new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10),
  date_to: new Date().toISOString().slice(0, 10),
  classe: '',
  inclure_vides: false,
})

const estEquilibree = computed(() => {
  if (!data.value) return true
  return Math.abs(parseFloat(data.value.totaux.total_debit) - parseFloat(data.value.totaux.total_credit)) < 0.01
})

const sortedComptes = computed(() => sortedRows(data.value.comptes || [], {
  numero: 'numero',
  libelle: 'libelle',
  classe: (compte) => Number(compte.classe || 0),
  total_debit: (compte) => parseFloat(compte.total_debit || 0),
  total_credit: (compte) => parseFloat(compte.total_credit || 0),
  solde_debit: (compte) => parseFloat(compte.solde_debit || 0),
  solde_credit: (compte) => parseFloat(compte.solde_credit || 0),
}))

const paginatedComptes = computed(() => {
  const start = (page.value - 1) * perPage
  return sortedComptes.value.slice(start, start + perPage)
})

const pageMeta = computed(() => {
  const total = sortedComptes.value.length
  const lastPage = Math.max(Math.ceil(total / perPage), 1)
  const current = Math.min(page.value, lastPage)
  const from = total ? (current - 1) * perPage + 1 : 0
  const to = Math.min(current * perPage, total)

  return { current_page: current, last_page: lastPage, total, from, to }
})

async function charger() {
  loading.value = true
  try {
    const { data: result } = await api.get('/compta/balance', {
      params: {
        date_from: filters.date_from,
        date_to: filters.date_to,
        classe: filters.classe || undefined,
        inclure_vides: filters.inclure_vides ? 1 : 0,
      },
    })
    data.value = result
    page.value = 1
  } catch (e) {
    toast.error('Erreur de chargement de la balance')
  } finally {
    loading.value = false
  }
}

async function exporterCSV() {
  exportLoading.value = true
  try {
    await telechargerCSV('/exports/balance-comptable', {
      date_from: filters.date_from,
      date_to: filters.date_to,
    }, 'balance_comptable.csv')
    toast.success('Export téléchargé')
  } catch (e) {
    toast.error('Erreur lors de l\'export')
  } finally {
    exportLoading.value = false
  }
}

function formatPrice(n) { return new Intl.NumberFormat('fr-FR').format(Math.round(n || 0)) }
function formatDate(d) { return d ? new Date(d).toLocaleDateString('fr-FR') : '–' }

function classeColor(c) {
  return {
    1: 'text-yellow-700', 2: 'text-blue-700', 3: 'text-amber-700',
    4: 'text-purple-700', 5: 'text-green-700', 6: 'text-red-700',
    7: 'text-emerald-700', 8: 'text-gray-700',
  }[c] || 'text-gray-700'
}

onMounted(() => charger())
</script>
