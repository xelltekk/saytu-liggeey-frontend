<template>
  <div class="space-y-4">
    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <button type="button" @click="setFactureFilter('')" class="stat-card" :class="activeFactureStatut === '' ? activeCardClass : ''">
        <span class="stat-label">Factures fournisseurs</span>
        <strong class="stat-value text-slate-900">{{ stats.total_factures || 0 }}</strong>
      </button>
      <button type="button" @click="setFactureFilter('impayees')" class="stat-card" :class="activeFactureStatut === 'impayees' ? activeCardClass : ''">
        <span class="stat-label">Impayées</span>
        <strong class="stat-value text-orange-600">{{ stats.impayees || 0 }}</strong>
      </button>
      <button type="button" @click="setFactureFilter('retard')" class="stat-card" :class="activeFactureStatut === 'retard' ? activeCardClass : ''">
        <span class="stat-label">En retard</span>
        <strong class="stat-value text-red-600">{{ stats.en_retard || 0 }}</strong>
      </button>
      <div class="stat-card">
        <span class="stat-label">Dette fournisseurs</span>
        <strong class="stat-value text-blue-700">{{ formatPrice(stats.dette_total) }}</strong>
      </div>
      <div class="stat-card">
        <span class="stat-label">Réglé ce mois</span>
        <strong class="stat-value text-emerald-700">{{ formatPrice(stats.reglements_mois) }}</strong>
      </div>
    </div>

    <div class="flex flex-col gap-3 border-b border-slate-200 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex gap-2">
        <button type="button" @click="activeTab = 'factures'" class="tab-button" :class="activeTab === 'factures' ? 'tab-active' : ''">
          Factures fournisseurs
        </button>
        <button type="button" @click="activeTab = 'reglements'" class="tab-button" :class="activeTab === 'reglements' ? 'tab-active' : ''">
          Règlements
        </button>
        <button type="button" @click="activeTab = 'pilotage'" class="tab-button" :class="activeTab === 'pilotage' ? 'tab-active' : ''">
          Pilotage dettes
        </button>
      </div>

      <div class="flex flex-wrap gap-2 pb-3">
        <button type="button" @click="exporterFacturesCSV" :disabled="exportLoading" class="btn-secondary">
          {{ exportLoading ? 'Export...' : 'Exporter factures' }}
        </button>
        <button type="button" @click="exporterReglementsCSV" :disabled="exportLoading" class="btn-secondary">
          {{ exportLoading ? 'Export...' : 'Exporter règlements' }}
        </button>
        <button type="button" @click="openFactureCreate" class="btn-primary">Nouvelle facture fournisseur</button>
        <button type="button" @click="openReglementCreate" class="btn-secondary">Nouveau règlement</button>
      </div>
    </div>

    <section v-show="activeTab === 'pilotage'" class="space-y-4">
      <div class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <article v-for="card in debtKpiCards" :key="card.label" class="debt-card">
          <span class="stat-label">{{ card.label }}</span>
          <strong class="stat-value" :class="card.color">{{ card.value }}</strong>
          <span class="text-xs text-slate-500">{{ card.hint }}</span>
        </article>
      </div>

      <div class="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <section class="debt-panel">
          <div class="debt-panel-header">
            <div>
              <h3>Échéancier fournisseurs</h3>
              <p>Factures à régler par priorité d’échéance.</p>
            </div>
            <button type="button" class="btn-secondary px-3 py-1.5 text-sm" @click="loadDebtDashboard" :disabled="debtDashboardLoading">
              {{ debtDashboardLoading ? 'Chargement...' : 'Actualiser' }}
            </button>
          </div>
          <div class="divide-y divide-slate-100">
            <div v-for="facture in debtDashboard.echeancier" :key="facture.id" class="debt-row">
              <div class="min-w-0">
                <button type="button" class="font-mono text-sm font-bold text-blue-700 hover:underline" @click="openReglementForFacture(facture)">
                  {{ facture.numero }}
                </button>
                <p class="truncate text-sm font-semibold text-slate-800">{{ facture.fournisseur?.nom || 'Fournisseur' }}</p>
                <p class="text-xs text-slate-500">Échéance {{ formatDate(facture.date_echeance) }} · {{ urgenceLabel(facture) }}</p>
              </div>
              <div class="flex flex-col items-end gap-2">
                <span class="font-mono text-sm font-black text-orange-700">{{ formatPrice(facture.reste_a_payer) }}</span>
                <button type="button" class="table-action" @click="openReglementForFacture(facture)">Payer</button>
              </div>
            </div>
            <p v-if="!debtDashboard.echeancier?.length" class="px-4 py-8 text-center text-sm text-slate-500">Aucune dette fournisseur à suivre.</p>
          </div>
        </section>

        <section class="debt-panel">
          <div class="debt-panel-header">
            <div>
              <h3>Balance âgée</h3>
              <p>Répartition du reste dû.</p>
            </div>
          </div>
          <div class="space-y-3 p-4">
            <div v-for="bucket in debtDashboard.aging" :key="bucket.key">
              <div class="mb-1 flex items-center justify-between text-sm">
                <span class="font-semibold text-slate-700">{{ bucket.label }}</span>
                <span class="font-mono font-bold text-slate-900">{{ formatPrice(bucket.amount) }}</span>
              </div>
              <div class="h-2 overflow-hidden rounded-full bg-slate-100">
                <div class="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400" :style="{ width: agingPercent(bucket.amount) + '%' }"></div>
              </div>
              <p class="mt-1 text-xs text-slate-500">{{ bucket.count }} facture(s)</p>
            </div>
          </div>
        </section>
      </div>

      <div class="grid gap-4 xl:grid-cols-2">
        <section class="debt-panel">
          <div class="debt-panel-header">
            <div>
              <h3>Fournisseurs les plus dus</h3>
              <p>Priorise les sorties de trésorerie.</p>
            </div>
          </div>
          <div class="divide-y divide-slate-100">
            <div v-for="supplier in debtDashboard.top_fournisseurs" :key="supplier.fournisseur_id" class="debt-row">
              <div>
                <button type="button" class="font-bold text-slate-900 hover:text-blue-700" @click="openSupplierSituation(supplier.fournisseur_id)">
                  {{ supplier.nom }}
                </button>
                <p class="text-xs text-slate-500">{{ supplier.factures_count }} facture(s) · retard {{ formatPrice(supplier.montant_retard) }}</p>
              </div>
              <div class="flex flex-col items-end gap-2">
                <span class="font-mono font-black text-blue-700">{{ formatPrice(supplier.reste_a_payer) }}</span>
                <button type="button" class="table-action" @click="openReglementForSupplier(supplier.fournisseur_id)">Régler</button>
              </div>
            </div>
            <p v-if="!debtDashboard.top_fournisseurs?.length" class="px-4 py-8 text-center text-sm text-slate-500">Aucun fournisseur débiteur.</p>
          </div>
        </section>

        <section class="debt-panel">
          <div class="debt-panel-header">
            <div>
              <h3>Paiements conseillés</h3>
              <p>Liste courte selon retard, échéance et montant.</p>
            </div>
          </div>
          <div class="divide-y divide-slate-100">
            <div v-for="facture in debtDashboard.suggestions" :key="facture.id" class="debt-row">
              <div>
                <div class="font-mono text-sm font-bold text-slate-800">{{ facture.numero }}</div>
                <p class="text-sm font-semibold text-slate-700">{{ facture.fournisseur?.nom || 'Fournisseur' }}</p>
                <p class="text-xs" :class="urgenceClass(facture)">{{ urgenceLabel(facture) }}</p>
              </div>
              <div class="flex flex-col items-end gap-2">
                <span class="font-mono font-black text-orange-700">{{ formatPrice(facture.reste_a_payer) }}</span>
                <button type="button" class="table-action" @click="openReglementForFacture(facture)">Préparer</button>
              </div>
            </div>
            <p v-if="!debtDashboard.suggestions?.length" class="px-4 py-8 text-center text-sm text-slate-500">Aucune suggestion de paiement.</p>
          </div>
        </section>
      </div>
    </section>

    <section v-show="activeTab === 'factures'" class="space-y-4">
      <div class="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <div class="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_220px_180px]">
          <input v-model="factureFilters.search" @input="onFactureSearch" type="search" class="input" placeholder="Rechercher numéro, fournisseur, référence..." />
          <select v-model="factureFilters.fournisseur_id" @change="loadFactures(1)" class="input">
            <option value="">Tous fournisseurs</option>
            <option v-for="fournisseur in fournisseurs" :key="fournisseur.id" :value="fournisseur.id">{{ fournisseur.nom }}</option>
          </select>
          <select v-model="factureFilters.statut" @change="onFactureStatutChange" class="input">
            <option value="">Tous statuts</option>
            <option value="brouillon">Brouillon</option>
            <option value="validee">Validée</option>
            <option value="partiellement_payee">Partiellement payée</option>
            <option value="payee">Payée</option>
            <option value="annulee">Annulée</option>
          </select>
        </div>
      </div>

      <div class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div class="overflow-x-auto">
          <table class="w-full min-w-[1080px]">
            <thead class="border-b border-slate-200 bg-slate-50">
              <tr>
                <th class="th">N°</th>
                <th class="th">Fournisseur</th>
                <th class="th">Référence</th>
                <th class="th">Commande</th>
                <th class="th">Objet</th>
                <th class="th text-center">Échéance</th>
                <th class="th text-right">Total</th>
                <th class="th text-right">Payé</th>
                <th class="th text-right">Reste</th>
                <th class="th text-center">Statut</th>
                <th class="th text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="facture in factures" :key="facture.id" class="hover:bg-slate-50">
                <td class="td font-mono text-slate-600">{{ facture.numero }}</td>
                <td class="td">
                  <div class="font-medium text-slate-900">{{ facture.fournisseur?.nom || 'Fournisseur' }}</div>
                  <div class="text-xs text-slate-500">{{ facture.fournisseur?.code || '–' }}</div>
                </td>
                <td class="td text-slate-600">{{ facture.reference_fournisseur || '-' }}</td>
                <td class="td">
                  <span v-if="facture.commande_achat" class="font-mono text-violet-700">{{ facture.commande_achat.numero }}</span>
                  <span v-else class="text-slate-400">-</span>
                </td>
                <td class="td text-slate-700">{{ facture.objet }}</td>
                <td class="td text-center text-slate-600">{{ formatDate(facture.date_echeance) }}</td>
                <td class="td text-right font-mono font-semibold">{{ formatPrice(facture.total_ttc) }}</td>
                <td class="td text-right font-mono text-emerald-700">{{ formatPrice(facture.montant_paye) }}</td>
                <td class="td text-right font-mono text-orange-700">{{ formatPrice(facture.reste_a_payer) }}</td>
                <td class="td text-center"><span class="badge" :class="statutBadge(facture.statut)">{{ statutLabel(facture.statut) }}</span></td>
                <td class="td">
                  <div class="flex justify-end gap-2">
                    <button v-if="Number(facture.reste_a_payer || 0) > 0" type="button" @click="openReglementForFacture(facture)" class="table-action">Payer</button>
                    <button type="button" @click="openSupplierSituation(facture.fournisseur_id || facture.fournisseur?.id)" class="table-action">Situation</button>
                    <button type="button" @click="openFactureEdit(facture)" class="table-action">Modifier</button>
                    <button type="button" @click="deleteFacture(facture)" class="table-danger">Supprimer</button>
                  </div>
                </td>
              </tr>
              <tr v-if="!factureLoading && factures.length === 0">
                <td colspan="11" class="px-4 py-10 text-center text-sm text-slate-500">Aucune facture fournisseur</td>
              </tr>
              <tr v-if="factureLoading">
                <td colspan="11" class="px-4 py-10 text-center text-sm text-slate-500">Chargement...</td>
              </tr>
            </tbody>
          </table>
        </div>
        <PaginationBar :meta="factureMeta" @page="loadFactures" />
      </div>
    </section>

    <section v-show="activeTab === 'reglements'" class="space-y-4">
      <div class="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <div class="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_220px_180px]">
          <input v-model="reglementFilters.search" @input="onReglementSearch" type="search" class="input" placeholder="Rechercher règlement, fournisseur, facture..." />
          <select v-model="reglementFilters.fournisseur_id" @change="loadReglements(1)" class="input">
            <option value="">Tous fournisseurs</option>
            <option v-for="fournisseur in fournisseurs" :key="fournisseur.id" :value="fournisseur.id">{{ fournisseur.nom }}</option>
          </select>
          <select v-model="reglementFilters.statut" @change="loadReglements(1)" class="input">
            <option value="">Tous statuts</option>
            <option value="valide">Validé</option>
            <option value="en_attente">En attente</option>
            <option value="rejete">Rejeté</option>
            <option value="annule">Annulé</option>
          </select>
        </div>
      </div>

      <div class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div class="overflow-x-auto">
          <table class="w-full min-w-[900px]">
            <thead class="border-b border-slate-200 bg-slate-50">
              <tr>
                <th class="th">Référence</th>
                <th class="th">Fournisseur</th>
                <th class="th text-center">Date</th>
                <th class="th text-right">Montant</th>
                <th class="th text-right">Affecté</th>
                <th class="th text-center">Mode</th>
                <th class="th">Factures</th>
                <th class="th text-center">Statut</th>
                <th class="th text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="reglement in reglements" :key="reglement.id" class="hover:bg-slate-50">
                <td class="td font-mono text-slate-600">{{ reglement.reference }}</td>
                <td class="td">
                  <div class="font-medium text-slate-900">{{ reglement.fournisseur?.nom || 'Fournisseur' }}</div>
                  <div class="text-xs text-slate-500">{{ reglement.fournisseur?.code || '–' }}</div>
                </td>
                <td class="td text-center text-slate-600">{{ formatDate(reglement.date_reglement) }}</td>
                <td class="td text-right font-mono font-semibold text-red-700">{{ formatPrice(reglement.montant) }}</td>
                <td class="td text-right font-mono text-blue-700">{{ formatPrice(reglement.montant_affecte) }}</td>
                <td class="td text-center"><span class="badge bg-slate-100 text-slate-700">{{ modeLabel(reglement.mode_paiement) }}</span></td>
                <td class="td text-xs text-slate-600">
                  <div v-if="reglement.factures.length" class="space-y-1">
                    <div v-for="facture in reglement.factures" :key="facture.id">
                      <span class="font-mono">{{ facture.numero }}</span>
                      <span class="text-slate-400">({{ formatPrice(facture.pivot.montant_affecte) }})</span>
                    </div>
                  </div>
                  <span v-else>-</span>
                </td>
                <td class="td text-center"><span class="badge" :class="reglementBadge(reglement.statut)">{{ reglementLabel(reglement.statut) }}</span></td>
                <td class="td text-right">
                  <button type="button" @click="deleteReglement(reglement)" class="table-danger">Supprimer</button>
                </td>
              </tr>
              <tr v-if="!reglementLoading && reglements.length === 0">
                <td colspan="9" class="px-4 py-10 text-center text-sm text-slate-500">Aucun règlement fournisseur</td>
              </tr>
              <tr v-if="reglementLoading">
                <td colspan="9" class="px-4 py-10 text-center text-sm text-slate-500">Chargement...</td>
              </tr>
            </tbody>
          </table>
        </div>
        <PaginationBar :meta="reglementMeta" @page="loadReglements" />
      </div>
    </section>

    <AppModal v-model="showFactureModal" :title="editingFacture ? 'Modifier facture fournisseur' : 'Nouvelle facture fournisseur'" size="lg">
      <form class="space-y-4" @submit.prevent="saveFacture">
        <div v-if="editingFacture?.commande_achat" class="rounded-lg border border-violet-200 bg-violet-50 p-3 text-sm text-violet-900">
          Facture générée depuis la commande <strong class="font-mono">{{ editingFacture.commande_achat.numero }}</strong>. Le fournisseur et les montants restent synchronisés avec cette commande.
        </div>
        <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label class="field-label">
            Fournisseur
            <select v-model="factureForm.fournisseur_id" required class="input mt-1" :disabled="!!editingFacture?.commande_achat">
              <option value="">Sélectionner</option>
              <option v-for="fournisseur in fournisseurs" :key="fournisseur.id" :value="fournisseur.id">{{ fournisseur.nom }}</option>
            </select>
          </label>
          <label class="field-label">
            Référence fournisseur
            <input v-model="factureForm.reference_fournisseur" type="text" class="input mt-1" placeholder="N° facture reçue" />
          </label>
          <label class="field-label">
            Date facture
            <input v-model="factureForm.date_facture" type="date" required class="input mt-1" />
          </label>
          <label class="field-label">
            Date échéance
            <input v-model="factureForm.date_echeance" type="date" class="input mt-1" />
          </label>
          <label class="field-label md:col-span-2">
            Objet
            <input v-model="factureForm.objet" type="text" required class="input mt-1" :readonly="!!editingFacture?.commande_achat" placeholder="Achat marchandises, prestation, transport..." />
          </label>
          <label class="field-label">
            Montant HT
            <input v-model.number="factureForm.montant_ht" type="number" min="0" step="1" required class="input mt-1" :readonly="!!editingFacture?.commande_achat" />
          </label>
          <label class="field-label">
            TVA fournisseur
            <input v-model.number="factureForm.montant_tva" type="number" min="0" step="1" class="input mt-1" :readonly="!!editingFacture?.commande_achat" />
          </label>
          <label class="field-label">
            Statut
            <select v-model="factureForm.statut" class="input mt-1">
              <option value="validee">Validée</option>
              <option value="brouillon">Brouillon</option>
              <option value="annulee">Annulée</option>
            </select>
          </label>
          <label class="field-label">
            Total TTC
            <input :value="formatPrice(totalFactureForm)" type="text" readonly class="input mt-1 bg-slate-50" />
          </label>
          <label class="field-label md:col-span-2">
            Notes
            <textarea v-model="factureForm.notes" rows="3" class="input mt-1"></textarea>
          </label>
        </div>

        <div class="flex justify-end gap-2 border-t border-slate-200 pt-4">
          <button type="button" @click="showFactureModal = false" class="btn-secondary">Annuler</button>
          <button type="submit" :disabled="savingFacture" class="btn-primary">{{ savingFacture ? 'Enregistrement...' : 'Enregistrer' }}</button>
        </div>
      </form>
    </AppModal>

    <AppModal v-model="showReglementModal" title="Nouveau règlement fournisseur" size="lg">
      <form class="space-y-4" @submit.prevent="saveReglement">
        <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label class="field-label">
            Fournisseur
            <select v-model="reglementForm.fournisseur_id" required class="input mt-1" @change="loadFacturesImpayees">
              <option value="">Sélectionner</option>
              <option v-for="fournisseur in fournisseurs" :key="fournisseur.id" :value="fournisseur.id">{{ fournisseur.nom }}</option>
            </select>
          </label>
          <label class="field-label">
            Date règlement
            <input v-model="reglementForm.date_reglement" type="date" required class="input mt-1" />
          </label>
          <label class="field-label">
            Mode de paiement
            <select v-model="reglementForm.mode_paiement" required class="input mt-1">
              <option value="virement">Virement</option>
              <option value="cheque">Chèque</option>
              <option value="especes">Espèces</option>
              <option value="wave">Wave</option>
              <option value="orange_money">Orange Money</option>
              <option value="free_money">Free Money</option>
              <option value="carte_bancaire">Carte bancaire</option>
              <option value="autre">Autre</option>
            </select>
          </label>
          <label class="field-label">
            Montant réglé
            <input v-model.number="reglementForm.montant" type="number" min="1" step="1" required class="input mt-1" />
          </label>
          <label class="field-label">
            Référence paiement
            <input v-model="reglementForm.reference_paiement" type="text" class="input mt-1" placeholder="N° chèque, virement..." />
          </label>
          <label class="field-label">
            Banque
            <input v-model="reglementForm.banque" type="text" class="input mt-1" />
          </label>
        </div>

        <div class="rounded-xl border border-slate-200">
          <div class="border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
            Factures à régler
          </div>
          <div v-if="facturesImpayees.length" class="max-h-72 divide-y divide-slate-100 overflow-y-auto">
            <label v-for="facture in facturesImpayees" :key="facture.id" class="grid cursor-pointer grid-cols-1 gap-2 px-4 py-3 hover:bg-slate-50 sm:grid-cols-[28px_1fr_170px] sm:items-center">
              <input type="checkbox" :checked="isFactureSelected(facture.id)" class="h-4 w-4" @change="toggleFacture(facture)" />
              <div>
                <div class="font-mono text-sm font-semibold text-slate-800">{{ facture.numero }}</div>
                <div class="text-xs text-slate-500">Reste: {{ formatPrice(facture.reste_a_payer) }} - Échéance: {{ formatDate(facture.date_echeance) }}</div>
              </div>
              <input
                :disabled="!isFactureSelected(facture.id)"
                :value="selectedAmount(facture.id)"
                type="number"
                min="1"
                step="1"
                class="input"
                @input="setSelectedAmount(facture.id, $event.target.value)"
              />
            </label>
          </div>
          <div v-else class="px-4 py-8 text-center text-sm text-slate-500">
            Sélectionnez un fournisseur avec des factures impayées.
          </div>
        </div>

        <label class="field-label">
          Notes
          <textarea v-model="reglementForm.notes" rows="3" class="input mt-1"></textarea>
        </label>

        <div class="flex justify-end gap-2 border-t border-slate-200 pt-4">
          <button type="button" @click="showReglementModal = false" class="btn-secondary">Annuler</button>
          <button type="submit" :disabled="savingReglement" class="btn-primary">{{ savingReglement ? 'Enregistrement...' : 'Enregistrer le règlement' }}</button>
        </div>
      </form>
    </AppModal>

    <AppModal v-model="showSituationModal" title="Situation fournisseur" size="lg">
      <div v-if="situationLoading" class="py-10 text-center text-sm text-slate-500">Chargement de la situation...</div>
      <div v-else-if="supplierSituation.fournisseur" class="space-y-4">
        <div class="rounded-2xl border border-cyan-200 bg-cyan-50 p-4">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 class="text-lg font-black text-slate-900">{{ supplierSituation.fournisseur.nom }}</h3>
              <p class="text-sm text-slate-600">{{ supplierSituation.fournisseur.code || '-' }} · {{ supplierSituation.fournisseur.email || 'Email non renseigné' }}</p>
            </div>
            <button type="button" class="btn-primary px-4 py-2 text-sm" @click="openSupplierSituationPdf">
              Situation PDF
            </button>
          </div>
        </div>

        <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <article v-for="card in supplierSituationCards" :key="card.label" class="rounded-xl border border-slate-200 bg-white p-3">
            <span class="stat-label">{{ card.label }}</span>
            <strong class="mt-1 block text-lg font-black" :class="card.color">{{ card.value }}</strong>
          </article>
        </div>

        <section class="debt-panel">
          <div class="debt-panel-header">
            <div>
              <h3>Factures impayées</h3>
              <p>Échéances et montants restant à payer.</p>
            </div>
          </div>
          <div class="max-h-80 divide-y divide-slate-100 overflow-y-auto">
            <div v-for="facture in supplierSituation.factures_impayees" :key="facture.id" class="debt-row">
              <div>
                <div class="font-mono text-sm font-bold text-slate-800">{{ facture.numero }}</div>
                <p class="text-xs text-slate-500">Échéance {{ formatDate(facture.date_echeance) }} · {{ urgenceLabel(facture) }}</p>
              </div>
              <div class="flex flex-col items-end gap-2">
                <span class="font-mono font-black text-orange-700">{{ formatPrice(facture.reste_a_payer) }}</span>
                <button type="button" class="table-action" @click="openReglementForFacture(facture)">Payer</button>
              </div>
            </div>
            <p v-if="!supplierSituation.factures_impayees?.length" class="px-4 py-8 text-center text-sm text-slate-500">Aucune facture impayée.</p>
          </div>
        </section>

        <section class="debt-panel">
          <div class="debt-panel-header">
            <div>
              <h3>Derniers règlements</h3>
              <p>Historique récent des paiements fournisseur.</p>
            </div>
          </div>
          <div class="max-h-64 divide-y divide-slate-100 overflow-y-auto">
            <div v-for="reglement in supplierSituation.reglements" :key="reglement.id" class="debt-row">
              <div>
                <div class="font-mono text-sm font-bold text-slate-800">{{ reglement.reference }}</div>
                <p class="text-xs text-slate-500">{{ formatDate(reglement.date_reglement) }} · {{ modeLabel(reglement.mode_paiement) }}</p>
              </div>
              <span class="font-mono font-black text-emerald-700">{{ formatPrice(reglement.montant) }}</span>
            </div>
            <p v-if="!supplierSituation.reglements?.length" class="px-4 py-8 text-center text-sm text-slate-500">Aucun règlement enregistré.</p>
          </div>
        </section>
      </div>
    </AppModal>
  </div>
