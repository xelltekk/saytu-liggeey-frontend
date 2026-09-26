<template>
  <div class="space-y-5">
    <div class="rounded-3xl border border-cyan-200 bg-cyan-50/70 p-6 shadow-sm">
      <button class="mb-6 text-sm font-bold text-cyan-700 hover:text-cyan-900" type="button" @click="goBack">← Retour liste</button>
      <p class="text-xs font-black uppercase tracking-[0.22em] text-cyan-700">Parc leasing</p>
      <h1 class="mt-2 text-3xl font-black text-slate-900">{{ isEdit ? 'Modifier l’imprimante leasing' : 'Nouvelle imprimante leasing' }}</h1>
      <p class="mt-1 text-sm text-slate-600">Fiche imprimante en page complète.</p>
    </div>

    <form class="rounded-3xl border border-cyan-200 bg-white p-5 shadow-sm" @submit.prevent="saveImprimante">
      <div class="grid gap-4 md:grid-cols-2">
        <label class="field-label md:col-span-2">Produit lié (optionnel)
          <select v-model.number="form.produit_id" class="input mt-1" @change="syncProduit">
            <option value="">Aucun produit lié</option>
            <option v-for="produit in referentiels.produits" :key="produit.id" :value="produit.id">{{ produit.reference }} - {{ produit.libelle }}</option>
          </select>
        </label>
        <label v-if="isEdit" class="field-label md:col-span-2">Référence <input v-model="form.reference" class="input mt-1" /></label>
        <label class="field-label md:col-span-2">Désignation <input v-model="form.designation" class="input mt-1" required /></label>
        <label class="field-label">Marque <input v-model="form.marque" class="input mt-1" /></label>
        <label class="field-label">Modèle <input v-model="form.modele" class="input mt-1" /></label>
        <label class="field-label">N° série <input v-model="form.numero_serie" class="input mt-1" /></label>
        <label class="field-label">Emplacement <input v-model="form.localisation" class="input mt-1" placeholder="Ex: Locaux du client, bureau..." /></label>
        <label class="field-label">Type
          <select v-model="form.type_impression" class="input mt-1">
            <option value="multifonction">Multifonction</option>
            <option value="noir_blanc">Noir & blanc</option>
            <option value="couleur">Couleur</option>
          </select>
        </label>
        <label v-if="isEdit" class="field-label">Statut
          <select v-model="form.statut" class="input mt-1">
            <option value="disponible">Disponible</option>
            <option value="louee">Louée</option>
            <option value="maintenance">Maintenance</option>
            <option value="retiree">Retirée</option>
          </select>
        </label>
        <label class="field-label">Compteur noir initial <input v-model.number="form.compteur_initial_noir" type="number" min="0" class="input mt-1" /></label>
        <label class="field-label">Compteur couleur initial <input v-model.number="form.compteur_initial_couleur" type="number" min="0" class="input mt-1" /></label>
        <label v-if="isEdit" class="field-label">Compteur noir actuel <input v-model.number="form.compteur_actuel_noir" type="number" min="0" class="input mt-1" /></label>
        <label v-if="isEdit" class="field-label">Compteur couleur actuel <input v-model.number="form.compteur_actuel_couleur" type="number" min="0" class="input mt-1" /></label>
        <label class="field-label md:col-span-2">Notes <textarea v-model="form.notes" class="input mt-1 min-h-24"></textarea></label>
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
const isEdit = computed(() => !!route.params.id)
const referentiels = reactive({ produits: [] })
const form = reactive(defaultForm())

function defaultForm() {
  return {
    reference: '',
    produit_id: '',
    designation: '',
    marque: '',
    modele: '',
    numero_serie: '',
    localisation: '',
    type_impression: 'multifonction',
    statut: 'disponible',
    date_acquisition: '',
    compteur_initial_noir: 0,
    compteur_initial_couleur: '',
    compteur_actuel_noir: '',
    compteur_actuel_couleur: '',
    valeur_acquisition_ht: 0,
    notes: '',
  }
}

function normalizePayload(source) {
  return Object.fromEntries(Object.entries(source).map(([key, value]) => [key, value === '' ? null : value]))
}

async function loadReferentiels() {
  const { data } = await api.get('/leasing/referentiels')
  referentiels.produits = data.produits || []
}

async function loadImprimante() {
  if (!isEdit.value) return
  const { data } = await api.get(`/leasing/imprimantes/${route.params.id}`)
  Object.assign(form, {
    ...defaultForm(),
    reference: data.reference || '',
    produit_id: data.produit_id || '',
    designation: data.designation || '',
    marque: data.marque || '',
    modele: data.modele || '',
    numero_serie: data.numero_serie || '',
    localisation: data.localisation || '',
    type_impression: data.type_impression || 'multifonction',
    statut: data.statut || 'disponible',
    date_acquisition: data.date_acquisition ? String(data.date_acquisition).slice(0, 10) : '',
    compteur_initial_noir: data.compteur_initial_noir ?? 0,
    compteur_initial_couleur: data.compteur_initial_couleur ?? '',
    compteur_actuel_noir: data.compteur_actuel_noir ?? 0,
    compteur_actuel_couleur: data.compteur_actuel_couleur ?? '',
    valeur_acquisition_ht: Number(data.valeur_acquisition_ht || 0),
    notes: data.notes || '',
  })
}

function syncProduit() {
  const produit = referentiels.produits.find(item => Number(item.id) === Number(form.produit_id))
  if (!produit) return
  form.designation = produit.libelle || form.designation
  form.marque = produit.marque || form.marque
  form.modele = produit.modele || form.modele
  form.valeur_acquisition_ht = Number(produit.prix_achat_ht || 0)
}

async function saveImprimante() {
  saving.value = true
  try {
    const payload = normalizePayload(form)
    if (isEdit.value) {
      await api.put(`/leasing/imprimantes/${route.params.id}`, payload)
      toast.success('Imprimante mise à jour.')
    } else {
      await api.post('/leasing/imprimantes', payload)
      toast.success('Imprimante ajoutée au parc leasing.')
    }
    goBack()
  } catch (error) {
    handleApiError(error, isEdit.value ? 'Modification de l’imprimante impossible.' : 'Enregistrement de l’imprimante impossible.')
  } finally {
    saving.value = false
  }
}

function goBack() {
  router.push({ name: 'leasing', query: { tab: 'imprimantes' } })
}

function handleApiError(error, fallback) {
  const message = Object.values(error?.response?.data?.errors || {})[0]?.[0] || error?.response?.data?.message || fallback
  toast.error(message)
}

onMounted(async () => {
  try {
    await Promise.all([loadReferentiels(), loadImprimante()])
  } catch (error) {
    handleApiError(error, 'Impossible de charger la fiche imprimante.')
  }
})
</script>

<style scoped>
.field-label {
  @apply text-sm font-medium text-slate-700;
}
</style>
