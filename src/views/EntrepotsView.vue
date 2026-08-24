<template>
  <div class="entrepots-page space-y-4">
    <section class="entrepots-toolbar">
      <div class="entrepots-toolbar-main">
        <div>
          <p class="text-xs font-black uppercase tracking-[0.18em] text-[color:var(--saytu-primary,#2563eb)]">Entrepôts</p>
          <h2 class="truncate text-lg font-black text-[color:var(--saytu-shell-text,#0f172a)]">Sites, zones & emplacements</h2>
          <p class="text-sm text-[color:var(--saytu-topbar-subtitle,#64748b)]">
            Pilotez vos lieux de stockage, responsables et zones en une vue compacte.
          </p>
        </div>
        <button v-if="canManage" @click="openCreate" class="btn-primary whitespace-nowrap">+ Entrepôt</button>
      </div>

      <div class="entrepots-filter-row">
        <input
          v-model="filters.search"
          @input="onSearchInput"
          type="search"
          class="input entrepots-search"
          placeholder="🔍 Code, libellé, ville, pays, responsable..."
        />
        <label class="entrepots-toggle" :class="{ 'entrepots-toggle-active': filters.actifs_seulement }">
          <input v-model="filters.actifs_seulement" @change="loadEntrepots(1)" type="checkbox" class="sr-only" />
          <span>Actifs seulement</span>
        </label>
      </div>
    </section>

    <section class="entrepots-strip">
      <div class="entrepots-stat-pill">
        <span>Entrepôts</span>
        <strong>{{ entrepotsSummary.total }}</strong>
      </div>
      <div class="entrepots-stat-pill">
        <span>Actifs affichés</span>
        <strong>{{ entrepotsSummary.actifs }}</strong>
      </div>
      <div class="entrepots-stat-pill">
        <span>Zones</span>
        <strong>{{ entrepotsSummary.zones }}</strong>
      </div>
      <div class="entrepots-stat-pill">
        <span>Villes</span>
        <strong>{{ entrepotsSummary.villes }}</strong>
      </div>
    </section>

    <div v-if="loading" class="rounded-2xl border border-[color:var(--saytu-border,#e2e8f0)] bg-[color:var(--saytu-surface,#ffffff)] p-12 text-center text-[color:var(--saytu-topbar-subtitle,#64748b)]">
      Chargement...
    </div>

    <section v-else class="entrepots-list">
      <div
        v-for="entrepot in entrepots"
        :key="entrepot.id"
        class="entrepots-row"
      >
        <div class="min-w-0">
          <div class="flex flex-wrap items-center gap-2">
            <span class="font-mono text-xs font-black text-[color:var(--saytu-primary,#2563eb)]">{{ entrepot.code }}</span>
            <h3 class="truncate text-base font-black text-[color:var(--saytu-shell-text,#0f172a)]">{{ entrepot.libelle }}</h3>
            <span
              class="rounded-full px-2 py-0.5 text-[10px] font-black uppercase"
              :class="entrepot.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'"
            >
              {{ entrepot.is_active ? 'Actif' : 'Inactif' }}
            </span>
          </div>

          <div class="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[color:var(--saytu-topbar-subtitle,#64748b)]">
            <span>{{ locationLabel(entrepot) }}</span>
            <span>Responsable : {{ entrepot.responsable?.name || 'Non affecté' }}</span>
            <span><strong class="text-[color:var(--saytu-shell-text,#0f172a)]">{{ entrepot.zones_count || 0 }}</strong> zone(s)</span>
          </div>
        </div>

        <div class="entrepots-row-actions">
          <button @click="openDetails(entrepot)" class="entrepots-action-primary" title="Détails">Détails</button>
          <button v-if="canManage" @click="openEdit(entrepot)" class="entrepots-action" title="Modifier">Modifier</button>
          <button v-if="canManage" @click="confirmDelete(entrepot)" class="entrepots-action-danger" title="Supprimer">Supprimer</button>
        </div>
      </div>

      <div v-if="entrepots.length === 0" class="p-12 text-center text-sm text-[color:var(--saytu-topbar-subtitle,#64748b)]">
        Aucun entrepôt trouvé.
      </div>
    </section>

    <AppPagination v-if="meta.total > 0" :meta="meta" label="entrepôts" @page="loadEntrepots" />

    <AppModal v-model="showModal" :title="editingEntrepot ? `Modifier ${editingEntrepot.libelle}` : 'Nouvel entrepôt'" size="md">
      <EntrepotForm :entrepot="editingEntrepot" @saved="onSaved" @cancel="showModal = false" />
    </AppModal>

    <AppModal v-model="showDetailsModal" :title="detailsEntrepot ? `Détails : ${detailsEntrepot.libelle}` : ''" size="lg">
      <EntrepotDetails
        v-if="detailsEntrepot"
        :entrepot="detailsEntrepot"
        :can-manage="canManage"
        @refresh="refreshDetails"
      />
    </AppModal>

    <AppModal v-model="showDeleteModal" title="Supprimer l'entrepôt" size="sm">
      <p class="text-gray-700">Supprimer l'entrepôt <strong>{{ entrepotToDelete?.libelle }}</strong> ?</p>
      <p class="mt-2 text-xs text-gray-500">Impossible si un stock positif existe encore dans cet entrepôt.</p>
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
import { computed, reactive, ref, onMounted } from 'vue'
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

