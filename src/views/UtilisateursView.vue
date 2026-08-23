<template>
  <div class="space-y-5">
    <section class="access-hero overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div class="min-w-0">
          <span class="inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.2em]">
            Administration sécurité
          </span>
          <h1 class="mt-3 text-2xl font-black text-slate-950 dark:text-white">
            Accès & Utilisateurs
          </h1>
          <p class="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
            Gérez les comptes, les rôles, les statuts et les actions sensibles liées aux accès de l’application.
          </p>
        </div>

        <div class="flex flex-wrap gap-2">
          <button @click="exporterCSV" :disabled="exportLoading" class="btn-secondary whitespace-nowrap">
            {{ exportLoading ? 'Export...' : 'Exporter CSV' }}
          </button>
          <button @click="openCreate" class="btn-primary whitespace-nowrap">+ Nouvel utilisateur</button>
        </div>
      </div>
    </section>

    <section class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <button
        v-for="card in overviewCards"
        :key="card.key"
        type="button"
        @click="applyUserFilter(card.role, card.isActive)"
        class="access-kpi rounded-3xl border bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:bg-slate-900"
        :class="userCardClass(card.role, card.isActive)"
        :style="{ '--kpi-accent': card.color }"
      >
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-xs font-bold uppercase tracking-wide">{{ card.label }}</p>
            <p class="mt-3 text-2xl font-black">{{ card.value }}</p>
            <p class="mt-1 text-xs">{{ card.sub }}</p>
          </div>
          <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-xs font-black">
            {{ card.short }}
          </span>
        </div>
      </button>
    </section>

    <section class="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div class="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 class="text-lg font-black text-slate-950 dark:text-white">Centre de contrôle des accès</h2>
          <p class="text-sm text-slate-500 dark:text-slate-400">Les points importants pour sécuriser les utilisateurs et leurs permissions.</p>
        </div>
        <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          Admin uniquement
        </span>
      </div>

      <div class="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        <article
          v-for="module in accessModules"
          :key="module.key"
          class="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-[var(--saytu-primary)] hover:bg-white dark:border-slate-800 dark:bg-slate-950/40 dark:hover:bg-slate-900"
        >
          <div class="flex items-start justify-between gap-3">
            <div>
              <h3 class="font-bold text-slate-900 dark:text-white">{{ module.title }}</h3>
              <p class="mt-1 text-sm leading-5 text-slate-500 dark:text-slate-400">{{ module.description }}</p>
            </div>
            <span class="rounded-full px-2.5 py-1 text-xs font-bold" :class="module.badgeClass">
              {{ module.status }}
            </span>
          </div>
        </article>
      </div>
    </section>

    <!-- Header + filtres -->
    <div class="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div class="flex flex-col md:flex-row gap-3">
        <input v-model="filters.search" @input="onSearchInput" type="search"
               placeholder="🔍 Nom, email, téléphone..." class="input flex-1" />

        <select v-model="filters.role" @change="loadUsers(1)" class="input md:w-44">
          <option value="">Tous rôles</option>
          <option value="admin">🔴 Administrateur</option>
          <option value="gerant">🟣 Gérant</option>
          <option value="commercial">🟢 Commercial</option>
          <option value="magasinier">🔵 Gestionnaire de stock</option>
          <option value="comptable">🟡 Comptable</option>
          <option value="caissier">Caissier</option>
        </select>

        <select v-model="filters.is_active" @change="loadUsers(1)" class="input md:w-40">
          <option value="">Tous statuts</option>
          <option value="1">Actifs</option>
          <option value="0">Inactifs</option>
        </select>

        <button type="button" @click="resetFilters" class="btn-secondary whitespace-nowrap">Réinitialiser</button>
      </div>
    </div>

    <div v-if="loading" class="rounded-3xl bg-white p-12 text-center text-gray-500 shadow-sm dark:bg-slate-900">Chargement...</div>

    <div v-else class="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <table class="w-full">
        <thead class="bg-gray-50 border-b border-gray-200">
          <tr>
            <SortableTh column="utilisateur" :active="sort.key === 'utilisateur'" :icon="sortIcon('utilisateur')" @sort="toggleSort">Utilisateur</SortableTh>
            <SortableTh column="email" :active="sort.key === 'email'" :icon="sortIcon('email')" @sort="toggleSort">Email</SortableTh>
            <SortableTh column="role" :active="sort.key === 'role'" :icon="sortIcon('role')" align="center" @sort="toggleSort">Rôle</SortableTh>
            <SortableTh column="activite" :active="sort.key === 'activite'" :icon="sortIcon('activite')" align="center" @sort="toggleSort">Activité</SortableTh>
            <SortableTh column="statut" :active="sort.key === 'statut'" :icon="sortIcon('statut')" align="center" @sort="toggleSort">Statut</SortableTh>
            <th class="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="u in sortedUsers" :key="u.id" class="hover:bg-gray-50" :class="!u.is_active ? 'opacity-60' : ''">
            <td class="px-3 py-3">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 overflow-hidden rounded-full flex items-center justify-center text-white font-bold text-sm" :style="`background: ${avatarColor(u)}`">
                  <img v-if="photoUrl(u)" :src="photoUrl(u)" :alt="u.name" class="h-full w-full object-cover" />
                  <span v-else>{{ initiales(u.name) }}</span>
                </div>
                <div>
                  <div class="font-medium text-gray-900">{{ u.name }}</div>
                  <div v-if="u.phone" class="text-xs text-gray-500">📞 {{ u.phone }}</div>
                </div>
              </div>
            </td>
            <td class="px-3 py-3 text-sm text-gray-700">{{ u.email }}</td>
            <td class="px-3 py-3 text-center">
              <span class="badge text-xs" :class="roleBadge(u.role)">{{ roleEmoji(u.role) }} {{ roleLabel(u.role) }}</span>
            </td>
            <td class="px-3 py-3 text-center text-xs text-gray-600">
              <span v-if="u.clients_geres_count">{{ u.clients_geres_count }} clients</span>
              <span v-if="u.factures_commercial_count" class="ml-2">{{ u.factures_commercial_count }} factures</span>
              <span v-if="!u.clients_geres_count && !u.factures_commercial_count" class="text-gray-400">–</span>
            </td>
            <td class="px-3 py-3 text-center">
              <span class="badge text-xs" :class="u.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'">
                {{ u.is_active ? '✓ Actif' : '🚫 Inactif' }}
              </span>
            </td>
            <td class="px-3 py-3 text-right whitespace-nowrap">
              <button @click="openEdit(u)" class="text-xelltekk-600 hover:text-xelltekk-800 mr-2" title="Modifier">✏️</button>
              <button @click="openResetPassword(u)" class="text-blue-600 hover:text-blue-800 mr-2" title="Réinitialiser mot de passe">🔑</button>
              <button @click="toggleActif(u)" :class="u.is_active ? 'text-orange-600 hover:text-orange-800' : 'text-green-600 hover:text-green-800'" class="mr-2" :title="u.is_active ? 'Désactiver' : 'Réactiver'">
                {{ u.is_active ? '🚫' : '✅' }}
              </button>
              <button @click="confirmDelete(u)" class="text-red-600 hover:text-red-800" title="Supprimer">🗑️</button>
            </td>
          </tr>
          <tr v-if="users.length === 0">
            <td colspan="6" class="px-4 py-12 text-center text-gray-400 text-sm">Aucun utilisateur</td>
          </tr>
        </tbody>
      </table>

      <div v-if="meta.total > 0" class="px-4 py-3 border-t border-gray-200 flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
        <div class="text-gray-600">
          <strong>{{ meta.from }}</strong>–<strong>{{ meta.to }}</strong> sur <strong>{{ meta.total }}</strong> utilisateurs
        </div>
        <div class="flex gap-2">
          <button @click="loadUsers(meta.current_page - 1)" :disabled="meta.current_page === 1" class="btn-secondary px-3 py-1.5 disabled:opacity-40">←</button>
          <span class="px-3 py-1.5 text-gray-600">{{ meta.current_page }} / {{ meta.last_page }}</span>
          <button @click="loadUsers(meta.current_page + 1)" :disabled="meta.current_page === meta.last_page" class="btn-secondary px-3 py-1.5 disabled:opacity-40">→</button>
        </div>
      </div>
    </div>

    <!-- Modal création/édition -->
    <AppModal v-model="showModal" :title="editingUser ? `Modifier ${editingUser.name}` : 'Nouvel utilisateur'" size="md">
      <UserForm :user="editingUser" @saved="onSaved" @cancel="showModal = false" />
    </AppModal>

    <!-- Modal mot de passe affiché -->
    <AppModal v-model="showPasswordModal" title="🔑 Mot de passe généré" size="sm">
      <div class="space-y-3">
        <p class="text-sm text-gray-700">Voici le mot de passe pour <strong>{{ passwordUserName }}</strong> :</p>
        <div class="p-4 bg-blue-50 border-2 border-blue-300 rounded-lg text-center">
          <div class="font-mono text-2xl font-bold text-blue-900 select-all">{{ generatedPassword }}</div>
        </div>
        <p class="text-xs text-orange-600">⚠️ Notez-le maintenant ! Il ne sera plus affiché.</p>
        <button @click="copierMotDePasse" class="btn-secondary w-full">📋 Copier dans le presse-papier</button>
      </div>
      <template #footer>
        <button @click="showPasswordModal = false" class="btn-primary w-full">J'ai bien noté le mot de passe</button>
      </template>
    </AppModal>

    <!-- Modal reset password -->
    <AppModal v-model="showResetModal" :title="resetUser ? `Mot de passe pour ${resetUser.name}` : ''" size="sm">
      <div v-if="resetUser" class="space-y-3">
        <p class="text-sm">Choisissez comment réinitialiser :</p>
        <label class="flex items-center gap-2 p-3 border rounded cursor-pointer hover:bg-gray-50">
          <input type="radio" v-model="resetMode" value="generate" />
          <span><strong>Générer automatiquement</strong> un nouveau mot de passe</span>
        </label>
        <label class="flex items-center gap-2 p-3 border rounded cursor-pointer hover:bg-gray-50">
          <input type="radio" v-model="resetMode" value="custom" />
          <span><strong>Définir un mot de passe</strong> personnalisé</span>
        </label>
        <input v-if="resetMode === 'custom'" v-model="resetForm.password" type="text" class="input" placeholder="Min. 6 caractères" />
      </div>
      <template #footer>
        <button @click="showResetModal = false" class="btn-secondary">Annuler</button>
        <button @click="handleResetPassword" :disabled="resetting" class="btn-primary">
          <span v-if="resetting">...</span>
          <span v-else>🔑 Réinitialiser</span>
        </button>
      </template>
    </AppModal>

    <!-- Modal suppression -->
    <AppModal v-model="showDeleteModal" title="Supprimer l'utilisateur " size="sm">
      <p class="text-gray-700">Supprimer définitivement <strong>{{ userToDelete.name }}</strong> </p>
      <p class="text-xs text-gray-500 mt-2">Les clients/factures/devis qu'il gérait perdront le lien avec lui.</p>
      <template #footer>
        <button @click="showDeleteModal = false" class="btn-secondary">Annuler</button>
        <button @click="handleDelete" :disabled="deleting" class="btn-danger">
          <span v-if="deleting">...</span>
          <span v-else>Supprimer</span>
        </button>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { computed, ref, reactive, onMounted } from 'vue'
