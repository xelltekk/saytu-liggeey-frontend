<template>
  <div class="app-surface space-y-4">
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div class="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div class="flex-1">
          <h3 class="text-lg font-bold text-gray-900">Prospection commerciale</h3>
          <p class="text-sm text-gray-500">Suivi des prospects, relances, actions commerciales et objectifs.</p>
        </div>
        <select v-if="isAdmin" v-model="filters.commercial_id" @change="reload" class="input lg:w-56">
          <option value="">Tous commerciaux</option>
          <option v-for="c in commerciaux" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
        <input v-model="filters.date_from" @change="reload" type="date" class="input lg:w-40" />
        <input v-model="filters.date_to" @change="reload" type="date" class="input lg:w-40" />
        <button v-if="isAdmin" type="button" @click="ouvrirEtatPdf" :disabled="pdfLoading" class="btn-primary">
          {{ pdfLoading ? 'PDF...' : 'État PDF' }}
        </button>
        <button type="button" @click="exporterCSV" :disabled="exportLoading" class="btn-secondary">
          {{ exportLoading ? 'Export...' : 'Exporter CSV' }}
        </button>
      </div>
    </div>

    <div class="stat-grid grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6">
      <button type="button" @click="applyKpiFilter('prospects')" class="bg-white rounded-lg border p-3 text-left transition hover:-translate-y-0.5 hover:border-xelltekk-300 hover:shadow-sm" :class="kpiCardClass('prospects')">
        <div class="text-xs uppercase text-gray-500">Prospects</div>
        <div class="text-2xl font-bold text-gray-900">{{ stats.prospects_total || 0 }}</div>
      </button>
      <button type="button" @click="applyKpiFilter('actions')" class="bg-white rounded-lg border p-3 text-left transition hover:-translate-y-0.5 hover:border-xelltekk-300 hover:shadow-sm" :class="kpiCardClass('actions')">
        <div class="text-xs uppercase text-gray-500">Actions</div>
        <div class="text-2xl font-bold text-blue-700">{{ stats.actions_total || 0 }}</div>
      </button>
      <button type="button" @click="applyKpiFilter('effectuees')" class="bg-white rounded-lg border p-3 text-left transition hover:-translate-y-0.5 hover:border-xelltekk-300 hover:shadow-sm" :class="kpiCardClass('effectuees')">
        <div class="text-xs uppercase text-gray-500">Effectuées</div>
        <div class="text-2xl font-bold text-green-700">{{ stats.actions_effectuees || 0 }}</div>
      </button>
      <button type="button" @click="applyKpiFilter('relances')" class="bg-white rounded-lg border p-3 text-left transition hover:-translate-y-0.5 hover:border-xelltekk-300 hover:shadow-sm" :class="kpiCardClass('relances')">
        <div class="text-xs uppercase text-gray-500">Relances en retard</div>
        <div class="text-2xl font-bold text-red-700">{{ stats.relances_en_retard || 0 }}</div>
      </button>
      <button type="button" @click="applyKpiFilter('devis')" class="bg-white rounded-lg border p-3 text-left transition hover:-translate-y-0.5 hover:border-xelltekk-300 hover:shadow-sm" :class="kpiCardClass('devis')">
        <div class="text-xs uppercase text-gray-500">Devis créés</div>
        <div class="text-2xl font-bold text-purple-700">{{ stats.devis_crees || 0 }}</div>
      </button>
      <button type="button" @click="applyKpiFilter('potentiel')" class="bg-white rounded-lg border p-3 text-left transition hover:-translate-y-0.5 hover:border-xelltekk-300 hover:shadow-sm" :class="kpiCardClass('potentiel')">
        <div class="text-xs uppercase text-gray-500">Potentiel</div>
        <div class="text-lg font-bold text-xelltekk-700">{{ formatPrice(stats.potentiel) }}</div>
      </button>
    </div>

    <div class="grid grid-cols-1 gap-4 xl:grid-cols-[1.35fr_1fr_1fr]">
      <section class="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div class="mb-3 flex items-start justify-between gap-3">
          <div>
            <h4 class="font-bold text-gray-900">Pipeline commercial</h4>
            <p class="text-xs text-gray-500">Vue rapide des prospects par étape.</p>
          </div>
          <span class="rounded-full bg-xelltekk-50 px-3 py-1 text-xs font-semibold text-xelltekk-700">
            {{ pipelineTotal }} prospect(s)
          </span>
        </div>
        <div class="grid grid-cols-1 gap-2 md:grid-cols-2 2xl:grid-cols-3">
          <button
            v-for="stage in pipelineStages"
            :key="stage.key"
            type="button"
            class="rounded-2xl border border-gray-200 bg-gray-50 p-3 text-left transition hover:-translate-y-0.5 hover:border-xelltekk-300 hover:bg-white hover:shadow-sm"
            @click="openStage(stage)"
          >
            <div class="flex items-center justify-between gap-3">
              <div>
                <div class="text-xs font-semibold uppercase tracking-wide text-gray-500">{{ stage.label }}</div>
                <div class="text-xl font-black text-gray-900">{{ stage.count || 0 }}</div>
              </div>
              <span class="rounded-full px-2.5 py-1 text-xs font-bold" :class="stageBadgeClass(stage.key)">
                {{ stagePercent(stage) }}%
              </span>
            </div>
            <div class="mt-2 h-2 overflow-hidden rounded-full bg-white/80">
              <div class="h-full rounded-full transition-all" :class="stageBarClass(stage.key)" :style="{ width: `${stagePercent(stage)}%` }"></div>
            </div>
            <div class="mt-2 flex items-center justify-between gap-2 text-xs text-gray-500">
              <span class="truncate">{{ stage.description }}</span>
              <span v-if="stage.potentiel" class="font-semibold text-xelltekk-700">{{ formatPrice(stage.potentiel) }}</span>
            </div>
          </button>
        </div>
      </section>

      <section class="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div class="mb-3 flex items-start justify-between gap-3">
          <div>
            <h4 class="font-bold text-gray-900">Relances prioritaires</h4>
            <p class="text-xs text-gray-500">À traiter avant qu’elles refroidissent.</p>
          </div>
          <span class="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">{{ relancesPrioritaires.length }}</span>
        </div>
        <div v-if="relancesPrioritaires.length" class="space-y-2">
          <article v-for="item in relancesPrioritaires" :key="`relance-${item.id}`" class="rounded-2xl border border-gray-100 bg-gray-50 p-3">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <div class="truncate text-sm font-semibold text-gray-900">{{ item.client?.nom || 'Prospect' }}</div>
                <div class="text-xs text-gray-500">{{ typeActionLabel(item.type_action) }} · {{ formatDateTime(item.date_relance) }}</div>
              </div>
              <span class="rounded-full px-2 py-0.5 text-xs font-semibold" :class="priorityClass(item.priorite)">
                {{ priorityLabel(item.priorite) }}
              </span>
            </div>
            <div class="mt-2 flex flex-wrap gap-2">
              <a v-if="item.client?.email" :href="relanceEmailHref(item.client, item)" class="text-xs font-semibold text-xelltekk-700 hover:underline">Email</a>
              <a v-if="phoneHref(item.client)" :href="phoneHref(item.client)" class="text-xs font-semibold text-xelltekk-700 hover:underline">Appeler</a>
              <button type="button" @click="openActionFromResume(item)" class="text-xs font-semibold text-xelltekk-700 hover:underline">Action</button>
            </div>
          </article>
        </div>
        <div v-else class="rounded-2xl border border-dashed border-gray-200 p-5 text-center text-sm text-gray-400">
          Aucune relance urgente.
        </div>
      </section>

      <section class="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div class="mb-3 flex items-start justify-between gap-3">
          <div>
            <h4 class="font-bold text-gray-900">Prospects chauds</h4>
            <p class="text-xs text-gray-500">Potentiel ou intérêt détecté.</p>
          </div>
          <span class="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">{{ prospectsChauds.length }}</span>
        </div>
        <div v-if="prospectsChauds.length" class="space-y-2">
          <article v-for="item in prospectsChauds" :key="`hot-${item.id}`" class="rounded-2xl border border-gray-100 bg-gray-50 p-3">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <div class="truncate text-sm font-semibold text-gray-900">{{ item.client?.nom || 'Prospect' }}</div>
                <div class="truncate text-xs text-gray-500">{{ item.objet || item.prochaine_etape || 'Opportunité commerciale' }}</div>
              </div>
              <div class="text-right text-xs font-bold text-xelltekk-700">{{ formatPrice(item.montant_potentiel) }}</div>
            </div>
            <div class="mt-2 flex flex-wrap gap-2">
              <button type="button" @click="creerDevis(item.client)" class="text-xs font-semibold text-xelltekk-700 hover:underline">+ Devis</button>
              <a v-if="item.client?.email" :href="relanceEmailHref(item.client, item)" class="text-xs font-semibold text-xelltekk-700 hover:underline">Relancer</a>
              <button type="button" @click="openActionFromResume(item)" class="text-xs font-semibold text-xelltekk-700 hover:underline">Action</button>
            </div>
          </article>
        </div>
        <div v-else class="rounded-2xl border border-dashed border-gray-200 p-5 text-center text-sm text-gray-400">
          Aucun prospect chaud détecté.
        </div>
      </section>
    </div>

    <div class="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div class="flex overflow-x-auto border-b border-gray-200">
        <button v-for="tab in tabs" :key="tab.id" type="button" class="px-5 py-3 text-sm font-medium"
          :class="activeTab === tab.id ? 'text-xelltekk-700 border-b-2 border-xelltekk-700' : 'text-gray-500 hover:text-gray-700'"
          @click="activeTab = tab.id">
          {{ tab.label }}
        </button>
        <div class="ml-auto flex items-center gap-2 px-3">
          <button v-if="activeTab === 'actions'" @click="openAction()" class="btn-primary text-sm">+ Action</button>
          <button v-if="activeTab === 'objectifs' && isAdmin" @click="openObjectif()" class="btn-primary text-sm">+ Objectif</button>
        </div>
      </div>

      <div v-if="loading" class="p-12 text-center text-gray-500">Chargement...</div>

      <div v-else-if="activeTab === 'prospects'" class="overflow-x-auto">
        <div v-if="activeKpiLabel" class="flex items-center justify-between border-b border-gray-200 bg-xelltekk-50 px-4 py-2 text-sm text-xelltekk-800">
          <span>{{ activeKpiLabel }}</span>
          <button type="button" @click="clearKpiFilter" class="font-medium hover:underline">Tout afficher</button>
        </div>
        <div class="flex flex-col gap-2 border-b border-gray-200 p-3 md:flex-row">
          <input v-model="prospectFilters.search" @input="onProspectSearch" type="search" class="input flex-1" placeholder="Rechercher prospect, email, téléphone..." />
          <select v-model="prospectFilters.statut" @change="loadProspects(1)" class="input md:w-44">
            <option value="">Tous statuts</option>
            <option value="actif">Actifs</option>
            <option value="inactif">Inactifs</option>
          </select>
        </div>
        <table class="w-full">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <SortableTh column="code" :active="prospectSort.key === 'code'" :icon="prospectSortIcon('code')" @sort="toggleProspectSort">Code</SortableTh>
              <SortableTh column="nom" :active="prospectSort.key === 'nom'" :icon="prospectSortIcon('nom')" @sort="toggleProspectSort">Prospect</SortableTh>
              <SortableTh column="commercial" :active="prospectSort.key === 'commercial'" :icon="prospectSortIcon('commercial')" @sort="toggleProspectSort">Commercial</SortableTh>
              <SortableTh column="ville" :active="prospectSort.key === 'ville'" :icon="prospectSortIcon('ville')" @sort="toggleProspectSort">Ville</SortableTh>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600">Dernière action</th>
              <th class="px-4 py-3 text-center text-xs font-semibold uppercase text-gray-600">Priorité</th>
              <SortableTh column="statut" :active="prospectSort.key === 'statut'" :icon="prospectSortIcon('statut')" align="center" @sort="toggleProspectSort">Statut</SortableTh>
              <th class="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="p in visibleProspects" :key="p.id" class="hover:bg-gray-50">
              <td class="px-4 py-3 font-mono text-sm text-gray-600">{{ p.code }}</td>
              <td class="px-4 py-3">
                <div class="font-medium text-gray-900">{{ p.nom }}</div>
                <div class="text-xs text-gray-500">{{ p.email || p.telephone || '-' }}</div>
              </td>
              <td class="px-4 py-3 text-sm text-gray-700">{{ p.commercial?.name || 'Non affecté' }}</td>
              <td class="px-4 py-3 text-sm text-gray-700">{{ p.ville || '-' }}</td>
              <td class="px-4 py-3">
                <div class="text-sm text-gray-900">{{ latestAction(p)?.objet || '-' }}</div>
                <div class="text-xs text-gray-500">
                  {{ latestAction(p) ? `${typeActionLabel(latestAction(p).type_action)} · ${formatDateTime(latestAction(p).date_action)}` : 'Aucune action' }}
                </div>
              </td>
              <td class="px-4 py-3 text-center">
                <span class="rounded-full px-2.5 py-1 text-xs font-semibold" :class="priorityClass(prospectPriority(p))">
                  {{ priorityLabel(prospectPriority(p)) }}
                </span>
              </td>
              <td class="px-4 py-3 text-center"><span class="badge" :class="p.statut === 'actif' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'">{{ p.statut }}</span></td>
              <td class="px-4 py-3 text-right">
                <div class="flex flex-wrap justify-end gap-2">
                  <a v-if="p.email" :href="relanceEmailHref(p, latestAction(p))" class="text-sm font-medium text-xelltekk-600 hover:text-xelltekk-800">Email</a>
                  <button type="button" @click="creerDevis(p)" class="text-sm font-medium text-xelltekk-600 hover:text-xelltekk-800">+ Devis</button>
                  <button @click="openAction(p)" class="text-sm font-medium text-xelltekk-600 hover:text-xelltekk-800">+ Action</button>
                  <button v-if="isAdmin" @click="openAssignProspect(p)" class="text-sm font-medium text-indigo-600 hover:text-indigo-800">Affecter</button>
                </div>
              </td>
            </tr>
            <tr v-if="visibleProspects.length === 0">
              <td colspan="8" class="px-4 py-12 text-center text-sm text-gray-400">Aucun prospect</td>
            </tr>
          </tbody>
        </table>
        <AppPagination v-if="prospectMeta.total > 0" :meta="prospectMeta" label="prospects" @page="loadProspects" />
      </div>

      <div v-else-if="activeTab === 'actions'" class="overflow-x-auto">
        <div v-if="activeKpiLabel" class="flex items-center justify-between border-b border-gray-200 bg-xelltekk-50 px-4 py-2 text-sm text-xelltekk-800">
          <span>{{ activeKpiLabel }}</span>
          <button type="button" @click="clearKpiFilter" class="font-medium hover:underline">Tout afficher</button>
        </div>
        <div class="flex flex-col gap-2 border-b border-gray-200 p-3 md:flex-row">
          <input v-model="actionFilters.search" @input="onActionSearch" type="search" class="input flex-1" placeholder="Rechercher action, prospect..." />
          <select v-model="actionFilters.statut" @change="loadActions(1)" class="input md:w-44">
            <option value="">Tous statuts</option>
            <option value="planifiee">Planifiées</option>
            <option value="effectuee">Effectuées</option>
            <option value="annulee">Annulées</option>
          </select>
        </div>
        <table class="w-full">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <SortableTh column="date" :active="actionSort.key === 'date'" :icon="actionSortIcon('date')" @sort="toggleActionSort">Date</SortableTh>
              <SortableTh column="prospect" :active="actionSort.key === 'prospect'" :icon="actionSortIcon('prospect')" @sort="toggleActionSort">Prospect</SortableTh>
              <SortableTh column="type" :active="actionSort.key === 'type'" :icon="actionSortIcon('type')" align="center" @sort="toggleActionSort">Type</SortableTh>
              <SortableTh column="objet" :active="actionSort.key === 'objet'" :icon="actionSortIcon('objet')" @sort="toggleActionSort">Objet</SortableTh>
              <SortableTh column="relance" :active="actionSort.key === 'relance'" :icon="actionSortIcon('relance')" @sort="toggleActionSort">Relance</SortableTh>
              <SortableTh column="potentiel" :active="actionSort.key === 'potentiel'" :icon="actionSortIcon('potentiel')" align="right" @sort="toggleActionSort">Potentiel</SortableTh>
              <SortableTh column="resultat" :active="actionSort.key === 'resultat'" :icon="actionSortIcon('resultat')" align="center" @sort="toggleActionSort">Résultat</SortableTh>
              <SortableTh column="statut" :active="actionSort.key === 'statut'" :icon="actionSortIcon('statut')" align="center" @sort="toggleActionSort">Statut</SortableTh>
              <th class="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="a in visibleActions" :key="a.id" class="hover:bg-gray-50">
              <td class="px-4 py-3 text-xs text-gray-600">{{ formatDateTime(a.date_action) }}</td>
              <td class="px-4 py-3">
                <div class="text-sm font-medium text-gray-900">{{ a.client?.nom || 'Prospect' }}</div>
                <div class="text-xs text-gray-500">{{ a.commercial?.name || '-' }}</div>
              </td>
              <td class="px-4 py-3 text-center"><span class="badge bg-blue-100 text-blue-800">{{ typeActionLabel(a.type_action) }}</span></td>
              <td class="px-4 py-3">
                <div class="text-sm text-gray-900">{{ a.objet }}</div>
                <div v-if="a.prochaine_etape" class="text-xs text-gray-500">{{ a.prochaine_etape }}</div>
              </td>
              <td class="px-4 py-3 text-xs" :class="isLate(a.date_relance, a.statut) ? 'text-red-700 font-semibold' : 'text-gray-600'">{{ formatDateTime(a.date_relance) }}</td>
              <td class="px-4 py-3 text-right font-mono text-sm text-xelltekk-700">{{ formatPrice(a.montant_potentiel) }}</td>
              <td class="px-4 py-3 text-center"><span class="badge" :class="resultatClass(a.resultat)">{{ resultatLabel(a.resultat) }}</span></td>
              <td class="px-4 py-3 text-center"><span class="badge" :class="statutActionClass(a.statut)">{{ statutActionLabel(a.statut) }}</span></td>
              <td class="px-4 py-3 text-right">
                <div class="flex flex-wrap justify-end gap-2">
                  <button type="button" @click="openEditAction(a)" class="text-sm font-medium text-xelltekk-600 hover:text-xelltekk-800">Modifier</button>
                  <button v-if="a.statut !== 'effectuee'" type="button" @click="markActionDone(a)" class="text-sm font-medium text-green-700 hover:text-green-900">Terminer</button>
                  <button v-if="isAdmin" @click="openAssignAction(a)" class="text-sm font-medium text-indigo-600 hover:text-indigo-800">Affecter</button>
                  <button type="button" @click="deleteAction(a)" class="text-sm font-medium text-red-600 hover:text-red-800">Suppr.</button>
                </div>
              </td>
            </tr>
            <tr v-if="visibleActions.length === 0">
              <td colspan="9" class="px-4 py-12 text-center text-sm text-gray-400">Aucune action</td>
            </tr>
          </tbody>
        </table>
        <AppPagination v-if="actionMeta.total > 0" :meta="actionMeta" label="actions" @page="loadActionPage" />
      </div>

      <div v-else-if="activeTab === 'objectifs'" class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600">Commercial</th>
              <th class="px-4 py-3 text-center text-xs font-semibold uppercase text-gray-600">Période</th>
              <th class="px-4 py-3 text-center text-xs font-semibold uppercase text-gray-600">Prospects</th>
              <th class="px-4 py-3 text-center text-xs font-semibold uppercase text-gray-600">Actions</th>
              <th class="px-4 py-3 text-center text-xs font-semibold uppercase text-gray-600">Devis</th>
              <th class="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-600">CA</th>
              <th v-if="isAdmin" class="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="o in paginatedObjectifs" :key="o.id" class="hover:bg-gray-50">
              <td class="px-4 py-3 font-medium text-gray-900">{{ o.commercial?.name || 'Commercial' }}</td>
              <td class="px-4 py-3 text-center text-sm text-gray-600">{{ formatDate(o.periode_debut) }} - {{ formatDate(o.periode_fin) }}</td>
              <td class="px-4 py-3">
                <ObjectifProgress :value="o.realisation.prospects" :target="o.objectif_prospects" />
              </td>
              <td class="px-4 py-3">
                <ObjectifProgress :value="o.realisation.actions" :target="o.objectif_actions" />
              </td>
              <td class="px-4 py-3">
                <ObjectifProgress :value="o.realisation.devis" :target="o.objectif_devis" />
              </td>
              <td class="px-4 py-3">
                <ObjectifProgress :value="o.realisation.ca" :target="o.objectif_ca" money />
              </td>
              <td v-if="isAdmin" class="px-4 py-3 text-right">
                <button type="button" @click="openObjectif(o)" class="text-sm font-medium text-xelltekk-700 hover:text-xelltekk-900">Modifier</button>
              </td>
            </tr>
            <tr v-if="objectifs.length === 0">
              <td :colspan="isAdmin ? 7 : 6" class="px-4 py-12 text-center text-sm text-gray-400">Aucun objectif</td>
            </tr>
          </tbody>
        </table>
        <AppPagination v-if="objectifMeta.total > 0" :meta="objectifMeta" label="objectifs" @page="objectifPage = $event" />
      </div>

      <div v-else-if="activeTab === 'activites'" class="p-4">
        <div class="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h4 class="font-semibold text-gray-900">Activités commerciales en temps réel</h4>
            <p class="text-xs text-gray-500">Prospects, clients, prospection, devis et factures.</p>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xs text-gray-500">Dernière mise à jour : {{ activityUpdatedAt || '-' }}</span>
            <button type="button" @click="loadActivites" :disabled="activityLoading" class="btn-secondary px-3 py-1.5 text-sm">
              {{ activityLoading ? '...' : 'Actualiser' }}
            </button>
          </div>
        </div>

        <div v-if="activityLoading && activites.length === 0" class="py-12 text-center text-sm text-gray-400">
          Chargement des activités...
        </div>
        <div v-else class="space-y-2">
          <div
            v-for="item in paginatedActivites"
            :key="`${item.date}-${item.event}-${item.subject_id || item.reference}`"
            class="rounded-lg border border-gray-200 bg-white p-3 shadow-sm"
          >
            <div class="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="rounded-full px-2 py-0.5 text-xs font-semibold" :class="activityClass(item.category)">
                    {{ activityCategoryLabel(item.category) }}
                  </span>
                  <span class="text-xs text-gray-500">{{ item.date || '-' }}</span>
                  <span class="text-xs text-gray-400">par {{ item.user_name || 'Système' }}</span>
                </div>
                <div class="mt-1 font-medium text-gray-900">{{ item.title || item.action || '-' }}</div>
                <div v-if="item.description" class="mt-0.5 text-sm text-gray-600">{{ item.description }}</div>
              </div>
              <div class="text-left md:text-right">
                <div class="font-mono text-xs text-gray-500">{{ item.reference || '-' }}</div>
                <div v-if="item.amount !== null && item.amount !== undefined" class="text-sm font-semibold text-xelltekk-700">
                  {{ formatPrice(item.amount) }}
                </div>
              </div>
            </div>
          </div>
          <div v-if="activites.length === 0" class="py-12 text-center text-sm text-gray-400">
            Aucune activité commerciale trouvée.
          </div>
          <AppPagination v-if="activityMeta.total > 0" :meta="activityMeta" label="activités" @page="activityPage = $event" />
        </div>
      </div>
    </div>

    <AppModal v-model="showActionModal" :title="editingActionId ? 'Modifier action de prospection' : 'Nouvelle action de prospection'" size="lg">
      <form class="space-y-4" @submit.prevent="saveAction">
        <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label class="block">
            <span class="mb-1 block text-sm font-medium text-gray-700">Prospect</span>
            <select v-model.number="actionForm.client_id" required class="input">
              <option :value="null">Prospect...</option>
              <option v-for="p in prospects" :key="p.id" :value="p.id">{{ p.code }} - {{ p.nom }}</option>
            </select>
          </label>
          <label v-if="isAdmin" class="block">
            <span class="mb-1 block text-sm font-medium text-gray-700">Commercial</span>
            <select v-model.number="actionForm.commercial_id" class="input">
              <option :value="null">Commercial...</option>
              <option v-for="c in commerciaux" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
          </label>
          <label class="block">
            <span class="mb-1 block text-sm font-medium text-gray-700">Type d’action</span>
            <select v-model="actionForm.type_action" class="input">
              <option value="appel">Appel</option>
              <option value="email">Email</option>
              <option value="visite">Visite</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="relance">Relance</option>
              <option value="devis">Devis à préparer</option>
              <option value="autre">Autre</option>
            </select>
          </label>
          <label class="block">
            <span class="mb-1 block text-sm font-medium text-gray-700">Statut</span>
            <select v-model="actionForm.statut" class="input">
              <option value="planifiee">Planifiée</option>
              <option value="effectuee">Effectuée</option>
              <option value="annulee">Annulée</option>
            </select>
          </label>
          <label class="block">
            <span class="mb-1 block text-sm font-medium text-gray-700">Date de l’action</span>
            <input v-model="actionForm.date_action" required type="datetime-local" class="input" />
          </label>
          <label class="block">
            <span class="mb-1 block text-sm font-medium text-gray-700">Prochaine relance</span>
            <input v-model="actionForm.date_relance" type="datetime-local" class="input" />
          </label>
          <label class="block md:col-span-2">
            <span class="mb-1 block text-sm font-medium text-gray-700">Objet</span>
            <input v-model="actionForm.objet" required class="input" placeholder="Objet de l'action" />
          </label>
          <label class="block">
            <span class="mb-1 block text-sm font-medium text-gray-700">Montant potentiel</span>
            <input v-model.number="actionForm.montant_potentiel" type="number" min="0" step="1" class="input" placeholder="Montant potentiel" />
          </label>
          <label class="block">
            <span class="mb-1 block text-sm font-medium text-gray-700">Résultat</span>
            <select v-model="actionForm.resultat" class="input">
              <option value="aucun">Aucun</option>
              <option value="interesse">Intéressé</option>
              <option value="a_relancer">À relancer</option>
              <option value="devis_a_faire">Devis à faire</option>
              <option value="converti">Converti</option>
              <option value="perdu">Perdu</option>
            </select>
          </label>
          <label class="block md:col-span-2">
            <span class="mb-1 block text-sm font-medium text-gray-700">Prochaine étape</span>
            <input v-model="actionForm.prochaine_etape" class="input" placeholder="Ex. Envoyer une offre, rappeler mardi..." />
          </label>
          <label class="block md:col-span-2">
            <span class="mb-1 block text-sm font-medium text-gray-700">Compte rendu</span>
            <textarea v-model="actionForm.compte_rendu" rows="3" class="input" placeholder="Compte rendu"></textarea>
          </label>
        </div>
        <div class="flex justify-end gap-2 border-t border-gray-200 pt-3">
          <button type="button" @click="showActionModal = false" class="btn-secondary">Annuler</button>
          <button type="submit" :disabled="saving" class="btn-primary">{{ saving ? 'Enregistrement...' : (editingActionId ? 'Mettre à jour' : 'Enregistrer') }}</button>
        </div>
      </form>
    </AppModal>

    <AppModal v-model="showObjectifModal" :title="editingObjectifId ? 'Modifier objectif commercial' : 'Nouvel objectif commercial'" size="md">
      <form class="space-y-4" @submit.prevent="saveObjectif">
        <label class="block">
          <span class="mb-1 block text-sm font-medium text-gray-700">Commercial</span>
          <select v-model.number="objectifForm.commercial_id" required class="input">
            <option :value="null">Commercial...</option>
            <option v-for="c in commerciaux" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
        </label>
        <div class="grid grid-cols-2 gap-3">
          <label class="block">
            <span class="mb-1 block text-sm font-medium text-gray-700">Date début</span>
            <input v-model="objectifForm.periode_debut" required type="date" class="input" />
          </label>
          <label class="block">
            <span class="mb-1 block text-sm font-medium text-gray-700">Date fin</span>
            <input v-model="objectifForm.periode_fin" required type="date" class="input" />
          </label>
          <label class="block">
            <span class="mb-1 block text-sm font-medium text-gray-700">Objectif prospects</span>
            <input v-model.number="objectifForm.objectif_prospects" type="number" min="0" class="input" placeholder="Ex. 20" />
          </label>
          <label class="block">
            <span class="mb-1 block text-sm font-medium text-gray-700">Objectif actions</span>
            <input v-model.number="objectifForm.objectif_actions" type="number" min="0" class="input" placeholder="Ex. 50" />
          </label>
          <label class="block">
            <span class="mb-1 block text-sm font-medium text-gray-700">Objectif devis</span>
            <input v-model.number="objectifForm.objectif_devis" type="number" min="0" class="input" placeholder="Ex. 10" />
          </label>
          <label class="block">
            <span class="mb-1 block text-sm font-medium text-gray-700">Objectif CA</span>
            <input v-model.number="objectifForm.objectif_ca" type="number" min="0" class="input" placeholder="Ex. 1000000" />
          </label>
        </div>
        <label class="block">
          <span class="mb-1 block text-sm font-medium text-gray-700">Notes</span>
          <textarea v-model="objectifForm.notes" rows="2" class="input" placeholder="Notes"></textarea>
        </label>
        <div class="flex justify-end gap-2 border-t border-gray-200 pt-3">
          <button type="button" @click="showObjectifModal = false" class="btn-secondary">Annuler</button>
          <button type="submit" :disabled="saving" class="btn-primary">{{ saving ? 'Enregistrement...' : (editingObjectifId ? 'Mettre à jour' : 'Enregistrer') }}</button>
        </div>
      </form>
    </AppModal>

    <AssignCommercialModal
      v-if="assignTarget"
      v-model="showAssignModal"
      :endpoint="assignEndpoint"
      :current-commercial-id="assignTarget?.commercial_id"
      :item-label="assignLabel"
      :title="assignTitle"
      @assigned="onAssigned"
    />
  </div>
