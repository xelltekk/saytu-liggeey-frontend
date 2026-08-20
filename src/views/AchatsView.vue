<template>
  <div class="space-y-4">
    <section class="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 class="text-xl font-bold text-slate-900">Achats fournisseurs</h2>
        <p class="text-sm text-slate-500">Commandes, approbations et réceptions en stock</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <button class="btn-secondary" @click="toggleRequests">{{ showRequests ? 'Voir les commandes' : 'Demandes d’achat' }}</button>
        <button v-if="!showRequests" class="btn-secondary" @click="togglePerformance">{{ showPerformance ? 'Masquer la performance' : 'Performance fournisseurs' }}</button>
        <button class="btn-primary inline-flex items-center justify-center gap-2" @click="showRequests ? openDemandCreate() : openCreate()"><Plus :size="18" /> {{ showRequests ? 'Nouvelle demande' : 'Nouveau bon de commande' }}</button>
      </div>
    </section>

    <section v-if="!showRequests" class="grid grid-cols-2 gap-3 xl:grid-cols-5">
      <button v-for="card in statCards" :key="card.key" type="button" class="rounded-lg border border-slate-200 bg-white p-3 text-left transition hover:border-blue-300 hover:shadow-sm" @click="applyStatFilter(card.key)">
        <span class="text-xs font-medium uppercase text-slate-500">{{ card.label }}</span>
        <strong class="mt-2 block text-xl" :class="card.color">{{ card.value }}</strong>
      </button>
    </section>

    <section v-if="showPerformance && !showRequests" class="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div><h3 class="font-bold text-slate-900">Performance fournisseurs</h3><p class="text-sm text-slate-500">Qualité, ponctualité, retours et volume d'achats</p></div>
        <button class="btn-secondary" :disabled="loadingPerformance" @click="loadPerformance">Actualiser</button>
      </div>
      <div class="grid gap-3 sm:grid-cols-3">
        <div class="rounded-lg bg-slate-50 p-3"><span class="caption">Fournisseurs suivis</span><strong class="text-xl">{{ performanceSummary.count }}</strong></div>
        <div class="rounded-lg bg-emerald-50 p-3"><span class="caption">Score moyen</span><strong class="text-xl text-emerald-700">{{ performanceSummary.averageScore !== null ? performanceSummary.averageScore + ' %' : '-' }}</strong></div>
        <div class="rounded-lg bg-blue-50 p-3"><span class="caption">Meilleur fournisseur</span><strong class="text-blue-800">{{ performanceSummary.best || '-' }}</strong></div>
      </div>
      <div v-if="loadingPerformance" class="py-8 text-center text-sm text-slate-500">Chargement...</div>
      <div v-else class="overflow-x-auto rounded-lg border border-slate-200">
        <table class="w-full min-w-[900px]"><thead><tr><th>Fournisseur</th><th class="text-right">Score</th><th class="text-right">Note</th><th class="text-right">Livraisons à temps</th><th class="text-right">Retours</th><th class="text-right">Commandes</th><th class="text-right">Volume achats</th></tr></thead><tbody>
          <tr v-for="supplier in supplierPerformance" :key="supplier.id"><td><strong>{{ supplier.nom }}</strong><p class="text-xs text-slate-500">{{ supplier.code }}</p></td><td class="text-right"><span class="badge" :class="performanceClass(supplier.score_global)">{{ supplier.score_global !== null ? supplier.score_global + ' %' : '-' }}</span></td><td class="text-right">{{ supplier.note_moyenne !== null ? supplier.note_moyenne + ' / 5' : 'Non noté' }}</td><td class="text-right">{{ supplier.taux_livraison_temps !== null ? supplier.taux_livraison_temps + ' %' : '-' }}</td><td class="text-right">{{ supplier.taux_retour }} %</td><td class="text-right">{{ supplier.commandes_count }}</td><td class="text-right font-semibold">{{ money(supplier.montant_achats) }}</td></tr>
          <tr v-if="!supplierPerformance.length"><td colspan="7" class="py-8 text-center text-slate-400">Aucune donnée fournisseur.</td></tr>
        </tbody></table>
      </div>
    </section>

    <section v-if="!showRequests" class="rounded-lg border border-slate-200 bg-white p-3">
      <div class="grid gap-2 lg:grid-cols-[1fr_220px_220px_150px_150px_auto]">
        <input v-model="filters.search" class="input" placeholder="Rechercher numéro, fournisseur, objet..." @keyup.enter="loadCommandes(1)" />
        <select v-model="filters.statut" class="input" @change="loadCommandes(1)">
          <option value="">Tous les statuts</option>
          <option v-for="status in statuses" :key="status" :value="status">{{ statusLabel(status) }}</option>
        </select>
        <select v-model.number="filters.fournisseur_id" class="input" @change="loadCommandes(1)">
          <option :value="null">Tous les fournisseurs</option>
          <option v-for="f in referentiels.fournisseurs" :key="f.id" :value="f.id">{{ f.nom }}</option>
        </select>
        <input v-model="filters.date_from" type="date" class="input" @change="loadCommandes(1)" />
        <input v-model="filters.date_to" type="date" class="input" @change="loadCommandes(1)" />
        <button class="btn-secondary" @click="loadCommandes(1)">Actualiser</button>
      </div>
    </section>

    <section v-if="!showRequests" class="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table class="w-full min-w-[1120px]">
        <thead><tr><th>N°</th><th>Fournisseur</th><th>Date</th><th>Livraison prévue</th><th>Entrepôt</th><th class="text-right">Total TTC</th><th>Réception</th><th>Facture</th><th>Statut</th><th class="text-right">Actions</th></tr></thead>
        <tbody>
          <tr v-for="commande in commandes" :key="commande.id">
            <td><button class="font-mono font-semibold text-blue-700 hover:underline" @click="openDetails(commande)">{{ commande.numero }}</button></td>
            <td><strong>{{ commande.fournisseur?.nom || '-' }}</strong><p class="text-xs text-slate-500">{{ commande.objet || 'Sans objet' }}</p></td>
            <td>{{ formatDate(commande.date_commande) }}</td>
            <td>{{ formatDate(commande.date_livraison_prevue) }}</td>
            <td>{{ commande.entrepot?.libelle || 'À définir' }}</td>
            <td class="text-right font-semibold">{{ money(commande.total_ttc) }}</td>
            <td>{{ commande.lignes_count || 0 }} ligne(s)</td>
            <td>
              <button v-if="commande.facture_fournisseur" class="font-mono text-violet-700 hover:underline" @click="goToInvoice(commande.facture_fournisseur)">{{ commande.facture_fournisseur.numero }}</button>
              <span v-else class="text-slate-400">-</span>
            </td>
            <td><span class="badge" :class="statusClass(commande.statut)">{{ statusLabel(commande.statut) }}</span></td>
            <td>
              <div class="flex justify-end gap-2">
                <button v-if="commande.statut === 'brouillon'" class="text-blue-700" title="Modifier" @click="editCommande(commande)">Modifier</button>
                <button v-if="commande.statut === 'brouillon'" class="text-indigo-700" title="Soumettre" @click="submitCommande(commande)">Soumettre</button>
                <button v-if="commande.statut === 'soumise' && canApprove" class="text-green-700" title="Approuver" @click="approveCommande(commande)">Approuver</button>
                <button v-if="['approuvee', 'partiellement_recue'].includes(commande.statut) && canReceive" class="text-cyan-700" title="Réceptionner" @click="openReception(commande)">Réceptionner</button>
                <button v-if="['partiellement_recue', 'recue'].includes(commande.statut) && !commande.facture_fournisseur && canInvoice" class="text-violet-700" title="Générer la facture fournisseur" @click="openInvoiceCreate(commande)">Facturer</button>
                <button v-if="commande.facture_fournisseur" class="text-violet-700" title="Voir la facture fournisseur" @click="goToInvoice(commande.facture_fournisseur)">Voir facture</button>
                <button v-if="commande.statut === 'recue' && canEvaluate" class="text-amber-700" title="Évaluer le fournisseur" @click="openEvaluation(commande)">{{ commande.evaluation_fournisseur ? 'Réévaluer' : 'Évaluer' }}</button>
                <button class="inline-flex items-center gap-1 text-slate-700" title="Télécharger le bon de commande PDF" @click="downloadOrderPdf(commande)"><FileDown :size="16" /> BC</button>
                <button v-if="commande.statut === 'brouillon'" class="text-red-600" title="Supprimer" @click="deleteCommande(commande)"><Trash2 :size="17" /></button>
              </div>
            </td>
          </tr>
          <tr v-if="!commandes.length"><td colspan="10" class="py-12 text-center text-sm text-slate-400">Aucun bon de commande trouvé.</td></tr>
        </tbody>
      </table>
      <AppPagination v-if="meta.total" :meta="meta" label="bons de commande" @page="loadCommandes" />
    </section>

    <template v-else>
      <section class="grid grid-cols-2 gap-3 xl:grid-cols-5">
        <div v-for="card in demandStatCards" :key="card.label" class="rounded-lg border border-slate-200 bg-white p-3"><span class="text-xs font-medium uppercase text-slate-500">{{ card.label }}</span><strong class="mt-2 block text-xl" :class="card.color">{{ card.value }}</strong></div>
      </section>
      <section class="rounded-lg border border-slate-200 bg-white p-3">
        <div class="grid gap-2 md:grid-cols-[1fr_200px_180px_auto]"><input v-model="demandFilters.search" class="input" placeholder="Rechercher numéro, objet, service..." @keyup.enter="loadDemands(1)" /><select v-model="demandFilters.statut" class="input" @change="loadDemands(1)"><option value="">Tous les statuts</option><option v-for="status in demandStatuses" :key="status" :value="status">{{ demandStatusLabel(status) }}</option></select><select v-model="demandFilters.priorite" class="input" @change="loadDemands(1)"><option value="">Toutes priorités</option><option value="basse">Basse</option><option value="normale">Normale</option><option value="haute">Haute</option><option value="urgente">Urgente</option></select><button class="btn-secondary" @click="loadDemands(1)">Actualiser</button></div>
      </section>
      <section class="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table class="w-full min-w-[1150px]"><thead><tr><th>N°</th><th>Demandeur</th><th>Besoin</th><th>Objet</th><th>Priorité</th><th class="text-right">Estimation</th><th>Statut</th><th>Commande</th><th class="text-right">Actions</th></tr></thead><tbody>
          <tr v-for="demand in demands" :key="demand.id"><td class="font-mono font-semibold">{{ demand.numero }}</td><td><strong>{{ demand.demandeur?.name || '-' }}</strong><p class="text-xs text-slate-500">{{ demand.service_demandeur || 'Service non précisé' }}</p></td><td>{{ formatDate(demand.date_besoin) }}</td><td><strong>{{ demand.objet }}</strong><p class="text-xs text-slate-500">{{ demand.lignes?.length || 0 }} ligne(s)</p></td><td><span class="badge" :class="priorityClass(demand.priorite)">{{ priorityLabel(demand.priorite) }}</span></td><td class="text-right font-semibold">{{ money(demand.montant_estime) }}</td><td><span class="badge" :class="demandStatusClass(demand.statut)">{{ demandStatusLabel(demand.statut) }}</span><p v-if="demand.motif_rejet" class="mt-1 max-w-48 truncate text-xs text-red-600" :title="demand.motif_rejet">{{ demand.motif_rejet }}</p></td><td><button v-if="demand.commande" class="font-mono text-blue-700 hover:underline" @click="openDetails(demand.commande)">{{ demand.commande.numero }}</button><span v-else>-</span></td><td><div class="flex justify-end gap-2"><button v-if="demand.statut === 'brouillon'" class="text-blue-700" @click="editDemand(demand)">Modifier</button><button v-if="demand.statut === 'brouillon'" class="text-indigo-700" @click="submitDemand(demand)">Soumettre</button><button v-if="demand.statut === 'soumise' && canApprove" class="text-green-700" @click="approveDemand(demand)">Approuver</button><button v-if="demand.statut === 'soumise' && canApprove" class="text-red-600" @click="openRejectDemand(demand)">Rejeter</button><button v-if="demand.statut === 'approuvee' && canApprove" class="text-violet-700" @click="openConvertDemand(demand)">Convertir</button><button v-if="demand.statut === 'brouillon'" class="text-red-600" @click="deleteDemand(demand)"><Trash2 :size="16" /></button></div></td></tr>
          <tr v-if="!demands.length"><td colspan="9" class="py-12 text-center text-slate-400">Aucune demande d’achat.</td></tr>
        </tbody></table>
        <AppPagination v-if="demandMeta.total" :meta="demandMeta" label="demandes d’achat" @page="loadDemands" />
      </section>
    </template>

    <AppModal v-model="showDemandForm" :title="editingDemandId ? 'Modifier la demande d’achat' : 'Nouvelle demande d’achat'" size="xl">
      <form class="space-y-4" @submit.prevent="saveDemand">
        <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label class="field-label">Date demande<input v-model="demandForm.date_demande" type="date" class="input" required /></label>
          <label class="field-label">Date du besoin<input v-model="demandForm.date_besoin" type="date" class="input" /></label>
          <label class="field-label">Service demandeur<input v-model="demandForm.service_demandeur" class="input" placeholder="Informatique, Stock..." /></label>
          <label class="field-label">Priorité<select v-model="demandForm.priorite" class="input"><option value="basse">Basse</option><option value="normale">Normale</option><option value="haute">Haute</option><option value="urgente">Urgente</option></select></label>
          <label class="field-label md:col-span-2">Objet<input v-model="demandForm.objet" class="input" required placeholder="Objet du besoin" /></label>
          <label class="field-label md:col-span-2">Justification<textarea v-model="demandForm.justification" rows="2" class="input" placeholder="Pourquoi cet achat est nécessaire"></textarea></label>
        </div>
        <div class="border-y border-slate-200 py-4">
          <div class="mb-3 flex items-center justify-between"><div><h3 class="font-bold">Produits demandés</h3><p class="text-sm text-slate-500">Les prix d’achat servent uniquement d’estimation.</p></div><button type="button" class="btn-secondary" @click="addDemandLine">Ajouter une ligne</button></div>
          <div class="space-y-2.5">
            <div v-for="(line, index) in demandForm.lignes" :key="line.key" class="document-line-card">
              <div class="mb-2 flex items-center justify-between gap-2">
                <span class="rounded-full px-2.5 py-1 text-xs font-bold" style="background: color-mix(in srgb, var(--saytu-primary) 10%, var(--saytu-surface)); color: var(--saytu-primary);">Ligne {{ index + 1 }}</span>
                <div class="flex items-center gap-1">
                  <button type="button" class="document-line-order-button" :disabled="index === 0 || demandForm.lignes.length < 2" title="Monter la ligne" @click="moveDemandLine(index, -1)">↑</button>
                  <button type="button" class="document-line-order-button" :disabled="index === demandForm.lignes.length - 1 || demandForm.lignes.length < 2" title="Descendre la ligne" @click="moveDemandLine(index, 1)">↓</button>
                  <button type="button" class="document-line-delete-button" title="Supprimer la ligne" @click="removeDemandLine(index)"><Trash2 :size="17" /></button>
                </div>
              </div>
              <div class="grid items-end gap-2 lg:grid-cols-[minmax(260px,1fr)_110px_150px_150px]">
                <label class="block"><span class="document-line-label">Produit</span><select v-model.number="line.produit_id" class="input" required @change="selectDemandProduct(line)"><option :value="null">Choisir</option><option v-for="product in referentiels.produits" :key="product.id" :value="product.id">{{ product.reference }} - {{ product.libelle }}</option></select></label>
                <label class="block"><span class="document-line-label">Quantité</span><input v-model.number="line.quantite" type="number" min="0.001" step="0.001" class="input text-right" required /></label>
                <label class="block"><span class="document-line-label">Prix estimé HT</span><input v-model.number="line.prix_estime_ht" type="number" min="0" step="1" class="input text-right" /></label>
                <div><span class="document-line-label">Estimation TTC</span><div class="document-line-total">{{ money(demandLineTotal(line)) }}</div></div>
              </div>
            </div>
          </div>
        </div>
        <div class="flex flex-wrap items-center justify-between gap-3"><strong>Estimation totale : {{ money(demandEstimatedTotal) }}</strong><div class="flex gap-2"><button type="button" class="btn-secondary" @click="showDemandForm = false">Annuler</button><button class="btn-primary" :disabled="saving">{{ saving ? 'Enregistrement...' : 'Enregistrer la demande' }}</button></div></div>
      </form>
    </AppModal>

    <AppModal v-model="showDemandReject" title="Rejeter la demande" size="md">
      <form class="space-y-4" @submit.prevent="rejectDemand"><p class="text-sm text-slate-600">Demande <strong>{{ selectedDemand?.numero }}</strong></p><label class="field-label">Motif du rejet<textarea v-model="rejectReason" rows="4" class="input" required></textarea></label><div class="flex justify-end gap-2"><button type="button" class="btn-secondary" @click="showDemandReject = false">Annuler</button><button class="btn-primary bg-red-600" :disabled="saving">Confirmer le rejet</button></div></form>
    </AppModal>

    <AppModal v-model="showDemandConvert" title="Convertir en bon de commande" size="md">
      <form class="space-y-4" @submit.prevent="convertDemand"><div class="rounded-lg border border-violet-200 bg-violet-50 p-3 text-sm text-violet-900"><strong>{{ selectedDemand?.numero }}</strong><p>{{ selectedDemand?.objet }} · {{ money(selectedDemand?.montant_estime) }}</p></div><label class="field-label">Fournisseur<select v-model.number="convertForm.fournisseur_id" class="input" required><option :value="null">Choisir</option><option v-for="supplier in referentiels.fournisseurs" :key="supplier.id" :value="supplier.id">{{ supplier.code }} - {{ supplier.nom }}</option></select></label><label class="field-label">Entrepôt prévu<select v-model.number="convertForm.entrepot_id" class="input"><option :value="null">À définir</option><option v-for="warehouse in referentiels.entrepots" :key="warehouse.id" :value="warehouse.id">{{ warehouse.code }} - {{ warehouse.libelle }}</option></select></label><div class="grid grid-cols-2 gap-3"><label class="field-label">Date commande<input v-model="convertForm.date_commande" type="date" class="input" required /></label><label class="field-label">Livraison prévue<input v-model="convertForm.date_livraison_prevue" type="date" class="input" /></label></div><div class="flex justify-end gap-2"><button type="button" class="btn-secondary" @click="showDemandConvert = false">Annuler</button><button class="btn-primary" :disabled="saving">Créer le bon de commande</button></div></form>
    </AppModal>

    <AppModal v-model="showForm" :title="editingId ? 'Modifier le bon de commande' : 'Nouveau bon de commande'" size="xl">
      <div v-if="referentielsError" class="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        {{ referentielsError }}
      </div>
      <form class="space-y-4" @submit.prevent="saveCommande">
        <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label class="field-label md:col-span-2">Fournisseur
            <select v-model.number="form.fournisseur_id" class="input" required><option :value="null">{{ loadingReferentiels ? 'Chargement des fournisseurs...' : 'Choisir un fournisseur' }}</option><option v-if="!loadingReferentiels && !referentiels.fournisseurs.length" disabled>Aucun fournisseur disponible</option><option v-for="f in referentiels.fournisseurs" :key="f.id" :value="f.id">{{ f.code }} - {{ f.nom }}</option></select>
          </label>
          <label class="field-label">Date commande<input v-model="form.date_commande" type="date" class="input" required /></label>
          <label class="field-label">Livraison prévue<input v-model="form.date_livraison_prevue" type="date" class="input" /></label>
          <label class="field-label md:col-span-2">Objet<input v-model="form.objet" class="input" placeholder="Ex. Réapprovisionnement mensuel" /></label>
          <label class="field-label">Entrepôt prévu<select v-model.number="form.entrepot_id" class="input"><option :value="null">À définir à la réception</option><option v-for="e in referentiels.entrepots" :key="e.id" :value="e.id">{{ e.code }} - {{ e.libelle }}</option></select></label>
          <label class="field-label">Devise<select v-model="form.devise" class="input"><option>XOF</option><option>EUR</option><option>USD</option></select></label>
        </div>

        <div class="border-y border-slate-200 py-4">
          <div class="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div><h3 class="font-bold text-slate-900">Produits commandés</h3><p class="text-sm text-slate-500">Les prix d’achat sont préremplis depuis les fiches produits.</p></div>
            <div class="flex gap-2"><input v-model="productSearch" class="input sm:w-72" placeholder="Filtrer les produits..." /><button type="button" class="btn-secondary inline-flex items-center gap-2" @click="addLine"><Plus :size="16" /> Ligne</button></div>
          </div>
          <div class="space-y-2.5">
            <div v-for="(line, index) in form.lignes" :key="line.key" class="document-line-card">
              <div class="mb-2 flex items-center justify-between gap-2">
                <span class="rounded-full px-2.5 py-1 text-xs font-bold" style="background: color-mix(in srgb, var(--saytu-primary) 10%, var(--saytu-surface)); color: var(--saytu-primary);">Ligne {{ index + 1 }}</span>
                <div class="flex items-center gap-1">
                  <button type="button" class="document-line-order-button" :disabled="index === 0 || form.lignes.length < 2" title="Monter la ligne" @click="moveLine(index, -1)">↑</button>
                  <button type="button" class="document-line-order-button" :disabled="index === form.lignes.length - 1 || form.lignes.length < 2" title="Descendre la ligne" @click="moveLine(index, 1)">↓</button>
                  <button type="button" class="document-line-delete-button" title="Supprimer la ligne" @click="removeLine(index)"><Trash2 :size="18" /></button>
                </div>
              </div>
              <div class="grid items-end gap-2 lg:grid-cols-[minmax(260px,1fr)_110px_150px_110px_150px]">
                <label class="block"><span class="document-line-label">Produit</span><select v-model.number="line.produit_id" class="input" required @change="selectProduct(line)"><option :value="null">{{ loadingReferentiels ? 'Chargement des produits...' : 'Choisir un produit' }}</option><option v-if="!loadingReferentiels && !referentiels.produits.length" disabled>Aucun produit disponible</option><option v-for="p in visibleProducts(line)" :key="p.id" :value="p.id">{{ p.reference }} - {{ p.libelle }}</option></select></label>
                <label class="block"><span class="document-line-label">Quantité</span><input v-model.number="line.quantite" type="number" min="0.001" step="0.001" class="input text-right" required /></label>
                <label class="block"><span class="document-line-label">Prix achat HT</span><input v-model.number="line.prix_unitaire_ht" type="number" min="0" step="1" class="input text-right" required /></label>
                <label class="block"><span class="document-line-label">TVA %</span><input v-model.number="line.taux_tva" type="number" min="0" max="100" step="0.01" class="input text-right" /></label>
                <div><span class="document-line-label">Total TTC</span><div class="document-line-total">{{ money(lineTotal(line)) }}</div></div>
              </div>
            </div>
          </div>
        </div>

        <div class="grid gap-4 md:grid-cols-[1fr_320px]">
          <label class="field-label">Notes<textarea v-model="form.notes" rows="4" class="input" placeholder="Conditions, références ou instructions au fournisseur"></textarea></label>
          <div class="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
            <div class="flex justify-between"><span>Total HT</span><strong>{{ money(orderTotals.ht) }}</strong></div>
            <div class="mt-2 flex justify-between"><span>TVA</span><strong>{{ money(orderTotals.tva) }}</strong></div>
            <div class="mt-3 flex justify-between border-t border-slate-300 pt-3 text-lg"><span>Total TTC</span><strong class="text-blue-700">{{ money(orderTotals.ttc) }}</strong></div>
          </div>
        </div>
        <div class="flex justify-end gap-2"><button type="button" class="btn-secondary" @click="showForm = false">Annuler</button><button class="btn-primary" :disabled="saving">{{ saving ? 'Enregistrement...' : 'Enregistrer le brouillon' }}</button></div>
      </form>
    </AppModal>

    <AppModal v-model="showReception" title="Réception fournisseur" size="lg">
      <form class="space-y-4" @submit.prevent="saveReception">
        <div class="rounded-lg border border-slate-200 bg-slate-50 p-3"><strong>{{ selected?.numero }}</strong><span class="ml-2 text-sm text-slate-500">{{ selected?.fournisseur?.nom }}</span></div>
        <div class="grid gap-3 md:grid-cols-2">
          <label class="field-label">Entrepôt<select v-model.number="receptionForm.entrepot_id" class="input" required @change="receptionForm.emplacement_id = null"><option :value="null">Choisir</option><option v-for="e in referentiels.entrepots" :key="e.id" :value="e.id">{{ e.code }} - {{ e.libelle }}</option></select></label>
          <label class="field-label">Emplacement<select v-model.number="receptionForm.emplacement_id" class="input"><option :value="null">Sans emplacement</option><option v-for="e in receptionEmplacements" :key="e.id" :value="e.id">{{ e.label }}</option></select></label>
          <label class="field-label">Date réception<input v-model="receptionForm.date_reception" type="date" class="input" required /></label>
          <label class="field-label">Notes<input v-model="receptionForm.notes" class="input" placeholder="Bon livraison, réserve..." /></label>
        </div>
        <div class="overflow-x-auto rounded-lg border border-slate-200">
          <table class="w-full"><thead><tr><th>Produit</th><th class="text-right">Commandé</th><th class="text-right">Déjà reçu</th><th class="text-right">Reliquat</th><th class="text-right">À recevoir</th></tr></thead><tbody>
            <tr v-for="line in receptionForm.lignes" :key="line.ligne_id"><td><strong>{{ line.designation }}</strong><p class="text-xs text-slate-500">{{ line.reference }}</p></td><td class="text-right">{{ number(line.commande) }}</td><td class="text-right">{{ number(line.deja_recu) }}</td><td class="text-right">{{ number(line.restant) }}</td><td><input v-model.number="line.quantite" type="number" min="0" :max="line.restant" step="0.001" class="input ml-auto w-32 text-right" /></td></tr>
          </tbody></table>
        </div>
        <div class="flex justify-end gap-2"><button type="button" class="btn-secondary" @click="showReception = false">Annuler</button><button class="btn-primary inline-flex items-center gap-2" :disabled="saving"><PackageCheck :size="18" /> Enregistrer la réception</button></div>
      </form>
    </AppModal>

    <AppModal v-model="showInvoice" title="Générer la facture fournisseur" size="md">
      <form class="space-y-4" @submit.prevent="saveInvoice">
        <div class="rounded-lg border border-violet-200 bg-violet-50 p-3 text-sm text-violet-900">
          <strong>{{ selected?.numero }}</strong>
          <span class="ml-2">{{ selected?.fournisseur?.nom }}</span>
          <p class="mt-1">Montant à facturer : <strong>{{ money(selected?.total_ttc) }}</strong></p>
        </div>
        <div class="grid gap-3 md:grid-cols-2">
          <label class="field-label md:col-span-2">Référence de la facture fournisseur
            <input v-model="invoiceForm.reference_fournisseur" class="input" placeholder="N° figurant sur la facture reçue" required />
          </label>
          <label class="field-label">Date facture
            <input v-model="invoiceForm.date_facture" type="date" class="input" required />
          </label>
          <label class="field-label">Date échéance
            <input v-model="invoiceForm.date_echeance" type="date" class="input" />
          </label>
          <label class="field-label">Statut
            <select v-model="invoiceForm.statut" class="input">
              <option value="validee">Validée et comptabilisée</option>
              <option value="brouillon">Brouillon</option>
            </select>
          </label>
          <label class="field-label md:col-span-2">Notes
            <textarea v-model="invoiceForm.notes" rows="3" class="input" placeholder="Informations complémentaires"></textarea>
          </label>
        </div>
        <p class="text-xs text-slate-500">Le fournisseur, les montants et la devise proviennent automatiquement de la commande et ne peuvent pas être altérés.</p>
        <div class="flex justify-end gap-2">
          <button type="button" class="btn-secondary" @click="showInvoice = false">Annuler</button>
          <button class="btn-primary" :disabled="saving">{{ saving ? 'Génération...' : 'Générer la facture' }}</button>
        </div>
      </form>
    </AppModal>

    <AppModal v-model="showReturn" title="Retour fournisseur" size="lg">
      <form class="space-y-4" @submit.prevent="saveReturn">
        <div class="rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm text-orange-900">
          <strong>{{ selectedReturnReception?.numero }}</strong>
          <span class="ml-2">{{ selected?.fournisseur?.nom }}</span>
          <p class="mt-1">Le stock sera diminué dès la validation du retour.</p>
        </div>
        <div class="grid gap-3 md:grid-cols-3">
          <label class="field-label">Date retour<input v-model="returnForm.date_retour" type="date" class="input" required /></label>
          <label class="field-label">Motif
            <select v-model="returnForm.motif" class="input" required>
              <option value="defectueux">Produit défectueux</option>
              <option value="non_conforme">Non conforme</option>
              <option value="excedent">Excédent livré</option>
              <option value="erreur">Erreur de commande</option>
              <option value="autre">Autre</option>
            </select>
          </label>
          <label class="field-label">Notes<input v-model="returnForm.notes" class="input" placeholder="Précisions sur le retour" /></label>
        </div>
        <div class="overflow-x-auto rounded-lg border border-slate-200">
          <table class="w-full"><thead><tr><th>Produit</th><th class="text-right">Reçu</th><th class="text-right">Déjà retourné</th><th class="text-right">Disponible</th><th class="text-right">À retourner</th></tr></thead><tbody>
            <tr v-for="line in returnForm.lignes" :key="line.reception_ligne_id">
              <td><strong>{{ line.designation }}</strong><p class="text-xs text-slate-500">{{ line.reference }}</p></td>
              <td class="text-right">{{ number(line.recu) }}</td><td class="text-right">{{ number(line.deja_retourne) }}</td><td class="text-right">{{ number(line.disponible) }}</td>
              <td><input v-model.number="line.quantite" type="number" min="0" :max="line.disponible" step="0.001" class="input ml-auto w-32 text-right" /></td>
            </tr>
          </tbody></table>
        </div>
        <div class="flex justify-end gap-2"><button type="button" class="btn-secondary" @click="showReturn = false; showDetails = true">Annuler</button><button class="btn-primary" :disabled="saving">{{ saving ? 'Validation...' : 'Valider le retour' }}</button></div>
      </form>
    </AppModal>

    <AppModal v-model="showCredit" title="Générer l'avoir fournisseur" size="md">
      <form class="space-y-4" @submit.prevent="saveCredit">
        <div class="rounded-lg border border-violet-200 bg-violet-50 p-3 text-sm text-violet-900">
          <strong>{{ selectedReturn?.numero }}</strong>
          <p class="mt-1">Montant de l'avoir : <strong>{{ money(selectedReturn?.total_ttc) }}</strong></p>
          <p>L'avoir réduira automatiquement le reste à payer de la facture liée.</p>
        </div>
        <label class="field-label">Référence fournisseur<input v-model="creditForm.reference_fournisseur" class="input" placeholder="Référence figurant sur l'avoir reçu" /></label>
        <label class="field-label">Date avoir<input v-model="creditForm.date_avoir" type="date" class="input" required /></label>
        <label class="field-label">Notes<textarea v-model="creditForm.notes" rows="3" class="input"></textarea></label>
        <div class="flex justify-end gap-2"><button type="button" class="btn-secondary" @click="showCredit = false; showDetails = true">Annuler</button><button class="btn-primary" :disabled="saving">{{ saving ? 'Génération...' : 'Générer et comptabiliser' }}</button></div>
      </form>
    </AppModal>

    <AppModal v-model="showEvaluation" title="Évaluer le fournisseur" size="md">
      <form class="space-y-4" @submit.prevent="saveEvaluation">
        <div class="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"><strong>{{ selectedEvaluationOrder?.numero }}</strong><span class="ml-2">{{ selectedEvaluationOrder?.fournisseur?.nom }}</span></div>
        <label class="field-label">Date d'évaluation<input v-model="evaluationForm.date_evaluation" type="date" class="input" required /></label>
        <div class="grid grid-cols-2 gap-3">
          <label v-for="criterion in evaluationCriteria" :key="criterion.key" class="field-label">{{ criterion.label }}
            <select v-model.number="evaluationForm[criterion.key]" class="input" required><option v-for="score in [1,2,3,4,5]" :key="score" :value="score">{{ score }} / 5</option></select>
          </label>
        </div>
        <label class="field-label">Commentaire<textarea v-model="evaluationForm.commentaire" rows="4" class="input" placeholder="Points forts, difficultés, actions à suivre..."></textarea></label>
        <div class="rounded-lg bg-slate-50 p-3 text-center"><span class="text-sm text-slate-500">Note moyenne</span><strong class="ml-2 text-xl text-amber-700">{{ evaluationAverage }} / 5</strong></div>
        <div class="flex justify-end gap-2"><button type="button" class="btn-secondary" @click="showEvaluation = false; showDetails = Boolean(selected)">Annuler</button><button class="btn-primary" :disabled="saving">{{ saving ? 'Enregistrement...' : 'Enregistrer l’évaluation' }}</button></div>
      </form>
    </AppModal>

    <AppModal v-model="showDetails" title="Détail du bon de commande" size="lg">
      <div v-if="selected" class="space-y-4">
        <div class="grid grid-cols-2 gap-3 md:grid-cols-4"><div><span class="caption">Numéro</span><strong>{{ selected.numero }}</strong></div><div><span class="caption">Fournisseur</span><strong>{{ selected.fournisseur?.nom }}</strong></div><div><span class="caption">Statut</span><span class="badge" :class="statusClass(selected.statut)">{{ statusLabel(selected.statut) }}</span></div><div><span class="caption">Total TTC</span><strong>{{ money(selected.total_ttc) }}</strong></div></div>
        <div><button class="btn-secondary inline-flex items-center gap-2" @click="downloadOrderPdf(selected)"><FileDown :size="17" /> Télécharger le bon de commande</button></div>
        <div class="overflow-x-auto rounded-lg border border-slate-200"><table class="w-full"><thead><tr><th>Produit</th><th class="text-right">Qté</th><th class="text-right">Reçue</th><th class="text-right">PU HT</th><th class="text-right">Total TTC</th></tr></thead><tbody><tr v-for="line in selected.lignes" :key="line.id"><td>{{ line.reference }} - {{ line.designation }}</td><td class="text-right">{{ number(line.quantite) }}</td><td class="text-right">{{ number(line.quantite_recue) }}</td><td class="text-right">{{ money(line.prix_unitaire_ht) }}</td><td class="text-right">{{ money(line.total_ttc) }}</td></tr></tbody></table></div>
        <div v-if="selected.facture_fournisseur" class="rounded-lg border border-violet-200 bg-violet-50 p-3 text-sm text-violet-900">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <span>Facture liée : <strong class="font-mono">{{ selected.facture_fournisseur.numero }}</strong> · {{ statusInvoiceLabel(selected.facture_fournisseur.statut) }} · Avoirs {{ money(selected.facture_fournisseur.montant_avoirs) }} · Reste {{ money(selected.facture_fournisseur.reste_a_payer) }}</span>
            <button class="font-semibold text-violet-700 hover:underline" @click="goToInvoice(selected.facture_fournisseur)">Ouvrir la facture</button>
          </div>
        </div>
        <div class="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <span v-if="selected.evaluation_fournisseur">Évaluation fournisseur : <strong>{{ selected.evaluation_fournisseur.note_moyenne }} / 5</strong> · {{ selected.evaluation_fournisseur.evaluateur?.name }}</span>
            <span v-else>Ce fournisseur n'a pas encore été évalué pour cette commande.</span>
            <button v-if="selected.statut === 'recue' && canEvaluate" class="font-semibold text-amber-800 hover:underline" @click="openEvaluation(selected)">{{ selected.evaluation_fournisseur ? 'Modifier' : 'Évaluer' }}</button>
          </div>
        </div>
        <div v-if="selected.receptions?.length">
          <h3 class="font-bold text-slate-900">Réceptions et retours</h3>
          <div class="mt-2 divide-y divide-slate-100 rounded-lg border border-slate-200">
            <div v-for="r in selected.receptions" :key="r.id" class="p-3 text-sm">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <span><strong>{{ r.numero }}</strong> · {{ formatDate(r.date_reception) }} · {{ r.entrepot?.libelle }}</span>
                <span class="flex items-center gap-3">
                  <button v-if="canReturn && availableReturnLines(r).length" class="font-semibold text-orange-700 hover:underline" @click="openReturn(r)">Retourner</button>
                  <button class="inline-flex items-center gap-1 font-semibold text-cyan-700 hover:underline" @click="downloadReceptionPdf(r)"><FileDown :size="15" /> PDF BR</button>
                </span>
              </div>
              <div v-if="r.retours?.length" class="mt-3 space-y-2">
                <div v-for="retour in r.retours" :key="retour.id" class="flex flex-wrap items-center justify-between gap-2 rounded-md border border-orange-200 bg-orange-50 p-2 text-orange-900">
                  <span><strong class="font-mono">{{ retour.numero }}</strong> · {{ formatDate(retour.date_retour) }} · {{ motifRetourLabel(retour.motif) }} · {{ money(retour.total_ttc) }}</span>
                  <span v-if="retour.avoir" class="font-semibold text-violet-700">Avoir {{ retour.avoir.numero }}</span>
                  <button v-else-if="canCredit && selected.facture_fournisseur" class="font-semibold text-violet-700 hover:underline" @click="openCredit(retour)">Générer l'avoir</button>
                  <span v-else-if="!selected.facture_fournisseur" class="text-xs text-slate-500">Facture requise pour l'avoir</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppModal>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { FileDown, PackageCheck, Plus, Trash2 } from 'lucide-vue-next'