const entrepotsSummary = computed(() => {
  const rows = entrepots.value || []
  const villes = new Set(rows.map((entrepot) => entrepot.ville).filter(Boolean))

  return {
    total: meta.total || rows.length,
    actifs: rows.filter((entrepot) => entrepot.is_active).length,
    zones: rows.reduce((sum, entrepot) => sum + Number(entrepot.zones_count || 0), 0),
    villes: villes.size,
  }
})

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

function locationLabel(entrepot) {
  const location = [entrepot.ville, entrepot.pays].filter(Boolean).join(', ')
  return location || 'Localisation non renseignée'
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
    toast.success('Entrepôt supprimé')
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

<style scoped>
.entrepots-page {
  color: var(--saytu-shell-text, #0f172a);
}

.entrepots-toolbar {
  border: 1px solid color-mix(in srgb, var(--saytu-primary, #2563eb) 14%, var(--saytu-border, #e2e8f0));
  border-radius: 1.25rem;
  background:
    linear-gradient(135deg, color-mix(in srgb, var(--saytu-primary, #2563eb) 7%, transparent), transparent 48%),
    var(--saytu-surface, #ffffff);
  box-shadow: 0 10px 30px color-mix(in srgb, var(--saytu-primary, #2563eb) 7%, transparent);
  padding: 1rem;
}

.entrepots-toolbar-main {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.entrepots-filter-row {
  margin-top: .85rem;
  display: grid;
  grid-template-columns: minmax(220px, 1fr) auto;
  gap: .65rem;
  align-items: center;
}

.entrepots-search {
  min-width: 0;
}

.entrepots-toggle {
  display: inline-flex;
  min-height: 2.65rem;
  cursor: pointer;
  align-items: center;
  justify-content: center;
  border-radius: .9rem;
  border: 1px solid color-mix(in srgb, var(--saytu-primary, #2563eb) 14%, var(--saytu-border, #e2e8f0));
  background: color-mix(in srgb, var(--saytu-surface, #ffffff) 92%, var(--saytu-primary, #2563eb) 8%);
  padding: .55rem .95rem;
  color: var(--saytu-topbar-subtitle, #64748b);
  font-size: .82rem;
  font-weight: 800;
  transition: border-color .18s ease, background .18s ease, color .18s ease, box-shadow .18s ease;
}

.entrepots-toggle-active {
  border-color: transparent;
  background: linear-gradient(135deg, var(--saytu-primary, #2563eb), var(--saytu-brand-to, #06b6d4));
  color: #ffffff;
  box-shadow: 0 10px 24px color-mix(in srgb, var(--saytu-primary, #2563eb) 18%, transparent);
}

.entrepots-strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: .65rem;
}

.entrepots-stat-pill {
  min-height: 4.15rem;
  border-radius: 1rem;
  border: 1px solid color-mix(in srgb, var(--saytu-primary, #2563eb) 14%, var(--saytu-border, #e2e8f0));
  background: color-mix(in srgb, var(--saytu-surface, #ffffff) 92%, var(--saytu-primary, #2563eb) 8%);
  padding: .75rem .85rem;
}

.entrepots-stat-pill span {
  display: block;
  color: var(--saytu-topbar-subtitle, #64748b);
  font-size: .72rem;
  font-weight: 800;
  letter-spacing: .08em;
  text-transform: uppercase;
}

.entrepots-stat-pill strong {
  margin-top: .25rem;
  display: block;
  color: var(--saytu-shell-text, #0f172a);
  font-size: 1.45rem;
  font-weight: 950;
  line-height: 1.1;
}

.entrepots-list {
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--saytu-primary, #2563eb) 12%, var(--saytu-border, #e2e8f0));
  border-radius: 1.25rem;
  background: var(--saytu-surface, #ffffff);
}

.entrepots-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: .85rem;
  align-items: center;
  border-bottom: 1px solid color-mix(in srgb, var(--saytu-border, #e2e8f0) 88%, transparent);
  padding: .9rem 1rem;
  transition: background .18s ease;
}

.entrepots-row:hover {
  background: color-mix(in srgb, var(--saytu-primary, #2563eb) 5%, transparent);
}

.entrepots-row:last-child {
  border-bottom: 0;
}

.entrepots-row-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: .45rem;
}

.entrepots-action,
.entrepots-action-primary,
.entrepots-action-danger {
  border-radius: 999px;
  padding: .42rem .75rem;
  font-size: .78rem;
  font-weight: 850;
  transition: background .18s ease, color .18s ease, border-color .18s ease;
}

.entrepots-action-primary {
  background: color-mix(in srgb, var(--saytu-primary, #2563eb) 12%, var(--saytu-surface, #ffffff));
  color: var(--saytu-primary, #2563eb);
}

.entrepots-action {
  color: var(--saytu-topbar-subtitle, #64748b);
}

.entrepots-action-danger {
  color: #dc2626;
}

.entrepots-action:hover,
.entrepots-action-primary:hover {
  background: color-mix(in srgb, var(--saytu-primary, #2563eb) 16%, var(--saytu-surface, #ffffff));
  color: var(--saytu-primary, #2563eb);
}

.entrepots-action-danger:hover {
  background: #fee2e2;
}

@media (max-width: 768px) {
  .entrepots-toolbar-main,
  .entrepots-row {
    grid-template-columns: 1fr;
  }

  .entrepots-toolbar-main {
    flex-direction: column;
  }

  .entrepots-filter-row,
  .entrepots-strip {
    grid-template-columns: 1fr;
  }

  .entrepots-row-actions {
    justify-content: flex-start;
  }
}
</style>
