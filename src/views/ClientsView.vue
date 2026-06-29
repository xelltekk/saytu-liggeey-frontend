<template>
  <div>
    <!-- Header avec filtres et bouton -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
      <div class="flex flex-col md:flex-row gap-3">
        <input
          v-model="filters.search"
          @input="onSearchInput"
          type="search"
          placeholder="🔍 Rechercher par nom, email, téléphone, code, NINEA..."
          class="input flex-1"
        />

        <select v-model="filters.type" @change="loadClients(1)" class="input md:w-44">
          <option value="">Tous les types</option>
          <option value="client">Clients</option>
          <option value="prospect">Prospects</option>
          <option value="fournisseur">Fournisseurs</option>
          <option value="client_fournisseur">Client/Fournisseur</option>
        </select>

        <select v-model="filters.tag_id" @change="loadClients(1)" class="input md:w-44">
          <option value="">Tous les tags</option>
          <option v-for="t in tagsList" :key="t.id" :value="t.id">{{ t.emoji }} {{ t.libelle }}</option>
        </select>

        <select v-model="filters.statut" @change="loadClients(1)" class="input md:w-40">
          <option value="">Tous statuts</option>
          <option value="actif">Actifs</option>
          <option value="inactif">Inactifs</option>
          <option value="archive">Archivés</option>
        </select>

        <button @click="exporterCSV" :disabled="exportLoading" class="btn-secondary whitespace-nowrap">
          <span v-if="exportLoading">⏳</span>
          <span v-else>📥 CSV</span>
        </button>

        <button @click="openCreate" class="btn-primary whitespace-nowrap">
          + Nouveau client
        </button>
      </div>
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
              <SortableTh column="code" :active="sort.key === 'code'" :icon="sortIcon('code')" @sort="toggleSort">Code</SortableTh>
              <SortableTh column="nom" :active="sort.key === 'nom'" :icon="sortIcon('nom')" @sort="toggleSort">Nom</SortableTh>
              <SortableTh column="type" :active="sort.key === 'type'" :icon="sortIcon('type')" @sort="toggleSort">Type</SortableTh>
              <SortableTh column="tags" :active="sort.key === 'tags'" :icon="sortIcon('tags')" @sort="toggleSort">Tags</SortableTh>
              <SortableTh column="contact" :active="sort.key === 'contact'" :icon="sortIcon('contact')" @sort="toggleSort">Contact</SortableTh>
              <SortableTh column="ville" :active="sort.key === 'ville'" :icon="sortIcon('ville')" @sort="toggleSort">Ville</SortableTh>
              <SortableTh column="statut" :active="sort.key === 'statut'" :icon="sortIcon('statut')" @sort="toggleSort">Statut</SortableTh>
              <th class="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="client in sortedClients" :key="client.id" class="hover:bg-gray-50">
              <td class="px-4 py-3 text-sm font-mono text-gray-600">{{ client.code }}</td>
              <td class="px-4 py-3">
                <div class="font-medium text-gray-900">{{ client.nom }}</div>
                <div v-if="client.secteur_activite" class="text-xs text-gray-500">
                  {{ client.secteur_activite }}
                </div>
                <div class="text-xs text-blue-600">Commercial : {{ client.commercial?.name || 'Non affecté' }}</div>
              </td>
              <td class="px-4 py-3">
                <span class="badge" :class="typeBadgeClass(client.type)">
                  {{ typeLabel(client.type) }}
                </span>
              </td>
              <td class="px-4 py-3">
                <div class="flex flex-wrap gap-1 max-w-[180px]">
                  <span
                    v-for="t in client.tags || []"
                    :key="t.id"
                    class="text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap"
                    :style="{ backgroundColor: t.couleur, color: contrastTextColor(t.couleur) }"
                    :title="t.description"
                  >
                    {{ t.emoji }} {{ t.libelle }}
                  </span>
                  <span v-if="!(client.tags || []).length" class="text-xs text-gray-300">–</span>
                </div>
              </td>
              <td class="px-4 py-3 text-sm">
                <div v-if="client.email" class="text-gray-700 truncate max-w-[180px]">{{ client.email }}</div>
                <div v-if="client.telephone" class="text-xs text-gray-500">{{ client.telephone }}</div>
                <div v-if="!client.email && !client.telephone" class="text-xs text-gray-400">–</div>
              </td>
              <td class="px-4 py-3 text-sm text-gray-700">{{ client.ville || '–' }}</td>
              <td class="px-4 py-3">
                <span class="badge" :class="statutBadgeClass(client.statut)">
                  {{ client.statut }}
                </span>
              </td>
              <td class="px-4 py-3 text-right whitespace-nowrap">
                <button v-if="canSellTo(client)" @click="creerDevis(client)" class="text-emerald-600 hover:text-emerald-800 text-sm font-medium mr-3">
                  + Devis
                </button>
                <button v-if="canSellTo(client)" @click="creerFacture(client)" class="text-blue-600 hover:text-blue-800 text-sm font-medium mr-3">
                  + Facture
                </button>
                <button v-if="isAdmin" @click="openAssignClient(client)" class="text-indigo-600 hover:text-indigo-800 text-sm font-medium mr-3">
                  Affecter
                </button>
                <button @click="openEdit(client)" class="text-xelltekk-600 hover:text-xelltekk-800 text-sm font-medium mr-3">
                  ✏️ Modifier
                </button>
                <button @click="confirmDelete(client)" class="text-red-600 hover:text-red-800 text-sm font-medium">
                  🗑️
                </button>
              </td>
            </tr>
            <tr v-if="clients.length === 0">
              <td colspan="8" class="px-4 py-12 text-center text-gray-400 text-sm">
                Aucun client trouvé
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="meta.total > 0" class="px-4 py-3 border-t border-gray-200 flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
        <div class="text-gray-600">
          Affichage de <strong>{{ meta.from }}</strong> à <strong>{{ meta.to }}</strong>
          sur <strong>{{ meta.total }}</strong> clients
        </div>
        <div class="flex gap-2">
          <button
            @click="loadClients(meta.current_page - 1)"
            :disabled="meta.current_page === 1"
            class="btn-secondary px-3 py-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ← Précédent
          </button>
          <span class="px-3 py-1.5 text-gray-600">
            Page {{ meta.current_page }} / {{ meta.last_page }}
          </span>
          <button
            @click="loadClients(meta.current_page + 1)"
            :disabled="meta.current_page === meta.last_page"
            class="btn-secondary px-3 py-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Suivant →
          </button>
        </div>
      </div>
    </div>

    <!-- Modal création / édition -->
    <AppModal v-model="showModal" :title="editingClient ? `Modifier : ${editingClient.nom}` : 'Nouveau client'" size="lg">
      <ClientForm
        :client="editingClient"
        @saved="onClientSaved"
        @cancel="showModal = false"
      />
    </AppModal>

    <AssignCommercialModal
      v-if="assignTarget"
      v-model="showAssignModal"
      :endpoint="assignEndpoint"
      :current-commercial-id="assignTarget?.commercial_id"
      :item-label="assignTarget ? `${assignTarget.code} - ${assignTarget.nom}` : ''"
      title="Affecter client / prospect"
      @assigned="onAssigned"
    />

    <!-- Modal confirmation suppression -->
    <AppModal v-model="showDeleteModal" title="Confirmer la suppression" size="sm">
      <p class="text-gray-700">
        Êtes-vous sûr de vouloir supprimer le client
        <strong>{{ clientToDelete.nom }}</strong> 
      </p>
      <p class="mt-2 text-xs text-gray-500">
        Cette action est réversible (soft delete) mais le client ne sera plus visible.
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
import ClientForm from '@/components/ClientForm.vue'
import AssignCommercialModal from '@/components/AssignCommercialModal.vue'
import SortableTh from '@/components/SortableTh.vue'
import { useToast } from '@/composables/useToast'
import { telechargerCSV } from '@/services/exports'
import { contrastTextColor } from '@/utils/color'
import { useTableSort } from '@/composables/useTableSort'
import { useAuthStore } from '@/stores/auth'