import api from '@/services/api'
import AppModal from '@/components/AppModal.vue'
import UserForm from '@/components/UserForm.vue'
import SortableTh from '@/components/SortableTh.vue'
import { useToast } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth'
import { useTableSort } from '@/composables/useTableSort'
import { telechargerCSV } from '@/services/exports'

const toast = useToast()
const auth = useAuthStore()
const users = ref([])
const { sort, toggleSort, sortIcon, sortedRows } = useTableSort('created_at', 'desc')
const loading = ref(false)
const exportLoading = ref(false)
const stats = reactive({ total: 0, actifs: 0, par_role: {} })
const meta = reactive({ current_page: 1, last_page: 1, total: 0, from: 0, to: 0 })
const filters = reactive({ search: '', role: '', is_active: '' })

const showModal = ref(false)
const editingUser = ref(null)

const showDeleteModal = ref(false)
const userToDelete = ref(null)
const deleting = ref(false)

const showPasswordModal = ref(false)
const generatedPassword = ref('')
const passwordUserName = ref('')

const showResetModal = ref(false)
const resetUser = ref(null)
const resetMode = ref('generate')
const resetForm = reactive({ password: '' })
const resetting = ref(false)

const inactiveUsersCount = computed(() => Math.max(0, Number(stats.total || 0) - Number(stats.actifs || 0)))

