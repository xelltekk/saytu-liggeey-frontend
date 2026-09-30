<template>
  <div class="app-surface space-y-4">
    <section class="rounded-3xl border border-cyan-200 bg-cyan-50/80 p-5 shadow-sm">
      <button
        type="button"
        class="mb-4 text-sm font-black text-cyan-700 hover:text-cyan-900"
        @click="goBack"
      >
        ← Retour liste
      </button>

      <p class="text-xs font-black uppercase tracking-[0.22em] text-cyan-700">Compte utilisateur</p>
      <h1 class="mt-2 text-2xl font-black text-slate-950">
        {{ isCreate ? 'Nouvel utilisateur' : user?.name || 'Utilisateur' }}
      </h1>
      <p class="mt-1 text-sm text-cyan-800">
        Saisie en page complète, sans fenêtre flottante.
      </p>
    </section>

    <section v-if="!loading" class="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
      <article class="rounded-3xl border border-cyan-200 bg-white p-5 shadow-sm">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div class="flex min-w-0 items-center gap-4">
            <div class="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-3xl bg-cyan-100 text-lg font-black text-cyan-800">
              <img v-if="photoUrl(user)" :src="photoUrl(user)" alt="Photo utilisateur" class="h-full w-full object-cover" />
              <span v-else>{{ initiales(user?.name) || 'NU' }}</span>
            </div>
            <div class="min-w-0">
              <p class="text-xs font-black uppercase tracking-[0.2em] text-cyan-700">
                {{ isCreate ? 'Création' : 'Résumé du compte' }}
              </p>
              <h2 class="mt-1 truncate text-xl font-black text-slate-950">
                {{ isCreate ? 'Préparer un accès propre' : user?.name }}
              </h2>
              <p class="mt-1 truncate text-sm font-semibold text-slate-500">
                {{ isCreate ? 'Renseignez le minimum nécessaire au poste.' : user?.email }}
              </p>
            </div>
          </div>
          <span class="rounded-full px-3 py-1 text-xs font-black" :class="accountRisk.badgeClass">
            {{ accountRisk.label }}
          </span>
        </div>

        <div class="mt-5 grid gap-3 sm:grid-cols-2">
          <article v-for="card in accountCards" :key="card.key" class="rounded-2xl border border-cyan-100 bg-cyan-50/60 p-3">
            <p class="text-xs font-black uppercase tracking-[0.16em] text-cyan-700">{{ card.label }}</p>
            <p class="mt-2 text-lg font-black text-slate-950">{{ card.value }}</p>
            <p class="mt-1 text-xs font-semibold text-slate-500">{{ card.hint }}</p>
          </article>
        </div>
      </article>

      <article class="rounded-3xl border p-5 shadow-sm" :class="accountRisk.panelClass">
        <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p class="text-xs font-black uppercase tracking-[0.2em]">Contrôle accès</p>
            <h2 class="mt-2 text-xl font-black">{{ accountRisk.title }}</h2>
            <p class="mt-2 text-sm font-semibold">{{ accountRisk.detail }}</p>
          </div>
          <button
            type="button"
            class="rounded-full border bg-white/80 px-3 py-2 text-xs font-black text-cyan-700 hover:bg-white"
            @click="goToRoles"
          >
            Rôles & permissions
          </button>
        </div>

        <div class="mt-4 grid gap-2 sm:grid-cols-2">
          <div v-for="item in securityChecklist" :key="item.label" class="rounded-2xl bg-white/80 p-3">
            <p class="text-sm font-black text-slate-950">{{ item.label }}</p>
            <p class="mt-1 text-xs font-semibold text-slate-500">{{ item.detail }}</p>
          </div>
        </div>
      </article>
    </section>

    <section v-if="!loading && !isCreate" class="rounded-3xl border border-cyan-200 bg-white p-5 shadow-sm">
      <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p class="text-xs font-black uppercase tracking-[0.2em] text-cyan-700">Responsabilités</p>
          <h2 class="mt-1 text-xl font-black text-slate-950">Ce compte est lié à ces éléments</h2>
          <p class="mt-1 text-sm font-semibold text-slate-500">
            Utile avant de désactiver, modifier le rôle ou supprimer un utilisateur.
          </p>
        </div>
        <span class="rounded-full bg-cyan-50 px-3 py-1 text-xs font-black text-cyan-700">
          {{ totalResponsibilities }} élément(s)
        </span>
      </div>

      <div class="mt-4 grid gap-3 md:grid-cols-3">
        <article v-for="item in responsibilityCards" :key="item.key" class="rounded-2xl border border-cyan-100 bg-cyan-50/60 p-4">
          <p class="text-xs font-black uppercase tracking-[0.16em] text-cyan-700">{{ item.label }}</p>
          <p class="mt-2 text-2xl font-black text-slate-950">{{ item.value }}</p>
          <p class="mt-1 text-xs font-semibold text-slate-500">{{ item.hint }}</p>
        </article>
      </div>
    </section>

    <section class="rounded-3xl border border-cyan-200 bg-white p-5 shadow-sm">
      <div class="mb-4 border-b border-cyan-100">
        <button
          type="button"
          class="-mb-px rounded-t-2xl border border-cyan-200 border-b-white bg-white px-5 py-3 text-sm font-black text-cyan-700"
        >
          Informations utilisateur
        </button>
      </div>

      <div v-if="loading" class="p-10 text-center text-slate-500">Chargement...</div>
      <UserForm v-else :key="user?.id || 'create'" :user="isCreate ? null : user" @saved="onSaved" @cancel="goBack" />
    </section>

    <AppModal v-model="showPasswordModal" title="🔑 Mot de passe généré" size="sm">
      <div class="space-y-3">
        <p class="text-sm text-gray-700">Voici le mot de passe pour <strong>{{ passwordUserName }}</strong> :</p>
        <div class="rounded-lg border-2 border-blue-300 bg-blue-50 p-4 text-center">
          <div class="select-all font-mono text-2xl font-bold text-blue-900">{{ generatedPassword }}</div>
        </div>
        <p class="text-xs text-orange-600">⚠️ Notez-le maintenant ! Il ne sera plus affiché.</p>
        <button type="button" class="btn-secondary w-full" @click="copierMotDePasse">📋 Copier dans le presse-papier</button>
      </div>
      <template #footer>
        <button type="button" class="btn-primary w-full" @click="confirmPasswordSeen">
          J'ai bien noté le mot de passe
        </button>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'
