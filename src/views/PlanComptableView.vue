<template>
  <div>
    <!-- Header -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
      <div class="flex flex-col md:flex-row gap-3">
        <input v-model="filters.search" @input="onSearchInput" type="search"
               placeholder="🔍 Numéro ou libellé du compte..." class="input flex-1" />

        <select v-model="filters.classe" @change="loadComptes" class="input md:w-48">
          <option value="">Toutes classes</option>
          <option value="1">1 - Ressources durables</option>
          <option value="2">2 - Immobilisations</option>
          <option value="3">3 - Stocks</option>
          <option value="4">4 - Tiers</option>
          <option value="5">5 - Trésorerie</option>
          <option value="6">6 - Charges</option>
          <option value="7">7 - Produits</option>
          <option value="8">8 - Autres</option>
        </select>

        <select v-model="filters.type" @change="loadComptes" class="input md:w-44">
          <option value="">Tous types</option>
          <option value="actif">Actif</option>
          <option value="passif">Passif</option>
          <option value="charge">Charge</option>
          <option value="produit">Produit</option>
        </select>
      </div>
    </div>

    <!-- Légende -->
    <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-sm text-blue-800">
      📚 <strong>Plan Comptable SYSCOHADA</strong> — Système comptable OHADA en vigueur au Sénégal. Les comptes sont classés par classe (1 à 8) selon leur nature.
    </div>

    <div v-if="loading" class="bg-white rounded-lg p-12 text-center text-gray-500">Chargement...</div>

    <div v-else class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <table class="w-full">
        <thead class="bg-gray-50 border-b border-gray-200">
          <tr>
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">N°</th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Libellé</th>
            <th class="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Classe</th>
            <th class="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Type</th>
            <th class="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Sens</th>
            <th class="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Auxiliaire</th>
            <th class="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Action</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="c in comptes" :key="c.id" class="hover:bg-gray-50">
            <td class="px-4 py-3 text-sm font-mono font-bold" :class="classeColor(c.classe)">{{ c.numero }}</td>
            <td class="px-4 py-3 text-sm text-gray-900">{{ c.libelle }}</td>
            <td class="px-4 py-3 text-center">
              <span class="badge text-xs" :class="classeBg(c.classe)">{{ c.classe }}</span>
            </td>
            <td class="px-4 py-3 text-center text-xs text-gray-600 uppercase">{{ c.type }}</td>
            <td class="px-4 py-3 text-center">
              <span class="badge text-xs" :class="c.sens_normal === 'debit' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'">
                {{ c.sens_normal === 'debit' ? 'Débit' : 'Crédit' }}
              </span>
            </td>
            <td class="px-4 py-3 text-center text-xs">
              <span v-if="c.is_auxiliaire" class="text-green-600">✓</span>
              <span v-else class="text-gray-300">–</span>
            </td>
            <td class="px-4 py-3 text-right">
              <router-link :to="`/compta/grand-livre?compte_id=${c.id}`" class="text-xelltekk-600 hover:text-xelltekk-800 text-xs font-medium">
                Grand livre →
              </router-link>
            </td>
          </tr>
          <tr v-if="comptes.length === 0">
            <td colspan="7" class="px-4 py-12 text-center text-gray-400 text-sm">Aucun compte</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'

const toast = useToast()
const comptes = ref([])
const loading = ref(false)
const filters = reactive({ search: '', classe: '', type: '' })

let searchTimeout = null
function onSearchInput() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => loadComptes(), 350)
}

async function loadComptes() {
  loading.value = true
  try {
    const { data } = await api.get('/compta/comptes', {
      params: {
        search: filters.search || undefined,
        classe: filters.classe || undefined,
        type: filters.type || undefined,
      },
    })
    comptes.value = data
  } catch (e) {
    toast.error('Erreur de chargement')
  } finally {
    loading.value = false
  }
}

function classeBg(c) {
  return {
    1: 'bg-yellow-100 text-yellow-800',
    2: 'bg-blue-100 text-blue-800',
    3: 'bg-amber-100 text-amber-800',
    4: 'bg-purple-100 text-purple-800',
    5: 'bg-green-100 text-green-800',
    6: 'bg-red-100 text-red-800',
    7: 'bg-emerald-100 text-emerald-800',
    8: 'bg-gray-100 text-gray-800',
  }[c] || 'bg-gray-100'
}
function classeColor(c) {
  return {
    1: 'text-yellow-700', 2: 'text-blue-700', 3: 'text-amber-700',
    4: 'text-purple-700', 5: 'text-green-700', 6: 'text-red-700',
    7: 'text-emerald-700', 8: 'text-gray-700',
  }[c] || 'text-gray-700'
}

onMounted(() => loadComptes())
</script>