</template>

<script setup>
import { computed, defineComponent, h, onMounted, onUnmounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'
import AppModal from '@/components/AppModal.vue'
import AppPagination from '@/components/AppPagination.vue'
import AssignCommercialModal from '@/components/AssignCommercialModal.vue'
import SortableTh from '@/components/SortableTh.vue'
import { useAuthStore } from '@/stores/auth'
import { useConfirm } from '@/composables/useConfirm'
import { useToast } from '@/composables/useToast'
import { useTableSort } from '@/composables/useTableSort'
import { telechargerCSV } from '@/services/exports'
import { ouvrirPDF } from '@/services/pdf'

const auth = useAuthStore()
const toast = useToast()
const router = useRouter()
const { confirm: askConfirm } = useConfirm()
const isAdmin = computed(() => ['admin', 'gerant'].includes(auth.user?.role))

const today = new Date()
const startMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10)
const todayIso = today.toISOString().slice(0, 10)

const filters = reactive({ commercial_id: '', date_from: startMonth, date_to: todayIso })
const prospectFilters = reactive({ search: '', statut: '' })
const actionFilters = reactive({ search: '', statut: '' })
const loading = ref(false)
const saving = ref(false)
const exportLoading = ref(false)
const pdfLoading = ref(false)
const activeTab = ref('prospects')
const stats = ref({})
const dashboardExtras = reactive({ pipeline: [], relances_prioritaires: [], prospects_chauds: [] })
const prospects = ref([])
const actions = ref([])
const objectifs = ref([])
const activites = ref([])
const commerciaux = ref([])
const prospectMeta = reactive({ current_page: 1, last_page: 1, total: 0, from: 0, to: 0 })
const actionMeta = reactive({ current_page: 1, last_page: 1, total: 0, from: 0, to: 0 })
const objectifPage = ref(1)
const objectifPerPage = 10
const activityPage = ref(1)
const activityPerPage = 25
const showActionModal = ref(false)
const showObjectifModal = ref(false)
const activeKpi = ref('')
const activityLoading = ref(false)
const activityUpdatedAt = ref('')
const editingActionId = ref(null)
const editingObjectifId = ref(null)
const showAssignModal = ref(false)
const assignTarget = ref(null)
const assignKind = ref('')
const assignEndpoint = computed(() => {
  if (!assignTarget.value) return '/clients/0/assign-commercial'
  return assignKind.value === 'action' ?
     `/prospection/actions/${assignTarget.value.id}/assign-commercial`
    : `/clients/${assignTarget.value.id}/assign-commercial`
})
const assignTitle = computed(() => assignKind.value === 'action' ? 'Affecter action de prospection' : 'Affecter prospect')
const assignLabel = computed(() => {
  if (!assignTarget.value) return ''
  return assignKind.value === 'action' ?
     `${assignTarget.value.objet} - ${assignTarget.value.client?.nom || ''}`
    : `${assignTarget.value.code} - ${assignTarget.value.nom}`
})

