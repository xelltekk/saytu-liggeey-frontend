<template>
  <div>
    <!-- Header avec filtres -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
      <div class="flex flex-col md:flex-row gap-3">
        <input
          v-model="filters.search"
          @input="onSearchInput"
          type="search"
          placeholder="🔍 Référence, libellé, code-barres, marque, modèle..."
          class="input flex-1"
        />

        <select v-model="filters.type" @change="onProduitTypeChange" class="input md:w-40">
          <option value="">Tous types</option>
          <option value="produit">Produits</option>
          <option value="service">Services</option>
        </select>

        <select v-model="filters.categorie_id" @change="loadProduits(1)" class="input md:w-48">
          <option value="">Toutes catégories</option>
          <option v-for="cat in categories" :key="cat.id" :value="cat.id">
            {{ cat.libelle }}
          </option>
        </select>

        <button @click="exporterCSV" :disabled="exportLoading" class="btn-secondary whitespace-nowrap">
          {{ exportLoading ? 'Export...' : 'Exporter CSV' }}
        </button>

        <button @click="openCreate" class="btn-primary whitespace-nowrap">
          + Nouveau produit
        </button>
      </div>
    </div>

    <!-- Cartes stats -->
    <div class="stat-grid grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 mb-4">
      <button type="button" @click="applyProduitFilter('', false)" class="text-left bg-white rounded-lg border p-3 transition hover:-translate-y-0.5 hover:border-xelltekk-300 hover:shadow-sm" :class="produitCardClass('', false)">
        <div class="text-xs text-gray-500 uppercase">Total</div>
        <div class="text-2xl font-bold text-gray-900">{{ stats.total }}</div>
      </button>
      <button type="button" @click="applyProduitFilter('', true)" class="text-left bg-white rounded-lg border p-3 transition hover:-translate-y-0.5 hover:border-xelltekk-300 hover:shadow-sm" :class="produitCardClass('', true)">
        <div class="text-xs text-gray-500 uppercase">Actifs</div>
        <div class="text-2xl font-bold text-green-600">{{ stats.actifs }}</div>
      </button>
      <button type="button" @click="applyProduitFilter('produit', false)" class="text-left bg-white rounded-lg border p-3 transition hover:-translate-y-0.5 hover:border-xelltekk-300 hover:shadow-sm" :class="produitCardClass('produit', false)">
        <div class="text-xs text-gray-500 uppercase">Produits</div>
        <div class="text-2xl font-bold text-xelltekk-600">{{ stats.produits }}</div>
      </button>
      <button type="button" @click="applyProduitFilter('service', false)" class="text-left bg-white rounded-lg border p-3 transition hover:-translate-y-0.5 hover:border-xelltekk-300 hover:shadow-sm" :class="produitCardClass('service', false)">
        <div class="text-xs text-gray-500 uppercase">Services</div>
        <div class="text-2xl font-bold text-purple-600">{{ stats.services }}</div>
      </button>
    </div>

    <!-- Loader -->
    <div v-if="loading" class="bg-white rounded-lg p-12 text-center text-gray-500">
      Chargement...
    </div>

    <!-- Tableau -->
    <div v-else class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <SortableTh column="reference" :active="sort.key === 'reference'" :icon="sortIcon('reference')" @sort="toggleSort">Référence</SortableTh>
              <SortableTh column="libelle" :active="sort.key === 'libelle'" :icon="sortIcon('libelle')" @sort="toggleSort">Libellé</SortableTh>
              <SortableTh column="categorie" :active="sort.key === 'categorie'" :icon="sortIcon('categorie')" @sort="toggleSort">Catégorie</SortableTh>
              <SortableTh column="type" :active="sort.key === 'type'" :icon="sortIcon('type')" @sort="toggleSort">Type</SortableTh>
              <SortableTh column="prix_ht" :active="sort.key === 'prix_ht'" :icon="sortIcon('prix_ht')" align="right" @sort="toggleSort">Prix HT</SortableTh>
              <SortableTh column="tva" :active="sort.key === 'tva'" :icon="sortIcon('tva')" align="right" @sort="toggleSort">TVA</SortableTh>
              <SortableTh column="prix_ttc" :active="sort.key === 'prix_ttc'" :icon="sortIcon('prix_ttc')" align="right" @sort="toggleSort">Prix TTC</SortableTh>
              <SortableTh column="actif" :active="sort.key === 'actif'" :icon="sortIcon('actif')" align="center" @sort="toggleSort">Actif</SortableTh>
              <th class="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="produit in sortedProduits" :key="produit.id" class="hover:bg-gray-50">
              <td class="px-4 py-3 text-sm font-mono text-gray-600">{{ produit.reference }}</td>
              <td class="px-4 py-3">
                <div class="font-medium text-gray-900">{{ produit.libelle }}</div>
                <div v-if="produit.marque || produit.modele" class="text-xs text-gray-500">
                  {{ [produit.marque, produit.modele].filter(Boolean).join(' • ') }}
                </div>
              </td>
              <td class="px-4 py-3 text-sm text-gray-600">{{ produit.categorie?.libelle || '–' }}</td>
              <td class="px-4 py-3">
                <span class="badge" :class="typeBadgeClass(produit.type)">
                  {{ produit.type }}
                </span>
              </td>
              <td class="px-4 py-3 text-sm text-right font-mono">{{ formatPrice(produit.prix_vente_ht) }}</td>
              <td class="px-4 py-3 text-sm text-right text-gray-500">{{ produit.taux_tva }}%</td>
              <td class="px-4 py-3 text-sm text-right font-mono font-semibold text-xelltekk-700">
                {{ formatPrice(prixTtc(produit)) }}
              </td>
              <td class="px-4 py-3 text-center">
                <span v-if="produit.is_active" class="text-green-600">✓</span>
                <span v-else class="text-gray-300">✗</span>
              </td>
              <td class="px-4 py-3 text-right whitespace-nowrap">
                <button @click="openEdit(produit)" class="text-xelltekk-600 hover:text-xelltekk-800 text-sm font-medium mr-3">
                  ✏️
                </button>
                <button @click="confirmDelete(produit)" class="text-red-600 hover:text-red-800 text-sm font-medium">
                  🗑️
                </button>
              </td>
            </tr>
            <tr v-if="produits.length === 0">
              <td colspan="9" class="px-4 py-12 text-center text-gray-400 text-sm">
                Aucun produit. Cliquez sur "Nouveau produit" pour commencer.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="meta.total > 0" class="px-4 py-3 border-t border-gray-200 flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
        <div class="text-gray-600">
          Affichage de <strong>{{ meta.from }}</strong> à <strong>{{ meta.to }}</strong>
          sur <strong>{{ meta.total }}</strong> produits
        </div>
        <div class="flex gap-2">
          <button
            @click="loadProduits(meta.current_page - 1)"
            :disabled="meta.current_page === 1"
            class="btn-secondary px-3 py-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ← Précédent
          </button>
          <span class="px-3 py-1.5 text-gray-600">Page {{ meta.current_page }} / {{ meta.last_page }}</span>
          <button
            @click="loadProduits(meta.current_page + 1)"
            :disabled="meta.current_page === meta.last_page"
            class="btn-secondary px-3 py-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Suivant →
          </button>
        </div>
      </div>
    </div>

    <!-- Modal création/édition -->
    <AppModal v-model="showModal" :title="editingProduit ? `Modifier : ${editingProduit.libelle}` : 'Nouveau produit'" size="lg">
      <ProduitForm
        :produit="editingProduit"
        @saved="onSaved"
        @cancel="showModal = false"
      />
    </AppModal>

    <!-- Modal suppression -->
    <AppModal v-model="showDeleteModal" title="Confirmer la suppression" size="sm">
      <p class="text-gray-700">
        Supprimer le produit <strong>{{ produitToDelete.libelle }}</strong> 
      </p>
      <template #footer>
        <button @click="showDeleteModal = false" class="btn-secondary">Annuler</button>
        <button @click="handleDelete" :disabled="deleting" class="btn-danger">
          <span v-if="deleting">Suppression...</span>
          <span v-else>Supprimer</span>
        </button>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { computed, ref, reactive, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'
import AppModal from '@/components/AppModal.vue'
import ProduitForm from '@/components/ProduitForm.vue'
import SortableTh from '@/components/SortableTh.vue'
import { useToast } from '@/composables/useToast'
import { useTableSort } from '@/composables/useTableSort'
import { telechargerCSV } from '@/services/exports'

const toast = useToast()
const route = useRoute()
const router = useRouter()

const produits = ref([])
const { sort, toggleSort, sortIcon, sortedRows } = useTableSort('created_at', 'desc')
const loading = ref(false)
const exportLoading = ref(false)
const categories = ref([])
const stats = reactive({ total: 0, actifs: 0, produits: 0, services: 0 })
const meta = reactive({ current_page: 1, last_page: 1, total: 0, from: 0, to: 0 })
const filters = reactive({ search: '', type: '', categorie_id: '', actifs_seulement: false })

const showModal = ref(false)
const editingProduit = ref(null)
const showDeleteModal = ref(false)
const produitToDelete = ref(null)
const deleting = ref(false)

const sortedProduits = computed(() => sortedRows(produits.value, {
  created_at: 'created_at',
  reference: 'reference',
  libelle: 'libelle',
  categorie: (produit) => produit.categorie?.libelle || '',
  type: 'type',
  prix_ht: (produit) => parseFloat(produit.prix_vente_ht || 0),
  tva: (produit) => parseFloat(produit.taux_tva || 0),
  prix_ttc: (produit) => prixTtc(produit),
  actif: (produit) => (produit.is_active ? 1 : 0),
}))

let searchTimeout = null
function onSearchInput() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => loadProduits(1), 350)
}

