<template>
  <div class="space-y-5">
    <div class="rounded-3xl border border-cyan-200 bg-cyan-50/70 p-6 shadow-sm">
      <button class="mb-6 text-sm font-bold text-cyan-700 hover:text-cyan-900" type="button" @click="goBack">
        ← Retour liste
      </button>
      <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p class="text-xs font-black uppercase tracking-[0.22em] text-cyan-700">Écriture comptable</p>
          <h1 class="mt-2 text-3xl font-black text-slate-900">{{ ecriture?.numero || 'Chargement...' }}</h1>
          <p class="mt-1 text-sm text-slate-600">{{ ecriture?.libelle || 'Détail de l’écriture comptable.' }}</p>
        </div>
        <span v-if="ecriture" class="self-start rounded-full px-3 py-1 text-xs font-bold" :class="statutBadge(ecriture.statut)">
          {{ ecriture.statut }}
        </span>
      </div>
    </div>

    <div v-if="loading" class="rounded-3xl border border-cyan-100 bg-white p-12 text-center text-slate-500">
      Chargement...
    </div>

    <template v-else-if="ecriture">
      <div class="grid grid-cols-1 gap-4 rounded-3xl border border-cyan-200 bg-white p-5 text-sm shadow-sm md:grid-cols-2">
        <div>
          <p class="text-xs font-black uppercase tracking-[0.14em] text-cyan-700">Journal</p>
          <p class="mt-1 font-bold text-slate-900">{{ ecriture.journal?.code || '-' }} - {{ ecriture.journal?.libelle || '-' }}</p>
        </div>
        <div>
          <p class="text-xs font-black uppercase tracking-[0.14em] text-cyan-700">Date</p>
          <p class="mt-1 font-bold text-slate-900">{{ formatDate(ecriture.date_ecriture) }}</p>
        </div>
        <div>
          <p class="text-xs font-black uppercase tracking-[0.14em] text-cyan-700">Pièce</p>
          <p class="mt-1 font-bold text-slate-900">{{ ecriture.reference_piece || '–' }}</p>
        </div>
        <div>
          <p class="text-xs font-black uppercase tracking-[0.14em] text-cyan-700">Source</p>
          <p class="mt-1 font-bold text-slate-900">{{ sourceLabel(ecriture.source) }}</p>
        </div>
      </div>

      <div class="overflow-hidden rounded-3xl border border-cyan-200 bg-white shadow-sm">
        <table class="w-full">
          <thead class="bg-cyan-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-black uppercase tracking-[0.14em] text-cyan-700">Compte</th>
              <th class="px-4 py-3 text-left text-xs font-black uppercase tracking-[0.14em] text-cyan-700">Libellé</th>
              <th class="px-4 py-3 text-right text-xs font-black uppercase tracking-[0.14em] text-cyan-700">Débit</th>
              <th class="px-4 py-3 text-right text-xs font-black uppercase tracking-[0.14em] text-cyan-700">Crédit</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-cyan-100">
            <tr v-for="ligne in ecriture.lignes || []" :key="ligne.id">
              <td class="px-4 py-3">
                <div class="font-mono text-sm font-bold text-slate-900">{{ ligne.compte?.numero || '-' }}</div>
                <div class="text-xs text-slate-500">{{ ligne.compte?.libelle || '-' }}</div>
                <div v-if="ligne.compte_auxiliaire" class="mt-1 text-xs font-semibold text-cyan-700">
                  Aux : {{ ligne.compte_auxiliaire?.numero_auxiliaire || '-' }} ({{ ligne.compte_auxiliaire?.libelle || '-' }})
                </div>
              </td>
              <td class="px-4 py-3 text-sm text-slate-700">{{ ligne.libelle }}</td>
              <td class="px-4 py-3 text-right font-mono text-sm">
                <span v-if="Number(ligne.debit) > 0" class="font-bold text-blue-700">{{ formatPrice(ligne.debit) }}</span>
                <span v-else class="text-slate-300">–</span>
              </td>
              <td class="px-4 py-3 text-right font-mono text-sm">
                <span v-if="Number(ligne.credit) > 0" class="font-bold text-purple-700">{{ formatPrice(ligne.credit) }}</span>
                <span v-else class="text-slate-300">–</span>
              </td>
            </tr>
          </tbody>
          <tfoot class="bg-cyan-50 font-black">
            <tr>
              <td colspan="2" class="px-4 py-3 text-right text-sm text-slate-900">Totaux</td>
              <td class="px-4 py-3 text-right font-mono text-blue-700">{{ formatPrice(ecriture.total_debit) }}</td>
              <td class="px-4 py-3 text-right font-mono text-purple-700">{{ formatPrice(ecriture.total_credit) }}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div
        class="rounded-2xl border p-4 text-sm font-semibold"
        :class="estEquilibree ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-800'"
      >
        {{ estEquilibree ? '✅ Écriture équilibrée (partie double respectée).' : '⚠️ Cette écriture n’est pas équilibrée (débit ≠ crédit).' }}
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const loading = ref(false)
const ecriture = ref(null)

const estEquilibree = computed(() => {
  if (!ecriture.value) return true
  return Math.abs(Number(ecriture.value.total_debit || 0) - Number(ecriture.value.total_credit || 0)) < 0.01
})

async function loadEcriture() {
  loading.value = true
  try {
    const { data } = await api.get(`/compta/ecritures/${route.params.id}`)
    ecriture.value = data
  } catch (error) {
    toast.error(error.response?.data?.message || 'Écriture introuvable.')
    router.replace({ name: 'compta-ecritures' })
  } finally {
    loading.value = false
  }
}

function goBack() {
  router.push({ name: 'compta-ecritures' })
}

function formatPrice(n) { return new Intl.NumberFormat('fr-FR').format(Math.round(n || 0)) }
function formatDate(d) { return d ? new Date(d).toLocaleDateString('fr-FR') : '–' }

function sourceLabel(source) {
  return {
    manuelle: 'Manuelle',
    auto_facture: 'Auto - Facture',
    auto_paiement: 'Auto - Paiement',
    auto_avoir: 'Auto - Avoir',
    import: 'Importée',
  }[source] || source || '–'
}

function statutBadge(statut) {
  return {
    brouillon: 'bg-slate-100 text-slate-700',
    validee: 'bg-emerald-100 text-emerald-700',
    cloturee: 'bg-purple-100 text-purple-700',
  }[statut] || 'bg-slate-100 text-slate-700'
}

onMounted(loadEcriture)
</script>
