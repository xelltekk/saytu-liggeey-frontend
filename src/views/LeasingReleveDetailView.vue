<template>
  <div class="space-y-5">
    <div class="rounded-3xl border border-cyan-200 bg-cyan-50/70 p-6 shadow-sm">
      <button class="mb-6 text-sm font-bold text-cyan-700 hover:text-cyan-900" type="button" @click="goBack">← Retour liste</button>
      <p class="text-xs font-black uppercase tracking-[0.22em] text-cyan-700">Relevé compteur</p>
      <h1 class="mt-2 text-3xl font-black text-slate-900">Nouveau relevé compteur</h1>
      <p class="mt-1 text-sm text-slate-600">Saisie du relevé en page complète.</p>
    </div>

    <form class="space-y-5 rounded-3xl border border-cyan-200 bg-white p-5 shadow-sm" @submit.prevent="saveReleve">
      <label class="field-label">Contrat
        <select v-model.number="form.contrat_id" class="input mt-1" required>
          <option value="">Choisir un contrat</option>
          <option v-for="contrat in contratsReleves" :key="contrat.id" :value="contrat.id">{{ contrat.numero }} - {{ contrat.client?.nom }} - {{ contrat.imprimante?.designation }}</option>
        </select>
      </label>
      <div class="grid gap-4 md:grid-cols-3">
        <label class="field-label">Mois du relevé <input v-model="form.periode" type="month" class="input mt-1" required /></label>
        <label class="field-label md:col-span-2">Justificatif du relevé (optionnel)
          <input type="file" accept=".pdf,.jpg,.jpeg,.png" class="input mt-1" @change="onFileChange" />
          <span class="mt-1 block text-xs text-slate-500">Le fichier est archivé avec le relevé. La saisie des compteurs reste manuelle.</span>
        </label>
      </div>

      <div class="rounded-2xl border border-blue-100 bg-blue-50 p-4">
        <div class="mb-3">
          <strong class="text-slate-900">Comptage manuel</strong>
          <p class="text-xs text-slate-600">L’ancien comptage est prérempli depuis le dernier relevé ou le compteur initial.</p>
        </div>
        <div class="grid gap-4 md:grid-cols-2">
          <label class="field-label">Ancien comptage noir
            <input v-model.number="form.ancien_compteur_noir" type="number" min="0" class="input mt-1" placeholder="Ancien compteur noir" />
          </label>
          <label class="field-label">Nouveau comptage noir
            <input v-model.number="form.compteur_noir" type="number" min="0" class="input mt-1" required placeholder="Nouveau compteur noir" />
          </label>
          <label class="field-label">Ancien comptage couleur
            <input v-model.number="form.ancien_compteur_couleur" type="number" min="0" class="input mt-1" placeholder="Ancien compteur couleur" />
          </label>
          <label class="field-label">Nouveau comptage couleur
            <input v-model.number="form.compteur_couleur" type="number" min="0" class="input mt-1" placeholder="Nouveau compteur couleur" />
          </label>
        </div>
      </div>

      <div class="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
        <span>{{ previewLoading ? 'Calcul en cours...' : 'Le calcul se met à jour automatiquement pendant la saisie.' }}</span>
        <button type="button" class="btn-secondary" :disabled="previewLoading" @click="previewReleve(false)">
          {{ previewLoading ? 'Calcul...' : 'Recalculer maintenant' }}
        </button>
      </div>

      <div v-if="preview" class="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-950">
        <div class="grid gap-3 lg:grid-cols-3">
          <div>
            <span class="caption">Comptage saisi</span>
            <strong class="block">Noir : {{ preview.ancien_compteur_noir ?? 0 }} → {{ preview.compteur_noir ?? '-' }}</strong>
            <p>Couleur : {{ preview.ancien_compteur_couleur ?? '-' }} → {{ preview.compteur_couleur ?? '-' }}</p>
          </div>
          <div>
            <span class="caption">Différence calculée</span>
            <strong class="block">{{ preview.copies_noir || 0 }} pages noir · {{ preview.copies_couleur || 0 }} pages couleur</strong>
            <p>Supplément : <strong>{{ money(preview.montant_supp_ht) }}</strong></p>
          </div>
          <div class="rounded-xl bg-white/70 p-3">
            <span class="caption">Total facturable estimatif</span>
            <div class="mt-1 space-y-1">
              <p class="flex justify-between"><span>Loyer période HT</span><strong>{{ money(preview.loyer_periode_ht) }}</strong></p>
              <p class="flex justify-between"><span>Total HT</span><strong>{{ money(preview.total_ht) }}</strong></p>
              <p class="flex justify-between"><span>TVA</span><strong>{{ money(preview.total_tva) }}</strong></p>
              <p class="flex justify-between border-t border-blue-100 pt-1 text-base"><span>Total TTC</span><strong class="text-xelltekk-700">{{ money(preview.total_ttc) }}</strong></p>
            </div>
          </div>
        </div>
      </div>

      <label class="field-label">Notes <textarea v-model="form.notes" class="input mt-1 min-h-20"></textarea></label>

      <div class="flex justify-end gap-2 border-t border-cyan-100 pt-4">
        <button type="button" class="btn-secondary" @click="goBack">Annuler</button>
        <button class="btn-primary" :disabled="saving">{{ saving ? 'Enregistrement...' : 'Enregistrer le relevé' }}</button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const saving = ref(false)
