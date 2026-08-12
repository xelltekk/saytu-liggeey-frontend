<template>
  <div class="space-y-5">
    <section class="rounded-[1.75rem] bg-gradient-to-br from-slate-950 via-blue-950 to-xelltekk-800 p-5 text-white shadow-sm">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p class="text-sm font-semibold uppercase tracking-[0.25em] text-xelltekk-100">Leasing imprimantes</p>
          <h2 class="mt-2 text-2xl font-bold">Location, contrats et relevés compteur</h2>
          <p class="mt-1 max-w-3xl text-sm text-blue-100">
            Suivez les imprimantes louées chez vos clients, les forfaits de pages, les compteurs et les interventions.
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <button type="button" class="btn-secondary bg-white/95 text-slate-900 hover:bg-white" @click="openImprimanteModal">+ Imprimante</button>
          <button type="button" class="btn-secondary bg-white/95 text-slate-900 hover:bg-white" @click="openContratModal">+ Contrat</button>
          <button type="button" class="btn-primary bg-white text-xelltekk-700 hover:bg-blue-50" @click="openReleveModal">+ Relevé</button>
        </div>
      </div>
    </section>

    <div v-if="moduleWarning" class="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
      {{ moduleWarning }}
    </div>

    <section class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <span class="caption">Contrats actifs</span>
        <strong class="mt-1 block text-2xl text-slate-900">{{ stats.contrats_actifs || 0 }}</strong>
      </div>
      <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <span class="caption">Imprimantes disponibles</span>
        <strong class="mt-1 block text-2xl text-emerald-600">{{ stats.imprimantes_disponibles || 0 }}</strong>
      </div>
      <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <span class="caption">Loyer mensuel HT</span>
        <strong class="mt-1 block text-2xl text-xelltekk-700">{{ money(stats.loyer_mensuel_ht) }}</strong>
      </div>
      <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <span class="caption">Interventions ouvertes</span>
        <strong class="mt-1 block text-2xl text-orange-600">{{ stats.interventions_ouvertes || 0 }}</strong>
      </div>
    </section>

    <section class="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
      <div class="flex flex-wrap gap-2">
        <button v-for="tab in tabs" :key="tab.key" type="button" class="rounded-xl px-4 py-2 text-sm font-semibold transition" :class="activeTab === tab.key ? 'bg-xelltekk-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'" @click="activeTab = tab.key">
          {{ tab.label }}
        </button>
      </div>
    </section>

    <section v-if="activeTab === 'contrats'" class="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div class="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 class="font-bold text-slate-900">Contrats de leasing</h3>
          <p class="text-sm text-slate-500">Derniers contrats en haut.</p>
        </div>
        <div class="flex flex-col gap-2 sm:flex-row">
          <input v-model="filters.contrats.search" class="input sm:w-72" placeholder="Rechercher contrat, client, imprimante..." @keyup.enter="loadContrats" />
          <select v-model="filters.contrats.statut" class="input sm:w-44" @change="loadContrats">
            <option value="">Tous statuts</option>
            <option v-for="item in referentiels.statuts_contrats" :key="item.value" :value="item.value">{{ item.label }}</option>
          </select>
          <button class="btn-secondary" @click="loadContrats">Filtrer</button>
        </div>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full min-w-[980px]">
          <thead class="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th class="px-4 py-3 text-left">N°</th>
              <th class="px-4 py-3 text-left">Client</th>
              <th class="px-4 py-3 text-left">Imprimante</th>
              <th class="px-4 py-3 text-center">Début</th>
              <th class="px-4 py-3 text-right">Loyer HT</th>
              <th class="px-4 py-3 text-right">Forfait</th>
              <th class="px-4 py-3 text-center">Statut</th>
              <th class="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="contrat in contrats" :key="contrat.id" class="hover:bg-slate-50">
              <td class="px-4 py-3 font-mono text-sm text-slate-600">{{ contrat.numero }}</td>
              <td class="px-4 py-3">
                <div class="font-medium text-slate-900">{{ contrat.client?.nom || '-' }}</div>
                <div class="text-xs text-slate-500">{{ contrat.client?.code }}</div>
              </td>
              <td class="px-4 py-3">
                <div class="font-medium text-slate-900">{{ contrat.imprimante?.designation || '-' }}</div>
                <div class="text-xs text-slate-500">{{ contrat.imprimante?.reference }} · {{ contrat.imprimante?.numero_serie || 'Sans série' }}</div>
              </td>
              <td class="px-4 py-3 text-center text-sm text-slate-600">{{ dateLabel(contrat.date_debut) }}</td>
              <td class="px-4 py-3 text-right font-semibold text-slate-900">{{ money(contrat.loyer_mensuel_ht) }}</td>
              <td class="px-4 py-3 text-right text-sm text-slate-600">{{ contrat.forfait_pages_noir || 0 }} N / {{ contrat.forfait_pages_couleur || 0 }} C</td>
              <td class="px-4 py-3 text-center"><span class="badge" :class="statutContratClass(contrat.statut)">{{ statutLabel(contrat.statut) }}</span></td>
              <td class="px-4 py-3 text-right">
                <div class="flex justify-end gap-2">
                  <button v-if="contrat.statut === 'brouillon'" type="button" class="text-sm font-semibold text-emerald-700 hover:text-emerald-900" @click="activerContrat(contrat)">Activer</button>
                  <button v-if="['actif', 'suspendu'].includes(contrat.statut)" type="button" class="text-sm font-semibold text-orange-700 hover:text-orange-900" @click="cloturerContrat(contrat)">Clôturer</button>
                  <button type="button" class="text-sm font-semibold text-xelltekk-700 hover:text-xelltekk-900" @click="openReleveModal(contrat)">Relevé</button>
                  <button type="button" class="text-sm font-semibold text-blue-700 hover:text-blue-900" @click="downloadContratPdf(contrat)">Contrat PDF</button>
                </div>
              </td>
            </tr>
            <tr v-if="!loading && contrats.length === 0">
              <td colspan="8" class="px-4 py-10 text-center text-sm text-slate-400">Aucun contrat de leasing.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section v-if="activeTab === 'imprimantes'" class="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div class="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 class="font-bold text-slate-900">Parc imprimantes</h3>
          <p class="text-sm text-slate-500">Matériel disponible, loué ou en maintenance.</p>
        </div>
        <div class="flex flex-col gap-2 sm:flex-row">
          <input v-model="filters.imprimantes.search" class="input sm:w-72" placeholder="Référence, série, modèle..." @keyup.enter="loadImprimantes" />
          <select v-model="filters.imprimantes.statut" class="input sm:w-44" @change="loadImprimantes">
            <option value="">Tous statuts</option>
            <option v-for="item in referentiels.statuts_imprimantes" :key="item.value" :value="item.value">{{ item.label }}</option>
          </select>
          <button class="btn-secondary" @click="loadImprimantes">Filtrer</button>
        </div>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full min-w-[1050px]">
          <thead class="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th class="px-4 py-3 text-left">Référence</th>
              <th class="px-4 py-3 text-left">Imprimante</th>
              <th class="px-4 py-3 text-left">N° série</th>
              <th class="px-4 py-3 text-left">Emplacement</th>
              <th class="px-4 py-3 text-left">Type</th>
              <th class="px-4 py-3 text-right">Compteur noir</th>
              <th class="px-4 py-3 text-right">Compteur couleur</th>
              <th class="px-4 py-3 text-center">Statut</th>
              <th class="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="imprimante in imprimantes" :key="imprimante.id" class="hover:bg-slate-50">
              <td class="px-4 py-3 font-mono text-sm text-slate-600">{{ imprimante.reference }}</td>
              <td class="px-4 py-3">
                <div class="font-bold text-slate-900">{{ imprimante.designation }}</div>
                <div class="text-xs text-slate-500">{{ imprimante.marque || '-' }} {{ imprimante.modele || '' }}</div>
                <div v-if="imprimante.contrat_actif?.client" class="mt-1 text-xs font-semibold text-blue-700">
                  Louée à {{ imprimante.contrat_actif.client.nom }}
                </div>
              </td>
              <td class="px-4 py-3 text-sm text-slate-700">{{ imprimante.numero_serie || '-' }}</td>
              <td class="px-4 py-3 text-sm text-slate-700">{{ imprimante.localisation || '-' }}</td>
              <td class="px-4 py-3 text-sm text-slate-700">{{ typeImpressionLabel(imprimante.type_impression) }}</td>
              <td class="px-4 py-3 text-right font-semibold text-slate-900">{{ imprimante.compteur_actuel_noir || 0 }}</td>
              <td class="px-4 py-3 text-right font-semibold text-slate-900">{{ imprimante.compteur_actuel_couleur ?? '-' }}</td>
              <td class="px-4 py-3 text-center">
                <span class="badge" :class="statutImprimanteClass(imprimante.statut)">{{ statutLabel(imprimante.statut) }}</span>
              </td>
              <td class="px-4 py-3 text-right">
                <button
                  v-if="canManageImprimantes"
                  type="button"
                  class="rounded-lg border border-xelltekk-200 px-3 py-1 text-xs font-semibold text-xelltekk-700 transition hover:bg-xelltekk-50"
                  @click="openEditImprimanteModal(imprimante)"
                >
                  Modifier
                </button>
                <span v-else class="text-sm text-slate-400">-</span>
              </td>
            </tr>
            <tr v-if="!loading && imprimantes.length === 0">
              <td colspan="9" class="px-4 py-10 text-center text-sm text-slate-400">Aucune imprimante dans le parc leasing.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section v-if="activeTab === 'releves'" class="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div class="flex items-center justify-between border-b border-slate-100 p-4">
        <div>
          <h3 class="font-bold text-slate-900">Relevés compteur</h3>
          <p class="text-sm text-slate-500">Pages consommées et dépassements de forfait.</p>
        </div>
        <button class="btn-primary" @click="openReleveModal">+ Relevé</button>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full min-w-[1220px]">
          <thead class="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th class="px-4 py-3 text-left">Période</th>
              <th class="px-4 py-3 text-left">Date</th>
              <th class="px-4 py-3 text-left">Contrat</th>
              <th class="px-4 py-3 text-left">Client</th>
              <th class="px-4 py-3 text-right">Noir</th>
              <th class="px-4 py-3 text-right">Couleur</th>
              <th class="px-4 py-3 text-right">Supplément HT</th>
              <th class="px-4 py-3 text-right">Facture</th>
              <th class="px-4 py-3 text-right">Fichier</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="releve in releves" :key="releve.id">
              <td class="px-4 py-3 font-mono text-sm text-slate-600">{{ releve.periode || '-' }}</td>
              <td class="px-4 py-3 text-sm text-slate-600">{{ dateLabel(releve.date_releve) }}</td>
              <td class="px-4 py-3 font-mono text-sm text-slate-600">{{ releve.contrat?.numero }}</td>
              <td class="px-4 py-3 text-sm text-slate-800">{{ releve.contrat?.client?.nom || '-' }}</td>
              <td class="px-4 py-3 text-right text-sm">{{ releve.ancien_compteur_noir }} → <strong>{{ releve.compteur_noir }}</strong> <span class="text-slate-400">({{ releve.copies_noir }} pages)</span></td>
              <td class="px-4 py-3 text-right text-sm">{{ releve.ancien_compteur_couleur ?? '-' }} → <strong>{{ releve.compteur_couleur ?? '-' }}</strong> <span v-if="releve.copies_couleur" class="text-slate-400">({{ releve.copies_couleur }} pages)</span></td>
              <td class="px-4 py-3 text-right font-semibold text-slate-900">{{ money(releve.montant_supp_ht) }}</td>
              <td class="px-4 py-3 text-right text-sm">
                <div v-if="releve.facture" class="flex flex-col items-end gap-1">
                  <router-link :to="{ path: '/factures', query: { open: releve.facture.id } }" class="font-mono font-semibold text-emerald-700 hover:text-emerald-900 hover:underline">
                    {{ releve.facture.numero }}
                  </router-link>
                  <span class="text-xs text-slate-400">{{ money(releve.facture.total_ttc) }}</span>
                </div>
                <button
                  v-else-if="canGenerateFactures"
                  type="button"
                  class="rounded-lg border border-xelltekk-200 px-3 py-1.5 text-xs font-semibold text-xelltekk-700 transition hover:bg-xelltekk-50 disabled:cursor-wait disabled:opacity-60"
                  :disabled="factureLoadingId === releve.id"
                  @click="facturerReleve(releve)"
                >
                  {{ factureLoadingId === releve.id ? 'Génération...' : 'Générer facture' }}
                </button>
                <span v-else class="text-slate-400">-</span>
              </td>
              <td class="px-4 py-3 text-right text-sm">
                <a v-if="releve.fichier_releve_path" :href="`/${releve.fichier_releve_path}`" target="_blank" class="font-semibold text-xelltekk-700 hover:text-xelltekk-900">Ouvrir</a>
                <span v-else class="text-slate-400">-</span>
              </td>
            </tr>
            <tr v-if="!loading && releves.length === 0">
              <td colspan="9" class="px-4 py-10 text-center text-sm text-slate-400">Aucun relevé compteur.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section v-if="activeTab === 'interventions'" class="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div class="flex items-center justify-between border-b border-slate-100 p-4">
        <div>
          <h3 class="font-bold text-slate-900">Interventions</h3>
          <p class="text-sm text-slate-500">Installations, maintenances, dépannages et retraits.</p>
        </div>
        <button class="btn-primary" @click="openInterventionModal">+ Intervention</button>
      </div>
      <div class="divide-y divide-slate-100">
        <article v-for="item in interventions" :key="item.id" class="grid gap-3 p-4 lg:grid-cols-[140px_1fr_180px_140px] lg:items-center">
          <div>
            <div class="font-mono text-xs text-slate-500">{{ item.reference }}</div>
            <div class="text-sm font-semibold text-slate-900">{{ dateLabel(item.date_intervention) }}</div>
          </div>
          <div>
            <h4 class="font-semibold text-slate-900">{{ typeInterventionLabel(item.type) }} · {{ item.imprimante?.designation || 'Imprimante' }}</h4>
            <p class="text-sm text-slate-500">{{ item.client?.nom || '-' }} · {{ item.description || 'Aucune description' }}</p>
          </div>
          <div class="text-sm text-slate-600">{{ item.technicien || 'Technicien non défini' }}</div>
          <div class="text-right"><span class="badge" :class="statutInterventionClass(item.statut)">{{ statutLabel(item.statut) }}</span></div>
        </article>
        <div v-if="!loading && interventions.length === 0" class="p-10 text-center text-sm text-slate-400">Aucune intervention.</div>
      </div>
    </section>

    <AppModal v-model="showImprimanteModal" :title="editingImprimante ? 'Modifier l’imprimante leasing' : 'Nouvelle imprimante leasing'" size="lg">
      <form class="space-y-4" @submit.prevent="saveImprimante">
        <div class="grid gap-4 md:grid-cols-2">
          <label class="field-label md:col-span-2">Produit lié (optionnel)
            <select v-model.number="imprimanteForm.produit_id" class="input" @change="syncProduit">
              <option value="">Aucun produit lié</option>
              <option v-for="produit in referentiels.produits" :key="produit.id" :value="produit.id">{{ produit.reference }} - {{ produit.libelle }}</option>
            </select>
          </label>
          <label v-if="editingImprimante" class="field-label md:col-span-2">Référence <input v-model="imprimanteForm.reference" class="input" /></label>
          <label class="field-label md:col-span-2">Désignation <input v-model="imprimanteForm.designation" class="input" required /></label>
          <label class="field-label">Marque <input v-model="imprimanteForm.marque" class="input" /></label>
          <label class="field-label">Modèle <input v-model="imprimanteForm.modele" class="input" /></label>
          <label class="field-label">N° série <input v-model="imprimanteForm.numero_serie" class="input" /></label>
          <label class="field-label">Emplacement <input v-model="imprimanteForm.localisation" class="input" placeholder="Ex: Locaux du client, bureau..." /></label>
          <label class="field-label">Type
            <select v-model="imprimanteForm.type_impression" class="input">
              <option value="multifonction">Multifonction</option>
              <option value="noir_blanc">Noir & blanc</option>
              <option value="couleur">Couleur</option>
            </select>
          </label>
          <label v-if="editingImprimante" class="field-label">Statut
            <select v-model="imprimanteForm.statut" class="input">
              <option value="disponible">Disponible</option>
              <option value="louee">Louée</option>
              <option value="maintenance">Maintenance</option>
              <option value="retiree">Retirée</option>
            </select>
          </label>
          <label class="field-label">Compteur noir initial <input v-model.number="imprimanteForm.compteur_initial_noir" type="number" min="0" class="input" /></label>
          <label class="field-label">Compteur couleur initial <input v-model.number="imprimanteForm.compteur_initial_couleur" type="number" min="0" class="input" /></label>
          <label v-if="editingImprimante" class="field-label">Compteur noir actuel <input v-model.number="imprimanteForm.compteur_actuel_noir" type="number" min="0" class="input" /></label>
          <label v-if="editingImprimante" class="field-label">Compteur couleur actuel <input v-model.number="imprimanteForm.compteur_actuel_couleur" type="number" min="0" class="input" /></label>
          <label class="field-label md:col-span-2">Notes <textarea v-model="imprimanteForm.notes" class="input min-h-24"></textarea></label>
        </div>
        <div class="flex justify-end gap-2 border-t pt-4">
          <button type="button" class="btn-secondary" @click="showImprimanteModal = false">Annuler</button>
          <button class="btn-primary" :disabled="saving">{{ saving ? 'Enregistrement...' : (editingImprimante ? 'Mettre à jour' : 'Enregistrer') }}</button>
        </div>
      </form>
    </AppModal>

    <AppModal v-model="showContratModal" title="Nouveau contrat de leasing" size="lg">
      <form class="space-y-4" @submit.prevent="saveContrat">
        <div class="grid gap-4 md:grid-cols-2">
          <label class="field-label">Client
            <select v-model.number="contratForm.client_id" class="input" required>
              <option value="">Choisir un client</option>
              <option v-for="client in referentiels.clients" :key="client.id" :value="client.id">{{ client.code }} - {{ client.nom }}</option>
            </select>
          </label>
          <label class="field-label">Imprimante
            <select v-model.number="contratForm.imprimante_id" class="input" required>
              <option value="">Choisir une imprimante</option>
              <option v-for="imprimante in referentiels.imprimantes_disponibles" :key="imprimante.id" :value="imprimante.id">{{ imprimante.reference }} - {{ imprimante.designation }}</option>
            </select>
          </label>
          <label class="field-label">Date début <input v-model="contratForm.date_debut" type="date" class="input" required /></label>
          <label class="field-label">Date fin <input v-model="contratForm.date_fin" type="date" class="input" /></label>
          <label class="field-label">Périodicité
            <select v-model="contratForm.periodicite_facturation" class="input">
              <option value="mensuelle">Mensuelle</option>
              <option value="trimestrielle">Trimestrielle</option>
              <option value="semestrielle">Semestrielle</option>
              <option value="annuelle">Annuelle</option>
            </select>
          </label>
          <label class="field-label">Loyer mensuel HT <input v-model.number="contratForm.loyer_mensuel_ht" type="number" min="0" step="1" class="input" required /></label>
          <label class="field-label">TVA % <input v-model.number="contratForm.taux_tva" type="number" min="0" max="100" step="0.01" class="input" /></label>
          <label class="field-label">Forfait pages noir <input v-model.number="contratForm.forfait_pages_noir" type="number" min="0" class="input" /></label>
          <label class="field-label">Prix page noir HT <input v-model.number="contratForm.prix_page_noir_ht" type="number" min="0" step="0.01" class="input" /></label>
          <label class="field-label">Forfait pages couleur <input v-model.number="contratForm.forfait_pages_couleur" type="number" min="0" class="input" /></label>
          <label class="field-label">Prix page couleur HT <input v-model.number="contratForm.prix_page_couleur_ht" type="number" min="0" step="0.01" class="input" /></label>
          <label class="field-label">Frais de pose / dépôt HT <input v-model.number="contratForm.depot_garantie" type="number" min="0" step="1" class="input" /></label>
          <label class="field-label md:col-span-2">Conditions particulières <textarea v-model="contratForm.conditions" class="input min-h-24"></textarea></label>
        </div>
        <div class="flex justify-end gap-2 border-t pt-4">
          <button type="button" class="btn-secondary" @click="showContratModal = false">Annuler</button>
          <button class="btn-primary" :disabled="saving">{{ saving ? 'Enregistrement...' : 'Enregistrer le contrat' }}</button>
        </div>
      </form>
    </AppModal>

    <AppModal v-model="showReleveModal" title="Nouveau relevé compteur" size="md">
      <form class="space-y-4" @submit.prevent="saveReleve">
        <label class="field-label">Contrat
          <select v-model.number="releveForm.contrat_id" class="input" required>
            <option value="">Choisir un contrat</option>
            <option v-for="contrat in contratsReleves" :key="contrat.id" :value="contrat.id">{{ contrat.numero }} - {{ contrat.client?.nom }} - {{ contrat.imprimante?.designation }}</option>
          </select>
        </label>
        <div class="grid gap-4 md:grid-cols-3">
          <label class="field-label">Mois du relevé <input v-model="releveForm.periode" type="month" class="input" required /></label>
          <label class="field-label md:col-span-2">Justificatif du relevé (optionnel)
            <input type="file" accept=".pdf,.jpg,.jpeg,.png" class="input" @change="onReleveFileChange" />
            <span class="mt-1 block text-xs text-slate-500">Le fichier est seulement archivé avec le relevé. La saisie des compteurs se fait manuellement.</span>
          </label>
        </div>
        <div class="rounded-2xl border border-blue-100 bg-blue-50 p-4">
          <div class="mb-3">
            <strong class="text-slate-900">Comptage manuel</strong>
            <p class="text-xs text-slate-600">L’ancien comptage est prérempli depuis le dernier relevé ou le compteur initial. Tu peux le modifier si nécessaire.</p>
          </div>
          <div class="grid gap-4 md:grid-cols-2">
            <label class="field-label">Ancien comptage noir
              <input v-model.number="releveForm.ancien_compteur_noir" type="number" min="0" class="input" placeholder="Ancien compteur noir" />
            </label>
            <label class="field-label">Nouveau comptage noir
              <input v-model.number="releveForm.compteur_noir" type="number" min="0" class="input" required placeholder="Nouveau compteur noir" />
            </label>
            <label class="field-label">Ancien comptage couleur
              <input v-model.number="releveForm.ancien_compteur_couleur" type="number" min="0" class="input" placeholder="Ancien compteur couleur" />
            </label>
            <label class="field-label">Nouveau comptage couleur
              <input v-model.number="releveForm.compteur_couleur" type="number" min="0" class="input" placeholder="Nouveau compteur couleur" />
            </label>
          </div>
        </div>
        <div class="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <span>{{ previewLoading ? 'Calcul en cours...' : 'Le calcul se met à jour automatiquement pendant la saisie.' }}</span>
          <button type="button" class="btn-secondary" :disabled="previewLoading" @click="previewReleve(false)">
            {{ previewLoading ? 'Calcul...' : 'Recalculer maintenant' }}
          </button>
        </div>
        <div v-if="relevePreview" class="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-950">
          <div class="grid gap-3 lg:grid-cols-3">
            <div>
              <span class="caption">Comptage saisi</span>
              <strong class="block">Noir : {{ relevePreview.ancien_compteur_noir ?? 0 }} → {{ relevePreview.compteur_noir ?? '-' }}</strong>
              <p>Couleur : {{ relevePreview.ancien_compteur_couleur ?? '-' }} → {{ relevePreview.compteur_couleur ?? '-' }}</p>
            </div>
            <div>
              <span class="caption">Différence calculée</span>
              <strong class="block">{{ relevePreview.copies_noir || 0 }} pages noir · {{ relevePreview.copies_couleur || 0 }} pages couleur</strong>
              <p>Supplément : <strong>{{ money(relevePreview.montant_supp_ht) }}</strong></p>
            </div>
            <div class="rounded-xl bg-white/70 p-3">
              <span class="caption">Total facturable estimatif</span>
              <div class="mt-1 space-y-1">
                <p class="flex justify-between"><span>Loyer période HT</span><strong>{{ money(relevePreview.loyer_periode_ht) }}</strong></p>
                <p class="flex justify-between"><span>Total HT</span><strong>{{ money(relevePreview.total_ht) }}</strong></p>
                <p class="flex justify-between"><span>TVA</span><strong>{{ money(relevePreview.total_tva) }}</strong></p>
                <p class="flex justify-between border-t border-blue-100 pt-1 text-base"><span>Total TTC</span><strong class="text-xelltekk-700">{{ money(relevePreview.total_ttc) }}</strong></p>
              </div>
            </div>
          </div>
        </div>
        <label class="field-label">Notes <textarea v-model="releveForm.notes" class="input min-h-20"></textarea></label>
        <div class="flex justify-end gap-2 border-t pt-4">
          <button type="button" class="btn-secondary" @click="showReleveModal = false">Annuler</button>
          <button class="btn-primary" :disabled="saving">{{ saving ? 'Enregistrement...' : 'Enregistrer le relevé' }}</button>
        </div>
      </form>
    </AppModal>

    <AppModal v-model="showInterventionModal" title="Nouvelle intervention" size="lg">
      <form class="space-y-4" @submit.prevent="saveIntervention">
        <div class="grid gap-4 md:grid-cols-2">
          <label class="field-label">Contrat lié
            <select v-model.number="interventionForm.contrat_id" class="input">
              <option value="">Sans contrat</option>
              <option v-for="contrat in contrats" :key="contrat.id" :value="contrat.id">{{ contrat.numero }} - {{ contrat.client?.nom }}</option>
            </select>
          </label>
          <label class="field-label">Imprimante
            <select v-model.number="interventionForm.imprimante_id" class="input" :required="!interventionForm.contrat_id">
              <option value="">Choisir</option>
              <option v-for="imprimante in imprimantes" :key="imprimante.id" :value="imprimante.id">{{ imprimante.reference }} - {{ imprimante.designation }}</option>
            </select>
          </label>
          <label class="field-label">Date <input v-model="interventionForm.date_intervention" type="date" class="input" required /></label>
          <label class="field-label">Technicien <input v-model="interventionForm.technicien" class="input" /></label>
          <label class="field-label">Type
            <select v-model="interventionForm.type" class="input">
              <option value="installation">Installation</option>
              <option value="maintenance">Maintenance</option>
              <option value="depannage">Dépannage</option>
              <option value="retrait">Retrait</option>
              <option value="releve">Relevé</option>
              <option value="autre">Autre</option>
            </select>
          </label>
          <label class="field-label">Statut
            <select v-model="interventionForm.statut" class="input">
              <option value="planifiee">Planifiée</option>
              <option value="en_cours">En cours</option>
              <option value="terminee">Terminée</option>
              <option value="annulee">Annulée</option>
            </select>
          </label>
          <label class="field-label md:col-span-2">Description <textarea v-model="interventionForm.description" class="input min-h-24"></textarea></label>
        </div>
        <div class="flex justify-end gap-2 border-t pt-4">
          <button type="button" class="btn-secondary" @click="showInterventionModal = false">Annuler</button>
          <button class="btn-primary" :disabled="saving">{{ saving ? 'Enregistrement...' : 'Enregistrer' }}</button>
        </div>
      </form>
    </AppModal>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import api from '@/services/api'