</template>

<script setup>
import { computed, defineComponent, h, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/services/api'
import AppModal from '@/components/AppModal.vue'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'
import { telechargerCSV } from '@/services/exports'
import { ouvrirPDF } from '@/services/pdf'

const PaginationBar = defineComponent({
  props: { meta: { type: Object, required: true } },
  emits: ['page'],
  setup(props, { emit }) {
    return () => props.meta.total > 0
      ? h('div', { class: 'flex flex-col gap-3 border-t border-slate-200 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between' }, [
        h('div', { class: 'text-slate-600' }, `${props.meta.from || 0}-${props.meta.to || 0} sur ${props.meta.total || 0}`),
        h('div', { class: 'flex gap-2' }, [
          h('button', { class: 'btn-secondary px-3 py-1.5 disabled:opacity-40', disabled: props.meta.current_page <= 1, onClick: () => emit('page', props.meta.current_page - 1) }, '<'),
          h('span', { class: 'px-3 py-1.5 text-slate-600' }, `${props.meta.current_page || 1} / ${props.meta.last_page || 1}`),
          h('button', { class: 'btn-secondary px-3 py-1.5 disabled:opacity-40', disabled: props.meta.current_page >= props.meta.last_page, onClick: () => emit('page', props.meta.current_page + 1) }, '>'),
        ]),
      ])
      : null
  },
})

const toast = useToast()
const route = useRoute()
const { confirm: askConfirm } = useConfirm()
const activeTab = ref('factures')
const activeFactureStatut = ref('')
const activeCardClass = 'border-blue-500 bg-blue-50 ring-2 ring-blue-100'

const fournisseurs = ref([])
const factures = ref([])
const reglements = ref([])
const facturesImpayees = ref([])
const factureLoading = ref(false)
const reglementLoading = ref(false)
const exportLoading = ref(false)
const savingFacture = ref(false)
const savingReglement = ref(false)
const debtDashboardLoading = ref(false)
const situationLoading = ref(false)
const showFactureModal = ref(false)
const showReglementModal = ref(false)
const showSituationModal = ref(false)
const editingFacture = ref(null)
let factureSearchTimer = null
let reglementSearchTimer = null

const stats = reactive({
  total_factures: 0,
  impayees: 0,
  en_retard: 0,
  dette_total: 0,
  reglements_mois: 0,
})

const debtDashboard = reactive({
  kpis: {},
  aging: [],
  top_fournisseurs: [],
  echeancier: [],
  suggestions: [],
  derniers_reglements: [],
})

const supplierSituation = reactive({
  fournisseur: null,
  resume: {},
  factures_impayees: [],
  factures_recentes: [],
  reglements: [],
})

const factureFilters = reactive({ search: '', fournisseur_id: '', statut: '', etat: '' })
const reglementFilters = reactive({ search: '', fournisseur_id: '', statut: '' })
const factureMeta = reactive({ current_page: 1, last_page: 1, total: 0, from: 0, to: 0 })
const reglementMeta = reactive({ current_page: 1, last_page: 1, total: 0, from: 0, to: 0 })

const factureForm = reactive({
  fournisseur_id: '',
  reference_fournisseur: '',
  objet: '',
  statut: 'validee',
  date_facture: todayInput(),
  date_echeance: '',
  montant_ht: 0,
  montant_tva: 0,
  notes: '',
})

const reglementForm = reactive({
  fournisseur_id: '',
  date_reglement: todayInput(),
  montant: 0,
  mode_paiement: 'virement',
  reference_paiement: '',
  banque: '',
  notes: '',
  factures: [],
})

const totalFactureForm = computed(() => Number(factureForm.montant_ht || 0) + Number(factureForm.montant_tva || 0))
const debtKpiCards = computed(() => [
  { label: 'Dette totale', value: formatPrice(debtDashboard.kpis?.dette_total), hint: `${debtDashboard.kpis?.factures_impayees || 0} facture(s) impayée(s)`, color: 'text-blue-700' },
  { label: 'En retard', value: formatPrice(debtDashboard.kpis?.montant_en_retard), hint: `${debtDashboard.kpis?.factures_en_retard || 0} facture(s)`, color: 'text-red-700' },
  { label: 'À 7 jours', value: formatPrice(debtDashboard.kpis?.a_regler_7_jours), hint: `${debtDashboard.kpis?.factures_7_jours || 0} échéance(s) proche(s)`, color: 'text-orange-700' },
  { label: 'Réglé ce mois', value: formatPrice(debtDashboard.kpis?.reglements_mois), hint: `En attente: ${formatPrice(debtDashboard.kpis?.reglements_en_attente)}`, color: 'text-emerald-700' },
])
const agingTotal = computed(() => (debtDashboard.aging || []).reduce((sum, bucket) => sum + Number(bucket.amount || 0), 0))
const supplierSituationCards = computed(() => [
  { label: 'Total facturé', value: formatPrice(supplierSituation.resume?.total_facture), color: 'text-slate-900' },
  { label: 'Total payé', value: formatPrice(supplierSituation.resume?.total_paye), color: 'text-emerald-700' },
  { label: 'Reste dû', value: formatPrice(supplierSituation.resume?.reste_a_payer), color: 'text-orange-700' },
  { label: 'En retard', value: formatPrice(supplierSituation.resume?.montant_en_retard), color: 'text-red-700' },
])

function todayInput() {
  return new Date().toISOString().slice(0, 10)
}

function normalizeDate(value) {
  return value ? String(value).slice(0, 10) : ''
}

function syncMeta(target, source) {
  Object.assign(target, {
    current_page: source.current_page || 1,
    last_page: source.last_page || 1,
    total: source.total || 0,
    from: source.from || 0,
    to: source.to || 0,
  })
}

async function loadInitialData() {
  try {
    await Promise.all([loadFournisseurs(), loadStats(), loadFactures(), loadReglements(), loadDebtDashboard()])
  } catch (error) {
    showApiError(error, 'Impossible de charger les règlements fournisseurs.')
  }
}

async function loadFournisseurs() {
  const { data } = await api.get('/fournisseurs-reglements/fournisseurs')
  fournisseurs.value = data
}

async function loadStats() {
  const { data } = await api.get('/fournisseurs-reglements/stats')
  Object.assign(stats, data)
}

async function loadDebtDashboard() {
  debtDashboardLoading.value = true
  try {
    const { data } = await api.get('/fournisseurs-reglements/dashboard')
    Object.assign(debtDashboard, {
      kpis: data.kpis || {},
      aging: data.aging || [],
      top_fournisseurs: data.top_fournisseurs || [],
      echeancier: data.echeancier || [],
      suggestions: data.suggestions || [],
      derniers_reglements: data.derniers_reglements || [],
    })
  } finally {
    debtDashboardLoading.value = false
  }
}

async function loadFactures(page = 1) {
  factureLoading.value = true
  try {
    const params = {
      page,
      per_page: 20,
      search: factureFilters.search || undefined,
      fournisseur_id: factureFilters.fournisseur_id || undefined,
      statut: factureFilters.statut || undefined,
      etat: factureFilters.etat || undefined,
    }
    const { data } = await api.get('/fournisseurs-reglements/factures', { params })
    factures.value = data.data || []
    syncMeta(factureMeta, data)
  } finally {
    factureLoading.value = false
  }
}

async function loadReglements(page = 1) {
  reglementLoading.value = true
  try {
    const params = {
      page,
      per_page: 20,
      search: reglementFilters.search || undefined,
      fournisseur_id: reglementFilters.fournisseur_id || undefined,
      statut: reglementFilters.statut || undefined,
    }
    const { data } = await api.get('/fournisseurs-reglements/reglements', { params })
    reglements.value = data.data || []
    syncMeta(reglementMeta, data)
  } finally {
    reglementLoading.value = false
  }
}

function onFactureSearch() {
  clearTimeout(factureSearchTimer)
  factureSearchTimer = setTimeout(() => loadFactures(1), 350)
}

function onReglementSearch() {
  clearTimeout(reglementSearchTimer)
  reglementSearchTimer = setTimeout(() => loadReglements(1), 350)
}

function setFactureFilter(type) {
  activeFactureStatut.value = type
  activeTab.value = 'factures'
  factureFilters.etat = type || ''
  factureFilters.statut = ''
  loadFactures(1)
}

function onFactureStatutChange() {
  activeFactureStatut.value = ''
  factureFilters.etat = ''
  loadFactures(1)
}

function resetFactureForm() {
  editingFacture.value = null
  Object.assign(factureForm, {
    fournisseur_id: '',
    reference_fournisseur: '',
    objet: '',
    statut: 'validee',
    date_facture: todayInput(),
    date_echeance: '',
    montant_ht: 0,
    montant_tva: 0,
    notes: '',
  })
}

function openFactureCreate() {
  resetFactureForm()
  showFactureModal.value = true
}

function openFactureEdit(facture) {
  editingFacture.value = facture
  Object.assign(factureForm, {
    fournisseur_id: facture.fournisseur_id || facture.fournisseur?.id || '',
    reference_fournisseur: facture.reference_fournisseur || '',
    objet: facture.objet || '',
    statut: ['payee', 'partiellement_payee'].includes(facture.statut) ? 'validee' : facture.statut,
    date_facture: normalizeDate(facture.date_facture),
    date_echeance: normalizeDate(facture.date_echeance),
    montant_ht: Number(facture.montant_ht || 0),
    montant_tva: Number(facture.montant_tva || 0),
    notes: facture.notes || '',
  })
  showFactureModal.value = true
}

async function saveFacture() {
  savingFacture.value = true
  try {
    const payload = { ...factureForm }
    if (!payload.date_echeance) payload.date_echeance = null
    if (editingFacture.value) {
      await api.put(`/fournisseurs-reglements/factures/${editingFacture.value.id}`, payload)
      toast.success('Facture fournisseur modifiée.')
    } else {
      await api.post('/fournisseurs-reglements/factures', payload)
      toast.success('Facture fournisseur créée.')
    }
    showFactureModal.value = false
    await Promise.all([loadStats(), loadDebtDashboard(), loadFactures(factureMeta.current_page)])
  } catch (error) {
    showApiError(error)
  } finally {
    savingFacture.value = false
  }
}

async function deleteFacture(facture) {
  if (!await askConfirm({ message: `Supprimer la facture fournisseur ${facture.numero} ?`, tone: 'danger', confirmLabel: 'Supprimer' })) return
  try {
    await api.delete(`/fournisseurs-reglements/factures/${facture.id}`)
    toast.success('Facture fournisseur supprimée.')
    await Promise.all([loadStats(), loadDebtDashboard(), loadFactures(factureMeta.current_page)])
  } catch (error) {
    showApiError(error)
  }
}

function resetReglementForm() {
  Object.assign(reglementForm, {
    fournisseur_id: '',
    date_reglement: todayInput(),
    montant: 0,
    mode_paiement: 'virement',
    reference_paiement: '',
    banque: '',
    notes: '',
    factures: [],
  })
  facturesImpayees.value = []
}

function openReglementCreate() {
  resetReglementForm()
  showReglementModal.value = true
}

async function openReglementForSupplier(fournisseurId) {
  if (!fournisseurId) return
  activeTab.value = 'reglements'
  resetReglementForm()
  reglementForm.fournisseur_id = fournisseurId
  showReglementModal.value = true
  await loadFacturesImpayees()
  selectAllFacturesImpayees()
}

async function openReglementForFacture(facture) {
  const fournisseurId = facture?.fournisseur_id || facture?.fournisseur?.id
  if (!fournisseurId) return toast.error('Fournisseur introuvable pour cette facture.')
  activeTab.value = 'reglements'
  resetReglementForm()
  reglementForm.fournisseur_id = fournisseurId
  showReglementModal.value = true
  showSituationModal.value = false
  await loadFacturesImpayees()
  const target = facturesImpayees.value.find((item) => Number(item.id) === Number(facture.id))
  if (target) {
    reglementForm.factures = [{
      facture_id: target.id,
      montant_affecte: Number(target.reste_a_payer || facture.reste_a_payer || 0),
    }]
    syncReglementMontant()
  }
}

async function loadFacturesImpayees() {
  reglementForm.factures = []
  reglementForm.montant = 0
  facturesImpayees.value = []
  if (!reglementForm.fournisseur_id) return

  try {
    const { data } = await api.get(`/fournisseurs-reglements/fournisseurs/${reglementForm.fournisseur_id}/factures-impayees`)
    facturesImpayees.value = data
  } catch (error) {
    showApiError(error, 'Impossible de charger les factures impayées du fournisseur.')
  }
}

function selectAllFacturesImpayees() {
  reglementForm.factures = facturesImpayees.value
    .filter((facture) => Number(facture.reste_a_payer || 0) > 0)
    .map((facture) => ({
      facture_id: facture.id,
      montant_affecte: Number(facture.reste_a_payer || 0),
    }))
  syncReglementMontant()
}

function isFactureSelected(id) {
  return reglementForm.factures.some((facture) => Number(facture.facture_id) === Number(id))
}

function selectedAmount(id) {
  return reglementForm.factures.find((facture) => Number(facture.facture_id) === Number(id))?.montant_affecte || ''
}

function toggleFacture(facture) {
  if (isFactureSelected(facture.id)) {
    reglementForm.factures = reglementForm.factures.filter((item) => Number(item.facture_id) !== Number(facture.id))
  } else {
    reglementForm.factures.push({
      facture_id: facture.id,
      montant_affecte: Number(facture.reste_a_payer || 0),
    })
  }
  syncReglementMontant()
}

function setSelectedAmount(id, value) {
  const item = reglementForm.factures.find((facture) => Number(facture.facture_id) === Number(id))
  if (!item) return
  item.montant_affecte = Number(value || 0)
  syncReglementMontant()
}

function syncReglementMontant() {
  reglementForm.montant = reglementForm.factures.reduce((total, facture) => total + Number(facture.montant_affecte || 0), 0)
}

async function saveReglement() {
  savingReglement.value = true
  try {
    const facturesSelectionnees = reglementForm.factures.filter((facture) => Number(facture.montant_affecte || 0) > 0)
    const totalAffecte = facturesSelectionnees.reduce((total, facture) => total + Number(facture.montant_affecte || 0), 0)

    if (facturesSelectionnees.length === 0) {
      toast.error('Sélectionnez au moins une facture fournisseur.')
      return
    }

    if (Math.abs(totalAffecte - Number(reglementForm.montant || 0)) > 0.01) {
      toast.error('Le montant réglé doit être égal au total affecté aux factures.')
      return
    }

    const payload = {
      ...reglementForm,
      factures: facturesSelectionnees,
    }
    await api.post('/fournisseurs-reglements/reglements', payload)
    toast.success('Règlement fournisseur enregistré.')
    showReglementModal.value = false
    await Promise.all([loadStats(), loadDebtDashboard(), loadFactures(factureMeta.current_page), loadReglements(1)])
  } catch (error) {
    showApiError(error)
  } finally {
    savingReglement.value = false
  }
}

async function deleteReglement(reglement) {
  if (!await askConfirm({ message: `Supprimer le règlement ${reglement.reference} ?`, tone: 'danger', confirmLabel: 'Supprimer' })) return
  try {
    await api.delete(`/fournisseurs-reglements/reglements/${reglement.id}`)
    toast.success('Règlement fournisseur supprimé.')
    await Promise.all([loadStats(), loadDebtDashboard(), loadFactures(factureMeta.current_page), loadReglements(reglementMeta.current_page)])
  } catch (error) {
    showApiError(error)
  }
}

async function openSupplierSituation(fournisseurId) {
  if (!fournisseurId) return
  situationLoading.value = true
  showSituationModal.value = true
  try {
    const { data } = await api.get(`/fournisseurs-reglements/fournisseurs/${fournisseurId}/situation`)
    Object.assign(supplierSituation, {
      fournisseur: data.fournisseur || null,
      resume: data.resume || {},
      factures_impayees: data.factures_impayees || [],
      factures_recentes: data.factures_recentes || [],
      reglements: data.reglements || [],
    })
  } catch (error) {
    showApiError(error, 'Situation fournisseur indisponible.')
  } finally {
    situationLoading.value = false
  }
}

async function openSupplierSituationPdf() {
  const fournisseurId = supplierSituation.fournisseur?.id
  if (!fournisseurId) return
  try {
    await ouvrirPDF(`/fournisseurs-reglements/fournisseurs/${fournisseurId}/situation-pdf`, `situation-fournisseur-${supplierSituation.fournisseur.code || fournisseurId}.pdf`)
  } catch (error) {
    toast.error('Situation fournisseur PDF indisponible.')
  }
}

async function exporterReglementsCSV() {
  exportLoading.value = true
  try {
    await telechargerCSV('/exports/fournisseurs-reglements', {
      search: reglementFilters.search || undefined,
      fournisseur_id: reglementFilters.fournisseur_id || undefined,
      statut: reglementFilters.statut || undefined,
    }, 'reglements_fournisseurs.csv')
    toast.success('Export des règlements fournisseurs téléchargé.')
  } catch (error) {
    toast.error('Export impossible pour le moment.')
  } finally {
    exportLoading.value = false
  }
}

async function exporterFacturesCSV() {
  exportLoading.value = true
  try {
    await telechargerCSV('/exports/fournisseurs-factures', {
      search: factureFilters.search || undefined,
      fournisseur_id: factureFilters.fournisseur_id || undefined,
      statut: factureFilters.statut || undefined,
      etat: factureFilters.etat || undefined,
    }, 'factures_fournisseurs.csv')
    toast.success('Export des factures fournisseurs téléchargé.')
  } catch (error) {
    toast.error('Export impossible pour le moment.')
  } finally {
    exportLoading.value = false
  }
}

function showApiError(error, fallback = 'Une erreur est survenue.') {
  const data = error?.response?.data || {}
  const errors = data.errors
  if (errors) {
    toast.error(Object.values(errors).flat()[0] || 'Veuillez corriger le formulaire.')
    return
  }
  toast.error(data.message || fallback)
}

function formatPrice(value) {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Number(value || 0))
}

