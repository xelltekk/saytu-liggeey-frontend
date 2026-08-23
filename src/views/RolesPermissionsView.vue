<template>
  <div class="space-y-5">
    <section class="access-hero rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <span class="inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.2em]">Sécurité avancée</span>
          <h1 class="mt-3 text-2xl font-black text-slate-950 dark:text-white">Rôles & permissions</h1>
          <p class="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
            Créez des rôles personnalisés, donnez ou retirez des accès par module, puis attribuez ces rôles aux utilisateurs.
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <button type="button" class="btn-secondary" @click="duplicateSelected" :disabled="!selectedRole">Dupliquer</button>
          <button type="button" class="btn-primary" @click="newRole">+ Nouveau rôle</button>
        </div>
      </div>
    </section>

    <section class="grid grid-cols-1 gap-4 xl:grid-cols-[360px_1fr]">
      <aside class="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div class="flex items-center justify-between gap-3">
          <div>
            <h2 class="font-black text-slate-950 dark:text-white">Rôles</h2>
            <p class="text-sm text-slate-500 dark:text-slate-400">{{ roles.length }} rôle(s) disponible(s)</p>
          </div>
          <button type="button" class="btn-secondary px-3 py-2 text-xs" @click="loadAll">Actualiser</button>
        </div>

        <div class="mt-4 space-y-2">
          <button
            v-for="role in roles"
            :key="role.id"
            type="button"
            class="w-full rounded-2xl border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-sm"
            :class="selectedRole?.id === role.id ? 'border-[var(--saytu-primary)] bg-blue-50/70 dark:bg-blue-500/10' : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950/30'"
            @click="selectRole(role)"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <div class="truncate font-bold text-slate-900 dark:text-white">{{ role.label }}</div>
                <div class="mt-1 text-xs font-mono text-slate-500">{{ role.code }}</div>
              </div>
              <span class="rounded-full px-2 py-0.5 text-[11px] font-bold" :class="role.is_system ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200'">
                {{ role.is_system ? 'Modèle' : 'Perso' }}
              </span>
            </div>
            <p class="mt-2 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">{{ role.description || 'Aucune description.' }}</p>
            <div class="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-500">
              <span class="rounded-full bg-slate-100 px-2 py-0.5 dark:bg-slate-800">{{ role.users_count || 0 }} utilisateur(s)</span>
              <span v-if="!role.is_active" class="rounded-full bg-red-50 px-2 py-0.5 text-red-700">Inactif</span>
            </div>
          </button>
        </div>
      </aside>

      <main class="rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div v-if="loading" class="p-12 text-center text-slate-500">Chargement...</div>

        <div v-else-if="!form" class="p-12 text-center text-slate-500">
          Sélectionnez un rôle ou créez un nouveau rôle.
        </div>

        <div v-else class="divide-y divide-slate-100 dark:divide-slate-800">
          <div class="p-4 sm:p-5">
            <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 class="text-xl font-black text-slate-950 dark:text-white">
                  {{ form.id ? form.label : 'Nouveau rôle personnalisé' }}
                </h2>
                <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {{ selectedRole?.is_system ? 'Rôle système : utilisez “Dupliquer” pour créer une version personnalisée.' : 'Cochez uniquement les accès nécessaires.' }}
                </p>
              </div>
              <div class="flex flex-wrap gap-2">
                <button v-if="form.id && !selectedRole?.is_system" type="button" class="btn-secondary text-red-600" @click="deleteRole">Supprimer</button>
                <button type="button" class="btn-primary" :disabled="saving || selectedRole?.is_system" @click="saveRole">
                  {{ saving ? 'Enregistrement...' : 'Enregistrer le rôle' }}
                </button>
              </div>
            </div>

            <div class="mt-5 grid gap-3 lg:grid-cols-4">
              <label class="lg:col-span-1">
                <span class="label">Code</span>
                <input v-model="form.code" class="input" :disabled="!!form.id" placeholder="responsable_achats" />
              </label>
              <label class="lg:col-span-1">
                <span class="label">Libellé</span>
                <input v-model="form.label" class="input" :disabled="selectedRole?.is_system" placeholder="Responsable achats" />
              </label>
              <label class="lg:col-span-1">
                <span class="label">Base métier</span>
                <select v-model="form.base_role" class="input" :disabled="selectedRole?.is_system">
                  <option value="">Aucune</option>
                  <option v-for="role in systemRoleOptions" :key="role.code" :value="role.code">{{ role.label }}</option>
                </select>
              </label>
              <label class="flex items-center gap-2 pt-7">
                <input v-model="form.is_active" type="checkbox" :disabled="selectedRole?.is_system" />
                <span class="text-sm font-semibold text-slate-700 dark:text-slate-200">Rôle actif</span>
              </label>
              <label class="lg:col-span-4">
                <span class="label">Description</span>
                <textarea v-model="form.description" class="input min-h-20" :disabled="selectedRole?.is_system" placeholder="Expliquez à quoi sert ce rôle."></textarea>
              </label>
            </div>
          </div>

          <div class="p-4 sm:p-5">
            <div class="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 class="font-black text-slate-950 dark:text-white">Matrice des permissions</h3>
                <p class="text-sm text-slate-500 dark:text-slate-400">Cochez les actions autorisées pour chaque rubrique.</p>
              </div>
              <div class="flex flex-wrap gap-2">
                <button type="button" class="btn-secondary px-3 py-2 text-xs" :disabled="selectedRole?.is_system" @click="setAll(false)">Tout retirer</button>
                <button type="button" class="btn-secondary px-3 py-2 text-xs" :disabled="selectedRole?.is_system" @click="setCommonReadOnly">Lecture seule</button>
              </div>
            </div>

            <div class="space-y-4">
              <section v-for="group in groupedModules" :key="group.name" class="rounded-2xl border border-slate-200 p-3 dark:border-slate-800">
                <h4 class="mb-3 text-sm font-black uppercase tracking-wide text-slate-500">{{ group.name }}</h4>
                <div class="overflow-x-auto">
                  <table class="min-w-full text-sm">
                    <thead>
                      <tr class="text-left text-xs uppercase tracking-wide text-slate-500">
                        <th class="w-56 py-2 pr-3">Rubrique</th>
                        <th v-for="action in actionKeys" :key="action" class="px-2 py-2 text-center">{{ actions[action] }}</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                      <tr v-for="module in group.items" :key="module.key">
                        <td class="py-3 pr-3">
                          <div class="font-bold text-slate-800 dark:text-slate-100">{{ module.label }}</div>
                          <div class="text-xs text-slate-500">{{ module.key }}</div>
                        </td>
                        <td v-for="action in actionKeys" :key="`${module.key}-${action}`" class="px-2 py-3 text-center">
                          <input
                            v-if="module.actions.includes(action)"
                            v-model="form.permissions[module.key][action]"
                            type="checkbox"
                            class="h-4 w-4 rounded border-slate-300 text-[var(--saytu-primary)]"
                            :disabled="selectedRole?.is_system"
                          />
                          <span v-else class="text-slate-300">—</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          </div>

          <div class="p-4 sm:p-5">
            <div class="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h3 class="font-black text-slate-950 dark:text-white">Exceptions utilisateur</h3>
                <p class="text-sm text-slate-500 dark:text-slate-400">
                  Donnez ou retirez un accès à une personne précise, sans créer un nouveau rôle.
                </p>
              </div>
            </div>

            <div class="grid gap-3 lg:grid-cols-[1fr_auto]">
              <select v-model="selectedUserId" class="input">
                <option value="">Choisir un utilisateur</option>
                <option v-for="user in users" :key="user.id" :value="user.id">
                  {{ user.name }} — {{ user.email }}
                </option>
              </select>
              <button type="button" class="btn-secondary" :disabled="!selectedUserId" @click="loadUserPermissions">Voir ses accès</button>
            </div>

            <div v-if="userAccess" class="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
              <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h4 class="font-black text-slate-900 dark:text-white">{{ userAccess.user.name }}</h4>
                  <p class="text-sm text-slate-500">{{ userAccess.role?.label || userAccess.user.role }}</p>
                </div>
                <span class="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                  {{ userAccess.overrides.length }} exception(s)
                </span>
              </div>

              <div class="mt-4 grid gap-3 lg:grid-cols-5">
                <select v-model="overrideForm.module" class="input">
                  <option value="">Module</option>
                  <option v-for="module in moduleOptions" :key="module.key" :value="module.key">{{ module.label }}</option>
                </select>
                <select v-model="overrideForm.permission" class="input">
                  <option v-for="action in availableOverrideActions" :key="action" :value="action">{{ actions[action] }}</option>
                </select>
                <select v-model="overrideForm.value" class="input">
                  <option value="1">Autoriser</option>
                  <option value="0">Retirer</option>
                  <option value="">Annuler l’exception</option>
                </select>
                <input v-model="overrideForm.expires_at" type="date" class="input" title="Expiration optionnelle" />
                <button type="button" class="btn-primary" :disabled="!overrideForm.module || !overrideForm.permission" @click="saveOverride">
                  Appliquer
                </button>
              </div>
              <input v-model="overrideForm.reason" class="input mt-3" placeholder="Motif optionnel : remplacement, audit, accès temporaire..." />

              <div class="mt-4 overflow-x-auto">
                <table class="min-w-full text-sm">
                  <thead class="text-left text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th class="py-2 pr-3">Module</th>
                      <th class="px-3 py-2">Permission</th>
                      <th class="px-3 py-2">Décision</th>
                      <th class="px-3 py-2">Expiration</th>
                      <th class="px-3 py-2">Motif</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-200 dark:divide-slate-800">
                    <tr v-for="override in userAccess.overrides" :key="override.id">
                      <td class="py-2 pr-3 font-semibold">{{ moduleLabel(override.module) }}</td>
                      <td class="px-3 py-2">{{ actions[override.permission] || override.permission }}</td>
                      <td class="px-3 py-2">
                        <span class="rounded-full px-2 py-0.5 text-xs font-bold" :class="override.value ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'">
                          {{ override.value ? 'Autorisé' : 'Retiré' }}
                        </span>
                      </td>
                      <td class="px-3 py-2">{{ override.expires_at ? new Date(override.expires_at).toLocaleDateString('fr-FR') : 'Permanent' }}</td>
                      <td class="px-3 py-2 text-slate-500">{{ override.reason || '-' }}</td>
                    </tr>
                    <tr v-if="!userAccess.overrides.length">
                      <td colspan="5" class="py-6 text-center text-slate-400">Aucune exception : le rôle s’applique normalement.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'