const previewLoading = ref(false)
const preview = ref(null)
const contrats = ref([])
let previewTimer = null

const form = reactive({
  contrat_id: '',
  periode: today().slice(0, 7),
  ancien_compteur_noir: '',
  compteur_noir: '',
  ancien_compteur_couleur: '',
  compteur_couleur: '',
  fichier_releve: null,
  notes: '',
})

const contratsReleves = computed(() => contrats.value.filter(item => ['brouillon', 'actif', 'suspendu'].includes(item.statut)))

watch(
  () => [form.contrat_id, form.periode, form.ancien_compteur_noir, form.compteur_noir, form.ancien_compteur_couleur, form.compteur_couleur],
  () => schedulePreview()
)

watch(
  () => [form.contrat_id, form.periode],
  ([contratId, periode], [oldContratId, oldPeriode] = []) => {
    if (oldContratId === undefined) return
    if (contratId !== oldContratId || periode !== oldPeriode) {
      form.ancien_compteur_noir = ''
      form.ancien_compteur_couleur = ''
      form.compteur_noir = ''
      form.compteur_couleur = ''
      preview.value = null
    }
  }
)

function today() {
  return new Date().toISOString().slice(0, 10)
}

async function loadContrats() {
  const { data } = await api.get('/leasing/contrats', { params: { per_page: 100 } })
  contrats.value = data.data || []
}

function schedulePreview() {
  if (previewTimer) clearTimeout(previewTimer)
  if (!form.contrat_id || !form.periode) {
    preview.value = null
    return
  }
  previewTimer = setTimeout(() => previewReleve(true), 450)
}

async function previewReleve(silent = false) {
  if (!form.contrat_id || !form.periode) return
  previewLoading.value = true
  try {
    const { data } = await api.post('/leasing/releves/previsualiser', normalizePayload({
      contrat_id: form.contrat_id,
      periode: form.periode,
      ancien_compteur_noir: form.ancien_compteur_noir,
      compteur_noir: form.compteur_noir,
      ancien_compteur_couleur: form.ancien_compteur_couleur,
      compteur_couleur: form.compteur_couleur,
    }))
    preview.value = data
    hydrateAncienCompteurs(data)
  } catch (error) {
    if (!silent) handleApiError(error, 'Calcul du relevé impossible.')
  } finally {
    previewLoading.value = false
  }
}

function hydrateAncienCompteurs(data) {
  if (!data) return
  if (isEmptyCounter(form.ancien_compteur_noir)) form.ancien_compteur_noir = data.ancien_compteur_noir ?? 0
  if (isEmptyCounter(form.ancien_compteur_couleur) && data.ancien_compteur_couleur !== null && data.ancien_compteur_couleur !== undefined) {
    form.ancien_compteur_couleur = data.ancien_compteur_couleur
  }
}

function isEmptyCounter(value) {
  return value === '' || value === null || value === undefined
}

function onFileChange(event) {
  form.fichier_releve = event.target.files?.[0] || null
}

async function saveReleve() {
  saving.value = true
  try {
    const payload = new FormData()
    for (const [key, value] of Object.entries(form)) {
      if (value !== '' && value !== null && value !== undefined) payload.append(key, value)
    }
    await api.post('/leasing/releves', payload, { headers: { 'Content-Type': 'multipart/form-data' } })
    toast.success('Relevé compteur enregistré.')
    goBack()
  } catch (error) {
    handleApiError(error, 'Enregistrement du relevé impossible.')
  } finally {
    saving.value = false
  }
}

function normalizePayload(source) {
  return Object.fromEntries(Object.entries(source).map(([key, value]) => [key, value === '' ? null : value]))
}

function goBack() {
  router.push({ name: 'leasing', query: { tab: 'releves' } })
}

function money(value) {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Number(value || 0))
}

function handleApiError(error, fallback) {
  const message = Object.values(error?.response?.data?.errors || {})[0]?.[0] || error?.response?.data?.message || fallback
  toast.error(message)
}

onMounted(async () => {
  await loadContrats()
  if (route.query.contrat_id) form.contrat_id = route.query.contrat_id
})
</script>

<style scoped>
.field-label {
  @apply text-sm font-medium text-slate-700;
}

.caption {
  @apply text-xs font-bold uppercase tracking-wide text-blue-700;
}
</style>
