<template>
  <div class="space-y-5">
    <section class="access-hero overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div class="min-w-0">
          <span class="inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.2em]">
            Administration sécurité
          </span>
          <h1 class="mt-3 text-2xl font-black text-slate-950">
            Accès & Utilisateurs
          </h1>
          <p class="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
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
        class="access-kpi rounded-3xl border bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
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

    <section class="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
      <article class="rounded-3xl border border-amber-200 bg-amber-50/70 p-4 shadow-sm">
        <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 class="font-black text-slate-950">Plan d’action utilisateurs</h2>
            <p class="mt-1 text-sm text-slate-600">
              Contrôles rapides pour éviter les comptes trop sensibles ou oubliés.
            </p>
          </div>
          <span class="rounded-full bg-white px-3 py-1 text-xs font-black text-amber-700">
            {{ userActionItems.length }} point(s)
          </span>
        </div>

        <div class="mt-4 space-y-2">
          <article
            v-for="item in userActionItems"
            :key="item.key"
            class="user-action-item"
            :class="item.class"
          >
            <span class="mt-1 h-2.5 w-2.5 shrink-0 rounded-full" :class="item.dot"></span>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-black text-slate-950">{{ item.title }}</p>
              <p class="text-xs font-semibold text-slate-600">{{ item.detail }}</p>
            </div>
            <button type="button" class="user-mini-action" @click="runUserAction(item)">
              {{ item.actionLabel }}
            </button>
          </article>
        </div>
      </article>

      <article class="rounded-3xl border border-cyan-200 bg-cyan-50/70 p-4 shadow-sm">
        <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 class="font-black text-slate-950">Guide des rôles</h2>
            <p class="mt-1 text-sm text-slate-600">
              Le bon réflexe : donner le minimum nécessaire au poste.
            </p>
          </div>
          <button type="button" class="btn-secondary px-3 py-2 text-xs" @click="goToRoles">
            Rôles & permissions
          </button>
        </div>

        <div class="mt-4 grid gap-2 sm:grid-cols-2">
          <article v-for="role in roleGuideCards" :key="role.key" class="rounded-2xl border bg-white/80 p-3" :class="role.border">
            <div class="flex items-start justify-between gap-2">
              <div>
                <p class="text-sm font-black text-slate-950">{{ role.label }}</p>
                <p class="mt-1 text-xs font-semibold text-slate-500">{{ role.hint }}</p>
              </div>
              <span class="rounded-full px-2 py-0.5 text-[11px] font-black" :class="role.badgeClass">
                {{ role.level }}
              </span>
            </div>
          </article>
        </div>
      </article>
    </section>

    <section class="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div class="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 class="text-lg font-black text-slate-950">Centre de contrôle des accès</h2>
          <p class="text-sm text-slate-500">Les points importants pour sécuriser les utilisateurs et leurs permissions.</p>
        </div>
        <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
          Admin uniquement
        </span>
      </div>

      <div class="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        <article
          v-for="module in accessModules"
          :key="module.key"
          class="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-[var(--saytu-primary)] hover:bg-white"
        >
          <div class="flex items-start justify-between gap-3">
            <div>
              <h3 class="font-bold text-slate-900">{{ module.title }}</h3>
              <p class="mt-1 text-sm leading-5 text-slate-500">{{ module.description }}</p>
            </div>
            <span class="rounded-full px-2.5 py-1 text-xs font-bold" :class="module.badgeClass">
              {{ module.status }}
            </span>
          </div>
        </article>
      </div>
    </section>

    <section class="rounded-3xl border border-cyan-200 bg-cyan-50/70 p-4 shadow-sm">
      <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 class="font-black text-slate-950">Journal des comptes utilisateurs</h2>
          <p class="mt-1 text-sm text-slate-600">
            Dernières actions sensibles : création, modification, activation, désactivation, reset mot de passe et suppression.
          </p>
        </div>
        <button type="button" class="btn-secondary px-3 py-2 text-xs" :disabled="userActivitiesLoading" @click="loadUserActivities(true)">
          {{ userActivitiesLoading ? 'Chargement...' : 'Rafraîchir le journal' }}
        </button>
      </div>

      <div v-if="userActivities.length" class="mt-4 overflow-x-auto rounded-2xl border border-cyan-100 bg-white">
        <table class="min-w-full text-sm">
          <thead class="bg-cyan-100/70 text-left text-xs uppercase tracking-wide text-slate-600">
            <tr>
              <th class="px-3 py-2">Date</th>
              <th class="px-3 py-2">Auteur</th>
              <th class="px-3 py-2">Action</th>
              <th class="px-3 py-2">Compte concerné</th>
              <th class="px-3 py-2">Détails</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-cyan-100">
            <tr v-for="activity in userActivities" :key="`${activity.date}-${activity.event}-${activity.subject_id}`">
              <td class="whitespace-nowrap px-3 py-3 text-xs font-semibold text-slate-600">{{ formatDateTime(activity.date) }}</td>
              <td class="px-3 py-3">
                <div class="font-bold text-slate-900">{{ activity.user_name || 'Système' }}</div>
                <div class="text-xs text-slate-500">{{ roleLabel(activity.user_role) || activity.user_role || '—' }}</div>
              </td>
              <td class="px-3 py-3">
                <span class="rounded-full px-2 py-1 text-xs font-black" :class="activityEventClass(activity.event)">
                  {{ userActivityLabel(activity.event, activity.title) }}
                </span>
                <div v-if="activity.description" class="mt-1 max-w-md text-xs text-slate-500">{{ activity.description }}</div>
              </td>
              <td class="px-3 py-3">
                <div class="font-bold text-slate-900">{{ activityTargetName(activity) }}</div>
                <div class="font-mono text-xs text-slate-500">{{ activity.reference || '—' }}</div>
              </td>
              <td class="px-3 py-3">
                <div class="flex flex-wrap gap-1">
                  <span
                    v-for="detail in activityDetails(activity)"
                    :key="detail"
                    class="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600"
                  >
                    {{ detail }}
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="mt-4 rounded-2xl border border-dashed border-cyan-200 bg-white/70 p-6 text-center text-sm text-slate-500">
        Aucun événement utilisateur enregistré pour le moment.
      </div>
    </section>

    <!-- Header + filtres -->
    <div class="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">
      <div class="flex flex-col md:flex-row gap-3">
        <input v-model="filters.search" @input="onSearchInput" type="search"
               placeholder="🔍 Nom, email, téléphone..." class="input flex-1" />

        <select v-model="filters.role" @change="loadUsers(1)" class="input md:w-44">
          <option value="">Tous rôles</option>
          <option v-for="role in roleOptions" :key="role.code" :value="role.code">
            {{ roleEmoji(role.code) }} {{ role.label }}
          </option>
        </select>

        <select v-model="filters.is_active" @change="loadUsers(1)" class="input md:w-40">
          <option value="">Tous statuts</option>
          <option value="1">Actifs</option>
          <option value="0">Inactifs</option>
        </select>

        <button type="button" @click="resetFilters" class="btn-secondary whitespace-nowrap">Réinitialiser</button>
      </div>
    </div>

    <div data-inline-modal-workspace></div>

    <div v-if="loading" class="rounded-3xl bg-white p-12 text-center text-gray-500 shadow-sm">Chargement...</div>

    <div v-else class="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
      <table class="w-full">
        <thead class="bg-gray-50 border-b border-gray-200">
          <tr>
            <SortableTh column="utilisateur" :active="sort.key === 'utilisateur'" :icon="sortIcon('utilisateur')" @sort="toggleSort">Utilisateur</SortableTh>
            <SortableTh column="email" :active="sort.key === 'email'" :icon="sortIcon('email')" @sort="toggleSort">Email</SortableTh>
            <SortableTh column="role" :active="sort.key === 'role'" :icon="sortIcon('role')" align="center" @sort="toggleSort">Rôle</SortableTh>
            <th class="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Contrôle</th>
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
            <td class="px-3 py-3 text-center">
              <span class="badge text-xs" :class="userRisk(u).badgeClass">
                {{ userRisk(u).label }}
              </span>
              <div class="mt-1 text-[11px] text-slate-400">{{ userRisk(u).hint }}</div>
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
            <td colspan="7" class="px-4 py-12 text-center text-gray-400 text-sm">Aucun utilisateur</td>
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
import { useRouter } from 'vue-router'
import api from '@/services/api'
import AppModal from '@/components/InlinePanelModal.vue'
import SortableTh from '@/components/SortableTh.vue'
import { useToast } from '@/composables/useToast'
import { useTableSort } from '@/composables/useTableSort'
import { telechargerCSV } from '@/services/exports'