const toast = useToast()
const { askConfirm } = useConfirm()

const loading = ref(false)
const saving = ref(false)
const definitions = ref({ modules: {}, actions: {}, system_roles: {} })
const roles = ref([])
const selectedRole = ref(null)
const form = ref(null)
const users = ref([])
const selectedUserId = ref('')
const userAccess = ref(null)
const overrideForm = ref({ module: '', permission: 'view', value: '1', expires_at: '', reason: '' })

const actions = computed(() => definitions.value.actions || {})
const actionKeys = computed(() => Object.keys(actions.value))
const systemRoleOptions = computed(() => roles.value.filter((role) => role.is_system))
const moduleOptions = computed(() => Object.entries(definitions.value.modules || {}).map(([key, module]) => ({ key, ...module })))
const availableOverrideActions = computed(() => {
  const module = definitions.value.modules?.[overrideForm.value.module]
  return module?.actions || ['view']
})

const groupedModules = computed(() => {
  const groups = new Map()
  Object.entries(definitions.value.modules || {}).forEach(([key, module]) => {
    const group = module.group || 'Autres'
    if (!groups.has(group)) groups.set(group, [])
    groups.get(group).push({ key, ...module })
  })
  return Array.from(groups.entries()).map(([name, items]) => ({ name, items }))
})