import api from '@/services/api'
import AppModal from '@/components/AppModal.vue'
import AppPagination from '@/components/AppPagination.vue'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { ouvrirPDF } from '@/services/pdf'

const auth = useAuthStore()
const toast = useToast()
const router = useRouter()
const route = useRoute()
const commandes = ref([])
const selected = ref(null)
const editingId = ref(null)
const saving = ref(false)
const showForm = ref(false)
const showReception = ref(false)
const showInvoice = ref(false)
const showReturn = ref(false)
const showCredit = ref(false)
const showEvaluation = ref(false)
const showDetails = ref(false)
const showPerformance = ref(false)
const showRequests = ref(false)
const showDemandForm = ref(false)
const showDemandReject = ref(false)
const showDemandConvert = ref(false)
const loadingPerformance = ref(false)
const loadingReferentiels = ref(false)
const referentielsError = ref('')
const productSearch = ref('')
const selectedReturnReception = ref(null)
const selectedReturn = ref(null)
const selectedEvaluationOrder = ref(null)
const supplierPerformance = ref([])
const demands = ref([])
const selectedDemand = ref(null)
const editingDemandId = ref(null)
const rejectReason = ref('')
const stats = reactive({ total: 0, a_approuver: 0, a_receptionner: 0, recues_mois: 0, engagement_total: 0 })
const demandStats = reactive({ total: 0, brouillons: 0, a_approuver: 0, approuvees: 0, urgentes: 0 })
const meta = reactive({})
const demandMeta = reactive({})
const referentiels = reactive({ fournisseurs: [], produits: [], entrepots: [] })
const filters = reactive({ search: '', statut: '', fournisseur_id: null, date_from: '', date_to: '' })
const demandFilters = reactive({ search: '', statut: '', priorite: '' })
const statuses = ['brouillon', 'soumise', 'approuvee', 'partiellement_recue', 'recue', 'annulee']
const demandStatuses = ['brouillon', 'soumise', 'approuvee', 'rejetee', 'convertie', 'annulee']
const canApprove = computed(() => ['admin', 'gerant', 'comptable'].includes(auth.user?.role))
const canReceive = computed(() => ['admin', 'gerant', 'magasinier'].includes(auth.user?.role))
const canInvoice = computed(() => ['admin', 'gerant', 'comptable'].includes(auth.user?.role))
const canReturn = computed(() => ['admin', 'gerant', 'magasinier'].includes(auth.user?.role))
const canCredit = computed(() => ['admin', 'gerant', 'comptable'].includes(auth.user?.role))
const canEvaluate = computed(() => ['admin', 'gerant', 'magasinier', 'comptable'].includes(auth.user?.role))
let lineKey = 0
let demandLineKey = 0
const emptyLine = () => ({ key: ++lineKey, produit_id: null, quantite: 1, prix_unitaire_ht: 0, taux_tva: 0 })
const emptyForm = () => ({ fournisseur_id: null, entrepot_id: null, date_commande: new Date().toISOString().slice(0, 10), date_livraison_prevue: '', objet: '', devise: 'XOF', notes: '', lignes: [emptyLine()] })
const emptyDemandLine = () => ({ key: ++demandLineKey, produit_id: null, quantite: 1, prix_estime_ht: 0, notes: '' })
const emptyDemandForm = () => ({ date_demande: new Date().toISOString().slice(0, 10), date_besoin: '', service_demandeur: '', objet: '', priorite: 'normale', justification: '', lignes: [emptyDemandLine()] })
const form = reactive(emptyForm())
const demandForm = reactive(emptyDemandForm())
const receptionForm = reactive({ entrepot_id: null, emplacement_id: null, date_reception: new Date().toISOString().slice(0, 10), notes: '', lignes: [] })
const invoiceForm = reactive({ reference_fournisseur: '', date_facture: new Date().toISOString().slice(0, 10), date_echeance: '', statut: 'validee', notes: '' })
const returnForm = reactive({ date_retour: new Date().toISOString().slice(0, 10), motif: 'defectueux', notes: '', lignes: [] })
const creditForm = reactive({ reference_fournisseur: '', date_avoir: new Date().toISOString().slice(0, 10), notes: '' })
const evaluationForm = reactive({ date_evaluation: new Date().toISOString().slice(0, 10), note_qualite: 3, note_delai: 3, note_prix: 3, note_service: 3, commentaire: '' })
const convertForm = reactive({ fournisseur_id: null, entrepot_id: null, date_commande: new Date().toISOString().slice(0, 10), date_livraison_prevue: '' })
const evaluationCriteria = [{ key: 'note_qualite', label: 'Qualité' }, { key: 'note_delai', label: 'Délais' }, { key: 'note_prix', label: 'Prix' }, { key: 'note_service', label: 'Service' }]

