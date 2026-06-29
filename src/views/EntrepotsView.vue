<template>
  <div>
    <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p class="text-sm text-gray-600">Gerez vos entrepots, zones et emplacements de stockage</p>
      <button v-if="canManage" @click="openCreate" class="btn-primary">+ Nouvel entrepot</button>
    </div>

    <div class="mb-4 flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 sm:flex-row sm:items-center">
      <input
        v-model="filters.search"
        @input="onSearchInput"
        type="search"
        class="input flex-1"
        placeholder="Rechercher code, libelle, ville ou pays..."
      />
      <label class="inline-flex items-center gap-2 text-sm text-gray-600">
        <input v-model="filters.actifs_seulement" @change="loadEntrepots(1)" type="checkbox" class="h-4 w-4" />
        Actifs seulement
      </label>
    </div>

    <div v-if="loading" class="rounded-lg bg-white p-12 text-center text-gray-500">
      Chargement...
    </div>

    <div v-else class="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div
        v-for="entrepot in entrepots"
        :key="entrepot.id"
        class="rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
      >
        <div class="mb-3 flex items-start justify-between gap-3">
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <h3 class="truncate text-lg font-semibold text-gray-900">{{ entrepot.libelle }}</h3>
              <span v-if="!entrepot.is_active" class="badge bg-red-100 text-xs text-red-700">Inactif</span>
            </div>
            <p class="text-xs font-mono text-gray-500">{{ entrepot.code }}</p>
          </div>

          <div class="flex shrink-0 gap-1">
            <button v-if="canManage" @click="openEdit(entrepot)" class="text-sm text-xelltekk-600 hover:text-xelltekk-800" title="Modifier">Modifier</button>
            <button @click="openDetails(entrepot)" class="text-sm text-xelltekk-600 hover:text-xelltekk-800" title="Details">Details</button>
            <button v-if="canManage" @click="confirmDelete(entrepot)" class="text-sm text-red-600 hover:text-red-800" title="Supprimer">Supprimer</button>
          </div>
        </div>

        <div class="space-y-1 text-sm text-gray-600">
          <div v-if="entrepot.ville">{{ entrepot.ville }}<span v-if="entrepot.pays">, {{ entrepot.pays }}</span></div>
          <div v-if="entrepot.responsable">Responsable : {{ entrepot.responsable?.name || 'Utilisateur' }}</div>
          <div class="mt-2 flex items-center gap-4 border-t border-gray-100 pt-2 text-xs text-gray-500">
            <span><strong>{{ entrepot.zones_count || 0 }}</strong> zone(s)</span>
          </div>
        </div>
      </div>

      <div v-if="entrepots.length === 0" class="rounded-lg bg-white p-12 text-center text-gray-400 md:col-span-2">
        Aucun entrepot trouve.
      </div>
    </div>

    <AppPagination v-if="meta.total > 0" :meta="meta" label="entrepots" @page="loadEntrepots" />

    <AppModal v-model="showModal" :title="editingEntrepot ? `Modifier ${editingEntrepot.libelle}` : 'Nouvel entrepot'" size="md">
      <EntrepotForm :entrepot="editingEntrepot" @saved="onSaved" @cancel="showModal = false" />
    </AppModal>

    <AppModal v-model="showDetailsModal" :title="detailsEntrepot ? `Details : ${detailsEntrepot.libelle}` : ''" size="lg">
      <EntrepotDetails
        v-if="detailsEntrepot"
        :entrepot="detailsEntrepot"
        :can-manage="canManage"
        @refresh="refreshDetails"
      />
    </AppModal>

    <AppModal v-model="showDeleteModal" title="Supprimer l'entrepot" size="sm">
      <p class="text-gray-700">Supprimer l'entrepot <strong>{{ entrepotToDelete.libelle }}</strong> </p>
      <p class="mt-2 text-xs text-gray-500">Impossible si un stock positif existe encore dans cet entrepot.</p>
      <template #footer>
        <button @click="showDeleteModal = false" class="btn-secondary">Annuler</button>
        <button @click="handleDelete" :disabled="deleting" class="btn-danger">
          <span v-if="deleting">...</span><span v-else>Supprimer</span>
        </button>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import api from '@/services/api'
import AppModal from '@/components/AppModal.vue'
import AppPagination from '@/components/AppPagination.vue'
import EntrepotForm from '@/components/EntrepotForm.vue'
import EntrepotDetails from '@/components/EntrepotDetails.vue'
import { useToast } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth'

const toast = useToast()
const auth = useAuthStore()
const canManage = auth.user?.role === 'admin' || auth.user?.role === 'magasinier'

const entrepots = ref([])
const loading = ref(false)
const filters = reactive({ search: '', actifs_seulement: false })
const meta = reactive({ current_page: 1, last_page: 1, total: 0, from: 0, to: 0 })

const showModal = ref(false)
const editingEntrepot = ref(null)
const showDetailsModal = ref(false)
const detailsEntrepot = ref(null)
const showDeleteModal = ref(false)
const entrepotToDelete = ref(null)
const deleting = ref(false)
let searchTimeout = null

async function loadEntrepots(page = 1) {
  loading.value = true
  try {
    const { data } = await api.get('/entrepots', {
      params: {
        page,
        per_page: 12,
        search: filters.search.trim() || undefined,
        actifs_seulement: filters.actifs_seulement ? 1 : undefined,
      },
    })
    const liste = Array.isArray(data) ? data : (data.data || [])
    entrepots.value = liste
    Object.assign(meta, Array.isArray(data) ? {
      current_page: 1,
      last_page: 1,
      total: liste.length,
      from: liste.length > 0 ? 1 : 0,
      to: liste.length,
    } : {
      current_page: data.current_page || 1,
      last_page: data.last_page || 1,
      total: data.total || 0,
      from: data.from || 0,
      to: data.to || 0,
    })
  } catch (e) {
    toast.error('Erreur de chargement')
  } finally {
    loading.value = false
  }
}

function onSearchInput() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => loadEntrepots(1), 300)
}

function openCreate() {
  editingEntrepot.value = null
  showModal.value = true
}

function openEdit(entrepot) {
  editingEntrepot.value = { ...entrepot }
  showModal.value = true
}

async function openDetails(entrepot) {
  const { data } = await api.get(`/entrepots/${entrepot.id}`)
  detailsEntrepot.value = data.entrepot
  showDetailsModal.value = true
}

async function refreshDetails() {
  if (!detailsEntrepot.value.id) return
  const { data } = await api.get(`/entrepots/${detailsEntrepot.value.id}`)
  detailsEntrepot.value = data.entrepot
  await loadEntrepots(meta.current_page)
}

function onSaved() {
  showModal.value = false
  loadEntrepots(meta.current_page)
}

function confirmDelete(entrepot) {
  entrepotToDelete.value = entrepot
  showDeleteModal.value = true
}

async function handleDelete() {
  deleting.value = true
  try {
    await api.delete(`/entrepots/${entrepotToDelete.value.id}`)
    toast.success('Entrepot supprime')
    showDeleteModal.value = false
    loadEntrepots(meta.current_page)
  } catch (err) {
    toast.error(err.response.data.message || 'Erreur')
  } finally {
    deleting.value = false
  }
}

onMounted(loadEntrepots)
</script>
