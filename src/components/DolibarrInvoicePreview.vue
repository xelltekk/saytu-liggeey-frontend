<script setup>
import { computed, ref, watch } from 'vue'
import api from '@/services/api'
const props = defineProps({ report: { type: Object, required: true }, limits: { type: Object, required: true } })
const emit = defineEmits(['busy'])
const file = ref(null)
const sourceKey = ref('dolibarr-principal')
const currency = ref('')
const result = ref(null)
const busy = ref(false)
const error = ref('')
const search = ref('')
const filter = ref('')
const page = ref(1)
const creditPage = ref(1)
const creditFilter = ref('')
const creditRows = computed(() => (result.value?.credits?.rows || []).filter(row => !creditFilter.value || row.status === creditFilter.value))
const creditPages = computed(() => Math.max(1, Math.ceil(creditRows.value.length / 20)))
const visibleCredits = computed(() => creditRows.value.slice((creditPage.value - 1) * 20, creditPage.value * 20))
watch([result, creditFilter], () => { creditPage.value = 1 })
const labels = { ready: 'Sans conflit détecté', review: 'À vérifier / règlements à rapprocher', blocked: 'À résoudre' }
watch(busy, value => emit('busy', value))
watch([file, sourceKey, currency], () => { result.value = null; error.value = '' })
watch([search, filter], () => { page.value = 1 })
const filtered = computed(() => (result.value?.rows || []).filter(row => (!filter.value || row.status === filter.value) && `${row.reference} ${row.client}`.toLowerCase().includes(search.value.toLowerCase().trim())))
const pages = computed(() => Math.max(1, Math.ceil(filtered.value.length / 20)))
const visible = computed(() => filtered.value.slice((page.value - 1) * 20, page.value * 20))
async function preview() {
  if (busy.value) return
  error.value = ''; result.value = null
  if (!file.value || !/\.sql(?:\.gz)?$/i.test(file.value.name)) { error.value = 'Sélectionnez le SQL déjà analysé.'; return }
  if (file.value.size > Math.min(props.limits.database, props.limits.total)) { error.value = 'Le fichier dépasse la limite serveur.'; return }
  const data = new FormData()
  data.append('database', file.value)
  data.append('source_key', sourceKey.value)
  data.append('currency', currency.value)
  busy.value = true
  try {
    result.value = (await api.post(`/data-imports/${props.report.id}/invoices/preview`, data, { headers: { 'Content-Type': 'multipart/form-data' } })).data
    page.value = 1
  } catch (e) { error.value = Object.values(e.response?.data?.errors || {}).flat().join(' ') || e.response?.data?.message || 'Impossible de charger l’aperçu des factures.' }
  finally { busy.value = false }
}
</script>