const statCards = computed(() => [
  { key: 'total', label: 'Commandes', value: stats.total, color: 'text-slate-900' },
  { key: 'soumise', label: 'À approuver', value: stats.a_approuver, color: 'text-amber-700' },
  { key: 'approuvee', label: 'À réceptionner', value: stats.a_receptionner, color: 'text-blue-700' },
  { key: 'recue', label: 'Reçues ce mois', value: stats.recues_mois, color: 'text-green-700' },
  { key: 'engagement', label: 'Engagement', value: money(stats.engagement_total), color: 'text-violet-700' },
])
const demandStatCards = computed(() => [
  { label: 'Demandes', value: demandStats.total, color: 'text-slate-900' },
  { label: 'Brouillons', value: demandStats.brouillons, color: 'text-slate-700' },
  { label: 'À approuver', value: demandStats.a_approuver, color: 'text-amber-700' },
  { label: 'Approuvées', value: demandStats.approuvees, color: 'text-green-700' },
  { label: 'Urgentes', value: demandStats.urgentes, color: 'text-red-700' },
])
const orderTotals = computed(() => form.lignes.reduce((totals, line) => { const ht = Number(line.quantite || 0) * Number(line.prix_unitaire_ht || 0); const tva = ht * Number(line.taux_tva || 0) / 100; totals.ht += ht; totals.tva += tva; totals.ttc += ht + tva; return totals }, { ht: 0, tva: 0, ttc: 0 }))
const receptionEmplacements = computed(() => { const warehouse = referentiels.entrepots.find(e => Number(e.id) === Number(receptionForm.entrepot_id)); return (warehouse?.zones || []).flatMap(z => (z.emplacements || []).map(e => ({ id: e.id, label: `${z.libelle} / ${e.code}${e.libelle ? ' - ' + e.libelle : ''}` }))) })
const evaluationAverage = computed(() => number(evaluationCriteria.reduce((sum, criterion) => sum + Number(evaluationForm[criterion.key] || 0), 0) / evaluationCriteria.length))
const performanceSummary = computed(() => { const scored = supplierPerformance.value.filter(item => item.score_global !== null); return { count: supplierPerformance.value.length, averageScore: scored.length ? Math.round(scored.reduce((sum, item) => sum + Number(item.score_global), 0) / scored.length) : null, best: scored[0]?.nom || null } })
const demandEstimatedTotal = computed(() => demandForm.lignes.reduce((sum, line) => sum + demandLineTotal(line), 0))