function onProduitTypeChange() {
  filters.actifs_seulement = false
  loadProduits(1)
}

function applyProduitFilter(type, actifsSeulement) {
  filters.type = type
  filters.actifs_seulement = actifsSeulement
  loadProduits(1)
}

function produitCardClass(type, actifsSeulement) {
  return filters.type === type && filters.actifs_seulement === actifsSeulement ?
     'border-xelltekk-500 bg-xelltekk-50 ring-2 ring-xelltekk-100'
    : 'border-gray-200'
}

async function loadProduits(page = 1) {
  loading.value = true
  try {
    const { data } = await api.get('/produits', {
      params: {
        page,
        per_page: 20,
        search: filters.search || undefined,
        type: filters.type || undefined,
        categorie_id: filters.categorie_id || undefined,
        actifs_seulement: filters.actifs_seulement || undefined,
      },
    })
    produits.value = data.data
    Object.assign(meta, {
      current_page: data.current_page,
      last_page: data.last_page,
      total: data.total,
      from: data.from || 0,
      to: data.to || 0,
    })
  } catch (e) {
    toast.error('Erreur de chargement')
  } finally {
    loading.value = false
  }
}

async function loadStats() {
  try {
    const { data } = await api.get('/produits/stats')
    Object.assign(stats, data)
  } catch (e) { /* ignore */ }
}

