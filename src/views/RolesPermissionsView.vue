<template>
  <div class="space-y-5">
    <section class="access-hero rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <span class="inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.2em]">Sécurité avancée</span>
          <h1 class="mt-3 text-2xl font-black text-slate-950">Rôles & permissions</h1>
          <p class="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Créez des rôles personnalisés, donnez ou retirez des accès par module, puis attribuez ces rôles aux utilisateurs.
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <button type="button" class="btn-secondary" @click="duplicateSelected" :disabled="!selectedRole">Dupliquer</button>
          <button type="button" class="btn-primary" @click="newRole">+ Nouveau rôle</button>
        </div>
      </div>
    </section>

    <section class="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
      <article class="rounded-3xl border border-cyan-200 bg-cyan-50/70 p-4 shadow-sm">
        <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 class="font-black text-slate-950">Profils rapides conseillés</h2>
            <p class="mt-1 text-sm text-slate-600">
              Repères simples pour choisir le bon niveau d’accès avant de créer ou dupliquer un rôle.
            </p>
          </div>
          <span class="rounded-full bg-white px-3 py-1 text-xs font-black text-cyan-700">
            Lecture seule
          </span>
        </div>

        <div class="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <article v-for="profile in quickProfiles" :key="profile.code" class="quick-profile-card">
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="text-sm font-black text-slate-950">{{ profile.label }}</p>
                <p class="mt-1 text-xs font-semibold text-slate-500">{{ profile.description }}</p>
              </div>
              <span class="text-xl">{{ profile.icon }}</span>
            </div>
            <div class="mt-3 flex flex-wrap gap-1">
              <span v-for="tag in profile.tags" :key="tag" class="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-slate-600">
                {{ tag }}
              </span>
            </div>
            <button type="button" class="mt-3 text-xs font-black text-cyan-700 hover:underline" @click="openQuickProfile(profile)">
              {{ quickProfileRole(profile.code) ? 'Ouvrir le rôle modèle' : 'Créer avec cette base' }}
            </button>
          </article>
        </div>
      </article>

      <article class="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 class="font-black text-slate-950">Lecture du rôle sélectionné</h2>
            <p class="mt-1 text-sm text-slate-600">
              Résumé immédiat pour éviter d’accorder trop de droits sans s’en rendre compte.
            </p>
          </div>
          <span class="rounded-full px-3 py-1 text-xs font-black" :class="selectedRoleRisk.badgeClass">
            {{ selectedRoleRisk.label }}
          </span>
        </div>

        <div v-if="form" class="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div v-for="card in selectedRoleCards" :key="card.label" class="rounded-2xl border border-slate-100 bg-slate-50 p-3">
            <p class="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{{ card.label }}</p>
            <p class="mt-2 text-2xl font-black text-slate-950">{{ card.value }}</p>
            <p class="mt-1 text-xs font-semibold text-slate-500">{{ card.hint }}</p>
          </div>
        </div>

        <div v-if="form" class="mt-4 rounded-2xl border p-3 text-sm" :class="selectedRoleRisk.panelClass">
          <p class="font-black">{{ selectedRoleRisk.title }}</p>
          <p class="mt-1 font-semibold">{{ selectedRoleRisk.detail }}</p>
        </div>
        <div v-else class="mt-4 rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-400">
          Sélectionnez un rôle pour afficher son résumé.
        </div>
      </article>
    </section>

    <section class="rounded-3xl border border-sky-200 bg-sky-50/70 p-4 shadow-sm">
      <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 class="font-black text-slate-950">Audit des rôles existants</h2>
          <p class="mt-1 text-sm text-slate-600">
            Lecture seule : contrôle des rôles, utilisateurs associés et accès sensibles. Aucun droit n’est modifié ici.
          </p>
          <p v-if="accessAudit?.generated_at" class="mt-1 text-xs font-semibold text-sky-700">
            Dernière analyse : {{ formatDateTime(accessAudit.generated_at) }}
          </p>
        </div>
        <button type="button" class="btn-secondary px-3 py-2 text-xs" @click="loadAudit">Rafraîchir l’audit</button>
      </div>

      <div v-if="accessAudit" class="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <div v-for="card in auditCards" :key="card.label" class="rounded-2xl border border-sky-100 bg-white p-3">
          <div class="text-xs font-black uppercase tracking-[0.18em] text-slate-500">{{ card.label }}</div>
          <div class="mt-2 text-2xl font-black text-slate-950">{{ card.value }}</div>
          <div class="mt-1 text-xs text-slate-500">{{ card.hint }}</div>
        </div>
      </div>

      <div v-if="accessAudit?.unknown_role_users?.length" class="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
        <strong>{{ accessAudit.unknown_role_users.length }} utilisateur(s)</strong> ont un rôle qui n’existe pas dans la liste des rôles :
        {{ accessAudit.unknown_role_users.map((user) => `${user.name} (${user.role})`).join(', ') }}
      </div>

      <div v-if="accessAudit" class="mt-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div class="flex flex-wrap gap-2">
          <button
            v-for="filter in auditFilters"
            :key="filter.value"
            type="button"
            class="access-filter-pill"
            :class="auditFilter === filter.value ? 'access-filter-pill-active' : ''"
            @click="auditFilter = filter.value"
          >
            {{ filter.label }}
          </button>
        </div>
        <input v-model.trim="auditSearch" class="input md:w-72" placeholder="Rechercher un rôle..." />
      </div>

      <div v-if="accessAudit" class="access-table-shell mt-4 rounded-2xl border border-sky-100 bg-white">
        <table class="min-w-full text-sm">
          <thead class="bg-sky-100/70 text-left text-xs uppercase tracking-wide text-slate-600">
            <tr>
              <th class="px-3 py-2">Rôle</th>
              <th class="px-3 py-2">Base</th>
              <th class="px-3 py-2 text-center">Utilisateurs</th>
              <th class="px-3 py-2 text-center">Permissions</th>
              <th class="px-3 py-2">Accès sensibles</th>
              <th class="px-3 py-2">Alertes</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-sky-100">
            <tr v-for="role in displayedAuditRoles" :key="role.id">
              <td class="px-3 py-3">
                <div class="font-black text-slate-900">{{ role.label }}</div>
                <div class="text-xs font-mono text-slate-500">{{ role.code }}</div>
                <span class="mt-1 inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold" :class="role.is_system ? 'bg-slate-100 text-slate-700' : 'bg-emerald-50 text-emerald-700'">
                  {{ role.is_system ? 'Système' : 'Personnalisé' }}
                </span>
              </td>
              <td class="px-3 py-3 text-slate-600">{{ role.base_role || '—' }}</td>
              <td class="px-3 py-3 text-center">
                <div class="font-black text-slate-900">{{ role.users_count }}</div>
                <div class="text-xs text-slate-500">{{ role.active_users_count }} actif(s)</div>
              </td>
              <td class="px-3 py-3 text-center font-black text-slate-900">{{ role.permissions_count }}</td>
              <td class="max-w-md px-3 py-3">
                <div v-if="role.sensitive_permissions.length" class="flex flex-wrap gap-1">
                  <span v-for="permission in role.sensitive_permissions" :key="permission" class="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-bold text-red-700">
                    {{ formatPermission(permission) }}
                  </span>
                </div>
                <span v-else class="text-xs text-slate-400">Aucun accès sensible détecté</span>
              </td>
              <td class="max-w-sm px-3 py-3">
                <ul v-if="role.warnings.length" class="space-y-1 text-xs text-amber-700">
                  <li v-for="warning in role.warnings" :key="warning">⚠ {{ warning }}</li>
                </ul>
                <span v-else class="text-xs text-emerald-600">RAS</span>
              </td>
            </tr>
            <tr v-if="!displayedAuditRoles.length">
              <td colspan="6" class="px-3 py-8 text-center text-sm font-semibold text-slate-400">
                Aucun rôle ne correspond au filtre.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="rounded-3xl border border-cyan-200 bg-cyan-50/70 p-4 shadow-sm">
      <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 class="font-black text-slate-950">Matrice recommandée</h2>
          <p class="mt-1 text-sm text-slate-600">
            Lecture seule : comparaison entre les droits actuels et une configuration recommandée plus prudente.
            Aucune modification automatique n’est appliquée.
          </p>
          <p v-if="recommendedMatrix?.generated_at" class="mt-1 text-xs font-semibold text-cyan-700">
            Dernière analyse : {{ formatDateTime(recommendedMatrix.generated_at) }}
          </p>
        </div>
        <button type="button" class="btn-secondary px-3 py-2 text-xs" @click="loadRecommendedMatrix">Rafraîchir la matrice</button>
      </div>

      <div v-if="recommendedMatrix" class="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <div v-for="card in matrixCards" :key="card.label" class="rounded-2xl border border-cyan-100 bg-white p-3">
          <div class="text-xs font-black uppercase tracking-[0.18em] text-slate-500">{{ card.label }}</div>
          <div class="mt-2 text-2xl font-black text-slate-950">{{ card.value }}</div>
          <div class="mt-1 text-xs text-slate-500">{{ card.hint }}</div>
        </div>
      </div>

      <div v-if="recommendedMatrix" class="mt-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div class="flex flex-wrap gap-2">
          <button
            v-for="filter in matrixFilters"
            :key="filter.value"
            type="button"
            class="access-filter-pill"
            :class="matrixFilter === filter.value ? 'access-filter-pill-active' : ''"
            @click="matrixFilter = filter.value"
          >
            {{ filter.label }}
          </button>
        </div>
        <input v-model.trim="matrixSearch" class="input md:w-72" placeholder="Rechercher dans la matrice..." />
      </div>

      <div v-if="recommendedMatrix" class="access-table-shell mt-4 rounded-2xl border border-cyan-100 bg-white">
        <table class="min-w-full text-sm">
          <thead class="bg-cyan-100/70 text-left text-xs uppercase tracking-wide text-slate-600">
            <tr>
              <th class="px-3 py-2">Rôle</th>
              <th class="px-3 py-2">Base</th>
              <th class="px-3 py-2">Statut</th>
              <th class="px-3 py-2 text-center">Actuel / recommandé</th>
              <th class="px-3 py-2">Trop accordé</th>
              <th class="px-3 py-2">Manquant</th>
              <th class="px-3 py-2">Sensible à revoir</th>
              <th class="px-3 py-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-cyan-100">
            <tr v-for="role in displayedMatrixRoles" :key="role.id">
              <td class="px-3 py-3">
                <div class="font-black text-slate-900">{{ role.label }}</div>
                <div class="text-xs font-mono text-slate-500">{{ role.code }}</div>
              </td>
              <td class="px-3 py-3 text-slate-600">{{ role.base_role || '—' }}</td>
              <td class="px-3 py-3">
                <span class="rounded-full px-2 py-1 text-xs font-black" :class="matrixStatusClass(role.status)">
                  {{ matrixStatusLabel(role.status) }}
                </span>
              </td>
              <td class="px-3 py-3 text-center">
                <div class="font-black text-slate-900">{{ role.current_count }} / {{ role.recommended_count }}</div>
                <div class="text-xs text-slate-500">{{ role.users_count }} utilisateur(s)</div>
              </td>
              <td class="max-w-md px-3 py-3">
                <div v-if="role.extra_permissions.length" class="flex flex-wrap gap-1">
                  <span v-for="permission in previewPermissions(role.extra_permissions)" :key="permission" class="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                    {{ formatPermission(permission) }}
                  </span>
                  <span v-if="remainingPermissions(role.extra_permissions)" class="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">
                    +{{ remainingPermissions(role.extra_permissions) }}
                  </span>
                </div>
                <span v-else class="text-xs text-emerald-600">RAS</span>
              </td>
              <td class="max-w-md px-3 py-3">
                <div v-if="role.missing_permissions.length" class="flex flex-wrap gap-1">
                  <span v-for="permission in previewPermissions(role.missing_permissions)" :key="permission" class="rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-bold text-sky-700">
                    {{ formatPermission(permission) }}
                  </span>
                  <span v-if="remainingPermissions(role.missing_permissions)" class="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">
                    +{{ remainingPermissions(role.missing_permissions) }}
                  </span>
                </div>
                <span v-else class="text-xs text-emerald-600">RAS</span>
              </td>
              <td class="max-w-md px-3 py-3">
                <div v-if="role.sensitive_extra_permissions.length" class="flex flex-wrap gap-1">
                  <span v-for="permission in previewPermissions(role.sensitive_extra_permissions)" :key="permission" class="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-bold text-red-700">
                    {{ formatPermission(permission) }}
                  </span>
                  <span v-if="remainingPermissions(role.sensitive_extra_permissions)" class="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">
                    +{{ remainingPermissions(role.sensitive_extra_permissions) }}
                  </span>
                </div>
                <span v-else class="text-xs text-emerald-600">RAS</span>
              </td>
              <td class="px-3 py-3 text-right">
                <button
                  v-if="role.has_recommendation && role.status === 'review'"
                  type="button"
                  class="btn-primary px-3 py-2 text-xs"
                  :disabled="applyingRecommendedRoleId === role.id"
                  @click="applyRecommendedRole(role)"
                >
                  {{ applyingRecommendedRoleId === role.id ? 'Application...' : 'Appliquer' }}
                </button>
                <span v-else-if="role.status === 'ok'" class="text-xs font-bold text-emerald-600">Conforme</span>
                <span v-else class="text-xs text-slate-400">Base à définir</span>
              </td>
            </tr>
            <tr v-if="!displayedMatrixRoles.length">
              <td colspan="8" class="px-3 py-8 text-center text-sm font-semibold text-slate-400">
                Aucun rôle ne correspond au filtre.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 class="font-black text-slate-950">Journal des droits</h2>
          <p class="mt-1 text-sm text-slate-600">
            Dernières actions réalisées sur les rôles, exceptions et matrices recommandées.
          </p>
        </div>
        <button type="button" class="btn-secondary px-3 py-2 text-xs" :disabled="activitiesLoading" @click="loadAccessActivities">
          {{ activitiesLoading ? 'Chargement...' : 'Rafraîchir le journal' }}
        </button>
      </div>

      <div v-if="accessActivities.length" class="mt-4 overflow-x-auto rounded-2xl border border-slate-100">
        <table class="min-w-full text-sm">
          <thead class="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th class="px-3 py-2">Date</th>
              <th class="px-3 py-2">Utilisateur</th>
              <th class="px-3 py-2">Action</th>
              <th class="px-3 py-2">Objet</th>
              <th class="px-3 py-2">Impact</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="activity in accessActivities" :key="`${activity.date}-${activity.event}-${activity.subject_id}`">
              <td class="whitespace-nowrap px-3 py-3 text-xs font-semibold text-slate-600">{{ formatDateTime(activity.date) }}</td>
              <td class="px-3 py-3">
                <div class="font-bold text-slate-900">{{ activity.user_name || 'Système' }}</div>
                <div class="text-xs text-slate-500">{{ activity.user_role || '—' }}</div>
              </td>
              <td class="px-3 py-3">
                <div class="font-black text-slate-900">{{ activity.title || activityEventLabel(activity.event) }}</div>
                <div v-if="activity.description" class="mt-1 max-w-md text-xs text-slate-500">{{ activity.description }}</div>
              </td>
              <td class="px-3 py-3">
                <div class="font-mono text-xs font-bold text-slate-700">{{ activity.reference || activity.subject_label || '—' }}</div>
                <div class="text-xs text-slate-500">{{ activity.subject_module || activity.subject_type || 'Accès' }}</div>
              </td>
              <td class="px-3 py-3">
                <span class="rounded-full bg-cyan-50 px-2 py-1 text-xs font-bold text-cyan-700">
                  {{ activityImpactLabel(activity) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="mt-4 rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-400">
        Aucune modification de droits enregistrée pour le moment.
      </div>
    </section>

    <section class="grid grid-cols-1 gap-4 xl:grid-cols-[360px_1fr]">
      <aside class="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div class="flex items-center justify-between gap-3">
          <div>
            <h2 class="font-black text-slate-950">Rôles</h2>
            <p class="text-sm text-slate-500">{{ roles.length }} rôle(s) disponible(s)</p>
          </div>
          <button type="button" class="btn-secondary px-3 py-2 text-xs" @click="loadAll">Actualiser</button>
        </div>

        <div class="mt-4 space-y-2">
          <input v-model.trim="roleSearch" class="input" placeholder="Rechercher un rôle..." />
          <select v-model="roleTypeFilter" class="input">
            <option value="all">Tous les rôles</option>
            <option value="system">Modèles système</option>
            <option value="custom">Personnalisés</option>
            <option value="active">Actifs</option>
            <option value="inactive">Inactifs</option>
          </select>
        </div>

        <div class="mt-4 space-y-2">
          <button
            v-for="role in displayedRoles"
            :key="role.id"
            type="button"
            class="w-full rounded-2xl border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-sm"
            :class="selectedRole?.id === role.id ? 'border-[var(--saytu-primary)] bg-blue-50/70' : 'border-slate-200 bg-white'"
            @click="selectRole(role)"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <div class="truncate font-bold text-slate-900">{{ role.label }}</div>
                <div class="mt-1 text-xs font-mono text-slate-500">{{ role.code }}</div>
              </div>
              <span class="rounded-full px-2 py-0.5 text-[11px] font-bold" :class="role.is_system ? 'bg-slate-100 text-slate-700' : 'bg-emerald-50 text-emerald-700'">
                {{ role.is_system ? 'Modèle' : 'Perso' }}
              </span>
            </div>
            <p class="mt-2 line-clamp-2 text-xs text-slate-500">{{ role.description || 'Aucune description.' }}</p>
            <div class="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-500">
              <span class="rounded-full bg-slate-100 px-2 py-0.5">{{ role.users_count || 0 }} utilisateur(s)</span>
              <span class="rounded-full bg-slate-100 px-2 py-0.5">{{ rolePermissionCount(role) }} droit(s)</span>
              <span v-if="!role.is_active" class="rounded-full bg-red-50 px-2 py-0.5 text-red-700">Inactif</span>
            </div>
          </button>
          <div v-if="!displayedRoles.length" class="rounded-2xl border border-dashed border-slate-200 p-5 text-center text-sm font-semibold text-slate-400">
            Aucun rôle trouvé.
          </div>
        </div>
      </aside>

      <main class="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div v-if="loading" class="p-12 text-center text-slate-500">Chargement...</div>

        <div v-else-if="!form" class="p-12 text-center text-slate-500">
          Sélectionnez un rôle ou créez un nouveau rôle.
        </div>

        <div v-else class="divide-y divide-slate-100">
          <div class="p-4 sm:p-5">
            <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 class="text-xl font-black text-slate-950">
                  {{ form.id ? form.label : 'Nouveau rôle personnalisé' }}
                </h2>
                <p class="mt-1 text-sm text-slate-500">
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
                <span class="text-sm font-semibold text-slate-700">Rôle actif</span>
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
                <h3 class="font-black text-slate-950">Matrice des permissions</h3>
                <p class="text-sm text-slate-500">Cochez les actions autorisées pour chaque rubrique.</p>
              </div>
              <div class="flex flex-wrap gap-2">
                <button type="button" class="btn-secondary px-3 py-2 text-xs" :disabled="selectedRole?.is_system" @click="setAll(false)">Tout retirer</button>
                <button type="button" class="btn-secondary px-3 py-2 text-xs" :disabled="selectedRole?.is_system" @click="setCommonReadOnly">Lecture seule</button>
              </div>
            </div>

            <div class="mb-4 grid gap-3 lg:grid-cols-[1fr_auto]">
              <input v-model.trim="moduleSearch" class="input" placeholder="Filtrer les rubriques de permissions..." />
              <select v-model="moduleScopeFilter" class="input lg:w-56">
                <option value="all">Toutes les rubriques</option>
                <option value="enabled">Avec droit actif</option>
                <option value="sensitive">Avec droit sensible</option>
              </select>
            </div>

            <div class="space-y-4">
              <section v-for="group in displayedGroupedModules" :key="group.name" class="rounded-2xl border border-slate-200 p-3">
                <h4 class="mb-3 text-sm font-black uppercase tracking-wide text-slate-500">{{ group.name }}</h4>
                <div class="overflow-x-auto">
                  <table class="min-w-full text-sm">
                    <thead>
                      <tr class="text-left text-xs uppercase tracking-wide text-slate-500">
                        <th class="w-56 py-2 pr-3">Rubrique</th>
                        <th v-for="action in actionKeys" :key="action" class="px-2 py-2 text-center">{{ actions[action] }}</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                      <tr v-for="module in group.items" :key="module.key">
                        <td class="py-3 pr-3">
                          <div class="font-bold text-slate-800">{{ module.label }}</div>
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
              <div v-if="!displayedGroupedModules.length" class="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm font-semibold text-slate-400">
                Aucune rubrique ne correspond au filtre.
              </div>
            </div>
          </div>

          <div class="p-4 sm:p-5">
            <div class="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h3 class="font-black text-slate-950">Exceptions utilisateur</h3>
                <p class="text-sm text-slate-500">
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

            <div v-if="userAccess" class="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h4 class="font-black text-slate-900">{{ userAccess.user.name }}</h4>
                  <p class="text-sm text-slate-500">{{ userAccess.role?.label || userAccess.user.role }}</p>
                </div>
                <span class="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600">
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
                  <tbody class="divide-y divide-slate-200">
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
const { confirm: askConfirm } = useConfirm()

const loading = ref(false)
const saving = ref(false)
const applyingRecommendedRoleId = ref(null)
const activitiesLoading = ref(false)
const definitions = ref({ modules: {}, actions: {}, system_roles: {} })
const accessAudit = ref(null)
const recommendedMatrix = ref(null)
const accessActivities = ref([])
const roles = ref([])
const selectedRole = ref(null)
const form = ref(null)
const users = ref([])
const selectedUserId = ref('')
const userAccess = ref(null)
const overrideForm = ref({ module: '', permission: 'view', value: '1', expires_at: '', reason: '' })
const roleSearch = ref('')
const roleTypeFilter = ref('all')
const auditSearch = ref('')
const auditFilter = ref('all')
const matrixSearch = ref('')
const matrixFilter = ref('all')
const moduleSearch = ref('')
const moduleScopeFilter = ref('all')

const sensitiveActionKeys = ['delete', 'restore', 'approve', 'validate', 'sensitive']
const auditFilters = [
  { label: 'Tous', value: 'all' },
  { label: 'Avec utilisateurs', value: 'used' },
  { label: 'Accès sensibles', value: 'sensitive' },
  { label: 'Alertes', value: 'warnings' },
  { label: 'Sans utilisateur', value: 'empty' },
]
const matrixFilters = [
  { label: 'Tous', value: 'all' },
  { label: 'À vérifier', value: 'review' },
  { label: 'Trop accordé', value: 'extra' },
  { label: 'Sensible', value: 'sensitive' },
  { label: 'Conforme', value: 'ok' },
]
const quickProfiles = [
  {
    code: 'caissier',
    label: 'Caissier',
    icon: '💳',
    description: 'Caisse, ticket et encaissement. Accès très limité au reste.',
    tags: ['Caisse', 'Paiement', 'Minimal'],
  },
  {
    code: 'commercial',
    label: 'Commercial',
    icon: '🤝',
    description: 'Clients, prospection, devis et suivi commercial.',
    tags: ['Clients', 'Devis', 'Relance'],
  },
  {
    code: 'magasinier',
    label: 'Stock',
    icon: '📦',
    description: 'Produits, stock, réception et mouvements physiques.',
    tags: ['Produits', 'Stock', 'Réception'],
  },
  {
    code: 'comptable',
    label: 'Comptable',
    icon: '📘',
    description: 'Factures, règlements, comptabilité et rapprochements.',
    tags: ['Factures', 'Compta', 'Paiements'],
  },
  {
    code: 'gerant',
    label: 'Gérant',
    icon: '📊',
    description: 'Pilotage large, validations et analyse, sans administration complète.',
    tags: ['Pilotage', 'Validation', 'Analyse'],
  },
  {
    code: 'admin',
    label: 'Admin',
    icon: '🔐',
    description: 'Administration complète. À réserver au strict nécessaire.',
    tags: ['Tout accès', 'Sensible', 'Rare'],
  },
]

const actions = computed(() => definitions.value.actions || {})
const actionKeys = computed(() => Object.keys(actions.value))
const systemRoleOptions = computed(() => roles.value.filter((role) => role.is_system))
const moduleOptions = computed(() => Object.entries(definitions.value.modules || {}).map(([key, module]) => ({ key, ...module })))
const auditCards = computed(() => {
  const summary = accessAudit.value?.summary || {}
  return [
    { label: 'Rôles', value: summary.roles_total ?? 0, hint: `${summary.custom_roles ?? 0} personnalisé(s)` },
    { label: 'Utilisateurs', value: summary.users_total ?? 0, hint: `${summary.active_users ?? 0} actif(s)` },
    { label: 'Rôles vides', value: summary.roles_without_users ?? 0, hint: 'Sans utilisateur associé' },
    { label: 'Rôles inconnus', value: summary.unknown_role_users ?? 0, hint: 'Utilisateurs à vérifier' },
    { label: 'Accès sensibles', value: summary.roles_with_sensitive_permissions ?? 0, hint: 'Rôles concernés' },
  ]
})
const matrixCards = computed(() => {
  const summary = recommendedMatrix.value?.summary || {}
  return [
    { label: 'À vérifier', value: summary.roles_to_review ?? 0, hint: 'Rôles avec écarts' },
    { label: 'Trop accordé', value: summary.roles_with_extra_permissions ?? 0, hint: 'Droits à contrôler' },
    { label: 'Droits manquants', value: summary.roles_with_missing_permissions ?? 0, hint: 'Droits recommandés absents' },
    { label: 'Accès sensibles', value: summary.roles_with_sensitive_extra_permissions ?? 0, hint: 'À retirer si inutile' },
    { label: 'Sans modèle', value: summary.roles_without_recommendation ?? 0, hint: 'Base métier inconnue' },
  ]
})
const enabledPermissionEntries = computed(() => {
  if (!form.value?.permissions) return []

  const entries = []
  Object.entries(form.value.permissions).forEach(([module, permissions]) => {
    Object.entries(permissions || {}).forEach(([action, enabled]) => {
      if (enabled) entries.push({ module, action, key: `${module}.${action}` })
    })
  })

  return entries
})
const enabledModulesCount = computed(() => new Set(enabledPermissionEntries.value.map((entry) => entry.module)).size)
const sensitivePermissionEntries = computed(() => enabledPermissionEntries.value.filter((entry) => isSensitivePermission(entry.key)))
const currentAuditRole = computed(() => {
  if (!form.value?.code || !accessAudit.value?.roles) return null
  return accessAudit.value.roles.find((role) => role.code === form.value.code) || null
})
const selectedRoleRisk = computed(() => {
  if (!form.value) {
    return {
      label: 'Aucun rôle',
      badgeClass: 'bg-slate-100 text-slate-600',
      panelClass: 'border-slate-200 bg-slate-50 text-slate-600',
      title: 'Aucun rôle sélectionné',
      detail: 'Sélectionnez un rôle pour afficher l’analyse.',
    }
  }

  const sensitiveCount = sensitivePermissionEntries.value.length
  const totalCount = enabledPermissionEntries.value.length
  const baseRole = form.value.base_role || form.value.code

  if (baseRole === 'admin' || sensitiveCount >= 8 || totalCount >= 80) {
    return {
      label: 'Risque élevé',
      badgeClass: 'bg-red-100 text-red-700',
      panelClass: 'border-red-200 bg-red-50 text-red-800',
      title: 'Accès très large',
      detail: 'À réserver aux administrateurs de confiance. Vérifiez surtout suppression, restauration, validation et données sensibles.',
    }
  }

  if (sensitiveCount > 0 || totalCount >= 45) {
    return {
      label: 'À surveiller',
      badgeClass: 'bg-amber-100 text-amber-700',
      panelClass: 'border-amber-200 bg-amber-50 text-amber-800',
      title: 'Quelques droits sensibles détectés',
      detail: 'Le rôle peut agir sur des zones critiques. Gardez ces droits uniquement si la mission le justifie.',
    }
  }

  return {
    label: 'Prudent',
    badgeClass: 'bg-emerald-100 text-emerald-700',
    panelClass: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    title: 'Accès maîtrisé',
    detail: 'Le rôle reste relativement limité. Continuez à privilégier le minimum nécessaire.',
  }
})
const selectedRoleCards = computed(() => [
  {
    label: 'Modules',
    value: enabledModulesCount.value,
    hint: 'Rubriques accessibles',
  },
  {
    label: 'Droits',
    value: enabledPermissionEntries.value.length,
    hint: 'Actions autorisées',
  },
  {
    label: 'Sensibles',
    value: sensitivePermissionEntries.value.length,
    hint: 'À vérifier',
  },
  {
    label: 'Utilisateurs',
    value: currentAuditRole.value?.users_count ?? selectedRole.value?.users_count ?? 0,
    hint: `${currentAuditRole.value?.active_users_count ?? 0} actif(s)`,
  },
])
const displayedRoles = computed(() => {
  const needle = normalizeSearch(roleSearch.value)
  return roles.value.filter((role) => {
    if (roleTypeFilter.value === 'system' && !role.is_system) return false
    if (roleTypeFilter.value === 'custom' && role.is_system) return false
    if (roleTypeFilter.value === 'active' && role.is_active === false) return false
    if (roleTypeFilter.value === 'inactive' && role.is_active !== false) return false
    if (!needle) return true

    return normalizeSearch([
      role.label,
      role.code,
      role.description,
      role.base_role,
    ].join(' ')).includes(needle)
  })
})
const displayedAuditRoles = computed(() => {
  const needle = normalizeSearch(auditSearch.value)
  const rows = Array.isArray(accessAudit.value?.roles) ? accessAudit.value.roles : []

  return rows.filter((role) => {
    if (auditFilter.value === 'used' && Number(role.users_count || 0) <= 0) return false
    if (auditFilter.value === 'sensitive' && !role.sensitive_permissions?.length) return false
    if (auditFilter.value === 'warnings' && !role.warnings?.length) return false
    if (auditFilter.value === 'empty' && Number(role.users_count || 0) > 0) return false
    if (!needle) return true

    return normalizeSearch([
      role.label,
      role.code,
      role.base_role,
      ...(role.warnings || []),
      ...(role.sensitive_permissions || []),
    ].join(' ')).includes(needle)
  })
})
const displayedMatrixRoles = computed(() => {
  const needle = normalizeSearch(matrixSearch.value)
  const rows = Array.isArray(recommendedMatrix.value?.roles) ? recommendedMatrix.value.roles : []

  return rows.filter((role) => {
    if (matrixFilter.value === 'review' && role.status !== 'review') return false
    if (matrixFilter.value === 'extra' && !role.extra_permissions?.length) return false
    if (matrixFilter.value === 'sensitive' && !role.sensitive_extra_permissions?.length) return false
    if (matrixFilter.value === 'ok' && role.status !== 'ok') return false
    if (!needle) return true

    return normalizeSearch([
      role.label,
      role.code,
      role.base_role,
      role.status,
      ...(role.extra_permissions || []),
      ...(role.missing_permissions || []),
      ...(role.sensitive_extra_permissions || []),
    ].join(' ')).includes(needle)
  })
})
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
const displayedGroupedModules = computed(() => {
  const needle = normalizeSearch(moduleSearch.value)

  return groupedModules.value
    .map((group) => {
      const items = group.items.filter((module) => {
        if (needle && !normalizeSearch(`${module.label} ${module.key} ${group.name}`).includes(needle)) return false

        if (moduleScopeFilter.value === 'enabled') {
          return module.actions.some((action) => Boolean(form.value?.permissions?.[module.key]?.[action]))
        }

        if (moduleScopeFilter.value === 'sensitive') {
          return module.actions.some((action) => isSensitivePermission(`${module.key}.${action}`))
        }

        return true
      })

      return { ...group, items }
    })
    .filter((group) => group.items.length)
})

onMounted(loadAll)

async function loadAll() {
  loading.value = true
  try {
    const [{ data: defs }, { data: roleList }, { data: audit }, { data: matrix }, { data: usersPage }] = await Promise.all([
      api.get('/access-control/definitions'),
      api.get('/access-control/roles'),
      api.get('/access-control/audit'),
      api.get('/access-control/recommended-matrix'),
      api.get('/users', { params: { per_page: 100 } }),
    ])
    definitions.value = defs
    roles.value = roleList
    accessAudit.value = audit
    recommendedMatrix.value = matrix
    users.value = usersPage.data || []
    if (roles.value.length) {
      const current = selectedRole.value ? roles.value.find((role) => role.id === selectedRole.value.id) : roles.value[0]
      selectRole(current || roles.value[0])
    }
    await loadAccessActivities(false)
  } catch (e) {
    toast.error('Chargement des rôles impossible.')
  } finally {
    loading.value = false
  }
}

async function loadAudit() {
  try {
    const { data } = await api.get('/access-control/audit')
    accessAudit.value = data
    toast.success('Audit actualisé')
  } catch (e) {
    toast.error('Audit des rôles impossible.')
  }
}

async function loadAccessActivities(notify = true) {
  activitiesLoading.value = true
  try {
    const { data } = await api.get('/activites', {
      params: {
        category: 'access_control',
        limit: 25,
      },
    })
    accessActivities.value = data.data || []
    if (notify) toast.success('Journal des droits actualisé')
  } catch (e) {
    if (notify) toast.error('Journal des droits impossible à charger.')
  } finally {
    activitiesLoading.value = false
  }
}

async function loadRecommendedMatrix() {
  try {
    const { data } = await api.get('/access-control/recommended-matrix')
    recommendedMatrix.value = data
    toast.success('Matrice recommandée actualisée')
  } catch (e) {
    toast.error('Matrice recommandée impossible à charger.')
  }
}

async function applyRecommendedRole(role) {
  if (!role?.id || !role.has_recommendation) return

  const ok = await askConfirm({
    title: 'Appliquer la matrice recommandée',
    message: `Appliquer la recommandation au rôle ${role.label} ? ${role.extra_permissions_count} droit(s) seront retirés et ${role.missing_permissions_count} droit(s) seront ajoutés. Les utilisateurs gardent le même rôle.`,
    hint: 'Action contrôlée : vous pouvez toujours réajuster manuellement les droits du rôle après application.',
    confirmLabel: 'Appliquer',
    tone: role.sensitive_extra_permissions_count ? 'danger' : 'primary',
  })
  if (!ok) return

  applyingRecommendedRoleId.value = role.id
  try {
    const { data } = await api.put(`/access-control/roles/${role.id}/apply-recommended`)
    toast.success(data.message || 'Matrice recommandée appliquée.')
    await loadAll()
    await loadAccessActivities(false)
    const refreshed = roles.value.find((item) => item.id === role.id)
    if (refreshed) selectRole(refreshed)
  } catch (e) {
    toast.error(e.response?.data?.message || 'Application impossible.')
  } finally {
    applyingRecommendedRoleId.value = null
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
    await loadAccessActivities(false)
    toast.success(data.message || 'Exception mise à jour')
  } catch (e) {
    toast.error(e.response?.data?.message || 'Exception impossible.')
  }
}

function moduleLabel(key) {
  return definitions.value.modules?.[key]?.label || key
}

function normalizeSearch(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function rolePermissionCount(role) {
  return flattenPermissions(role?.permissions || {}).length
}

function flattenPermissions(permissions = {}) {
  const flat = []
  Object.entries(permissions || {}).forEach(([module, actionsMap]) => {
    Object.entries(actionsMap || {}).forEach(([action, enabled]) => {
      if (enabled) flat.push(`${module}.${action}`)
    })
  })
  return flat
}

function isSensitivePermission(permission) {
  const [module, action] = String(permission || '').split('.')
  if (sensitiveActionKeys.includes(action)) return true
  return ['access_control', 'xelltekk_admin', 'securite', 'licence', 'parametres', 'corbeille'].includes(module)
}

function quickProfileRole(code) {
  return roles.value.find((role) => role.code === code || role.base_role === code) || null
}

function openQuickProfile(profile) {
  const existing = quickProfileRole(profile.code)
  if (existing) {
    selectRole(existing)
    return
  }

  newRole()
  form.value.code = `${profile.code}_personnalise`
  form.value.label = `${profile.label} personnalisé`
  form.value.description = profile.description
  form.value.base_role = profile.code

  const baseRole = roles.value.find((role) => role.code === profile.code)
  if (baseRole?.permissions) {
    form.value.permissions = normalizePermissions(baseRole.permissions)
  }

  toast.info('Profil préparé en brouillon. Vérifiez puis enregistrez si besoin.')
}

function formatPermission(permission) {
  const [module, action] = String(permission || '').split('.')
  return `${moduleLabel(module)} · ${actions.value[action] || action}`
}

function formatDateTime(value) {
  if (!value) return ''
  return new Date(value).toLocaleString('fr-FR')
}

function previewPermissions(permissions = [], limit = 4) {
  return permissions.slice(0, limit)
}

function remainingPermissions(permissions = [], limit = 4) {
  return Math.max(0, permissions.length - limit)
}

function matrixStatusLabel(status) {
  return {
    ok: 'Conforme',
    review: 'À vérifier',
    no_template: 'Sans modèle',
  }[status] || status
}

function matrixStatusClass(status) {
  return {
    ok: 'bg-emerald-50 text-emerald-700',
    review: 'bg-amber-50 text-amber-700',
    no_template: 'bg-slate-100 text-slate-700',
  }[status] || 'bg-slate-100 text-slate-700'
}

function activityEventLabel(event) {
  return {
    role_created: 'Rôle créé',
    role_updated: 'Rôle modifié',
    role_duplicated: 'Rôle dupliqué',
    role_deleted: 'Rôle supprimé',
    role_recommendation_applied: 'Matrice appliquée',
    user_overrides_updated: 'Exception utilisateur',
  }[event] || event || 'Action'
}

function activityImpactLabel(activity) {
  const diff = activity?.metadata?.diff
  if (diff) {
    return `${diff.extra_permissions_count || 0} retiré(s) · ${diff.missing_permissions_count || 0} ajouté(s)`
  }

  const permissionsCount = activity?.metadata?.permissions_count
  if (permissionsCount !== undefined && permissionsCount !== null) {
    return `${permissionsCount} droit(s)`
  }

  const overrides = activity?.metadata?.requested_overrides
  if (Array.isArray(overrides)) {
    return `${overrides.length} exception(s)`
  }

  return activityEventLabel(activity?.event)
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
.label { @apply mb-1 block text-sm font-semibold text-slate-700; }

.access-hero {
  background:
    radial-gradient(circle at top right, color-mix(in srgb, var(--saytu-secondary) 18%, transparent), transparent 30rem),
    linear-gradient(135deg, color-mix(in srgb, var(--saytu-primary) 10%, white), white 64%);
}

.access-hero span {
  background: color-mix(in srgb, var(--saytu-primary) 12%, white);
  color: var(--saytu-primary);
}

.quick-profile-card {
  border: 1px solid color-mix(in srgb, var(--saytu-primary) 16%, #e2e8f0);
  border-radius: 1rem;
  background: rgb(255 255 255 / 0.85);
  padding: 0.85rem;
  transition: transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease;
}

.quick-profile-card:hover {
  transform: translateY(-1px);
  border-color: color-mix(in srgb, var(--saytu-primary) 35%, #e2e8f0);
  box-shadow: 0 14px 32px rgb(15 23 42 / 0.08);
}

.access-filter-pill {
  border: 1px solid #cbd5e1;
  border-radius: 9999px;
  background: #ffffff;
  color: #475569;
  font-size: 0.75rem;
  font-weight: 900;
  padding: 0.45rem 0.75rem;
  transition: background 160ms ease, color 160ms ease, border-color 160ms ease;
}

.access-filter-pill:hover,
.access-filter-pill-active {
  border-color: color-mix(in srgb, var(--saytu-primary) 45%, #cbd5e1);
  background: color-mix(in srgb, var(--saytu-primary) 12%, #ffffff);
  color: var(--saytu-primary);
}

.access-table-shell {
  overflow: auto;
  max-height: min(68vh, 720px);
}

.access-table-shell thead {
  position: sticky;
  top: 0;
  z-index: 1;
}

.access-table-shell table {
  min-width: 980px;
}

</style>
