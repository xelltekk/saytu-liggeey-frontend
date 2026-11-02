<template>
  <section class="rounded-xl border border-cyan-200 bg-white p-4 text-slate-900">
    <h3 class="font-bold">Rattacher à un contrat</h3>
    <p class="my-2 text-sm">Le client, l’imprimante, les tarifs et le forfait seront préremplis. Le dernier relevé facturé sera repris s’il existe.</p>
    <form class="flex flex-wrap gap-2" @submit.prevent="searchContracts"><input v-model="search" aria-label="Rechercher un contrat" placeholder="Client, contrat, numéro de série…" class="input flex-1" maxlength="100" /><button class="btn-secondary" :disabled="loading">Rechercher</button></form>
    <p v-if="error" role="alert" class="mt-2 text-red-800">{{ error }}</p>
    <ul class="mt-3 max-h-64 overflow-auto divide-y"><li v-for="row in rows" :key="row.id" class="py-2"><RouterLink class="font-semibold text-cyan-800 underline" :to="leasingComparisonLocation({ contrat: row.id })">{{ row.numero }} · {{ row.client?.nom }} · {{ row.imprimante?.numero_serie }}</RouterLink></li></ul>
    <p v-if="searched && !rows.length && !loading" class="mt-2">Aucun contrat actif trouvé.</p>
    <p class="mt-2 text-xs">Les contrats avec pages incluses se traitent dans les relevés contractuels. Vous pouvez toujours comparer des PDF sans contrat.</p>
  </section>
</template>
<script setup>
import { ref, onBeforeUnmount } from 'vue'
import api from '@/services/api'
import { leasingComparisonLocation } from '@/services/leasingNavigation.mjs'
const search = ref(''), rows = ref([]), error = ref(''), loading = ref(false), searched = ref(false)
let sequence = 0
async function searchContracts() {
  const token = ++sequence; loading.value = true; error.value = ''; searched.value = true
  try { const { data } = await api.get('/leasing/contrats', { params: { search: search.value, statut: 'actif', per_page: 15 } }); if (token === sequence) rows.value = data.data || [] }
  catch { if (token === sequence) error.value = 'Recherche indisponible. Réessayez.' }
  finally { if (token === sequence) loading.value = false }
}
onBeforeUnmount(() => sequence++)
</script>
