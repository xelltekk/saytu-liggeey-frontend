<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <FormErrorSummary :errors="errors" :messages="errorMessages" :labels="errorLabels" />

    <!-- En-tête -->
    <fieldset class="border border-gray-200 rounded-lg p-4">
      <legend class="px-2 text-sm font-semibold text-gray-700">Informations générales</legend>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Client <span class="text-red-500">*</span>
          </label>
          <ClientSearchSelect v-model="form.client_id" :clients="clients" required placeholder="Rechercher par nom, code, telephone..." />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <select v-model="form.type" class="input">
            <option value="standard">Facture standard</option>
            <option value="avoir">Avoir</option>
            <option value="acompte">Acompte</option>
            <option value="proforma">Proforma</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Statut</label>
          <select v-model="form.statut" class="input">
            <option value="brouillon">Brouillon</option>
            <option value="validee">Validée</option>
            <option value="envoyee">Envoyée</option>
            <option value="annulee">Annulée</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Délai paiement (jours)</label>
          <input v-model.number="form.delai_paiement_jours" type="number" class="input" min="0" @change="updateEcheance" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Date facture <span class="text-red-500">*</span>
          </label>
          <input v-model="form.date_facture" type="date" class="input" required @change="updateEcheance" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Date d'échéance <span class="text-red-500">*</span>
          </label>
          <input v-model="form.date_echeance" type="date" class="input" required />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Référence client</label>
          <input v-model="form.reference_client" type="text" class="input" placeholder="N° commande, BC..." />
        </div>

        <div class="md:col-span-2">
          <label class="block text-sm font-medium text-gray-700 mb-1">Objet</label>
          <input v-model="form.objet" type="text" class="input" />
        </div>
      </div>
    </fieldset>

    <!-- Lignes -->
    <fieldset class="border border-gray-200 rounded-lg p-4">
      <legend class="px-2 text-sm font-semibold text-gray-700">
        Lignes ({{ form.lignes.length }})
      </legend>

      <div class="space-y-2.5">
        <div v-for="(ligne, index) in form.lignes" :key="ligne._key" class="document-line-card">
          <div class="document-line-header">
            <span class="rounded-full px-2.5 py-1 text-xs font-bold" style="background: color-mix(in srgb, var(--saytu-primary) 10%, var(--saytu-surface)); color: var(--saytu-primary);">
              Ligne {{ index + 1 }}
            </span>
            <div class="flex items-center gap-1">
              <button
                type="button"
                class="document-line-toggle-button"
                title="Afficher ou masquer la description complémentaire"
                @click="toggleDescription(ligne)"
              >
                {{ ligne._descriptionOpen ? 'Masquer desc.' : (ligne.description ? 'Voir desc.' : '+ Desc.') }}
              </button>
              <button type="button" class="document-line-order-button" :disabled="index === 0 || form.lignes.length < 2" title="Monter la ligne" @click="deplacerLigne(index, -1)">↑ Monter</button>
              <button type="button" class="document-line-order-button" :disabled="index === form.lignes.length - 1 || form.lignes.length < 2" title="Descendre la ligne" @click="deplacerLigne(index, 1)">↓ Descendre</button>
              <button type="button" @click="supprimerLigne(index)" class="document-line-delete-button" title="Supprimer">🗑️</button>
            </div>
          </div>

          <div class="grid grid-cols-1 gap-2 lg:grid-cols-[minmax(260px,1fr)_88px_120px_88px_88px_120px]">
            <label class="block">
              <span class="document-line-label">Désignation</span>
              <ProductDesignationSearch
                v-model="ligne.designation"
                :products="produits"
                placeholder="Désignation"
                required
                @select="(produit) => appliquerProduit(index, produit)"
              />
            </label>
            <label class="block">
              <span class="document-line-label">Quantité</span>
              <input v-model.number="ligne.quantite" type="number" step="0.001" min="0.001" class="input text-sm text-right" placeholder="Qté" required />
            </label>
            <label class="block">
              <span class="document-line-label">Prix unitaire HT</span>
              <input v-model.number="ligne.prix_unitaire_ht" type="number" step="0.01" min="0" class="input text-sm text-right" placeholder="P.U." required />
            </label>
            <label class="block">
              <span class="document-line-label">Remise %</span>
              <input v-model.number="ligne.remise_pourcent" type="number" step="0.01" min="0" max="100" class="input text-sm text-right" placeholder="Rem.%" />
            </label>
            <label class="block">
              <span class="document-line-label">TVA %</span>
              <input v-model.number="ligne.taux_tva" type="number" step="0.01" min="0" max="100" class="input text-sm text-right" placeholder="TVA%" />
            </label>
            <div>
              <span class="document-line-label">Total HT</span>
              <div class="document-line-total">{{ formatPrice(calculerLigne(ligne)) }}</div>
            </div>
          </div>

          <label v-if="ligne._descriptionOpen" class="document-line-description block">
            <span class="document-line-label">Description complémentaire</span>
            <textarea v-model="ligne.description" class="input document-line-description-input text-xs" rows="1" placeholder="Optionnel"></textarea>
          </label>
        </div>

        <button type="button" @click="ajouterLigne" class="btn-secondary w-full justify-center text-sm">
          + Ajouter une ligne
        </button>
      </div>
    </fieldset>

    <!-- Totaux -->
    <fieldset class="border border-gray-200 rounded-lg p-4 bg-xelltekk-50">
      <legend class="px-2 text-sm font-semibold text-gray-700">Totaux</legend>
      <div class="space-y-1 max-w-md ml-auto">
        <div class="flex justify-between text-sm">
          <span class="text-gray-600">Total HT</span>
          <span class="font-mono font-semibold">{{ formatPrice(totalHt) }}</span>
        </div>
        <div class="flex justify-between text-sm">
          <span class="text-gray-600">TVA</span>
          <span class="font-mono">{{ formatPrice(totalTva) }}</span>
        </div>
        <div class="flex justify-between text-base pt-2 border-t border-xelltekk-200 mt-2">
          <span class="font-bold text-xelltekk-900">Total TTC</span>
          <span class="font-mono font-bold text-xelltekk-700">{{ formatPrice(totalTtc) }}</span>
        </div>
      </div>
    </fieldset>

    <!-- Notes -->
    <fieldset class="border border-gray-200 rounded-lg p-4">
      <legend class="px-2 text-sm font-semibold text-gray-700">Notes</legend>
      <textarea v-model="form.notes_publiques" rows="2" class="input mb-2" placeholder="Notes publiques (apparaissent sur le PDF)"></textarea>
      <textarea v-model="form.notes_privees" rows="2" class="input" placeholder="Notes privées (internes)"></textarea>
    </fieldset>

    <div class="flex justify-end gap-2 pt-2 border-t border-gray-200">
      <button type="button" @click="$emit('cancel')" class="btn-secondary">Annuler</button>
      <button type="submit" :disabled="saving || form.lignes.length === 0" class="btn-primary">
        <span v-if="saving">Enregistrement...</span>
        <span v-else>{{ facture ? 'Modifier' : 'Créer la facture' }}</span>
      </button>
    </div>
  </form>
