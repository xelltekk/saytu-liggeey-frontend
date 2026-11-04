<template>
  <form ref="formElement" novalidate @input="clearEditedError" @change="clearEditedError" @submit.prevent="handleSubmit" class="space-y-4">
    <FormErrorSummary :errors="errors" :messages="errorMessages" :labels="errorLabels" :title="Object.keys(errors).length ? 'Champs à corriger' : 'Enregistrement non confirmé'" :subtitle="Object.keys(errors).length ? 'Corrigez les champs indiqués. Vos saisies sont conservées.' : 'Vos saisies sont conservées dans ce formulaire.'" />

    <!-- En-tête : client + dates -->
    <fieldset class="border border-gray-200 rounded-lg p-4">
      <legend class="px-2 text-sm font-semibold text-gray-700">Informations générales</legend>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Client <span class="text-red-500">*</span>
          </label>
          <ClientSearchSelect :data-validation-field="'client_id'" :aria-invalid="Boolean(errors['client_id'])" v-model="form.client_id" :clients="clients" required placeholder="Rechercher par nom, code, telephone..." />
              <FieldError :messages="errors['client_id']" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Statut</label>
          <select :data-validation-field="'statut'" :aria-invalid="Boolean(errors['statut'])" v-model="form.statut" class="input">
            <option value="brouillon">Brouillon</option>
            <option value="envoye">Envoyé</option>
            <option value="accepte">Accepté</option>
            <option value="refuse">Refusé</option>
            <option value="expire">Expiré</option>
          </select>
              <FieldError :messages="errors['statut']" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Date du devis <span class="text-red-500">*</span>
          </label>
          <input :data-validation-field="'date_devis'" :aria-invalid="Boolean(errors['date_devis'])" v-model="form.date_devis" type="date" class="input" required />
              <FieldError :messages="errors['date_devis']" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Date de validité <span class="text-red-500">*</span>
          </label>
          <input :data-validation-field="'date_validite'" :aria-invalid="Boolean(errors['date_validite'])" v-model="form.date_validite" type="date" class="input" required />
              <FieldError :messages="errors['date_validite']" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Référence client</label>
          <input :data-validation-field="'reference_client'" :aria-invalid="Boolean(errors['reference_client'])" v-model="form.reference_client" type="text" class="input" placeholder="N° commande, BC..." />
              <FieldError :messages="errors['reference_client']" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Délai paiement (jours)</label>
          <input :data-validation-field="'delai_paiement_jours'" :aria-invalid="Boolean(errors['delai_paiement_jours'])" v-model.number="form.delai_paiement_jours" type="number" class="input" min="0" />
              <FieldError :messages="errors['delai_paiement_jours']" />
        </div>

        <div class="md:col-span-2">
          <label class="block text-sm font-medium text-gray-700 mb-1">Objet du devis</label>
          <input :data-validation-field="'objet'" :aria-invalid="Boolean(errors['objet'])" v-model="form.objet" type="text" class="input" placeholder="Ex: Fourniture de matériel informatique" />
              <FieldError :messages="errors['objet']" />
        </div>

        <div class="md:col-span-2">
          <div class="mb-1 flex items-center justify-between gap-2">
            <label class="block text-sm font-medium text-gray-700">Conditions et modalités de paiement</label>
            <button
              v-if="paymentModalities"
              type="button"
              class="text-xs font-semibold text-[color:var(--saytu-primary)] hover:underline"
              @click="reprendreModalitesEntreprise"
            >
              Reprendre les modalités entreprise
            </button>
          </div>
          <div class="mb-2">
            <span class="document-line-label">Conditions rapides</span>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="condition in paymentConditionPresets"
                :key="condition.label"
                type="button"
                class="payment-condition-button"
                @click="appliquerConditionPaiement(condition.texte)"
              >
                {{ condition.label }}
              </button>
            </div>
          </div>
          <textarea :data-validation-field="'conditions_paiement'" :aria-invalid="Boolean(errors['conditions_paiement'])"
            v-model="form.conditions_paiement"
            rows="2"
            class="input text-sm"
            placeholder="Ex: Paiement 50 % à la commande, 50 % à la livraison..."
          ></textarea>
              <FieldError :messages="errors['conditions_paiement']" />
          <p class="mt-1 text-xs text-gray-500">
            Ce texte apparaît sur le PDF du devis dans les conditions de règlement.
          </p>
        </div>
      </div>
    </fieldset>

    <!-- Lignes de devis -->
    <fieldset class="border border-gray-200 rounded-lg p-4">
      <legend class="px-2 text-sm font-semibold text-gray-700">
        Lignes de devis ({{ form.lignes.length }})
      </legend>

      <div class="space-y-2.5">
        <div
          v-for="(ligne, index) in form.lignes"
          :key="ligne._key"
          class="document-line-card"
        >
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
              <button
                type="button"
                class="document-line-order-button"
                :disabled="index === 0 || form.lignes.length < 2"
                title="Monter la ligne"
                @click="deplacerLigne(index, -1)"
              >
                ↑ Monter
              </button>
              <button
                type="button"
                class="document-line-order-button"
                :disabled="index === form.lignes.length - 1 || form.lignes.length < 2"
                title="Descendre la ligne"
                @click="deplacerLigne(index, 1)"
              >
                ↓ Descendre
              </button>
              <button
                type="button"
                @click="supprimerLigne(index)"
                class="document-line-delete-button"
                title="Supprimer cette ligne"
              >
                🗑️
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 gap-2 lg:grid-cols-[minmax(260px,1fr)_88px_120px_88px_88px_120px]">
            <div class="block">
              <span class="document-line-label">Désignation</span>
              <RichDesignationEditor :data-validation-field="`lignes.${index}.designation`" :aria-invalid="Boolean(errors[`lignes.${index}.designation`])"
                v-model="ligne.designation"
                v-model:html="ligne.designation_html"
                :products="produits"
                placeholder="Désignation"
                required
                @select="(produit) => appliquerProduit(index, produit)"
              />
              <FieldError :messages="errors[`lignes.${index}.designation`]" />
            </div>

            <label class="block">
              <span class="document-line-label">Quantité</span>
              <input :data-validation-field="`lignes.${index}.quantite`" :aria-invalid="Boolean(errors[`lignes.${index}.quantite`])"
                v-model.number="ligne.quantite"
                type="number"
                step="0.001"
                min="0.001"
                class="input text-sm text-right"
                placeholder="Qté"
                required
              />
              <FieldError :messages="errors[`lignes.${index}.quantite`]" />
            </label>

            <label class="block">
              <span class="document-line-label">Prix unitaire HT</span>
              <input :data-validation-field="`lignes.${index}.prix_unitaire_ht`" :aria-invalid="Boolean(errors[`lignes.${index}.prix_unitaire_ht`])"
                v-model.number="ligne.prix_unitaire_ht"
                type="number"
                step="0.01"
                min="0"
                class="input text-sm text-right"
                placeholder="P.U. HT"
                required
              />
              <FieldError :messages="errors[`lignes.${index}.prix_unitaire_ht`]" />
            </label>

            <label class="block">
              <span class="document-line-label">Remise %</span>
              <input :data-validation-field="`lignes.${index}.remise_pourcent`" :aria-invalid="Boolean(errors[`lignes.${index}.remise_pourcent`])"
                v-model.number="ligne.remise_pourcent"
                type="number"
                step="0.01"
                min="0"
                max="100"
                class="input text-sm text-right"
                placeholder="Rem.%"
              />
              <FieldError :messages="errors[`lignes.${index}.remise_pourcent`]" />
            </label>

            <label class="block">
              <span class="document-line-label">TVA %</span>
              <TaxRateSelect :data-validation-field="`lignes.${index}.taux_tva`" :aria-invalid="Boolean(errors[`lignes.${index}.taux_tva`])" v-model="ligne.taux_tva" class="input text-sm text-right" />
              <FieldError :messages="errors[`lignes.${index}.taux_tva`]" />
            </label>

            <div>
              <span class="document-line-label">Total HT</span>
              <div class="document-line-total">{{ formatPrice(calculerLigne(ligne)) }}</div>
            </div>
          </div>

          <label v-if="ligne._descriptionOpen" class="document-line-description block">
            <span class="document-line-label">Description complémentaire</span>
            <textarea :data-validation-field="`lignes.${index}.description`" :aria-invalid="Boolean(errors[`lignes.${index}.description`])"
              v-model="ligne.description"
              class="input document-line-description-input text-xs"
              rows="1"
              placeholder="Optionnel"
            ></textarea>
              <FieldError :messages="errors[`lignes.${index}.description`]" />
          </label>
        </div>

        <button
          type="button"
          @click="ajouterLigne"
          class="btn-secondary w-full justify-center text-sm"
        >
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

      <div class="space-y-3">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Notes publiques (apparaissent sur le PDF)</label>
          <textarea :data-validation-field="'notes_publiques'" :aria-invalid="Boolean(errors['notes_publiques'])" v-model="form.notes_publiques" rows="2" class="input"></textarea>
              <FieldError :messages="errors['notes_publiques']" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Notes privées (internes)</label>
          <textarea :data-validation-field="'notes_privees'" :aria-invalid="Boolean(errors['notes_privees'])" v-model="form.notes_privees" rows="2" class="input"></textarea>
              <FieldError :messages="errors['notes_privees']" />
        </div>
      </div>
    </fieldset>

    <!-- Actions -->
    <div class="flex justify-end gap-2 pt-2 border-t border-gray-200">
      <button type="button" @click="$emit('cancel')" class="btn-secondary">Annuler</button>
      <button type="submit" :disabled="saving || form.lignes.length === 0" class="btn-primary">
        <span v-if="saving">Enregistrement...</span>
        <span v-else>{{ devis ? 'Modifier le devis' : 'Créer le devis' }}</span>
      </button>
    </div>
  </form>