const ObjectifProgress = defineComponent({
  props: {
    value: { type: [Number, String], default: 0 },
    target: { type: [Number, String], default: 0 },
    money: { type: Boolean, default: false },
  },
  setup(props) {
    return () => {
      const percent = objectifPercent(props.value, props.target)
      const valueText = props.money ? formatPrice(props.value) : formatNumber(props.value)
      const targetText = props.money ? formatPrice(props.target) : formatNumber(props.target)

      return h('div', { class: 'min-w-36 space-y-1.5' }, [
        h('div', { class: 'flex items-center justify-between gap-2 text-xs' }, [
          h('span', { class: 'font-medium text-gray-700' }, `${valueText} / ${targetText}`),
          h('span', { class: ['font-semibold', objectifPercentClass(percent)] }, `${percent}%`),
        ]),
        h('div', { class: 'h-2 overflow-hidden rounded-full bg-gray-200' }, [
          h('div', {
            class: ['h-full rounded-full transition-all', objectifBarClass(percent)],
            style: { width: `${Math.min(percent, 100)}%` },
          }),
        ]),
      ])
    }
  },
})

const tabs = computed(() => [
  { id: 'prospects', label: 'Prospects' },
  { id: 'actions', label: 'Actions & relances' },
  { id: 'objectifs', label: 'Objectifs' },
    ...(isAdmin.value ? [{ id: 'activites', label: 'Activités' }] : []),
])