import { ouvrirPDF } from '@/services/pdf'
import AppModal from '@/components/AppModal.vue'
import { useToast } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth'

const toast = useToast()
const auth = useAuthStore()
const activeTab = ref('contrats')
const loading = ref(false)
const saving = ref(false)
const previewLoading = ref(false)
const moduleWarning = ref('')
const relevePreview = ref(null)
const factureLoadingId = ref(null)

const tabs = [
  { key: 'contrats', label: 'Contrats' },
  { key: 'imprimantes', label: 'Parc imprimantes' },
  { key: 'releves', label: 'Relevés compteur' },
  { key: 'interventions', label: 'Interventions' },
]

const stats = reactive({})
const referentiels = reactive({
  clients: [],
  produits: [],
  imprimantes_disponibles: [],
  statuts_imprimantes: [],
  statuts_contrats: [],
})

const contrats = ref([])
const imprimantes = ref([])
const releves = ref([])
const interventions = ref([])
const editingImprimante = ref(null)
const canManageImprimantes = computed(() => auth.user?.role === 'admin')
const canGenerateFactures = computed(() => ['admin', 'gerant', 'commercial', 'comptable'].includes(auth.user?.role))

const filters = reactive({
  contrats: { search: '', statut: '' },
  imprimantes: { search: '', statut: '' },
})