const toast = useToast()
const router = useRouter()
const users = ref([])
const roleOptions = ref([])
const { sort, toggleSort, sortIcon, sortedRows } = useTableSort('created_at', 'desc')
const loading = ref(false)
const exportLoading = ref(false)
const stats = reactive({ total: 0, actifs: 0, par_role: {} })
const meta = reactive({ current_page: 1, last_page: 1, total: 0, from: 0, to: 0 })
const filters = reactive({ search: '', role: '', is_active: '' })

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
const userActivities = ref([])
const userActivitiesLoading = ref(false)

const inactiveUsersCount = computed(() => Math.max(0, Number(stats.total || 0) - Number(stats.actifs || 0)))
const currentPageSensitiveUsersCount = computed(() => users.value.filter((user) => isSensitiveRole(user.role)).length)
const currentPageUsersWithoutPhoneCount = computed(() => users.value.filter((user) => !String(user.phone || '').trim()).length)
const unknownRoleUsersCount = computed(() => users.value.filter((user) => !roleOptionFor(user.role)).length)

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
    badgeClass: 'bg-blue-50 text-blue-700',
  },
  {
    key: 'security',
    title: 'Sécurité des comptes',
    description: 'Réinitialisation de mot de passe, activation/désactivation et suppression contrôlée.',
    status: 'Protégé',
    badgeClass: 'bg-emerald-50 text-emerald-700',
  },
  {
    key: 'sessions',
    title: 'Sessions',
    description: 'Prévu pour suivre les connexions ouvertes et déconnecter un appareil à distance.',
    status: 'À venir',
    badgeClass: 'bg-slate-100 text-slate-700',
  },
  {
    key: 'journal',
    title: 'Journal accès',
    description: 'Affiche les créations, resets, suppressions et changements sensibles des comptes.',
    status: `${userActivities.value.length} action(s)`,
    badgeClass: 'bg-violet-50 text-violet-700',
  },
  {
    key: 'admins',
    title: 'Comptes sensibles',
    description: 'Surveillance rapide du nombre d’administrateurs et gérants actifs.',
    status: `${sensitiveUsersCount.value} sensible(s)`,
    badgeClass: 'bg-amber-50 text-amber-700',
  },
  {
    key: 'inactive',
    title: 'Accès bloqués',
    description: 'Vérifier les comptes inactifs avant suppression définitive ou réactivation.',
    status: `${inactiveUsersCount.value} bloqué(s)`,
    badgeClass: 'bg-red-50 text-red-700',
  },
])

