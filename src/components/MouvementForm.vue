<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <FormErrorSummary :messages="errorMessages" :labels="errorLabels" />

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="md:col-span-2">
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Produit <span class="text-red-500">*</span>
        </label>
        <input
          v-model="produitSearch"
          type="search"
          class="input mb-2"
          placeholder="Rechercher par référence, libellé ou code-barres..."
        />
        <select v-model.number="form.produit_id" class="input" required>
          <option :value="null">— Sélectionnez —</option>
          <option v-for="p in produits" :key="p.id" :value="p.id">
            {{ p.reference }} — {{ p.libelle }}
          </option>
        </select>
        <p class="mt-1 text-xs text-gray-500">
          <span v-if="loadingProduits">Recherche en cours...</span>
          <span v-else>{{ produits.length }} produit(s) affiché(s)</span>
        </p>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Entrepôt <span class="text-red-500">*</span>
        </label>
        <select v-model.number="form.entrepot_id" class="input" required>
          <option :value="null">— Sélectionnez —</option>
          <option v-for="e in entrepots" :key="e.id" :value="e.id">{{ e.libelle }}</option>
        </select>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Emplacement</label>
        <select v-model.number="form.emplacement_id" class="input" :required="hasEmplacements" :disabled="loadingEmplacements || !hasEmplacements">
          <option :value="null">{{ loadingEmplacements ? 'Chargement...' : hasEmplacements ? '— Sélectionnez un emplacement —' : 'Aucun emplacement configuré' }}</option>
          <option v-for="emp in emplacements" :key="emp.id" :value="emp.id">
            {{ emplacementLabel(emp) }}
          </option>
        </select>
        <p class="mt-1 text-xs" :class="hasEmplacements ? 'text-blue-700' : 'text-gray-500'">
          {{ hasEmplacements ? 'Obligatoire : choisissez le rayon, la rangée et le niveau.' : 'Cet entrepôt ne possède pas encore de rayon configuré.' }}
        </p>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          {{ type === 'ajustement' ? 'Nouvelle quantité' : 'Quantité' }} <span class="text-red-500">*</span>
        </label>
        <input v-model.number="quantiteField" type="number" step="0.001" min="0" class="input" required />
      </div>

      <div v-if="type === 'entree'">
        <label class="block text-sm font-medium text-gray-700 mb-1">Prix unitaire (pour PMP)</label>
        <input v-model.number="form.prix_unitaire" type="number" step="0.01" min="0" class="input" placeholder="Optionnel" />
      </div>

      <div class="md:col-span-2">
        <label class="block text-sm font-medium text-gray-700 mb-1">Motif</label>
        <input v-model="form.motif" type="text" class="input" :placeholder="motifPlaceholder" />
      </div>
    </div>

    <div class="flex justify-end gap-2 pt-2 border-t border-gray-200">
      <button type="button" @click="$emit('cancel')" class="btn-secondary">Annuler</button>
      <button type="submit" :disabled="saving" class="btn-primary">
        <span v-if="saving">...</span>
        <span v-else>{{ submitLabel }}</span>
      </button>
    </div>
  </form>
</template>

<script setup>
import { reactive, ref, computed, onMounted, watch } from 'vue'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'
import FormErrorSummary from '@/components/FormErrorSummary.vue'
import { errorMessagesFromResponse } from '@/utils/formErrors'

const props = defineProps({
  type: { type: String, required: true }, // entree, sortie, ajustement
  entrepots: { type: Array, default: () => [] },
})
const emit = defineEmits(['saved', 'cancel'])
const toast = useToast()

const form = reactive({
  produit_id: null,
  entrepot_id: props.entrepots[0]?.id || null,
  emplacement_id: null,
  quantite: 0,
  nouvelle_quantite: 0,
  prix_unitaire: null,
  motif: '',
})

const quantiteField = computed({
  get: () => props.type === 'ajustement' ? form.nouvelle_quantite : form.quantite,
  set: (v) => {
    if (props.type === 'ajustement') form.nouvelle_quantite = v
    else form.quantite = v
  }
})

const produits = ref([])
const produitSearch = ref('')
const loadingProduits = ref(false)
const emplacements = ref([])
const loadingEmplacements = ref(false)
const hasEmplacements = computed(() => emplacements.value.length > 0)
const saving = ref(false)
const errorMessages = ref([])
let produitSearchTimeout = null
const errorLabels = {
  produit_id: 'Produit',
  entrepot_id: 'Entrepôt',
  emplacement_id: 'Emplacement',
  quantite: 'Quantité',
  nouvelle_quantite: 'Nouvelle quantité',
  prix_unitaire: 'Prix unitaire',
  motif: 'Motif',
}

const submitLabel = computed(() => ({
  entree: 'Enregistrer l\'entrée', sortie: 'Enregistrer la sortie', ajustement: 'Enregistrer l\'ajustement',
}[props.type]))

const motifPlaceholder = computed(() => ({
  entree: 'Achat fournisseur, retour client...',
  sortie: 'Vente, casse, expédition...',
  ajustement: 'Inventaire physique du XX/XX',
}[props.type]))

watch(produitSearch, () => {
  clearTimeout(produitSearchTimeout)
  produitSearchTimeout = setTimeout(() => loadProduits(), 300)
})

watch(() => form.entrepot_id, () => {
  form.emplacement_id = null
  loadEmplacements()
})

onMounted(() => {
  loadProduits()
  loadEmplacements()
})

async function loadProduits() {
  loadingProduits.value = true
  try {
    const { data } = await api.get('/produits', {
      params: {
        per_page: 50,
        actifs_seulement: 1,
        search: produitSearch.value.trim() || undefined,
      },
    })
    produits.value = data.data.filter(p => p.gere_stock)
  } catch (e) {
    errorMessages.value = ['Impossible de charger les produits']
  } finally {
    loadingProduits.value = false
  }
}

async function loadEmplacements() {
  emplacements.value = []
  if (!form.entrepot_id) return

  loadingEmplacements.value = true
  try {
    const { data } = await api.get(`/entrepots/${form.entrepot_id}`)
    emplacements.value = (data.entrepot?.zones || []).filter(zone => zone.is_active !== false).flatMap(zone =>
      (zone.emplacements || []).filter(emp => emp.is_active !== false).map(emp => ({ ...emp, zone }))
    )
  } catch (e) {
    errorMessages.value = ['Impossible de charger les emplacements']
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
  errorMessages.value = []
  try {
    const endpoint = `/stocks/${props.type}`
    const { data } = await api.post(endpoint, form)
    toast.success({
      entree: 'Entrée enregistrée',
      sortie: 'Sortie enregistrée',
      ajustement: 'Ajustement effectué',
    }[props.type])
    emit('saved', data)
  } catch (err) {
    errorMessages.value = errorMessagesFromResponse(err, errorLabels)
    toast.error(errorMessages.value)
  } finally {
    saving.value = false
  }
}
</script>
