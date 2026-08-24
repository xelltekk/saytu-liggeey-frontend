<template>
  <div class="produits-page space-y-4">
    <section class="produits-toolbar">
      <div class="produits-toolbar-main">
        <div>
          <p class="text-xs font-black uppercase tracking-[0.18em] text-[color:var(--saytu-primary,#2563eb)]">Produits</p>
          <h2 class="truncate text-lg font-black text-[color:var(--saytu-shell-text,#0f172a)]">Catalogue produits & services</h2>
          <p class="text-sm text-[color:var(--saytu-topbar-subtitle,#64748b)]">
            Prix, photos, catégories et disponibilité en une vue légère.
          </p>
        </div>
        <div class="produits-toolbar-actions">
          <button @click="exporterCSV" :disabled="exportLoading" class="btn-secondary whitespace-nowrap">
            {{ exportLoading ? 'Export...' : 'CSV' }}
          </button>

          <button @click="openCreate" class="btn-primary whitespace-nowrap">
            + Produit
          </button>
        </div>
      </div>

      <div class="produits-filter-row">
        <input
          v-model="filters.search"
          @input="onSearchInput"
          type="search"
          placeholder="🔍 Référence, libellé, code-barres, marque, modèle..."
          class="input produits-search"
        />

        <select v-model="filters.type" @change="onProduitTypeChange" class="input">
          <option value="">Tous types</option>
          <option value="produit">Produits</option>
          <option value="service">Services</option>
        </select>

        <select v-model="filters.categorie_id" @change="loadProduits(1)" class="input">
          <option value="">Toutes catégories</option>
          <option v-for="cat in categories" :key="cat.id" :value="cat.id">
            {{ cat.libelle }}
          </option>
        </select>
      </div>
    </section>

    <section class="produits-strip">
      <button
        v-for="card in produitStatCards"
        :key="card.key"
        type="button"
        class="produits-stat-pill"
        :class="produitPillClass(card)"
        @click="applyProduitFilter(card.type, card.actifs)"
      >
        <span>{{ card.label }}</span>
        <strong>{{ card.value }}</strong>
      </button>

      <div class="produits-mini-signal">
        <span>Photos manquantes</span>
        <strong>{{ produitsInsights.photosManquantes }}</strong>
      </div>
      <div class="produits-mini-signal">
        <span>Marge moy.</span>
        <strong>{{ produitsInsights.margeMoyenne }}%</strong>
      </div>
    </section>

    <!-- Loader -->
    <div v-if="loading" class="rounded-2xl border border-[color:var(--saytu-border,#e2e8f0)] bg-[color:var(--saytu-surface,#ffffff)] p-12 text-center text-[color:var(--saytu-topbar-subtitle,#64748b)]">
      Chargement...
    </div>

    <!-- Tableau -->
    <section v-else class="overflow-hidden rounded-2xl border border-[color:var(--saytu-border,#e2e8f0)] bg-[color:var(--saytu-surface,#ffffff)]">
      <div class="border-b border-[color:var(--saytu-border,#e2e8f0)] px-4 py-3">
        <div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 class="text-base font-black text-[color:var(--saytu-shell-text,#0f172a)]">Catalogue</h3>
            <p class="text-xs text-[color:var(--saytu-topbar-subtitle,#64748b)]">
              {{ produitsInsights.actifsAffiches }} actif(s) sur {{ produits.length }} ligne(s) affichée(s).
            </p>
          </div>
          <p class="text-xs font-semibold text-[color:var(--saytu-topbar-subtitle,#64748b)]">
            Montants exprimés en Francs CFA BCEAO
          </p>
        </div>
      </div>
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
                <div class="flex items-center gap-3">
                  <div class="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-slate-50 text-lg text-slate-300">
                    <img v-if="imageUrl(produit.image)" :src="imageUrl(produit.image)" :alt="produit.libelle" class="h-full w-full object-cover" />
                    <span v-else>▣</span>
                  </div>
                  <div class="min-w-0">
                    <div class="font-medium text-gray-900">{{ produit.libelle }}</div>
                    <div v-if="produit.marque || produit.modele" class="text-xs text-gray-500">
                      {{ [produit.marque, produit.modele].filter(Boolean).join(' • ') }}
                    </div>
                  </div>
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
    </section>

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

const produitStatCards = computed(() => [
  { key: 'total', label: 'Total', value: stats.total, type: '', actifs: false },
  { key: 'actifs', label: 'Actifs', value: stats.actifs, type: '', actifs: true },
  { key: 'produits', label: 'Produits', value: stats.produits, type: 'produit', actifs: false },
  { key: 'services', label: 'Services', value: stats.services, type: 'service', actifs: false },
])