function money(value) { return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Number(value || 0))  }
function number(value) { return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 3 }).format(Number(value || 0)) }
function formatDate(value) { return value ? new Date(value).toLocaleDateString('fr-FR') : '-' }
function statusLabel(status) { return { brouillon: 'Brouillon', soumise: 'Soumise', approuvee: 'Approuvée', partiellement_recue: 'Partiellement reçue', recue: 'Reçue', annulee: 'Annulée' }[status] || status }
function statusClass(status) { return { brouillon: 'bg-slate-100 text-slate-700', soumise: 'bg-amber-100 text-amber-800', approuvee: 'bg-blue-100 text-blue-800', partiellement_recue: 'bg-cyan-100 text-cyan-800', recue: 'bg-green-100 text-green-800', annulee: 'bg-red-100 text-red-700' }[status] || 'bg-slate-100 text-slate-700' }
function statusInvoiceLabel(status) { return { brouillon: 'Brouillon', validee: 'Validée', partiellement_payee: 'Partiellement payée', payee: 'Payée', annulee: 'Annulée' }[status] || status }
function performanceClass(score) { if (score === null) return 'bg-slate-100 text-slate-600'; if (score >= 80) return 'bg-green-100 text-green-800'; if (score >= 60) return 'bg-amber-100 text-amber-800'; return 'bg-red-100 text-red-800' }
function demandStatusLabel(status) { return { brouillon: 'Brouillon', soumise: 'Soumise', approuvee: 'Approuvée', rejetee: 'Rejetée', convertie: 'Convertie', annulee: 'Annulée' }[status] || status }
function demandStatusClass(status) { return { brouillon: 'bg-slate-100 text-slate-700', soumise: 'bg-amber-100 text-amber-800', approuvee: 'bg-green-100 text-green-800', rejetee: 'bg-red-100 text-red-700', convertie: 'bg-blue-100 text-blue-800', annulee: 'bg-slate-100 text-slate-500' }[status] || 'bg-slate-100 text-slate-700' }
function priorityLabel(value) { return { basse: 'Basse', normale: 'Normale', haute: 'Haute', urgente: 'Urgente' }[value] || value }
function priorityClass(value) { return { basse: 'bg-slate-100 text-slate-600', normale: 'bg-blue-100 text-blue-700', haute: 'bg-orange-100 text-orange-700', urgente: 'bg-red-100 text-red-700' }[value] || 'bg-slate-100 text-slate-600' }
function lineTotal(line) { const ht = Number(line.quantite || 0) * Number(line.prix_unitaire_ht || 0); return ht * (1 + Number(line.taux_tva || 0) / 100) }
function visibleProducts(line) { const term = productSearch.value.trim().toLowerCase(); const filtered = !term ? referentiels.produits : referentiels.produits.filter(p => `${p.reference} ${p.libelle}`.toLowerCase().includes(term)); const current = referentiels.produits.find(p => Number(p.id) === Number(line.produit_id)); return current && !filtered.some(p => p.id === current.id) ? [current, ...filtered] : filtered }
function selectProduct(line) { const product = referentiels.produits.find(p => Number(p.id) === Number(line.produit_id)); if (!product) return; line.prix_unitaire_ht = Number(product.prix_achat_ht || 0); line.taux_tva = Number(product.taux_tva || 0) }
function addLine() { form.lignes.push(emptyLine()) }
function removeLine(index) { if (form.lignes.length === 1) return toast.error('Le bon doit contenir au moins une ligne.'); form.lignes.splice(index, 1) }
function moveLine(index, direction) { const target = index + direction; if (target < 0 || target >= form.lignes.length) return; const [line] = form.lignes.splice(index, 1); form.lignes.splice(target, 0, line) }
function demandLineTotal(line) { const product = referentiels.produits.find(item => Number(item.id) === Number(line.produit_id)); return Number(line.quantite || 0) * Number(line.prix_estime_ht || 0) * (1 + Number(product?.taux_tva || 0) / 100) }
function selectDemandProduct(line) { const product = referentiels.produits.find(item => Number(item.id) === Number(line.produit_id)); if (product) line.prix_estime_ht = Number(product.prix_achat_ht || 0) }
function addDemandLine() { demandForm.lignes.push(emptyDemandLine()) }
function removeDemandLine(index) { if (demandForm.lignes.length === 1) return toast.error('La demande doit contenir au moins une ligne.'); demandForm.lignes.splice(index, 1) }
function moveDemandLine(index, direction) { const target = index + direction; if (target < 0 || target >= demandForm.lignes.length) return; const [line] = demandForm.lignes.splice(index, 1); demandForm.lignes.splice(target, 0, line) }
function applyStatFilter(key) { filters.statut = key === 'total' || key === 'engagement' ? '' : key; loadCommandes(1) }

