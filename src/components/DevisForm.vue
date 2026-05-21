<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">

    <!-- En-tête : client + dates -->
    <fieldset class="border border-gray-200 rounded-lg p-4">
      <legend class="px-2 text-sm font-semibold text-gray-700">Informations générales</legend>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Client <span class="text-red-500">*</span>
          </label>
          <select v-model.number="form.client_id" class="input" required>
            <option :value="null">— Sélectionnez un client —</option>
            <option v-for="c in clients" :key="c.id" :value="c.id">
              {{ c.code }} — {{ c.nom }}
            </option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Statut</label>
          <select v-model="form.statut" class="input">
            <option value="brouillon">Brouillon</option>
            <option value="envoye">Envoyé</option>
            <option value="accepte">Accepté</option>
            <option value="refuse">Refusé</option>
            <option value="expire">Expiré</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Date du devis <span class="text-red-500">*</span>
          </label>
          <input v-model="form.date_devis" type="date" class="input" required />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Date de validité <span class="text-red-500">*</span>
          </label>
          <input v-model="form.date_validite" type="date" class="input" required />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Référence client</label>
          <input v-model="form.reference_client" type="text" class="input" placeholder="N° commande, BC..." />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Délai paiement (jours)</label>
          <input v-model.number="form.delai_paiement_jours" type="number" class="input" min="0" />
        </div>

        <div class="md:col-span-2">
          <label class="block text-sm font-medium text-gray-700 mb-1">Objet du devis</label>
          <input v-model="form.objet" type="text" class="input" placeholder="Ex: Fourniture de matériel informatique" />
        </div>
      </div>
    </fieldset>

    <!-- Lignes de devis -->
    <fieldset class="border border-gray-200 rounded-lg p-4">
      <legend class="px-2 text-sm font-semibold text-gray-700">
        Lignes de devis ({{ form.lignes.length }})
      </legend>

      <div class="space-y-3">
        <div
          v-for="(ligne, index) in form.lignes"
          :key="index"
          class="border border-gray-200 rounded-lg p-3 bg-gray-50"
        >
          <div class="flex items-start gap-2 mb-2">
            <span class="text-xs text-gray-500 mt-2 w-6">{{ index + 1 }}.</span>

            <!-- Sélection produit (optionnel) -->
            <select
              :value="ligne.produit_id"
              @change="(e) => onProduitChange(index, e.target.value)"
              class="input flex-1 text-sm"
            >
              <option :value="null">— Ligne libre (sans produit) —</option>
              <option v-for="p in produits" :key="p.id" :value="p.id">
                {{ p.reference }} — {{ p.libelle }} ({{ formatPrice(p.prix_vente_ht) }})
              </option>
            </select>

            <button
              type="button"
              @click="supprimerLigne(index)"
              class="text-red-600 hover:text-red-800 text-lg px-2"
              title="Supprimer cette ligne"
            >
              🗑️
            </button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-12 gap-2">
            <div class="md:col-span-5">
              <input
                v-model="ligne.designation"
                type="text"
                class="input text-sm"
                placeholder="Désignation"
                required
              />
            </div>

            <div class="md:col-span-1">
              <input
                v-model.number="ligne.quantite"
                type="number"
                step="0.001"
                min="0.001"
                class="input text-sm text-right"
                placeholder="Qté"
                required
              />
            </div>

            <div class="md:col-span-2">
              <input
                v-model.number="ligne.prix_unitaire_ht"
                type="number"
                step="0.01"
                min="0"
                class="input text-sm text-right"
                placeholder="P.U. HT"
                required
              />
            </div>

            <div class="md:col-span-1">
              <input
                v-model.number="ligne.remise_pourcent"
                type="number"
                step="0.01"
                min="0"
                max="100"
                class="input text-sm text-right"
                placeholder="Rem.%"
              />
            </div>

            <div class="md:col-span-1">
              <input
                v-model.number="ligne.taux_tva"
                type="number"
                step="0.01"
                min="0"
                max="100"
                class="input text-sm text-right"
                placeholder="TVA%"
              />
            </div>

            <div class="md:col-span-2 text-right pt-2 font-mono text-sm font-semibold text-xelltekk-700">
              {{ formatPrice(calculerLigne(ligne)) }}
            </div>
          </div>

          <textarea
            v-model="ligne.description"
            class="input text-xs mt-2"
            rows="1"
            placeholder="Description complémentaire (optionnel)"
          ></textarea>
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
          <span class="font-mono font-semibold">{{ formatPrice(totalHt) }} XOF</span>
        </div>
        <div class="flex justify-between text-sm">
          <span class="text-gray-600">TVA</span>
          <span class="font-mono">{{ formatPrice(totalTva) }} XOF</span>
        </div>
        <div class="flex justify-between text-base pt-2 border-t border-xelltekk-200 mt-2">
          <span class="font-bold text-xelltekk-900">Total TTC</span>
          <span class="font-mono font-bold text-xelltekk-700">{{ formatPrice(totalTtc) }} XOF</span>
        </div>
      </div>
    </fieldset>

    <!-- Notes -->
    <fieldset class="border border-gray-200 rounded-lg p-4">
      <legend class="px-2 text-sm font-semibold text-gray-700">Notes</legend>

      <div class="space-y-3">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Notes publiques (apparaissent sur le PDF)</label>
          <textarea v-model="form.notes_publiques" rows="2" class="input"></textarea>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Notes privées (internes)</label>
          <textarea v-model="form.notes_privees" rows="2" class="input"></textarea>
        </div>
      </div>
    </fieldset>

    <!-- Erreurs -->
    <div v-if="Object.keys(errors).length" class="bg-red-50 border border-red-200 rounded-lg p-3">
      <ul class="text-xs text-red-700 list-disc list-inside space-y-1">
        <li v-for="(messages, field) in errors" :key="field">
          <strong>{{ field }} :</strong> {{ messages[0] }}
        </li>
      </ul>
    </div>

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
import { reactive, ref, computed, watch, onMounted } from 'vue'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'