const produitsInsights = computed(() => {
  const rows = produits.value || []
  const actifsAffiches = rows.filter((produit) => produit.is_active).length
  const photosManquantes = rows.filter((produit) => !imageUrl(produit.image)).length
  const marges = rows
    .map((produit) => {
      const achat = Number(produit.prix_achat_ht || 0)
      const vente = Number(produit.prix_vente_ht || 0)
      return achat > 0 ? ((vente - achat) / achat) * 100 : null
    })
    .filter((marge) => marge !== null && Number.isFinite(marge))

  const margeMoyenne = marges.length
    ? Math.round(marges.reduce((sum, marge) => sum + marge, 0) / marges.length)
    : 0

  return { actifsAffiches, photosManquantes, margeMoyenne }
})

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

function produitPillClass(card) {
  return filters.type === card.type && filters.actifs_seulement === card.actifs
    ? 'produits-stat-pill-active'
    : 'produits-stat-pill-idle'
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

function imageUrl(image) {
  if (!image) return ''
  if (String(image).startsWith('http') || String(image).startsWith('data:') || String(image).startsWith('blob:')) return image
  return String(image).startsWith('/') ? image : `/${image}`
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

<style scoped>
.produits-page {
  color: var(--saytu-shell-text, #0f172a);
}

.produits-toolbar {
  border: 1px solid color-mix(in srgb, var(--saytu-primary, #2563eb) 14%, var(--saytu-border, #e2e8f0));
  border-radius: 1.25rem;
  background:
    linear-gradient(135deg, color-mix(in srgb, var(--saytu-primary, #2563eb) 7%, transparent), transparent 48%),
    var(--saytu-surface, #ffffff);
  box-shadow: 0 10px 30px color-mix(in srgb, var(--saytu-primary, #2563eb) 7%, transparent);
  padding: 1rem;
}

.produits-toolbar-main {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.produits-toolbar-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: .5rem;
}

.produits-filter-row {
  margin-top: .85rem;
  display: grid;
  grid-template-columns: minmax(220px, 1fr) minmax(150px, 190px) minmax(180px, 230px);
  gap: .65rem;
}

.produits-search {
  min-width: 0;
}

.produits-strip {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: .65rem;
}

.produits-stat-pill,
.produits-mini-signal {
  min-height: 4.25rem;
  border-radius: 1rem;
  border: 1px solid color-mix(in srgb, var(--saytu-primary, #2563eb) 14%, var(--saytu-border, #e2e8f0));
  padding: .75rem .85rem;
  text-align: left;
  transition: transform .18s ease, border-color .18s ease, box-shadow .18s ease, background .18s ease;
}

.produits-stat-pill span,
.produits-mini-signal span {
  display: block;
  color: var(--saytu-topbar-subtitle, #64748b);
  font-size: .72rem;
  font-weight: 800;
  letter-spacing: .08em;
  text-transform: uppercase;
}

.produits-stat-pill strong,
.produits-mini-signal strong {
  margin-top: .25rem;
  display: block;
  color: var(--saytu-shell-text, #0f172a);
  font-size: 1.45rem;
  font-weight: 950;
  line-height: 1.1;
}

.produits-stat-pill:hover {
  transform: translateY(-1px);
  border-color: color-mix(in srgb, var(--saytu-primary, #2563eb) 32%, var(--saytu-border, #e2e8f0));
  box-shadow: 0 10px 22px color-mix(in srgb, var(--saytu-primary, #2563eb) 10%, transparent);
}

.produits-stat-pill-active {
  background: linear-gradient(135deg, var(--saytu-primary, #2563eb), var(--saytu-brand-to, #06b6d4));
  border-color: transparent;
  box-shadow: 0 10px 24px color-mix(in srgb, var(--saytu-primary, #2563eb) 20%, transparent);
}

.produits-stat-pill-active span,
.produits-stat-pill-active strong {
  color: #ffffff;
}

.produits-stat-pill-idle,
.produits-mini-signal {
  background: color-mix(in srgb, var(--saytu-surface, #ffffff) 92%, var(--saytu-primary, #2563eb) 8%);
}

.produits-mini-signal {
  border-style: dashed;
}

@media (max-width: 1024px) {
  .produits-strip {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .produits-toolbar-main {
    flex-direction: column;
  }

  .produits-toolbar-actions {
    width: 100%;
    justify-content: stretch;
  }

  .produits-toolbar-actions > * {
    flex: 1 1 auto;
  }

  .produits-filter-row,
  .produits-strip {
    grid-template-columns: 1fr;
  }
}
</style>