</template>

<script setup>
import { reactive, ref, computed, watch, onMounted, nextTick } from 'vue'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'
import FormErrorSummary from '@/components/FormErrorSummary.vue'
import ClientSearchSelect from '@/components/ClientSearchSelect.vue'
import ProductDesignationSearch from '@/components/ProductDesignationSearch.vue'
import { errorMessagesFromResponse, validationErrors } from '@/utils/formErrors'

const props = defineProps({
  facture: { type: Object, default: null },
  client: { type: Object, default: null },
})
const emit = defineEmits(['saved', 'cancel', 'dirty-change'])
const toast = useToast()

const defaultForm = () => ({
  client_id: null,
  type: 'standard',
  statut: 'brouillon',
  date_facture: new Date().toISOString().slice(0, 10),
  date_echeance: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
  reference_client: '',
  objet: '',
  delai_paiement_jours: 30,
  remise_globale_pourcent: 0,
  notes_publiques: '',
  notes_privees: '',
  lignes: [],
})

const form = reactive(defaultForm())
const saving = ref(false)
const errors = ref({})
const errorMessages = ref([])
const initialSnapshot = ref('')
const hydrating = ref(false)
const errorLabels = {
  facture: 'Facture',
  client_id: 'Client',
  date_facture: 'Date facture',
  date_echeance: "Date d'échéance",
  delai_paiement_jours: 'Délai paiement',
  lignes: 'Ligne',
  designation: 'Désignation',
  quantite: 'Quantité',
  prix_unitaire_ht: 'Prix unitaire HT',
  taux_tva: 'TVA',
}
const clients = ref([])
const produits = ref([])
let lineKey = 0

const totalHt = computed(() => form.lignes.reduce((s, l) => s + calculerLigne(l), 0))
const totalTva = computed(() => form.lignes.reduce((s, l) => s + calculerLigne(l) * ((l.taux_tva || 0) / 100), 0))
const totalTtc = computed(() => totalHt.value + totalTva.value)

function calculerLigne(ligne) {
  const brut = (ligne.quantite || 0) * (ligne.prix_unitaire_ht || 0)
  return Math.round(brut * (1 - (ligne.remise_pourcent || 0) / 100))
}

function ajouterLigne() {
  form.lignes.push(withLineKey({
    produit_id: null, designation: '', description: '', quantite: 1, unite: 'pièce',
    prix_unitaire_ht: 0, remise_pourcent: 0, taux_tva: 18, type_ligne: 'produit',
  }))
}

function supprimerLigne(i) { form.lignes.splice(i, 1) }

