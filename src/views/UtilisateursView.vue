<template>
  <div>
    <!-- Header + filtres -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
      <div class="flex flex-col md:flex-row gap-3">
        <input v-model="filters.search" @input="onSearchInput" type="search"
               placeholder="🔍 Nom, email, téléphone..." class="input flex-1" />

        <select v-model="filters.role" @change="loadUsers(1)" class="input md:w-44">
          <option value="">Tous rôles</option>
          <option value="admin">🔴 Administrateur</option>
          <option value="commercial">🟢 Commercial</option>
          <option value="magasinier">🔵 Magasinier</option>
          <option value="comptable">🟡 Comptable</option>
          <option value="caissier">Caissier</option>
        </select>

        <select v-model="filters.is_active" @change="loadUsers(1)" class="input md:w-40">
          <option value="">Tous statuts</option>
          <option value="1">Actifs</option>
          <option value="0">Inactifs</option>
        </select>

        <button @click="openCreate" class="btn-primary whitespace-nowrap">+ Nouvel utilisateur</button>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3 mb-4">
      <div class="bg-white rounded-lg border border-gray-200 p-3">
        <div class="text-xs text-gray-500 uppercase">Total</div>
        <div class="text-2xl font-bold text-gray-900">{{ stats.total || 0 }}</div>
      </div>
      <div class="bg-white rounded-lg border border-gray-200 p-3">
        <div class="text-xs text-gray-500 uppercase">Actifs</div>
        <div class="text-2xl font-bold text-green-600">{{ stats.actifs || 0 }}</div>
      </div>
      <div class="bg-white rounded-lg border border-gray-200 p-3">
        <div class="text-xs text-gray-500 uppercase">🔴 Admins</div>
        <div class="text-2xl font-bold text-red-600">{{ stats.par_role?.admin || 0 }}</div>
      </div>
      <div class="bg-white rounded-lg border border-gray-200 p-3">
        <div class="text-xs text-gray-500 uppercase">🟢 Commerciaux</div>
        <div class="text-2xl font-bold text-green-700">{{ stats.par_role?.commercial || 0 }}</div>
      </div>
      <div class="bg-white rounded-lg border border-gray-200 p-3">
        <div class="text-xs text-gray-500 uppercase">🟡 Comptables</div>
        <div class="text-2xl font-bold text-yellow-600">{{ stats.par_role?.comptable || 0 }}</div>
      </div>
      <div class="bg-white rounded-lg border border-gray-200 p-3">
        <div class="text-xs text-gray-500 uppercase">Caissiers</div>
        <div class="text-2xl font-bold text-cyan-600">{{ stats.par_role?.caissier || 0 }}</div>
      </div>
    </div>

    <div v-if="loading" class="bg-white rounded-lg p-12 text-center text-gray-500">Chargement...</div>

    <div v-else class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <table class="w-full">
        <thead class="bg-gray-50 border-b border-gray-200">
          <tr>
            <th class="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Utilisateur</th>
            <th class="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Email</th>
            <th class="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Rôle</th>
            <th class="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Activité</th>
            <th class="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Statut</th>
            <th class="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="u in users" :key="u.id" class="hover:bg-gray-50" :class="!u.is_active ? 'opacity-60' : ''">
            <td class="px-3 py-3">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm" :style="`background: ${avatarColor(u)}`">
                  {{ initiales(u.name) }}
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
    <AppModal v-model="showDeleteModal" title="Supprimer l'utilisateur ?" size="sm">
      <p class="text-gray-700">Supprimer définitivement <strong>{{ userToDelete?.name }}</strong> ?</p>
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
import { ref, reactive, onMounted } from 'vue'
import api from '@/services/api'
import AppModal from '@/components/AppModal.vue'
import UserForm from '@/components/UserForm.vue'
import { useToast } from '@/composables/useToast'

const toast = useToast()
const users = ref([])
const loading = ref(false)
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

let searchTimeout = null
function onSearchInput() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => loadUsers(1), 350)
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

  // Si un mot de passe a été généré (nouvelle création), l'afficher
  if (payload?.password_genere) {
    passwordUserName.value = payload.user.name
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
    toast.error(err.response?.data?.message || 'Erreur')
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
    toast.error(err.response?.data?.message || 'Erreur')
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
    const payload = resetMode.value === 'custom'
      ? { password: resetForm.password }
      : { generate: true }
    const { data } = await api.post(`/users/${resetUser.value.id}/reset-password`, payload)
    showResetModal.value = false
    // Afficher le mot de passe
    passwordUserName.value = resetUser.value.name
    generatedPassword.value = data.password_genere
    showPasswordModal.value = true
  } catch (err) {
    toast.error(err.response?.data?.message || 'Erreur')
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
    magasinier: '#2563eb', comptable: '#ca8a04', caissier: '#0891b2',
  }
  return colors[u.role] || '#6b7280'
}

function roleEmoji(r) {
  return { admin: '🔴', commercial: '🟢', magasinier: '🔵', comptable: '🟡', caissier: '' }[r] || '⚪'
}

function roleLabel(r) {
  return { admin: 'Admin', commercial: 'Commercial', magasinier: 'Magasin', comptable: 'Compta', caissier: 'Caissier' }[r] || r
}

function roleBadge(r) {
  return {
    admin: 'bg-red-100 text-red-700',
    commercial: 'bg-green-100 text-green-700',
    magasinier: 'bg-blue-100 text-blue-700',
    comptable: 'bg-yellow-100 text-yellow-700',
    caissier: 'bg-cyan-100 text-cyan-700',
  }[r] || 'bg-gray-100'
}

onMounted(() => { loadUsers(); loadStats() })
</script>