async function exporterCSV() {
  exportLoading.value = true
  try {
    if (activeTab.value === 'objectifs') {
      await telechargerCSV('/exports/prospection-objectifs', {
        commercial_id: filters.commercial_id || undefined,
      }, 'objectifs_prospection.csv')
      toast.success('Export des objectifs téléchargé.')
      return
    }

    if (activeTab.value === 'prospects') {
      await telechargerCSV('/exports/prospection-prospects', {
        commercial_id: filters.commercial_id || undefined,
      }, 'prospects_prospection.csv')
      toast.success('Export des prospects téléchargé.')
      return
    }

    await telechargerCSV('/exports/prospection-actions', {
      commercial_id: filters.commercial_id || undefined,
      date_from: filters.date_from || undefined,
      date_to: filters.date_to || undefined,
      search: actionFilters.search || undefined,
      statut: activeTab.value === 'actions' ? (actionFilters.statut || undefined) : undefined,
    }, 'actions_prospection.csv')
    toast.success('Export de la prospection téléchargé.')
  } catch (e) {
    toast.error('Export impossible pour le moment.')
  } finally {
    exportLoading.value = false
  }
}

async function ouvrirEtatPdf() {
  if (!isAdmin.value) return

  pdfLoading.value = true
  try {
    const params = new URLSearchParams()
    if (filters.commercial_id) params.set('commercial_id', filters.commercial_id)
    if (filters.date_from) params.set('date_from', filters.date_from)
    if (filters.date_to) params.set('date_to', filters.date_to)

    const suffix = params.toString() ? `?${params.toString()}` : ''
    await ouvrirPDF(`/prospection/etat-commerciaux/pdf${suffix}`, 'Etat-avancement-commerciaux.pdf')
  } catch (e) {
    toast.error(e.response.data.message || 'Impossible de générer le PDF.')
  } finally {
    pdfLoading.value = false
  }
}