async function loadCategories() {
  try {
    const { data } = await api.get('/categories-produits')
    categories.value = data
  } catch (e) { /* ignore */ }
}

async function exporterCSV() {
  exportLoading.value = true
  try {
    await telechargerCSV('/exports/produits', {
      search: filters.search || undefined,
      type: filters.type || undefined,
      categorie_id: filters.categorie_id || undefined,
      actifs_seulement: filters.actifs_seulement || undefined,
    }, 'produits_saytu.csv')
    toast.success('Export des produits téléchargé.')
  } catch (e) {
    toast.error('Export impossible pour le moment.')
  } finally {
    exportLoading.value = false
  }
}

function openCreate() {
  editingProduit.value = null
  showModal.value = true
}

function openEdit(produit) {
  editingProduit.value = { ...produit }
  showModal.value = true
}

async function openFromRoute(id) {
  if (!id) return
  try {
    const { data } = await api.get(`/produits/${id}`)
    editingProduit.value = data
    showModal.value = true
    router.replace({ path: '/produits', query: {} })
  } catch (e) {
    toast.error('Produit introuvable')
  }
}

function onSaved() {
  showModal.value = false
  loadProduits(meta.current_page)
  loadStats()
}

function confirmDelete(produit) {
  produitToDelete.value = produit
  showDeleteModal.value = true
}

async function handleDelete() {
  deleting.value = true
  try {
    await api.delete(`/produits/${produitToDelete.value.id}`)
    toast.success(`Produit "${produitToDelete.value.libelle}" supprimé`)
    showDeleteModal.value = false
    produitToDelete.value = null
    loadProduits(meta.current_page)
    loadStats()
  } catch (err) {
    toast.error(err.response.data.message || 'Erreur de suppression')
  } finally {
    deleting.value = false
  }
}

function prixTtc(produit) {
  return Math.round(produit.prix_vente_ht * (1 + produit.taux_tva / 100))
}

function formatPrice(n) {
  return new Intl.NumberFormat('fr-FR').format(n || 0)
}

function typeBadgeClass(type) {
  return {
    produit: 'bg-blue-100 text-blue-800',
    service: 'bg-purple-100 text-purple-800',
  }[type] || 'bg-gray-100'
}

onMounted(() => {
  loadProduits()
  loadStats()
  loadCategories()
  openFromRoute(route.query.open)
})

watch(() => route.query.open, (id) => {
  openFromRoute(id)
})
</script>
