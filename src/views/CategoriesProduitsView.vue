<template>
  <div class="categories-page space-y-4">
    <section class="categories-toolbar">
      <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div class="min-w-0">
          <p class="text-xs font-black uppercase tracking-[0.18em] text-[color:var(--saytu-primary,#2563eb)]">Stock</p>
          <h2 class="truncate text-lg font-black text-[color:var(--saytu-shell-text,#0f172a)]">Catégories produits</h2>
          <p class="text-sm text-[color:var(--saytu-topbar-subtitle,#64748b)]">
            Liste des familles et sous-familles utilisées dans le catalogue.
          </p>
        </div>

        <div class="flex flex-col gap-2 sm:flex-row">
          <input
            v-model="search"
            type="search"
            class="input min-w-[260px]"
            placeholder="Rechercher code, libellé..."
          />
          <button v-if="canManage" type="button" class="btn-primary whitespace-nowrap" @click="openCreate()">
            + Catégorie
          </button>
        </div>
      </div>
    </section>

    <section class="grid gap-3 sm:grid-cols-3">
      <div class="category-kpi">
        <span>Total catégories</span>
        <strong>{{ flatCategories.length }}</strong>
      </div>
      <div class="category-kpi">
        <span>Parents</span>
        <strong>{{ parentCategories.length }}</strong>
      </div>
      <div class="category-kpi">
        <span>Sous-catégories</span>
        <strong>{{ childCategories.length }}</strong>
      </div>
    </section>

    <section class="overflow-hidden rounded-2xl border border-[color:var(--saytu-border,#e2e8f0)] bg-[color:var(--saytu-surface,#ffffff)]">
      <div class="flex flex-col gap-1 border-b border-[color:var(--saytu-border,#e2e8f0)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 class="text-base font-black text-[color:var(--saytu-shell-text,#0f172a)]">Liste des catégories</h3>
          <p class="text-xs text-[color:var(--saytu-topbar-subtitle,#64748b)]">
            {{ filteredCategories.length }} ligne(s) affichée(s).
          </p>
        </div>
        <button type="button" class="btn-secondary px-3 py-2 text-xs" :disabled="loading" @click="loadCategories">
          {{ loading ? 'Chargement...' : 'Actualiser' }}
        </button>
      </div>

      <div v-if="loading" class="p-10 text-center text-sm text-[color:var(--saytu-topbar-subtitle,#64748b)]">
        Chargement des catégories...
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead class="border-b border-[color:var(--saytu-border,#e2e8f0)] bg-[color:var(--saytu-table-head,#f8fafc)]">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-[color:var(--saytu-topbar-subtitle,#64748b)]">Catégorie</th>
              <th class="px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-[color:var(--saytu-topbar-subtitle,#64748b)]">Code</th>
              <th class="px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-[color:var(--saytu-topbar-subtitle,#64748b)]">Parent</th>
              <th class="px-4 py-3 text-center text-xs font-black uppercase tracking-wide text-[color:var(--saytu-topbar-subtitle,#64748b)]">Produits</th>
              <th class="px-4 py-3 text-center text-xs font-black uppercase tracking-wide text-[color:var(--saytu-topbar-subtitle,#64748b)]">Statut</th>
              <th v-if="canManage" class="px-4 py-3 text-right text-xs font-black uppercase tracking-wide text-[color:var(--saytu-topbar-subtitle,#64748b)]">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[color:var(--saytu-border,#e2e8f0)]">
            <tr
              v-for="category in filteredCategories"
              :key="category.id"
              class="transition hover:bg-[color:var(--saytu-soft,#f1f5ff)]"
            >
              <td class="px-4 py-3">
                <div class="flex items-center gap-3" :style="{ paddingLeft: `${category.level * 1.5}rem` }">
                  <div class="category-icon">
                    <FolderTree v-if="category.level === 0" class="h-4 w-4" />
                    <Folder v-else class="h-4 w-4" />
                  </div>
                  <div class="min-w-0">
                    <div class="truncate font-bold text-[color:var(--saytu-shell-text,#0f172a)]">
                      {{ category.libelle }}
                    </div>
                    <div v-if="category.description" class="truncate text-xs text-[color:var(--saytu-topbar-subtitle,#64748b)]">
                      {{ category.description }}
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-4 py-3 font-mono text-sm text-[color:var(--saytu-topbar-subtitle,#64748b)]">
                {{ category.code }}
              </td>
              <td class="px-4 py-3 text-sm text-[color:var(--saytu-topbar-subtitle,#64748b)]">
                {{ parentLabel(category) }}
              </td>
              <td class="px-4 py-3 text-center font-bold text-[color:var(--saytu-primary,#2563eb)]">
                {{ category.produits_count || 0 }}
              </td>
              <td class="px-4 py-3 text-center">
                <span
                  class="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold"
                  :class="category.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'"
                >
                  <CheckCircle v-if="category.is_active" class="h-3.5 w-3.5" />
                  <XCircle v-else class="h-3.5 w-3.5" />
                  {{ category.is_active ? 'Actif' : 'Inactif' }}
                </span>
              </td>
              <td v-if="canManage" class="px-4 py-3 text-right">
                <div class="inline-flex items-center gap-1">
                  <button type="button" class="category-action" title="Modifier" @click="openEdit(category)">
                    <Pencil class="h-4 w-4" />
                  </button>
                  <button type="button" class="category-action-danger" title="Supprimer" @click="confirmDelete(category)">
                    <Trash2 class="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>

            <tr v-if="filteredCategories.length === 0">
              <td :colspan="canManage ? 6 : 5" class="px-4 py-12 text-center text-sm text-[color:var(--saytu-topbar-subtitle,#64748b)]">
                Aucune catégorie trouvée.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <AppModal v-model="showModal" :title="form.id ? 'Modifier la catégorie' : 'Nouvelle catégorie'" size="md">
      <form class="space-y-4" @submit.prevent="saveCategory">
        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label class="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-200">Libellé *</label>
            <input v-model="form.libelle" class="input" required placeholder="Ex : Imprimantes" @input="syncCodeFromLabel" />
            <p v-if="errors.libelle" class="mt-1 text-xs text-red-600">{{ errors.libelle }}</p>
          </div>

          <div>
            <label class="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-200">Code *</label>
            <input v-model="form.code" class="input font-mono uppercase" required placeholder="EX : IMPRIMANTES" @input="codeTouched = true" />
            <p v-if="errors.code" class="mt-1 text-xs text-red-600">{{ errors.code }}</p>
          </div>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label class="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-200">Catégorie parent</label>
            <select v-model="form.parent_id" class="input">
              <option value="">Aucun parent</option>
              <option
                v-for="category in parentOptions"
                :key="category.id"
                :value="category.id"
              >
                {{ '— '.repeat(category.level) }}{{ category.libelle }}
              </option>
            </select>
            <p v-if="errors.parent_id" class="mt-1 text-xs text-red-600">{{ errors.parent_id }}</p>
          </div>

          <div>
            <label class="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-200">Statut</label>
            <select v-model="form.is_active" class="input">
              <option :value="true">Actif</option>
              <option :value="false">Inactif</option>
            </select>
          </div>
        </div>

        <div>
          <label class="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-200">Description</label>
          <textarea v-model="form.description" class="input min-h-[96px]" placeholder="Description optionnelle"></textarea>
        </div>
      </form>

      <template #footer>
        <button type="button" class="btn-secondary" @click="showModal = false">Annuler</button>
        <button type="button" class="btn-primary" :disabled="saving" @click="saveCategory">
          {{ saving ? 'Enregistrement...' : 'Enregistrer' }}
        </button>
      </template>
    </AppModal>

    <AppModal v-model="showDeleteModal" title="Supprimer la catégorie" size="sm" stack="confirm">
      <p class="text-sm text-slate-700 dark:text-slate-200">
        Supprimer <strong>{{ categoryToDelete?.libelle }}</strong> ?
      </p>
      <p class="mt-2 text-xs text-slate-500">
        La suppression est bloquée si la catégorie contient des produits ou des sous-catégories.
      </p>

      <template #footer>
        <button type="button" class="btn-secondary" @click="showDeleteModal = false">Annuler</button>
        <button type="button" class="btn-danger" :disabled="deleting" @click="deleteCategory">
          {{ deleting ? 'Suppression...' : 'Supprimer' }}
        </button>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { CheckCircle, Folder, FolderTree, Pencil, Trash2, XCircle } from 'lucide-vue-next'
import api from '@/services/api'
import AppModal from '@/components/AppModal.vue'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'

const auth = useAuthStore()
const toast = useToast()

const loading = ref(false)
const saving = ref(false)
const deleting = ref(false)
const search = ref('')
const categories = ref([])
const showModal = ref(false)
const showDeleteModal = ref(false)
const categoryToDelete = ref(null)
const codeTouched = ref(false)
const errors = reactive({})
const form = reactive(emptyForm())

const canManage = computed(() => {
  const role = auth.user?.role
  if (['admin', 'gerant', 'magasinier'].includes(role)) return true
  const permissions = auth.user?.permissions?.flat || []
  return permissions.includes('produits.create') || permissions.includes('produits.update') || permissions.includes('produits.delete')
})

const flatCategories = computed(() => flattenCategories(categories.value))
const parentCategories = computed(() => flatCategories.value.filter((category) => category.level === 0))
const childCategories = computed(() => flatCategories.value.filter((category) => category.level > 0))
const parentOptions = computed(() => flatCategories.value.filter((category) => category.id !== form.id))

const filteredCategories = computed(() => {
  const term = search.value.trim().toLowerCase()
  if (!term) return flatCategories.value

  return flatCategories.value.filter((category) => {
    return [category.code, category.libelle, category.description, parentLabel(category)]
      .some((value) => String(value || '').toLowerCase().includes(term))
  })
})

function emptyForm() {
  return {
    id: null,
    code: '',
    libelle: '',
    parent_id: '',
    description: '',
    is_active: true,
  }
}

function resetForm() {
  Object.assign(form, emptyForm())
  codeTouched.value = false
  clearErrors()
}

function clearErrors() {
  Object.keys(errors).forEach((key) => delete errors[key])
}

function flattenCategories(items, level = 0, parent = null) {
  return (items || []).flatMap((category) => {
    const normalized = {
      ...category,
      level,
      parent_label: parent?.libelle || '',
    }

    return [
      normalized,
      ...flattenCategories(category.enfants || [], level + 1, category),
    ]
  })
}

async function loadCategories() {
  loading.value = true
  try {
    const { data } = await api.get('/categories-produits')
    categories.value = Array.isArray(data) ? data : []
  } catch (error) {
    toast.error(error.response?.data?.message || 'Impossible de charger les catégories.')
  } finally {
    loading.value = false
  }
}

function openCreate(parent = null) {
  resetForm()
  if (parent) form.parent_id = parent.id
  showModal.value = true
}

function openEdit(category) {
  clearErrors()
  Object.assign(form, {
    id: category.id,
    code: category.code || '',
    libelle: category.libelle || '',
    parent_id: category.parent_id || '',
    description: category.description || '',
    is_active: category.is_active !== false,
  })
  codeTouched.value = true
  showModal.value = true
}

async function saveCategory() {
  clearErrors()
  saving.value = true

  const payload = {
    code: normalizeCode(form.code || form.libelle),
    libelle: String(form.libelle || '').trim(),
    parent_id: form.parent_id || null,
    description: String(form.description || '').trim() || null,
    is_active: Boolean(form.is_active),
  }

  try {
    if (form.id) {
      await api.put(`/categories-produits/${form.id}`, payload)
      toast.success('Catégorie modifiée.')
    } else {
      await api.post('/categories-produits', payload)
      toast.success('Catégorie créée.')
    }

    showModal.value = false
    await loadCategories()
  } catch (error) {
    const responseErrors = error.response?.data?.errors || {}
    Object.entries(responseErrors).forEach(([key, messages]) => {
      errors[key] = Array.isArray(messages) ? messages[0] : messages
    })
    toast.error(error.response?.data?.message || 'Enregistrement impossible.')
  } finally {
    saving.value = false
  }
}

function confirmDelete(category) {
  categoryToDelete.value = category
  showDeleteModal.value = true
}

async function deleteCategory() {
  if (!categoryToDelete.value) return

  deleting.value = true
  try {
    await api.delete(`/categories-produits/${categoryToDelete.value.id}`)
    toast.success('Catégorie supprimée.')
    showDeleteModal.value = false
    categoryToDelete.value = null
    await loadCategories()
  } catch (error) {
    toast.error(error.response?.data?.message || 'Suppression impossible.')
  } finally {
    deleting.value = false
  }
}

function syncCodeFromLabel() {
  if (codeTouched.value || form.code) return
  form.code = normalizeCode(form.libelle)
}

function normalizeCode(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 30)
    .toUpperCase()
}

function parentLabel(category) {
  return category.parent_label || '—'
}

onMounted(loadCategories)
</script>

<style scoped>
.categories-page {
  color: var(--saytu-shell-text, #0f172a);
}

.categories-toolbar,
.category-kpi {
  border: 1px solid color-mix(in srgb, var(--saytu-primary, #2563eb) 14%, var(--saytu-border, #e2e8f0));
  background:
    linear-gradient(135deg, color-mix(in srgb, var(--saytu-primary, #2563eb) 7%, transparent), transparent 52%),
    var(--saytu-surface, #ffffff);
  box-shadow: 0 10px 26px color-mix(in srgb, var(--saytu-primary, #2563eb) 6%, transparent);
}

.categories-toolbar {
  border-radius: 1.25rem;
  padding: 1rem;
}

.category-kpi {
  border-radius: 1rem;
  padding: .85rem 1rem;
}

.category-kpi span {
  display: block;
  color: var(--saytu-topbar-subtitle, #64748b);
  font-size: .72rem;
  font-weight: 900;
  letter-spacing: .08em;
  text-transform: uppercase;
}

.category-kpi strong {
  margin-top: .2rem;
  display: block;
  color: var(--saytu-primary, #2563eb);
  font-size: 1.45rem;
  font-weight: 950;
  line-height: 1.1;
}

.category-icon {
  display: inline-flex;
  height: 2.25rem;
  width: 2.25rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: .9rem;
  background: color-mix(in srgb, var(--saytu-primary, #2563eb) 12%, transparent);
  color: var(--saytu-primary, #2563eb);
}

.category-action,
.category-action-danger {
  display: inline-flex;
  height: 2rem;
  width: 2rem;
  align-items: center;
  justify-content: center;
  border-radius: .75rem;
  transition: background .18s ease, color .18s ease, transform .18s ease;
}

.category-action {
  color: var(--saytu-primary, #2563eb);
}

.category-action:hover {
  background: color-mix(in srgb, var(--saytu-primary, #2563eb) 12%, transparent);
}

.category-action-danger {
  color: #dc2626;
}

.category-action-danger:hover {
  background: #fee2e2;
}
</style>