const prospectSorter = useTableSort('created_at', 'desc')
const actionSorter = useTableSort('date', 'desc')
const { sort: prospectSort, toggleSort: toggleProspectSort, sortIcon: prospectSortIcon, sortedRows: sortedProspectRows } = prospectSorter
const { sort: actionSort, toggleSort: toggleActionSort, sortIcon: actionSortIcon, sortedRows: sortedActionRows } = actionSorter

const sortedProspects = computed(() => sortedProspectRows(prospects.value, {
  created_at: 'created_at',
  code: 'code',
  nom: 'nom',
  commercial: (p) => p.commercial?.name || '',
  ville: 'ville',
  statut: 'statut',
}))

const sortedActions = computed(() => sortedActionRows(actions.value, {
  date: 'date_action',
  prospect: (a) => a.client?.nom || '',
  type: 'type_action',
  objet: 'objet',
  relance: 'date_relance',
  potentiel: (a) => parseFloat(a.montant_potentiel || 0),
  resultat: 'resultat',
  statut: 'statut',
}))

const visibleProspects = computed(() => {
  const stageFilters = ['nouveau', 'chaud', 'converti', 'perdu', 'suivi']
  if (!stageFilters.includes(activeKpi.value)) {
    return sortedProspects.value
  }

  return sortedProspects.value.filter((prospect) => {
    const priority = prospectPriority(prospect)
    if (activeKpi.value === 'converti') return priority === 'gagne'
    return priority === activeKpi.value
  })
})

