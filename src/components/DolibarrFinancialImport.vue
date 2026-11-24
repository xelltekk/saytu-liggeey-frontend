<template>
  <section class="space-y-4 rounded-xl border bg-white p-5">
    <div><h3 class="text-lg font-bold">{{ supplier ? 'Factures et règlements fournisseurs' : 'Factures, avoirs et règlements clients' }}</h3><p class="mt-1 text-sm text-slate-600">{{ supplier ? 'Retrouvez les documents historiques dans le suivi fournisseurs, avec leur reste à payer.' : 'Retrouvez les documents historiques dans Factures et Paiements, avec leur reste dû.' }} Les références et les dates d’origine sont conservées.</p></div>
    <p v-if="error" role="alert" class="rounded-lg bg-red-50 p-3 text-red-800">{{ error }}</p>
    <p v-if="busy" role="status" class="rounded-lg bg-blue-50 p-3">{{ progress }}</p>
    <button v-if="!plan" type="button" class="btn-primary" :disabled="busy" @click="check">{{ supplier ? 'Contrôler les factures fournisseurs' : 'Contrôler les factures et règlements' }}</button>
    <template v-else>
      <dl class="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div v-for="item in counters" :key="item.label" class="rounded-lg bg-slate-50 p-3"><dt class="text-sm text-slate-600">{{ item.label }}</dt><dd class="text-2xl font-bold">{{ item.value }}</dd></div>
      </dl>
      <p class="text-sm text-slate-600">{{ plan.notice }}</p>
      <p v-if="supplier" class="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Les factures standards et de remplacement peuvent être reprises. Les avoirs, acomptes et crédits fournisseurs nécessitant un rapprochement restent à résoudre. Le contrôle « Bon à payer » demeure à vérifier dans Saytu.</p>
      <p class="text-sm text-slate-600">Les montants historiques sont repris tels qu’ils figurent dans la sauvegarde. Les comptes bancaires, écritures comptables et pièces jointes ont leur propre reprise.</p>
      <div v-if="plan.blockers?.length" role="alert" class="rounded-lg bg-red-50 p-3 text-red-800"><strong>Transfert à résoudre</strong><p v-for="issue in plan.blockers.slice(0, 10)" :key="issue">{{ issue }}</p><p v-if="plan.blockers.length > 10">{{ plan.blockers.length }} anomalies au total.</p></div>
      <p v-if="warningCount" class="rounded-lg bg-amber-50 p-3 text-amber-900">{{ warningCount }} facture(s) sans échéance : la date de facture sera utilisée. Le détail est indiqué sur les lignes concernées.</p>
      <template v-if="ready.length && !done">
        <label class="flex items-start gap-2"><input v-model="confirmed" type="checkbox" class="mt-1" :disabled="busy" /><span>Je confirme le transfert des {{ ready.length }} {{ supplier ? 'factures fournisseurs prêtes et de leurs règlements' : 'factures et avoirs prêts, de leurs règlements et crédits' }}, avec les échéances proposées. Les lignes à résoudre restent en attente.</span></label>
        <button type="button" class="btn-primary" :disabled="busy || !confirmed || !!plan.blockers?.length" @click="run">{{ pending ? 'Reprendre le transfert' : 'Importer les documents prêts' }}</button>
      </template>
      <p v-if="done" role="status" class="rounded-lg bg-green-50 p-3 text-green-900">Transfert terminé : {{ created }} document(s) créé(s), {{ paymentsCreated }} règlement(s) créé(s), {{ alreadyProcessed }} document(s) déjà traité(s). {{ plan.summary.blocked }} document(s) restent à résoudre.</p>
      <div class="flex flex-wrap gap-3">
        <button type="button" class="btn-secondary" :disabled="busy" @click="check">Actualiser le contrôle</button>
        <button type="button" class="btn-secondary" :disabled="busy" @click="downloadReport">Télécharger le bilan du contrôle</button>
      </div>
      <div class="grid gap-3 sm:grid-cols-2"><label>Rechercher<input v-model="search" class="input mt-1" :placeholder="supplier ? 'Référence ou fournisseur' : 'Référence ou client'" /></label><label>Afficher<select aria-label="Filtrer les documents" v-model="filter" class="input mt-1"><option value="">Tous les documents</option><option value="ready">Prêts</option><option value="blocked">À résoudre</option><option value="already_imported">Déjà repris</option></select></label></div>
      <div class="space-y-3 md:hidden">
        <article v-for="row in visibleRows" :key="row.source_id" class="rounded-xl border p-3">
          <div class="flex flex-wrap justify-between gap-2"><strong>{{ row.reference }}</strong><strong :class="row.status === 'blocked' ? 'text-red-700' : 'text-green-700'">{{ labels[row.status] }}</strong></div>
          <p class="mt-1 text-sm">{{ row.client }}</p><p class="text-xs text-slate-500">{{ row.type }} · {{ row.date }}</p>
          <dl class="mt-3 grid grid-cols-2 gap-3 text-sm"><div><dt class="text-slate-500">Total TTC</dt><dd>{{ amount(row.total) }}</dd></div><div><dt class="text-slate-500">{{ supplier ? 'Réglé' : 'Encaissé' }}</dt><dd>{{ amount(row.paid) }}</dd></div><div><dt class="text-slate-500">Crédits imputés</dt><dd>{{ amount(row.credits) }}</dd></div><div><dt class="text-slate-500">Reste dû</dt><dd class="font-bold">{{ amount(row.remaining) }}</dd></div></dl>
          <p v-for="issue in row.issues" :key="issue" class="mt-2 text-sm text-red-700">{{ issue }}</p><p v-for="warning in row.warnings" :key="warning" class="mt-2 text-sm text-amber-800">{{ warning }}</p>
          <p v-if="row.issues_count > row.issues.length" class="mt-2 text-sm">{{ row.issues_count }} anomalies au total.</p>
        </article>
      </div>
      <div class="hidden overflow-x-auto rounded-lg border md:block">
        <table class="w-full text-left text-sm"><thead class="bg-slate-50"><tr><th class="p-3">Document</th><th class="p-3">TTC</th><th class="p-3">{{ supplier ? 'Réglé' : 'Encaissé' }}</th><th class="p-3">Crédits imputés</th><th class="p-3">Reste dû</th><th class="p-3">Contrôle</th></tr></thead>
          <tbody><tr v-for="row in visibleRows" :key="row.source_id" class="border-t align-top"><td class="p-3"><strong>{{ row.reference }}</strong><p>{{ row.client }}</p><p class="text-xs text-slate-500">{{ row.type }} · {{ row.date }}</p></td><td class="whitespace-nowrap p-3">{{ amount(row.total) }}</td><td class="whitespace-nowrap p-3">{{ amount(row.paid) }}</td><td class="whitespace-nowrap p-3">{{ amount(row.credits) }}</td><td class="whitespace-nowrap p-3 font-bold">{{ amount(row.remaining) }}</td><td class="min-w-52 p-3"><strong :class="row.status === 'blocked' ? 'text-red-700' : 'text-green-700'">{{ labels[row.status] }}</strong><p v-for="issue in row.issues" :key="issue" class="mt-1 text-red-700">{{ issue }}</p><p v-for="warning in row.warnings" :key="warning" class="mt-1 text-amber-800">{{ warning }}</p><p v-if="row.issues_count > row.issues.length">{{ row.issues_count }} anomalies au total.</p></td></tr></tbody>
        </table>
      </div>
      <div class="flex items-center justify-between gap-2"><button type="button" class="btn-secondary" :disabled="page <= 1" @click="page--">Précédent</button><span class="text-sm">{{ page }} / {{ pages }} · {{ filtered.length }} documents</span><button type="button" class="btn-secondary" :disabled="page >= pages" @click="page++">Suivant</button></div>
    </template>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import api from '@/services/api'