const showImprimanteModal = ref(false)
const showContratModal = ref(false)
const showReleveModal = ref(false)
const showInterventionModal = ref(false)

const imprimanteForm = reactive(defaultImprimanteForm())
const contratForm = reactive(defaultContratForm())
const releveForm = reactive(defaultReleveForm())
const interventionForm = reactive(defaultInterventionForm())

const contratsReleves = computed(() => contrats.value.filter(item => ['brouillon', 'actif', 'suspendu'].includes(item.statut)))
let relevePreviewTimer = null

watch(
  () => [
    showReleveModal.value,
    releveForm.contrat_id,
    releveForm.periode,
    releveForm.ancien_compteur_noir,
    releveForm.compteur_noir,
    releveForm.ancien_compteur_couleur,
    releveForm.compteur_couleur,
  ],
  () => scheduleRelevePreview()
)

watch(showImprimanteModal, (isOpen) => {
  if (!isOpen) editingImprimante.value = null
})

watch(
  () => [releveForm.contrat_id, releveForm.periode],
  ([contratId, periode], [oldContratId, oldPeriode] = []) => {
    if (!showReleveModal.value || oldContratId === undefined) return
    if (contratId !== oldContratId || periode !== oldPeriode) {
      releveForm.ancien_compteur_noir = ''
      releveForm.ancien_compteur_couleur = ''
      releveForm.compteur_noir = ''
      releveForm.compteur_couleur = ''
      relevePreview.value = null
    }
  }
)