const visibleActions = computed(() => {
  if (activeKpi.value === 'relances') {
    return sortedActions.value.filter((action) => isLate(action.date_relance, action.statut))
  }
  if (activeKpi.value === 'potentiel') {
    return sortedActions.value.filter((action) => parseFloat(action.montant_potentiel || 0) > 0)
  }
  return sortedActions.value
})

const pipelineStages = computed(() => dashboardExtras.pipeline || [])
const relancesPrioritaires = computed(() => dashboardExtras.relances_prioritaires || [])
const prospectsChauds = computed(() => dashboardExtras.prospects_chauds || [])
const pipelineTotal = computed(() => pipelineStages.value.reduce((sum, stage) => sum + Number(stage.count || 0), 0))

const paginatedObjectifs = computed(() => {
  const start = (objectifPage.value - 1) * objectifPerPage
  return objectifs.value.slice(start, start + objectifPerPage)
})

const objectifMeta = computed(() => {
  const total = objectifs.value.length
  const lastPage = Math.max(Math.ceil(total / objectifPerPage), 1)
  const current = Math.min(objectifPage.value, lastPage)
  const from = total ? (current - 1) * objectifPerPage + 1 : 0
  const to = Math.min(current * objectifPerPage, total)

  return { current_page: current, last_page: lastPage, total, from, to }
})

const paginatedActivites = computed(() => {
  const start = (activityPage.value - 1) * activityPerPage
  return activites.value.slice(start, start + activityPerPage)
})

const activityMeta = computed(() => {
  const total = activites.value.length
  const lastPage = Math.max(Math.ceil(total / activityPerPage), 1)
  const current = Math.min(activityPage.value, lastPage)
  const from = total ? (current - 1) * activityPerPage + 1 : 0
  const to = Math.min(current * activityPerPage, total)

  return { current_page: current, last_page: lastPage, total, from, to }
})

const activeKpiLabel = computed(() => {
  const labels = {
    prospects: 'Liste des prospects',
    actions: 'Toutes les actions de prospection',
    effectuees: 'Actions effectuées',
    relances: 'Relances en retard',
    devis: 'Actions liées aux devis',
    potentiel: 'Actions avec potentiel commercial',
    nouveau: 'Prospects nouveaux',
    a_relancer: 'Relances prioritaires',
    chaud: 'Prospects chauds',
    converti: 'Prospects convertis',
    perdu: 'Prospects perdus',
    suivi: 'Prospects en suivi',
  }
  return labels[activeKpi.value] || ''
})

const actionForm = reactive({
  client_id: null,
  commercial_id: null,
  type_action: 'appel',
  statut: 'planifiee',
  date_action: '',
  date_relance: '',
  objet: '',
  compte_rendu: '',
  resultat: 'aucun',
  montant_potentiel: 0,
  prochaine_etape: '',
})

const objectifForm = reactive({
  commercial_id: null,
  periode_debut: startMonth,
  periode_fin: todayIso,
  objectif_prospects: 0,
  objectif_actions: 0,
  objectif_devis: 0,
  objectif_ca: 0,
  notes: '',
})

let prospectSearchTimeout = null
let actionSearchTimeout = null
let activityInterval = null

async function reload() {
  const firstLoad = prospects.value.length === 0 && actions.value.length === 0 && objectifs.value.length === 0
  loading.value = firstLoad
  try {
    await loadProspects()
  } catch (e) {
    toast.error('Erreur de chargement des prospects')
  } finally {
    loading.value = false
  }

  const loaders = [
    loadDashboard(),
    loadActions(),
    loadObjectifs(),
    isAdmin.value ? loadActivites() : Promise.resolve(),
  ]

  const results = await Promise.allSettled(loaders)
  if (results.some(result => result.status === 'rejected')) {
    toast.error('Certaines donnees de prospection n’ont pas pu etre actualisees.')
  }
}

async function loadDashboard() {
  const { data } = await api.get('/prospection/dashboard', { params: filters })
  stats.value = data.stats || {}
  dashboardExtras.pipeline = data.pipeline || []
  dashboardExtras.relances_prioritaires = data.relances_prioritaires || []
  dashboardExtras.prospects_chauds = data.prospects_chauds || []
}

async function loadProspects(page = 1) {
  const { data } = await api.get('/prospection/prospects', {
    params: {
      page,
      commercial_id: filters.commercial_id || undefined,
      search: prospectFilters.search || undefined,
      statut: prospectFilters.statut || undefined,
      per_page: 25,
    },
  })
  prospects.value = data.data || []
  Object.assign(prospectMeta, {
    current_page: data.current_page,
    last_page: data.last_page,
    total: data.total,
    from: data.from || 0,
    to: data.to || 0,
  })
}

async function loadActions(page = 1) {
  const { data } = await api.get('/prospection/actions', {
    params: {
      page,
      commercial_id: filters.commercial_id || undefined,
      search: actionFilters.search || undefined,
      statut: actionFilters.statut || undefined,
      per_page: 25,
    },
  })
  actions.value = data.data || []
  Object.assign(actionMeta, {
    current_page: data.current_page,
    last_page: data.last_page,
    total: data.total,
    from: data.from || 0,
    to: data.to || 0,
  })
}

async function loadObjectifs() {
  const { data } = await api.get('/prospection/objectifs', { params: { commercial_id: filters.commercial_id || undefined } })
  objectifs.value = data || []
  objectifPage.value = 1
}

async function loadActivites() {
  if (!isAdmin.value) return
  activityLoading.value = true
  try {
    const { data } = await api.get('/prospection/activites', {
      params: {
        commercial_id: filters.commercial_id || undefined,
        date_from: filters.date_from || undefined,
        date_to: filters.date_to || undefined,
        limit: 300,
      },
    })
    activites.value = data.data || []
    activityUpdatedAt.value = data.updated_at || new Date().toLocaleString('fr-FR')
    activityPage.value = 1
  } catch (e) {
    toast.error(e.response.data.message || 'Impossible de charger les activités')
  } finally {
    activityLoading.value = false
  }
}

async function loadCommerciaux() {
  const { data } = await api.get('/prospection/commerciaux')
  commerciaux.value = data || []
}

function onProspectSearch() {
  clearTimeout(prospectSearchTimeout)
  prospectSearchTimeout = setTimeout(() => loadProspects(1), 300)
}

function onActionSearch() {
  clearTimeout(actionSearchTimeout)
  actionSearchTimeout = setTimeout(() => loadActions(1), 300)
}

async function applyKpiFilter(kpi) {
  activeKpi.value = kpi

  if (kpi === 'prospects') {
    activeTab.value = 'prospects'
    return
  }

  activeTab.value = 'actions'
  actionFilters.search = ''
  actionFilters.statut = kpi === 'effectuees' ? 'effectuee' : ''

  if (kpi === 'devis') {
    await loadActionsByType('devis')
  } else {
    await loadActions(1)
  }
}