const props = defineProps({ report: { type: Object, required: true }, sqlFile: { type: Object, required: true }, sourceSettings: { type: Object, required: true }, supplier: { type: Boolean, default: false } })
const emit = defineEmits(['busy', 'imported'])
const plan = ref(null), busy = ref(false), confirmed = ref(false), done = ref(false), error = ref(''), progress = ref('')
const created = ref(0), paymentsCreated = ref(0), alreadyProcessed = ref(0), search = ref(''), filter = ref(''), page = ref(1)
const pending = ref(null)
let batches = [], cursor = 0, cancelled = false, lastWrite = 0
const labels = { ready: 'Prêt', blocked: 'À résoudre', already_imported: 'Déjà repris' }
const ready = computed(() => (plan.value?.rows || []).filter(row => row.status === 'ready'))
const warningCount = computed(() => ready.value.filter(row => row.warnings.length).length)
const counters = computed(() => [
  { label: 'Prêts au transfert', value: ready.value.length }, { label: 'À résoudre', value: plan.value?.summary.blocked || 0 },
  { label: 'Déjà repris', value: plan.value?.rows.filter(row => row.status === 'already_imported').length || 0 }, { label: 'Créés cette session', value: created.value },
])
const filtered = computed(() => (plan.value?.rows || []).filter(row => (!filter.value || row.status === filter.value) && `${row.reference} ${row.client}`.toLocaleLowerCase('fr').includes(search.value.toLocaleLowerCase('fr'))))
const pages = computed(() => Math.max(1, Math.ceil(filtered.value.length / 20)))
const visibleRows = computed(() => filtered.value.slice((page.value - 1) * 20, page.value * 20))
watch([search, filter, plan], () => { page.value = 1 })
onBeforeUnmount(() => { cancelled = true })
const pause = ms => new Promise(resolve => setTimeout(resolve, ms))
const amount = value => value == null ? '—' : `${Number(value).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} ${props.sourceSettings.currency}`
const endpoint = action => `/data-imports/${props.report.id}/${props.supplier ? 'supplier-invoices' : 'invoices'}/${action}`
const explain = exception => Object.values(exception.response?.data?.errors || {}).flat().join(' ') || exception.response?.data?.message || 'Transfert interrompu. Cliquez sur Reprendre le transfert pour continuer sans doublon.'
function setBusy(value) { busy.value = value; emit('busy', value) }
async function check() {
  setBusy(true); error.value = ''; progress.value = 'Contrôle des documents, règlements et soldes. Une sauvegarde volumineuse peut prendre plusieurs minutes…'
  try {
    const form = new FormData(); form.append('database', props.sqlFile); form.append('source_key', props.sourceSettings.sourceKey); form.append('currency', props.sourceSettings.currency)
    const { data } = await api.post(endpoint('plan'), form, { headers: { 'Content-Type': 'multipart/form-data' } })
    if (cancelled) return
    plan.value = data; pending.value = null; batches = []; cursor = 0; confirmed.value = false; done.value = false
  } catch (exception) { error.value = explain(exception) } finally { setBusy(false) }
}
function prepareBatches() {
  const map = new Map(ready.value.map(row => [row.source_id, row])), ordered = [], visited = new Set(), visiting = new Set()
  function visit(row) {
    if (visited.has(row.source_id)) return
    if (visiting.has(row.source_id)) throw new Error('Lien circulaire entre factures : relancez le contrôle.')
    visiting.add(row.source_id)
    if (map.has(row.origin_source_id)) visit(map.get(row.origin_source_id))
    visiting.delete(row.source_id); visited.add(row.source_id); ordered.push(row)
  }
  ready.value.forEach(visit)
  let batch = [], lines = 0
  for (const row of ordered) {
    if (row.lines_count > 2000) throw new Error(`Le document ${row.reference} dépasse 2 000 lignes. Contactez l’administrateur pour sa reprise.`)
    if (batch.length >= 50 || lines + row.lines_count > 2000) { batches.push(batch); batch = []; lines = 0 }
    batch.push(row.source_id); lines += row.lines_count
  }
  if (batch.length) batches.push(batch)
}
async function run() {
  setBusy(true); error.value = ''
  try {
    if (!batches.length) prepareBatches()
    while (cursor < batches.length && !cancelled) {
      pending.value ||= { ids: batches[cursor], request_id: crypto.randomUUID() }
      progress.value = `Transfert du lot ${cursor + 1} / ${batches.length} · ${created.value} document(s) créé(s)…`
      if (lastWrite) await pause(Math.max(0, 2200 - (Date.now() - lastWrite)))
      if (cancelled) break
      let data
      try {
        lastWrite = Date.now()
        data = (await api.post(endpoint('execute'), { ...pending.value, session_token: plan.value.session_token, confirmed: true })).data
      } catch (exception) {
        if (exception.response?.status === 429) { progress.value = 'Courte pause avant le prochain lot…'; await pause(Math.min(60000, Math.max(2500, Number(exception.response.headers?.['retry-after'] || 5) * 1000))); continue }
        throw exception
      }
      created.value += Number(data.created || 0); paymentsCreated.value += Number(data.payments_created || 0); alreadyProcessed.value += Number(data.already_processed || 0)
      const imported = new Set(pending.value.ids)
      plan.value.rows.forEach(row => { if (imported.has(row.source_id)) { row.status = 'already_imported'; plan.value.summary.ready--; plan.value.summary.already_imported++ } })
      cursor++; pending.value = null; emit('imported')
    }
    if (!cancelled) done.value = true
  } catch (exception) { error.value = exception.response ? explain(exception) : exception.message || explain(exception) } finally { setBusy(false) }
}
function downloadReport() {
  const { session_token, ...publicReport } = plan.value
  const url = URL.createObjectURL(new Blob([JSON.stringify({ report_id: props.report.id, module: props.supplier ? 'supplier-invoices' : 'invoices', generated_at: new Date().toISOString(), ...publicReport }, null, 2)], { type: 'application/json' }))
  const link = document.createElement('a'); link.href = url; link.download = `controle-factures-${props.supplier ? 'fournisseurs-' : ''}${props.report.id}.json`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000)
}
</script>