function normalizeListPayload(payload) { return Array.isArray(payload?.data) ? payload.data : (Array.isArray(payload) ? payload : []) }
function normalizeSupplier(item) { return { id: item.id, code: item.code || '', nom: item.nom || item.name || '', email: item.email || '', telephone: item.telephone || item.mobile || '', delai_paiement_jours: item.delai_paiement_jours ?? null } }
function normalizeProduct(item) { return { id: item.id, reference: item.reference || '', libelle: item.libelle || item.designation || '', prix_achat_ht: item.prix_achat_ht ?? 0, taux_tva: item.taux_tva ?? 0, unite: item.unite || '', gere_stock: Boolean(item.gere_stock), fournisseur_id: item.fournisseur_id ?? null } }
function mergeUniqueById(lists) { const map = new Map(); lists.flat().filter(item => item?.id).forEach(item => map.set(Number(item.id), item)); return Array.from(map.values()) }

async function fetchSupplierType(type, params = {}) {
  const { data } = await api.get('/clients', { params: { type, per_page: 500, ...params } })
  return normalizeListPayload(data).map(normalizeSupplier)
}

async function loadFallbackSuppliers() {
  const types = ['fournisseur', 'client_fournisseur', 'client']
  const activeResults = await Promise.allSettled(types.map(type => fetchSupplierType(type, { statut: 'actif' })))
  const activeSuppliers = mergeUniqueById(activeResults.filter(result => result.status === 'fulfilled').map(result => result.value))
  if (activeSuppliers.length) return activeSuppliers

  const allResults = await Promise.allSettled(types.map(type => fetchSupplierType(type)))
  return mergeUniqueById(allResults.filter(result => result.status === 'fulfilled').map(result => result.value))
}