onMounted(init)

async function init() {
  await Promise.allSettled([
    loadReferentiels(),
    loadStats(),
    loadContrats(),
    loadImprimantes(),
    loadReleves(),
    loadInterventions(),
  ])
}

async function loadReferentiels() {
  try {
    const { data } = await api.get('/leasing/referentiels')
    Object.assign(referentiels, {
      clients: data.clients || [],
      produits: data.produits || [],
      imprimantes_disponibles: data.imprimantes_disponibles || [],
      statuts_imprimantes: data.statuts_imprimantes || [],
      statuts_contrats: data.statuts_contrats || [],
    })
  } catch (error) {
    handleApiError(error, 'Impossible de charger les référentiels leasing.')
  }
}

async function loadStats() {
  try {
    Object.assign(stats, (await api.get('/leasing/stats')).data)
  } catch (error) {
    handleApiError(error, 'Impossible de charger les statistiques leasing.')
  }
}

async function loadContrats() {
  loading.value = true
  try {
    const { data } = await api.get('/leasing/contrats', { params: { per_page: 50, ...filters.contrats } })
    contrats.value = data.data || []
  } catch (error) {
    handleApiError(error, 'Impossible de charger les contrats.')
  } finally {
    loading.value = false
  }
}

async function loadImprimantes() {
  try {
    const { data } = await api.get('/leasing/imprimantes', { params: { per_page: 100, ...filters.imprimantes } })
    imprimantes.value = data.data || []
  } catch (error) {
    handleApiError(error, 'Impossible de charger les imprimantes.')
  }
}