function formatDate(value) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('fr-FR')
}

function agingPercent(amount) {
  const total = Number(agingTotal.value || 0)
  if (!total) return 0
  return Math.max(4, Math.min(100, Math.round(Number(amount || 0) * 100 / total)))
}

function urgenceLabel(facture) {
  if (Number(facture?.jours_retard || 0) > 0) return `En retard de ${facture.jours_retard} j`
  if (facture?.jours_avant_echeance !== null && facture?.jours_avant_echeance !== undefined) return `À payer dans ${facture.jours_avant_echeance} j`
  return 'Échéance à planifier'
}

function urgenceClass(facture) {
  return {
    critique: 'text-red-700 font-semibold',
    retard: 'text-orange-700 font-semibold',
    proche: 'text-amber-700 font-semibold',
    normale: 'text-slate-500',
  }[facture?.urgence] || 'text-slate-500'
}

function statutLabel(statut) {
  return {
    brouillon: 'Brouillon',
    validee: 'Validée',
    partiellement_payee: 'Partielle',
    payee: 'Payée',
    annulee: 'Annulée',
  }[statut] || statut
}

function statutBadge(statut) {
  return {
    brouillon: 'bg-slate-100 text-slate-700',
    validee: 'bg-blue-100 text-blue-700',
    partiellement_payee: 'bg-orange-100 text-orange-700',
    payee: 'bg-emerald-100 text-emerald-700',
    annulee: 'bg-red-100 text-red-700',
  }[statut] || 'bg-slate-100 text-slate-700'
}