async function loadFallbackProducts() {
  const fetchProducts = async (params) => {
    const { data } = await api.get('/produits', { params: { per_page: 500, sort_by: 'libelle', ...params } })
    return normalizeListPayload(data).map(normalizeProduct)
  }
  const actifs = await fetchProducts({ actifs_seulement: 1 })
  return actifs.length ? actifs : fetchProducts({})
}

async function loadReferentielsFallback(error) {
  const [suppliersResult, productsResult] = await Promise.allSettled([
    loadFallbackSuppliers(),
    loadFallbackProducts(),
  ])

  if (suppliersResult.status === 'fulfilled' && suppliersResult.value.length) {
    referentiels.fournisseurs = suppliersResult.value
  }
  if (productsResult.status === 'fulfilled' && productsResult.value.length) {
    referentiels.produits = productsResult.value
  }

  if (!referentiels.fournisseurs.length || !referentiels.produits.length) {
    referentielsError.value = error?.response?.data?.message || 'Impossible de charger complètement les fournisseurs et produits. Vérifiez les données en ligne ou rechargez la page.'
    toast.error(referentielsError.value)
  }
}

async function loadReferentiels() {
  loadingReferentiels.value = true
  referentielsError.value = ''
  try {
    const { data } = await api.get('/achats/referentiels')
    referentiels.fournisseurs = Array.isArray(data?.fournisseurs) ? data.fournisseurs : []
    referentiels.produits = Array.isArray(data?.produits) ? data.produits : []
    referentiels.entrepots = Array.isArray(data?.entrepots) ? data.entrepots : []
    if (!referentiels.fournisseurs.length || !referentiels.produits.length) {
      await loadReferentielsFallback()
    }
  } catch (error) {
    await loadReferentielsFallback(error)
  } finally {
    loadingReferentiels.value = false
  }
}
async function loadStats() { Object.assign(stats, (await api.get('/achats/stats')).data) }
async function loadPerformance() { loadingPerformance.value = true; try { supplierPerformance.value = (await api.get('/achats/fournisseurs-performance')).data.data || [] } catch (e) { toast.error(e.response?.data?.message || 'Impossible de charger la performance fournisseurs.') } finally { loadingPerformance.value = false } }
async function togglePerformance() { showPerformance.value = !showPerformance.value; if (showPerformance.value && !supplierPerformance.value.length) await loadPerformance() }
async function loadDemandStats() { Object.assign(demandStats, (await api.get('/achats/demandes/stats')).data) }
async function loadDemands(page = 1) { try { const { data } = await api.get('/achats/demandes', { params: { page, per_page: 20, ...demandFilters } }); demands.value = data.data || []; Object.assign(demandMeta, data) } catch (e) { toast.error(e.response?.data?.message || 'Impossible de charger les demandes d’achat.') } }
async function toggleRequests() { showRequests.value = !showRequests.value; if (showRequests.value) { showPerformance.value = false; await Promise.all([loadDemands(), loadDemandStats()]) } }
async function refreshDemands() { await Promise.all([loadDemands(demandMeta.current_page || 1), loadDemandStats()]) }
function openDemandCreate() { editingDemandId.value = null; Object.assign(demandForm, emptyDemandForm()); showDemandForm.value = true }
async function editDemand(demand) { try { const { data } = await api.get('/achats/demandes/' + demand.id); editingDemandId.value = demand.id; Object.assign(demandForm, { date_demande: String(data.date_demande).slice(0, 10), date_besoin: data.date_besoin ? String(data.date_besoin).slice(0, 10) : '', service_demandeur: data.service_demandeur || '', objet: data.objet, priorite: data.priorite, justification: data.justification || '', lignes: data.lignes.map(line => ({ key: ++demandLineKey, produit_id: line.produit_id, quantite: Number(line.quantite), prix_estime_ht: Number(line.prix_estime_ht), notes: line.notes || '' })) }); showDemandForm.value = true } catch (e) { toast.error(e.response?.data?.message || 'Chargement impossible.') } }
async function saveDemand() { saving.value = true; try { const payload = { ...demandForm, date_besoin: demandForm.date_besoin || null, service_demandeur: demandForm.service_demandeur || null, justification: demandForm.justification || null, lignes: demandForm.lignes.map(({ produit_id, quantite, prix_estime_ht, notes }) => ({ produit_id, quantite, prix_estime_ht, notes: notes || null })) }; if (editingDemandId.value) await api.put('/achats/demandes/' + editingDemandId.value, payload); else await api.post('/achats/demandes', payload); toast.success('Demande d’achat enregistrée.'); showDemandForm.value = false; await refreshDemands() } catch (e) { toast.error(Object.values(e.response?.data?.errors || {})[0]?.[0] || e.response?.data?.message || 'Enregistrement impossible.') } finally { saving.value = false } }
async function submitDemand(demand) { if (!window.confirm('Soumettre ' + demand.numero + ' pour approbation ?')) return; try { await api.post('/achats/demandes/' + demand.id + '/soumettre'); toast.success('Demande soumise.'); await refreshDemands() } catch (e) { toast.error(e.response?.data?.message || 'Soumission impossible.') } }
async function approveDemand(demand) { if (!window.confirm('Approuver ' + demand.numero + ' ?')) return; try { await api.post('/achats/demandes/' + demand.id + '/approuver'); toast.success('Demande approuvée.'); await refreshDemands() } catch (e) { toast.error(e.response?.data?.message || 'Approbation impossible.') } }
function openRejectDemand(demand) { selectedDemand.value = demand; rejectReason.value = ''; showDemandReject.value = true }
async function rejectDemand() { saving.value = true; try { await api.post('/achats/demandes/' + selectedDemand.value.id + '/rejeter', { motif_rejet: rejectReason.value }); toast.success('Demande rejetée.'); showDemandReject.value = false; await refreshDemands() } catch (e) { toast.error(e.response?.data?.message || 'Rejet impossible.') } finally { saving.value = false } }
function openConvertDemand(demand) { selectedDemand.value = demand; Object.assign(convertForm, { fournisseur_id: null, entrepot_id: null, date_commande: new Date().toISOString().slice(0, 10), date_livraison_prevue: demand.date_besoin ? String(demand.date_besoin).slice(0, 10) : '' }); showDemandConvert.value = true }
async function convertDemand() { saving.value = true; try { const { data } = await api.post('/achats/demandes/' + selectedDemand.value.id + '/convertir', { ...convertForm, entrepot_id: convertForm.entrepot_id || null, date_livraison_prevue: convertForm.date_livraison_prevue || null }); toast.success('Bon de commande ' + data.numero + ' créé en brouillon.'); showDemandConvert.value = false; await Promise.all([refreshDemands(), refresh()]) } catch (e) { toast.error(Object.values(e.response?.data?.errors || {})[0]?.[0] || e.response?.data?.message || 'Conversion impossible.') } finally { saving.value = false } }
async function deleteDemand(demand) { if (!window.confirm('Supprimer le brouillon ' + demand.numero + ' ?')) return; try { await api.delete('/achats/demandes/' + demand.id); toast.success('Demande supprimée.'); await refreshDemands() } catch (e) { toast.error(e.response?.data?.message || 'Suppression impossible.') } }
async function loadCommandes(page = 1) { try { const { data } = await api.get('/achats/commandes', { params: { page, per_page: 20, ...filters, fournisseur_id: filters.fournisseur_id || undefined } }); commandes.value = data.data || []; Object.assign(meta, data) } catch (e) { toast.error(e.response?.data?.message || 'Impossible de charger les achats.') } }
async function refresh(page = meta.current_page || 1) { await Promise.all([loadCommandes(page), loadStats()]) }
function openCreate() { editingId.value = null; Object.assign(form, emptyForm()); productSearch.value = ''; showForm.value = true }
async function editCommande(row) { try { const { data } = await api.get(`/achats/commandes/${row.id}`); editingId.value = row.id; Object.assign(form, { fournisseur_id: data.fournisseur_id, entrepot_id: data.entrepot_id || null, date_commande: String(data.date_commande).slice(0, 10), date_livraison_prevue: data.date_livraison_prevue ? String(data.date_livraison_prevue).slice(0, 10) : '', objet: data.objet || '', devise: data.devise || 'XOF', notes: data.notes || '', lignes: data.lignes.map(l => ({ key: ++lineKey, produit_id: l.produit_id, quantite: Number(l.quantite), prix_unitaire_ht: Number(l.prix_unitaire_ht), taux_tva: Number(l.taux_tva) })) }); showForm.value = true } catch (e) { toast.error(e.response?.data?.message || 'Chargement impossible.') } }
async function saveCommande() { saving.value = true; try { const payload = { ...form, date_livraison_prevue: form.date_livraison_prevue || null, entrepot_id: form.entrepot_id || null, lignes: form.lignes.map(({ produit_id, quantite, prix_unitaire_ht, taux_tva }) => ({ produit_id, quantite, prix_unitaire_ht, taux_tva })) }; if (editingId.value) await api.put(`/achats/commandes/${editingId.value}`, payload); else await api.post('/achats/commandes', payload); toast.success('Bon de commande enregistré.'); showForm.value = false; await refresh() } catch (e) { toast.error(Object.values(e.response?.data?.errors || {})[0]?.[0] || e.response?.data?.message || 'Enregistrement impossible.') } finally { saving.value = false } }
async function runAction(row, action, message) { try { await api.post(`/achats/commandes/${row.id}/${action}`); toast.success(message); await refresh() } catch (e) { toast.error(Object.values(e.response?.data?.errors || {})[0]?.[0] || e.response?.data?.message || 'Action impossible.') } }
function submitCommande(row) { if (window.confirm(`Soumettre ${row.numero} pour approbation ?`)) runAction(row, 'soumettre', 'Commande soumise.') }
function approveCommande(row) { if (window.confirm(`Approuver ${row.numero} ?`)) runAction(row, 'approuver', 'Commande approuvée.') }
async function deleteCommande(row) { if (!window.confirm(`Supprimer le brouillon ${row.numero} ?`)) return; try { await api.delete(`/achats/commandes/${row.id}`); toast.success('Bon de commande supprimé.'); await refresh() } catch (e) { toast.error(e.response?.data?.message || 'Suppression impossible.') } }
async function openDetails(row) { try { selected.value = (await api.get(`/achats/commandes/${row.id}`)).data; showDetails.value = true } catch (e) { toast.error(e.response?.data?.message || 'Chargement impossible.') } }
async function openReception(row) { try { selected.value = (await api.get(`/achats/commandes/${row.id}`)).data; const lines = selected.value.lignes.map(l => { const restant = Math.max(0, Number(l.quantite) - Number(l.quantite_recue)); return { ligne_id: l.id, reference: l.reference, designation: l.designation, commande: Number(l.quantite), deja_recu: Number(l.quantite_recue), restant, quantite: restant } }).filter(l => l.restant > 0); Object.assign(receptionForm, { entrepot_id: selected.value.entrepot_id || referentiels.entrepots[0]?.id || null, emplacement_id: null, date_reception: new Date().toISOString().slice(0, 10), notes: '', lignes: lines }); showReception.value = true } catch (e) { toast.error(e.response?.data?.message || 'Chargement impossible.') } }
async function saveReception() { const lines = receptionForm.lignes.filter(l => Number(l.quantite || 0) > 0).map(l => ({ ligne_id: l.ligne_id, quantite: Number(l.quantite) })); if (!lines.length) return toast.error('Saisissez au moins une quantité reçue.'); saving.value = true; try { await api.post(`/achats/commandes/${selected.value.id}/receptions`, { entrepot_id: receptionForm.entrepot_id, emplacement_id: receptionForm.emplacement_id || null, date_reception: receptionForm.date_reception, notes: receptionForm.notes || null, lignes: lines }); toast.success('Réception enregistrée et stock mis à jour.'); showReception.value = false; await refresh() } catch (e) { toast.error(Object.values(e.response?.data?.errors || {})[0]?.[0] || e.response?.data?.message || 'Réception impossible.') } finally { saving.value = false } }