</template>

<script setup>
import FieldError from './FieldError.vue'
import { validateCommercialDocument, validateCommercialProduct, focusInvalidField } from '@/utils/commercialValidation.mjs'
import TaxRateSelect from './TaxRateSelect.vue'
import { reactive, ref, computed, watch, onMounted, nextTick } from 'vue'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'
import FormErrorSummary from '@/components/FormErrorSummary.vue'
import ClientSearchSelect from '@/components/ClientSearchSelect.vue'
import RichDesignationEditor from '@/components/RichDesignationEditor.vue'
import { errorMessagesFromResponse, validationErrors } from '@/utils/formErrors'

const props = defineProps({
  devis: { type: Object, default: null },
  client: { type: Object, default: null },
})

const emit = defineEmits(['saved', 'cancel', 'dirty-change'])
const toast = useToast()

const defaultForm = () => ({
  client_id: null,
  statut: 'brouillon',
  date_devis: new Date().toISOString().slice(0, 10),
  date_validite: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
  reference_client: '',
  objet: '',
  delai_paiement_jours: 30,
  conditions_paiement: '',
  notes_publiques: '',
  notes_privees: '',
  lignes: [],
})

const form = reactive(defaultForm())
const saving = ref(false)
const formElement = ref(null)
const errors = ref({})
const errorMessages = ref([])
const errorLabels = {
  client_id: 'Client',
  date_devis: 'Date du devis',
  date_validite: 'Date de validité',
  delai_paiement_jours: 'Délai paiement',
  conditions_paiement: 'Conditions et modalités de paiement',
  lignes: 'Ligne',
  designation: 'Désignation',
  quantite: 'Quantité',
  prix_unitaire_ht: 'Prix unitaire HT',
  taux_tva: 'TVA',
}
const clients = ref([])
const produits = ref([])
const paymentModalities = ref('')
let lineKey = 0
const paymentConditionPresets = [
  { label: 'À la réception', texte: 'Paiement à la réception.' },
  { label: '50/50', texte: 'Paiement 50 % à la commande, 50 % à la livraison.' },
  { label: '30/70', texte: 'Paiement 30 % à la commande, 70 % à la livraison.' },
  { label: '40/60', texte: 'Paiement 40 % à la commande, 60 % à la livraison.' },
  { label: '100 % commande', texte: 'Paiement 100 % à la commande.' },
  { label: 'À 30 jours', texte: 'Paiement à 30 jours date de facture.' },
]
const initialSnapshot = ref('')
const hydrating = ref(false)