const overviewCards = computed(() => [
  {
    key: 'total',
    label: 'Utilisateurs',
    value: stats.total || 0,
    sub: 'Tous les comptes créés',
    short: 'US',
    role: '',
    isActive: '',
    color: 'var(--saytu-primary)',
  },
  {
    key: 'actifs',
    label: 'Comptes actifs',
    value: stats.actifs || 0,
    sub: 'Peuvent se connecter',
    short: 'OK',
    role: '',
    isActive: '1',
    color: 'var(--saytu-secondary)',
  },
  {
    key: 'inactifs',
    label: 'Comptes bloqués',
    value: inactiveUsersCount.value,
    sub: 'Accès désactivé',
    short: 'OFF',
    role: '',
    isActive: '0',
    color: 'var(--saytu-danger)',
  },
  {
    key: 'admins',
    label: 'Administrateurs',
    value: stats.par_role?.admin || 0,
    sub: 'Accès complet à l’application',
    short: 'ADM',
    role: 'admin',
    isActive: '',
    color: 'var(--saytu-accent)',
  },
])

const accessModules = computed(() => [
  {
    key: 'roles',
    title: 'Rôles & permissions',
    description: 'Admin, gérant, commercial, comptable, caissier et magasinier avec accès séparés.',
    status: `${activeRolesCount.value} rôle(s)`,
    badgeClass: 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-200',
  },
  {
    key: 'security',
    title: 'Sécurité des comptes',
    description: 'Réinitialisation de mot de passe, activation/désactivation et suppression contrôlée.',
    status: 'Protégé',
    badgeClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200',
  },
  {
    key: 'sessions',
    title: 'Sessions',
    description: 'Prévu pour suivre les connexions ouvertes et déconnecter un appareil à distance.',
    status: 'À venir',
    badgeClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
  },
  {
    key: 'journal',
    title: 'Journal accès',
    description: 'Prévu pour afficher connexions réussies, échecs, changements de rôle et resets.',
    status: 'Audit',
    badgeClass: 'bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-200',
  },
  {
    key: 'admins',
    title: 'Comptes sensibles',
    description: 'Surveillance rapide du nombre d’administrateurs et gérants actifs.',
    status: `${sensitiveUsersCount.value} sensible(s)`,
    badgeClass: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200',
  },
  {
    key: 'inactive',
    title: 'Accès bloqués',
    description: 'Vérifier les comptes inactifs avant suppression définitive ou réactivation.',
    status: `${inactiveUsersCount.value} bloqué(s)`,
    badgeClass: 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-200',
  },
])