const activeRolesCount = computed(() => Object.values(stats.par_role || {}).filter((count) => Number(count || 0) > 0).length)
const sensitiveUsersCount = computed(() => Number(stats.par_role?.admin || 0) + Number(stats.par_role?.gerant || 0))
const userActionItems = computed(() => {
  const items = []

  if (Number(stats.par_role?.admin || 0) > 1) {
    items.push({
      key: 'admins',
      title: 'Plusieurs administrateurs',
      detail: `${stats.par_role.admin} comptes ont un accès complet. Vérifiez que chacun est vraiment nécessaire.`,
      actionLabel: 'Filtrer',
      action: 'filter-admin',
      class: 'user-action-warning',
      dot: 'bg-amber-400',
    })
  } else if (Number(stats.par_role?.admin || 0) === 0) {
    items.push({
      key: 'no-admin',
      title: 'Aucun administrateur actif visible',
      detail: 'Vérifiez rapidement les rôles pour éviter de bloquer l’administration.',
      actionLabel: 'Rôles',
      action: 'roles',
      class: 'user-action-danger',
      dot: 'bg-red-500',
    })
  }

  if (inactiveUsersCount.value > 0) {
    items.push({
      key: 'inactive',
      title: 'Comptes inactifs à contrôler',
      detail: `${inactiveUsersCount.value} compte(s) bloqué(s). À garder si historique utile, sinon nettoyer.`,
      actionLabel: 'Voir',
      action: 'filter-inactive',
      class: 'user-action-info',
      dot: 'bg-sky-500',
    })
  }

  if (currentPageSensitiveUsersCount.value > 0) {
    items.push({
      key: 'sensitive-page',
      title: 'Comptes sensibles dans la liste',
      detail: `${currentPageSensitiveUsersCount.value} compte(s) admin/gérant sur cette page.`,
      actionLabel: 'Rôles',
      action: 'roles',
      class: 'user-action-warning',
      dot: 'bg-amber-400',
    })
  }

  if (unknownRoleUsersCount.value > 0) {
    items.push({
      key: 'unknown-role',
      title: 'Rôle non reconnu',
      detail: `${unknownRoleUsersCount.value} compte(s) ont un rôle absent de la liste chargée.`,
      actionLabel: 'Rôles',
      action: 'roles',
      class: 'user-action-danger',
      dot: 'bg-red-500',
    })
  }

  if (currentPageUsersWithoutPhoneCount.value > 0) {
    items.push({
      key: 'missing-phone',
      title: 'Téléphones manquants',
      detail: `${currentPageUsersWithoutPhoneCount.value} compte(s) sur cette page n’ont pas de téléphone renseigné.`,
      actionLabel: 'Compléter',
      action: 'none',
      class: 'user-action-neutral',
      dot: 'bg-slate-400',
    })
  }

  return items.length ? items.slice(0, 5) : [{
    key: 'ok',
    title: 'Aucun point urgent détecté',
    detail: 'Les comptes visibles semblent cohérents. Continuez à limiter les accès sensibles.',
    actionLabel: 'OK',
    action: 'none',
    class: 'user-action-success',
    dot: 'bg-emerald-500',
  }]
})
const roleGuideCards = computed(() => [
  {
    key: 'admin',
    label: 'Admin',
    hint: 'Accès complet : très peu de comptes.',
    level: 'Élevé',
    badgeClass: 'bg-red-50 text-red-700',
    border: 'border-red-100',
  },
  {
    key: 'gerant',
    label: 'Gérant',
    hint: 'Pilotage et validation, à contrôler.',
    level: 'Sensible',
    badgeClass: 'bg-amber-50 text-amber-700',
    border: 'border-amber-100',
  },
  {
    key: 'comptable',
    label: 'Comptable',
    hint: 'Finance, dettes, paiements, trésorerie.',
    level: 'Métier',
    badgeClass: 'bg-blue-50 text-blue-700',
    border: 'border-blue-100',
  },
  {
    key: 'caissier',
    label: 'Caissier',
    hint: 'Caisse uniquement autant que possible.',
    level: 'Minimal',
    badgeClass: 'bg-emerald-50 text-emerald-700',
    border: 'border-emerald-100',
  },
])

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
    : 'border-gray-200'
}

