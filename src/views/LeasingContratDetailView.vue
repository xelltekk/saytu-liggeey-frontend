<template>
  <div class="space-y-5">
    <div class="rounded-3xl border border-cyan-200 bg-cyan-50/70 p-6 shadow-sm">
      <button class="mb-6 text-sm font-bold text-cyan-700 hover:text-cyan-900" type="button" @click="goBack">← Retour liste</button>
      <p class="text-xs font-black uppercase tracking-[0.22em] text-cyan-700">Contrat leasing</p>
      <h1 class="mt-2 text-3xl font-black text-slate-900">Nouveau contrat de leasing</h1>
      <p class="mt-1 text-sm text-slate-600">Création du contrat en page complète.</p>
    </div>

    <form class="rounded-3xl border border-cyan-200 bg-white p-5 shadow-sm" @submit.prevent="saveContrat">
      <div class="grid gap-4 md:grid-cols-2">
        <label class="field-label">Client
          <select v-model.number="form.client_id" class="input mt-1" required>
            <option value="">Choisir un client</option>
            <option v-for="client in referentiels.clients" :key="client.id" :value="client.id">{{ client.code }} - {{ client.nom }}</option>
          </select>
        </label>
        <label class="field-label">Imprimante
          <select v-model.number="form.imprimante_id" class="input mt-1" required>
            <option value="">Choisir une imprimante</option>
            <option v-for="imprimante in referentiels.imprimantes_disponibles" :key="imprimante.id" :value="imprimante.id">{{ imprimante.reference }} - {{ imprimante.designation }}</option>
          </select>
        </label>
        <label class="field-label">Date début <input v-model="form.date_debut" type="date" class="input mt-1" required /></label>
        <label class="field-label">Date fin <input v-model="form.date_fin" type="date" class="input mt-1" /></label>
        <label class="field-label">Périodicité
          <select v-model="form.periodicite_facturation" class="input mt-1">
            <option value="mensuelle">Mensuelle</option>
            <option value="trimestrielle">Trimestrielle</option>
            <option value="semestrielle">Semestrielle</option>
            <option value="annuelle">Annuelle</option>
          </select>
        </label>
        <label class="field-label">Loyer mensuel HT <input v-model.number="form.loyer_mensuel_ht" type="number" min="0" step="1" class="input mt-1" required /></label>
        <label class="field-label">TVA % <input v-model.number="form.taux_tva" type="number" min="0" max="100" step="0.01" class="input mt-1" /></label>
        <label class="field-label">Forfait pages noir <input v-model.number="form.forfait_pages_noir" type="number" min="0" class="input mt-1" /></label>
        <label class="field-label">Prix page noir HT <input v-model.number="form.prix_page_noir_ht" type="number" min="0" step="0.01" class="input mt-1" /></label>
        <label class="field-label">Forfait pages couleur <input v-model.number="form.forfait_pages_couleur" type="number" min="0" class="input mt-1" /></label>
        <label class="field-label">Prix page couleur HT <input v-model.number="form.prix_page_couleur_ht" type="number" min="0" step="0.01" class="input mt-1" /></label>
        <label class="field-label">Frais de pose / dépôt HT <input v-model.number="form.depot_garantie" type="number" min="0" step="1" class="input mt-1" /></label>
        <label class="field-label md:col-span-2">Conditions particulières <textarea v-model="form.conditions" class="input mt-1 min-h-24"></textarea></label>
      </div>
      <div class="mt-6 flex justify-end gap-2 border-t border-cyan-100 pt-4">
        <button type="button" class="btn-secondary" @click="goBack">Annuler</button>
        <button class="btn-primary" :disabled="saving">{{ saving ? 'Enregistrement...' : 'Enregistrer le contrat' }}</button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'

const router = useRouter()
const toast = useToast()
const saving = ref(false)
const referentiels = reactive({ clients: [], imprimantes_disponibles: [] })
const form = reactive({
  client_id: '',
  imprimante_id: '',
  date_debut: today(),
  date_fin: '',
  periodicite_facturation: 'mensuelle',
  statut: 'brouillon',
  loyer_mensuel_ht: 0,
  taux_tva: 18,
  forfait_pages_noir: 0,
  prix_page_noir_ht: 0,
  forfait_pages_couleur: 0,
  prix_page_couleur_ht: 0,
  depot_garantie: 0,
  conditions: '',
  notes: '',
})

function today() {
  return new Date().toISOString().slice(0, 10)
}

function normalizePayload(source) {
  return Object.fromEntries(Object.entries(source).map(([key, value]) => [key, value === '' ? null : value]))
}

async function loadReferentiels() {
  const { data } = await api.get('/leasing/referentiels')
  referentiels.clients = data.clients || []
  referentiels.imprimantes_disponibles = data.imprimantes_disponibles || []
}

async function saveContrat() {
  saving.value = true
  try {
    await api.post('/leasing/contrats', normalizePayload(form))
    toast.success('Contrat de leasing créé.')
    goBack()
  } catch (error) {
    const message = Object.values(error?.response?.data?.errors || {})[0]?.[0] || error?.response?.data?.message || 'Enregistrement du contrat impossible.'
    toast.error(message)
  } finally {
    saving.value = false
  }
}

function goBack() {
  router.push({ name: 'leasing', query: { tab: 'contrats' } })
}

onMounted(loadReferentiels)
</script>

<style scoped>
.field-label {
  @apply text-sm font-medium text-slate-700;
}
</style>