import AppModal from '@/components/InlinePanelModal.vue'
import UserForm from '@/components/UserForm.vue'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const auth = useAuthStore()

const user = ref(null)
const loading = ref(true)
const roleOptions = ref([])
const showPasswordModal = ref(false)
const generatedPassword = ref('')
const passwordUserName = ref('')

const isCreate = computed(() => route.name === 'utilisateur-create')
const currentRole = computed(() => roleOptions.value.find((role) => role.code === user.value?.role) || null)
const baseRole = computed(() => currentRole.value?.base_role || user.value?.role || '')
const roleLabel = computed(() => currentRole.value?.label || fallbackRoleLabels[baseRole.value] || user.value?.role || 'À sélectionner')
const totalResponsibilities = computed(() => responsibilityCards.value.reduce((sum, item) => sum + Number(item.value || 0), 0))
const accountRisk = computed(() => {
  if (isCreate.value) {
    return {
      label: 'À définir',
      title: 'Créer avec le minimum d’accès',
      detail: 'Choisissez le rôle le plus limité possible, puis augmentez les droits seulement si le poste en a besoin.',
      badgeClass: 'bg-sky-100 text-sky-700',
      panelClass: 'border-sky-200 bg-sky-50 text-sky-800',
    }
  }

  if (!user.value?.is_active) {
    return {
      label: 'Bloqué',
      title: 'Compte inactif',
      detail: 'Cet utilisateur ne peut pas se connecter. C’est adapté pour un départ, une suspension ou un compte temporairement bloqué.',
      badgeClass: 'bg-slate-100 text-slate-600',
      panelClass: 'border-slate-200 bg-slate-50 text-slate-700',
    }
  }

  if (baseRole.value === 'admin') {
    return {
      label: 'Risque élevé',
      title: 'Accès administrateur complet',
      detail: 'Ce compte doit rester rare. Vérifiez que la personne doit vraiment gérer les utilisateurs, les rôles et les paramètres sensibles.',
      badgeClass: 'bg-red-100 text-red-700',
      panelClass: 'border-red-200 bg-red-50 text-red-800',
    }
  }

  if (baseRole.value === 'gerant') {
    return {
      label: 'Sensible',
      title: 'Accès de pilotage large',
      detail: 'Ce compte peut voir beaucoup d’informations de gestion. À garder pour les profils responsables.',
      badgeClass: 'bg-amber-100 text-amber-700',
      panelClass: 'border-amber-200 bg-amber-50 text-amber-800',
    }
  }

  if (baseRole.value === 'caissier') {
    return {
      label: 'Minimal',
      title: 'Accès caisse',
      detail: 'Bon profil pour la caisse : il doit rester concentré sur les opérations de vente et d’encaissement.',
      badgeClass: 'bg-emerald-100 text-emerald-700',
      panelClass: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    }
  }

  return {
    label: currentRole.value ? 'Métier' : 'À vérifier',
    title: currentRole.value ? 'Rôle métier' : 'Rôle non reconnu',
    detail: currentRole.value?.description || 'Le rôle existe peut-être encore sur le compte mais il n’est pas présent dans la liste active des rôles.',
    badgeClass: currentRole.value ? 'bg-cyan-100 text-cyan-700' : 'bg-orange-100 text-orange-700',
    panelClass: currentRole.value ? 'border-cyan-200 bg-cyan-50 text-cyan-800' : 'border-orange-200 bg-orange-50 text-orange-800',
  }
})
const accountCards = computed(() => [
  {
    key: 'status',
    label: 'Statut',
    value: isCreate.value ? 'Nouveau' : (user.value?.is_active ? 'Actif' : 'Inactif'),
    hint: isCreate.value ? 'Le compte sera actif par défaut.' : (user.value?.is_active ? 'Peut se connecter.' : 'Connexion bloquée.'),
  },
  {
    key: 'role',
    label: 'Rôle',
    value: roleLabel.value,
    hint: baseRole.value ? `Base : ${fallbackRoleLabels[baseRole.value] || baseRole.value}` : 'À choisir dans le formulaire.',
  },
  {
    key: 'phone',
    label: 'Téléphone',
    value: user.value?.phone || 'Non renseigné',
    hint: user.value?.phone ? 'Contact direct disponible.' : 'À compléter si possible.',
  },
  {
    key: 'updated',
    label: isCreate.value ? 'Conseil' : 'Dernière mise à jour',
    value: isCreate.value ? 'Mot de passe généré' : formatDate(user.value?.updated_at),
    hint: isCreate.value ? 'Plus sûr pour démarrer.' : 'Repère de suivi du compte.',
  },
])
const securityChecklist = computed(() => [
  {
    label: baseRole.value === 'caissier' ? 'Accès limité' : 'Rôle adapté au poste',
    detail: baseRole.value === 'caissier'
      ? 'Un caissier doit garder uniquement les écrans nécessaires à la caisse.'
      : 'Évitez les rôles admin/gérant si un rôle métier suffit.',
  },
  {
    label: 'Téléphone renseigné',
    detail: user.value?.phone ? 'Le compte est joignable rapidement.' : 'Ajoutez un numéro si cette personne doit être contactée.',
  },
  {
    label: 'Compte actif maîtrisé',
    detail: user.value?.is_active === false ? 'Le blocage est déjà appliqué.' : 'Désactivez les comptes qui ne doivent plus accéder.',
  },
  {
    label: 'Responsabilités visibles',
    detail: totalResponsibilities.value > 0 ? 'Vérifiez les éléments liés avant suppression.' : 'Aucun rattachement commercial visible.',
  },
])
const responsibilityCards = computed(() => [
  {
    key: 'clients',
    label: 'Clients gérés',
    value: Number(user.value?.clients_geres_count || 0),
    hint: 'Clients affectés à cet utilisateur.',
  },
  {
    key: 'devis',
    label: 'Devis',
    value: Number(user.value?.devis_commercial_count || 0),
    hint: 'Devis suivis comme commercial.',
  },
  {
    key: 'factures',
    label: 'Factures',
    value: Number(user.value?.factures_commercial_count || 0),
    hint: 'Factures rattachées au commercial.',
  },
])

