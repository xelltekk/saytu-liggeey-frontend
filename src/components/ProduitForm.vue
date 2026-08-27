<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <FormErrorSummary :errors="errors" :labels="errorLabels" />

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

    <!-- Photo -->
    <fieldset class="border border-gray-200 rounded-lg p-4">
      <legend class="px-2 text-sm font-semibold text-gray-700">Photo du produit</legend>

      <div class="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div class="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-slate-50 text-3xl text-slate-300">
          <img v-if="produitImagePreviewUrl" :src="produitImagePreviewUrl" :alt="form.libelle || 'Photo produit'" class="h-full w-full object-cover" />
          <span v-else>▣</span>
        </div>

        <div class="min-w-0 flex-1 space-y-2">
          <input ref="imageInput" type="file" accept="image/png,image/jpeg,image/webp" class="hidden" @change="onImageSelected" />
          <div class="flex flex-wrap gap-2">
            <button type="button" class="btn-secondary text-sm" @click="imageInput.click()">
              Choisir une photo
            </button>
            <button v-if="produitImagePreviewUrl" type="button" class="btn-secondary text-sm" @click="retirerImage">
              Retirer
            </button>
          </div>
          <p class="text-xs text-gray-500">PNG, JPG ou WEBP. Taille maximale : 2 Mo. La photo sera visible dans la liste produits et dans la caisse.</p>
        </div>
      </div>
    </fieldset>

    <!-- Prix -->
    <fieldset class="border border-gray-200 rounded-lg p-4">
      <legend class="px-2 text-sm font-semibold text-gray-700">Prix</legend>

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
          <strong class="ml-2 text-xelltekk-800">{{ formatPrice(prixTtc) }}</strong>
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

      <div
        v-if="showStockInitialOption"
        class="mt-4 rounded-2xl border border-blue-100 bg-blue-50/60 p-4"
      >
        <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <label class="flex cursor-pointer items-start gap-3 text-sm font-semibold text-blue-950">
            <input
              v-model="stockInitial.enabled"
              type="checkbox"
              class="mt-1 h-4 w-4"
              :disabled="!form.gere_stock"
            />
            <span>
              Créer aussi une entrée de stock initiale
              <small class="mt-0.5 block font-normal text-blue-700">
                Un vrai mouvement “entrée” sera créé dans l’historique du stock.
              </small>
            </span>
          </label>
          <span class="rounded-full bg-white px-3 py-1 text-xs font-bold text-blue-700">
            Recommandé
          </span>
        </div>

        <div v-if="stockInitial.enabled" class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Quantité initiale <span class="text-red-500">*</span>
            </label>
            <input v-model.number="stockInitial.quantite" type="number" class="input" step="0.001" min="0.001" required />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Entrepôt <span class="text-red-500">*</span>
            </label>
            <select v-model.number="stockInitial.entrepot_id" class="input" required>
              <option :value="null">— Sélectionnez —</option>
              <option v-for="entrepot in entrepots" :key="entrepot.id" :value="entrepot.id">
                {{ entrepot.libelle }}
              </option>
            </select>
            <p v-if="!entrepots.length" class="mt-1 text-xs text-orange-700">
              Aucun entrepôt actif disponible. Créez d’abord un entrepôt.
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Emplacement</label>
            <select
              v-model.number="stockInitial.emplacement_id"
              class="input"
              :required="hasStockInitialEmplacements"
              :disabled="loadingEmplacements || !hasStockInitialEmplacements"
            >
              <option :value="null">
                {{ loadingEmplacements ? 'Chargement...' : hasStockInitialEmplacements ? '— Sélectionnez un emplacement —' : 'Aucun emplacement configuré' }}
              </option>
              <option v-for="emplacement in emplacements" :key="emplacement.id" :value="emplacement.id">
                {{ emplacementLabel(emplacement) }}
              </option>
            </select>
            <p class="mt-1 text-xs" :class="hasStockInitialEmplacements ? 'text-blue-700' : 'text-gray-500'">
              {{ hasStockInitialEmplacements ? 'Obligatoire pour cet entrepôt.' : 'Facultatif si aucun rayon n’est configuré.' }}
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Prix unitaire d’entrée</label>
            <input v-model.number="stockInitial.prix_unitaire" type="number" class="input" step="0.01" min="0" placeholder="Prix achat si vide" />
          </div>

          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-1">Motif</label>
            <input v-model="stockInitial.motif" type="text" class="input" placeholder="Stock initial" />
          </div>
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
import { reactive, ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'
import FormErrorSummary from '@/components/FormErrorSummary.vue'
import { errorMessagesFromResponse, validationErrors } from '@/utils/formErrors'

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
  image: '',
})