const totalHt = computed(() => {
  return form.lignes.reduce((s, l) => s + calculerLigne(l), 0)
})

const totalTva = computed(() => {
  return form.lignes.reduce((s, l) => {
    const ht = calculerLigne(l)
    return s + ht * ((l.taux_tva || 0) / 100)
  }, 0)
})

const totalTtc = computed(() => totalHt.value + totalTva.value)

function calculerLigne(ligne) {
  const brut = (ligne.quantite || 0) * (ligne.prix_unitaire_ht || 0)
  const remise = brut * ((ligne.remise_pourcent || 0) / 100)
  return Math.round(brut - remise)
}

function ajouterLigne() {
  form.lignes.push(withLineKey({
    produit_id: null,
    designation: '',
    description: '',
    quantite: 1,
    unite: 'pièce',
    prix_unitaire_ht: 0,
    remise_pourcent: 0,
    taux_tva: 18,
    type_ligne: 'produit',
  }))
}

function supprimerLigne(index) {
  form.lignes.splice(index, 1)
}

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
    _key: ligne._key || `devis-line-${++lineKey}`,
    _descriptionOpen: hasDescriptionState ? ligne._descriptionOpen : hasDescription,
  }
}

function cleanLineForSubmit(ligne) {
  const { _key, _descriptionOpen, ...payload } = ligne
  return payload
}