async function loadReleves() {
  try {
    const { data } = await api.get('/leasing/releves', { params: { per_page: 50 } })
    releves.value = data.data || []
  } catch (error) {
    handleApiError(error, 'Impossible de charger les relevés.')
  }
}

async function loadInterventions() {
  try {
    const { data } = await api.get('/leasing/interventions', { params: { per_page: 50 } })
    interventions.value = data.data || []
  } catch (error) {
    handleApiError(error, 'Impossible de charger les interventions.')
  }
}

function openImprimanteModal() {
  editingImprimante.value = null
  Object.assign(imprimanteForm, defaultImprimanteForm())
  showImprimanteModal.value = true
}

function openEditImprimanteModal(imprimante) {
  editingImprimante.value = imprimante
  Object.assign(imprimanteForm, imprimanteToForm(imprimante))
  showImprimanteModal.value = true
}

function openContratModal() {
  Object.assign(contratForm, defaultContratForm())
  showContratModal.value = true
}

function openReleveModal(contrat = null) {
  Object.assign(releveForm, defaultReleveForm())
  relevePreview.value = null
  if (contrat?.id) releveForm.contrat_id = contrat.id
  showReleveModal.value = true
}

function openInterventionModal() {
  Object.assign(interventionForm, defaultInterventionForm())
  showInterventionModal.value = true
}