async function openInvoiceCreate(row) {
  try {
    selected.value = (await api.get(`/achats/commandes/${row.id}`)).data
    Object.assign(invoiceForm, {
      reference_fournisseur: '',
      date_facture: new Date().toISOString().slice(0, 10),
      date_echeance: '',
      statut: 'validee',
      notes: `Facture liée à la commande ${selected.value.numero}.`,
    })
    showInvoice.value = true
  } catch (e) {
    toast.error(e.response?.data?.message || 'Chargement impossible.')
  }
}

async function saveInvoice() {
  saving.value = true
  try {
    const { data } = await api.post(`/achats/commandes/${selected.value.id}/facture`, {
      ...invoiceForm,
      date_echeance: invoiceForm.date_echeance || null,
      notes: invoiceForm.notes || null,
    })
    toast.success(`Facture fournisseur ${data.numero} générée.`)
    showInvoice.value = false
    await refresh()
  } catch (e) {
    toast.error(Object.values(e.response?.data?.errors || {})[0]?.[0] || e.response?.data?.message || 'Génération de la facture impossible.')
  } finally {
    saving.value = false
  }
}


function motifRetourLabel(value) {
  return { defectueux: 'Défectueux', non_conforme: 'Non conforme', excedent: 'Excédent', erreur: 'Erreur', autre: 'Autre' }[value] || value
}

