<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <FormErrorSummary :errors="errors" :labels="errorLabels" />

    <fieldset class="border border-gray-200 rounded-lg p-4">
      <legend class="px-2 text-sm font-semibold text-gray-700">Paiement</legend>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Client <span class="text-red-500">*</span></label>
          <ClientSearchSelect v-model="form.client_id" required placeholder="Rechercher par nom, code, telephone..." />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Date <span class="text-red-500">*</span></label>
          <input v-model="form.date_paiement" type="date" class="input" required />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Montant <span class="text-red-500">*</span></label>
          <input v-model.number="form.montant" type="number" step="0.01" min="0.01" class="input" required />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Mode de paiement <span class="text-red-500">*</span></label>
          <select v-model="form.mode_paiement" class="input" required>
            <option value="virement">Virement bancaire</option>
            <option value="cheque">Chèque</option>
            <option value="especes">Espèces</option>
            <option value="carte_bancaire">Carte bancaire</option>
            <option value="wave">Wave 🌊</option>
            <option value="orange_money">Orange Money 🟠</option>
            <option value="free_money">Free Money</option>
            <option value="mobile_money">Mobile Money (autre)</option>
            <option value="compensation">Compensation</option>
            <option value="autre">Autre</option>
          </select>
        </div>

        <div class="md:col-span-2">
          <label class="block text-sm font-medium text-gray-700 mb-1">Référence (N° chèque, transaction Wave/OM...)</label>
          <input v-model="form.reference_paiement" type="text" class="input" />
        </div>

        <div class="md:col-span-2">
          <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea v-model="form.notes" rows="2" class="input"></textarea>
        </div>
      </div>
    </fieldset>

    <!-- Affectation aux factures -->
    <fieldset v-if="form.client_id" class="border border-gray-200 rounded-lg p-4">
      <legend class="px-2 text-sm font-semibold text-gray-700">Affectation aux factures impayées</legend>

      <div v-if="loadingFactures" class="text-center py-4 text-gray-500 text-sm">Chargement...</div>

      <div v-else-if="facturesImpayees.length === 0" class="text-center py-4 text-gray-500 text-sm">
        ✅ Aucune facture impayée pour ce client
      </div>

      <div v-else>
        <div class="text-xs text-gray-500 mb-2">
          Cochez les factures et ajustez les montants à affecter (par défaut : montant restant dû).
        </div>

        <div class="space-y-2 max-h-64 overflow-y-auto">
          <div v-for="f in facturesImpayees" :key="f.id"
               class="flex items-center gap-3 p-2 border border-gray-200 rounded-lg"
               :class="affectations[f.id] ? 'bg-xelltekk-50 border-xelltekk-200' : ''">
            <input type="checkbox" :checked="!!affectations[f.id]" @change="toggleAffectation(f)" class="h-4 w-4" />
            <div class="flex-1">
              <div class="font-mono text-sm font-semibold">{{ f.numero }}</div>
              <div class="text-xs text-gray-500">
                {{ formatDate(f.date_facture) }} — Total : {{ formatPrice(f.total_ttc) }} — Reste : <strong>{{ formatPrice(f.reste_a_payer) }}</strong>
              </div>
            </div>
            <div v-if="affectations[f.id]" class="w-32">
              <input v-model.number="affectations[f.id]" @blur="normaliserAffectation(f)" type="number" step="0.01" min="0" :max="f.reste_a_payer" class="input text-sm text-right" />
            </div>
          </div>
        </div>

        <div class="mt-3 p-2 bg-blue-50 rounded text-sm flex justify-between">
          <span>Total affecté :</span>
          <strong class="text-blue-700">{{ formatPrice(totalAffecte) }} / {{ formatPrice(form.montant || 0) }}</strong>
        </div>
        <div v-if="resteAffectation !== 0" class="mt-1 text-xs" :class="resteAffectation > 0 ? 'text-orange-600' : 'text-red-600'">
          {{ resteAffectation > 0 ? `Reste à affecter : ${formatPrice(resteAffectation)}` : `Sur-affectation : ${formatPrice(-resteAffectation)}` }}
        </div>
      </div>
    </fieldset>

    <div class="flex justify-end gap-2 pt-2 border-t border-gray-200">
      <button type="button" @click="$emit('cancel')" class="btn-secondary">Annuler</button>
      <button type="submit" :disabled="saving" class="btn-primary">
        <span v-if="saving">Enregistrement...</span><span v-else>Enregistrer le paiement</span>
      </button>
    </div>
  </form>
</template>

<script setup>
import { reactive, ref, computed, watch } from 'vue'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'
import ClientSearchSelect from '@/components/ClientSearchSelect.vue'
import FormErrorSummary from '@/components/FormErrorSummary.vue'
import { errorMessagesFromResponse, validationErrors } from '@/utils/formErrors'