function syncProduit() {
  const produit = referentiels.produits.find(item => Number(item.id) === Number(imprimanteForm.produit_id))
  if (!produit) return
  imprimanteForm.designation = produit.libelle || imprimanteForm.designation
  imprimanteForm.marque = produit.marque || imprimanteForm.marque
  imprimanteForm.modele = produit.modele || imprimanteForm.modele
  imprimanteForm.valeur_acquisition_ht = Number(produit.prix_achat_ht || 0)
}

async function saveImprimante() {
  saving.value = true
  try {
    const payload = normalizePayload(imprimanteForm)
    if (editingImprimante.value?.id) {
      await api.put(`/leasing/imprimantes/${editingImprimante.value.id}`, payload)
      toast.success('Imprimante mise à jour.')
    } else {
      await api.post('/leasing/imprimantes', payload)
      toast.success('Imprimante ajoutée au parc leasing.')
    }
    showImprimanteModal.value = false
    editingImprimante.value = null
    await refreshAll()
  } catch (error) {
    handleApiError(error, editingImprimante.value ? 'Modification de l’imprimante impossible.' : 'Enregistrement de l’imprimante impossible.')
  } finally {
    saving.value = false
  }
}

async function saveContrat() {
  saving.value = true
  try {
    await api.post('/leasing/contrats', normalizePayload(contratForm))
    toast.success('Contrat de leasing créé.')
    showContratModal.value = false
    await refreshAll()
  } catch (error) {
    handleApiError(error, 'Enregistrement du contrat impossible.')
  } finally {
    saving.value = false
  }
}

