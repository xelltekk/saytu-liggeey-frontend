<template>
  <div class="comparison space-y-5">
    <header v-if="!embedded" class="rounded-3xl border border-cyan-200 bg-cyan-50 p-6">
      <RouterLink :to="{ name: 'leasing', query: { tab: 'releves' } }" class="font-bold text-cyan-800">← Retour liste</RouterLink>
      <p class="mt-5 text-xs font-bold uppercase tracking-widest text-cyan-800">Leasing imprimantes · Compteurs Canon</p>
      <h1 class="mt-2 text-3xl font-bold text-slate-900">Comparer deux relevés</h1>
      <p class="mt-2 text-slate-700">Importez les PDF, vérifiez les valeurs reconnues et calculez la consommation A4 de la période.</p>
    </header>

    <div v-if="contractLoading" role="status" class="panel">Chargement du contrat…</div>
    <div v-if="contractError" role="alert" class="panel text-red-800">{{ contractError }} <button class="btn-secondary" @click="loadContract">Réessayer</button></div>
    <div v-if="contract" class="panel">
      <strong>{{ contract.numero }} · {{ contract.client?.nom }}</strong>
      <p>{{ contract.imprimante?.designation }} · Série : {{ contract.imprimante?.numero_serie || 'Non renseignée' }}</p>
      <p class="mt-2 text-sm">Tarifs du contrat préremplis. Cette comparaison n’applique ni le forfait de pages, ni le loyer, ni la TVA ; elle ne constitue pas une facture.</p>
    </div>

    <div class="panel text-sm">
      <strong>PDF Canon avec compteurs 102, 409 et 112 uniquement.</strong>
      <p>Chaque fichier : 10 pages / 30 Mo maximum. Les scans « Lecture » sont exclus. Un recto verso représente deux faces.</p>
      <p>Les PDF restent sur votre appareil. Après le calcul, exportez le résultat ou choisissez un client pour créer une facture brouillon.</p>
    </div>

    <div v-if="sourceLoading" role="status" class="panel">Chargement du relevé archivé...</div>
    <div v-if="sourceError" role="alert" class="panel text-red-800">{{ sourceError }} <RouterLink :to="{ name: 'leasing', query: { tab: 'releves', suivi: route.query.correction } }" class="font-semibold underline">Retour au suivi</RouterLink></div>
    <p v-if="correction" class="border-l-4 border-blue-500 bg-blue-50 p-3 text-sm text-blue-900">Correction de {{ correction.facture.numero }} · Version {{ correction.revision }} · {{ correction.client?.nom }}</p>
    <form @submit.prevent="calculate">
      <fieldset :disabled="invoicing || sourceLoading || !!sourceError || finalized">
      <div class="grid gap-4 lg:grid-cols-2">
        <section v-for="(report, i) in reports" :key="i" class="panel min-w-0">
          <h2 class="text-xl font-bold">{{ i === 0 ? '1. Relevé précédent' : '2. Relevé récent' }}</h2>
          <label class="field">PDF {{ i === 0 ? 'précédent' : 'récent' }}
            <input :key="fileKey" type="file" accept="application/pdf,.pdf" class="input" :disabled="busy || contractLoading" @click="$event.target.value = ''" @change="importPdf($event, i)" />
          </label>
          <p role="status" aria-live="polite" class="mt-2 text-sm text-slate-700">{{ files[i].status }}</p>
          <div v-if="files[i].busy" class="mt-2 rounded-xl border border-cyan-200 bg-cyan-50 p-3">
            <p class="text-sm font-semibold text-slate-800">Lecture en cours · {{ files[i].elapsed }} s</p>
            <p class="mt-1 text-sm text-slate-700">La première lecture d’un PDF scanné nécessite le chargement du modèle OCR. Vous pouvez arrêter et saisir les compteurs.</p>
            <button type="button" class="btn-secondary mt-2" @click="cancelReading(i)">Arrêter et saisir manuellement</button>
          </div>
          <fieldset :disabled="busy">
            <label class="field">Date du relevé {{ i === 0 ? 'précédent' : 'récent' }}<input v-model="report.date" type="date" class="input" required /></label>
            <label class="field">Numéro de série {{ i === 0 ? 'précédent' : 'récent' }}<input v-model="report.serial" class="input" maxlength="100" required /></label>
            <label v-for="counter in counters" :key="counter.code" class="field">{{ counter.code }} · {{ counter.label }} · {{ i === 0 ? 'précédent' : 'récent' }}
              <input v-model="report.counters[counter.code]" type="number" min="0" step="1" class="input" required />
            </label>
          </fieldset>
          <details v-if="files[i].previews.length" class="mt-4">
            <summary class="cursor-pointer font-semibold text-cyan-800">Vérifier le PDF et le texte reconnu</summary>
            <div class="mt-3 max-h-[32rem] overflow-auto rounded-xl border border-slate-200">
              <img v-for="(preview, page) in files[i].previews" :key="page" :src="preview" :alt="`Relevé ${i + 1}, page ${page + 1}`" class="w-full bg-white" />
              <pre class="whitespace-pre-wrap break-words bg-slate-50 p-3 text-xs">{{ files[i].text }}</pre>
            </div>
          </details>
        </section>
      </div>

      <section class="panel mt-5">
        <h2 class="text-xl font-bold">3. Vérifier les formats et tarifs</h2>
        <p class="mt-2 text-sm">Les grands formats comptent double dans les compteurs 102 et 409. Précisez les pages couleur grand format de la période, même si zéro.</p>
        <div class="grid gap-4 md:grid-cols-3">
          <label class="field">Tarif noir HT / face A4 (CFA)<input v-model="options.blackPrice" type="number" min="0" step="0.01" class="input" required /></label>
          <label class="field">Tarif couleur HT / face A4 (CFA)<input v-model="options.colorPrice" type="number" min="0" step="0.01" class="input" required /></label>
          <label class="field">Faces couleur grand format sur la période<input v-model="options.largeColor" type="number" min="0" step="1" class="input" required placeholder="À préciser, même si zéro" /></label>
        </div>
        <label class="mt-5 flex items-start gap-3"><input v-model="options.a4" type="checkbox" class="mt-1" :disabled="busy" />Je confirme que toutes les autres impressions sont A4 et que le nombre de grands formats couleur est vérifié.</label>
        <label class="mt-4 flex items-start gap-3"><input v-model="options.verified" type="checkbox" class="mt-1" :disabled="busy" />J’ai vérifié les dates, numéros de série et compteurs avec les PDF.</label>
        <p class="mt-3 text-sm text-slate-600">Si le relevé utilise d’autres compteurs ou formats, ne confirmez pas ce calcul : utilisez la saisie habituelle du leasing.</p>
        <div class="mt-5 flex flex-wrap gap-3">
          <button class="btn-primary" :disabled="busy || contractLoading || !!contractError">{{ busy ? 'Lecture en cours…' : 'Calculer la consommation' }}</button>
          <button class="btn-secondary" type="button" @click="reset">Effacer la comparaison</button>
        </div>
        <p v-if="error" class="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-red-800" role="alert">{{ error }}</p>
      </section>
      </fieldset>
    </form>

    <section v-if="result" id="leasing-comparison-result" ref="resultElement" class="panel" aria-live="polite">
      <p class="text-sm font-semibold text-cyan-800">Saytu Liggéey · Comparaison A4 · Formats confirmés</p>
      <h2 class="mt-2 text-2xl font-bold">Consommation du {{ dateLabel(result.start) }} au {{ dateLabel(result.end) }}</h2>
      <p class="mt-2">Série : {{ result.serial }} <span v-if="contract">· {{ contract.numero }} · {{ contract.client?.nom }}</span></p>
      <div class="mt-4 overflow-x-auto">
        <table class="w-full text-left">
          <thead><tr><th>Impressions A4</th><th>Faces</th><th>Prix HT / face</th><th>Montant HT</th></tr></thead>
          <tbody>
            <tr><td>Noir et blanc</td><td>{{ fmt(result.black) }}</td><td>{{ fmt(result.blackPrice) }} CFA</td><td>{{ fmt(result.blackAmount) }} CFA</td></tr>
            <tr><td>Couleur</td><td>{{ fmt(result.color) }}</td><td>{{ fmt(result.colorPrice) }} CFA</td><td>{{ fmt(result.colorAmount) }} CFA</td></tr>
          </tbody>
        </table>
      </div>
      <p class="mt-5">Valorisation de la consommation A4 HT</p>
      <p class="text-3xl font-bold text-cyan-900">{{ fmt(result.total) }} CFA</p>
      <p class="mt-3 text-sm">Hors forfait de pages, loyer et taxes. Ce document n’est pas une facture.</p>
      <p class="mt-2 text-sm">Grands formats exclus : {{ result.largeBlack }} face(s) noir et {{ result.largeColor }} face(s) couleur. Les scans sont exclus.</p>
      <p class="mt-3 text-sm">Noir A4 = Δ102 − Δ409 − 2 × Δ112 = {{ result.delta[0] }} − {{ result.delta[1] }} − 2 × {{ result.delta[2] }} = {{ result.black }}.<br />Couleur A4 = Δ409 − 2 × grands formats couleur = {{ result.delta[1] }} − 2 × {{ result.largeColor }} = {{ result.color }}.</p>
      <div class="mt-5 flex flex-wrap gap-3 print-actions">
        <button class="btn-primary" @click="printResult">Imprimer / enregistrer en PDF</button>
        <button class="btn-secondary" @click="exportCsv">Exporter CSV</button>
      </div>
      <LeasingComparisonInvoice :result="result" :reports="reports" :options="options" :client="contract?.client || null" :correction="correction" @busy="invoicing = $event" @archived="markArchived" />
    </section>
  </div>