const defaultStockInitial = () => ({
  enabled: false,
  entrepot_id: null,
  emplacement_id: null,
  quantite: null,
  prix_unitaire: null,
  motif: 'Stock initial',
})

const form = reactive(defaultForm())
const stockInitial = reactive(defaultStockInitial())
const saving = ref(false)
const errors = ref({})
const imageInput = ref(null)
const selectedImage = ref(null)
const selectedImagePreview = ref('')
const removeImage = ref(false)
const entrepots = ref([])
const emplacements = ref([])
const loadingEmplacements = ref(false)
const errorLabels = {
  reference: 'Référence',
  code_barre: 'Code-barres',
  libelle: 'Libellé',
  categorie_id: 'Catégorie',
  type: 'Type',
  nature: 'Nature',
  prix_achat_ht: "Prix d'achat HT",
  prix_vente_ht: 'Prix de vente HT',
  taux_tva: 'TVA',
  stock_alerte: "Stock d'alerte",
  unite: 'Unité',
  garantie_mois: 'Garantie',
  image: 'Photo produit',
  'stock_initial.enabled': 'Stock initial',
  'stock_initial.entrepot_id': 'Entrepôt du stock initial',
  'stock_initial.emplacement_id': 'Emplacement du stock initial',
  'stock_initial.quantite': 'Quantité initiale',
  'stock_initial.prix_unitaire': 'Prix unitaire du stock initial',
  'stock_initial.motif': 'Motif du stock initial',
}
const categories = ref([])

const showStockInitialOption = computed(() => !props.produit?.id && form.type === 'produit')
const hasStockInitialEmplacements = computed(() => emplacements.value.length > 0)

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

const produitImagePreviewUrl = computed(() => {
  if (selectedImagePreview.value) return selectedImagePreview.value
  if (!form.image || removeImage.value) return ''
  return imageUrl(form.image)
})

function formatPrice(n) {
  return new Intl.NumberFormat('fr-FR').format(n)
}

function imageUrl(image) {
  if (!image) return ''
  if (String(image).startsWith('http') || String(image).startsWith('data:') || String(image).startsWith('blob:')) return image
  return String(image).startsWith('/') ? image : `/${image}`
}

watch(() => props.produit, (val) => {
  if (val) {
    Object.assign(form, defaultForm(), val)
  } else {
    Object.assign(form, defaultForm())
    resetStockInitial()
  }
  resetImageSelection()
  errors.value = {}
}, { immediate: true })

watch(() => form.type, (type) => {
  if (type !== 'produit') {
    stockInitial.enabled = false
    form.gere_stock = false
  }
})

watch(() => form.gere_stock, (gereStock) => {
  if (!gereStock) stockInitial.enabled = false
})

watch(() => stockInitial.enabled, (enabled) => {
  if (enabled && !stockInitial.entrepot_id && entrepots.value.length === 1) {
    stockInitial.entrepot_id = entrepots.value[0].id
  }
})

watch(() => stockInitial.entrepot_id, () => {
  stockInitial.emplacement_id = null
  loadStockInitialEmplacements()
})

onBeforeUnmount(() => {
  if (selectedImagePreview.value) URL.revokeObjectURL(selectedImagePreview.value)
})

onMounted(async () => {
  try {
    const { data } = await api.get('/categories-produits')
    // Aplatir les catégories (parents + enfants)
    categories.value = []
    data.forEach(cat => {
      categories.value.push(cat)
      if (cat.enfants.length) {
        cat.enfants.forEach(child => {
          categories.value.push({ ...child, libelle: '— ' + child.libelle })
        })
      }
    })
  } catch (e) {
    console.error('Erreur chargement catégories', e)
  }

  loadEntrepots()
})

function resetStockInitial() {
  Object.assign(stockInitial, defaultStockInitial())
  emplacements.value = []
}

function resetImageSelection() {
  selectedImage.value = null
  removeImage.value = false
  if (selectedImagePreview.value) {
    URL.revokeObjectURL(selectedImagePreview.value)
    selectedImagePreview.value = ''
  }
  if (imageInput.value) imageInput.value.value = ''
}

