<template>
  <div>
    <!-- Sélection compte -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
      <div class="flex flex-col md:flex-row gap-3">
        <select v-model.number="filters.compte_id" @change="charger" class="input flex-1">
          <option :value="null">— Sélectionnez un compte —</option>
          <optgroup v-for="g in comptesGroupes" :key="g.classe" :label="`Classe ${g.classe}`">
            <option v-for="c in g.comptes" :key="c.id" :value="c.id">
              {{ c.numero }} — {{ c.libelle }}
            </option>
          </optgroup>
        </select>

        <input v-model="filters.date_from" @change="charger" type="date" class="input md:w-40" />
        <input v-model="filters.date_to" @change="charger" type="date" class="input md:w-40" />
      </div>
    </div>

    <div v-if="!filters.compte_id" class="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center text-blue-800">
      📊 Sélectionnez un compte ci-dessus pour afficher son grand livre.
    </div>

    <div v-else-if="loading" class="bg-white rounded-lg p-12 text-center text-gray-500">Chargement...</div>

    <div v-else-if="data" class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <!-- En-tête -->
      <div class="p-4 bg-gradient-to-r from-xelltekk-50 to-blue-50 border-b border-gray-200">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 class="text-lg font-bold text-gray-900">
              Compte {{ data.compte?.numero || '-' }} — {{ data.compte?.libelle || '-' }}
            </h3>
            <p class="text-sm text-gray-600">
              Du {{ formatDate(data.periode.from) }} au {{ formatDate(data.periode.to) }}
            </p>
          </div>
          <div class="text-right">
            <div class="text-xs text-gray-500 uppercase">Solde final</div>
            <div class="text-2xl font-bold" :class="data.solde_final >= 0 ? 'text-green-700' : 'text-red-700'">
              {{ formatPrice(Math.abs(data.solde_final)) }}
              <span class="text-sm">{{ data.solde_final >= 0 ? 'D' : 'C' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Résumé -->
      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-1 p-1 bg-gray-50 text-center text-xs">
        <div class="p-2 bg-white rounded">
          <div class="text-gray-500">Solde initial</div>
          <div class="font-bold">{{ formatPrice(data.solde_initial) }}</div>
        </div>
        <div class="p-2 bg-white rounded">
          <div class="text-gray-500">Total débit</div>
          <div class="font-bold text-blue-700">{{ formatPrice(data.total_debit) }}</div>
        </div>
        <div class="p-2 bg-white rounded">
          <div class="text-gray-500">Total crédit</div>
          <div class="font-bold text-purple-700">{{ formatPrice(data.total_credit) }}</div>
        </div>
        <div class="p-2 bg-white rounded">
          <div class="text-gray-500">Mouvements</div>
          <div class="font-bold">{{ data.lignes.length }}</div>
        </div>
      </div>

      <!-- Tableau -->
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <SortableTh column="date" :active="sort.key === 'date'" :icon="sortIcon('date')" @sort="toggleSort">Date</SortableTh>
              <SortableTh column="journal" :active="sort.key === 'journal'" :icon="sortIcon('journal')" @sort="toggleSort">Journal</SortableTh>
              <SortableTh column="numero" :active="sort.key === 'numero'" :icon="sortIcon('numero')" @sort="toggleSort">N° écriture</SortableTh>
              <SortableTh column="piece" :active="sort.key === 'piece'" :icon="sortIcon('piece')" @sort="toggleSort">Pièce</SortableTh>
              <SortableTh column="libelle" :active="sort.key === 'libelle'" :icon="sortIcon('libelle')" @sort="toggleSort">Libellé</SortableTh>
              <SortableTh column="debit" :active="sort.key === 'debit'" :icon="sortIcon('debit')" align="right" @sort="toggleSort">Débit</SortableTh>
              <SortableTh column="credit" :active="sort.key === 'credit'" :icon="sortIcon('credit')" align="right" @sort="toggleSort">Crédit</SortableTh>
              <SortableTh column="solde" :active="sort.key === 'solde'" :icon="sortIcon('solde')" align="right" @sort="toggleSort">Solde</SortableTh>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-if="parseFloat(data.solde_initial) !== 0" class="bg-blue-50">
              <td colspan="7" class="px-3 py-2 text-xs italic text-blue-800">Solde initial à la période</td>
              <td class="px-3 py-2 text-right font-mono text-sm font-bold">{{ formatPrice(data.solde_initial) }}</td>
            </tr>
            <tr v-for="(l, i) in paginatedLignes" :key="`${l.ecriture_id}-${i}`" class="hover:bg-gray-50">
              <td class="px-3 py-2 text-xs">{{ formatDate(l.date_ecriture) }}</td>
              <td class="px-3 py-2 text-xs">
                <span class="badge bg-xelltekk-100 text-xelltekk-800 text-[10px]">{{ l.journal_code }}</span>
              </td>
              <td class="px-3 py-2 text-xs font-mono text-gray-600">{{ l.numero }}</td>
              <td class="px-3 py-2 text-xs font-mono text-gray-500">{{ l.reference_piece || '–' }}</td>
              <td class="px-3 py-2 text-xs text-gray-700">
                {{ l.libelle }}
                <div v-if="l.numero_auxiliaire" class="text-xelltekk-600 text-[10px] mt-0.5">
                  {{ l.numero_auxiliaire }} — {{ l.auxiliaire_libelle }}
                </div>
              </td>
              <td class="px-3 py-2 text-right font-mono text-xs">
                <span v-if="parseFloat(l.debit) > 0" class="text-blue-700 font-semibold">{{ formatPrice(l.debit) }}</span>
                <span v-else class="text-gray-300">–</span>
              </td>
              <td class="px-3 py-2 text-right font-mono text-xs">
                <span v-if="parseFloat(l.credit) > 0" class="text-purple-700 font-semibold">{{ formatPrice(l.credit) }}</span>
                <span v-else class="text-gray-300">–</span>
              </td>
              <td class="px-3 py-2 text-right font-mono text-xs font-bold" :class="l.solde >= 0 ? 'text-green-700' : 'text-red-700'">
                {{ formatPrice(Math.abs(l.solde)) }}
              </td>
            </tr>
            <tr v-if="data.lignes.length === 0">
              <td colspan="8" class="px-3 py-8 text-center text-gray-400 text-sm">Aucun mouvement sur ce compte pour la période</td>
            </tr>
          </tbody>
        </table>
        <AppPagination v-if="pageMeta.total > 0" :meta="pageMeta" label="mouvements" @page="page = $event" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/services/api'
import AppPagination from '@/components/AppPagination.vue'
import SortableTh from '@/components/SortableTh.vue'
import { useToast } from '@/composables/useToast'
import { useTableSort } from '@/composables/useTableSort'

const route = useRoute()
const toast = useToast()
const comptes = ref([])
const data = ref(null)
const loading = ref(false)
const page = ref(1)
const perPage = 25
const { sort, toggleSort, sortIcon, sortedRows } = useTableSort('date', 'asc')

const filters = reactive({
  compte_id: route.query.compte_id ? parseInt(route.query.compte_id) : null,
  date_from: new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10),
  date_to: new Date().toISOString().slice(0, 10),
})

const comptesGroupes = computed(() => {
  const groupes = {}
  comptes.value.forEach(c => {
    if (!groupes[c.classe]) groupes[c.classe] = []
    groupes[c.classe].push(c)
  })
  return Object.keys(groupes).sort().map(k => ({ classe: k, comptes: groupes[k] }))
})

const sortedLignes = computed(() => sortedRows(data.value.lignes || [], {
  date: 'date_ecriture',
  journal: 'journal_code',
  numero: 'numero',
  piece: 'reference_piece',
  libelle: 'libelle',
  debit: (ligne) => parseFloat(ligne.debit || 0),
  credit: (ligne) => parseFloat(ligne.credit || 0),
  solde: (ligne) => parseFloat(ligne.solde || 0),
}))

const paginatedLignes = computed(() => {
  const start = (page.value - 1) * perPage
  return sortedLignes.value.slice(start, start + perPage)
})

const pageMeta = computed(() => {
  const total = sortedLignes.value.length
  const lastPage = Math.max(Math.ceil(total / perPage), 1)
  const current = Math.min(page.value, lastPage)
  const from = total ? (current - 1) * perPage + 1 : 0
  const to = Math.min(current * perPage, total)

  return { current_page: current, last_page: lastPage, total, from, to }
})

async function loadComptes() {
  const { data: list } = await api.get('/compta/comptes')
  comptes.value = list
}

async function charger() {
  if (!filters.compte_id) { data.value = null; return }
  loading.value = true
  try {
    const { data: result } = await api.get('/compta/grand-livre', {
      params: { compte_id: filters.compte_id, date_from: filters.date_from, date_to: filters.date_to },
    })
    data.value = result
    page.value = 1
  } catch (e) {
    toast.error('Erreur de chargement du grand livre')
  } finally {
    loading.value = false
  }
}

function formatPrice(n) { return new Intl.NumberFormat('fr-FR').format(Math.round(n || 0)) }
function formatDate(d) { return d ? new Date(d).toLocaleDateString('fr-FR') : '–' }

onMounted(async () => {
  await loadComptes()
  if (filters.compte_id) charger()
})

watch(() => route.query.compte_id, (v) => {
  if (v) { filters.compte_id = parseInt(v); charger() }
})
</script>