function reglementLabel(statut) {
  return {
    valide: 'Validé',
    en_attente: 'En attente',
    rejete: 'Rejeté',
    annule: 'Annulé',
  }[statut] || statut
}

function reglementBadge(statut) {
  return {
    valide: 'bg-emerald-100 text-emerald-700',
    en_attente: 'bg-orange-100 text-orange-700',
    rejete: 'bg-red-100 text-red-700',
    annule: 'bg-slate-100 text-slate-700',
  }[statut] || 'bg-slate-100 text-slate-700'
}

function modeLabel(mode) {
  return {
    especes: 'Espèces',
    cheque: 'Chèque',
    virement: 'Virement',
    carte_bancaire: 'Carte',
    mobile_money: 'Mobile money',
    wave: 'Wave',
    orange_money: 'Orange Money',
    free_money: 'Free Money',
    compensation: 'Compensation',
    autre: 'Autre',
  }[mode] || mode
}

onMounted(() => {
  if (route.query.search) {
    activeTab.value = 'factures'
    factureFilters.search = String(route.query.search)
  }
  loadInitialData()
})
</script>

<style scoped>
.stat-card {
  @apply rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md;
}

.debt-card {
  @apply rounded-2xl border border-cyan-200 bg-cyan-50/70 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md;
}

