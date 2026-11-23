<template>
  <div class="space-y-4">
    <section class="rounded-2xl border bg-white p-5">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div><h2 class="text-xl font-bold">Migrer de Dolibarr vers Saytu</h2><p class="mt-1 text-sm text-slate-600">{{ report.database_name }}</p></div>
      </div>
      <nav class="mt-5 flex flex-wrap gap-2" aria-label="Étapes de migration">
        <button v-for="item in steps" :key="item.key" type="button" :class="step === item.key ? 'btn-primary' : 'btn-secondary'" :disabled="busy || (item.key === 'donnees' && !configured)" @click="step = item.key">{{ item.label }}</button>
      </nav>
    </section>

    <form v-if="step === 'configuration'" class="rounded-2xl border bg-white p-5" @submit.prevent="configure">
      <h3 class="text-lg font-bold">Votre sauvegarde et vos paramètres</h3>
      <p class="my-3 text-sm text-slate-600">Choisissez votre fichier une fois pour cette session. Ces paramètres seront partagés entre les étapes.</p>
      <p v-if="sqlFile" class="mb-3 rounded-lg bg-blue-50 p-3 text-sm">{{ sqlFile.name }} sélectionné · {{ Math.ceil(sqlFile.size / 1048576) }} Mo</p>
      <label v-else class="block">Sauvegarde SQL analysée<input type="file" accept=".sql,.gz" required class="input my-2" @change="selectedFile = $event.target.files[0] || null" /></label>
      <div class="grid gap-4 sm:grid-cols-2">
        <label>Pays des tiers<input v-model="settings.country" required maxlength="80" placeholder="Ex. Sénégal" class="input mt-1" /></label>
        <label>Devise de la sauvegarde<input v-model="settings.currency" required pattern="[A-Z]{3}" maxlength="3" placeholder="Ex. XOF" class="input mt-1" /></label>
      </div>
      <details class="my-4"><summary class="cursor-pointer font-semibold">Paramètres avancés</summary>
        <label class="mt-3 block">Identifiant de l’installation Dolibarr<input v-model="settings.sourceKey" required pattern="[a-z0-9][a-z0-9_-]{2,63}" maxlength="64" class="input mt-1" /></label>
        <p class="mt-1 text-sm text-slate-600">Conservez cet identifiant pour les futurs imports de la même installation. Chaque société possède son propre suivi.</p>
        <div class="mt-3 grid gap-3 sm:grid-cols-2"><label>Unité des produits<input v-model="settings.productUnit" required maxlength="20" class="input mt-1" /></label><label>Unité des services<input v-model="settings.serviceUnit" required maxlength="20" class="input mt-1" /></label></div>
      </details>
      <p v-if="error" role="alert" class="my-3 text-red-700">{{ error }}</p>
      <button type="submit" class="btn-primary">Continuer vers les données</button>
    </form>

    <template v-else-if="configured && step === 'donnees'">
      <section class="rounded-2xl border bg-white p-5">
        <h3 class="text-lg font-bold">Reprendre les données</h3>
        <p class="my-3 text-sm text-slate-600">Commencez par les clients et fournisseurs, puis le catalogue. Les transferts de nouvelles fiches sont découpés automatiquement en lots.</p>
        <div class="flex flex-wrap gap-2"><button v-for="item in modules" :key="item.key" type="button" :disabled="busy" :class="module === item.key ? 'btn-primary' : 'btn-secondary'" @click="module = item.key">{{ item.label }} ({{ sourceCount(item.source) }})</button></div>
      </section>
      <DolibarrSimpleBatch v-if="module === 'tiers' || module === 'products'" :key="'simple-' + module" :module="module" :title="module === 'tiers' ? 'Clients et fournisseurs' : 'Produits et services'" :sql-file="selectedFile" :report="report" :settings="settings" @busy="setBusy" @imported="loadRuns" />
      <details v-if="module === 'tiers' || module === 'products'" class="rounded-xl border bg-white p-5" :open="reviewOpen" @toggle="reviewOpen = $event.target.open">
        <summary class="cursor-pointer font-semibold">Vérifier les doublons ou ajuster les correspondances</summary>
        <component :is="module === 'tiers' ? DolibarrThirdPartyPreview : DolibarrProductImport" v-if="reviewOpen" :key="module" :report="report" :limits="limits" :sql-file="selectedFile" :source-settings="settings" @busy="setBusy" />
      </details>
      <component :is="module === 'stock' ? DolibarrStockPreview : module === 'quotes' ? DolibarrQuotePreview : DolibarrInvoicePreview" v-else :key="module" :report="report" :limits="limits" :sql-file="selectedFile" :source-settings="settings" @busy="setBusy" />
    </template>

    <section v-else-if="step === 'bilan'" class="space-y-4 rounded-2xl border bg-white p-5">
      <h3 class="text-lg font-bold">Bilan de reprise</h3>
      <p class="text-sm text-slate-600">Les compteurs ci-dessous couvrent les 20 derniers lots affichés par rubrique pour cette analyse.</p>
      <p v-if="historyError" role="alert" class="text-red-700">{{ historyError }}</p>
      <div v-for="item in modules" :key="item.key" class="flex flex-wrap justify-between gap-3 rounded-lg bg-slate-50 p-3">
        <strong>{{ item.label }}</strong>
        <span>{{ sourceCount(item.source) }} dans la sauvegarde · {{ item.key === 'invoices' ? 'Transfert à développer' : importedCount(item.key) + ' traités dans les lots enregistrés' }}</span>
      </div>
      <p class="rounded-lg bg-amber-50 p-3 text-amber-900">La reprise complète reste à terminer. Les factures et paiements sont disponibles pour contrôle. Leur transfert, les achats fournisseurs, l’historique des mouvements et les pièces jointes nécessitent encore un outil de reprise.</p>
      <details v-if="remainingGroups.length"><summary class="cursor-pointer font-semibold">Autres données de votre sauvegarde à reprendre</summary><p v-for="group in remainingGroups" :key="group.key" class="mt-2 text-sm">{{ group.label }} · {{ Number(group.rows).toLocaleString('fr-FR') }} lignes source</p></details>
      <p v-if="!report.documents" class="text-sm text-amber-900">Ajoutez aussi le ZIP de documents Dolibarr pour préparer la reprise des PDF et pièces jointes.</p>
      <button type="button" class="btn-secondary" @click="loadRuns">Actualiser les transferts</button>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import api from '@/services/api'
