<template>
  <div class="space-y-5">
    <div class="rounded-3xl border border-cyan-200 bg-cyan-50/70 p-6 shadow-sm">
      <button class="mb-6 text-sm font-bold text-cyan-700 hover:text-cyan-900" type="button" @click="goBack">← Retour liste</button>
      <p class="text-xs font-black uppercase tracking-[0.22em] text-cyan-700">Intervention leasing</p>
      <h1 class="mt-2 text-3xl font-black text-slate-900">{{ isEdit ? `Modifier ${intervention?.reference || ''}` : 'Nouvelle intervention' }}</h1>
      <p class="mt-1 text-sm text-slate-600">Planification et suivi intervention en page complète.</p>
    </div>

    <form class="rounded-3xl border border-cyan-200 bg-white p-5 shadow-sm" @submit.prevent="saveIntervention">
      <div class="grid gap-4 md:grid-cols-2">
        <label class="field-label">Contrat lié
          <select v-model.number="form.contrat_id" class="input mt-1">
            <option value="">Sans contrat</option>
            <option v-for="contrat in contrats" :key="contrat.id" :value="contrat.id">{{ contrat.numero }} - {{ contrat.client?.nom }}</option>
          </select>
        </label>
        <label class="field-label">Imprimante
          <select v-model.number="form.imprimante_id" class="input mt-1" :required="!form.contrat_id" :disabled="!!form.contrat_id">
            <option value="">Choisir</option>
            <option v-for="imprimante in imprimantes" :key="imprimante.id" :value="imprimante.id">{{ imprimante.reference }} - {{ imprimante.designation }}</option>
          </select>
        </label>
        <label class="field-label">Date intervention <input v-model="form.date_intervention" type="date" class="input mt-1" required /></label>
        <label class="field-label">Date résolution <input v-model="form.date_resolution" type="date" class="input mt-1" /></label>
        <label class="field-label">Technicien <input v-model="form.technicien" class="input mt-1" placeholder="Nom du technicien / prestataire" /></label>
        <label class="field-label">Coût HT <input v-model.number="form.cout_ht" type="number" min="0" step="1" class="input mt-1" /></label>
        <label class="field-label">Type
          <select v-model="form.type" class="input mt-1">
            <option value="installation">Installation</option>
            <option value="maintenance">Maintenance</option>
            <option value="depannage">Dépannage</option>
            <option value="retrait">Retrait</option>
            <option value="releve">Relevé</option>
            <option value="autre">Autre</option>
          </select>
        </label>
        <label class="field-label">Statut
          <select v-model="form.statut" class="input mt-1">
            <option value="planifiee">Planifiée</option>
            <option value="en_cours">En cours</option>
            <option value="terminee">Terminée</option>
            <option value="annulee">Annulée</option>
          </select>
        </label>
        <label class="field-label md:col-span-2">Description / problème constaté <textarea v-model="form.description" class="input mt-1 min-h-24"></textarea></label>
        <label class="field-label md:col-span-2">Solution / travaux effectués <textarea v-model="form.solution" class="input mt-1 min-h-20" placeholder="Pièces changées, nettoyage, configuration, test effectué..."></textarea></label>
        <label class="field-label md:col-span-2">Notes internes <textarea v-model="form.notes" class="input mt-1 min-h-20"></textarea></label>
      </div>
      <div class="mt-6 flex justify-end gap-2 border-t border-cyan-100 pt-4">
        <button type="button" class="btn-secondary" @click="goBack">Annuler</button>
        <button class="btn-primary" :disabled="saving">{{ saving ? 'Enregistrement...' : (isEdit ? 'Mettre à jour' : 'Enregistrer') }}</button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const saving = ref(false)
const contrats = ref([])
const imprimantes = ref([])
const intervention = ref(null)
const isEdit = computed(() => !!route.params.id)
const form = reactive(defaultForm())

function defaultForm() {
  return {
    contrat_id: '',
    imprimante_id: '',
    type: 'maintenance',
    statut: 'planifiee',
    date_intervention: today(),
    date_resolution: '',
    technicien: '',
    cout_ht: 0,
    description: '',
    solution: '',
    notes: '',
  }
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

function normalizeDate(value) {
  return value ? String(value).slice(0, 10) : ''
}

function normalizePayload(source) {
  return Object.fromEntries(Object.entries(source).map(([key, value]) => [key, value === '' ? null : value]))
}

async function loadLists() {
  const [{ data: contratsData }, { data: imprimantesData }] = await Promise.all([
    api.get('/leasing/contrats', { params: { per_page: 100 } }),
    api.get('/leasing/imprimantes', { params: { per_page: 100 } }),
  ])
  contrats.value = contratsData.data || []
  imprimantes.value = imprimantesData.data || []
}

async function loadIntervention() {
  if (!isEdit.value) return
  const { data } = await api.get(`/leasing/interventions/${route.params.id}`)
  intervention.value = data
  Object.assign(form, {
    ...defaultForm(),
    contrat_id: data.contrat_id || data.contrat?.id || '',
    imprimante_id: data.imprimante_id || data.imprimante?.id || '',
    type: data.type || 'maintenance',
    statut: data.statut || 'planifiee',
    date_intervention: normalizeDate(data.date_intervention) || today(),
    date_resolution: normalizeDate(data.date_resolution),
    technicien: data.technicien || '',
    cout_ht: Number(data.cout_ht || 0),
    description: data.description || '',
    solution: data.solution || '',
    notes: data.notes || '',
  })
}

async function saveIntervention() {
  saving.value = true
  try {
    const payload = normalizePayload(form)
    if (isEdit.value) {
      await api.put(`/leasing/interventions/${route.params.id}`, payload)
      toast.success('Intervention mise à jour.')
    } else {
      await api.post('/leasing/interventions', payload)
      toast.success('Intervention enregistrée.')
    }
    goBack()
  } catch (error) {
    const message = Object.values(error?.response?.data?.errors || {})[0]?.[0] || error?.response?.data?.message || (isEdit.value ? 'Modification de l’intervention impossible.' : 'Enregistrement de l’intervention impossible.')
    toast.error(message)
  } finally {
    saving.value = false
  }
}

function goBack() {
  router.push({ name: 'leasing', query: { tab: 'interventions' } })
}

onMounted(async () => {
  await Promise.all([loadLists(), loadIntervention()])
  if (!isEdit.value && route.query.contrat_id) form.contrat_id = route.query.contrat_id
})
</script>

<style scoped>
.field-label {
  @apply text-sm font-medium text-slate-700;
}
</style>