onMounted(loadAll)

async function loadAll() {
  loading.value = true
  try {
    const [{ data: defs }, { data: roleList }, { data: usersPage }] = await Promise.all([
      api.get('/access-control/definitions'),
      api.get('/access-control/roles'),
      api.get('/users', { params: { per_page: 100 } }),
    ])
    definitions.value = defs
    roles.value = roleList
    users.value = usersPage.data || []
    if (roles.value.length) {
      const current = selectedRole.value ? roles.value.find((role) => role.id === selectedRole.value.id) : roles.value[0]
      selectRole(current || roles.value[0])
    }
  } catch (e) {
    toast.error('Chargement des rôles impossible.')
  } finally {
    loading.value = false
  }
}

async function loadUserPermissions() {
  if (!selectedUserId.value) return
  try {
    const { data } = await api.get(`/access-control/users/${selectedUserId.value}/permissions`)
    userAccess.value = data
  } catch (e) {
    toast.error('Chargement des accès utilisateur impossible.')
  }
}

async function saveOverride() {
  if (!selectedUserId.value || !overrideForm.value.module || !overrideForm.value.permission) return
  try {
    const payload = {
      module: overrideForm.value.module,
      permission: overrideForm.value.permission,
      value: overrideForm.value.value === '' ? null : overrideForm.value.value === '1',
      expires_at: overrideForm.value.expires_at || null,
      reason: overrideForm.value.reason || null,
    }
    const { data } = await api.put(`/access-control/users/${selectedUserId.value}/permissions`, {
      overrides: [payload],
    })
    userAccess.value = { ...userAccess.value, permissions: data.permissions, overrides: data.overrides }
    overrideForm.value.reason = ''
    toast.success(data.message || 'Exception mise à jour')
  } catch (e) {
    toast.error(e.response?.data?.message || 'Exception impossible.')
  }
}