function runUserAction(item) {
  if (!item || item.action === 'none') return
  if (item.action === 'roles') {
    goToRoles()
    return
  }
  if (item.action === 'filter-admin') {
    applyUserFilter('admin', '')
    return
  }
  if (item.action === 'filter-inactive') {
    applyUserFilter('', '0')
  }
}

function goToRoles() {
  router.push({ name: 'roles-permissions' })
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

async function loadRoleOptions() {
  try {
    const { data } = await api.get('/access-control/role-options')
    roleOptions.value = data
  } catch (e) {
    roleOptions.value = [
      { code: 'admin', label: 'Administrateur' },
      { code: 'gerant', label: 'Gérant' },
      { code: 'commercial', label: 'Commercial' },
      { code: 'magasinier', label: 'Gestionnaire de stock' },
      { code: 'comptable', label: 'Comptable' },
      { code: 'caissier', label: 'Caissier' },
    ]
  }
}

async function loadUserActivities(notify = false) {
  userActivitiesLoading.value = true
  try {
    const { data } = await api.get('/activites', {
      params: {
        category: 'utilisateurs',
        limit: 80,
      },
    })
    userActivities.value = Array.isArray(data.data) ? data.data : []
    if (notify) toast.success('Journal des comptes actualisé.')
  } catch (e) {
    if (notify) toast.error('Journal des comptes impossible à charger.')
  } finally {
    userActivitiesLoading.value = false
  }
}

function openCreate() { router.push({ name: 'utilisateur-create' }) }
function openEdit(u) { router.push({ name: 'utilisateur-detail', params: { id: u.id } }) }

function confirmDelete(u) { userToDelete.value = u; showDeleteModal.value = true }

async function handleDelete() {
  deleting.value = true
  try {
    await api.delete(`/users/${userToDelete.value.id}`)
    toast.success('Utilisateur supprimé')
    showDeleteModal.value = false
    loadUsers(meta.current_page)
    loadStats()
    loadUserActivities()
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
    loadUserActivities()
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
    loadUserActivities()
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
  const base = baseRoleFor(r)
  return { admin: '🔴', gerant: '🟣', commercial: '🟢', magasinier: '🔵', comptable: '🟡', caissier: '🟠' }[base] || '🔐'
}

function roleLabel(r) {
  return roleOptions.value.find((role) => role.code === r)?.label
    || { admin: 'Admin', gerant: 'Gérant', commercial: 'Commercial', magasinier: 'Gestionnaire stock', comptable: 'Compta', caissier: 'Caissier' }[r]
    || r
}

function roleOptionFor(r) {
  return roleOptions.value.find((role) => role.code === r) || null
}

function baseRoleFor(r) {
  return roleOptionFor(r)?.base_role || r
}

function isSensitiveRole(r) {
  return ['admin', 'gerant'].includes(baseRoleFor(r))
}

function userRisk(user) {
  if (!user?.is_active) {
    return {
      label: 'Bloqué',
      hint: 'Ne se connecte pas',
      badgeClass: 'bg-slate-100 text-slate-600',
    }
  }

  const base = baseRoleFor(user.role)
  if (base === 'admin') {
    return {
      label: 'Élevé',
      hint: 'Accès complet',
      badgeClass: 'bg-red-100 text-red-700',
    }
  }
  if (base === 'gerant') {
    return {
      label: 'Sensible',
      hint: 'Pilotage large',
      badgeClass: 'bg-amber-100 text-amber-700',
    }
  }
  if (!roleOptionFor(user.role)) {
    return {
      label: 'À vérifier',
      hint: 'Rôle inconnu',
      badgeClass: 'bg-orange-100 text-orange-700',
    }
  }

  return {
    label: 'Normal',
    hint: 'Accès métier',
    badgeClass: 'bg-emerald-100 text-emerald-700',
  }
}

function roleBadge(r) {
  const base = baseRoleFor(r)
  return {
    admin: 'bg-red-100 text-red-700',
    gerant: 'bg-purple-100 text-purple-700',
    commercial: 'bg-green-100 text-green-700',
    magasinier: 'bg-blue-100 text-blue-700',
    comptable: 'bg-yellow-100 text-yellow-700',
    caissier: 'bg-cyan-100 text-cyan-700',
  }[base] || 'bg-gray-100'
}

function formatDateTime(value) {
  if (!value) return '—'
  try {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value))
  } catch (e) {
    return value
  }
}