import DolibarrSimpleBatch from '@/components/DolibarrSimpleBatch.vue'
import DolibarrThirdPartyPreview from '@/components/DolibarrThirdPartyPreview.vue'
import DolibarrProductImport from '@/components/DolibarrProductImport.vue'
import DolibarrStockPreview from '@/components/DolibarrStockPreview.vue'
import DolibarrQuotePreview from '@/components/DolibarrQuotePreview.vue'
import DolibarrInvoicePreview from '@/components/DolibarrInvoicePreview.vue'

const props = defineProps({ report: { type: Object, required: true }, limits: { type: Object, required: true }, sqlFile: { type: Object, default: null } })
const emit = defineEmits(['busy'])
const step = ref('configuration')
const configured = ref(false)
const selectedFile = ref(props.sqlFile)
const settings = reactive({ country: '', currency: '', sourceKey: 'dolibarr-principal', productUnit: 'pièce', serviceUnit: 'service' })
const module = ref('tiers')
const busy = ref(false)
const error = ref('')
const reviewOpen = ref(false)
const runs = ref({})
const historyError = ref('')
const steps = [{ key: 'configuration', label: 'Préparer' }, { key: 'donnees', label: 'Transférer' }, { key: 'bilan', label: 'Vérifier le bilan' }]
const modules = [
  { key: 'tiers', source: 'societe', label: 'Clients / Fournisseurs' },
  { key: 'products', source: 'product', label: 'Catalogue' },
  { key: 'stock', source: 'product_stock', label: 'Stocks' },
  { key: 'quotes', source: 'propal', label: 'Devis' },
  { key: 'invoices', source: 'facture', label: 'Factures et paiements · contrôle' },
]
const remainingGroups = computed(() => (props.report.coverage?.groups || []).filter(group => Number(group.rows) > 0 && group.adapter !== 'available'))

function sourceCount(source) {
  return Number(props.report.modules?.find(item => item.key === source)?.rows || 0)
}

function configure() {
  error.value = ''
  if (!selectedFile.value || selectedFile.value.size > Math.min(props.limits.database, props.limits.total)) {
    error.value = 'Choisissez le fichier SQL analysé, dans les limites indiquées.'
    return
  }
  if (!/^[a-z0-9][a-z0-9_-]{2,63}$/.test(settings.sourceKey) || !settings.country.trim() || !/^[A-Z]{3}$/.test(settings.currency)) {
    error.value = 'Vérifiez le pays, la devise et l’identifiant de la source.'
    return
  }
  configured.value = true
  step.value = 'donnees'
}

function setBusy(value) {
  busy.value = value
  emit('busy', value)
  if (!value) loadRuns()
}

function importedCount(key) {
  const ids = new Set()
  for (const run of runs.value[key] || []) {
    for (const item of run.result?.items || []) ids.add(String(item.source_id ?? item.line))
  }
  return ids.size
}

async function loadRuns() {
  historyError.value = ''
  const results = await Promise.allSettled(['tiers', 'products', 'stock', 'quotes'].map(async key => {
    const suffix = key === 'tiers' ? '' : '/' + key
    const { data } = await api.get(`/data-imports/${props.report.id}${suffix}/runs`)
    runs.value[key] = data.runs || []
  }))
  if (results.some(result => result.status === 'rejected')) historyError.value = 'Certains transferts ne peuvent pas être vérifiés. Actualisez le bilan avant de poursuivre.'
}

onMounted(loadRuns)
</script>
