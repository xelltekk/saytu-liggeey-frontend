<template>
  <div class="space-y-5">
    <div class="rounded-3xl border border-cyan-200 bg-cyan-50/70 p-6 shadow-sm">
      <button class="mb-6 text-sm font-bold text-cyan-700 hover:text-cyan-900" type="button" @click="goBack">
        ← Retour liste
      </button>
      <p class="text-xs font-black uppercase tracking-[0.22em] text-cyan-700">Facture fournisseur</p>
      <h1 class="mt-2 text-3xl font-black text-slate-900">{{ isEdit ? `Modifier ${facture?.numero || ''}` : 'Nouvelle facture fournisseur' }}</h1>
      <p class="mt-1 text-sm text-slate-600">Saisie complète en page dédiée, sans fenêtre flottante.</p>
    </div>

    <form class="rounded-3xl border border-cyan-200 bg-white p-5 shadow-sm" @submit.prevent="saveFacture">
      <div v-if="facture?.commande_achat" class="mb-4 rounded-2xl border border-violet-200 bg-violet-50 p-4 text-sm text-violet-900">
        Facture générée depuis la commande <strong class="font-mono">{{ facture.commande_achat.numero }}</strong>. Le fournisseur et les montants restent synchronisés avec cette commande.
      </div>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label class="field-label">
          Fournisseur
          <select v-model="form.fournisseur_id" required class="input mt-1" :disabled="!!facture?.commande_achat">
            <option value="">Sélectionner</option>
            <option v-for="fournisseur in fournisseurs" :key="fournisseur.id" :value="fournisseur.id">{{ fournisseur.nom }}</option>
          </select>
        </label>
        <label class="field-label">
          Référence fournisseur
          <input v-model="form.reference_fournisseur" type="text" class="input mt-1" placeholder="N° facture reçue" />
        </label>
        <label class="field-label">
          Date facture
          <input v-model="form.date_facture" type="date" required class="input mt-1" />
        </label>
        <label class="field-label">
          Date échéance
          <input v-model="form.date_echeance" type="date" class="input mt-1" />
        </label>
        <label class="field-label md:col-span-2">
          Objet
          <input v-model="form.objet" type="text" required class="input mt-1" :readonly="!!facture?.commande_achat" placeholder="Achat marchandises, prestation, transport..." />
        </label>
        <label class="field-label">
          Montant HT
          <input v-model.number="form.montant_ht" type="number" min="0" step="1" required class="input mt-1" :readonly="!!facture?.commande_achat" />
        </label>
        <label class="field-label">
          TVA fournisseur
          <input v-model.number="form.montant_tva" type="number" min="0" step="1" class="input mt-1" :readonly="!!facture?.commande_achat" />
        </label>
        <label class="field-label">
          Statut
          <select v-model="form.statut" class="input mt-1">
            <option value="validee">Validée</option>
            <option value="brouillon">Brouillon</option>
            <option value="annulee">Annulée</option>
          </select>
        </label>
        <label class="field-label">
          Contrôle paiement
          <select v-model="form.controle_paiement_statut" class="input mt-1">
            <option value="a_controler">À contrôler</option>
            <option value="bon_a_payer">Bon à payer</option>
            <option value="bloque">Bloquée</option>
          </select>
        </label>
        <label class="field-label">
          Total TTC
          <input :value="formatPrice(totalFactureForm)" type="text" readonly class="input mt-1 bg-slate-50" />
        </label>
        <label class="field-label md:col-span-2">
          Notes
          <textarea v-model="form.notes" rows="3" class="input mt-1"></textarea>
        </label>
        <label class="field-label md:col-span-2">
          Note contrôle paiement
          <textarea v-model="form.controle_paiement_note" rows="2" class="input mt-1" placeholder="Ex: litige, validation gérant, attente avoir..."></textarea>
        </label>
      </div>

      <div class="mt-6 flex justify-end gap-2 border-t border-cyan-100 pt-4">
        <button type="button" class="btn-secondary" @click="goBack">Annuler</button>
        <button type="submit" class="btn-primary" :disabled="saving">{{ saving ? 'Enregistrement...' : 'Enregistrer' }}</button>
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
const fournisseurs = ref([])
const facture = ref(null)
const saving = ref(false)
const isEdit = computed(() => !!route.params.id)

const form = reactive({
  fournisseur_id: '',
  reference_fournisseur: '',
  objet: '',
  statut: 'validee',
  controle_paiement_statut: 'a_controler',
  controle_paiement_note: '',
  date_facture: todayInput(),
  date_echeance: '',
  montant_ht: 0,
  montant_tva: 0,
  notes: '',
})

const totalFactureForm = computed(() => Number(form.montant_ht || 0) + Number(form.montant_tva || 0))

function todayInput() {
  return new Date().toISOString().slice(0, 10)
}

function normalizeDate(value) {
  return value ? String(value).slice(0, 10) : ''
}

async function loadFournisseurs() {
  const { data } = await api.get('/fournisseurs-reglements/fournisseurs')
  fournisseurs.value = data
}

async function loadFacture() {
  if (!isEdit.value) return
  const { data } = await api.get(`/fournisseurs-reglements/factures/${route.params.id}`)
  facture.value = data
  Object.assign(form, {
    fournisseur_id: data.fournisseur_id || data.fournisseur?.id || '',
    reference_fournisseur: data.reference_fournisseur || '',
    objet: data.objet || '',
    statut: ['payee', 'partiellement_payee'].includes(data.statut) ? 'validee' : data.statut,
    controle_paiement_statut: data.controle_paiement_statut || 'a_controler',
    controle_paiement_note: data.controle_paiement_note || '',
    date_facture: normalizeDate(data.date_facture),
    date_echeance: normalizeDate(data.date_echeance),
    montant_ht: Number(data.montant_ht || 0),
    montant_tva: Number(data.montant_tva || 0),
    notes: data.notes || '',
  })
}

async function saveFacture() {
  saving.value = true
  try {
    const payload = { ...form, date_echeance: form.date_echeance || null }
    if (isEdit.value) {
      await api.put(`/fournisseurs-reglements/factures/${route.params.id}`, payload)
      toast.success('Facture fournisseur modifiée.')
    } else {
      await api.post('/fournisseurs-reglements/factures', payload)
      toast.success('Facture fournisseur créée.')
    }
    goBack()
  } catch (error) {
    showApiError(error)
  } finally {
    saving.value = false
  }
}

function goBack() {
  router.push({ name: 'fournisseurs-reglements', query: { tab: 'factures' } })
}

function showApiError(error, fallback = 'Une erreur est survenue.') {
  const data = error?.response?.data || {}
  const errors = data.errors
  if (errors) {
    toast.error(Object.values(errors).flat()[0] || 'Veuillez corriger le formulaire.')
    return
  }
  toast.error(data.message || fallback)
}

function formatPrice(value) {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Number(value || 0))
}

onMounted(async () => {
  try {
    await Promise.all([loadFournisseurs(), loadFacture()])
  } catch (error) {
    showApiError(error, 'Impossible de charger la facture fournisseur.')
  }
})
</script>

<style scoped>
.field-label {
  @apply text-sm font-medium text-slate-700;
}
</style>