const toast = useToast()
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const isAdmin = computed(() => ['admin', 'gerant'].includes(auth.user?.role))

const clients = ref([])
const { sort, toggleSort, sortIcon, sortedRows } = useTableSort('created_at', 'desc')
const tagsList = ref([])
const loading = ref(false)
const exportLoading = ref(false)
const meta = reactive({ current_page: 1, last_page: 1, total: 0, from: 0, to: 0 })
const filters = reactive({ search: '', type: '', statut: '', tag_id: '' })

const showModal = ref(false)
const editingClient = ref(null)
const showDeleteModal = ref(false)
const clientToDelete = ref(null)
const deleting = ref(false)
const showAssignModal = ref(false)
const assignTarget = ref(null)
const assignEndpoint = computed(() => assignTarget.value ? `/clients/${assignTarget.value.id}/assign-commercial` : '/clients/0/assign-commercial')

const sortedClients = computed(() => sortedRows(clients.value, {
  created_at: 'created_at',
  code: 'code',
  nom: 'nom',
  type: 'type',
  tags: (client) => (client.tags || []).map((tag) => tag.libelle).join(', '),
  contact: (client) => client.email || client.telephone || '',
  ville: 'ville',
  statut: 'statut',
}))

let searchTimeout = null
function onSearchInput() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => loadClients(1), 350)
}

