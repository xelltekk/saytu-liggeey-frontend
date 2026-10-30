<template>
  <section aria-label="Comparaisons facturées" class="space-y-4 text-slate-900">
    <div v-if="detail" class="space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div><h3 class="text-lg font-bold">Suivi du relevé · {{ detail.facture.numero }}</h3><p class="text-sm text-slate-600">{{ detail.client?.nom }} · {{ detail.serial }} · Version {{ detail.revision }}</p></div>
        <div class="flex flex-wrap gap-2">
          <button type="button" class="btn-secondary" @click="closeDetail"><ArrowLeft class="mr-2 h-4 w-4" />Historique</button>
          <RouterLink v-if="!detail.facture.deleted_at" class="btn-secondary" :to="{ name: 'facture-detail', params: { id: detail.facture.id } }"><FileText class="mr-2 h-4 w-4" />Facture</RouterLink>
          <RouterLink v-if="detail.modifiable" class="btn-primary" :to="leasingComparisonLocation({ correction: detail.id })"><Pencil class="mr-2 h-4 w-4" />Corriger le relevé</RouterLink>
        </div>
      </div>
      <div class="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm"><span>Facture : <strong>{{ status(detail.facture.statut) }}</strong></span><span>Total HT : <strong>{{ money(detail.facture.total_ht) }}</strong></span><span>Total TTC : <strong>{{ money(detail.facture.total_ttc) }}</strong></span><span>PDF source : non archivé</span></div>
      <p v-if="detail.blocage" role="status" class="border-l-4 border-amber-500 bg-amber-50 p-3 text-sm text-amber-900">{{ detail.blocage }}</p>
      <LeasingComparisonValues :payload="detail.payload" />
      <section aria-label="Versions du relevé" class="space-y-2 border-t border-slate-200 pt-4">
        <h4 class="font-bold">Journal des versions</h4>
        <details v-for="revision in detail.revisions" :key="revision.id" class="border-b border-slate-200 py-3">
          <summary class="cursor-pointer text-sm font-semibold">Version {{ revision.numero }} · {{ date(revision.created_at) }} · {{ revision.auteur || 'Auteur non renseigné' }} · {{ money(revision.facture_snapshot?.total_ttc) }}</summary>
          <p class="my-3 whitespace-pre-wrap break-words text-sm">{{ revision.motif }}</p>
          <LeasingComparisonValues :payload="revision.payload" />
          <p class="py-2 text-sm text-slate-600">Facture à cette version : {{ status(revision.facture_snapshot?.statut) }} · HT {{ money(revision.facture_snapshot?.total_ht) }} · TVA {{ money(revision.facture_snapshot?.total_tva) }} · TTC {{ money(revision.facture_snapshot?.total_ttc) }}</p>
        </details>
      </section>
    </div>
    <div v-else-if="!selectedId" class="space-y-3">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h3 class="font-semibold">Comparaisons facturées</h3>
        <form class="flex max-w-full flex-wrap gap-2" @submit.prevent="load()">
          <input v-model="search" type="search" class="input w-64 max-w-full" aria-label="Rechercher un relevé facturé" placeholder="Client, série, facture..." maxlength="100" />
          <select v-model="invoiceStatus" class="input w-44" aria-label="Statut de la facture" @change="load()"><option value="">Tous les statuts</option><option v-for="(label, key) in statuses" :key="key" :value="key">{{ label }}</option></select>
          <button class="btn-secondary" type="submit" :disabled="loading" title="Rechercher" aria-label="Rechercher les relevés"><Search class="h-4 w-4" /></button>
        </form>
      </div>
      <div class="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div class="overflow-x-auto"><table class="w-full min-w-[780px] text-sm"><thead class="bg-slate-50 text-left text-slate-500"><tr><th class="p-3">Période / Machine</th><th class="p-3">Client</th><th class="p-3">Facture</th><th class="p-3">Statut</th><th class="p-3 text-right">Total TTC</th><th class="p-3">Suivi</th></tr></thead><tbody class="divide-y divide-slate-100">
          <tr v-for="row in rows" :key="row.id"><td class="p-3">{{ row.date_debut || '-' }} au {{ row.date_fin || '-' }}<strong class="block">{{ row.serial || 'Série non renseignée' }}</strong></td><td class="p-3">{{ row.client?.nom || '-' }}</td><td class="p-3 font-mono">{{ row.facture?.numero }}</td><td class="p-3">{{ row.facture?.deleted_at ? 'Supprimée' : status(row.facture?.statut) }}</td><td class="p-3 text-right tabular-nums">{{ money(row.facture?.total_ttc) }}</td><td class="p-3"><button type="button" class="font-semibold text-blue-700 hover:underline" @click="openDetail(row.id)">Voir le suivi <span class="block text-xs font-normal text-slate-500">Version {{ row.revision }}</span></button></td></tr>
          <tr v-if="!loading && !rows.length"><td colspan="6" class="p-6 text-center text-slate-500">Aucune comparaison facturée.</td></tr>
        </tbody></table></div>
        <fieldset :disabled="loading"><AppPagination v-if="meta.total" :meta="meta" label="relevés facturés" @page="load" /></fieldset>
      </div>
    </div>
    <p v-if="loading || detailLoading" role="status" class="text-sm text-slate-500">Chargement du suivi...</p>
    <div v-if="error" role="alert" class="flex flex-wrap items-center gap-3 border-l-4 border-red-500 bg-red-50 p-3 text-sm text-red-800"><span>{{ error }}</span><button class="btn-secondary" type="button" @click="selectedId ? loadDetail() : load()"><RefreshCw class="mr-2 h-4 w-4" />Réessayer</button><button v-if="selectedId" class="btn-secondary" type="button" @click="closeDetail">Retour à l'historique</button></div>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, FileText, Pencil, RefreshCw, Search } from 'lucide-vue-next'