function scheduleRelevePreview() {
  if (relevePreviewTimer) clearTimeout(relevePreviewTimer)
  if (!showReleveModal.value || !releveForm.contrat_id || !releveForm.periode) {
    relevePreview.value = null
    return
  }
  relevePreviewTimer = setTimeout(() => previewReleve(true), 450)
}

async function previewReleve(silent = false) {
  if (!releveForm.contrat_id || !releveForm.periode) return
  previewLoading.value = true
  try {
    const { data } = await api.post('/leasing/releves/previsualiser', normalizePayload({
      contrat_id: releveForm.contrat_id,
      periode: releveForm.periode,
      ancien_compteur_noir: releveForm.ancien_compteur_noir,
      compteur_noir: releveForm.compteur_noir,
      ancien_compteur_couleur: releveForm.ancien_compteur_couleur,
      compteur_couleur: releveForm.compteur_couleur,
    }))
    relevePreview.value = data
    hydrateAncienCompteurs(data)
  } catch (error) {
    if (!silent) handleApiError(error, 'Calcul du relevé impossible.')
  } finally {
    previewLoading.value = false
  }
}

function hydrateAncienCompteurs(data) {
  if (!data) return
  if (isEmptyCounter(releveForm.ancien_compteur_noir)) {
    releveForm.ancien_compteur_noir = data.ancien_compteur_noir ?? 0
  }
  if (isEmptyCounter(releveForm.ancien_compteur_couleur) && data.ancien_compteur_couleur !== null && data.ancien_compteur_couleur !== undefined) {
    releveForm.ancien_compteur_couleur = data.ancien_compteur_couleur
  }
}

function isEmptyCounter(value) {
  return value === '' || value === null || value === undefined
}

async function saveReleve() {
  saving.value = true
  try {
    const payload = new FormData()
    for (const [key, value] of Object.entries(releveForm)) {
      if (value !== '' && value !== null && value !== undefined) payload.append(key, value)
    }
    await api.post('/leasing/releves', payload, { headers: { 'Content-Type': 'multipart/form-data' } })
    toast.success('Relevé compteur enregistré.')
    showReleveModal.value = false
    await refreshAll()
  } catch (error) {
    handleApiError(error, 'Enregistrement du relevé impossible.')
  } finally {
    saving.value = false
  }
}

async function saveIntervention() {
  saving.value = true
  try {
    await api.post('/leasing/interventions', normalizePayload(interventionForm))
    toast.success('Intervention enregistrée.')
    showInterventionModal.value = false
    await refreshAll()
  } catch (error) {
    handleApiError(error, 'Enregistrement de l’intervention impossible.')
  } finally {
    saving.value = false
  }
}

async function activerContrat(contrat) {
  if (!window.confirm(`Activer le contrat ${contrat.numero} ?`)) return
  try {
    await api.post(`/leasing/contrats/${contrat.id}/activer`)
    toast.success('Contrat activé.')
    await refreshAll()
  } catch (error) {
    handleApiError(error, 'Activation impossible.')
  }
}

async function cloturerContrat(contrat) {
  if (!window.confirm(`Clôturer le contrat ${contrat.numero} ?`)) return
  try {
    await api.post(`/leasing/contrats/${contrat.id}/cloturer`, { statut: 'termine', date_fin: today() })
    toast.success('Contrat clôturé.')
    await refreshAll()
  } catch (error) {
    handleApiError(error, 'Clôture impossible.')
  }
}

async function facturerReleve(releve) {
  if (!releve?.id) return
  const contrat = releve.contrat?.numero || 'ce contrat'
  const periode = releve.periode || dateLabel(releve.date_releve)
  if (!window.confirm(`Générer une facture brouillon pour le relevé ${periode} du contrat ${contrat} ?\nSupplément HT affiché : ${money(releve.montant_supp_ht)}.`)) return

  factureLoadingId.value = releve.id
  try {
    const { data } = await api.post(`/leasing/releves/${releve.id}/facture`)
    toast.success(data.message || `Facture ${data.facture?.numero || ''} générée.`)
    await Promise.all([loadReleves(), loadContrats(), loadStats()])
  } catch (error) {
    handleApiError(error, 'Génération de la facture impossible.')
  } finally {
    factureLoadingId.value = null
  }
}

