<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <!-- Identification -->
    <fieldset class="border border-gray-200 rounded-lg p-4">
      <legend class="px-2 text-sm font-semibold text-gray-700">Identification</legend>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Référence
            <span class="text-xs text-gray-400 font-normal">(auto si vide : PR2605-00001)</span>
          </label>
          <input v-model="form.reference" type="text" class="input" placeholder="Auto-générée" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Code-barres</label>
          <input v-model="form.code_barre" type="text" class="input" placeholder="EAN13..." />
        </div>

        <div class="md:col-span-2">
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Libellé <span class="text-red-500">*</span>
          </label>
          <input v-model="form.libelle" type="text" class="input" required placeholder="Ex: PC Portable HP ProBook 450 G9" />
        </div>

        <div class="md:col-span-2">
          <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea v-model="form.description" rows="2" class="input"></textarea>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
          <select v-model="form.categorie_id" class="input">
            <option :value="null">— Aucune —</option>
            <option v-for="cat in categories" :key="cat.id" :value="cat.id">
              {{ cat.libelle }}
            </option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Type <span class="text-red-500">*</span>
          </label>
          <select v-model="form.type" class="input" required>
            <option value="produit">Produit</option>
            <option value="service">Service</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Nature</label>
          <select v-model="form.nature" class="input">
            <option value="neuf">Neuf</option>
            <option value="occasion">Occasion</option>
            <option value="reconditionne">Reconditionné</option>
            <option value="virtuel">Virtuel</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Marque</label>
          <input v-model="form.marque" type="text" class="input" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Modèle</label>
          <input v-model="form.modele" type="text" class="input" />
        </div>
      </div>
    </fieldset>

    <!-- Prix -->
    <fieldset class="border border-gray-200 rounded-lg p-4">
      <legend class="px-2 text-sm font-semibold text-gray-700">Prix (XOF)</legend>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Prix d'achat HT</label>
          <input v-model.number="form.prix_achat_ht" type="number" class="input" step="0.01" min="0" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Prix de vente HT <span class="text-red-500">*</span>
          </label>
          <input v-model.number="form.prix_vente_ht" type="number" class="input" step="0.01" min="0" required />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">TVA (%)</label>
          <input v-model.number="form.taux_tva" type="number" class="input" step="0.01" min="0" max="100" />
        </div>
      </div>

      <!-- Calcul automatique TTC + marge -->
      <div v-if="form.prix_vente_ht > 0" class="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-xelltekk-50 rounded-lg text-sm">
        <div>
          <span class="text-gray-600">Prix TTC :</span>
          <strong class="ml-2 text-xelltekk-800">{{ formatPrice(prixTtc) }} XOF</strong>
        </div>
        <div v-if="form.prix_achat_ht > 0">
          <span class="text-gray-600">Marge :</span>
          <strong class="ml-2" :class="margeColor">{{ margePourcentage }}%</strong>
        </div>
      </div>
    </fieldset>

    <!-- Stock -->
    <fieldset v-if="form.type === 'produit'" class="border border-gray-200 rounded-lg p-4">
      <legend class="px-2 text-sm font-semibold text-gray-700">Stock</legend>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="flex items-center pt-7">
          <input v-model="form.gere_stock" type="checkbox" id="gere_stock" class="mr-2 h-4 w-4" />
          <label for="gere_stock" class="text-sm">Gérer le stock</label>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Unité</label>
          <input v-model="form.unite" type="text" class="input" placeholder="pièce" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Stock d'alerte</label>
          <input v-model.number="form.stock_alerte" type="number" class="input" min="0" />
        </div>
      </div>

      <div class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="flex items-center">
          <input v-model="form.est_serialise" type="checkbox" id="est_serialise" class="mr-2 h-4 w-4" />
          <label for="est_serialise" class="text-sm">Produit sérialisé (numéro de série unique)</label>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Garantie (mois)</label>
          <input v-model.number="form.garantie_mois" type="number" class="input" min="0" placeholder="12" />
        </div>
      </div>
    </fieldset>

    <!-- État -->
    <fieldset class="border border-gray-200 rounded-lg p-4">
      <legend class="px-2 text-sm font-semibold text-gray-700">État</legend>

      <div class="flex items-center">
        <input v-model="form.is_active" type="checkbox" id="is_active" class="mr-2 h-4 w-4" />
        <label for="is_active" class="text-sm">Produit actif (visible dans les listes)</label>
      </div>
    </fieldset>

    <!-- Erreurs de validation -->
    <div v-if="Object.keys(errors).length" class="bg-red-50 border border-red-200 rounded-lg p-3">
      <p class="text-sm font-medium text-red-800 mb-2">Erreurs :</p>
      <ul class="text-xs text-red-700 list-disc list-inside space-y-1">
        <li v-for="(messages, field) in errors" :key="field">
          <strong>{{ field }} :</strong> {{ messages[0] }}
        </li>
      </ul>
    </div>

    <!-- Actions -->
    <div class="flex justify-end gap-2 pt-2 border-t border-gray-200">
      <button type="button" @click="$emit('cancel')" class="btn-secondary">Annuler</button>
      <button type="submit" :disabled="saving" class="btn-primary">
        <span v-if="saving">Enregistrement...</span>
        <span v-else>{{ produit ? 'Modifier' : 'Créer le produit' }}</span>
      </button>
    </div>
  </form>