</template>

<script setup>
import { requestConfirmation as appConfirm } from '@/composables/useConfirm'
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { onBeforeRouteLeave, onBeforeRouteUpdate, useRoute } from 'vue-router'
import api from '@/services/api'
import { emptyReport, compareReports, comparisonCsv } from '@/utils/leasingComparison.mjs'
import { readLeasingPdf } from '@/services/leasingPdfReader.mjs'
import LeasingComparisonInvoice from '@/components/LeasingComparisonInvoice.vue'

defineProps({ embedded: Boolean })
const route = useRoute()
const correction = ref(null), sourceLoading = ref(false), sourceError = ref(''), archivedSnapshot = ref(''), finalized = ref(false)
const invoicing = ref(false)
const reports = reactive([emptyReport(), emptyReport()])
const emptyFile = () => ({ busy: false, elapsed: 0, status: 'Importez un PDF ou saisissez les valeurs manuellement.', previews: [], text: '' })
const files = reactive([emptyFile(), emptyFile()])
const options = reactive({ blackPrice: 20, colorPrice: 60, largeColor: '', a4: false, verified: false })
const counters = [{ code: '102', label: 'Total 2' }, { code: '409', label: 'Couleur / 2' }, { code: '112', label: 'Noir grand format' }]
const busy = computed(() => files.some(f => f.busy))
const result = ref(null), resultElement = ref(null), error = ref(''), fileKey = ref(0)
const contract = ref(null), contractLoading = ref(false), contractError = ref('')
const controllers = [null, null]
let alive = true, contractSequence = 0
const fmt = value => Number(value).toLocaleString('fr-FR', { maximumFractionDigits: 2 })
const dateLabel = value => value.split('-').reverse().join('/')
const fingerprint = () => JSON.stringify({ reports, options })
const hasData = () => busy.value || (reports.some(r => r.date || r.serial || Object.values(r.counters).some(v => v !== '')) && archivedSnapshot.value !== fingerprint())
function markArchived() { archivedSnapshot.value = fingerprint(); finalized.value = true }

