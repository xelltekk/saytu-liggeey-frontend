<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <fieldset class="border border-gray-200 rounded-lg p-4">
      <legend class="px-2 text-sm font-semibold text-gray-700">Paiement</legend>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Client <span class="text-red-500">*</span></label>
          <select v-model.number="form.client_id" @change="loadFacturesImpayees" class="input" required>
            <option :value="null">— Sélectionnez un client —</option>
            <option v-for="c in clients" :key="c.id" :value="c.id">{{ c.code }} — {{ c.nom }}</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Date <span class="text-red-500">*</span></label>
          <input v-model="form.date_paiement" type="date" class="input" required />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Montant (XOF) <span class="text-red-500">*</span></label>
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
              <input v-model.number="affectations[f.id]" type="number" step="0.01" min="0" :max="f.reste_a_payer" class="input text-sm text-right" />
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

    <div v-if="Object.keys(errors).length" class="bg-red-50 border border-red-200 rounded-lg p-3">
      <ul class="text-xs text-red-700 list-disc list-inside space-y-1">
        <li v-for="(msgs, f) in errors" :key="f"><strong>{{ f }}:</strong> {{ msgs[0] }}</li>
      </ul>
    </div>

    <div class="flex justify-end gap-2 pt-2 border-t border-gray-200">
      <button type="button" @click="$emit('cancel')" class="btn-secondary">Annuler</button>
      <button type="submit" :disabled="saving" class="btn-primary">
        <span v-if="saving">Enregistrement...</span><span v-else>Enregistrer le paiement</span>
      </button>
    </div>
  </form>
</template>

<script setup>
import { reactive, ref, computed, onMounted, watch } from 'vue'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'

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

const clients = ref([])
const facturesImpayees = ref([])
const affectations = reactive({}) // { facture_id: montant }
const loadingFactures = ref(false)
const saving = ref(false)
const errors = ref({})

const totalAffecte = computed(() => Object.values(affectations).reduce((s, v) => s + (parseFloat(v) || 0), 0))
const resteAffectation = computed(() => (form.montant || 0) - totalAffecte.value)

async function loadFacturesImpayees() {
  if (!form.client_id) return
  Object.keys(affectations).forEach(k => delete affectations[k])
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
    // Par défaut, affecter le minimum entre le reste à payer et le reste du paiement à affecter
    const restePaiement = resteAffectation.value
    affectations[facture.id] = Math.min(parseFloat(facture.reste_a_payer), Math.max(restePaiement, parseFloat(facture.reste_a_payer)))
  }
}

function formatPrice(n) { return new Intl.NumberFormat('fr-FR').format(Math.round(n || 0)) }
function formatDate(d) { return d ? new Date(d).toLocaleDateString('fr-FR') : '–' }

onMounted(async () => {
  const { data } = await api.get('/clients', { params: { per_page: 200 } })
  clients.value = data.data
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
    if (err.response?.status === 422) {
      errors.value = err.response.data.errors || {}
      toast.error('Veuillez corriger les erreurs')
    } else {
      toast.error(err.response?.data?.message || 'Erreur')
    }
  } finally {
    saving.value = false
  }
}
</script>