</template>

<script setup>
import { reactive, ref, computed, watch, onMounted } from 'vue'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'

const props = defineProps({
  produit: { type: Object, default: null },
})

const emit = defineEmits(['saved', 'cancel'])
const toast = useToast()

const defaultForm = () => ({
  reference: '',
  code_barre: '',
  libelle: '',
  description: '',
  categorie_id: null,
  type: 'produit',
  nature: 'neuf',
  prix_achat_ht: 0,
  prix_vente_ht: 0,
  taux_tva: 18,
  gere_stock: true,
  stock_alerte: 0,
  unite: 'pièce',
  marque: '',
  modele: '',
  garantie_mois: null,
  est_serialise: false,
  is_active: true,
})

const form = reactive(defaultForm())
const saving = ref(false)
const errors = ref({})
const categories = ref([])

const prixTtc = computed(() => {
  return Math.round(form.prix_vente_ht * (1 + form.taux_tva / 100))
})

const margePourcentage = computed(() => {
  if (!form.prix_achat_ht || form.prix_achat_ht === 0) return 0
  return Math.round(((form.prix_vente_ht - form.prix_achat_ht) / form.prix_achat_ht) * 100)
})

const margeColor = computed(() => {
  if (margePourcentage.value < 10) return 'text-red-600'
  if (margePourcentage.value < 25) return 'text-orange-600'
  return 'text-green-600'
})

function formatPrice(n) {
  return new Intl.NumberFormat('fr-FR').format(n)
}

watch(() => props.produit, (val) => {
  if (val) {
    Object.assign(form, defaultForm(), val)
  } else {
    Object.assign(form, defaultForm())
  }
  errors.value = {}
}, { immediate: true })

onMounted(async () => {
  try {
    const { data } = await api.get('/categories-produits')
    // Aplatir les catégories (parents + enfants)
    categories.value = []
    data.forEach(cat => {
      categories.value.push(cat)
      if (cat.enfants?.length) {
        cat.enfants.forEach(child => {
          categories.value.push({ ...child, libelle: '— ' + child.libelle })
        })
      }
    })
  } catch (e) {
    console.error('Erreur chargement catégories', e)
  }
})

async function handleSubmit() {
  saving.value = true
  errors.value = {}

  try {
    const payload = { ...form }
    // Nettoyer les chaînes vides → null
    Object.keys(payload).forEach(k => {
      if (payload[k] === '') payload[k] = null
    })

    let response
    if (props.produit?.id) {
      response = await api.put(`/produits/${props.produit.id}`, payload)
      toast.success(`Produit "${response.data.libelle}" mis à jour`)
    } else {
      response = await api.post('/produits', payload)
      toast.success(`Produit "${response.data.libelle}" créé (${response.data.reference})`)
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
