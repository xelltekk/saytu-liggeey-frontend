<template>
  <div class="space-y-5">
    <div class="rounded-3xl border border-cyan-200 bg-cyan-50/70 p-6 shadow-sm">
      <button class="mb-6 text-sm font-bold text-cyan-700 hover:text-cyan-900" type="button" @click="goBack">
        ← Retour liste
      </button>
      <p class="text-xs font-black uppercase tracking-[0.22em] text-cyan-700">Règlement fournisseur</p>
      <h1 class="mt-2 text-3xl font-black text-slate-900">Nouveau règlement fournisseur</h1>
      <p class="mt-1 text-sm text-slate-600">Sélectionnez les factures à régler et validez le paiement sortant.</p>
    </div>

    <form class="space-y-5 rounded-3xl border border-cyan-200 bg-white p-5 shadow-sm" @submit.prevent="saveReglement">
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label class="field-label">
          Fournisseur
          <select v-model="form.fournisseur_id" required class="input mt-1" @change="loadFacturesImpayees">
            <option value="">Sélectionner</option>
            <option v-for="fournisseur in fournisseurs" :key="fournisseur.id" :value="fournisseur.id">{{ fournisseur.nom }}</option>
          </select>
        </label>
        <label class="field-label">
          Date règlement
          <input v-model="form.date_reglement" type="date" required class="input mt-1" />
        </label>
        <label class="field-label">
          Mode de paiement
          <select v-model="form.mode_paiement" required class="input mt-1">
            <option value="virement">Virement</option>
            <option value="cheque">Chèque</option>
            <option value="especes">Espèces</option>
            <option value="wave">Wave</option>
            <option value="orange_money">Orange Money</option>
            <option value="free_money">Free Money</option>
            <option value="carte_bancaire">Carte bancaire</option>
            <option value="autre">Autre</option>
          </select>
        </label>
        <label class="field-label">
          Montant réglé
          <input v-model.number="form.montant" type="number" min="1" step="1" required class="input mt-1" />
        </label>
        <label class="field-label">
          Statut initial
          <select v-model="form.statut" class="input mt-1">
            <option value="en_attente">En attente validation</option>
            <option value="valide">Validé immédiatement</option>
          </select>
        </label>
        <label class="field-label">
          Référence paiement
          <input v-model="form.reference_paiement" type="text" class="input mt-1" placeholder="N° chèque, virement..." />
        </label>
        <label class="field-label">
          Banque
          <input v-model="form.banque" type="text" class="input mt-1" />
        </label>
      </div>

      <div class="overflow-hidden rounded-2xl border border-cyan-200">
        <div class="border-b border-cyan-100 bg-cyan-50 px-4 py-3 text-sm font-black text-cyan-800">
          Factures à régler
        </div>
        <div v-if="facturesImpayees.length" class="max-h-[28rem] divide-y divide-cyan-100 overflow-y-auto">
          <label v-for="facture in facturesImpayees" :key="facture.id" class="grid cursor-pointer grid-cols-1 gap-3 px-4 py-3 hover:bg-cyan-50/60 sm:grid-cols-[28px_1fr_190px] sm:items-center">
            <input type="checkbox" :checked="isFactureSelected(facture.id)" class="h-4 w-4" :disabled="!canPayFacture(facture)" @change="toggleFacture(facture)" />
            <div>
              <div class="font-mono text-sm font-black text-slate-900">{{ facture.numero }}</div>
              <div class="text-xs text-slate-500">Reste : {{ formatPrice(facture.reste_a_payer) }} · Échéance : {{ formatDate(facture.date_echeance) }}</div>
              <span class="badge mt-1 inline-flex" :class="controlePaiementBadge(facture.controle_paiement_statut)">{{ controlePaiementLabel(facture.controle_paiement_statut) }}</span>
            </div>
            <input
              :disabled="!isFactureSelected(facture.id)"
              :value="selectedAmount(facture.id)"
              type="number"
              min="1"
              step="1"
              class="input"
              @input="setSelectedAmount(facture.id, $event.target.value)"
            />
          </label>
        </div>
        <div v-else class="px-4 py-8 text-center text-sm text-slate-500">
          Sélectionnez un fournisseur avec des factures impayées.
        </div>
      </div>

      <label class="field-label">
        Notes
        <textarea v-model="form.notes" rows="3" class="input mt-1"></textarea>
      </label>

      <div class="rounded-2xl bg-cyan-50 p-4 text-right">
        <span class="text-xs font-black uppercase tracking-[0.14em] text-cyan-700">Total affecté</span>
        <div class="font-mono text-2xl font-black text-slate-900">{{ formatPrice(totalAffecte) }}</div>
      </div>

      <div class="flex justify-end gap-2 border-t border-cyan-100 pt-4">
        <button type="button" class="btn-secondary" @click="goBack">Annuler</button>
        <button type="submit" class="btn-primary" :disabled="saving">{{ saving ? 'Enregistrement...' : 'Enregistrer le règlement' }}</button>
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
const facturesImpayees = ref([])
const saving = ref(false)