async function loadClients(page = 1) {
  loading.value = true
  try {
    const { data } = await api.get('/clients', {
      params: {
        page,
        per_page: 20,
        search: filters.search || undefined,
        type: filters.type || undefined,
        statut: filters.statut || undefined,
        tag_id: filters.tag_id || undefined,
      },
    })
    clients.value = data.data
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

async function loadTags() {
  try {
    const { data } = await api.get('/tags')
    tagsList.value = data
  } catch (e) {}
}

async function exporterCSV() {
  exportLoading.value = true
  try {
    await telechargerCSV('/exports/clients', {}, 'clients_xelltekk.csv')
    toast.success('Export téléchargé')
  } catch (e) {
    toast.error('Erreur lors de l\'export')
  } finally {
    exportLoading.value = false
  }
}

function openCreate() {
  editingClient.value = null
  showModal.value = true
}

function openEdit(client) {
  editingClient.value = { ...client }
  showModal.value = true
}

function openAssignClient(client) {
  assignTarget.value = client
  showAssignModal.value = true
}

function onAssigned() {
  loadClients(meta.current_page)
}

function canSellTo(client) {
  return ['client', 'client_fournisseur'].includes(client.type)
}

function creerDevis(client) {
  router.push({ path: '/devis', query: { create_client: client.id } })
}

function creerFacture(client) {
  router.push({ path: '/factures', query: { create_client: client.id } })
}

async function openFromRoute(id) {
  if (!id) return
  try {
    const { data } = await api.get(`/clients/${id}`)
    editingClient.value = data
    showModal.value = true
    router.replace({ path: '/clients', query: {} })
  } catch (e) {
    toast.error('Client introuvable')
  }
}

function onClientSaved() {
  showModal.value = false
  loadClients(meta.current_page)
}

function confirmDelete(client) {
  clientToDelete.value = client
  showDeleteModal.value = true
}

async function handleDelete() {
  deleting.value = true
  try {
    await api.delete(`/clients/${clientToDelete.value.id}`)
    toast.success(`Client "${clientToDelete.value.nom}" supprimé`)
    showDeleteModal.value = false
    clientToDelete.value = null
    loadClients(meta.current_page)
  } catch (err) {
    toast.error(err.response.data.message || 'Erreur de suppression')
  } finally {
    deleting.value = false
  }
}

function typeLabel(type) {
  return {
    client: 'Client', prospect: 'Prospect',
    fournisseur: 'Fournisseur', client_fournisseur: 'Client/Four.',
  }[type] || type
}

function typeBadgeClass(type) {
  return {
    client: 'bg-blue-100 text-blue-800',
    prospect: 'bg-yellow-100 text-yellow-800',
    fournisseur: 'bg-purple-100 text-purple-800',
    client_fournisseur: 'bg-indigo-100 text-indigo-800',
  }[type] || 'bg-gray-100 text-gray-700'
}

function statutBadgeClass(statut) {
  return {
    actif: 'bg-green-100 text-green-700',
    inactif: 'bg-gray-100 text-gray-600',
    archive: 'bg-red-100 text-red-600',
  }[statut] || 'bg-gray-100 text-gray-700'
}

onMounted(() => {
  loadClients()
  loadTags()
  openFromRoute(route.query.open)
})

watch(() => route.query.open, (id) => {
  openFromRoute(id)
})
</script>
