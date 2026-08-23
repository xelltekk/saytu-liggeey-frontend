<template>
  <div class="space-y-4">
    <div class="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 class="text-xl font-bold text-slate-900">Ressources humaines</h2>
        <p class="text-sm text-slate-500">{{ pageSubtitle }}</p>
      </div>
      <button class="btn-primary" @click="openConge">+ Demande de congé</button>
    </div>

    <div class="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div class="flex gap-1 overflow-x-auto border-b border-slate-200 bg-slate-50 p-2">
        <button v-for="group in visibleGroups" :key="group.id"
                class="flex min-h-10 shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition"
                :class="groupButtonClass(group)"
                @click="selectGroup(group)">
          <component :is="group.icon" :size="17" />
          <span>{{ group.label }}</span>
        </button>
      </div>
      <div class="flex gap-1 overflow-x-auto p-2">
        <button v-for="tab in activeGroup.tabs" :key="tab.id"
                class="shrink-0 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition"
                :class="tabButtonClass(tab)"
                @click="activeTab = tab.id">
          {{ tab.label }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="rounded-lg border border-slate-200 bg-white p-12 text-center text-slate-500">Chargement...</div>

    <template v-else-if="activeTab === 'dashboard'">
      <div class="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <div v-for="card in statCards" :key="card.label" class="rounded-lg border border-slate-200 bg-white p-4">
          <p class="text-xs uppercase text-slate-500">{{ card.label }}</p>
          <p class="mt-2 text-2xl font-bold" :class="card.color">{{ card.value }}</p>
        </div>
      </div>

      <section v-if="canManage && dashboard.alertes.length" class="rounded-lg border border-slate-200 bg-white p-4">
        <div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <h3 class="font-bold text-slate-900">Alertes RH</h3>
          <span class="text-xs font-medium uppercase text-slate-500">{{ dashboard.alertes.length }} alerte(s)</span>
        </div>
        <div class="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
          <button v-for="alerte in dashboard.alertes" :key="`${alerte.type}-${alerte.message}`"
                  type="button"
                  class="rounded-md border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-sm"
                  :class="alerteClass(alerte.niveau)"
                  @click="goToAlert(alerte)">
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="text-sm font-bold">{{ alerte.titre }}</p>
                <p class="mt-1 text-sm">{{ alerte.message }}</p>
              </div>
              <span class="text-xs font-semibold uppercase">{{ alerte.niveau }}</span>
            </div>
          </button>
        </div>
      </section>

      <div class="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_420px]">
        <section class="rounded-lg border border-slate-200 bg-white p-4">
          <h3 class="font-bold text-slate-900">Répartition par service</h3>
          <div class="mt-4 space-y-3">
            <div v-for="item in dashboard.repartition_departements" :key="item.id">
              <div class="mb-1 flex justify-between text-sm"><span>{{ item.libelle }}</span><strong>{{ item.employes_count }}</strong></div>
              <div class="h-2 overflow-hidden rounded bg-slate-100">
                <div class="h-full rounded bg-blue-600" :style="{ width: departementWidth(item.employes_count) }"></div>
              </div>
            </div>
            <p v-if="dashboard.repartition_departements.length === 0" class="py-6 text-center text-sm text-slate-400">Créez vos services pour afficher la répartition.</p>
          </div>
        </section>
        <section class="rounded-lg border border-slate-200 bg-white p-4">
          <h3 class="font-bold text-slate-900">Prochains congés</h3>
          <div class="mt-3 divide-y divide-slate-100">
            <div v-for="conge in dashboard.prochains_conges" :key="conge.id" class="py-3 text-sm">
              <div class="flex items-center justify-between gap-2">
                <strong>{{ nomEmploye(conge.employe) }}</strong>
                <span class="badge" :style="{ backgroundColor: `${conge.type_conge?.couleur || '#64748b'}20`, color: conge.type_conge?.couleur || '#64748b' }">{{ conge.type_conge?.libelle || 'Congé' }}</span>
              </div>
              <p class="mt-1 text-xs text-slate-500">{{ formatDate(conge.date_debut) }} → {{ formatDate(conge.date_fin) }}</p>
            </div>
            <p v-if="dashboard.prochains_conges.length === 0" class="py-6 text-center text-sm text-slate-400">Aucun congé planifié.</p>
          </div>
        </section>
      </div>

      <section v-if="dashboard.mon_profil" class="rounded-lg border border-slate-200 bg-white p-4">
        <h3 class="font-bold text-slate-900">Mon profil employé</h3>
        <div class="mt-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
          <div><span class="text-slate-500">Matricule</span><p class="font-semibold">{{ dashboard.mon_profil.matricule }}</p></div>
          <div><span class="text-slate-500">Service</span><p class="font-semibold">{{ dashboard.mon_profil.departement?.libelle || 'Non affecté' }}</p></div>
          <div><span class="text-slate-500">Poste</span><p class="font-semibold">{{ dashboard.mon_profil.poste?.libelle || 'Non affecté' }}</p></div>
        </div>
      </section>

      <section class="rounded-lg border border-slate-200 bg-white p-4">
        <h3 class="font-bold text-slate-900">Annonces internes</h3>
        <div class="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          <article v-for="annonce in dashboard.annonces" :key="annonce.id" class="rounded-md border border-slate-200 p-3">
            <h4 class="font-semibold text-slate-900">{{ annonce.titre }}</h4>
            <p class="mt-1 text-sm text-slate-600">{{ annonce.contenu }}</p>
          </article>
          <p v-if="dashboard.annonces.length === 0" class="text-sm text-slate-400">Aucune annonce publiée.</p>
        </div>
      </section>
    </template>

    <RhSelfServicePanel v-else-if="activeTab === 'mon-espace'" />

    <template v-else-if="activeTab === 'employes'">
      <div class="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-3 sm:flex-row">
        <input v-model="employeeFilters.search" class="input flex-1" placeholder="Rechercher matricule, nom, email..." @input="debouncedEmployes" />
        <select v-model="employeeFilters.departement_id" class="input sm:w-56" @change="loadEmployes(1)">
          <option value="">Tous les services</option>
          <option v-for="d in referentiels.departements" :key="d.id" :value="d.id">{{ d.libelle }}</option>
        </select>
        <button class="btn-primary" @click="openEmploye()">+ Employé</button>
      </div>
      <div class="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table class="w-full">
          <thead class="bg-slate-50 text-xs uppercase text-slate-500"><tr>
            <th class="px-4 py-3 text-left">Matricule</th><th class="px-4 py-3 text-left">Employé</th><th class="px-4 py-3 text-left">Service</th>
            <th class="px-4 py-3 text-left">Poste</th><th class="px-4 py-3 text-left">Contrat</th><th class="px-4 py-3 text-left">Compte</th><th class="px-4 py-3 text-left">Statut</th><th class="px-4 py-3 text-right">Action</th>
          </tr></thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="e in employes" :key="e.id" class="text-sm">
              <td class="px-4 py-3 font-mono">{{ e.matricule }}</td><td class="px-4 py-3"><strong>{{ nomEmploye(e) }}</strong><p class="text-xs text-slate-500">{{ e.email || e.user?.email || '-' }}</p></td>
              <td class="px-4 py-3">{{ e.departement?.libelle || '-' }}</td><td class="px-4 py-3">{{ e.poste?.libelle || '-' }}</td><td class="px-4 py-3 uppercase">{{ e.type_contrat }}</td>
              <td class="px-4 py-3"><span class="badge" :class="e.user ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'">{{ e.user ? roleLabel(e.user.role) : 'Employe simple' }}</span></td>
              <td class="px-4 py-3"><span class="badge bg-slate-100 text-slate-700">{{ e.statut }}</span></td>
              <td class="px-4 py-3 text-right">
                <div class="flex justify-end gap-3">
                  <button class="text-blue-700 hover:text-blue-900" @click="openEmploye(e)">Modifier</button>
                  <button class="text-red-600 hover:text-red-800" @click="deleteEmploye(e)">Supprimer</button>
                </div>
              </td>
            </tr>
            <tr v-if="employes.length === 0"><td colspan="8" class="px-4 py-10 text-center text-sm text-slate-400">Aucun employé.</td></tr>
          </tbody>
        </table>
        <AppPagination v-if="employeeMeta.total" :meta="employeeMeta" label="employés" @page="loadEmployes" />
      </div>
    </template>

    <template v-else-if="activeTab === 'conges'">
      <div class="flex flex-wrap gap-2 rounded-lg border border-slate-200 bg-white p-3">
        <select v-model="congeStatus" class="input sm:w-56" @change="loadConges(1)">
          <option value="">Tous les statuts</option><option value="en_attente">En attente</option><option value="approuve">Approuvés</option><option value="refuse">Refusés</option>
        </select>
        <button v-if="canManage" type="button" class="btn-secondary sm:ml-auto" @click="toggleSoldesConges">{{ soldesButtonLabel }}</button><button class="btn-primary" @click="openConge">+ Demande de conge</button>
      </div>
      <section v-if="canManage && showSoldesConges" class="rounded-lg border border-slate-200 bg-white p-4">
        <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 class="font-bold text-slate-900">Soldes de conges par employe</h3>
            <p class="text-sm text-slate-500">Annee {{ soldesConges.annee || new Date().getFullYear() }}</p>
          </div>
          <div class="flex flex-wrap gap-2"><select v-model.number="soldesConges.annee" class="input w-32" @change="loadSoldesConges"><option v-for="year in anneesSoldes" :key="year" :value="year">{{ year }}</option></select><button class="btn-secondary" type="button" :disabled="soldesConges.loading" @click="exportSoldesConges">Exporter</button><button class="btn-secondary" type="button" :disabled="soldesConges.loading" @click="loadSoldesConges">Actualiser</button></div>
        </div>
        <div v-if="soldesConges.loading" class="py-8 text-center text-sm text-slate-500">Chargement des soldes...</div>
        <div v-else class="mt-4 overflow-x-auto">
          <table class="w-full min-w-[900px]">
            <thead class="bg-slate-50 text-xs uppercase text-slate-500"><tr><th class="px-3 py-2 text-left">Employe</th><th class="px-3 py-2 text-left">Service</th><th class="px-3 py-2 text-left">Soldes</th></tr></thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="e in soldesConges.employes" :key="e.id" class="text-sm">
                <td class="px-3 py-3"><strong>{{ nomEmploye(e) }}</strong><p class="text-xs font-mono text-slate-500">{{ e.matricule }}</p></td>
                <td class="px-3 py-3 text-slate-600">{{ e.departement || '-' }}</td>
                <td class="px-3 py-3">
                  <div class="flex flex-wrap gap-2">
                    <div v-for="s in e.soldes" :key="s.type_conge_id" class="min-w-[220px] rounded-md border p-2 text-xs" :class="soldeCardClass(s)">
                      <strong class="block text-sm">{{ s.libelle }}</strong>
                      <div v-if="s.illimite" class="mt-1 font-semibold">Quota annuel : Illimite</div>
                      <div v-else class="mt-2 grid grid-cols-2 gap-2">
                        <span><span class="block uppercase opacity-70">Quota annuel</span><strong>{{ formatJours(s.annuel) }} j</strong></span>
                        <span><span class="block uppercase opacity-70">Disponible</span><strong>{{ formatJours(s.disponible) }} j</strong></span>
                        <span><span class="block uppercase opacity-70">Utilise</span><strong>{{ formatJours(s.utilise) }} j</strong></span>
                        <span><span class="block uppercase opacity-70">En attente</span><strong>{{ formatJours(s.en_attente || 0) }} j</strong></span>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
              <tr v-if="soldesConges.employes.length === 0"><td colspan="3" class="px-3 py-8 text-center text-sm text-slate-400">Aucun employe actif.</td></tr>
            </tbody>
          </table>
        </div>
      </section>
      <div class="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table class="w-full">
          <thead class="bg-slate-50 text-xs uppercase text-slate-500"><tr><th class="px-4 py-3 text-left">Employé</th><th class="px-4 py-3 text-left">Type</th><th class="px-4 py-3 text-left">Période</th><th class="px-4 py-3 text-right">Jours</th><th class="px-4 py-3 text-left">Solde</th><th class="px-4 py-3 text-left">Justificatif</th><th class="px-4 py-3 text-left">Statut</th><th class="px-4 py-3 text-right">Action</th></tr></thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="c in conges" :key="c.id" class="text-sm">
              <td class="px-4 py-3 font-medium">{{ nomEmploye(c.employe) }}</td><td class="px-4 py-3">{{ c.type_conge?.libelle || 'Congé' }}</td><td class="px-4 py-3">{{ formatDate(c.date_debut) }} → {{ formatDate(c.date_fin) }}</td>
              <td class="px-4 py-3 text-right font-mono">{{ c.nombre_jours }}</td>
              <td class="px-4 py-3">
                <div v-if="c.solde_conge" class="rounded-md border px-2 py-1 text-xs" :class="soldeBoxClass(c.solde_conge)">
                  <span class="block uppercase opacity-70">Disponible</span>
                  <strong>{{ soldeDisponibleLabel(c.solde_conge) }}</strong>
                  <p v-if="c.solde_conge.depasse" class="mt-1 font-medium">Depassement</p>
                </div>
                <span v-else class="text-slate-400">-</span>
              </td>
              <td class="px-4 py-3">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="badge" :class="justificatifClass(c)">{{ justificatifLabel(c) }}</span>
                  <label class="cursor-pointer text-xs text-blue-700">Deposer<input type="file" class="hidden" @change="uploadJustificatif(c, $event)" /></label>
                  <button v-if="c.justificatif_path" class="text-xs text-blue-700" @click="downloadJustificatif(c)">Telecharger</button>
                </div>
              </td>
              <td class="px-4 py-3"><span class="badge" :class="statusClass(c.statut)">{{ c.statut }}</span></td>
              <td class="px-4 py-3 text-right"><div v-if="canManage && c.statut === 'en_attente'" class="flex justify-end gap-2"><button class="text-green-700" @click="openDecisionConge(c, 'approuve')">Approuver</button><button class="text-red-700" @click="openDecisionConge(c, 'refuse')">Refuser</button></div></td>
            </tr>
            <tr v-if="conges.length === 0"><td colspan="8" class="px-4 py-10 text-center text-sm text-slate-400">Aucune demande.</td></tr>
          </tbody>
        </table>
        <AppPagination v-if="congeMeta.total" :meta="congeMeta" label="demandes" @page="loadConges" />
      </div>
    </template>
    <RhLeaveCalendarPanel v-else-if="activeTab === 'planning-conges'" :can-manage="canManage" :departements="referentiels.departements" />

    <RhExtendedPanel v-else-if="['recrutement', 'performance', 'documents', 'paie', 'formations'].includes(activeTab)"
                     :section="activeTab" :can-manage="canManage" :employes="employes" :postes="referentiels.postes" />
    <RhPresencePanel v-else-if="activeTab === 'presences'" :can-manage="canManage" :employes="employes" />
    <RhSchedulePanel v-else-if="activeTab === 'horaires'" :employes="employes" :departements="referentiels.departements" />
    <RhProcessPanel v-else-if="activeTab === 'processus'" :can-manage="canManage" :employes="employes" />
    <RhReportsPanel v-else-if="activeTab === 'rapports'" />
    <RhAdminPanel v-else-if="activeTab === 'administration'" />
    <RhBenefitsPanel v-else-if="activeTab === 'avantages'" :can-manage="canManage" :employes="employes" />
    <RhEquipmentPanel v-else-if="activeTab === 'materiels'" :can-manage="canManage" :employes="employes" />
    <RhCertificationsPanel v-else-if="activeTab === 'certifications'" :can-manage="canManage" :employes="employes" />
    <RhAuditPanel v-else-if="activeTab === 'historique'" />

    <template v-else-if="activeTab === 'organisation'">
      <div class="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <section class="rounded-lg border border-slate-200 bg-white p-4">
          <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div><h3 class="font-bold text-slate-900">Services</h3><p class="text-sm text-slate-500">Structurez les équipes et rattachez les postes.</p></div>
            <input v-model="organisationFilters.departements" class="input sm:w-64" placeholder="Rechercher un service..." />
          </div>
          <form class="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-[120px_1fr_auto]" @submit.prevent="saveDepartement">
            <input v-model="departmentForm.code" class="input" placeholder="Code" required />
            <input v-model="departmentForm.libelle" class="input" placeholder="Libellé du service" required />
            <button class="btn-primary">{{ departementButtonLabel }}</button>
            <label class="flex items-center gap-2 text-sm text-slate-700 sm:col-span-3"><input v-model="departmentForm.is_active" type="checkbox" /> Service actif</label>
          </form>
          <button v-if="editingDepartementId" type="button" class="mt-2 text-xs text-slate-600 hover:text-slate-900" @click="resetDepartementForm">Annuler la modification</button>
          <div class="mt-3 divide-y divide-slate-100">
            <div v-for="d in filteredDepartements" :key="d.id" class="flex items-center justify-between gap-3 py-3 text-sm">
              <div><div class="flex flex-wrap items-center gap-2"><strong>{{ d.libelle }}</strong><span class="font-mono text-slate-500">{{ d.code }}</span><span class="badge" :class="activeBadgeClass(d.is_active)">{{ activeLabel(d.is_active) }}</span></div><p class="mt-1 text-xs text-slate-500">{{ servicePostesCount(d.id) }} poste(s)</p></div>
              <button class="text-blue-700 hover:text-blue-900" @click="editDepartement(d)">Modifier</button>
            </div>
            <p v-if="filteredDepartements.length === 0" class="py-8 text-center text-sm text-slate-400">Aucun service trouvé.</p>
          </div>
        </section>

        <section class="rounded-lg border border-slate-200 bg-white p-4">
          <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div><h3 class="font-bold text-slate-900">Postes</h3><p class="text-sm text-slate-500">Suivez les intitulés, services et postes vacants.</p></div>
            <input v-model="organisationFilters.postes" class="input sm:w-64" placeholder="Rechercher un poste..." />
          </div>
          <form class="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2" @submit.prevent="savePoste">
            <input v-model="posteForm.code" class="input" placeholder="Code" required />
            <input v-model="posteForm.libelle" class="input" placeholder="Intitulé du poste" required />
            <select v-model.number="posteForm.departement_id" class="input"><option :value="null">Service</option><option v-for="d in referentiels.departements" :key="d.id" :value="d.id">{{ d.libelle }}</option></select>
            <input v-model="posteForm.description" class="input" placeholder="Description" />
            <label class="flex items-center gap-2 text-sm text-slate-700"><input v-model="posteForm.est_vacant" type="checkbox" /> Poste vacant</label>
            <label class="flex items-center gap-2 text-sm text-slate-700"><input v-model="posteForm.is_active" type="checkbox" /> Poste actif</label>
            <button class="btn-primary sm:col-span-2">{{ posteButtonLabel }}</button>
          </form>
          <button v-if="editingPosteId" type="button" class="mt-2 text-xs text-slate-600 hover:text-slate-900" @click="resetPosteForm">Annuler la modification</button>
          <div class="mt-3 divide-y divide-slate-100">
            <div v-for="p in filteredPostes" :key="p.id" class="flex items-center justify-between gap-3 py-3 text-sm">
              <div><div class="flex flex-wrap items-center gap-2"><strong>{{ p.libelle }}</strong><span class="font-mono text-slate-500">{{ p.code }}</span><span class="badge bg-blue-100 text-blue-800">{{ p.departement?.libelle || 'Sans service' }}</span><span class="badge" :class="vacantBadgeClass(p.est_vacant)">{{ vacantLabel(p.est_vacant) }}</span><span class="badge" :class="activeBadgeClass(p.is_active)">{{ activeLabel(p.is_active) }}</span></div><p v-if="p.description" class="mt-1 text-xs text-slate-500">{{ p.description }}</p></div>
              <button class="text-blue-700 hover:text-blue-900" @click="editPoste(p)">Modifier</button>
            </div>
            <p v-if="filteredPostes.length === 0" class="py-8 text-center text-sm text-slate-400">Aucun poste trouvé.</p>
          </div>
        </section>
      </div>
    </template>

    <AppModal v-model="showCongeModal" title="Nouvelle demande de congé" size="md">
      <form class="space-y-3" @submit.prevent="saveConge">
        <select v-if="canManage" v-model.number="congeForm.employe_id" class="input"><option :value="null">Moi-même / employé lié</option><option v-for="e in employes" :key="e.id" :value="e.id">{{ nomEmploye(e) }}</option></select>
        <select v-model.number="congeForm.type_conge_id" class="input" required><option :value="null">Type de congé</option><option v-for="t in referentiels.types_conges" :key="t.id" :value="t.id">{{ t.libelle }}</option></select>
        <div class="grid grid-cols-2 gap-2"><input v-model="congeForm.date_debut" type="date" class="input" required /><input v-model="congeForm.date_fin" type="date" class="input" required /></div>
        <div v-if="congeSolde.selected" class="rounded-lg border p-3 text-sm" :class="soldeBoxClass(congeSolde.selected)">
          <div class="flex items-center justify-between gap-3">
            <span>Jours demandes</span>
            <strong>{{ formatJours(congeSolde.jours_demandes) }} jour(s)</strong>
          </div>
          <div class="mt-2 flex items-center justify-between gap-3">
            <span>Solde disponible</span>
            <strong>{{ soldeDisponibleLabel(congeSolde.selected) }}</strong>
          </div>
          <p v-if="congeSolde.selected.depasse" class="mt-2 font-medium">
            Solde insuffisant pour ce type de conge.
          </p>
          <p v-else-if="congeSolde.selected.illimite" class="mt-2 text-xs">
            Ce type de conge n'a pas de plafond annuel configure.
          </p>
        </div>
        <textarea v-model="congeForm.motif" class="input" rows="3" placeholder="Motif ou précision"></textarea>
        <div class="flex justify-end gap-2"><button type="button" class="btn-secondary" @click="showCongeModal = false">Annuler</button><button class="btn-primary" :disabled="congeSolde.loading || !!congeSolde.selected?.depasse">Envoyer</button></div>
      </form>
    </AppModal>


    <AppModal v-model="showDecisionModal" :title="decisionModalTitle" size="md">
      <form class="space-y-3" @submit.prevent="confirmDecisionConge">
        <div class="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
          <div class="flex justify-between gap-3"><span>Employe</span><strong>{{ nomEmploye(decisionConge.employe) }}</strong></div>
          <div class="mt-2 flex justify-between gap-3"><span>Type</span><strong>{{ decisionConge.type_conge?.libelle || '-' }}</strong></div>
          <div class="mt-2 flex justify-between gap-3"><span>Periode</span><strong>{{ formatDate(decisionConge.date_debut) }} - {{ formatDate(decisionConge.date_fin) }}</strong></div>
          <div class="mt-2 flex justify-between gap-3"><span>Jours</span><strong>{{ decisionConge.nombre_jours || 0 }}</strong></div>
        </div>
        <div v-if="decisionConge.solde_conge" class="rounded-lg border p-3 text-sm" :class="soldeBoxClass(decisionConge.solde_conge)">
          <div class="flex justify-between gap-3"><span>Solde disponible</span><strong>{{ soldeDisponibleLabel(decisionConge.solde_conge) }}</strong></div>
          <p v-if="decisionConge.solde_conge.depasse" class="mt-2 font-medium">Attention : cette demande depasse le solde disponible.</p>
        </div>
        <textarea v-model="decisionForm.note_decision" class="input" rows="3" placeholder="Note de decision (optionnel)"></textarea>
        <div class="flex justify-end gap-2">
          <button type="button" class="btn-secondary" @click="showDecisionModal = false">Annuler</button>
          <button class="btn-primary" :class="decisionButtonClass" :disabled="decisionLoading">Confirmer</button>
        </div>
      </form>
    </AppModal>

    <AppModal v-model="showEmployeModal" :title="employeModalTitle" size="lg">
      <form class="grid grid-cols-1 gap-3 sm:grid-cols-2" @submit.prevent="saveEmploye">
        <input v-model="employeForm.matricule" class="input" placeholder="Matricule *" required /><select v-model.number="employeForm.user_id" class="input"><option :value="null">Lier un compte existant (optionnel)</option><option v-for="u in referentiels.utilisateurs" :key="u.id" :value="u.id">{{ u.name }} - {{ u.email }}</option></select>
        <input v-model="employeForm.prenom" class="input" placeholder="Prénom *" required /><input v-model="employeForm.nom" class="input" placeholder="Nom *" required />
        <input v-model="employeForm.email" type="email" class="input" placeholder="Email" /><input v-model="employeForm.telephone" type="tel" data-phone-input class="input" placeholder="77 123 45 67" />
        <input v-model="employeForm.date_embauche" type="date" class="input" required /><select v-model="employeForm.type_contrat" class="input"><option value="cdi">CDI</option><option value="cdd">CDD</option><option value="stage">Stage</option><option value="prestation">Prestation</option><option value="journalier">Journalier</option></select>
        <select v-model.number="employeForm.departement_id" class="input"><option :value="null">Service</option><option v-for="d in referentiels.departements" :key="d.id" :value="d.id">{{ d.libelle }}</option></select><select v-model.number="employeForm.poste_id" class="input"><option :value="null">Poste</option><option v-for="p in referentiels.postes" :key="p.id" :value="p.id">{{ p.libelle }}</option></select>
        <select v-model="employeForm.statut" class="input"><option value="actif">Actif</option><option value="conge">En congé</option><option value="suspendu">Suspendu</option><option value="sorti">Sorti</option></select><input v-model="employeForm.contact_urgence" class="input" placeholder="Contact d’urgence" />
        <textarea v-model="employeForm.notes" class="input sm:col-span-2" rows="2" placeholder="Notes internes"></textarea>
        <section class="rounded-lg border border-slate-200 bg-slate-50 p-3 sm:col-span-2">
          <label class="flex items-start gap-3 text-sm font-medium text-slate-700">
            <input v-model="employeForm.creer_utilisateur" type="checkbox" class="mt-1" :disabled="!!employeForm.user_id" />
            <span>
              Creer aussi un compte utilisateur Saytu
              <small class="mt-1 block font-normal text-slate-500">L employe pourra se connecter a Saytu avec le role choisi. Laissez decoche pour une fiche RH simple.</small>
            </span>
          </label>
          <div v-if="employeForm.creer_utilisateur && !employeForm.user_id" class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <select v-model="employeForm.user_role" class="input">
              <option v-for="role in userRoleOptions" :key="role.value" :value="role.value">{{ role.label }}</option>
            </select>
            <input v-model="employeForm.user_password" type="text" class="input" placeholder="Mot de passe (vide = automatique)" />
            <label class="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"><input v-model="employeForm.user_is_active" type="checkbox" /> Compte actif</label>
          </div>
        </section>
        <div class="flex justify-end gap-2 sm:col-span-2"><button type="button" class="btn-secondary" @click="showEmployeModal = false">Annuler</button><button class="btn-primary">Enregistrer</button></div>
      </form>
    </AppModal>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/services/api'
import AppModal from '@/components/AppModal.vue'
import AppPagination from '@/components/AppPagination.vue'
import RhExtendedPanel from '@/components/rh/RhExtendedPanel.vue'
import RhPresencePanel from '@/components/rh/RhPresencePanel.vue'
import RhSchedulePanel from '@/components/rh/RhSchedulePanel.vue'
import RhProcessPanel from '@/components/rh/RhProcessPanel.vue'
import RhReportsPanel from '@/components/rh/RhReportsPanel.vue'
import RhSelfServicePanel from '@/components/rh/RhSelfServicePanel.vue'
import RhAdminPanel from '@/components/rh/RhAdminPanel.vue'
import RhLeaveCalendarPanel from '@/components/rh/RhLeaveCalendarPanel.vue'
import RhBenefitsPanel from '@/components/rh/RhBenefitsPanel.vue'
import RhEquipmentPanel from '@/components/rh/RhEquipmentPanel.vue'
import RhCertificationsPanel from '@/components/rh/RhCertificationsPanel.vue'
import RhAuditPanel from '@/components/rh/RhAuditPanel.vue'
import { BriefcaseBusiness, Clock3, LayoutDashboard, Settings2, UsersRound } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'

const auth = useAuthStore()
const route = useRoute()
const toast = useToast()
const { confirm: askConfirm } = useConfirm()
const canManage = computed(() => ['admin', 'gerant'].includes(auth.user?.role))
const pageSubtitle = computed(() => canManage.value ? 'Pilotage RH et gestion du personnel' : 'Votre espace employe')
const groups = [
  { id: 'accueil', label: 'Accueil', icon: LayoutDashboard, tabs: [{ id: 'dashboard', label: 'Vue d’ensemble' }, { id: 'mon-espace', label: 'Mon espace' }] },
  { id: 'temps', label: 'Temps & absences', icon: Clock3, tabs: [{ id: 'conges', label: 'Demandes de congés' }, { id: 'planning-conges', label: 'Planning congés' }, { id: 'presences', label: 'Présences' }, { id: 'horaires', label: 'Horaires RH', manage: true }] },
  { id: 'personnel', label: 'Personnel', icon: UsersRound, tabs: [{ id: 'employes', label: 'Annuaire', manage: true }, { id: 'processus', label: 'Intégration & départ' }, { id: 'materiels', label: 'Matériel' }, { id: 'documents', label: 'Documents' }, { id: 'paie', label: 'Paie' }, { id: 'avantages', label: 'Avantages sociaux' }] },
  { id: 'talents', label: 'Talents', icon: BriefcaseBusiness, tabs: [{ id: 'recrutement', label: 'Recrutement', manage: true }, { id: 'performance', label: 'Performance' }, { id: 'formations', label: 'Formation' }, { id: 'certifications', label: 'Certifications' }] },
  { id: 'configuration', label: 'Pilotage', icon: Settings2, tabs: [{ id: 'rapports', label: 'Rapports RH', manage: true }, { id: 'historique', label: 'Historique RH', manage: true }, { id: 'organisation', label: 'Organisation', manage: true }, { id: 'administration', label: 'Administration RH', manage: true }] },
]
const visibleGroups = computed(() => groups.map(group => ({ ...group, tabs: group.tabs.filter(tab => !tab.manage || canManage.value) })).filter(group => group.tabs.length))
const activeTab = ref('dashboard')
const activeGroup = computed(() => visibleGroups.value.find(group => group.tabs.some(tab => tab.id === activeTab.value)) || visibleGroups.value[0] || { id: 'accueil', tabs: [] })
const loading = ref(false)
const dashboard = reactive({ stats: {}, repartition_departements: [], prochains_conges: [], mes_conges: [], annonces: [], alertes: [], mon_profil: null })
const referentiels = reactive({ departements: [], postes: [], types_conges: [], utilisateurs: [] })
const employes = ref([])
const conges = ref([])
const employeeFilters = reactive({ search: '', departement_id: '' })
const congeStatus = ref('')
const employeeMeta = reactive({})
const congeMeta = reactive({})
const showCongeModal = ref(false)
const showEmployeModal = ref(false)
const showDecisionModal = ref(false)
const editingEmploye = ref(null)
const decisionConge = ref(null)
const congeForm = reactive({ employe_id: null, type_conge_id: null, date_debut: '', date_fin: '', motif: '' })
const decisionForm = reactive({ statut: 'approuve', note_decision: '' })
const decisionLoading = ref(false)
const congeSolde = reactive({ loading: false, jours_demandes: 0, types: [], selected: null })
const showSoldesConges = ref(false)
const soldesConges = reactive({ loading: false, annee: new Date().getFullYear(), employes: [] })
const departmentForm = reactive({ code: '', libelle: '', is_active: true })
const posteForm = reactive({ code: '', libelle: '', departement_id: null, description: '', est_vacant: false, is_active: true })
const editingDepartementId = ref(null)
const editingPosteId = ref(null)
const organisationFilters = reactive({ departements: '', postes: '' })
const userRoleOptions = [
  { value: 'commercial', label: 'Commercial' },
  { value: 'caissier', label: 'Caissier' },
  { value: 'magasinier', label: 'Gestionnaire de stock' },
  { value: 'comptable', label: 'Comptable' },
  { value: 'gerant', label: 'Gerant' },
  { value: 'admin', label: 'Administrateur' },
]
const emptyEmploye = () => ({ user_id: null, matricule: '', prenom: '', nom: '', email: '', telephone: '', date_embauche: new Date().toISOString().slice(0, 10), type_contrat: 'cdi', statut: 'actif', departement_id: null, poste_id: null, contact_urgence: '', notes: '', creer_utilisateur: false, user_role: 'commercial', user_password: '', user_is_active: true })
const employeForm = reactive(emptyEmploye())
let timer
let soldeTimer

const anneesSoldes = computed(() => { const current = new Date().getFullYear(); return [current - 2, current - 1, current, current + 1] })
const soldesButtonLabel = computed(() => showSoldesConges.value ? 'Masquer soldes' : 'Soldes')
const departementButtonLabel = computed(() => editingDepartementId.value ? 'Mettre a jour' : 'Ajouter')
const posteButtonLabel = computed(() => editingPosteId.value ? 'Mettre a jour' : 'Ajouter')
const decisionButtonClass = computed(() => decisionForm.statut === 'refuse' ? 'bg-red-600 hover:bg-red-700' : '')
const decisionModalTitle = computed(() => decisionForm.statut === 'approuve' ? 'Approuver le conge' : 'Refuser le conge')
const employeModalTitle = computed(() => editingEmploye.value?.id ? 'Modifier la fiche employe' : 'Nouvel employe')
const filteredDepartements = computed(() => { const term = organisationFilters.departements.trim().toLowerCase(); if (!term) return referentiels.departements; return referentiels.departements.filter(d => [d.code, d.libelle].some(v => String(v || '').toLowerCase().includes(term))) })
const filteredPostes = computed(() => { const term = organisationFilters.postes.trim().toLowerCase(); if (!term) return referentiels.postes; return referentiels.postes.filter(p => [p.code, p.libelle, p.description, p.departement?.libelle].some(v => String(v || '').toLowerCase().includes(term))) })
const statCards = computed(() => [
  { label: 'Employés actifs', value: dashboard.stats.employes_actifs || 0, color: 'text-blue-700' },
  { label: 'Postes vacants', value: dashboard.stats.postes_vacants || 0, color: 'text-orange-600' },
  { label: 'Congés à valider', value: dashboard.stats.conges_en_attente || 0, color: 'text-red-600' },
  { label: 'Congés à venir', value: dashboard.stats.conges_a_venir || 0, color: 'text-green-700' },
])

watch(activeTab, tab => { if (tab === 'employes') loadEmployes(); if (tab === 'conges') loadConges() })
watch(() => route.query.tab, tab => { if (typeof tab === 'string' && visibleGroups.value.some(group => group.tabs.some(item => item.id === tab))) activeTab.value = tab }, { immediate: true })
watch(() => employeForm.user_id, value => { if (value) employeForm.creer_utilisateur = false })
watch(
  () => [showCongeModal.value, congeForm.employe_id, congeForm.type_conge_id, congeForm.date_debut, congeForm.date_fin],
  () => {
    clearTimeout(soldeTimer)
    if (!showCongeModal.value) {
      resetCongeSolde()
      return
    }
    soldeTimer = setTimeout(loadSoldeConge, 250)
  }
)
function selectGroup(group) { if (!group.tabs.some(tab => tab.id === activeTab.value)) activeTab.value = group.tabs[0].id }
function groupButtonClass(group) { return activeGroup.value?.id === group.id ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-white hover:text-slate-900' }
function tabButtonClass(tab) { return activeTab.value === tab.id ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900' }
function nomEmploye(e) { return e ? `${e.prenom || ''} ${e.nom || ''}`.trim() : '-' }
function formatDate(d) { return d ? new Date(d).toLocaleDateString('fr-FR') : '-' }
function formatJours(value) { return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(Number(value || 0)) }
function roleLabel(role) { return userRoleOptions.find(item => item.value === role)?.label || 'Utilisateur Saytu' }
function soldeDisponibleLabel(solde) { return solde.illimite ? 'Illimite' : `${formatJours(solde.disponible)} jour(s)` }
function soldeBoxClass(solde) { return solde.depasse ? 'border-red-200 bg-red-50 text-red-800' : 'border-green-200 bg-green-50 text-green-800' }
function servicePostesCount(id) { return referentiels.postes.filter(p => Number(p.departement_id) === Number(id)).length }
function departementWidth(count) { return `${Math.min(100, (Number(count || 0) / Math.max(1, dashboard.stats.employes_actifs || 1)) * 100)}%` }
function statusClass(s) { return { en_attente: 'bg-orange-100 text-orange-800', approuve: 'bg-green-100 text-green-800', refuse: 'bg-red-100 text-red-800', annule: 'bg-slate-100 text-slate-700' }[s] }
function activeBadgeClass(active) { return active ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600' }
function activeLabel(active) { return active ? 'Actif' : 'Inactif' }
function vacantBadgeClass(vacant) { return vacant ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800' }
function vacantLabel(vacant) { return vacant ? 'Vacant' : 'Occupable' }
function justificatifClass(conge) {
  if (conge.justificatif_path) return 'bg-green-100 text-green-800'
  return conge.type_conge?.justificatif_requis ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-600'
}
function justificatifLabel(conge) {
  if (conge.justificatif_path) return 'Depose'
  return conge.type_conge?.justificatif_requis ? 'Manquant' : 'Optionnel'
}
function alerteClass(niveau) { return { danger: 'border-red-200 bg-red-50 text-red-800', warning: 'border-orange-200 bg-orange-50 text-orange-800', info: 'border-blue-200 bg-blue-50 text-blue-800' }[niveau] || 'border-slate-200 bg-slate-50 text-slate-700' }
function goToAlert(alerte) { if (alerte.action) activeTab.value = alerte.action }
function debouncedEmployes() { clearTimeout(timer); timer = setTimeout(() => loadEmployes(1), 300) }
async function loadDashboard() { const { data } = await api.get('/rh/dashboard'); Object.assign(dashboard, data) }
async function loadReferentiels() { const { data } = await api.get('/rh/referentiels'); Object.assign(referentiels, data) }
async function loadEmployes(page = 1) { const { data } = await api.get('/rh/employes', { params: { page, per_page: 20, ...employeeFilters } }); employes.value = data.data; Object.assign(employeeMeta, data) }
async function loadConges(page = 1) { const { data } = await api.get('/rh/conges', { params: { page, per_page: 20, statut: congeStatus.value || undefined } }); conges.value = data.data; Object.assign(congeMeta, data) }
async function loadSoldesConges() { soldesConges.loading = true; try { const { data } = await api.get('/rh/conges/soldes', { params: { annee: soldesConges.annee } }); Object.assign(soldesConges, { annee: data.annee, employes: data.employes || [] }) } catch (e) { toast.error(e.response.data.message || 'Impossible de charger les soldes de conges.') } finally { soldesConges.loading = false } }
async function exportSoldesConges() { try { const response = await api.get('/rh/conges/soldes/export', { params: { annee: soldesConges.annee }, responseType: 'blob' }); const url = URL.createObjectURL(response.data); const link = document.createElement('a'); link.href = url; link.download = 'soldes-conges-' + (soldesConges.annee || new Date().getFullYear()) + '.csv'; link.click(); URL.revokeObjectURL(url) } catch (e) { toast.error(e.response.data.message || 'Export impossible.') } }
async function toggleSoldesConges() { showSoldesConges.value = !showSoldesConges.value; if (showSoldesConges.value && soldesConges.employes.length === 0) await loadSoldesConges() }
function openConge() { showCongeModal.value = true }
function openEmploye(e = null) {
  editingEmploye.value = e?.id ? e : null
  Object.assign(employeForm, emptyEmploye(), editingEmploye.value || {})
  employeForm.creer_utilisateur = false
  employeForm.user_role = editingEmploye.value?.user?.role || 'commercial'
  employeForm.user_password = ''
  employeForm.user_is_active = editingEmploye.value?.user?.is_active ?? true
  showEmployeModal.value = true
}
function resetCongeSolde() { Object.assign(congeSolde, { loading: false, jours_demandes: 0, types: [], selected: null }) }
async function loadSoldeConge() {
  if (!congeForm.type_conge_id && !congeForm.date_debut && !congeForm.date_fin) {
    resetCongeSolde()
    return
  }
  congeSolde.loading = true
  try {
    const { data } = await api.get('/rh/conges/solde', {
      params: {
        employe_id: congeForm.employe_id || undefined,
        type_conge_id: congeForm.type_conge_id || undefined,
        date_debut: congeForm.date_debut || undefined,
        date_fin: congeForm.date_fin || undefined,
      },
    })
    congeSolde.jours_demandes = data.jours_demandes || 0
    congeSolde.types = data.types || []
    congeSolde.selected = congeSolde.types.find(type => Number(type.type_conge_id) === Number(congeForm.type_conge_id)) || congeSolde.types[0] || null
  } catch {
    resetCongeSolde()
  } finally {
    congeSolde.loading = false
  }
}
async function saveConge() {
  try {
    await api.post('/rh/conges', congeForm)
    toast.success('Demande de conge envoyee.')
    showCongeModal.value = false
    Object.assign(congeForm, { employe_id: null, type_conge_id: null, date_debut: '', date_fin: '', motif: '' })
    await loadDashboard()
    if (activeTab.value === 'conges') await loadConges()
  } catch (e) {
    toast.error(e.response.data.message || Object.values(e.response.data.errors || {})[0]?.[0] || 'Demande impossible.')
  }
}
function openDecisionConge(c, statut) {
  decisionConge.value = c
  Object.assign(decisionForm, { statut, note_decision: '' })
  showDecisionModal.value = true
}
async function confirmDecisionConge() {
  if (!decisionConge.value?.id) return
  decisionLoading.value = true
  try {
    await api.put(`/rh/conges/${decisionConge.value.id}/decision`, decisionForm)
    toast.success(decisionForm.statut === 'approuve' ? 'Demande approuvee.' : 'Demande refusee.')
    showDecisionModal.value = false
    await loadConges(congeMeta.current_page || 1)
    await loadDashboard()
    if (showSoldesConges.value) await loadSoldesConges()
  } catch (e) {
    toast.error(e.response.data.message || Object.values(e.response.data.errors || {})[0]?.[0] || 'Decision impossible.')
  } finally {
    decisionLoading.value = false
  }
}
async function uploadJustificatif(c, event) { const file = event.target.files?.[0]; if (!file) return; const data = new FormData(); data.append('fichier', file); try { await api.post(`/rh/conges/${c.id}/justificatif`, data, { headers: { 'Content-Type': 'multipart/form-data' } }); toast.success('Justificatif déposé.'); await loadConges(congeMeta.current_page || 1) } catch (e) { toast.error(e.response.data.message || Object.values(e.response.data.errors || {})[0]?.[0] || 'Dépôt impossible.') } finally { event.target.value = '' } }
async function downloadJustificatif(c) { try { const response = await api.get(`/rh/conges/${c.id}/justificatif`, { responseType: 'blob' }); const link = document.createElement('a'); link.href = URL.createObjectURL(response.data); link.download = c.justificatif_nom || 'justificatif'; link.click(); URL.revokeObjectURL(link.href) } catch { toast.error('Téléchargement impossible.') } }
async function saveEmploye() {
  try {
    const payload = employePayload()
    let response
    if (editingEmploye.value?.id) {
      response = await api.put(`/rh/employes/${editingEmploye.value.id}`, payload)
    } else {
      response = await api.post('/rh/employes', payload)
    }
    toast.success(response?.data?.password_genere ? `Fiche employe enregistree. Mot de passe genere : ${response.data.password_genere}` : 'Fiche employe enregistree.')
    showEmployeModal.value = false
    await Promise.all([loadEmployes(employeeMeta.current_page || 1), loadDashboard()])
  } catch (e) {
    toast.error(e.response.data.message || Object.values(e.response.data.errors || {})[0]?.[0] || 'Enregistrement impossible.')
  }
}
async function deleteEmploye(e) {
  const name = nomEmploye(e)
  const detail = e.user ? ' Le compte utilisateur Saytu sera conserve.' : ''
  if (!await askConfirm({
    message: `Supprimer la fiche employe de ${name} ?`,
    hint: detail.trim(),
    tone: 'danger',
    confirmLabel: 'Supprimer',
  })) return

  try {
    const { data } = await api.delete(`/rh/employes/${e.id}`)
    toast.success(data.message || 'Fiche employe supprimee.')
    await Promise.all([loadEmployes(employeeMeta.current_page || 1), loadDashboard(), loadReferentiels()])
  } catch (error) {
    toast.error(error.response?.data?.message || Object.values(error.response?.data?.errors || {})[0]?.[0] || 'Suppression impossible.')
  }
}
function employePayload() {
  const payload = { ...employeForm }
  delete payload.user
  delete payload.departement
  delete payload.poste
  delete payload.manager
  if (payload.user_id) payload.creer_utilisateur = false
  if (!payload.creer_utilisateur) {
    delete payload.user_role
    delete payload.user_password
    delete payload.user_is_active
  }
  if (!payload.user_password) delete payload.user_password
  return payload
}
function editDepartement(d) { editingDepartementId.value = d.id; Object.assign(departmentForm, { code: d.code, libelle: d.libelle, is_active: d.is_active !== false }) }
function resetDepartementForm() { editingDepartementId.value = null; Object.assign(departmentForm, { code: '', libelle: '', is_active: true }) }
async function saveDepartement() {
  try {
    if (editingDepartementId.value) {
      await api.put(`/rh/departements/${editingDepartementId.value}`, departmentForm)
    } else {
      await api.post('/rh/departements', departmentForm)
    }
    toast.success(editingDepartementId.value ? 'Service mis a jour.' : 'Service ajoute.')
    resetDepartementForm()
    await Promise.all([loadReferentiels(), loadDashboard()])
  } catch (e) {
    toast.error(e.response.data.message || Object.values(e.response.data.errors || {})[0]?.[0] || 'Enregistrement impossible.')
  }
}
function editPoste(p) { editingPosteId.value = p.id; Object.assign(posteForm, { code: p.code, libelle: p.libelle, departement_id: p.departement_id || null, description: p.description || '', est_vacant: !!p.est_vacant, is_active: p.is_active !== false }) }
function resetPosteForm() { editingPosteId.value = null; Object.assign(posteForm, { code: '', libelle: '', departement_id: null, description: '', est_vacant: false, is_active: true }) }
async function savePoste() {
  try {
    if (editingPosteId.value) {
      await api.put(`/rh/postes/${editingPosteId.value}`, posteForm)
    } else {
      await api.post('/rh/postes', posteForm)
    }
    toast.success(editingPosteId.value ? 'Poste mis a jour.' : 'Poste ajoute.')
    resetPosteForm()
    await Promise.all([loadReferentiels(), loadDashboard()])
  } catch (e) {
    toast.error(e.response.data.message || Object.values(e.response.data.errors || {})[0]?.[0] || 'Enregistrement impossible.')
  }
}
onMounted(async () => {
  loading.value = true
  try {
    await Promise.all([loadDashboard(), loadReferentiels()])
    if (canManage.value) await loadEmployes()
  } catch (e) {
    const status = e.response.status
    const detail = e.response.data.message
    let message = 'Impossible de charger le module RH.'
    if (status === 404) message = "Module RH indisponible : les routes backend ne sont pas encore installees."
    if (status === 500) message = "Module RH indisponible : verifiez que la migration RH a bien ete executee."
    toast.error(detail || message)
  } finally {
    loading.value = false
  }
})
</script>