const props = defineProps({
  devis: { type: Object, default: null },
})

const emit = defineEmits(['saved', 'cancel'])
const toast = useToast()

const defaultForm = () => ({
  client_id: null,
  statut: 'brouillon',
  date_devis: new Date().toISOString().slice(0, 10),
  date_validite: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
  reference_client: '',
  objet: '',
  delai_paiement_jours: 30,
  notes_publiques: '',
  notes_privees: '',
  lignes: [],
})

const form = reactive(defaultForm())
const saving = ref(false)
const errors = ref({})
const clients = ref([])
const produits = ref([])

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
  form.lignes.push({
    produit_id: null,
    designation: '',
    description: '',
    quantite: 1,
    unite: 'pièce',
    prix_unitaire_ht: 0,
    remise_pourcent: 0,
    taux_tva: 18,
    type_ligne: 'produit',
  })
}

function supprimerLigne(index) {
  form.lignes.splice(index, 1)
}

function onProduitChange(index, produitId) {
  if (!produitId) {
    form.lignes[index].produit_id = null
    return
  }
  const produit = produits.value.find(p => p.id === parseInt(produitId))
  if (produit) {
    form.lignes[index].produit_id = produit.id
    form.lignes[index].designation = produit.libelle
    form.lignes[index].description = produit.description || ''
    form.lignes[index].prix_unitaire_ht = parseFloat(produit.prix_vente_ht)
    form.lignes[index].taux_tva = parseFloat(produit.taux_tva)
    form.lignes[index].unite = produit.unite || 'pièce'
    form.lignes[index].type_ligne = produit.type === 'service' ? 'service' : 'produit'
  }
}

function formatPrice(n) {
  return new Intl.NumberFormat('fr-FR').format(Math.round(n || 0))
}

watch(() => props.devis, (val) => {
  if (val) {
    Object.assign(form, defaultForm(), {
      ...val,
      lignes: val.lignes?.map(l => ({ ...l })) || [],
    })
  } else {
    Object.assign(form, defaultForm())
    ajouterLigne() // Une ligne par défaut
  }
  errors.value = {}
}, { immediate: true })

onMounted(async () => {
  try {
    const [respClients, respProduits] = await Promise.all([
      api.get('/clients', { params: { per_page: 100 } }),
      api.get('/produits', { params: { per_page: 100, actifs_seulement: 1 } }),
    ])
    clients.value = respClients.data.data
    produits.value = respProduits.data.data
  } catch (e) {
    toast.error('Erreur de chargement des données')
  }
})

async function handleSubmit() {
  if (form.lignes.length === 0) {
    toast.error('Ajoutez au moins une ligne au devis')
    return
  }

  saving.value = true
  errors.value = {}

  try {
    const payload = { ...form }
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
    emit('saved', response.data)
  } catch (err) {
    if (err.response?.status === 422) {
      errors.value = err.response.data.errors || {}
      toast.error('Veuillez corriger les erreurs')
    } else {
      toast.error(err.response?.data?.message || 'Erreur lors de l\'enregistrement')
    }
  } finally {
    saving.value = false
  }
}
</script>