import api from '@/services/api'
import AppPagination from '@/components/AppPagination.vue'
import LeasingComparisonValues from '@/components/LeasingComparisonValues.vue'
import { pageMeta } from '@/services/leasingLists.mjs'
import { leasingComparisonLocation } from '@/services/leasingNavigation.mjs'

const route = useRoute(), router = useRouter()
const rows = ref([]), meta = ref(pageMeta({})), search = ref(''), invoiceStatus = ref('')
const detail = ref(null), loading = ref(false), detailLoading = ref(false), error = ref('')
const selectedId = computed(() => route.query.suivi ? String(route.query.suivi) : '')
const statuses = { brouillon: 'Brouillon', validee: 'Validée', envoyee: 'Envoyée', partiellement_payee: 'Partiellement payée', payee: 'Payée', annulee: 'Annulée', impayee: 'Impayée' }
const status = value => statuses[value] || value || '-'
const money = value => value == null ? '-' : Number(value).toLocaleString('fr-FR', { maximumFractionDigits: 2 }) + ' FCFA'
const date = value => value ? new Date(value).toLocaleString('fr-FR') : '-'
let listSequence = 0, detailSequence = 0

async function load(page = 1) {
  const sequence = ++listSequence
  loading.value = true; error.value = ''
  try {
    const { data } = await api.get('/leasing/comparaisons', { params: { page: Number.isInteger(page) ? page : 1, per_page: 25, search: search.value, statut: invoiceStatus.value } })
    if (sequence !== listSequence) return
    rows.value = data.data || []; meta.value = pageMeta(data)
  } catch (e) { if (sequence === listSequence) error.value = e.response?.data?.message || 'Historique indisponible. Réessayez.' }
  finally { if (sequence === listSequence) loading.value = false }
}
async function loadDetail() {
  const sequence = ++detailSequence, id = selectedId.value
  detail.value = null; error.value = ''; detailLoading.value = false
  if (!id) return
  if (!/^\d+$/.test(id)) { error.value = 'Référence de suivi invalide.'; return }
  detailLoading.value = true
  try {
    const { data } = await api.get('/leasing/comparaisons/' + id)
    if (sequence === detailSequence) detail.value = data
  } catch (e) { if (sequence === detailSequence) error.value = e.response?.data?.message || 'Ce suivi est inaccessible.' }
  finally { if (sequence === detailSequence) detailLoading.value = false }
}
function openDetail(id) { router.push({ name: 'leasing', query: { tab: 'releves', suivi: id } }) }
function closeDetail() { router.push({ name: 'leasing', query: { tab: 'releves' } }) }
watch(selectedId, () => { listSequence++; loading.value = false; loadDetail() })
onMounted(() => { if (selectedId.value) loadDetail(); else load() })
watch(selectedId, (id, previous) => { if (!id && previous) load() })
onBeforeUnmount(() => { listSequence++; detailSequence++ })
</script>