function deplacerLigne(index, direction) {
  const target = index + direction
  if (target < 0 || target >= form.lignes.length) return
  const [ligne] = form.lignes.splice(index, 1)
  form.lignes.splice(target, 0, ligne)
}

function toggleDescription(ligne) {
  ligne._descriptionOpen = !ligne._descriptionOpen
}

function withLineKey(ligne = {}) {
  const hasDescriptionState = typeof ligne._descriptionOpen === 'boolean'
  const hasDescription = Boolean(String(ligne.description || '').trim())

  return {
    ...ligne,
    _key: ligne._key || `facture-line-${++lineKey}`,
    _descriptionOpen: hasDescriptionState ? ligne._descriptionOpen : hasDescription,
  }
}

function cleanLineForSubmit(ligne) {
  const { _key, _descriptionOpen, ...payload } = ligne
  return payload
}

function appliquerProduit(index, produit) {
  if (!produit || !form.lignes[index]) return
  if (!produits.value.some(p => Number(p.id) === Number(produit.id))) {
    produits.value.push(produit)
  }

  const ligne = form.lignes[index]
  ligne.produit_id = produit.id
  ligne.designation = produit.libelle
  ligne.description = produit.description || ''
  ligne._descriptionOpen = Boolean(String(ligne.description || '').trim())
  ligne.prix_unitaire_ht = parseFloat(produit.prix_vente_ht || 0)
  ligne.taux_tva = parseFloat(produit.taux_tva || 0)
  ligne.unite = produit.unite || 'pièce'
  ligne.type_ligne = produit.type === 'service' ? 'service' : 'produit'
}

function produitLabel(produitId) {
  const produit = produits.value.find(p => Number(p.id) === Number(produitId))
  if (!produit) return `#${produitId}`
  return `${produit.reference || 'REF'} — ${produit.libelle}`
}

function updateEcheance() {
  if (form.date_facture && form.delai_paiement_jours >= 0) {
    const d = new Date(form.date_facture)
    d.setDate(d.getDate() + parseInt(form.delai_paiement_jours))
    form.date_echeance = d.toISOString().slice(0, 10)
  }
}

function formatPrice(n) { return new Intl.NumberFormat('fr-FR').format(Math.round(n || 0)) }

function formSnapshot() {
  return JSON.stringify({
    ...form,
    lignes: form.lignes.map(cleanLineForSubmit),
  })
}

function markClean() {
  initialSnapshot.value = formSnapshot()
  emit('dirty-change', false)
}

function hasUnsavedChanges() {
  return Boolean(initialSnapshot.value) && formSnapshot() !== initialSnapshot.value
}

watch(form, () => {
  if (!hydrating.value) {
    emit('dirty-change', hasUnsavedChanges())
  }
}, { deep: true })

watch(() => props.facture, async (val) => {
  hydrating.value = true
  if (val) {
    Object.assign(form, defaultForm(), { ...val, lignes: val.lignes.map(l => withLineKey({ ...l })) || [] })
  } else {
    Object.assign(form, defaultForm())
    if (props.client?.id) {
      form.client_id = Number(props.client.id)
    }
    ajouterLigne()
  }
  errors.value = {}
  errorMessages.value = []
  await nextTick()
  markClean()
  hydrating.value = false
}, { immediate: true })

onMounted(async () => {
  try {
    const [respC, respP] = await Promise.all([
      api.get('/clients', { params: { per_page: 200 } }),
      api.get('/produits', { params: { per_page: 200, actifs_seulement: 1 } }),
    ])
    clients.value = respC.data.data
    produits.value = respP.data.data
  } catch (e) {
    toast.error('Erreur de chargement')
  }
})

async function handleSubmit() {
  if (form.lignes.length === 0) { toast.error('Ajoutez au moins une ligne'); return }
  saving.value = true
  errors.value = {}
  errorMessages.value = []
  try {
    const payload = {
      ...form,
      lignes: form.lignes.map(cleanLineForSubmit),
    }
    Object.keys(payload).forEach(k => { if (payload[k] === '') payload[k] = null })
    let response
    if (props.facture?.id) {
      response = await api.put(`/factures/${props.facture.id}`, payload)
      toast.success(`Facture ${response.data.numero} mise à jour`)
    } else {
      response = await api.post('/factures', payload)
      toast.success(`Facture ${response.data.numero} créée`)
    }
    markClean()
    emit('saved', response.data)
  } catch (err) {
    if (err.response.status === 422) {
      errors.value = validationErrors(err)
      const messages = errorMessagesFromResponse(err, errorLabels)
      if (!Object.keys(errors.value).length) {
        errorMessages.value = messages
      }
      toast.error(messages)
    } else {
      errorMessages.value = errorMessagesFromResponse(err, errorLabels, 'Erreur lors de l\'enregistrement')
      toast.error(errorMessages.value)
    }
  } finally {
    saving.value = false
  }
}
</script>