.debt-panel {
  @apply overflow-hidden rounded-2xl border border-sky-200 bg-white shadow-sm;
}

.debt-panel-header {
  @apply flex flex-col gap-2 border-b border-sky-100 bg-sky-50/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between;
}

.debt-panel-header h3 {
  @apply font-black text-slate-900;
}

.debt-panel-header p {
  @apply text-xs text-slate-500;
}

.debt-row {
  @apply flex items-center justify-between gap-4 px-4 py-3 transition hover:bg-cyan-50/60;
}

.stat-label {
  @apply block text-xs font-semibold uppercase tracking-wide text-slate-500;
}

.stat-value {
  @apply mt-2 block text-2xl font-bold;
}

.tab-button {
  @apply border-b-2 border-transparent px-4 py-3 text-sm font-medium text-slate-500 transition hover:text-blue-600;
}

.tab-active {
  @apply border-blue-600 text-blue-600;
}

.th {
  @apply px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600;
}

.td {
  @apply px-4 py-3 text-sm;
}

.badge {
  @apply inline-flex rounded-full px-2.5 py-1 text-xs font-semibold;
}

.table-action {
  @apply rounded-lg px-2 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50;
}

.table-danger {
  @apply rounded-lg px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-50;
}

.field-label {
  @apply text-sm font-medium text-slate-700;
}
</style>