function availableReturnLines(reception) {
  const returned = new Map()
  for (const retour of reception.retours || []) {
    if (retour.statut !== 'valide') continue
    for (const line of retour.lignes || []) {
      returned.set(Number(line.reception_ligne_id), (returned.get(Number(line.reception_ligne_id)) || 0) + Number(line.quantite || 0))
    }
  }
  return (reception.lignes || []).map(line => {
    const dejaRetourne = returned.get(Number(line.id)) || 0
    const recu = Number(line.quantite || 0)
    const commandeLine = line.commande_ligne || {}
    return {
      reception_ligne_id: line.id,
      reference: commandeLine.reference || commandeLine.produit?.reference || '',
      designation: commandeLine.designation || commandeLine.produit?.libelle || 'Produit',
      recu,
      deja_retourne: dejaRetourne,
      disponible: Math.max(0, recu - dejaRetourne),
      quantite: 0,
    }
  }).filter(line => line.disponible > 0.0001)
}

function openReturn(reception) {
  selectedReturnReception.value = reception
  Object.assign(returnForm, { date_retour: new Date().toISOString().slice(0, 10), motif: 'defectueux', notes: '', lignes: availableReturnLines(reception) })
  showDetails.value = false
  showReturn.value = true
}

async function saveReturn() {
  const lignes = returnForm.lignes.filter(line => Number(line.quantite || 0) > 0).map(line => ({ reception_ligne_id: line.reception_ligne_id, quantite: Number(line.quantite) }))
  if (!lignes.length) return toast.error('Saisissez au moins une quantité à retourner.')
  saving.value = true
  try {
    await api.post('/achats/receptions/' + selectedReturnReception.value.id + '/retours', {
      date_retour: returnForm.date_retour, motif: returnForm.motif, notes: returnForm.notes || null, lignes,
    })
    toast.success('Retour fournisseur enregistré et stock corrigé.')
    showReturn.value = false
    await refresh()
    await openDetails({ id: selected.value.id })
  } catch (e) {
    toast.error(Object.values(e.response?.data?.errors || {})[0]?.[0] || e.response?.data?.message || 'Retour impossible.')
  } finally {
    saving.value = false
  }
}

function openCredit(retour) {
  selectedReturn.value = retour
  Object.assign(creditForm, { reference_fournisseur: '', date_avoir: new Date().toISOString().slice(0, 10), notes: 'Avoir lié au retour ' + retour.numero + '.' })
  showDetails.value = false
  showCredit.value = true
}

async function saveCredit() {
  saving.value = true
  try {
    const { data } = await api.post('/achats/retours/' + selectedReturn.value.id + '/avoir', {
      ...creditForm, reference_fournisseur: creditForm.reference_fournisseur || null, notes: creditForm.notes || null,
    })
    toast.success('Avoir fournisseur ' + data.numero + ' généré et comptabilisé.')
    showCredit.value = false
    await refresh()
    await openDetails({ id: selected.value.id })
  } catch (e) {
    toast.error(Object.values(e.response?.data?.errors || {})[0]?.[0] || e.response?.data?.message || 'Génération de l avoir impossible.')
  } finally {
    saving.value = false
  }
}

function openEvaluation(order) {
  selectedEvaluationOrder.value = order
  const evaluation = order.evaluation_fournisseur
  Object.assign(evaluationForm, {
    date_evaluation: evaluation?.date_evaluation ? String(evaluation.date_evaluation).slice(0, 10) : new Date().toISOString().slice(0, 10),
    note_qualite: Number(evaluation?.note_qualite || 3), note_delai: Number(evaluation?.note_delai || 3),
    note_prix: Number(evaluation?.note_prix || 3), note_service: Number(evaluation?.note_service || 3), commentaire: evaluation?.commentaire || '',
  })
  showDetails.value = false
  showEvaluation.value = true
}

async function saveEvaluation() {
  saving.value = true
  try {
    await api.put('/achats/commandes/' + selectedEvaluationOrder.value.id + '/evaluation', { ...evaluationForm, commentaire: evaluationForm.commentaire || null })
    toast.success('Évaluation fournisseur enregistrée.')
    showEvaluation.value = false
    await refresh()
    if (showPerformance.value) await loadPerformance()
    if (selected.value?.id === selectedEvaluationOrder.value.id) await openDetails({ id: selected.value.id })
  } catch (e) {
    toast.error(Object.values(e.response?.data?.errors || {})[0]?.[0] || e.response?.data?.message || 'Évaluation impossible.')
  } finally { saving.value = false }
}

function goToInvoice(invoice) {
  router.push({ path: '/fournisseurs-reglements', query: { search: invoice.numero } })
}

async function downloadOrderPdf(commande) {
  try {
    await ouvrirPDF(`/achats/commandes/${commande.id}/pdf`, `${commande.numero}.pdf`)
  } catch (e) {
    toast.error('Impossible de générer le bon de commande PDF.')
  }
}

async function downloadReceptionPdf(reception) {
  try {
    await ouvrirPDF(`/achats/receptions/${reception.id}/pdf`, `${reception.numero}.pdf`)
  } catch (e) {
    toast.error('Impossible de générer le bon de réception PDF.')
  }
}

async function openFromRoute(id) {
  if (id) await openDetails({ id })
}

watch(() => route.query.open, (id, previousId) => {
  if (id && id !== previousId) openFromRoute(id)
})

watch(() => route.query.demandes, async value => {
  if (value && !showRequests.value) {
    showRequests.value = true
    showPerformance.value = false
    await Promise.all([loadDemands(), loadDemandStats()])
  }
})

onMounted(async () => {
  await Promise.all([loadReferentiels(), loadStats(), loadCommandes()])
  if (route.query.demandes) {
    showRequests.value = true
    await Promise.all([loadDemands(), loadDemandStats()])
  }
  await openFromRoute(route.query.open)
})
</script>

<style scoped>
th { @apply whitespace-nowrap bg-slate-50 px-3 py-2 text-left text-xs uppercase text-slate-500; }
td { @apply whitespace-nowrap border-t border-slate-100 px-3 py-3 text-sm text-slate-700; }
.field-label { @apply block text-sm font-medium text-slate-700; }
.field-label .input { @apply mt-1; }
.caption { @apply mb-1 block text-xs uppercase text-slate-500; }
</style>