function onImageSelected(event) {
  const file = event.target.files?.[0]
  if (!file) return

  if (!file.type.startsWith('image/')) {
    errors.value = { image: ['Le fichier choisi doit être une image.'] }
    toast.error('Le fichier choisi doit être une image.')
    if (imageInput.value) imageInput.value.value = ''
    return
  }

  if (file.size > 2 * 1024 * 1024) {
    errors.value = { image: ['La photo produit dépasse 2 Mo.'] }
    toast.error('La photo produit dépasse 2 Mo.')
    if (imageInput.value) imageInput.value.value = ''
    return
  }

  selectedImage.value = file
  removeImage.value = false
  if (selectedImagePreview.value) URL.revokeObjectURL(selectedImagePreview.value)
  selectedImagePreview.value = URL.createObjectURL(file)
}

function retirerImage() {
  selectedImage.value = null
  removeImage.value = true
  form.image = ''
  if (selectedImagePreview.value) {
    URL.revokeObjectURL(selectedImagePreview.value)
    selectedImagePreview.value = ''
  }
  if (imageInput.value) imageInput.value.value = ''
}

async function syncImage(produitId, produitData) {
  let nextProduit = produitData

  if (removeImage.value && props.produit?.image && !selectedImage.value) {
    const { data } = await api.delete(`/produits/${produitId}/image`)
    nextProduit = data.produit
  }

  if (selectedImage.value) {
    const formData = new FormData()
    formData.append('image', selectedImage.value)
    const { data } = await api.post(`/produits/${produitId}/image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    nextProduit = data.produit
  }

  return nextProduit
}

async function loadEntrepots() {
  try {
    const { data } = await api.get('/entrepots', { params: { actifs_seulement: 1 } })
    entrepots.value = Array.isArray(data) ? data : data.data || []

    if (!stockInitial.entrepot_id && entrepots.value.length === 1) {
      stockInitial.entrepot_id = entrepots.value[0].id
    }
  } catch (e) {
    console.error('Erreur chargement entrepôts', e)
  }
}

async function loadStockInitialEmplacements() {
  emplacements.value = []
  if (!stockInitial.entrepot_id) return

  loadingEmplacements.value = true
  try {
    const { data } = await api.get(`/entrepots/${stockInitial.entrepot_id}`)
    emplacements.value = (data.entrepot?.zones || []).filter(zone => zone.is_active !== false).flatMap(zone =>
      (zone.emplacements || []).filter(emp => emp.is_active !== false).map(emp => ({ ...emp, zone }))
    )
  } catch (e) {
    console.error('Erreur chargement emplacements', e)
  } finally {
    loadingEmplacements.value = false
  }
}

function emplacementLabel(emp) {
  const zone = emp.zone?.libelle || emp.zone?.code || 'Zone'
  const details = [
    emp.allee && `Rayon ${emp.allee}`,
    emp.rangee && `Rangée ${emp.rangee}`,
    emp.niveau && `Niveau ${emp.niveau}`,
  ].filter(Boolean).join(' / ')

  return details ? `${zone} - ${details} - ${emp.code}` : `${zone} - ${emp.code}`
}

async function handleSubmit() {
  saving.value = true
  errors.value = {}

  try {
    const payload = { ...form }
    // Nettoyer les chaînes vides → null
    Object.keys(payload).forEach(k => {
      if (payload[k] === '') payload[k] = null
    })

    if (!props.produit?.id && stockInitial.enabled) {
      payload.gere_stock = true
      payload.stock_initial = {
        enabled: true,
        entrepot_id: stockInitial.entrepot_id,
        emplacement_id: stockInitial.emplacement_id,
        quantite: stockInitial.quantite,
        prix_unitaire: stockInitial.prix_unitaire,
        motif: stockInitial.motif || 'Stock initial',
      }
    }

    let response
    let produitEnregistre
    if (props.produit?.id) {
      response = await api.put(`/produits/${props.produit.id}`, payload)
      produitEnregistre = await syncImage(props.produit.id, response.data)
      toast.success(`Produit "${produitEnregistre.libelle}" mis à jour`)
    } else {
      response = await api.post('/produits', payload)
      produitEnregistre = await syncImage(response.data.id, response.data)
      toast.success(`Produit "${produitEnregistre.libelle}" créé (${produitEnregistre.reference})`)
    }
    emit('saved', produitEnregistre)
  } catch (err) {
    if (err.response?.status === 422) {
      errors.value = validationErrors(err)
      toast.error(errorMessagesFromResponse(err, errorLabels))
    } else {
      toast.error(err.response?.data?.message || 'Erreur lors de l\'enregistrement')
    }
  } finally {
    saving.value = false
  }
}
</script>