const activeRolesCount = computed(() => Object.values(stats.par_role || {}).filter((count) => Number(count || 0) > 0).length)
const sensitiveUsersCount = computed(() => Number(stats.par_role?.admin || 0) + Number(stats.par_role?.gerant || 0))

const sortedUsers = computed(() => sortedRows(users.value, {
  created_at: 'created_at',
  utilisateur: 'name',
  email: 'email',
  role: 'role',
  activite: (user) => Number(user.clients_geres_count || 0) + Number(user.factures_commercial_count || 0),
  statut: (user) => (user.is_active ? 1 : 0),
}))

let searchTimeout = null
function onSearchInput() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => loadUsers(1), 350)
}

function applyUserFilter(role, isActive) {
  filters.role = role
  filters.is_active = isActive
  loadUsers(1)
}

function resetFilters() {
  filters.search = ''
  filters.role = ''
  filters.is_active = ''
  loadUsers(1)
}

function userCardClass(role, isActive) {
  return filters.role === role && filters.is_active === isActive ?
     'border-[var(--saytu-primary)] ring-2 ring-[color-mix(in_srgb,var(--saytu-primary)_18%,transparent)]'
    : 'border-gray-200 dark:border-slate-800'
}

async function loadUsers(page = 1) {
  loading.value = true
  try {
    const { data } = await api.get('/users', {
      params: {
        page, per_page: 25,
        search: filters.search || undefined,
        role: filters.role || undefined,
        is_active: filters.is_active !== '' ? filters.is_active : undefined,
      },
    })
    users.value = data.data
    Object.assign(meta, {
      current_page: data.current_page, last_page: data.last_page,
      total: data.total, from: data.from || 0, to: data.to || 0,
    })
  } catch (e) {
    toast.error('Erreur de chargement')
  } finally {
    loading.value = false
  }
}