function dateForInput(value, fallback = '') {
  if (!value) return fallback

  if (typeof value === 'string') {
    const match = value.match(/^(\d{4}-\d{2}-\d{2})/)
    if (match) return match[1]
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? fallback : date.toISOString().slice(0, 10)
}

function devisForForm(devis) {
  const defaults = defaultForm()
  return {
    ...devis,
    date_devis: dateForInput(devis?.date_devis, defaults.date_devis),
    date_validite: dateForInput(devis?.date_validite, defaults.date_validite),
    lignes: (devis?.lignes || []).map(l => withLineKey({ ...l })),
  }
}

function conditionsPaiementTexte(condition = '') {
  const parts = []
  const conditionTexte = String(condition || '').trim()
  const modalitesTexte = String(paymentModalities.value || '').trim()

  if (conditionTexte) {
    parts.push(conditionTexte)
  }

  if (modalitesTexte) {
    parts.push('Moyens de paiement :')
    parts.push(modalitesTexte)
  }

  return parts.join('\n')
}

function appliquerConditionPaiement(condition) {
  form.conditions_paiement = conditionsPaiementTexte(condition)
}

function reprendreModalitesEntreprise() {
  const modalitesTexte = String(paymentModalities.value || '').trim()
  if (!modalitesTexte) return

  const texteActuel = String(form.conditions_paiement || '').trim()
  if (!texteActuel) {
    form.conditions_paiement = modalitesTexte
    return
  }

  if (texteActuel.includes(modalitesTexte)) return
  form.conditions_paiement = `${texteActuel}\nMoyens de paiement :\n${modalitesTexte}`
}

function appliquerProduit(index, produit) {
  if (!produit || !form.lignes[index]) return
  if (!produits.value.some(p => Number(p.id) === Number(produit.id))) {
    produits.value.push(produit)
  }

  const ligne = form.lignes[index]
  ligne.produit_id = produit.id
  ligne.designation = produit.libelle
  ligne.designation_html = null
  ligne.description = produit.description || ''
  ligne._descriptionOpen = Boolean(String(ligne.description || '').trim())
  ligne.prix_unitaire_ht = parseFloat(produit.prix_vente_ht || 0)
  ligne.taux_tva = parseFloat(produit.taux_tva === '' || produit.taux_tva == null ? 18 : produit.taux_tva)
  ligne.unite = produit.unite || 'pièce'
  ligne.type_ligne = produit.type === 'service' ? 'service' : 'produit'
}

function produitLabel(produitId) {
  const produit = produits.value.find(p => Number(p.id) === Number(produitId))
  if (!produit) return `#${produitId}`
  return `${produit.reference || 'REF'} — ${produit.libelle}`
}

function formatPrice(n) {
  return new Intl.NumberFormat('fr-FR').format(Math.round(n || 0))
}

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

watch(() => props.devis, async (val) => {
  hydrating.value = true
  if (val) {
    Object.assign(form, defaultForm(), {
      ...devisForForm(val),
    })
  } else {
    Object.assign(form, defaultForm())
    if (props.client?.id) {
      form.client_id = Number(props.client.id)
    }
    form.conditions_paiement = conditionsPaiementTexte(paymentConditionPresets[0].texte)
    ajouterLigne() // Une ligne par défaut
  }
  errors.value = {}
  errorMessages.value = []
  await nextTick()
  markClean()
  hydrating.value = false
}, { immediate: true })

onMounted(async () => {
  try {
    const [respClients, respProduits, respModalites] = await Promise.all([
      api.get('/clients', { params: { per_page: 100 } }),
      api.get('/produits', { params: { per_page: 100, actifs_seulement: 1 } }),
      api.get('/societe/modalites-paiement').catch(() => ({ data: { texte: '' } })),
    ])
    clients.value = respClients.data.data
    produits.value = respProduits.data.data
    paymentModalities.value = respModalites.data?.texte || ''
    if (!props.devis?.id && paymentModalities.value && (!form.conditions_paiement || form.conditions_paiement === paymentConditionPresets[0].texte)) {
      form.conditions_paiement = conditionsPaiementTexte(paymentConditionPresets[0].texte)
      await nextTick()
      markClean()
    }
  } catch (e) {
    toast.error('Erreur de chargement des données')
  }
})

function clearEditedError(event) {
  const field = event.target.closest('[data-validation-field]')?.dataset.validationField
  if (field && errors.value[field]) delete errors.value[field]
}

async function handleSubmit() {
  if (saving.value) return
  errors.value = validateCommercialDocument(form, 'devis')
  errorMessages.value = []
  if (Object.keys(errors.value).length) {
    await nextTick()
    focusInvalidField(formElement.value, errors.value)
    return
  }
  saving.value = true
  try {
    const payload = {
      ...form,
      date_devis: form.date_devis || dateForInput(props.devis?.date_devis),
      date_validite: form.date_validite || dateForInput(props.devis?.date_validite),
      lignes: form.lignes.map(cleanLineForSubmit),
    }
    Object.keys(payload).forEach(k => {
      if (payload[k] === '') payload[k] = null
    })

    let response
    if (props.devis?.id) {
      response = await api.put(`/devis/${props.devis.id}`, payload)
      toast.success(`Devis ${response.data.numero} mis à jour`)
    } else {
      response = await api.post('/devis', payload)
      toast.success(`Devis ${response.data.numero} créé`)
    }
    markClean()
    emit('saved', response.data)
  } catch (err) {
    errors.value = validationErrors(err)
    const messages = errorMessagesFromResponse(err, errorLabels)
    if (!Object.keys(errors.value).length) errorMessages.value = messages
    toast.error(messages)
    await nextTick()
    focusInvalidField(formElement.value, errors.value)
  } finally {
    saving.value = false
  }
}
</script>
