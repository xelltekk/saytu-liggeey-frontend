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

        <label class="flex items-center gap-2 text-sm">
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
      <div class="p-4 bg-gradient-to-r from-xelltekk-50 to-blue-50 border-b border-gray-200">
        <h3 class="text-lg font-bold text-gray-900">Balance générale</h3>
        <p class="text-sm text-gray-600">
          Du {{ formatDate(data.periode.from) }} au {{ formatDate(data.periode.to) }}
          — <strong>{{ data.comptes.length }}</strong> comptes
        </p>
      </div>

      <table class="w-full">
        <thead class="bg-gray-50 border-b border-gray-200">
          <tr>
            <th class="px-3 py-2 text-left text-xs font-semibold uppercase">N°</th>
            <th class="px-3 py-2 text-left text-xs font-semibold uppercase">Libellé</th>
            <th class="px-3 py-2 text-center text-xs font-semibold uppercase">Cl.</th>
            <th class="px-3 py-2 text-right text-xs font-semibold uppercase">Total débit</th>
            <th class="px-3 py-2 text-right text-xs font-semibold uppercase">Total crédit</th>
            <th class="px-3 py-2 text-right text-xs font-semibold uppercase">Solde débit</th>
            <th class="px-3 py-2 text-right text-xs font-semibold uppercase">Solde crédit</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="c in data.comptes" :key="c.id" class="hover:bg-gray-50">
            <td class="px-3 py-2 text-xs font-mono font-bold" :class="classeColor(c.classe)">{{ c.numero }}</td>
            <td class="px-3 py-2 text-sm">{{ c.libelle }}</td>
            <td class="px-3 py-2 text-center text-xs">{{ c.classe }}</td>
            <td class="px-3 py-2 text-right font-mono text-xs">{{ formatPrice(c.total_debit) }}</td>
            <td class="px-3 py-2 text-right font-mono text-xs">{{ formatPrice(c.total_credit) }}</td>
            <td class="px-3 py-2 text-right font-mono text-sm font-semibold text-blue-700">
              {{ parseFloat(c.solde_debit) > 0 ? formatPrice(c.solde_debit) : '–' }}
            </td>
            <td class="px-3 py-2 text-right font-mono text-sm font-semibold text-purple-700">
              {{ parseFloat(c.solde_credit) > 0 ? formatPrice(c.solde_credit) : '–' }}
            </td>
          </tr>
        </tbody>
        <tfoot class="bg-gray-100 font-bold">
          <tr>
            <td colspan="3" class="px-3 py-3 text-right text-sm">TOTAUX</td>
            <td class="px-3 py-3 text-right font-mono text-blue-700">{{ formatPrice(data.totaux.total_debit) }}</td>
            <td class="px-3 py-3 text-right font-mono text-purple-700">{{ formatPrice(data.totaux.total_credit) }}</td>
            <td class="px-3 py-3 text-right font-mono text-blue-700">{{ formatPrice(data.totaux.total_solde_debit) }}</td>
            <td class="px-3 py-3 text-right font-mono text-purple-700">{{ formatPrice(data.totaux.total_solde_credit) }}</td>
          </tr>
        </tfoot>
      </table>

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
import { useToast } from '@/composables/useToast'
import { telechargerCSV } from '@/services/exports'

const toast = useToast()
const data = ref(null)
const loading = ref(false)
const exportLoading = ref(false)

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