async function downloadContratPdf(contrat) {
  try {
    await ouvrirPDF(`/leasing/contrats/${contrat.id}/pdf`, `${contrat.numero}.pdf`)
  } catch (error) {
    toast.error('Impossible de générer le contrat PDF.')
  }
}

async function refreshAll() {
  await Promise.all([loadReferentiels(), loadStats(), loadContrats(), loadImprimantes(), loadReleves(), loadInterventions()])
}

function normalizePayload(source) {
  return Object.fromEntries(Object.entries(source).map(([key, value]) => [key, value === '' ? null : value]))
}

function defaultImprimanteForm() {
  return {
    reference: '',
    produit_id: '',
    designation: '',
    marque: '',
    modele: '',
    numero_serie: '',
    localisation: '',
    type_impression: 'multifonction',
    statut: 'disponible',
    date_acquisition: '',
    compteur_initial_noir: 0,
    compteur_initial_couleur: '',
    compteur_actuel_noir: '',
    compteur_actuel_couleur: '',
    valeur_acquisition_ht: 0,
    notes: '',
  }
}

function imprimanteToForm(imprimante) {
  return {
    ...defaultImprimanteForm(),
    reference: imprimante.reference || '',
    produit_id: imprimante.produit_id || '',
    designation: imprimante.designation || '',
    marque: imprimante.marque || '',
    modele: imprimante.modele || '',
    numero_serie: imprimante.numero_serie || '',
    localisation: imprimante.localisation || '',
    type_impression: imprimante.type_impression || 'multifonction',
    statut: imprimante.statut || 'disponible',
    date_acquisition: imprimante.date_acquisition ? String(imprimante.date_acquisition).slice(0, 10) : '',
    compteur_initial_noir: imprimante.compteur_initial_noir ?? 0,
    compteur_initial_couleur: imprimante.compteur_initial_couleur ?? '',
    compteur_actuel_noir: imprimante.compteur_actuel_noir ?? 0,
    compteur_actuel_couleur: imprimante.compteur_actuel_couleur ?? '',
    valeur_acquisition_ht: Number(imprimante.valeur_acquisition_ht || 0),
    notes: imprimante.notes || '',
  }
}

function defaultContratForm() {
  return {
    client_id: '',
    imprimante_id: '',
    date_debut: today(),
    date_fin: '',
    periodicite_facturation: 'mensuelle',
    statut: 'brouillon',
    loyer_mensuel_ht: 0,
    taux_tva: 18,
    forfait_pages_noir: 0,
    prix_page_noir_ht: 0,
    forfait_pages_couleur: 0,
    prix_page_couleur_ht: 0,
    depot_garantie: 0,
    conditions: '',
    notes: '',
  }
}

function defaultReleveForm() {
  return {
    contrat_id: '',
    periode: today().slice(0, 7),
    ancien_compteur_noir: '',
    compteur_noir: '',
    ancien_compteur_couleur: '',
    compteur_couleur: '',
    fichier_releve: null,
    notes: '',
  }
}

function defaultInterventionForm() {
  return {
    contrat_id: '',
    imprimante_id: '',
    type: 'maintenance',
    statut: 'planifiee',
    date_intervention: today(),
    technicien: '',
    description: '',
    notes: '',
  }
}

function onReleveFileChange(event) {
  releveForm.fichier_releve = event.target.files?.[0] || null
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

function money(value) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(Number(value || 0))
}

function dateLabel(value) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('fr-FR')
}

function statutLabel(value) {
  return {
    brouillon: 'Brouillon',
    actif: 'Actif',
    suspendu: 'Suspendu',
    termine: 'Terminé',
    resilie: 'Résilié',
    disponible: 'Disponible',
    louee: 'Louée',
    maintenance: 'Maintenance',
    retiree: 'Retirée',
    planifiee: 'Planifiée',
    en_cours: 'En cours',
    terminee: 'Terminée',
    annulee: 'Annulée',
  }[value] || value || '-'
}

function typeImpressionLabel(value) {
  return { noir_blanc: 'Noir & blanc', couleur: 'Couleur', multifonction: 'Multifonction' }[value] || value || '-'
}

function typeInterventionLabel(value) {
  return { installation: 'Installation', maintenance: 'Maintenance', depannage: 'Dépannage', retrait: 'Retrait', releve: 'Relevé', autre: 'Autre' }[value] || value || '-'
}

function statutContratClass(value) {
  return {
    brouillon: 'bg-slate-100 text-slate-700',
    actif: 'bg-emerald-100 text-emerald-800',
    suspendu: 'bg-orange-100 text-orange-800',
    termine: 'bg-blue-100 text-blue-800',
    resilie: 'bg-red-100 text-red-800',
  }[value] || 'bg-slate-100 text-slate-700'
}

function statutImprimanteClass(value) {
  return {
    disponible: 'bg-emerald-100 text-emerald-800',
    louee: 'bg-blue-100 text-blue-800',
    maintenance: 'bg-orange-100 text-orange-800',
    retiree: 'bg-slate-200 text-slate-700',
  }[value] || 'bg-slate-100 text-slate-700'
}

function statutInterventionClass(value) {
  return {
    planifiee: 'bg-blue-100 text-blue-800',
    en_cours: 'bg-orange-100 text-orange-800',
    terminee: 'bg-emerald-100 text-emerald-800',
    annulee: 'bg-slate-100 text-slate-700',
  }[value] || 'bg-slate-100 text-slate-700'
}

function handleApiError(error, fallback) {
  const status = error?.response?.status
  const message = Object.values(error?.response?.data?.errors || {})[0]?.[0] || error?.response?.data?.message || fallback
  if (status === 503) moduleWarning.value = message
  toast.error(message)
}
</script>