async function openStage(stage) {
  activeKpi.value = stage.key

  if (stage.key === 'a_relancer') {
    activeTab.value = 'actions'
    actionFilters.search = ''
    actionFilters.statut = ''
    await loadActions(1)
    return
  }

  if (stage.key === 'devis') {
    activeTab.value = 'actions'
    actionFilters.search = ''
    actionFilters.statut = ''
    await loadActionsByType('devis')
    return
  }

  activeTab.value = 'prospects'
}

function clearKpiFilter() {
  activeKpi.value = ''
  actionFilters.statut = ''
  actionFilters.search = ''
  if (activeTab.value === 'actions') {
    loadActions(1)
  }
}

function kpiCardClass(kpi) {
  return activeKpi.value === kpi ?
     'border-xelltekk-500 bg-xelltekk-50 ring-2 ring-xelltekk-100'
    : 'border-gray-200 bg-white'
}

async function loadActionsByType(typeAction, page = 1) {
  const { data } = await api.get('/prospection/actions', {
    params: {
      page,
      commercial_id: filters.commercial_id || undefined,
      type_action: typeAction,
      per_page: 25,
    },
  })
  actions.value = data.data || []
  Object.assign(actionMeta, {
    current_page: data.current_page,
    last_page: data.last_page,
    total: data.total,
    from: data.from || 0,
    to: data.to || 0,
  })
}

function loadActionPage(page = 1) {
  if (activeKpi.value === 'devis') {
    return loadActionsByType('devis', page)
  }

  return loadActions(page)
}

function openAction(prospect = null) {
  editingActionId.value = null
  Object.assign(actionForm, {
    client_id: prospect?.id || null,
    commercial_id: prospect?.commercial_id || (filters.commercial_id ? Number(filters.commercial_id) : null),
    type_action: 'appel',
    statut: 'planifiee',
    date_action: new Date().toISOString().slice(0, 16),
    date_relance: '',
    objet: prospect ? `Relance ${prospect.nom}` : '',
    compte_rendu: '',
    resultat: 'aucun',
    montant_potentiel: 0,
    prochaine_etape: '',
  })
  showActionModal.value = true
}

function openActionFromResume(item) {
  const prospect = item?.client ? {
    id: item.client.id || item.client_id,
    nom: item.client.nom,
    code: item.client.code,
    email: item.client.email,
    telephone: item.client.telephone,
    mobile: item.client.mobile,
    commercial_id: item.commercial?.id || null,
  } : null
  openAction(prospect)
  actionForm.type_action = 'relance'
  actionForm.objet = item?.objet ? `Suite ${item.objet}` : `Relance ${prospect?.nom || ''}`.trim()
  actionForm.montant_potentiel = Number(item?.montant_potentiel || item?.potentiel || 0)
  actionForm.prochaine_etape = item?.prochaine_etape || ''
}

function openEditAction(action) {
  editingActionId.value = action.id
  Object.assign(actionForm, {
    client_id: action.client_id || action.client?.id || null,
    commercial_id: action.commercial_id || action.commercial?.id || null,
    type_action: action.type_action || 'appel',
    statut: action.statut || 'planifiee',
    date_action: inputDateTime(action.date_action) || new Date().toISOString().slice(0, 16),
    date_relance: inputDateTime(action.date_relance),
    objet: action.objet || '',
    compte_rendu: action.compte_rendu || '',
    resultat: action.resultat || 'aucun',
    montant_potentiel: Number(action.montant_potentiel || 0),
    prochaine_etape: action.prochaine_etape || '',
  })
  showActionModal.value = true
}

function openAssignProspect(prospect) {
  assignKind.value = 'prospect'
  assignTarget.value = prospect
  showAssignModal.value = true
}

function openAssignAction(action) {
  assignKind.value = 'action'
  assignTarget.value = action
  showAssignModal.value = true
}

function onAssigned() {
  reload()
}

function openObjectif(objectif = null) {
  editingObjectifId.value = objectif?.id || null
  Object.assign(objectifForm, {
    commercial_id: objectif?.commercial_id || (filters.commercial_id ? Number(filters.commercial_id) : null),
    periode_debut: inputDate(objectif?.periode_debut) || startMonth,
    periode_fin: inputDate(objectif?.periode_fin) || todayIso,
    objectif_prospects: Number(objectif?.objectif_prospects || 0),
    objectif_actions: Number(objectif?.objectif_actions || 0),
    objectif_devis: Number(objectif?.objectif_devis || 0),
    objectif_ca: Number(objectif?.objectif_ca || 0),
    notes: objectif?.notes || '',
  })
  showObjectifModal.value = true
}

async function saveAction() {
  saving.value = true
  try {
    const payload = {
      ...actionForm,
      commercial_id: actionForm.commercial_id || undefined,
      date_relance: actionForm.date_relance || null,
      compte_rendu: actionForm.compte_rendu || null,
      resultat: actionForm.resultat || 'aucun',
      prochaine_etape: actionForm.prochaine_etape || null,
    }

    if (editingActionId.value) {
      await api.put(`/prospection/actions/${editingActionId.value}`, payload)
      toast.success('Action mise à jour')
    } else {
      await api.post('/prospection/actions', payload)
      toast.success('Action enregistrée')
    }

    showActionModal.value = false
    editingActionId.value = null
    await reload()
  } catch (e) {
    toast.error(e.response.data.message || 'Erreur enregistrement')
  } finally {
    saving.value = false
  }
}

async function markActionDone(action) {
  try {
    await api.put(`/prospection/actions/${action.id}`, {
      client_id: action.client_id || action.client?.id,
      commercial_id: action.commercial_id || action.commercial?.id || undefined,
      type_action: action.type_action,
      statut: 'effectuee',
      date_action: action.date_action,
      date_relance: action.date_relance || null,
      objet: action.objet,
      compte_rendu: action.compte_rendu || action.prochaine_etape || null,
      resultat: action.resultat || 'aucun',
      montant_potentiel: action.montant_potentiel || 0,
      prochaine_etape: action.prochaine_etape || null,
    })
    toast.success('Action marquée comme effectuée')
    await reload()
  } catch (e) {
    toast.error(e.response.data.message || 'Impossible de terminer l’action')
  }
}

async function deleteAction(action) {
  const confirmed = await askConfirm({
    title: 'Supprimer l’action',
    message: `Supprimer l’action « ${action.objet || 'prospection'} » ?`,
    hint: 'Elle ira dans la corbeille si la restauration est disponible côté serveur.',
    confirmLabel: 'Supprimer',
    tone: 'danger',
  })
  if (!confirmed) return

  try {
    await api.delete(`/prospection/actions/${action.id}`)
    toast.success('Action supprimée')
    await reload()
  } catch (e) {
    toast.error(e.response.data.message || 'Suppression impossible')
  }
}

async function saveObjectif() {
  saving.value = true
  try {
    if (editingObjectifId.value) {
      await api.put(`/prospection/objectifs/${editingObjectifId.value}`, objectifForm)
      toast.success('Objectif mis à jour')
    } else {
      await api.post('/prospection/objectifs', objectifForm)
      toast.success('Objectif enregistré')
    }
    showObjectifModal.value = false
    editingObjectifId.value = null
    await reload()
  } catch (e) {
    toast.error(e.response.data.message || 'Erreur objectif')
  } finally {
    saving.value = false
  }
}

