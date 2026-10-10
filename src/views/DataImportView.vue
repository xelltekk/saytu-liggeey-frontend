<script setup>
import { onMounted, ref } from 'vue'
import api from '@/services/api'
import DolibarrThirdPartyPreview from '@/components/DolibarrThirdPartyPreview.vue'
import DolibarrProductImport from '@/components/DolibarrProductImport.vue'
import DolibarrStockPreview from '@/components/DolibarrStockPreview.vue'
import DolibarrQuotePreview from '@/components/DolibarrQuotePreview.vue'

const reports = ref([])
const report = ref(null)
const creating = ref(false)
const loading = ref(true)
const busy = ref(false)
const childBusy = ref(false)
const importModule = ref('tiers')
const error = ref('')
const database = ref(null)
const documents = ref(null)
const uploadPercent = ref(0)
const limits = ref({ database: 20 * 1024 * 1024, documents: 100 * 1024 * 1024, total: 120 * 1024 * 1024 })
const megabytes = value => Math.floor(value / (1024 * 1024))
const formatDate = value => value ? new Date(value).toLocaleDateString('fr-FR') : 'Non disponible'
const count = value => Number(value || 0).toLocaleString('fr-FR')

function message(e) {
  if (e.response?.status === 413) return 'Les fichiers dépassent la limite de dépôt du serveur. Réduisez leur taille ou contactez l’administrateur.'
  const details = Object.values(e.response?.data?.errors || {}).flat()
  return details.join(' ') || e.response?.data?.message || 'Connexion interrompue. Réessayez ou consultez l’historique des analyses.'
}
async function load() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await api.get('/data-imports')
    reports.value = data.reports
    if (data.limits) limits.value = data.limits
  }
  catch (e) { error.value = message(e) }
  finally { loading.value = false }
}
function start() {
  database.value = null
  documents.value = null
  report.value = null
  error.value = ''
  creating.value = true
}
function back() {
  report.value = null
  creating.value = false
  error.value = ''
}
async function analyze() {
  error.value = ''
  if (!database.value) { error.value = 'Sélectionnez la sauvegarde de votre base Dolibarr.'; return }
  if (!/\.sql(?:\.gz)?$/i.test(database.value.name)) { error.value = 'La base doit être un fichier .sql ou .sql.gz.'; return }
  if (documents.value && !/\.zip$/i.test(documents.value.name)) { error.value = 'Les documents doivent être dans un fichier ZIP.'; return }
  if (database.value.size > limits.value.database || (documents.value?.size || 0) > limits.value.documents || database.value.size + (documents.value?.size || 0) > limits.value.total) {
    error.value = `Limites du serveur : base ${megabytes(limits.value.database)} Mo, documents ${megabytes(limits.value.documents)} Mo, total ${megabytes(limits.value.total)} Mo.`; return
  }
  busy.value = true
  uploadPercent.value = 0
  const form = new FormData()
  form.append('database', database.value)
  if (documents.value) form.append('documents', documents.value)
  try {
    const { data } = await api.post('/data-imports/analyze', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: event => { uploadPercent.value = event.total ? Math.round(event.loaded / event.total * 100) : 0 },
    })
    report.value = data
    reports.value = [data, ...reports.value].slice(0, 50)
    creating.value = false
    database.value = null
    documents.value = null
  } catch (e) { error.value = message(e) }
  finally { busy.value = false }
}
function download() {
  const blob = new Blob([JSON.stringify(report.value, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `analyse-dolibarr-${report.value.id}.json`
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
onMounted(load)
</script>

<template>
  <main class="import-page space-y-5">
    <header class="rounded-2xl border border-cyan-200 bg-cyan-50 p-5">
      <button v-if="creating || report" type="button" class="mb-4 font-semibold text-cyan-800" :disabled="busy || childBusy" @click="back">← Retour liste</button>
      <p class="text-xs font-bold uppercase tracking-widest text-cyan-800">Administration · Migration Dolibarr</p>
      <h1 class="mt-2 text-2xl font-bold text-slate-900">{{ report ? 'Résultat de l’analyse' : creating ? 'Analyser une sauvegarde' : 'Importation des données' }}</h1>
      <p class="mt-2 text-sm text-slate-700">Préparez la reprise de vos clients, produits, stocks et documents commerciaux dans Saytu.</p>
    </header>

    <p v-if="error" role="alert" class="rounded-xl border border-red-300 bg-red-50 p-4 text-red-900">{{ error }}</p>

    <template v-if="!creating && !report">
      <section class="rounded-2xl border border-cyan-200 bg-white p-5">
        <h2 class="text-lg font-bold text-slate-900">1. Vérifier les sauvegardes</h2>
        <p class="my-3 text-sm text-slate-700">Analysez les fichiers, reprenez les tiers et le catalogue, puis préparez les soldes de stock dans leur bloc dédié. Chaque import exige votre confirmation. Les paiements ne sont pas encore transférés.</p>
        <button type="button" class="rounded-xl bg-cyan-700 px-5 py-3 font-semibold text-white" @click="start">Nouvelle analyse Dolibarr</button>
      </section>
      <section class="rounded-2xl border border-cyan-200 bg-white p-5">
        <h2 class="mb-4 text-lg font-bold text-slate-900">Historique des analyses</h2>
        <p v-if="loading" role="status">Chargement…</p>
        <button v-else-if="error" type="button" class="text-cyan-800 underline" @click="load">Réessayer</button>
        <p v-else-if="!reports.length" class="text-slate-700">Aucune analyse pour cette société.</p>
        <div v-else class="max-h-[480px] overflow-auto">
          <table class="w-full text-left text-sm">
            <thead class="sticky top-0 bg-cyan-50 text-slate-900"><tr><th class="p-3">Sauvegarde</th><th class="p-3">Analyse</th><th class="p-3">Résultat</th><th class="p-3">Action</th></tr></thead>
            <tbody><tr v-for="item in reports" :key="item.id" class="border-t border-cyan-100">
              <td class="max-w-xs break-words p-3">{{ item.database_name }}</td>
              <td class="whitespace-nowrap p-3">{{ formatDate(item.created_at) }}</td>
              <td class="p-3">{{ item.blockers.length ? 'Anomalie à résoudre' : 'Inventaire disponible' }}</td>
              <td class="p-3"><button type="button" class="font-semibold text-cyan-800 underline" @click="report = item">Consulter</button></td>
            </tr></tbody>
          </table>
        </div>
        <p class="mt-3 text-xs text-slate-600">Les 50 dernières analyses de cette société.</p>
      </section>
    </template>

    <form v-else-if="creating" class="space-y-5 rounded-2xl border border-cyan-200 bg-white p-5" @submit.prevent="analyze">
      <fieldset :disabled="busy" class="grid gap-5 md:grid-cols-2">
        <div><label for="import-database" class="block font-bold text-slate-900">Base Dolibarr *</label>
          <p id="database-help" class="my-2 text-sm text-slate-700">Fichier .sql.gz ou .sql · {{ megabytes(limits.database) }} Mo maximum, 32 Mo décompressés.</p>
          <input id="import-database" type="file" accept=".sql,.gz" required aria-describedby="database-help" class="w-full rounded-xl border border-cyan-200 p-3" @change="database = $event.target.files[0] || null">
        </div>
        <div><label for="import-documents" class="block font-bold text-slate-900">Documents Dolibarr (facultatif)</label>
          <p id="documents-help" class="my-2 text-sm text-slate-700">Archive .zip · {{ megabytes(limits.documents) }} Mo maximum.</p>
          <input id="import-documents" type="file" accept=".zip" aria-describedby="documents-help" class="w-full rounded-xl border border-cyan-200 p-3" @change="documents = $event.target.files[0] || null">
        </div>
      </fieldset>
      <p class="rounded-xl bg-cyan-50 p-4 text-sm text-slate-800">Utilisez une base et des documents sauvegardés au même moment. Seul le rapport d’inventaire est conservé ; les archives devront être fournies à nouveau pour le transfert.</p>
      <p v-if="busy" role="status" class="text-cyan-900">{{ uploadPercent < 100 ? `Dépôt des fichiers : ${uploadPercent} %` : 'Analyse en cours…' }}</p>
      <button type="submit" :disabled="busy" class="rounded-xl bg-cyan-700 px-5 py-3 font-semibold text-white disabled:opacity-60">{{ busy ? 'Veuillez patienter…' : 'Analyser les fichiers' }}</button>
    </form>

    <template v-else-if="report">
      <label class="block rounded-xl border border-cyan-200 bg-white p-4 font-semibold">Données à reprendre
        <select v-model="importModule" :disabled="childBusy" class="ml-3 max-w-full rounded-lg border border-cyan-200 p-2"><option value="tiers">Clients / Fournisseurs</option><option value="products">Produits / Services</option><option value="stock">Entrepôts / Stocks</option><option value="quotes">Devis</option></select>
      </label>
      <component :is="importModule === 'quotes' ? DolibarrQuotePreview : importModule === 'stock' ? DolibarrStockPreview : importModule === 'products' ? DolibarrProductImport : DolibarrThirdPartyPreview" :key="`${report.id}-${importModule}`" :report="report" :limits="limits" @busy="childBusy = $event" />
      <section class="rounded-2xl border border-cyan-200 bg-white p-5">
        <div class="flex flex-wrap items-center justify-between gap-3"><h2 class="break-all font-bold text-slate-900">{{ report.database_name }}</h2><button type="button" class="font-semibold text-cyan-800 underline" @click="download">Télécharger le rapport</button></div>
        <div class="mt-4 grid gap-3 sm:grid-cols-3">
          <div class="rounded-xl bg-cyan-50 p-4"><p class="text-sm">Date de la base</p><strong>{{ formatDate(report.dump_date) }}</strong></div>
          <div class="rounded-xl bg-cyan-50 p-4"><p class="text-sm">Tables détectées</p><strong>{{ count(report.table_count) }}</strong></div>
          <div class="rounded-xl bg-cyan-50 p-4"><p class="text-sm">PDF dans le ZIP</p><strong>{{ report.documents ? count(report.documents.pdfs) : 'Non fourni' }}</strong></div>
        </div>
        <div v-if="report.blockers.length" class="mt-4 rounded-xl border border-red-300 bg-red-50 p-4 text-red-900"><h3 class="font-bold">À résoudre avant la migration</h3><p v-for="item in report.blockers" :key="item" class="mt-2">{{ item }}</p></div>
        <div class="mt-4 rounded-xl border border-cyan-200 bg-cyan-50 p-4 text-slate-800"><h3 class="font-bold">Points à vérifier</h3><p v-for="item in report.warnings" :key="item" class="mt-2 text-sm">{{ item }}</p></div>
      </section>
      <section class="rounded-2xl border border-cyan-200 bg-white p-5">
        <h2 class="mb-3 text-lg font-bold text-slate-900">Données détectées</h2>
        <div class="max-h-[520px] overflow-auto"><table class="w-full text-left text-sm">
          <thead class="sticky top-0 bg-cyan-50"><tr><th class="p-3">Rubrique</th><th class="p-3 text-right">Enregistrements</th><th class="p-3">Structure</th></tr></thead>
          <tbody><tr v-for="module in report.modules" :key="module.key" class="border-t border-cyan-100"><td class="p-3">{{ module.label }}</td><td class="p-3 text-right font-bold">{{ count(module.rows) }}</td><td class="p-3">{{ module.present ? 'Présente' : 'Absente de l’export' }}</td></tr></tbody>
        </table></div>
        <p class="mt-4 text-sm text-slate-700">{{ count(report.unmapped_table_count) }} autres tables techniques ou complémentaires restent à examiner. Les fichiers PDF ne correspondent pas nécessairement à des documents uniques.</p>
        <p class="mt-3 font-semibold text-cyan-900">Analyse uniquement : aucune donnée métier importée.</p>
      </section>
    </template>
  </main>
</template>

<style scoped>
.import-page { color: #163b4b; }
.import-page th, .import-page strong, .import-page h1, .import-page h2, .import-page h3 { color: #163b4b; }
.import-page button:focus-visible, .import-page input:focus-visible { outline: 3px solid #0ea5e9; outline-offset: 3px; }
</style>