watch(() => [reports, options.blackPrice, options.colorPrice, options.largeColor, options.a4], () => {
  options.verified = false; result.value = null; error.value = ''
}, { deep: true, flush: 'sync' })
watch(() => options.verified, () => { result.value = null }, { flush: 'sync' })
watch(() => route.query.contrat, () => loadContract())

async function loadContract() {
  const sequence = ++contractSequence
  contract.value = null; contractError.value = ''; result.value = null; options.verified = false
  contractLoading.value = false
  if (!route.query.contrat) return
  if (!/^\d+$/.test(String(route.query.contrat))) { contractError.value = 'Référence de contrat invalide.'; return }
  contractLoading.value = true
  try {
    const { data } = await api.get(`/leasing/contrats/${route.query.contrat}`)
    if (!alive || sequence !== contractSequence) return
    contract.value = data
    options.blackPrice = data.prix_page_noir_ht ?? 20
    options.colorPrice = data.prix_page_couleur_ht ?? 60
  } catch { if (alive && sequence === contractSequence) contractError.value = 'Contrat inaccessible. Vérifiez vos droits ou revenez à la liste.' }
  finally { if (alive && sequence === contractSequence) contractLoading.value = false }
}
async function loadCorrection() {
  const id = String(route.query.correction || '')
  if (!/^\d+$/.test(id)) { sourceError.value = 'Référence de correction invalide.'; return }
  sourceLoading.value = true; sourceError.value = ''
  try {
    const { data } = await api.get('/leasing/comparaisons/' + id)
    if (!alive) return
    if (!data.modifiable || !Array.isArray(data.payload?.reports) || data.payload.reports.length !== 2) throw Error(data.blocage || 'Ce relevé ne peut pas être corrigé directement.')
    correction.value = data
    reports.splice(0, 2, ...data.payload.reports.map(report => ({ ...report, counters: { ...report.counters } })))
    Object.assign(options, { blackPrice: data.payload.blackPrice, colorPrice: data.payload.colorPrice, largeColor: data.payload.largeColor, a4: false, verified: false })
    archivedSnapshot.value = fingerprint()
  } catch (e) { if (alive) sourceError.value = e.response?.data?.message || e.message || 'Chargement du relevé impossible.' }
  finally { if (alive) sourceLoading.value = false }
}
async function importPdf(event, i) {
  const file = event.target.files?.[0]
  if (!file) return
  controllers[i]?.abort()
  const controller = new AbortController(); controllers[i] = controller
  reports[i] = emptyReport(); files[i] = { ...emptyFile(), busy: true, status: 'Chargement des outils de lecture…' }
  options.a4 = false
  const started = Date.now()
  const clock = setInterval(() => { if (alive && controllers[i] === controller) files[i].elapsed = Math.floor((Date.now() - started) / 1000) }, 1000)
  try {
    const parsed = await readLeasingPdf(file, {
      signal: controller.signal,
      onProgress: status => { if (alive && controllers[i] === controller) files[i].status = status },
      onPreview: preview => { if (alive && controllers[i] === controller) { files[i].previews = preview.previews; files[i].text = preview.text } },
    })
    if (!alive || controllers[i] !== controller) return
    reports[i] = { ...emptyReport(), ...parsed.report, counters: { ...emptyReport().counters, ...parsed.report.counters } }
    files[i].previews = parsed.previews; files[i].text = parsed.text
    files[i].status = Object.keys(parsed.report.counters).length === 3 ? 'Trois compteurs lus. Vérifiez les valeurs avec l’aperçu avant de confirmer.' : 'Lecture incomplète : complétez les valeurs avec votre PDF. Aucun compteur manquant n’est remplacé par zéro.'
  } catch (e) {
    if (alive && controllers[i] === controller) files[i].status = (e?.message || 'Lecture automatique impossible pour ce PDF.') + ' Saisie manuelle disponible.'
  } finally {
    clearInterval(clock)
    if (alive && controllers[i] === controller) { files[i].busy = false; controllers[i] = null }
  }
}
function cancelReading(i) {
  controllers[i]?.abort(); controllers[i] = null
  files[i].busy = false; files[i].status = 'Lecture annulée. Importez un autre PDF ou saisissez les valeurs manuellement.'
}
async function calculate() {
  result.value = null; error.value = ''
  if (busy.value || contractLoading.value || contractError.value || sourceLoading.value || sourceError.value) return
  try {
    result.value = compareReports(reports, { ...options, expectedSerial: contract.value?.imprimante?.numero_serie })
    await nextTick(); resultElement.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  } catch (e) { error.value = e.message }
}
async function reset() {
  if (hasData() && !await appConfirm('Effacer les relevés et le résultat non enregistré ?')) return
  controllers.forEach(c => c?.abort())
  controllers.fill(null)
  reports.splice(0, 2, emptyReport(), emptyReport()); files.splice(0, 2, emptyFile(), emptyFile())
  options.largeColor = ''; options.a4 = false; options.verified = false; result.value = null; error.value = ''; fileKey.value++
}
function exportCsv() {
  if (!result.value) return
  const url = URL.createObjectURL(new Blob([comparisonCsv(result.value)], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a'); link.href = url; link.download = `comparaison-a4-${result.value.end}.csv`; link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
function printResult() {
  if (!result.value) return
  document.body.classList.add('printing-leasing-comparison')
  window.print()
}
function afterPrint() { document.body.classList.remove('printing-leasing-comparison') }
function beforeUnload(event) { if (hasData()) { event.preventDefault(); event.returnValue = '' } }
async function canLeaveComparison() {
  return !invoicing.value && (!hasData() || await appConfirm('Quitter la comparaison ? Les données non exportées seront perdues.'))
}
onBeforeRouteLeave(canLeaveComparison)
onBeforeRouteUpdate((to, from) => {
  if (to.query.tab !== 'releves' || to.query.vue !== 'comparaison' || to.query.contrat !== from.query.contrat || to.query.correction !== from.query.correction) return canLeaveComparison()
  return true
})
onMounted(() => { if (route.query.correction) loadCorrection(); else loadContract(); window.addEventListener('beforeunload', beforeUnload); window.addEventListener('afterprint', afterPrint) })
onBeforeUnmount(() => { alive = false; controllers.forEach(c => c?.abort()); afterPrint(); window.removeEventListener('beforeunload', beforeUnload); window.removeEventListener('afterprint', afterPrint) })
</script>

<style scoped>
.comparison { color: #0f172a; }
.panel { padding: 1.25rem; border: 1px solid #bae6fd; border-radius: 1.25rem; background: #fff; color: #0f172a; }
.field { display: block; margin-top: 1rem; font-size: .875rem; font-weight: 600; color: #334155; }
.field .input { display: block; width: 100%; margin-top: .4rem; background: #fff; color: #0f172a; }
th, td { padding: .8rem; border-bottom: 1px solid #e2e8f0; white-space: nowrap; }
th { background: #ecfeff; color: #164e63; }
button:disabled { opacity: .5; cursor: not-allowed; }
</style>
<style>
@media print {
  body.printing-leasing-comparison *:not(:has(#leasing-comparison-result)):not(#leasing-comparison-result):not(#leasing-comparison-result *) { display: none !important; }
  body.printing-leasing-comparison,
  body.printing-leasing-comparison *:has(#leasing-comparison-result) { display: block !important; position: static !important; height: auto !important; min-height: 0 !important; max-height: none !important; overflow: visible !important; transform: none !important; margin: 0 !important; padding: 0 !important; }
  body.printing-leasing-comparison #leasing-comparison-result { position: static; width: 100%; margin: 0; padding: 1cm; border: 0; background: white !important; color: black !important; }
  body.printing-leasing-comparison #leasing-comparison-result .print-actions { display: none !important; }
}
</style>