function userActivityLabel(event, fallback) {
  return {
    user_created: 'Création',
    user_updated: 'Modification',
    user_activated: 'Activation',
    user_deactivated: 'Désactivation',
    user_password_reset: 'Reset mot de passe',
    user_deleted: 'Suppression',
    user_photo_updated: 'Photo modifiée',
    user_photo_deleted: 'Photo supprimée',
  }[event] || fallback || event || 'Action'
}

function activityEventClass(event) {
  if (event === 'user_deleted' || event === 'user_deactivated') return 'bg-red-50 text-red-700'
  if (event === 'user_password_reset') return 'bg-amber-50 text-amber-700'
  if (event === 'user_created' || event === 'user_activated') return 'bg-emerald-50 text-emerald-700'
  return 'bg-cyan-50 text-cyan-700'
}

function activityTargetName(activity) {
  return activity?.payload?.metadata?.target?.name
    || activity?.payload?.metadata?.after?.name
    || activity?.subject_label
    || 'Compte utilisateur'
}

function activityDetails(activity) {
  const metadata = activity?.payload?.metadata || {}
  const details = []

  if (Array.isArray(metadata.changed_fields) && metadata.changed_fields.length) {
    details.push(`Champs : ${metadata.changed_fields.join(', ')}`)
  }
  if (metadata.tokens_revoked) details.push('Sessions fermées')
  if (metadata.generated_password === true) details.push('Mot de passe généré')
  if (metadata.generated_password === false && activity.event === 'user_password_reset') details.push('Mot de passe défini')
  if (metadata.photo_changed) details.push('Photo remplacée')

  return details.length ? details : ['Journalisé']
}

onMounted(() => { loadRoleOptions(); loadUsers(); loadStats(); loadUserActivities() })
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

.user-action-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 1rem;
  padding: 0.8rem;
}

.user-action-warning {
  border-color: #fde68a;
  background: #fffbeb;
}

.user-action-danger {
  border-color: #fecaca;
  background: #fef2f2;
}

.user-action-info {
  border-color: #bae6fd;
  background: #f0f9ff;
}

.user-action-success {
  border-color: #bbf7d0;
  background: #f0fdf4;
}

.user-action-neutral {
  border-color: #e2e8f0;
  background: #f8fafc;
}

.user-mini-action {
  flex-shrink: 0;
  border: 1px solid color-mix(in srgb, var(--saytu-primary) 30%, #cbd5e1);
  border-radius: 9999px;
  background: #ffffff;
  color: var(--saytu-primary);
  font-size: 0.72rem;
  font-weight: 900;
  padding: 0.35rem 0.65rem;
}

.user-mini-action:hover {
  background: color-mix(in srgb, var(--saytu-primary) 10%, #ffffff);
}

</style>