function objectifPercent(value, target) {
  const goal = Number(target || 0)
  if (goal <= 0) {
    return Number(value || 0) > 0 ? 100 : 0
  }
  return Math.round((Number(value || 0) / goal) * 100)
}

function objectifBarClass(percent) {
  if (percent >= 100) return 'bg-green-600'
  if (percent >= 70) return 'bg-blue-600'
  if (percent >= 40) return 'bg-yellow-500'
  return 'bg-red-500'
}

function objectifPercentClass(percent) {
  if (percent >= 100) return 'text-green-700'
  if (percent >= 70) return 'text-blue-700'
  if (percent >= 40) return 'text-yellow-700'
  return 'text-red-700'
}

function latestAction(prospect) {
  return prospect?.latest_prospection_action || prospect?.prospection_actions?.[0] || null
}

function prospectPriority(prospect) {
  const action = latestAction(prospect)
  if (!action) return 'nouveau'
  if (action.resultat === 'converti') return 'gagne'
  if (action.resultat === 'perdu' || action.statut === 'annulee') return 'perdu'
  if (isLate(action.date_relance, action.statut)) return 'retard'
  if (action.resultat === 'devis_a_faire' || action.type_action === 'devis') return 'devis'
  if (action.resultat === 'interesse' || Number(action.montant_potentiel || 0) > 0) return 'chaud'
  return 'suivi'
}

function stagePercent(stage) {
  const total = pipelineTotal.value || 0
  if (!total) return 0
  return Math.round((Number(stage.count || 0) / total) * 100)
}

function stageBadgeClass(stage) {
  return {
    nouveau: 'bg-slate-100 text-slate-700',
    a_relancer: 'bg-red-100 text-red-700',
    chaud: 'bg-amber-100 text-amber-700',
    devis: 'bg-purple-100 text-purple-700',
    converti: 'bg-green-100 text-green-700',
    perdu: 'bg-gray-200 text-gray-700',
    suivi: 'bg-blue-100 text-blue-700',
  }[stage] || 'bg-gray-100 text-gray-700'
}

function stageBarClass(stage) {
  return {
    nouveau: 'bg-slate-500',
    a_relancer: 'bg-red-500',
    chaud: 'bg-amber-500',
    devis: 'bg-purple-500',
    converti: 'bg-green-600',
    perdu: 'bg-gray-500',
    suivi: 'bg-blue-500',
  }[stage] || 'bg-xelltekk-600'
}

function priorityLabel(priority) {
  return {
    nouveau: 'Nouveau',
    retard: 'En retard',
    devis: 'Devis',
    chaud: 'Chaud',
    suivi: 'Suivi',
    gagne: 'Gagné',
    perdu: 'Perdu',
  }[priority] || 'Suivi'
}

function priorityClass(priority) {
  return {
    nouveau: 'bg-slate-100 text-slate-700',
    retard: 'bg-red-100 text-red-700',
    devis: 'bg-purple-100 text-purple-700',
    chaud: 'bg-amber-100 text-amber-700',
    suivi: 'bg-blue-100 text-blue-700',
    gagne: 'bg-green-100 text-green-700',
    perdu: 'bg-gray-200 text-gray-700',
  }[priority] || 'bg-gray-100 text-gray-700'
}

function resultatLabel(resultat) {
  return {
    interesse: 'Intéressé',
    a_relancer: 'À relancer',
    devis_a_faire: 'Devis',
    converti: 'Converti',
    perdu: 'Perdu',
    aucun: 'Aucun',
  }[resultat] || 'Aucun'
}

function resultatClass(resultat) {
  return {
    interesse: 'bg-amber-100 text-amber-800',
    a_relancer: 'bg-blue-100 text-blue-800',
    devis_a_faire: 'bg-purple-100 text-purple-800',
    converti: 'bg-green-100 text-green-800',
    perdu: 'bg-gray-200 text-gray-700',
    aucun: 'bg-slate-100 text-slate-600',
  }[resultat] || 'bg-slate-100 text-slate-600'
}

function creerDevis(prospect) {
  const id = prospect?.id || prospect?.client_id
  if (!id) return
  router.push({ path: '/devis', query: { create_client: id } })
}

function relanceEmailHref(prospect, action = null) {
  const email = prospect?.email
  if (!email) return '#'
  const nom = prospect?.nom || 'client'
  const sujet = encodeURIComponent(`Relance commerciale - ${nom}`)
  const objet = action?.objet ? ` concernant ${action.objet}` : ''
  const potentiel = Number(action?.montant_potentiel || action?.potentiel || 0)
  const body = encodeURIComponent(
    `Bonjour,\n\nJe me permets de revenir vers vous${objet}.\n\n` +
    `Nous restons disponibles pour échanger sur votre besoin et vous proposer la solution la plus adaptée.\n` +
    `${potentiel > 0 ? `\nMontant/opportunité estimée : ${formatPrice(potentiel)} Francs CFA BCEAO.\n` : ''}` +
    `\nCordialement,\n${auth.user?.name || 'L’équipe commerciale'}\nXELLTEKK`
  )

  return `mailto:${email}?subject=${sujet}&body=${body}`
}

function phoneHref(prospect) {
  const phone = (prospect?.mobile || prospect?.telephone || '').replace(/[^\d+]/g, '')
  return phone ? `tel:${phone}` : ''
}

function inputDate(value) { return value ? String(value).slice(0, 10) : '' }
function inputDateTime(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 16)
  const offset = date.getTimezoneOffset()
  const local = new Date(date.getTime() - offset * 60000)
  return local.toISOString().slice(0, 16)
}
function formatNumber(n) { return new Intl.NumberFormat('fr-FR').format(Math.round(n || 0)) }
function formatPrice(n) { return new Intl.NumberFormat('fr-FR').format(Math.round(n || 0))  }
function formatDate(d) { return d ? new Date(d).toLocaleDateString('fr-FR') : '-' }
function formatDateTime(d) { return d ? new Date(d).toLocaleString('fr-FR') : '-' }
function isLate(date, statut) { return date && statut !== 'effectuee' && new Date(date) < new Date() }
function typeActionLabel(t) { return { appel: 'Appel', email: 'Email', visite: 'Visite', whatsapp: 'WhatsApp', relance: 'Relance', devis: 'Devis', autre: 'Autre' }[t] || t }
function statutActionLabel(s) { return { planifiee: 'Planifiée', effectuee: 'Effectuée', annulee: 'Annulée' }[s] || s }
function statutActionClass(s) {
  return { planifiee: 'bg-yellow-100 text-yellow-800', effectuee: 'bg-green-100 text-green-800', annulee: 'bg-gray-200 text-gray-700' }[s] || 'bg-gray-100'
}
function activityCategoryLabel(category) {
  return { client: 'Client', prospection: 'Prospection', devis: 'Devis', facture: 'Facture' }[category] || 'Activité'
}
function activityClass(category) {
  return {
    client: 'bg-slate-100 text-slate-700',
    prospection: 'bg-blue-100 text-blue-700',
    devis: 'bg-purple-100 text-purple-700',
    facture: 'bg-emerald-100 text-emerald-700',
  }[category] || 'bg-gray-100 text-gray-700'
}

onMounted(async () => {
  await loadCommerciaux()
  await reload()
  if (isAdmin.value) {
    activityInterval = window.setInterval(loadActivites, 10000)
  }
})

onUnmounted(() => {
  clearTimeout(prospectSearchTimeout)
  clearTimeout(actionSearchTimeout)
  if (activityInterval) {
    window.clearInterval(activityInterval)
  }
})
</script>