const form = reactive({
  fournisseur_id: '',
  date_reglement: todayInput(),
  montant: 0,
  mode_paiement: 'virement',
  statut: 'en_attente',
  reference_paiement: '',
  banque: '',
  notes: '',
  factures: [],
})

const totalAffecte = computed(() => form.factures.reduce((total, facture) => total + Number(facture.montant_affecte || 0), 0))

function todayInput() {
  return new Date().toISOString().slice(0, 10)
}

async function loadFournisseurs() {
  const { data } = await api.get('/fournisseurs-reglements/fournisseurs')
  fournisseurs.value = data
}

async function loadFacturesImpayees() {
  form.factures = []
  form.montant = 0
  facturesImpayees.value = []
  if (!form.fournisseur_id) return

  try {
    const { data } = await api.get(`/fournisseurs-reglements/fournisseurs/${form.fournisseur_id}/factures-impayees`)
    facturesImpayees.value = data
    applyPreselection()
  } catch (error) {
    showApiError(error, 'Impossible de charger les factures impayées du fournisseur.')
  }
}

function applyPreselection() {
  const factureId = Number(route.query.facture_id || 0)
  if (factureId) {
    const target = facturesImpayees.value.find((facture) => Number(facture.id) === factureId)
    if (target && canPayFacture(target)) {
      form.factures = [{ facture_id: target.id, montant_affecte: Number(target.reste_a_payer || 0) }]
      syncReglementMontant()
    }
    return
  }

  if (route.query.select_all === '1') {
    selectAllFacturesImpayees()
  }
}

function selectAllFacturesImpayees() {
  form.factures = facturesImpayees.value
    .filter((facture) => canPayFacture(facture))
    .map((facture) => ({ facture_id: facture.id, montant_affecte: Number(facture.reste_a_payer || 0) }))
  syncReglementMontant()
}

function isFactureSelected(id) {
  return form.factures.some((facture) => Number(facture.facture_id) === Number(id))
}

function selectedAmount(id) {
  return form.factures.find((facture) => Number(facture.facture_id) === Number(id))?.montant_affecte || ''
}

function toggleFacture(facture) {
  if (isFactureSelected(facture.id)) {
    form.factures = form.factures.filter((item) => Number(item.facture_id) !== Number(facture.id))
  } else {
    form.factures.push({ facture_id: facture.id, montant_affecte: Number(facture.reste_a_payer || 0) })
  }
  syncReglementMontant()
}

function setSelectedAmount(id, value) {
  const item = form.factures.find((facture) => Number(facture.facture_id) === Number(id))
  if (!item) return
  item.montant_affecte = Number(value || 0)
  syncReglementMontant()
}

function syncReglementMontant() {
  form.montant = totalAffecte.value
}

async function saveReglement() {
  saving.value = true
  try {
    const facturesSelectionnees = form.factures.filter((facture) => Number(facture.montant_affecte || 0) > 0)

    if (facturesSelectionnees.length === 0) {
      toast.error('Sélectionnez au moins une facture fournisseur.')
      return
    }

    if (Math.abs(totalAffecte.value - Number(form.montant || 0)) > 0.01) {
      toast.error('Le montant réglé doit être égal au total affecté aux factures.')
      return
    }

    await api.post('/fournisseurs-reglements/reglements', {
      ...form,
      factures: facturesSelectionnees,
    })
    toast.success('Règlement fournisseur enregistré.')
    goBack()
  } catch (error) {
    showApiError(error)
  } finally {
    saving.value = false
  }
}

function goBack() {
  router.push({ name: 'fournisseurs-reglements', query: { tab: 'reglements' } })
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

function formatDate(value) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('fr-FR')
}

function controlePaiementLabel(statut) {
  return {
    a_controler: 'À contrôler',
    bon_a_payer: 'Bon à payer',
    bloque: 'Bloquée',
  }[statut || 'a_controler'] || 'À contrôler'
}

function controlePaiementBadge(statut) {
  return {
    a_controler: 'bg-slate-100 text-slate-700',
    bon_a_payer: 'bg-cyan-100 text-cyan-700',
    bloque: 'bg-red-100 text-red-700',
  }[statut || 'a_controler'] || 'bg-slate-100 text-slate-700'
}

function canPayFacture(facture) {
  return Number(facture?.reste_a_payer || 0) > 0 && (facture?.controle_paiement_statut || 'a_controler') !== 'bloque'
}

onMounted(async () => {
  try {
    await loadFournisseurs()
    if (route.query.fournisseur_id) {
      form.fournisseur_id = route.query.fournisseur_id
      await loadFacturesImpayees()
    }
  } catch (error) {
    showApiError(error, 'Impossible de charger la fiche règlement.')
  }
})
</script>

<style scoped>
.field-label {
  @apply text-sm font-medium text-slate-700;
}

.badge {
  @apply inline-flex rounded-full px-2.5 py-1 text-xs font-semibold;
}
</style>