const fallbackRoleLabels = {
  admin: 'Administrateur',
  gerant: 'Gérant',
  commercial: 'Commercial',
  magasinier: 'Gestionnaire stock',
  comptable: 'Comptable',
  caissier: 'Caissier',
}

onMounted(() => {
  loadRoleOptions()
  loadUser()
})
watch(() => route.params.id, loadUser)

async function loadRoleOptions() {
  try {
    const { data } = await api.get('/access-control/role-options')
    roleOptions.value = Array.isArray(data) ? data : []
  } catch (error) {
    roleOptions.value = Object.entries(fallbackRoleLabels).map(([code, label]) => ({ code, label, base_role: code, is_system: true }))
  }
}

async function loadUser() {
  if (isCreate.value) {
    user.value = null
    loading.value = false
    return
  }

  if (!route.params.id) return

  loading.value = true
  try {
    const { data } = await api.get(`/users/${route.params.id}`)
    user.value = data
  } catch (error) {
    toast.error(error.response?.data?.message || 'Utilisateur introuvable.')
    router.replace({ name: 'utilisateurs' })
  } finally {
    loading.value = false
  }
}

function onSaved(payload) {
  if (payload.user?.id === auth.user?.id) {
    auth.user = payload.user
    localStorage.setItem('xelltekk_user', JSON.stringify(payload.user))
  }

  if (payload.password_genere) {
    passwordUserName.value = payload.user?.name || ''
    generatedPassword.value = payload.password_genere
    showPasswordModal.value = true
    return
  }

  goBack()
}

function confirmPasswordSeen() {
  showPasswordModal.value = false
  goBack()
}

function goBack() {
  router.push({ name: 'utilisateurs' })
}

function goToRoles() {
  router.push({ name: 'roles-permissions' })
}

function copierMotDePasse() {
  navigator.clipboard.writeText(generatedPassword.value)
  toast.success('Mot de passe copié !')
}

function photoUrl(value) {
  if (!value?.photo) return ''
  return value.photo
}

function initiales(name) {
  return (name || '')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('fr-FR')
}
</script>