function moduleLabel(key) {
  return definitions.value.modules?.[key]?.label || key
}

function emptyPermissions() {
  const permissions = {}
  Object.entries(definitions.value.modules || {}).forEach(([key, module]) => {
    permissions[key] = {}
    module.actions.forEach((action) => {
      permissions[key][action] = false
    })
  })
  return permissions
}

function normalizePermissions(source = {}) {
  const permissions = emptyPermissions()
  Object.entries(permissions).forEach(([module, actionsMap]) => {
    Object.keys(actionsMap).forEach((action) => {
      permissions[module][action] = !!source?.[module]?.[action]
    })
  })
  return permissions
}

function selectRole(role) {
  selectedRole.value = role
  form.value = {
    id: role.id,
    code: role.code,
    label: role.label,
    description: role.description || '',
    base_role: role.base_role || '',
    is_active: role.is_active !== false,
    permissions: normalizePermissions(role.permissions),
  }
}

function newRole() {
  selectedRole.value = null
  form.value = {
    id: null,
    code: '',
    label: '',
    description: '',
    base_role: 'commercial',
    is_active: true,
    permissions: emptyPermissions(),
  }
}

async function saveRole() {
  if (!form.value || selectedRole.value?.is_system) return
  saving.value = true
  try {
    const payload = {
      code: form.value.code,
      label: form.value.label,
      description: form.value.description,
      base_role: form.value.base_role || null,
      is_active: form.value.is_active,
      permissions: form.value.permissions,
    }
    const { data } = form.value.id
      ? await api.put(`/access-control/roles/${form.value.id}`, payload)
      : await api.post('/access-control/roles', payload)
    toast.success(data.message || 'Rôle enregistré')
    await loadAll()
    if (data.role) selectRole(data.role)
  } catch (e) {
    toast.error(e.response?.data?.message || 'Enregistrement impossible.')
  } finally {
    saving.value = false
  }
}

async function duplicateSelected() {
  if (!selectedRole.value) return
  const label = `${selectedRole.value.label} personnalisé`
  const code = `${selectedRole.value.code}_perso`
  try {
    const { data } = await api.post(`/access-control/roles/${selectedRole.value.id}/duplicate`, {
      label,
      code,
      description: `Version personnalisée de ${selectedRole.value.label}`,
    })
    toast.success('Rôle dupliqué. Vous pouvez maintenant le modifier.')
    await loadAll()
    if (data.role) selectRole(data.role)
  } catch (e) {
    toast.error(e.response?.data?.message || 'Duplication impossible.')
  }
}

async function deleteRole() {
  if (!selectedRole.value || selectedRole.value.is_system) return
  const ok = await askConfirm({
    title: 'Supprimer le rôle',
    message: `Supprimer le rôle ${selectedRole.value.label} ?`,
    confirmLabel: 'Supprimer',
    tone: 'danger',
  })
  if (!ok) return
  try {
    await api.delete(`/access-control/roles/${selectedRole.value.id}`)
    toast.success('Rôle supprimé')
    selectedRole.value = null
    form.value = null
    await loadAll()
  } catch (e) {
    toast.error(e.response?.data?.message || 'Suppression impossible.')
  }
}

function setAll(value) {
  Object.values(form.value.permissions).forEach((module) => {
    Object.keys(module).forEach((action) => {
      module[action] = value
    })
  })
}

function setCommonReadOnly() {
  setAll(false)
  Object.values(form.value.permissions).forEach((module) => {
    if (Object.prototype.hasOwnProperty.call(module, 'view')) {
      module.view = true
    }
  })
}
</script>

<style scoped>
.label { @apply mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-200; }

.access-hero {
  background:
    radial-gradient(circle at top right, color-mix(in srgb, var(--saytu-secondary) 18%, transparent), transparent 30rem),
    linear-gradient(135deg, color-mix(in srgb, var(--saytu-primary) 10%, white), white 64%);
}

.access-hero span {
  background: color-mix(in srgb, var(--saytu-primary) 12%, white);
  color: var(--saytu-primary);
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
</style>