<template>
  <section class="space-y-4 rounded-2xl border border-cyan-200 bg-white p-5 text-slate-900">
    <h2 class="text-lg font-bold">Factures — Contrôles avant migration</h2>
    <p class="rounded-xl bg-cyan-50 p-4 text-sm">Lecture seule : aucun import à cette étape. Contrôlez les clients, produits, références, dates et montants avant la reprise. Aucun stock ni solde de trésorerie n’est modifié.</p>
    <form @submit.prevent="preview"><fieldset :disabled="busy" class="grid gap-3 md:grid-cols-2">
      <label class="block text-sm font-semibold md:col-span-2">Base SQL déjà analysée<input type="file" accept=".sql,.gz" required class="mt-1 w-full rounded-xl border border-cyan-200 p-3" @change="file = $event.target.files[0] || null"></label>
      <label class="block text-sm font-semibold">Même nom de source que pour les tiers et produits<input v-model="sourceKey" required pattern="[a-z0-9][a-z0-9_-]{2,63}" maxlength="64" class="mt-1 w-full rounded-xl border border-cyan-200 p-3"></label>
      <label class="block text-sm font-semibold">Devise des totaux Dolibarr (ex. XOF)<input v-model="currency" required pattern="[A-Z]{3}" maxlength="3" placeholder="XOF" class="mt-1 w-full rounded-xl border border-cyan-200 p-3"></label>
      <button type="submit" class="rounded-xl bg-cyan-700 px-5 py-3 font-semibold text-white md:col-span-2">{{ busy ? 'Contrôles en cours…' : 'Prévisualiser les factures' }}</button>
    </fieldset></form>
    <p v-if="error" role="alert" class="rounded-xl bg-red-50 p-4 text-red-900">{{ error }}</p>
    <template v-if="result">
      <p v-for="warning in result.warnings" :key="warning" class="text-sm text-slate-700">{{ warning }}</p>
      <p v-for="blocker in result.blockers" :key="blocker" class="rounded-xl bg-red-50 p-3 text-red-900">{{ blocker }}</p>
      <section v-if="result.payments" class="space-y-2 rounded-xl border border-cyan-200 bg-cyan-50 p-4">
        <h3 class="font-bold">Rapprochement des règlements</h3>
        <p class="text-sm">{{ result.payments.notice }}</p>
        <template v-if="result.payments.available">
          <p class="text-sm">{{ result.payments.summary.payments }} paiement(s) · {{ result.payments.summary.allocations }} affectation(s) · {{ result.payments.summary.cash_checked }} facture(s) sans écart de paiement détecté · {{ result.payments.summary.review }} à vérifier</p>
          <div v-if="result.payments.issues.length" class="max-h-48 overflow-auto rounded-lg bg-red-50 p-3 text-sm text-red-900" role="alert">
            <p class="font-semibold">Les anomalies ci-dessous empêchent de fiabiliser les totaux de règlements du lot.</p>
            <p v-for="issue in result.payments.issues" :key="issue">{{ issue }}</p>
          </div>
        </template>
      </section>
      <div class="grid gap-3 sm:grid-cols-3" aria-live="polite">
        <section v-if="result.credits" class="space-y-3 rounded-xl border border-cyan-200 bg-cyan-50 p-4 sm:col-span-3">
          <h3 class="font-bold">Avoirs, acomptes et remises</h3>
          <p class="text-sm">{{ result.credits.notice }}</p>
          <template v-if="result.credits.available">
            <p class="text-sm">{{ result.credits.summary.available }} disponible(s) · {{ result.credits.summary.payment }} utilisé(s) en règlement · {{ result.credits.summary.line }} intégré(s) dans les lignes · {{ result.credits.summary.review }} à vérifier · {{ result.credits.summary.suppliers_excluded }} crédit(s) fournisseur exclu(s)</p>
            <p class="text-sm">« Liens cohérents » ne confirme pas l’encaissement de l’acompte ni le solde définitif.</p>
            <div v-if="result.credits.issues.length" class="max-h-40 overflow-auto text-sm text-red-900"><p v-for="issue in result.credits.issues" :key="issue">{{ issue }}</p></div>
            <select v-model="creditFilter" aria-label="Filtrer les crédits" class="rounded-lg border border-cyan-200 p-2"><option value="">Tous les crédits clients</option><option value="review">À vérifier</option><option value="checked">Liens cohérents</option></select>
            <div class="max-h-80 overflow-auto rounded-lg border border-cyan-200 bg-white">
              <table class="w-full text-left text-sm">
                <thead class="sticky top-0 bg-cyan-100"><tr><th class="p-2">Crédit source</th><th class="p-2">Utilisation</th><th class="p-2">Montant</th><th class="p-2">Contrôles</th></tr></thead>
                <tbody><tr v-for="credit in visibleCredits" :key="credit.source_id" class="border-t border-cyan-100 align-top">
                  <td class="p-2">#{{ credit.source_id }} · {{ credit.kind }}<p>Tiers source #{{ credit.source_client }}</p><p>Facture d’origine : {{ credit.source_invoice ? '#' + credit.source_invoice : 'Sans facture source' }}</p></td>
                  <td class="p-2">{{ { available: 'Disponible, non affecté', payment: 'Utilisé en règlement', line: 'Déjà inclus dans les lignes' }[credit.usage] }}<p v-if="credit.target_invoice">Facture cible #{{ credit.target_invoice }}</p></td>
                  <td class="whitespace-nowrap p-2">{{ credit.amount ?? 'Invalide' }} {{ currency }}</td>
                  <td class="p-2">{{ credit.status === 'checked' ? 'Liens cohérents' : 'À vérifier' }}<p v-for="issue in credit.issues" :key="issue" class="text-red-900">{{ issue }}</p></td>
                </tr><tr v-if="!visibleCredits.length"><td colspan="4" class="p-3">Aucun crédit client pour ce filtre.</td></tr></tbody>
              </table>
            </div>
            <div class="flex items-center justify-between gap-2 text-sm"><button :disabled="creditPage <= 1" class="rounded border border-cyan-200 p-2 disabled:opacity-40" @click="creditPage--">← Précédent</button><span>{{ creditPage }} / {{ creditPages }}</span><button :disabled="creditPage >= creditPages" class="rounded border border-cyan-200 p-2 disabled:opacity-40" @click="creditPage++">Suivant →</button></div>
          </template>
        </section>
        <p class="rounded-xl bg-cyan-50 p-3">Factures : <strong>{{ result.summary.total }}</strong></p>
        <p class="rounded-xl bg-cyan-50 p-3">À vérifier : <strong>{{ result.summary.review }}</strong></p>
        <p class="rounded-xl bg-cyan-50 p-3">À résoudre : <strong>{{ result.summary.blocked }}</strong></p>
      </div>
      <div class="flex flex-wrap gap-3">
        <input v-model="search" aria-label="Rechercher une facture ou un client" placeholder="Référence ou client" class="max-w-full rounded-lg border border-cyan-200 p-2">
        <select v-model="filter" aria-label="Filtrer les contrôles" class="max-w-full rounded-lg border border-cyan-200 p-2"><option value="">Tous les contrôles</option><option v-for="(label, key) in labels" :key="key" :value="key">{{ label }}</option></select>
      </div>
      <div class="max-h-[65vh] overflow-auto rounded-xl border border-cyan-200">
        <table class="w-full text-left text-sm">
          <thead class="sticky top-0 bg-cyan-100 text-slate-900"><tr><th class="p-3">Facture / Client</th><th class="p-3">Dates</th><th class="p-3">Type / Statut source</th><th class="p-3">TTC source</th><th class="p-3">Contrôles</th></tr></thead>
          <tbody>
            <tr v-for="row in visible" :key="row.source_id" class="border-t border-cyan-100 align-top">
              <td class="p-3"><strong>{{ row.reference }}</strong><p>{{ row.client }}</p></td>
              <td class="whitespace-nowrap p-3">{{ row.date || 'Date invalide' }}<p>Échéance : {{ row.due_date || 'À renseigner' }}</p></td>
              <td class="p-3">{{ row.source_type }}<p>{{ row.source_status }}</p><p class="mt-1 text-xs">Indicateur payé : {{ row.source_paid_flag === '1' ? 'Oui' : row.source_paid_flag === '0' ? 'Non' : 'Inconnu' }} — non rapproché</p></td>
              <td class="whitespace-nowrap p-3">{{ row.source_totals.total_ttc ?? 'Absent' }} {{ row.currency }}<p class="text-xs">Solde non calculé</p></td>
              <td class="min-w-64 p-3">
                <strong>{{ labels[row.status] }}</strong>
                <p v-for="issue in row.issues" :key="issue" class="mt-1 text-red-900">{{ issue }}</p>
                <p v-for="warning in row.warnings" :key="warning" class="mt-1 text-slate-700">{{ warning }}</p>
                <details v-if="row.payments" class="mt-2"><summary class="cursor-pointer font-semibold text-cyan-800">Règlements ({{ row.payments.allocations.length }}) — {{ row.payments.status === 'cash_checked' ? 'Paiements contrôlés' : 'À vérifier' }}</summary>
                  <div class="max-h-64 space-y-2 overflow-auto rounded-lg bg-cyan-50 p-2">
                    <p>Paiements affectés : {{ row.payments.cash_allocated ?? 'Non fiabilisés' }} {{ row.currency }}</p>
                    <p>Différence TTC − paiements : {{ row.payments.cash_difference ?? 'Non calculée' }}</p>
                    <p class="font-semibold">Ce n’est pas le solde client définitif. Avoirs, acomptes et remises à vérifier.</p>
                    <p v-for="issue in row.payments.issues" :key="issue" class="text-red-900">{{ issue }}</p>
                    <p v-for="allocation in row.payments.allocations" :key="allocation.source_id">Paiement #{{ allocation.payment_id }} · {{ allocation.date || 'Date invalide' }} · Mode source #{{ allocation.mode_source || '?' }} · {{ allocation.amount }} {{ row.currency }} (donnée source)</p>
                    <p v-if="!row.payments.allocations.length">Aucune affectation trouvée.</p>
                  </div>
                </details>
                <details class="mt-2"><summary class="cursor-pointer font-semibold text-cyan-800">Lignes et montants ({{ row.lines.length }})</summary>
                  <div class="max-h-72 space-y-2 overflow-auto py-2">
                    <div v-for="line in row.lines" :key="line.source_id" class="rounded-lg bg-cyan-50 p-2">
                      <p class="break-words font-semibold">{{ line.designation }}</p><p>{{ line.product }} · {{ line.type }}</p>
                      <p>Qté {{ line.quantity ?? 'Invalide' }} × HT {{ line.price ?? 'Invalide' }} · Remise {{ line.discount ?? '?' }} % · TVA {{ line.vat ?? '?' }} %</p>
                      <p>TTC contrôlé : {{ line.totals.total_ttc ?? 'Non compatible' }}</p>
                      <p v-for="issue in line.issues" :key="issue" class="text-red-900">{{ issue }}</p>
                    </div>
                  </div>
                </details>
              </td>
            </tr>
            <tr v-if="!visible.length"><td colspan="5" class="p-4">Aucune facture pour ces filtres.</td></tr>
          </tbody>
        </table>
      </div>
      <div class="flex flex-wrap items-center justify-between gap-3 text-sm">
        <button :disabled="page <= 1" class="rounded-lg border border-cyan-200 p-2 disabled:opacity-40" @click="page--">← Précédent</button>
        <span>{{ filtered.length }} facture(s) · Page {{ page }} / {{ pages }}</span>
        <button :disabled="page >= pages" class="rounded-lg border border-cyan-200 p-2 disabled:opacity-40" @click="page++">Suivant →</button>
      </div>
      <p class="rounded-xl bg-cyan-50 p-3 text-sm font-semibold">Étape suivante : vérifier les avoirs et acomptes, puis préparer l’import confirmé. Aucun bouton d’import n’est activé dans cet aperçu.</p>
    </template>
  </section>
</template>