async function exporterCSV() {
  exportLoading.value = true
  try {
    await telechargerCSV('/exports/utilisateurs', {
      search: filters.search || undefined,
      role: filters.role || undefined,
      is_active: filters.is_active !== '' ? filters.is_active : undefined,
    }, 'utilisateurs_saytu.csv')
    toast.success('Export des utilisateurs téléchargé.')
  } catch (e) {
    toast.error('Export impossible pour le moment.')
  } finally {
    exportLoading.value = false
  }
}

async function loadStats() {
  try {
    const { data } = await api.get('/users-stats')
    Object.assign(stats, data)
  } catch (e) {}
}

function openCreate() { editingUser.value = null; showModal.value = true }
function openEdit(u) { editingUser.value = { ...u }; showModal.value = true }

function onSaved(payload) {
  showModal.value = false
  loadUsers(meta.current_page)
  loadStats()

  if (payload.user?.id === auth.user?.id) {
    auth.user = payload.user
    localStorage.setItem('xelltekk_user', JSON.stringify(payload.user))
  }

  // Si un mot de passe a été généré (nouvelle création), l'afficher
  if (payload.password_genere) {
    passwordUserName.value = payload.user?.name || ''
    generatedPassword.value = payload.password_genere
    showPasswordModal.value = true
  }
}

function confirmDelete(u) { userToDelete.value = u; showDeleteModal.value = true }

async function handleDelete() {
  deleting.value = true
  try {
    await api.delete(`/users/${userToDelete.value.id}`)
    toast.success('Utilisateur supprimé')
    showDeleteModal.value = false
    loadUsers(meta.current_page)
    loadStats()
  } catch (err) {
    toast.error(err.response.data.message || 'Erreur')
  } finally {
    deleting.value = false
  }
}

async function toggleActif(u) {
  try {
    const { data } = await api.post(`/users/${u.id}/toggle-actif`)
    toast.success(data.message)
    loadUsers(meta.current_page)
    loadStats()
  } catch (err) {
    toast.error(err.response.data.message || 'Erreur')
  }
}

function openResetPassword(u) {
  resetUser.value = u
  resetMode.value = 'generate'
  resetForm.password = ''
  showResetModal.value = true
}