const emit = defineEmits(['saved', 'cancel'])
const toast = useToast()

const form = reactive({
  client_id: null,
  date_paiement: new Date().toISOString().slice(0, 10),
  montant: 0,
  mode_paiement: 'virement',
  reference_paiement: '',
  notes: '',
})

const facturesImpayees = ref([])
const affectations = reactive({}) // { facture_id: montant }
const loadingFactures = ref(false)
const saving = ref(false)
const errors = ref({})
const errorLabels = {
  client_id: 'Client',
  montant: 'Montant payé',
  date_paiement: 'Date paiement',
  mode_paiement: 'Mode de paiement',
  factures: 'Facture',
  montant_affecte: 'Montant affecté',
}

const totalAffecte = computed(() => Object.values(affectations).reduce((s, v) => s + (parseFloat(v) || 0), 0))
const resteAffectation = computed(() => (form.montant || 0) - totalAffecte.value)

async function loadFacturesImpayees() {
  Object.keys(affectations).forEach(k => delete affectations[k])
  facturesImpayees.value = []
  if (!form.client_id) return
  loadingFactures.value = true
  try {
    const { data } = await api.get(`/clients/${form.client_id}/factures-impayees`)
    facturesImpayees.value = data
  } catch (e) {
    toast.error('Erreur de chargement des factures')
  } finally {
    loadingFactures.value = false
  }
}

function toggleAffectation(facture) {
  if (affectations[facture.id]) {
    delete affectations[facture.id]
  } else {
    const resteFacture = parseFloat(facture.reste_a_payer) || 0
    const restePaiement = Math.max(parseFloat(resteAffectation.value) || 0, 0)
    affectations[facture.id] = Math.min(resteFacture, restePaiement || resteFacture)
  }
}

function normaliserAffectation(facture) {
  const id = facture.id
  const montant = parseFloat(affectations[id]) || 0
  if (montant <= 0) {
    delete affectations[id]
    return
  }

  const resteFacture = parseFloat(facture.reste_a_payer) || 0
  const autresAffectations = totalAffecte.value - montant
  const disponiblePaiement = Math.max((parseFloat(form.montant) || 0) - autresAffectations, 0)
  const maximum = form.montant > 0 ? Math.min(resteFacture, disponiblePaiement) : resteFacture
  affectations[id] = Math.min(montant, maximum)
}

function ajusterAffectationsAuPaiement() {
  let disponible = parseFloat(form.montant) || 0

  for (const facture of facturesImpayees.value) {
    const id = facture.id
    const montant = parseFloat(affectations[id]) || 0
    if (!montant) continue

    const resteFacture = parseFloat(facture.reste_a_payer) || 0
    const nouveauMontant = Math.min(montant, resteFacture, Math.max(disponible, 0))
    if (nouveauMontant <= 0) {
      delete affectations[id]
    } else {
      affectations[id] = nouveauMontant
    }
    disponible -= nouveauMontant
  }
}

function formatPrice(n) { return new Intl.NumberFormat('fr-FR').format(Math.round(n || 0)) }
function formatDate(d) { return d ? new Date(d).toLocaleDateString('fr-FR') : '–' }

watch(() => form.montant, () => {
  ajusterAffectationsAuPaiement()
})

watch(() => form.client_id, () => {
  loadFacturesImpayees()
})

async function handleSubmit() {
  if (form.client_id === null) { toast.error('Sélectionnez un client'); return }
  if (form.montant <= 0) { toast.error('Le montant doit être > 0'); return }

  saving.value = true
  errors.value = {}

  try {
    const factures = Object.entries(affectations)
      .filter(([_, montant]) => montant > 0)
      .map(([factureId, montant]) => ({
        facture_id: parseInt(factureId),
        montant_affecte: parseFloat(montant),
      }))

    if (!factures.length) {
      toast.error('Sélectionnez au moins une facture à payer')
      return
    }

    if (totalAffecte.value - form.montant > 0.01) {
      toast.error('Le total affecté ne peut pas dépasser le montant du paiement')
      return
    }

    const payload = {
      ...form,
      reference_paiement: form.reference_paiement || null,
      notes: form.notes || null,
      factures,
    }

    const { data } = await api.post('/paiements', payload)
    toast.success(`Paiement ${data.reference} enregistré`)
    emit('saved', data)
  } catch (err) {
    if (err.response.status === 422) {
      errors.value = validationErrors(err)
      toast.error(errorMessagesFromResponse(err, errorLabels))
    } else {
      toast.error(err.response.data.message || 'Erreur')
    }
  } finally {
    saving.value = false
  }
}
</script>