async function handleResetPassword() {
  resetting.value = true
  try {
    const payload = resetMode.value === 'custom' ?
       { password: resetForm.password }
      : { generate: true }
    const { data } = await api.post(`/users/${resetUser.value.id}/reset-password`, payload)
    showResetModal.value = false
    // Afficher le mot de passe
    passwordUserName.value = resetUser.value.name
    generatedPassword.value = data.password_genere
    showPasswordModal.value = true
  } catch (err) {
    toast.error(err.response.data.message || 'Erreur')
  } finally {
    resetting.value = false
  }
}

function copierMotDePasse() {
  navigator.clipboard.writeText(generatedPassword.value)
  toast.success('Mot de passe copié !')
}

function initiales(name) {
  return (name || '')
    .split(' ')
    .map(p => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function avatarColor(u) {
  const colors = {
    admin: '#dc2626', commercial: '#16a34a',
    gerant: '#7c3aed', magasinier: '#2563eb', comptable: '#ca8a04', caissier: '#0891b2',
  }
  return colors[u.role] || '#6b7280'
}

function photoUrl(u) {
  if (!u.photo) return ''
  if (u.photo.startsWith('http')) return u.photo
  return u.photo
}

function roleEmoji(r) {
  return { admin: '🔴', gerant: '🟣', commercial: '🟢', magasinier: '🔵', comptable: '🟡', caissier: '' }[r] || '⚪'
}

function roleLabel(r) {
  return { admin: 'Admin', gerant: 'Gérant', commercial: 'Commercial', magasinier: 'Gestionnaire stock', comptable: 'Compta', caissier: 'Caissier' }[r] || r
}

function roleBadge(r) {
  return {
    admin: 'bg-red-100 text-red-700',
    gerant: 'bg-purple-100 text-purple-700',
    commercial: 'bg-green-100 text-green-700',
    magasinier: 'bg-blue-100 text-blue-700',
    comptable: 'bg-yellow-100 text-yellow-700',
    caissier: 'bg-cyan-100 text-cyan-700',
  }[r] || 'bg-gray-100'
}

onMounted(() => { loadUsers(); loadStats() })
</script>

<style scoped>
.access-hero {
  background:
    radial-gradient(circle at top right, color-mix(in srgb, var(--saytu-secondary) 18%, transparent), transparent 30rem),
    linear-gradient(135deg, color-mix(in srgb, var(--saytu-primary) 10%, white), white 64%);
}

.access-hero span {
  background: color-mix(in srgb, var(--saytu-primary) 12%, white);
  color: var(--saytu-primary);
}

.access-kpi {
  border-color: color-mix(in srgb, var(--kpi-accent) 30%, transparent);
  color: var(--kpi-accent);
  background:
    radial-gradient(circle at top right, color-mix(in srgb, var(--kpi-accent) 14%, transparent), transparent 12rem),
    color-mix(in srgb, var(--kpi-accent) 5%, white);
}

.access-kpi span {
  background: color-mix(in srgb, var(--kpi-accent) 14%, white);
  color: var(--kpi-accent);
}

.access-kpi p:last-child {
  color: color-mix(in srgb, var(--kpi-accent) 78%, #475569);
}

:global(.dark) .access-hero {
  background:
    radial-gradient(circle at top right, color-mix(in srgb, var(--saytu-secondary) 18%, transparent), transparent 28rem),
    linear-gradient(135deg, color-mix(in srgb, var(--saytu-sidebar-via) 82%, #020617), #020617 70%);
}

:global(.dark) .access-hero span {
  background: color-mix(in srgb, var(--saytu-primary) 20%, #020617);
  color: color-mix(in srgb, var(--saytu-primary) 78%, white);
}

:global(.dark) .access-kpi {
  background:
    radial-gradient(circle at top right, color-mix(in srgb, var(--kpi-accent) 18%, transparent), transparent 11rem),
    color-mix(in srgb, var(--kpi-accent) 8%, #020617);
}

:global(.dark) .access-kpi span {
  background: color-mix(in srgb, var(--kpi-accent) 18%, #020617);
}
</style>
