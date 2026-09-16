<template>
  <div>
    <!-- Onglets -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
      <div class="flex overflow-x-auto border-b border-gray-200">
        <button @click="onglet = 'overview'" class="px-6 py-3 text-sm font-medium transition-colors"
                :class="onglet === 'overview' ? 'text-xelltekk-700 border-b-2 border-xelltekk-700' : 'text-gray-500 hover:text-gray-700'">
          📊 Vue d’ensemble
        </button>
        <button @click="onglet = 'valorisation'" class="px-6 py-3 text-sm font-medium transition-colors"
                :class="onglet === 'valorisation' ? 'text-xelltekk-700 border-b-2 border-xelltekk-700' : 'text-gray-500 hover:text-gray-700'">
          💰 Valorisation
        </button>
        <button @click="onglet = 'stock'" class="px-6 py-3 text-sm font-medium transition-colors"
                :class="onglet === 'stock' ? 'text-xelltekk-700 border-b-2 border-xelltekk-700' : 'text-gray-500 hover:text-gray-700'">
          📦 Stock par emplacement
        </button>
        <button @click="onglet = 'inventaire'" class="px-6 py-3 text-sm font-medium transition-colors"
                :class="onglet === 'inventaire' ? 'text-xelltekk-700 border-b-2 border-xelltekk-700' : 'text-gray-500 hover:text-gray-700'">
          🧮 Inventaire rapide
        </button>
        <button @click="onglet = 'transferts'" class="px-6 py-3 text-sm font-medium transition-colors"
                :class="onglet === 'transferts' ? 'text-xelltekk-700 border-b-2 border-xelltekk-700' : 'text-gray-500 hover:text-gray-700'">
          🚚 Transferts
        </button>
        <button @click="onglet = 'mouvements'" class="px-6 py-3 text-sm font-medium transition-colors"
                :class="onglet === 'mouvements' ? 'text-xelltekk-700 border-b-2 border-xelltekk-700' : 'text-gray-500 hover:text-gray-700'">
          🔄 Mouvements
        </button>
        <button @click="onglet = 'alertes'" class="px-6 py-3 text-sm font-medium transition-colors"
                :class="onglet === 'alertes' ? 'text-xelltekk-700 border-b-2 border-xelltekk-700' : 'text-gray-500 hover:text-gray-700'">
          ⚠️ Alertes
        </button>
        <button @click="onglet = 'reappro'" class="px-6 py-3 text-sm font-medium transition-colors"
                :class="onglet === 'reappro' ? 'text-xelltekk-700 border-b-2 border-xelltekk-700' : 'text-gray-500 hover:text-gray-700'">
          🧠 Réappro
        </button>
        <button @click="onglet = 'reservations'" class="px-6 py-3 text-sm font-medium transition-colors"
                :class="onglet === 'reservations' ? 'text-xelltekk-700 border-b-2 border-xelltekk-700' : 'text-gray-500 hover:text-gray-700'">
          🔒 Réservations
        </button>
        <button @click="onglet = 'historique'" class="px-6 py-3 text-sm font-medium transition-colors"
                :class="onglet === 'historique' ? 'text-xelltekk-700 border-b-2 border-xelltekk-700' : 'text-gray-500 hover:text-gray-700'">
          🧾 Historique produit
        </button>
        <button @click="onglet = 'series'" class="px-6 py-3 text-sm font-medium transition-colors"
                :class="onglet === 'series' ? 'text-xelltekk-700 border-b-2 border-xelltekk-700' : 'text-gray-500 hover:text-gray-700'">
          # Séries / lots
        </button>
        <button @click="onglet = 'etiquettes'" class="px-6 py-3 text-sm font-medium transition-colors"
                :class="onglet === 'etiquettes' ? 'text-xelltekk-700 border-b-2 border-xelltekk-700' : 'text-gray-500 hover:text-gray-700'">
          🏷️ Étiquettes
        </button>
        <button @click="onglet = 'validations'" class="px-6 py-3 text-sm font-medium transition-colors"
                :class="onglet === 'validations' ? 'text-xelltekk-700 border-b-2 border-xelltekk-700' : 'text-gray-500 hover:text-gray-700'">
          ✅ Contrôles
        </button>
        <button @click="onglet = 'rapports'" class="px-6 py-3 text-sm font-medium transition-colors"
                :class="onglet === 'rapports' ? 'text-xelltekk-700 border-b-2 border-xelltekk-700' : 'text-gray-500 hover:text-gray-700'">
          📄 Rapports
        </button>
      </div>
    </div>

    <!-- Actions globales -->
    <div class="flex flex-col gap-2 mb-4 sm:flex-row sm:flex-wrap">
      <button @click="openMouvement('entree')" class="btn-secondary text-sm">📥 Entrée stock</button>
      <button @click="openMouvement('sortie')" class="btn-secondary text-sm">📤 Sortie stock</button>
      <button @click="openMouvement('ajustement')" class="btn-secondary text-sm">⚙️ Ajustement</button>
      <button @click="onglet = 'inventaire'" class="btn-secondary text-sm">🧮 Faire inventaire</button>
      <button @click="exporterCSV" :disabled="exportLoading" class="btn-secondary text-sm">
        {{ exportLoading ? 'Export...' : 'Exporter CSV' }}
      </button>
    </div>

    <!-- Filtres -->
    <div class="bg-white rounded-lg border border-gray-200 p-3 mb-4">
      <div class="flex flex-col gap-2 md:flex-row md:flex-wrap">
        <input v-model="filters.search" @input="onSearchInput" type="search" placeholder="🔍 Rechercher un produit..." class="input flex-1" />
        <select v-model="filters.entrepot_id" @change="reload" class="input md:w-48">
          <option value="">Tous entrepôts</option>
          <option v-for="e in entrepots" :key="e.id" :value="e.id">{{ e.libelle }}</option>
        </select>
        <select v-if="onglet === 'mouvements'" v-model="filters.type" @change="reload" class="input md:w-40">
          <option value="">Tous types</option>
          <option value="entree">Entrées</option>
          <option value="sortie">Sorties</option>
          <option value="transfert">Transferts</option>
          <option value="ajustement">Ajustements</option>
        </select>
        <select v-if="onglet === 'mouvements'" v-model="filters.document_type" @change="reload" class="input md:w-48">
          <option value="">Tous documents</option>
          <option value="manuel">Manuels</option>
          <option value="facture">Factures</option>
          <option value="facture_annulation">Annulations facture</option>
          <option value="achat">Achats</option>
          <option value="reception">Réceptions</option>
          <option value="retour_fournisseur">Retours fournisseur</option>
          <option value="stock_transfer_sent">Transferts envoyés</option>
          <option value="stock_transfer_received">Transferts reçus</option>
          <option value="stock_transfer_cancelled">Transferts annulés</option>
        </select>
        <select v-if="onglet === 'transferts'" v-model="filters.transfer_statut" @change="reload(1)" class="input md:w-48">
          <option value="">Tous statuts</option>
          <option value="envoye">En transit</option>
          <option value="recu">Reçus</option>
          <option value="annule">Annulés</option>
        </select>
        <select v-if="onglet === 'alertes'" v-model="filters.alert_niveau" @change="reload(1)" class="input md:w-48">
          <option value="">Toutes urgences</option>
          <option value="rupture">Ruptures</option>
          <option value="critique">Critiques</option>
          <option value="alerte">À réapprovisionner</option>
        </select>
        <select v-if="onglet === 'valorisation'" v-model="filters.dormant_days" @change="reload(1)" class="input md:w-52">
          <option :value="60">Dormants depuis 60 jours</option>
          <option :value="90">Dormants depuis 90 jours</option>
          <option :value="180">Dormants depuis 180 jours</option>
          <option :value="365">Dormants depuis 365 jours</option>
        </select>
        <select v-if="onglet === 'reservations'" v-model="filters.reservation_statut" @change="reload(1)" class="input md:w-48">
          <option value="">Tous statuts</option>
          <option value="active">Actives</option>
          <option value="consommee">Consommées</option>
          <option value="liberee">Libérées</option>
          <option value="remplacee">Remplacées</option>
        </select>
        <select v-if="onglet === 'series'" v-model="filters.series_statut" @change="reload(1)" class="input md:w-48">
          <option value="">Tous statuts</option>
          <option value="disponible">Disponibles</option>
          <option value="reserve">Réservés</option>
          <option value="vendu">Vendus</option>
          <option value="sav">SAV</option>
          <option value="sorti">Sortis</option>
          <option value="perdu">Perdus</option>
        </select>
        <select v-if="onglet === 'validations'" v-model="filters.validation_statut" @change="reload(1)" class="input md:w-48">
          <option value="a_valider">À valider</option>
          <option value="valide">Validés</option>
          <option value="">Tous</option>
        </select>
        <select v-if="onglet === 'reappro'" v-model="filters.reappro_period" @change="reload(1)" class="input md:w-56">
          <option :value="30">Consommation 30 jours</option>
          <option :value="90">Consommation 90 jours</option>
          <option :value="180">Consommation 180 jours</option>
          <option :value="365">Consommation 365 jours</option>
        </select>
      </div>

      <div v-if="onglet === 'mouvements'" class="mt-3 space-y-3 border-t border-cyan-100 pt-3">
        <div class="flex flex-wrap gap-2">
          <button
            v-for="option in mouvementTypeOptions"
            :key="option.value || 'all'"
            type="button"
            class="rounded-full border px-3 py-1.5 text-xs font-black transition"
            :class="filters.type === option.value ? 'border-cyan-500 bg-cyan-100 text-cyan-800' : 'border-slate-200 bg-white text-slate-600 hover:border-cyan-300'"
            @click="setMouvementType(option.value)"
          >
            {{ option.label }}
            <span v-if="option.value" class="ml-1 rounded-full bg-white/70 px-1.5">{{ movementTypeCount(option.value) }}</span>
          </button>
        </div>

        <div class="grid grid-cols-1 gap-2 md:grid-cols-[auto_auto_auto_1fr] md:items-center">
          <div class="flex flex-wrap gap-2">
            <button type="button" class="btn-secondary px-3 py-1.5 text-xs" @click="setMovementPeriod('today')">Aujourd’hui</button>
            <button type="button" class="btn-secondary px-3 py-1.5 text-xs" @click="setMovementPeriod('7d')">7 jours</button>
            <button type="button" class="btn-secondary px-3 py-1.5 text-xs" @click="setMovementPeriod('30d')">30 jours</button>
          </div>
          <input v-model="filters.date_from" type="date" class="input" @change="reload(1)" />
          <input v-model="filters.date_to" type="date" class="input" @change="reload(1)" />
          <div class="flex justify-end">
            <button type="button" class="btn-secondary px-3 py-1.5 text-xs" @click="resetMovementFilters">Réinitialiser mouvements</button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="loading" class="bg-white rounded-lg p-12 text-center text-gray-500">Chargement...</div>

    <!-- TAB: Vue d'ensemble -->
    <div v-else-if="onglet === 'overview'" class="space-y-4">
      <div class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div class="rounded-2xl border border-cyan-200 bg-cyan-50/80 p-4 shadow-sm">
          <p class="text-xs font-black uppercase tracking-[0.16em] text-cyan-700">Valeur stock</p>
          <p class="mt-3 text-2xl font-black text-slate-900">{{ formatPrice(stockSummary.kpis.valeur_stock) }}</p>
          <p class="mt-1 text-xs text-cyan-800">{{ formatQte(stockSummary.kpis.quantite_disponible) }} disponible(s) / {{ formatQte(stockSummary.kpis.quantite_totale) }} total</p>
        </div>
        <div class="rounded-2xl border border-sky-200 bg-sky-50/80 p-4 shadow-sm">
          <p class="text-xs font-black uppercase tracking-[0.16em] text-sky-700">Produits suivis</p>
          <p class="mt-3 text-2xl font-black text-slate-900">{{ stockSummary.kpis.produits_geres }}</p>
          <p class="mt-1 text-xs text-sky-800">{{ stockSummary.kpis.produits_en_stock }} avec stock disponible</p>
        </div>
        <div class="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 shadow-sm">
          <p class="text-xs font-black uppercase tracking-[0.16em] text-amber-700">Alertes</p>
          <p class="mt-3 text-2xl font-black text-slate-900">{{ stockSummary.kpis.alertes }}</p>
          <p class="mt-1 text-xs text-amber-800">{{ stockSummary.kpis.ruptures }} rupture(s)</p>
        </div>
        <div class="rounded-2xl border border-teal-200 bg-teal-50/80 p-4 shadow-sm">
          <p class="text-xs font-black uppercase tracking-[0.16em] text-teal-700">Activité du jour</p>
          <p class="mt-3 text-2xl font-black text-slate-900">{{ stockSummary.kpis.mouvements_aujourdhui }}</p>
          <p class="mt-1 text-xs text-teal-800">{{ stockSummary.kpis.entrepots_actifs }} entrepôt(s) actif(s)</p>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <section class="rounded-2xl border border-sky-200 bg-white p-4 shadow-sm">
          <div class="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 class="text-base font-black text-slate-900">Stock par entrepôt</h2>
              <p class="text-xs text-slate-500">Valeur et volume par dépôt/boutique.</p>
            </div>
            <button class="btn-secondary px-3 py-1.5 text-xs" @click="onglet = 'stock'">Voir détail</button>
          </div>
          <div v-if="stockSummary.stock_par_entrepot.length" class="space-y-2">
            <article v-for="entrepot in stockSummary.stock_par_entrepot" :key="entrepot.id" class="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <p class="font-bold text-slate-900">{{ entrepot.libelle }}</p>
                  <p class="text-xs text-slate-500">{{ entrepot.produits }} produit(s) · {{ entrepot.lignes_stock }} ligne(s)</p>
                </div>
                <div class="text-right">
                  <p class="font-mono text-sm font-black text-cyan-700">{{ formatPrice(entrepot.valeur) }}</p>
                  <p class="text-xs text-slate-500">{{ formatQte(entrepot.quantite_disponible ?? entrepot.quantite) }} dispo. / {{ formatQte(entrepot.quantite) }} total</p>
                  <p v-if="Number(entrepot.quantite_reservee || 0) > 0" class="text-xs font-bold text-amber-700">{{ formatQte(entrepot.quantite_reservee) }} réservé(s)</p>
                </div>
              </div>
            </article>
          </div>
          <p v-else class="rounded-xl bg-slate-50 p-5 text-center text-sm text-slate-500">Aucun stock par entrepôt pour le moment.</p>
        </section>

        <section class="rounded-2xl border border-sky-200 bg-white p-4 shadow-sm">
          <div class="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 class="text-base font-black text-slate-900">Derniers mouvements</h2>
              <p class="text-xs text-slate-500">Traçabilité récente des entrées, sorties et transferts.</p>
            </div>
            <button class="btn-secondary px-3 py-1.5 text-xs" @click="onglet = 'mouvements'">Historique</button>
          </div>
          <div v-if="stockSummary.derniers_mouvements.length" class="space-y-2">
            <article v-for="m in stockSummary.derniers_mouvements" :key="m.id" class="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <p class="truncate font-bold text-slate-900">{{ m.produit?.libelle || 'Produit' }}</p>
                  <p class="text-xs text-slate-500">{{ m.produit?.reference || '-' }} · {{ mouvementEntrepotLabel(m) }}</p>
                  <p class="mt-1 text-xs text-slate-500">{{ m.motif || typeLabel(m.type) }}</p>
                </div>
                <div class="text-right">
                  <span class="badge text-xs" :class="typeBadge(m.type)">{{ typeLabel(m.type) }}</span>
                  <p class="mt-1 font-mono text-sm font-black" :class="m.type === 'sortie' ? 'text-red-600' : 'text-cyan-700'">
                    {{ m.type === 'sortie' ? '-' : '+' }}{{ formatQte(Math.abs(m.quantite)) }}
                  </p>
                </div>
              </div>
            </article>
          </div>
          <p v-else class="rounded-xl bg-slate-50 p-5 text-center text-sm text-slate-500">Aucun mouvement récent.</p>
        </section>
      </div>

      <section class="rounded-2xl border border-sky-200 bg-white p-4 shadow-sm">
        <div class="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 class="text-base font-black text-slate-900">Alertes prioritaires</h2>
            <p class="text-xs text-slate-500">Produits à réapprovisionner en priorité.</p>
          </div>
          <button class="btn-secondary px-3 py-1.5 text-xs" @click="onglet = 'alertes'">Voir alertes</button>
        </div>
        <div v-if="stockSummary.alertes.length" class="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
          <article v-for="a in stockSummary.alertes" :key="a.id" class="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
            <div class="flex items-start justify-between gap-2">
              <p class="font-bold text-slate-900">{{ a.libelle }}</p>
              <span class="badge text-xs" :class="alertLevelBadge(a.niveau)">{{ alertLevelLabel(a.niveau) }}</span>
            </div>
            <p class="text-xs font-mono text-slate-500">{{ a.reference || '-' }}</p>
            <p class="mt-2 text-sm">
              Stock : <strong class="text-red-700">{{ formatQte(a.stock_total) }}</strong>
              <span class="text-slate-500"> / seuil {{ a.seuil_pilotage ?? a.stock_alerte }}</span>
            </p>
            <p class="mt-1 text-xs font-bold text-cyan-800">À recommander : {{ formatQte(a.quantite_recommandee) }} {{ a.unite || '' }}</p>
          </article>
        </div>
        <p v-else class="rounded-xl bg-emerald-50 p-5 text-center text-sm font-bold text-emerald-700">Aucune alerte critique actuellement.</p>
      </section>
    </div>

    <!-- TAB: Valorisation -->
    <div v-else-if="onglet === 'valorisation'" class="space-y-4">
      <div class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div class="rounded-2xl border border-cyan-200 bg-cyan-50/80 p-4 shadow-sm">
          <p class="text-xs font-black uppercase tracking-[0.16em] text-cyan-700">Valeur stock</p>
          <p class="mt-3 text-2xl font-black text-slate-900">{{ formatPrice(stockValuation.kpis.valeur_stock) }}</p>
          <p class="mt-1 text-xs text-cyan-800">{{ formatQte(stockValuation.kpis.quantite_totale) }} unité(s)</p>
        </div>
        <div class="rounded-2xl border border-sky-200 bg-sky-50/80 p-4 shadow-sm">
          <p class="text-xs font-black uppercase tracking-[0.16em] text-sky-700">Produits valorisés</p>
          <p class="mt-3 text-2xl font-black text-slate-900">{{ stockValuation.kpis.produits_valorises }}</p>
          <p class="mt-1 text-xs text-sky-800">{{ stockValuation.kpis.lignes_stock }} ligne(s) de stock</p>
        </div>
        <div class="rounded-2xl border border-teal-200 bg-teal-50/80 p-4 shadow-sm">
          <p class="text-xs font-black uppercase tracking-[0.16em] text-teal-700">PMP moyen</p>
          <p class="mt-3 text-2xl font-black text-slate-900">{{ formatPrice(stockValuation.kpis.pmp_moyen) }}</p>
          <p class="mt-1 text-xs text-teal-800">Prix moyen pondéré</p>
        </div>
        <div class="rounded-2xl border border-cyan-200 bg-white p-4 shadow-sm">
          <p class="text-xs font-black uppercase tracking-[0.16em] text-cyan-700">Produits dormants</p>
          <p class="mt-3 text-2xl font-black text-slate-900">{{ stockValuation.produits_dormants.length }}</p>
          <p class="mt-1 text-xs text-cyan-800">Sans mouvement ≥ {{ stockValuation.kpis.dormant_days }} jours</p>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <section class="rounded-2xl border border-sky-200 bg-white p-4 shadow-sm">
          <div class="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 class="text-base font-black text-slate-900">Valeur par entrepôt</h2>
              <p class="text-xs text-slate-500">Répartition de l’argent immobilisé par dépôt ou boutique.</p>
            </div>
          </div>
          <div v-if="stockValuation.par_entrepot.length" class="space-y-2">
            <article v-for="entrepot in stockValuation.par_entrepot" :key="entrepot.id" class="rounded-xl border border-cyan-100 bg-cyan-50/60 px-3 py-2">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <p class="truncate font-bold text-slate-900">{{ entrepot.libelle }}</p>
                  <p class="text-xs text-slate-500">{{ entrepot.produits }} produit(s) · {{ entrepot.lignes_stock }} ligne(s)</p>
                </div>
                <div class="text-right">
                  <p class="font-mono text-sm font-black text-cyan-700">{{ formatPrice(entrepot.valeur) }}</p>
                  <p class="text-xs text-slate-500">{{ formatQte(entrepot.quantite) }} unité(s)</p>
                </div>
              </div>
            </article>
          </div>
          <p v-else class="rounded-xl bg-slate-50 p-5 text-center text-sm text-slate-500">Aucune valorisation par entrepôt.</p>
        </section>

        <section class="rounded-2xl border border-sky-200 bg-white p-4 shadow-sm">
          <div class="mb-3">
            <h2 class="text-base font-black text-slate-900">Valeur par catégorie</h2>
            <p class="text-xs text-slate-500">Identifiez les familles qui concentrent le plus de stock.</p>
          </div>
          <div v-if="stockValuation.par_categorie.length" class="space-y-2">
            <article v-for="categorie in stockValuation.par_categorie" :key="categorie.id || 'none'" class="rounded-xl border border-sky-100 bg-sky-50/60 px-3 py-2">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <p class="font-bold text-slate-900">{{ categorie.libelle }}</p>
                  <p class="text-xs text-slate-500">{{ categorie.produits }} produit(s)</p>
                </div>
                <div class="text-right">
                  <p class="font-mono text-sm font-black text-cyan-700">{{ formatPrice(categorie.valeur) }}</p>
                  <p class="text-xs text-slate-500">{{ formatQte(categorie.quantite) }} unité(s)</p>
                </div>
              </div>
            </article>
          </div>
          <p v-else class="rounded-xl bg-slate-50 p-5 text-center text-sm text-slate-500">Aucune valorisation par catégorie.</p>
        </section>
      </div>

      <div class="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <section class="rounded-2xl border border-sky-200 bg-white p-4 shadow-sm">
          <div class="mb-3">
            <h2 class="text-base font-black text-slate-900">Top produits immobilisés</h2>
            <p class="text-xs text-slate-500">Les produits qui représentent le plus de valeur en stock.</p>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="border-b border-cyan-100 bg-cyan-50 text-xs uppercase text-cyan-700">
                <tr>
                  <th class="px-3 py-2 text-left">Produit</th>
                  <th class="px-3 py-2 text-right">Qté</th>
                  <th class="px-3 py-2 text-right">PMP</th>
                  <th class="px-3 py-2 text-right">Valeur</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-cyan-50">
                <tr v-for="produit in stockValuation.top_produits" :key="produit.id" class="hover:bg-cyan-50/40">
                  <td class="px-3 py-3">
                    <p class="font-bold text-slate-900">{{ produit.libelle }}</p>
                    <p class="text-xs font-mono text-slate-500">{{ produit.reference || '-' }} · {{ produit.entrepots }} entrepôt(s)</p>
                  </td>
                  <td class="px-3 py-3 text-right font-mono">{{ formatQte(produit.quantite) }}</td>
                  <td class="px-3 py-3 text-right font-mono">{{ formatPrice(produit.pmp_moyen) }}</td>
                  <td class="px-3 py-3 text-right font-mono font-black text-cyan-700">{{ formatPrice(produit.valeur) }}</td>
                </tr>
                <tr v-if="stockValuation.top_produits.length === 0">
                  <td colspan="4" class="px-3 py-8 text-center text-slate-400">Aucun produit valorisé.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section class="rounded-2xl border border-sky-200 bg-white p-4 shadow-sm">
          <div class="mb-3">
            <h2 class="text-base font-black text-slate-900">Produits dormants</h2>
            <p class="text-xs text-slate-500">Stock encore présent sans mouvement récent.</p>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="border-b border-cyan-100 bg-cyan-50 text-xs uppercase text-cyan-700">
                <tr>
                  <th class="px-3 py-2 text-left">Produit</th>
                  <th class="px-3 py-2 text-right">Dernier mouvement</th>
                  <th class="px-3 py-2 text-right">Qté</th>
                  <th class="px-3 py-2 text-right">Valeur</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-cyan-50">
                <tr v-for="produit in stockValuation.produits_dormants" :key="produit.id" class="hover:bg-cyan-50/40">
                  <td class="px-3 py-3">
                    <p class="font-bold text-slate-900">{{ produit.libelle }}</p>
                    <p class="text-xs font-mono text-slate-500">{{ produit.reference || '-' }}</p>
                  </td>
                  <td class="px-3 py-3 text-right text-xs text-slate-500">{{ produit.dernier_mouvement ? formatDateTime(produit.dernier_mouvement) : 'Jamais' }}</td>
                  <td class="px-3 py-3 text-right font-mono">{{ formatQte(produit.quantite) }}</td>
                  <td class="px-3 py-3 text-right font-mono font-black text-cyan-700">{{ formatPrice(produit.valeur) }}</td>
                </tr>
                <tr v-if="stockValuation.produits_dormants.length === 0">
                  <td colspan="4" class="px-3 py-8 text-center text-emerald-600">Aucun produit dormant sur la période choisie.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>

    <!-- TAB: Stock -->
    <div v-else-if="onglet === 'stock'" class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div class="border-b border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
        Un produit peut apparaître sur plusieurs lignes lorsqu'il est rangé dans plusieurs emplacements. Le disponible = stock réel - quantité réservée.
      </div>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <SortableTh column="reference" :active="stockSort.key === 'reference'" :icon="stockSortIcon('reference')" @sort="toggleStockSort">Référence</SortableTh>
              <SortableTh column="produit" :active="stockSort.key === 'produit'" :icon="stockSortIcon('produit')" @sort="toggleStockSort">Produit</SortableTh>
              <SortableTh column="entrepot" :active="stockSort.key === 'entrepot'" :icon="stockSortIcon('entrepot')" @sort="toggleStockSort">Entrepôt</SortableTh>
              <SortableTh column="emplacement" :active="stockSort.key === 'emplacement'" :icon="stockSortIcon('emplacement')" @sort="toggleStockSort">Emplacement</SortableTh>
              <SortableTh column="quantite" :active="stockSort.key === 'quantite'" :icon="stockSortIcon('quantite')" align="right" @sort="toggleStockSort">Réel</SortableTh>
              <SortableTh column="reservee" :active="stockSort.key === 'reservee'" :icon="stockSortIcon('reservee')" align="right" @sort="toggleStockSort">Réservé</SortableTh>
              <SortableTh column="disponible" :active="stockSort.key === 'disponible'" :icon="stockSortIcon('disponible')" align="right" @sort="toggleStockSort">Disponible</SortableTh>
              <SortableTh column="total_produit" :active="stockSort.key === 'total_produit'" :icon="stockSortIcon('total_produit')" align="right" @sort="toggleStockSort">Total produit</SortableTh>
              <SortableTh column="pmp" :active="stockSort.key === 'pmp'" :icon="stockSortIcon('pmp')" align="right" @sort="toggleStockSort">PMP</SortableTh>
              <SortableTh column="valeur" :active="stockSort.key === 'valeur'" :icon="stockSortIcon('valeur')" align="right" @sort="toggleStockSort">Valeur</SortableTh>
              <th class="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="s in sortedStocks" :key="s.id" class="hover:bg-gray-50">
              <td class="px-4 py-3 text-sm font-mono text-gray-600">{{ s.produit?.reference || '-' }}</td>
              <td class="px-4 py-3 text-sm font-medium">{{ s.produit?.libelle || 'Produit' }}</td>
              <td class="px-4 py-3 text-sm text-gray-600">{{ s.entrepot?.libelle || 'Entrepôt' }}</td>
              <td class="px-4 py-3 text-sm text-gray-600">
                <div v-if="s.emplacement">
                  <div class="font-medium text-gray-900">{{ s.emplacement?.zone?.libelle || s.emplacement?.zone?.code || 'Zone' }}</div>
                  <div class="text-xs text-gray-500">{{ emplacementLabel(s.emplacement) }}</div>
                </div>
                <span v-else class="badge bg-orange-100 text-orange-800">À affecter</span>
              </td>
              <td class="px-4 py-3 text-sm text-right font-mono font-semibold"
                  :class="stockAvailableQty(s) <= parseFloat(s.produit?.stock_alerte || 0) ? 'text-orange-600' : 'text-gray-900'">
                {{ formatQte(s.quantite) }} {{ s.produit?.unite || '' }}
              </td>
              <td class="px-4 py-3 text-sm text-right font-mono font-semibold" :class="stockReservedQty(s) > 0 ? 'text-amber-700' : 'text-slate-400'">
                {{ formatQte(stockReservedQty(s)) }} {{ s.produit?.unite || '' }}
              </td>
              <td class="px-4 py-3 text-sm text-right font-mono font-black" :class="stockAvailableClass(s)">
                {{ formatQte(stockAvailableQty(s)) }} {{ s.produit?.unite || '' }}
              </td>
              <td class="px-4 py-3 text-sm text-right font-mono font-semibold text-blue-700">
                {{ formatQte(s.stock_total_produit) }} {{ s.produit?.unite || '' }}
                <p v-if="Number(s.stock_reserve_produit || 0) > 0" class="text-[11px] font-bold text-amber-700">
                  {{ formatQte(s.stock_disponible_produit) }} dispo.
                </p>
              </td>
              <td class="px-4 py-3 text-sm text-right text-gray-600">{{ formatPrice(s.pmp) }}</td>
              <td class="px-4 py-3 text-sm text-right font-semibold text-xelltekk-700">
                {{ formatPrice(s.quantite * s.pmp) }}
              </td>
              <td class="px-4 py-3 text-right">
                <div class="flex flex-wrap justify-end gap-2">
                  <button class="btn-secondary px-3 py-1.5 text-xs" @click="openDeplacement(s)">Déplacer</button>
                  <button class="btn-primary px-3 py-1.5 text-xs" @click="openTransfert(s)">Transférer</button>
                </div>
              </td>
            </tr>
            <tr v-if="stocks.length === 0">
              <td colspan="11" class="px-4 py-12 text-center text-gray-400 text-sm">
                Aucun stock. Faites une entrée pour commencer.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <Pagination v-if="meta.total > 0" :meta="meta" @page="reload" />
    </div>

    <!-- TAB: Inventaire -->
    <div v-else-if="onglet === 'inventaire'" class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div class="border-b border-cyan-100 bg-cyan-50 px-4 py-4">
        <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 class="text-base font-black text-slate-900">Sessions d’inventaire</h2>
            <p class="text-sm text-cyan-900">
              Lancez une session, comptez toutes les lignes, puis validez les écarts en une seule fois.
            </p>
            <p class="mt-1 text-xs text-cyan-700">
              Le filtre entrepôt et la recherche en cours limitent les lignes préparées dans la nouvelle session.
            </p>
          </div>
          <button class="btn-primary whitespace-nowrap text-sm" :disabled="inventorySessionActionLoading" @click="startInventorySession">
            {{ inventorySessionActionLoading ? 'Préparation...' : '+ Nouvelle session' }}
          </button>
        </div>

        <div v-if="inventorySessions.length" class="mt-3 grid grid-cols-1 gap-2 lg:grid-cols-2">
          <button
            v-for="session in inventorySessions"
            :key="session.id"
            type="button"
            class="rounded-xl border border-cyan-200 bg-white/80 p-3 text-left transition hover:bg-white"
            :class="activeInventory?.id === session.id ? 'ring-2 ring-cyan-400' : ''"
            @click="openInventorySession(session)"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="truncate font-black text-slate-900">{{ session.titre }}</p>
                <p class="text-xs font-mono text-cyan-700">{{ session.reference }}</p>
              </div>
              <span class="badge bg-cyan-100 text-cyan-800">{{ inventoryStatusLabel(session.statut) }}</span>
            </div>
            <div class="mt-2 flex flex-wrap gap-3 text-xs text-slate-600">
              <span>{{ session.entrepot?.libelle || 'Tous entrepôts' }}</span>
              <span>{{ session.lignes_comptees_count || 0 }}/{{ session.lignes_count || 0 }} comptée(s)</span>
              <span>{{ session.lignes_ecart_count || 0 }} écart(s)</span>
            </div>
          </button>
        </div>

        <p v-else class="mt-3 rounded-xl border border-cyan-100 bg-white/70 p-3 text-sm text-slate-500">
          Aucune session en cours. Créez une session pour figer les quantités théoriques avant comptage.
        </p>
      </div>

      <div v-if="activeInventory" class="border-b border-cyan-100 bg-white px-4 py-4">
        <div class="mb-3 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h3 class="text-base font-black text-slate-900">{{ activeInventory.titre }}</h3>
            <p class="text-xs text-slate-500">
              {{ activeInventory.reference }} · {{ activeInventory.entrepot?.libelle || 'Tous entrepôts' }} · démarré le {{ formatDateTime(activeInventory.started_at) }}
            </p>
          </div>
          <div class="flex flex-wrap gap-2">
            <button class="btn-secondary text-xs" :disabled="inventorySessionLoading" @click="openInventorySession(activeInventory)">Actualiser</button>
            <button class="btn-secondary text-xs" :disabled="inventorySessionActionLoading" @click="cancelInventorySession">Annuler session</button>
            <button class="btn-primary text-xs" :disabled="inventorySessionActionLoading || !inventorySessionCanValidate" @click="validateInventorySession">
              {{ inventorySessionActionLoading ? 'Validation...' : 'Valider les écarts' }}
            </button>
          </div>
        </div>

        <div class="mb-3 grid grid-cols-2 gap-2 md:grid-cols-5">
          <div class="rounded-xl border border-cyan-100 bg-cyan-50 p-3 text-right">
            <p class="text-[10px] font-black uppercase tracking-[0.14em] text-cyan-700">Lignes</p>
            <p class="font-mono text-lg font-black text-slate-900">{{ activeInventory.resume?.lignes || 0 }}</p>
          </div>
          <div class="rounded-xl border border-cyan-100 bg-cyan-50 p-3 text-right">
            <p class="text-[10px] font-black uppercase tracking-[0.14em] text-cyan-700">Comptées</p>
            <p class="font-mono text-lg font-black text-slate-900">{{ activeInventory.resume?.comptees || 0 }}</p>
          </div>
          <div class="rounded-xl border border-orange-100 bg-orange-50 p-3 text-right">
            <p class="text-[10px] font-black uppercase tracking-[0.14em] text-orange-700">À compter</p>
            <p class="font-mono text-lg font-black text-orange-700">{{ activeInventory.resume?.a_compter || 0 }}</p>
          </div>
          <div class="rounded-xl border border-sky-100 bg-sky-50 p-3 text-right">
            <p class="text-[10px] font-black uppercase tracking-[0.14em] text-sky-700">Écarts</p>
            <p class="font-mono text-lg font-black text-slate-900">{{ activeInventory.resume?.ecarts || 0 }}</p>
          </div>
          <div class="rounded-xl border border-sky-100 bg-sky-50 p-3 text-right">
            <p class="text-[10px] font-black uppercase tracking-[0.14em] text-sky-700">Écart total</p>
            <p class="font-mono text-lg font-black" :class="Number(activeInventory.resume?.ecart_total || 0) < 0 ? 'text-red-700' : 'text-emerald-700'">
              {{ formatSignedQte(activeInventory.resume?.ecart_total || 0) }}
            </p>
          </div>
        </div>

        <div class="overflow-x-auto rounded-xl border border-cyan-100">
          <table class="w-full">
            <thead class="bg-cyan-50 text-xs uppercase text-cyan-700">
              <tr>
                <th class="px-3 py-2 text-left">Produit</th>
                <th class="px-3 py-2 text-left">Localisation</th>
                <th class="px-3 py-2 text-right">Théorique</th>
                <th class="px-3 py-2 text-right">Compté</th>
                <th class="px-3 py-2 text-right">Écart</th>
                <th class="px-3 py-2 text-left">Motif</th>
                <th class="px-3 py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-cyan-50">
              <tr v-for="line in activeInventory.lignes || []" :key="line.id" class="hover:bg-cyan-50/40">
                <td class="px-3 py-3 text-sm">
                  <p class="font-bold text-slate-900">{{ line.produit?.libelle || 'Produit' }}</p>
                  <p class="text-xs font-mono text-slate-500">{{ line.produit?.reference || '-' }}</p>
                </td>
                <td class="px-3 py-3 text-xs text-slate-600">
                  <p class="font-bold text-slate-900">{{ line.entrepot?.libelle || 'Entrepôt' }}</p>
                  <p>{{ emplacementLabel(line.emplacement) }}</p>
                </td>
                <td class="px-3 py-3 text-right font-mono text-sm font-bold">{{ formatQte(line.quantite_theorique) }}</td>
                <td class="px-3 py-3 text-right">
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    class="input w-28 text-right font-mono"
                    :value="inventoryLineDrafts[line.id]?.quantite_comptee ?? ''"
                    @input="setInventorySessionLineCount(line, $event.target.value)"
                  />
                </td>
                <td class="px-3 py-3 text-right font-mono text-sm font-black" :class="inventorySessionDeltaClass(line)">
                  {{ formatSignedQte(inventorySessionDelta(line)) }}
                </td>
                <td class="px-3 py-3">
                  <input
                    class="input min-w-48 text-sm"
                    :value="inventoryLineDrafts[line.id]?.motif ?? ''"
                    placeholder="Casse, erreur, inventaire..."
                    @input="setInventorySessionLineMotif(line, $event.target.value)"
                  />
                </td>
                <td class="px-3 py-3 text-right">
                  <button class="btn-secondary px-3 py-1.5 text-xs" :disabled="inventoryLineSavingId === line.id || activeInventory.statut !== 'en_cours'" @click="saveInventorySessionLine(line)">
                    {{ inventoryLineSavingId === line.id ? '...' : line.statut === 'compte' ? 'Modifier' : 'Enregistrer' }}
                  </button>
                </td>
              </tr>
              <tr v-if="(activeInventory.lignes || []).length === 0">
                <td colspan="7" class="px-4 py-8 text-center text-sm text-slate-400">Aucune ligne dans cette session.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="border-b border-cyan-100 bg-slate-50 px-4 py-3 text-sm text-slate-700">
        Inventaire rapide ligne par ligne : saisissez la quantité réellement comptée pour corriger immédiatement une seule ligne.
      </div>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <SortableTh column="reference" :active="stockSort.key === 'reference'" :icon="stockSortIcon('reference')" @sort="toggleStockSort">Référence</SortableTh>
              <SortableTh column="produit" :active="stockSort.key === 'produit'" :icon="stockSortIcon('produit')" @sort="toggleStockSort">Produit</SortableTh>
              <SortableTh column="entrepot" :active="stockSort.key === 'entrepot'" :icon="stockSortIcon('entrepot')" @sort="toggleStockSort">Localisation</SortableTh>
              <SortableTh column="quantite" :active="stockSort.key === 'quantite'" :icon="stockSortIcon('quantite')" align="right" @sort="toggleStockSort">Théorique</SortableTh>
              <th class="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500">Compté réel</th>
              <th class="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500">Écart</th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Justification</th>
              <th class="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="s in sortedStocks" :key="s.id" class="hover:bg-gray-50">
              <td class="px-4 py-3 text-sm font-mono text-gray-600">{{ s.produit?.reference || '-' }}</td>
              <td class="px-4 py-3 text-sm font-medium">{{ s.produit?.libelle || 'Produit' }}</td>
              <td class="px-4 py-3 text-xs text-gray-600">
                <div class="font-medium text-gray-900">{{ s.entrepot?.libelle || 'Entrepôt' }}</div>
                <div>{{ emplacementLabel(s.emplacement) }}</div>
              </td>
              <td class="px-4 py-3 text-right text-sm font-mono font-bold text-slate-900">
                {{ formatQte(s.quantite) }} {{ s.produit?.unite || '' }}
              </td>
              <td class="px-4 py-3 text-right">
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  class="input w-32 text-right font-mono"
                  :value="inventoryDrafts[s.id]?.nouvelle_quantite ?? ''"
                  placeholder="Qté"
                  @input="setInventoryCount(s, $event.target.value)"
                />
              </td>
              <td class="px-4 py-3 text-right text-sm font-mono font-black" :class="inventoryDeltaClass(s)">
                {{ formatInventoryDelta(s) }}
              </td>
              <td class="px-4 py-3">
                <input
                  class="input min-w-56 text-sm"
                  :value="inventoryDrafts[s.id]?.motif ?? ''"
                  placeholder="Inventaire physique, casse, erreur saisie..."
                  @input="setInventoryMotif(s, $event.target.value)"
                />
              </td>
              <td class="px-4 py-3 text-right">
                <button class="btn-primary px-3 py-1.5 text-xs" :disabled="inventorySavingId === s.id" @click="submitInventoryLine(s)">
                  {{ inventorySavingId === s.id ? 'Validation...' : 'Valider' }}
                </button>
              </td>
            </tr>
            <tr v-if="stocks.length === 0">
              <td colspan="8" class="px-4 py-12 text-center text-gray-400 text-sm">
                Aucun stock à inventorier avec ces filtres.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <Pagination v-if="meta.total > 0" :meta="meta" @page="reload" />
    </div>

    <!-- TAB: Transferts -->
    <div v-else-if="onglet === 'transferts'" class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div class="border-b border-cyan-100 bg-cyan-50 px-4 py-3">
        <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 class="text-base font-black text-slate-900">Transferts inter-entrepôts</h2>
            <p class="text-xs text-cyan-800">
              Un transfert envoyé reste en transit jusqu’à sa réception par l’entrepôt destination.
            </p>
          </div>
          <div class="grid grid-cols-3 gap-2 text-right">
            <button type="button" class="rounded-xl border px-3 py-2" :class="transferStatusChipClass('envoye')" @click="setTransferStatus('envoye')">
              <p class="text-[10px] font-black uppercase tracking-[0.14em]">En transit</p>
              <p class="font-mono text-lg font-black">{{ transferResume.envoye }}</p>
            </button>
            <button type="button" class="rounded-xl border px-3 py-2" :class="transferStatusChipClass('recu')" @click="setTransferStatus('recu')">
              <p class="text-[10px] font-black uppercase tracking-[0.14em]">Reçus</p>
              <p class="font-mono text-lg font-black">{{ transferResume.recu }}</p>
            </button>
            <button type="button" class="rounded-xl border px-3 py-2" :class="transferStatusChipClass('annule')" @click="setTransferStatus('annule')">
              <p class="text-[10px] font-black uppercase tracking-[0.14em]">Annulés</p>
              <p class="font-mono text-lg font-black">{{ transferResume.annule }}</p>
            </button>
          </div>
        </div>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Référence</th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Produit</th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Trajet</th>
              <th class="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500">Quantité</th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Statut</th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Dates</th>
              <th class="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="transfer in transferts" :key="transfer.id" class="hover:bg-gray-50">
              <td class="px-4 py-3 text-sm">
                <div class="font-mono font-black text-slate-900">{{ transfer.reference }}</div>
                <div class="text-xs text-slate-500">{{ transfer.motif || 'Transfert inter-entrepôts' }}</div>
              </td>
              <td class="px-4 py-3 text-sm">
                <div class="font-medium text-slate-900">{{ transfer.produit?.libelle || 'Produit' }}</div>
                <div class="text-xs font-mono text-gray-500">{{ transfer.produit?.reference || '-' }}</div>
              </td>
              <td class="px-4 py-3 text-sm text-gray-600">
                <div class="font-bold text-slate-800">{{ transferEntrepotLabel(transfer) }}</div>
                <div class="text-xs text-slate-500">{{ transferEmplacementLabel(transfer) }}</div>
              </td>
              <td class="px-4 py-3 text-right text-sm font-mono font-black text-cyan-700">
                {{ formatQte(transfer.quantite) }} {{ transfer.produit?.unite || '' }}
              </td>
              <td class="px-4 py-3">
                <span class="badge text-xs" :class="transferStatusBadge(transfer.statut)">{{ transferStatusLabel(transfer.statut) }}</span>
              </td>
              <td class="px-4 py-3 text-xs text-gray-600">
                <div>Envoyé : {{ formatDateTime(transfer.sent_at) }}</div>
                <div v-if="transfer.received_at">Reçu : {{ formatDateTime(transfer.received_at) }}</div>
                <div v-if="transfer.cancelled_at">Annulé : {{ formatDateTime(transfer.cancelled_at) }}</div>
              </td>
              <td class="px-4 py-3 text-right">
                <div v-if="transfer.statut === 'envoye'" class="flex flex-wrap justify-end gap-2">
                  <button class="btn-primary px-3 py-1.5 text-xs" :disabled="transferActionId === transfer.id" @click="recevoirTransfert(transfer)">Recevoir</button>
                  <button class="btn-secondary px-3 py-1.5 text-xs" :disabled="transferActionId === transfer.id" @click="annulerTransfert(transfer)">Annuler</button>
                </div>
                <span v-else class="text-xs text-slate-400">Aucune action</span>
              </td>
            </tr>
            <tr v-if="transferts.length === 0">
              <td colspan="7" class="px-4 py-12 text-center text-gray-400 text-sm">
                Aucun transfert avec ces filtres.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <Pagination v-if="meta.total > 0" :meta="meta" @page="reload" />
    </div>

    <!-- TAB: Mouvements -->
    <div v-else-if="onglet === 'mouvements'" class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div class="border-b border-cyan-100 bg-cyan-50 px-4 py-3">
        <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 class="text-base font-black text-slate-900">Historique des mouvements</h2>
            <p class="text-xs text-cyan-800">
              {{ movementResume.total }} mouvement(s) dans le périmètre filtré.
            </p>
          </div>
          <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div v-for="option in mouvementTypeOptions.filter(item => item.value)" :key="option.value" class="rounded-xl border border-cyan-200 bg-white px-3 py-2 text-right">
              <p class="text-[10px] font-black uppercase tracking-[0.14em] text-cyan-700">{{ option.shortLabel }}</p>
              <p class="font-mono text-lg font-black text-slate-900">{{ movementTypeCount(option.value) }}</p>
              <p class="text-[10px] text-slate-500">{{ formatQte(movementTypeQuantity(option.value)) }} unité(s)</p>
            </div>
          </div>
        </div>
        <div v-if="movementResume.documents.length" class="mt-3 flex flex-wrap gap-2">
          <button
            v-for="document in movementResume.documents"
            :key="document.document_type"
            type="button"
            class="rounded-full border px-3 py-1 text-xs font-bold"
            :class="filters.document_type === document.document_type ? 'border-sky-500 bg-sky-100 text-sky-800' : 'border-slate-200 bg-white text-slate-600'"
            @click="setMovementDocumentType(document.document_type)"
          >
            {{ document.label }} · {{ document.total }}
          </button>
        </div>
      </div>
      <div class="overflow-x-auto">
      <table class="w-full">
        <thead class="bg-gray-50 border-b border-gray-200">
          <tr>
            <SortableTh column="date" :active="mouvementSort.key === 'date'" :icon="mouvementSortIcon('date')" @sort="toggleMouvementSort">Date</SortableTh>
            <SortableTh column="type" :active="mouvementSort.key === 'type'" :icon="mouvementSortIcon('type')" @sort="toggleMouvementSort">Type</SortableTh>
            <SortableTh column="produit" :active="mouvementSort.key === 'produit'" :icon="mouvementSortIcon('produit')" @sort="toggleMouvementSort">Produit</SortableTh>
            <SortableTh column="entrepot" :active="mouvementSort.key === 'entrepot'" :icon="mouvementSortIcon('entrepot')" @sort="toggleMouvementSort">Entrepôt</SortableTh>
            <SortableTh column="emplacement" :active="mouvementSort.key === 'emplacement'" :icon="mouvementSortIcon('emplacement')" @sort="toggleMouvementSort">Emplacement</SortableTh>
            <SortableTh column="quantite" :active="mouvementSort.key === 'quantite'" :icon="mouvementSortIcon('quantite')" align="right" @sort="toggleMouvementSort">Quantité</SortableTh>
            <SortableTh column="motif" :active="mouvementSort.key === 'motif'" :icon="mouvementSortIcon('motif')" @sort="toggleMouvementSort">Motif</SortableTh>
            <SortableTh column="document" :active="mouvementSort.key === 'document'" :icon="mouvementSortIcon('document')" @sort="toggleMouvementSort">Document</SortableTh>
            <SortableTh column="user" :active="mouvementSort.key === 'user'" :icon="mouvementSortIcon('user')" @sort="toggleMouvementSort">Par</SortableTh>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="m in sortedMouvements" :key="m.id" class="hover:bg-gray-50">
            <td class="px-4 py-3 text-xs text-gray-600">{{ formatDateTime(m.date_mouvement) }}</td>
            <td class="px-4 py-3"><span class="badge text-xs" :class="typeBadge(m.type)">{{ typeLabel(m.type) }}</span></td>
            <td class="px-4 py-3 text-sm">
              <div class="font-medium">{{ m.produit?.libelle || 'Produit' }}</div>
              <div class="text-xs font-mono text-gray-500">{{ m.produit?.reference || '-' }}</div>
            </td>
            <td class="px-4 py-3 text-sm text-gray-600">{{ mouvementEntrepotLabel(m) }}</td>
            <td class="px-4 py-3 text-xs text-gray-600">
              <span>{{ mouvementEmplacementLabel(m) }}</span>
            </td>
            <td class="px-4 py-3 text-sm text-right font-mono font-semibold"
                :class="m.type === 'transfert' ? 'text-blue-700' : ['entree', 'ajustement'].includes(m.type) && parseFloat(m.quantite) >= 0 ? 'text-green-600' : 'text-red-600'">
              {{ m.type === 'transfert' ? '→ ' : ['sortie'].includes(m.type) ? '-' : (parseFloat(m.quantite) > 0 ? '+' : '') }}{{ formatQte(Math.abs(m.quantite)) }}
            </td>
            <td class="px-4 py-3 text-xs text-gray-600">{{ m.motif || '–' }}</td>
            <td class="px-4 py-3 text-xs text-gray-600">
              <span class="badge bg-slate-100 text-slate-700">{{ documentTypeLabel(m.document_type) }}</span>
              <div v-if="m.document_id" class="mt-1 font-mono text-[11px] text-slate-400">#{{ m.document_id }}</div>
            </td>
            <td class="px-4 py-3 text-xs text-gray-500">{{ m.user?.name || 'Utilisateur' }}</td>
          </tr>
          <tr v-if="mouvements.length === 0">
            <td colspan="9" class="px-4 py-12 text-center text-gray-400 text-sm">Aucun mouvement</td>
          </tr>
        </tbody>
      </table>
      </div>
      <Pagination v-if="meta.total > 0" :meta="meta" @page="reload" />
    </div>

    <!-- TAB: Alertes -->
    <div v-else-if="onglet === 'alertes'" class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div class="border-b border-cyan-100 bg-cyan-50 px-4 py-3">
        <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 class="text-base font-black text-slate-900">Alertes de réapprovisionnement</h2>
            <p class="text-xs text-cyan-800">
              Priorisez les ruptures, les stocks critiques et les quantités à recommander.
            </p>
          </div>
          <div class="flex flex-col gap-2">
          <div class="grid grid-cols-2 gap-2 sm:grid-cols-5">
            <button type="button" class="rounded-xl border px-3 py-2 text-right" :class="alertChipClass('')" @click="setAlertLevel('')">
              <p class="text-[10px] font-black uppercase tracking-[0.14em]">Total</p>
              <p class="font-mono text-lg font-black">{{ alertResume.total }}</p>
            </button>
            <button type="button" class="rounded-xl border px-3 py-2 text-right" :class="alertChipClass('rupture')" @click="setAlertLevel('rupture')">
              <p class="text-[10px] font-black uppercase tracking-[0.14em]">Ruptures</p>
              <p class="font-mono text-lg font-black">{{ alertResume.rupture }}</p>
            </button>
            <button type="button" class="rounded-xl border px-3 py-2 text-right" :class="alertChipClass('critique')" @click="setAlertLevel('critique')">
              <p class="text-[10px] font-black uppercase tracking-[0.14em]">Critiques</p>
              <p class="font-mono text-lg font-black">{{ alertResume.critique }}</p>
            </button>
            <div class="rounded-xl border border-cyan-200 bg-white px-3 py-2 text-right">
              <p class="text-[10px] font-black uppercase tracking-[0.14em] text-cyan-700">Qté reco.</p>
              <p class="font-mono text-lg font-black text-slate-900">{{ formatQte(alertResume.quantite_recommandee) }}</p>
            </div>
            <div class="rounded-xl border border-cyan-200 bg-white px-3 py-2 text-right">
              <p class="text-[10px] font-black uppercase tracking-[0.14em] text-cyan-700">Budget estimé</p>
              <p class="font-mono text-lg font-black text-slate-900">{{ formatPrice(alertResume.valeur_estimee) }}</p>
            </div>
          </div>
          <button
            type="button"
            class="btn-primary w-full rounded-xl px-4 py-2 text-sm"
            :disabled="alertDemandCreating || sortedAlertes.length === 0"
            @click="createPurchaseDemandFromAlerts()"
          >
            {{ alertDemandCreating ? 'Création...' : 'Créer demande d’achat du filtre' }}
          </button>
          </div>
        </div>
      </div>
      <div class="overflow-x-auto">
      <table class="w-full">
        <thead class="bg-gray-50 border-b border-gray-200">
          <tr>
            <SortableTh column="reference" :active="alerteSort.key === 'reference'" :icon="alerteSortIcon('reference')" @sort="toggleAlerteSort">Référence</SortableTh>
            <SortableTh column="produit" :active="alerteSort.key === 'produit'" :icon="alerteSortIcon('produit')" @sort="toggleAlerteSort">Produit</SortableTh>
            <SortableTh column="niveau" :active="alerteSort.key === 'niveau'" :icon="alerteSortIcon('niveau')" align="center" @sort="toggleAlerteSort">Urgence</SortableTh>
            <SortableTh column="stock" :active="alerteSort.key === 'stock'" :icon="alerteSortIcon('stock')" align="right" @sort="toggleAlerteSort">Stock actuel</SortableTh>
            <SortableTh column="seuil" :active="alerteSort.key === 'seuil'" :icon="alerteSortIcon('seuil')" align="right" @sort="toggleAlerteSort">Seuils</SortableTh>
            <SortableTh column="recommande" :active="alerteSort.key === 'recommande'" :icon="alerteSortIcon('recommande')" align="right" @sort="toggleAlerteSort">À recommander</SortableTh>
            <th class="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500">Action</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="a in sortedAlertes" :key="a.id" class="hover:bg-gray-50" :class="alertRowClass(a)">
            <td class="px-4 py-3 text-sm font-mono text-gray-600">{{ a.reference }}</td>
            <td class="px-4 py-3 text-center">
              <div class="text-left text-sm font-medium text-slate-900">{{ a.libelle }}</div>
              <div class="text-left text-xs text-slate-500">{{ a.unite || 'pièce' }}</div>
            </td>
            <td class="px-4 py-3 text-center">
              <span class="badge text-xs" :class="alertLevelBadge(a.niveau)">{{ alertLevelLabel(a.niveau) }}</span>
            </td>
            <td class="px-4 py-3 text-sm text-right font-mono font-bold" :class="a.niveau === 'rupture' ? 'text-red-700' : 'text-orange-700'">
              {{ formatQte(a.stock_total) }}
            </td>
            <td class="px-4 py-3 text-right text-xs text-gray-600">
              <div>Alerte : <strong class="font-mono">{{ a.stock_alerte }}</strong></div>
              <div>Sécurité : <strong class="font-mono">{{ a.stock_securite }}</strong></div>
              <div class="text-cyan-700">Pilotage : <strong class="font-mono">{{ a.seuil_pilotage }}</strong></div>
            </td>
            <td class="px-4 py-3 text-right">
              <div class="font-mono text-sm font-black text-cyan-700">{{ formatQte(a.quantite_recommandee) }} {{ a.unite || '' }}</div>
              <div class="text-xs text-slate-500">≈ {{ formatPrice(a.valeur_estimee) }}</div>
            </td>
            <td class="px-4 py-3 text-right">
              <div class="flex flex-wrap justify-end gap-2">
                <button
                  class="btn-primary px-3 py-1.5 text-xs"
                  :disabled="alertDemandCreatingId === a.id"
                  @click="createPurchaseDemandFromAlerts(a)"
                >
                  {{ alertDemandCreatingId === a.id ? 'Création...' : 'Demande achat' }}
                </button>
                <button class="btn-secondary px-3 py-1.5 text-xs" @click="openProduitFromAlert(a)">
                  Ajuster seuil
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="alertes.length === 0">
            <td colspan="7" class="px-4 py-12 text-center text-green-600 text-sm">
              ✅ Aucun produit en alerte de stock !
            </td>
          </tr>
        </tbody>
      </table>
      </div>
    </div>

    <!-- TAB: Réapprovisionnement intelligent -->
    <div v-else-if="onglet === 'reappro'" class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div class="border-b border-cyan-100 bg-cyan-50 px-4 py-3">
        <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 class="text-base font-black text-slate-900">Réapprovisionnement intelligent</h2>
            <p class="text-xs text-cyan-800">La proposition tient compte du disponible, des seuils et de la consommation récente.</p>
          </div>
          <div class="grid grid-cols-2 gap-2 md:grid-cols-4">
            <div class="rounded-xl border border-cyan-200 bg-white px-3 py-2 text-right">
              <p class="text-[10px] font-black uppercase tracking-[0.14em] text-cyan-700">Produits</p>
              <p class="font-mono text-lg font-black">{{ reapproResume.produits }}</p>
            </div>
            <div class="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-right">
              <p class="text-[10px] font-black uppercase tracking-[0.14em] text-red-700">Ruptures</p>
              <p class="font-mono text-lg font-black">{{ reapproResume.ruptures }}</p>
            </div>
            <div class="rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-right">
              <p class="text-[10px] font-black uppercase tracking-[0.14em] text-orange-700">Critiques</p>
              <p class="font-mono text-lg font-black">{{ reapproResume.critiques }}</p>
            </div>
            <div class="rounded-xl border border-cyan-200 bg-white px-3 py-2 text-right">
              <p class="text-[10px] font-black uppercase tracking-[0.14em] text-cyan-700">Budget</p>
              <p class="font-mono text-lg font-black">{{ formatPrice(reapproResume.budget_estime) }}</p>
            </div>
          </div>
        </div>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Produit</th>
              <th class="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500">Disponible</th>
              <th class="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500">Sorties période</th>
              <th class="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500">Couverture</th>
              <th class="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500">À commander</th>
              <th class="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500">Budget</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="row in reapproRows" :key="row.id" class="hover:bg-cyan-50/30">
              <td class="px-4 py-3">
                <p class="font-bold text-slate-900">{{ row.libelle }}</p>
                <p class="text-xs font-mono text-slate-500">{{ row.reference || '-' }} · <span class="badge text-xs" :class="alertLevelBadge(row.niveau)">{{ alertLevelLabel(row.niveau) }}</span></p>
              </td>
              <td class="px-4 py-3 text-right font-mono font-black" :class="stockAvailableClass({ quantite: row.stock_disponible, quantite_reservee: 0, produit: { stock_alerte: row.stock_alerte } })">
                {{ formatQte(row.stock_disponible) }}
              </td>
              <td class="px-4 py-3 text-right font-mono">{{ formatQte(row.sorties_periode) }}</td>
              <td class="px-4 py-3 text-right text-sm">
                {{ row.couverture_jours === null ? '∞' : `${row.couverture_jours} j` }}
                <p class="text-xs text-slate-500">{{ formatQte(row.moyenne_jour) }}/jour</p>
              </td>
              <td class="px-4 py-3 text-right font-mono font-black text-cyan-700">{{ formatQte(row.quantite_recommandee) }} {{ row.unite }}</td>
              <td class="px-4 py-3 text-right font-mono font-bold">{{ formatPrice(row.budget_estime) }}</td>
            </tr>
            <tr v-if="reapproRows.length === 0">
              <td colspan="6" class="px-4 py-12 text-center text-green-600 text-sm">Aucun besoin de réapprovisionnement détecté.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- TAB: Réservations -->
    <div v-else-if="onglet === 'reservations'" class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div class="border-b border-cyan-100 bg-cyan-50 px-4 py-3">
        <h2 class="text-base font-black text-slate-900">Réservations liées aux devis</h2>
        <p class="text-xs text-cyan-800">{{ reservationResume.active }} active(s), {{ formatQte(reservationResume.quantite_active) }} unité(s) bloquée(s).</p>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Devis / client</th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Produit</th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Localisation</th>
              <th class="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500">Quantité</th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Statut</th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Dates</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="r in reservations" :key="r.id" class="hover:bg-cyan-50/30">
              <td class="px-4 py-3">
                <p class="font-mono font-black text-slate-900">{{ r.devis?.numero || '-' }}</p>
                <p class="text-xs text-slate-500">{{ r.devis?.client?.nom || 'Client' }}</p>
              </td>
              <td class="px-4 py-3">
                <p class="font-bold text-slate-900">{{ r.produit?.libelle || 'Produit' }}</p>
                <p class="text-xs font-mono text-slate-500">{{ r.produit?.reference || '-' }}</p>
              </td>
              <td class="px-4 py-3 text-xs text-slate-600">
                <p class="font-bold text-slate-900">{{ r.stock?.entrepot?.libelle || '-' }}</p>
                <p>{{ emplacementLabel(r.stock?.emplacement) }}</p>
              </td>
              <td class="px-4 py-3 text-right font-mono font-black text-cyan-700">{{ formatQte(r.quantite) }} {{ r.produit?.unite || '' }}</td>
              <td class="px-4 py-3"><span class="badge text-xs" :class="reservationStatusBadge(r.statut)">{{ reservationStatusLabel(r.statut) }}</span></td>
              <td class="px-4 py-3 text-xs text-slate-500">
                <div>Réservé : {{ formatDateTime(r.reserved_at) }}</div>
                <div v-if="r.consumed_at">Consommé : {{ formatDateTime(r.consumed_at) }}</div>
                <div v-if="r.released_at">Libéré : {{ formatDateTime(r.released_at) }}</div>
              </td>
            </tr>
            <tr v-if="reservations.length === 0">
              <td colspan="6" class="px-4 py-12 text-center text-slate-400 text-sm">Aucune réservation avec ces filtres.</td>
            </tr>
          </tbody>
        </table>
      </div>
      <Pagination v-if="meta.total > 0" :meta="meta" @page="reload" />
    </div>

    <!-- TAB: Historique produit -->
    <div v-else-if="onglet === 'historique'" class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div class="border-b border-cyan-100 bg-cyan-50 px-4 py-3">
        <h2 class="text-base font-black text-slate-900">Historique complet par produit</h2>
        <p class="text-xs text-cyan-800">Vue synthétique : stock, réservations, mouvements cumulés et dernier mouvement.</p>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Produit</th>
              <th class="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500">Stock</th>
              <th class="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500">Réservé</th>
              <th class="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500">Entrées</th>
              <th class="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500">Sorties</th>
              <th class="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500">Valeur</th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Dernier mouvement</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="p in historiqueProduits" :key="p.id" class="hover:bg-cyan-50/30">
              <td class="px-4 py-3">
                <p class="font-bold text-slate-900">{{ p.libelle }}</p>
                <p class="text-xs font-mono text-slate-500">{{ p.reference || '-' }} · {{ p.categorie }}</p>
              </td>
              <td class="px-4 py-3 text-right font-mono font-bold">{{ formatQte(p.stock_total) }}</td>
              <td class="px-4 py-3 text-right font-mono" :class="Number(p.stock_reserve || 0) > 0 ? 'font-black text-amber-700' : 'text-slate-400'">{{ formatQte(p.stock_reserve) }}</td>
              <td class="px-4 py-3 text-right font-mono text-emerald-700">{{ formatQte(p.entrees) }}</td>
              <td class="px-4 py-3 text-right font-mono text-red-700">{{ formatQte(p.sorties) }}</td>
              <td class="px-4 py-3 text-right font-mono font-bold text-cyan-700">{{ formatPrice(p.valeur_stock) }}</td>
              <td class="px-4 py-3 text-xs text-slate-500">{{ p.dernier_mouvement ? formatDateTime(p.dernier_mouvement) : 'Jamais' }}</td>
            </tr>
            <tr v-if="historiqueProduits.length === 0">
              <td colspan="7" class="px-4 py-12 text-center text-slate-400 text-sm">Aucun produit trouvé.</td>
            </tr>
          </tbody>
        </table>
      </div>
      <Pagination v-if="meta.total > 0" :meta="meta" @page="reload" />
    </div>

    <!-- TAB: Séries / lots -->
    <div v-else-if="onglet === 'series'" class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div class="border-b border-cyan-100 bg-cyan-50 px-4 py-3">
        <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 class="text-base font-black text-slate-900">Numéros de série et lots</h2>
            <p class="text-xs text-cyan-800">{{ seriesResume.disponible }} disponible(s), {{ seriesResume.reserve }} réservé(s), {{ seriesResume.vendu }} vendu(s).</p>
          </div>
          <button class="btn-primary text-sm" @click="openSerieModal">+ Ajouter série / lot</button>
        </div>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Produit</th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Série / lot</th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Localisation</th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Statut</th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Garantie</th>
              <th class="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="s in series" :key="s.id" class="hover:bg-cyan-50/30">
              <td class="px-4 py-3">
                <p class="font-bold text-slate-900">{{ s.produit?.libelle || 'Produit' }}</p>
                <p class="text-xs font-mono text-slate-500">{{ s.produit?.reference || '-' }}</p>
              </td>
              <td class="px-4 py-3 text-sm">
                <p v-if="s.serial_number" class="font-mono font-black text-slate-900">SN {{ s.serial_number }}</p>
                <p v-if="s.lot_number" class="font-mono text-cyan-700">Lot {{ s.lot_number }}</p>
              </td>
              <td class="px-4 py-3 text-xs text-slate-600">{{ s.entrepot?.libelle || '-' }} · {{ emplacementLabel(s.emplacement) }}</td>
              <td class="px-4 py-3"><span class="badge text-xs" :class="serieStatusBadge(s.statut)">{{ serieStatusLabel(s.statut) }}</span></td>
              <td class="px-4 py-3 text-xs text-slate-500">{{ s.garantie_jusquau || '-' }}</td>
              <td class="px-4 py-3 text-right">
                <select class="input py-1 text-xs" :value="s.statut" @change="updateSerieStatus(s, $event.target.value)">
                  <option value="disponible">Disponible</option>
                  <option value="reserve">Réservé</option>
                  <option value="vendu">Vendu</option>
                  <option value="sav">SAV</option>
                  <option value="sorti">Sorti</option>
                  <option value="perdu">Perdu</option>
                </select>
              </td>
            </tr>
            <tr v-if="series.length === 0">
              <td colspan="6" class="px-4 py-12 text-center text-slate-400 text-sm">Aucun numéro de série ou lot enregistré.</td>
            </tr>
          </tbody>
        </table>
      </div>
      <Pagination v-if="meta.total > 0" :meta="meta" @page="reload" />
    </div>

    <!-- TAB: Étiquettes -->
    <div v-else-if="onglet === 'etiquettes'" class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div class="border-b border-cyan-100 bg-cyan-50 px-4 py-3">
        <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 class="text-base font-black text-slate-900">Étiquettes produits</h2>
            <p class="text-xs text-cyan-800">Prévisualisez les étiquettes à imprimer pour les produits actuellement en stock.</p>
          </div>
          <button class="btn-primary text-sm" @click="openEtiquettesPdf">Imprimer PDF</button>
        </div>
      </div>
      <div class="grid grid-cols-1 gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
        <article v-for="label in etiquettes" :key="label.id" class="rounded-2xl border border-cyan-200 bg-cyan-50/50 p-4">
          <p class="font-black text-slate-900">{{ label.libelle }}</p>
          <p class="text-xs font-mono text-slate-500">{{ label.reference || '-' }}</p>
          <div class="my-3 rounded-xl border border-dashed border-cyan-400 bg-white px-3 py-2 text-center font-mono text-lg font-black tracking-[0.2em] text-cyan-800">
            {{ label.code_barre || label.reference || label.id }}
          </div>
          <p class="text-xs text-slate-600">{{ label.entrepot }} · {{ label.emplacement }}</p>
          <p class="mt-2 text-right font-black text-cyan-700">{{ formatPrice(label.prix_vente_ht) }} XOF</p>
        </article>
        <p v-if="etiquettes.length === 0" class="col-span-full rounded-xl bg-slate-50 p-8 text-center text-sm text-slate-400">Aucune étiquette à afficher.</p>
      </div>
    </div>

    <!-- TAB: Contrôles -->
    <div v-else-if="onglet === 'validations'" class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div class="border-b border-cyan-100 bg-cyan-50 px-4 py-3">
        <h2 class="text-base font-black text-slate-900">Contrôle des mouvements sensibles</h2>
        <p class="text-xs text-cyan-800">{{ validationResume.a_valider }} mouvement(s) à contrôler, {{ validationResume.valide }} validé(s).</p>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Mouvement</th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Produit</th>
              <th class="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500">Quantité</th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Motif</th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Validation</th>
              <th class="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="m in validations" :key="m.id" class="hover:bg-cyan-50/30">
              <td class="px-4 py-3 text-xs text-slate-500">{{ formatDateTime(m.date_mouvement) }}<br><span class="badge bg-slate-100 text-slate-700">{{ typeLabel(m.type) }}</span></td>
              <td class="px-4 py-3"><p class="font-bold">{{ m.produit?.libelle || 'Produit' }}</p><p class="text-xs font-mono text-slate-500">{{ m.produit?.reference || '-' }}</p></td>
              <td class="px-4 py-3 text-right font-mono font-black">{{ formatQte(m.quantite) }}</td>
              <td class="px-4 py-3 text-xs text-slate-600">{{ m.motif || '-' }}</td>
              <td class="px-4 py-3 text-xs">
                <span v-if="m.validation?.statut === 'valide'" class="badge bg-emerald-100 text-emerald-800">Validé par {{ m.validation?.validator?.name || 'admin' }}</span>
                <span v-else class="badge bg-orange-100 text-orange-800">À valider</span>
              </td>
              <td class="px-4 py-3 text-right">
                <button v-if="m.validation?.statut !== 'valide'" class="btn-primary px-3 py-1.5 text-xs" @click="validateMovement(m)">Valider</button>
                <span v-else class="text-xs text-slate-400">OK</span>
              </td>
            </tr>
            <tr v-if="validations.length === 0">
              <td colspan="6" class="px-4 py-12 text-center text-slate-400 text-sm">Aucun mouvement sensible avec ces filtres.</td>
            </tr>
          </tbody>
        </table>
      </div>
      <Pagination v-if="meta.total > 0" :meta="meta" @page="reload" />
    </div>

    <!-- TAB: Rapports -->
    <div v-else-if="onglet === 'rapports'" class="space-y-4">
      <div class="grid grid-cols-1 gap-3 md:grid-cols-4">
        <div class="rounded-2xl border border-cyan-200 bg-cyan-50 p-4">
          <p class="text-xs font-black uppercase tracking-[0.16em] text-cyan-700">Valeur stock</p>
          <p class="mt-2 text-2xl font-black">{{ formatPrice(rapports.summary.valeur_stock) }}</p>
        </div>
        <div class="rounded-2xl border border-cyan-200 bg-white p-4">
          <p class="text-xs font-black uppercase tracking-[0.16em] text-cyan-700">Disponible</p>
          <p class="mt-2 text-2xl font-black">{{ formatQte(rapports.summary.quantite_disponible) }}</p>
        </div>
        <div class="rounded-2xl border border-cyan-200 bg-white p-4">
          <p class="text-xs font-black uppercase tracking-[0.16em] text-cyan-700">Réservé</p>
          <p class="mt-2 text-2xl font-black">{{ formatQte(rapports.summary.quantite_reservee) }}</p>
        </div>
        <div class="rounded-2xl border border-cyan-200 bg-white p-4">
          <p class="text-xs font-black uppercase tracking-[0.16em] text-cyan-700">Alertes</p>
          <p class="mt-2 text-2xl font-black">{{ rapports.summary.alertes || 0 }}</p>
        </div>
      </div>
      <div class="rounded-2xl border border-cyan-200 bg-white p-4">
        <h2 class="text-base font-black text-slate-900">Exports PDF</h2>
        <p class="mb-4 text-sm text-slate-500">Générez les états propres pour contrôle, inventaire ou transmission interne.</p>
        <div class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <button v-for="report in rapports.exports" :key="report.url" class="btn-secondary justify-center py-3 text-sm" @click="openPdf(report.url)">
            {{ report.label }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal mouvement -->
    <AppModal v-model="showMouvementModal" :title="mouvementTitle" size="md">
      <MouvementForm :type="mouvementType" :entrepots="entrepots" @saved="onMouvementSaved" @cancel="showMouvementModal = false" />
    </AppModal>

    <AppModal v-model="showSerieModal" title="Ajouter une série / un lot" size="md">
      <form class="space-y-4" @submit.prevent="saveSerie">
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700">Ligne de stock <span class="text-red-500">*</span></label>
          <select v-model.number="serieForm.stock_id" class="input" required @change="syncSerieProductFromStock">
            <option value="">— Sélectionnez une ligne —</option>
            <option v-for="stock in stockOptions" :key="stock.id" :value="stock.id">
              {{ stock.produit?.reference || '-' }} — {{ stock.produit?.libelle || 'Produit' }} · {{ stock.entrepot?.libelle || '-' }} · {{ emplacementLabel(stock.emplacement) }}
            </option>
          </select>
        </div>
        <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label class="block text-sm font-medium text-gray-700">
            Numéro de série
            <input v-model="serieForm.serial_number" class="input mt-1" placeholder="SN, IMEI, clé..." />
          </label>
          <label class="block text-sm font-medium text-gray-700">
            Numéro de lot
            <input v-model="serieForm.lot_number" class="input mt-1" placeholder="Lot, batch..." />
          </label>
        </div>
        <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label class="block text-sm font-medium text-gray-700">
            Statut
            <select v-model="serieForm.statut" class="input mt-1">
              <option value="disponible">Disponible</option>
              <option value="reserve">Réservé</option>
              <option value="vendu">Vendu</option>
              <option value="sav">SAV</option>
              <option value="sorti">Sorti</option>
              <option value="perdu">Perdu</option>
            </select>
          </label>
          <label class="block text-sm font-medium text-gray-700">
            Garantie jusqu’au
            <input v-model="serieForm.garantie_jusquau" type="date" class="input mt-1" />
          </label>
        </div>
        <label class="block text-sm font-medium text-gray-700">
          Notes
          <textarea v-model="serieForm.notes" class="input mt-1 min-h-20" placeholder="État, provenance, remarque SAV..."></textarea>
        </label>
        <div class="flex justify-end gap-2 border-t border-gray-200 pt-3">
          <button type="button" class="btn-secondary" @click="showSerieModal = false">Annuler</button>
          <button class="btn-primary" :disabled="serieSaving">{{ serieSaving ? 'Enregistrement...' : 'Enregistrer' }}</button>
        </div>
      </form>
    </AppModal>

    <AppModal v-model="showDeplacementModal" title="Déplacer le stock" size="md">
      <form class="space-y-4" @submit.prevent="deplacerStock">
        <div class="rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
          <strong>{{ stockADeplacer.produit?.reference || '' }} — {{ stockADeplacer.produit?.libelle || 'Produit' }}</strong>
          <p class="mt-1">Quantité à déplacer : {{ formatQte(stockADeplacer.quantite) }} {{ stockADeplacer.produit?.unite || '' }}</p>
          <p>Entrepôt : {{ stockADeplacer.entrepot?.libelle || '-' }}</p>
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700">Nouvel emplacement <span class="text-red-500">*</span></label>
          <select v-model.number="deplacementForm.emplacement_id" class="input" required>
            <option :value="null">— Sélectionnez —</option>
            <option v-for="emp in emplacementsDeplacement" :key="emp.id" :value="emp.id">{{ emplacementLabel(emp) }}</option>
          </select>
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700">Motif</label>
          <input v-model="deplacementForm.motif" class="input" placeholder="Rangement, correction d'emplacement..." />
        </div>
        <div class="flex justify-end gap-2 border-t border-gray-200 pt-3">
          <button type="button" class="btn-secondary" @click="showDeplacementModal = false">Annuler</button>
          <button class="btn-primary" :disabled="deplacementSaving">{{ deplacementSaving ? 'Déplacement...' : 'Déplacer le stock' }}</button>
        </div>
      </form>
    </AppModal>

    <AppModal v-model="showTransfertModal" title="Envoyer vers un autre entrepôt" size="md">
      <form class="space-y-4" @submit.prevent="transfererStock">
        <div class="rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
          <strong>{{ stockATransferer?.produit?.reference || '' }} — {{ stockATransferer?.produit?.libelle || 'Produit' }}</strong>
          <p class="mt-1">Source : {{ stockATransferer?.entrepot?.libelle || '-' }} · {{ emplacementLabel(stockATransferer?.emplacement) }}</p>
          <p>Disponible : {{ formatQte(transfertDisponible) }} {{ stockATransferer?.produit?.unite || '' }}</p>
          <p class="mt-2 text-xs font-bold">Le stock destination sera augmenté seulement après réception du transfert.</p>
        </div>

        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700">Entrepôt destination <span class="text-red-500">*</span></label>
          <select v-model.number="transfertForm.destination_entrepot_id" class="input" required @change="loadEmplacementsTransfert">
            <option :value="null">— Sélectionnez —</option>
            <option v-for="entrepot in entrepotsDestination" :key="entrepot.id" :value="entrepot.id">
              {{ entrepot.libelle }}
            </option>
          </select>
        </div>

        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700">Emplacement destination</label>
          <select
            v-model.number="transfertForm.destination_emplacement_id"
            class="input"
            :required="hasTransfertEmplacements"
            :disabled="transfertLoadingEmplacements || !hasTransfertEmplacements"
          >
            <option :value="null">
              {{ transfertLoadingEmplacements ? 'Chargement...' : hasTransfertEmplacements ? '— Sélectionnez un emplacement —' : 'Aucun emplacement configuré' }}
            </option>
            <option v-for="emp in emplacementsTransfert" :key="emp.id" :value="emp.id">
              {{ emplacementLabel(emp) }}
            </option>
          </select>
          <p class="mt-1 text-xs" :class="hasTransfertEmplacements ? 'text-blue-700' : 'text-gray-500'">
            {{ hasTransfertEmplacements ? 'Obligatoire : l’entrepôt destination possède des rayons.' : 'Le stock sera transféré sans emplacement précis.' }}
          </p>
        </div>

        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700">Quantité à transférer <span class="text-red-500">*</span></label>
          <input
            v-model.number="transfertForm.quantite"
            type="number"
            step="0.001"
            min="0.001"
            :max="transfertDisponible || undefined"
            class="input"
            required
          />
        </div>

        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700">Motif</label>
          <input v-model="transfertForm.motif" class="input" placeholder="Réapprovisionnement, transfert boutique, SAV..." />
        </div>

        <div class="flex justify-end gap-2 border-t border-gray-200 pt-3">
          <button type="button" class="btn-secondary" @click="showTransfertModal = false">Annuler</button>
          <button class="btn-primary" :disabled="transfertSaving || !transfertForm.destination_entrepot_id">
            {{ transfertSaving ? 'Envoi...' : 'Envoyer le transfert' }}
          </button>
        </div>
      </form>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, computed, h, watch } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'
import AppModal from '@/components/AppModal.vue'
import MouvementForm from '@/components/MouvementForm.vue'
import SortableTh from '@/components/SortableTh.vue'
import { useToast } from '@/composables/useToast'
import { useTableSort } from '@/composables/useTableSort'
import { telechargerCSV } from '@/services/exports'

const toast = useToast()
const router = useRouter()
const onglet = ref('overview')
const stocks = ref([])
const mouvements = ref([])
const transferts = ref([])
const alertes = ref([])
const reservations = ref([])
const historiqueProduits = ref([])
const reapproRows = ref([])
const series = ref([])
const etiquettes = ref([])
const validations = ref([])
const stockOptions = ref([])
const stockSummary = ref(emptyStockSummary())
const stockValuation = ref(emptyStockValuation())
const inventorySessions = ref([])
const activeInventory = ref(null)
const movementResume = ref(emptyMovementResume())
const transferResume = ref(emptyTransferResume())
const alertResume = ref(emptyAlertResume())
const reservationResume = ref(emptyReservationResume())
const reapproResume = ref(emptyReapproResume())
const seriesResume = ref(emptySeriesResume())
const validationResume = ref(emptyValidationResume())
const rapports = ref(emptyRapports())
const mouvementTypeOptions = [
  { value: '', label: 'Tous les mouvements', shortLabel: 'Tous' },
  { value: 'entree', label: 'Entrées', shortLabel: 'Entrées' },
  { value: 'sortie', label: 'Sorties', shortLabel: 'Sorties' },
  { value: 'transfert', label: 'Transferts', shortLabel: 'Transferts' },
  { value: 'ajustement', label: 'Ajustements', shortLabel: 'Ajust.' },
]
const {
  sort: stockSort,
  toggleSort: toggleStockSort,
  sortIcon: stockSortIcon,
  sortedRows: sortedStockRows,
} = useTableSort('produit')
const {
  sort: mouvementSort,
  toggleSort: toggleMouvementSort,
  sortIcon: mouvementSortIcon,
  sortedRows: sortedMouvementRows,
} = useTableSort('date', 'desc')
const {
  sort: alerteSort,
  toggleSort: toggleAlerteSort,
  sortIcon: alerteSortIcon,
  sortedRows: sortedAlerteRows,
} = useTableSort('produit')
const entrepots = ref([])
const loading = ref(false)
const exportLoading = ref(false)
const meta = reactive({ current_page: 1, last_page: 1, total: 0, from: 0, to: 0 })
const filters = reactive({
  search: '',
  entrepot_id: '',
  type: '',
  document_type: '',
  transfer_statut: '',
  alert_niveau: '',
  dormant_days: 90,
  date_from: '',
  date_to: '',
  reservation_statut: 'active',
  series_statut: '',
  validation_statut: 'a_valider',
  reappro_period: 90,
})
const inventoryDrafts = reactive({})
const inventoryLineDrafts = reactive({})
const inventorySavingId = ref(null)
const inventorySessionLoading = ref(false)
const inventorySessionActionLoading = ref(false)
const inventoryLineSavingId = ref(null)
const transferActionId = ref(null)
const alertDemandCreating = ref(false)
const alertDemandCreatingId = ref(null)
const showSerieModal = ref(false)
const serieSaving = ref(false)
const serieForm = reactive({
  produit_id: '',
  stock_id: '',
  serial_number: '',
  lot_number: '',
  statut: 'disponible',
  garantie_jusquau: '',
  notes: '',
})

const showMouvementModal = ref(false)
const mouvementType = ref('entree')
const showDeplacementModal = ref(false)
const stockADeplacer = ref(null)
const emplacementsDeplacement = ref([])
const deplacementSaving = ref(false)
const deplacementForm = reactive({ emplacement_id: null, motif: '' })
const showTransfertModal = ref(false)
const stockATransferer = ref(null)
const emplacementsTransfert = ref([])
const transfertSaving = ref(false)
const transfertLoadingEmplacements = ref(false)
const transfertForm = reactive({
  destination_entrepot_id: null,
  destination_emplacement_id: null,
  quantite: 1,
  motif: '',
})

const mouvementTitle = computed(() => ({
  entree: '📥 Entrée en stock',
  sortie: '📤 Sortie de stock',
  ajustement: '⚙️ Ajustement d\'inventaire',
}[mouvementType.value]))

const sortedStocks = computed(() => sortedStockRows(stocks.value, {
  reference: (stock) => stock.produit?.reference || '',
  produit: (stock) => stock.produit?.libelle || '',
  entrepot: (stock) => stock.entrepot?.libelle || '',
  emplacement: (stock) => emplacementLabel(stock.emplacement),
  quantite: (stock) => parseFloat(stock.quantite || 0),
  reservee: (stock) => stockReservedQty(stock),
  disponible: (stock) => stockAvailableQty(stock),
  total_produit: (stock) => parseFloat(stock.stock_total_produit || 0),
  pmp: (stock) => parseFloat(stock.pmp || 0),
  valeur: (stock) => parseFloat(stock.quantite || 0) * parseFloat(stock.pmp || 0),
}))

const sortedMouvements = computed(() => sortedMouvementRows(mouvements.value, {
  date: 'date_mouvement',
  type: 'type',
  produit: (mouvement) => mouvement.produit?.libelle || '',
  entrepot: (mouvement) => mouvementEntrepotLabel(mouvement),
  emplacement: (mouvement) => mouvementEmplacementLabel(mouvement),
  quantite: (mouvement) => parseFloat(mouvement.quantite || 0),
  motif: 'motif',
  document: (mouvement) => documentTypeLabel(mouvement.document_type),
  user: (mouvement) => mouvement.user?.name || '',
}))

const sortedAlertes = computed(() => sortedAlerteRows(alertes.value, {
  reference: 'reference',
  produit: 'libelle',
  niveau: (alerte) => alertLevelRank(alerte.niveau),
  stock: (alerte) => parseFloat(alerte.stock_total || 0),
  seuil: (alerte) => parseFloat(alerte.seuil_pilotage || alerte.stock_alerte || 0),
  recommande: (alerte) => parseFloat(alerte.quantite_recommandee || 0),
}))

const entrepotsDestination = computed(() => {
  const sourceId = Number(stockATransferer.value?.entrepot_id || 0)
  return entrepots.value.filter((entrepot) => Number(entrepot.id) !== sourceId)
})

const transfertDisponible = computed(() => {
  const stock = stockATransferer.value
  if (!stock) return 0
  return Math.max(0, parseFloat(stock.quantite || 0) - parseFloat(stock.quantite_reservee || 0))
})

const inventorySessionCanValidate = computed(() => {
  const inventory = activeInventory.value
  return inventory?.statut === 'en_cours'
    && Number(inventory?.resume?.lignes || 0) > 0
    && Number(inventory?.resume?.a_compter || 0) === 0
})

const hasTransfertEmplacements = computed(() => emplacementsTransfert.value.length > 0)

// Composant Pagination inline
const Pagination = {
  props: ['meta'],
  emits: ['page'],
  setup(props, { emit }) {
    return () => h('div', { class: 'px-4 py-3 border-t border-gray-200 flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between' }, [
      h('div', { class: 'text-gray-600' }, [`${props.meta.from}-${props.meta.to} sur ${props.meta.total}`]),
      h('div', { class: 'flex gap-2' }, [
        h('button', {
          onClick: () => emit('page', props.meta.current_page - 1),
          disabled: props.meta.current_page === 1,
          class: 'btn-secondary px-3 py-1.5 disabled:opacity-40',
        }, '←'),
        h('span', { class: 'px-3 py-1.5 text-gray-600' }, `${props.meta.current_page} / ${props.meta.last_page}`),
        h('button', {
          onClick: () => emit('page', props.meta.current_page + 1),
          disabled: props.meta.current_page === props.meta.last_page,
          class: 'btn-secondary px-3 py-1.5 disabled:opacity-40',
        }, '→'),
      ]),
    ])
  },
}

let searchTimeout = null
let reloadRequestId = 0
function onSearchInput() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => reload(1), 350)
}

async function reload(page = 1) {
  const requestId = ++reloadRequestId
  const tab = onglet.value
  loading.value = true
  try {
    if (tab === 'overview') {
      const { data } = await api.get('/stocks/summary')
      if (requestId !== reloadRequestId || tab !== onglet.value) return
      stockSummary.value = normalizeStockSummary(data)
      Object.assign(meta, { current_page: 1, last_page: 1, total: 0, from: 0, to: 0 })
    } else if (tab === 'valorisation') {
      const { data } = await api.get('/stocks/summary', { params: valuationFilterParams() })
      if (requestId !== reloadRequestId || tab !== onglet.value) return
      stockValuation.value = normalizeStockValuation(data)
      Object.assign(meta, { current_page: 1, last_page: 1, total: 0, from: 0, to: 0 })
    } else if (tab === 'stock' || tab === 'inventaire') {
      const { data } = await api.get('/stocks', { params: { page, per_page: 25, search: filters.search || undefined, entrepot_id: filters.entrepot_id || undefined } })
      if (requestId !== reloadRequestId || tab !== onglet.value) return
      stocks.value = data.data
      if (tab === 'inventaire') {
        prepareInventoryDrafts(stocks.value)
        await loadInventorySessions()
      }
      Object.assign(meta, { current_page: data.current_page, last_page: data.last_page, total: data.total, from: data.from || 0, to: data.to || 0 })
    } else if (tab === 'mouvements') {
      const { data } = await api.get('/stocks/mouvements', { params: { page, per_page: 25, ...movementFilterParams() } })
      if (requestId !== reloadRequestId || tab !== onglet.value) return
      mouvements.value = data.data
      movementResume.value = normalizeMovementResume(data.resume)
      Object.assign(meta, { current_page: data.current_page, last_page: data.last_page, total: data.total, from: data.from || 0, to: data.to || 0 })
    } else if (tab === 'transferts') {
      const { data } = await api.get('/stocks/transferts', { params: { page, per_page: 25, ...transferFilterParams() } })
      if (requestId !== reloadRequestId || tab !== onglet.value) return
      transferts.value = data.data || []
      transferResume.value = normalizeTransferResume(data.resume)
      Object.assign(meta, { current_page: data.current_page, last_page: data.last_page, total: data.total, from: data.from || 0, to: data.to || 0 })
    } else if (tab === 'alertes') {
      const { data } = await api.get('/stocks/alerts', { params: alertFilterParams() })
      if (requestId !== reloadRequestId || tab !== onglet.value) return
      alertes.value = Array.isArray(data) ? data : data.data || []
      alertResume.value = normalizeAlertResume(data?.resume)
      Object.assign(meta, { current_page: 1, last_page: 1, total: alertes.value.length, from: alertes.value.length ? 1 : 0, to: alertes.value.length })
    } else if (tab === 'reappro') {
      const { data } = await api.get('/stocks/reapprovisionnement', { params: reapproFilterParams() })
      if (requestId !== reloadRequestId || tab !== onglet.value) return
      reapproRows.value = Array.isArray(data?.data) ? data.data : []
      reapproResume.value = normalizeReapproResume(data?.resume)
      Object.assign(meta, { current_page: 1, last_page: 1, total: reapproRows.value.length, from: reapproRows.value.length ? 1 : 0, to: reapproRows.value.length })
    } else if (tab === 'reservations') {
      const { data } = await api.get('/stocks/reservations', { params: { page, per_page: 25, search: filters.search || undefined, statut: filters.reservation_statut || undefined } })
      if (requestId !== reloadRequestId || tab !== onglet.value) return
      reservations.value = data.data || []
      reservationResume.value = normalizeReservationResume(data.resume)
      Object.assign(meta, { current_page: data.current_page, last_page: data.last_page, total: data.total, from: data.from || 0, to: data.to || 0 })
    } else if (tab === 'historique') {
      const { data } = await api.get('/stocks/historique-produits', { params: { page, per_page: 25, search: filters.search || undefined, entrepot_id: filters.entrepot_id || undefined } })
      if (requestId !== reloadRequestId || tab !== onglet.value) return
      historiqueProduits.value = data.data || []
      Object.assign(meta, { current_page: data.current_page, last_page: data.last_page, total: data.total, from: data.from || 0, to: data.to || 0 })
    } else if (tab === 'series') {
      const { data } = await api.get('/stocks/series', { params: { page, per_page: 25, search: filters.search || undefined, statut: filters.series_statut || undefined } })
      if (requestId !== reloadRequestId || tab !== onglet.value) return
      series.value = data.data || []
      seriesResume.value = normalizeSeriesResume(data.resume)
      Object.assign(meta, { current_page: data.current_page, last_page: data.last_page, total: data.total, from: data.from || 0, to: data.to || 0 })
    } else if (tab === 'etiquettes') {
      const { data } = await api.get('/stocks/etiquettes', { params: { search: filters.search || undefined, entrepot_id: filters.entrepot_id || undefined } })
      if (requestId !== reloadRequestId || tab !== onglet.value) return
      etiquettes.value = Array.isArray(data?.data) ? data.data : []
      Object.assign(meta, { current_page: 1, last_page: 1, total: etiquettes.value.length, from: etiquettes.value.length ? 1 : 0, to: etiquettes.value.length })
    } else if (tab === 'validations') {
      const { data } = await api.get('/stocks/validations', { params: { page, per_page: 25, search: filters.search || undefined, statut: filters.validation_statut || undefined } })
      if (requestId !== reloadRequestId || tab !== onglet.value) return
      validations.value = data.data || []
      validationResume.value = normalizeValidationResume(data.resume)
      Object.assign(meta, { current_page: data.current_page, last_page: data.last_page, total: data.total, from: data.from || 0, to: data.to || 0 })
    } else if (tab === 'rapports') {
      const { data } = await api.get('/stocks/rapports')
      if (requestId !== reloadRequestId || tab !== onglet.value) return
      rapports.value = normalizeRapports(data)
      Object.assign(meta, { current_page: 1, last_page: 1, total: 0, from: 0, to: 0 })
    }
  } catch (e) {
    toast.error('Erreur de chargement')
  } finally {
    if (requestId === reloadRequestId) {
      loading.value = false
    }
  }
}

async function loadEntrepots() {
  const { data } = await api.get('/entrepots', { params: { actifs_seulement: 1 } })
  entrepots.value = Array.isArray(data) ? data : data.data || []
}

async function exporterCSV() {
  exportLoading.value = true
  try {
    if (onglet.value === 'mouvements') {
      await telechargerCSV('/exports/stocks-mouvements', movementFilterParams(), 'mouvements_stock_saytu.csv')
      toast.success('Export des mouvements de stock téléchargé.')
      return
    }

    if (onglet.value === 'transferts') {
      const transferDocumentType = {
        envoye: 'stock_transfer_sent',
        recu: 'stock_transfer_received',
        annule: 'stock_transfer_cancelled',
      }[filters.transfer_statut] || undefined
      await telechargerCSV('/exports/stocks-mouvements', {
        search: filters.search || undefined,
        entrepot_id: filters.entrepot_id || undefined,
        document_type: transferDocumentType,
        type: 'transfert',
      }, 'transferts_stock_saytu.csv')
      toast.success('Export des transferts de stock téléchargé.')
      return
    }

    await telechargerCSV('/exports/stocks', {
      search: filters.search || undefined,
      entrepot_id: filters.entrepot_id || undefined,
    }, 'stock_saytu.csv')
    toast.success('Export du stock téléchargé.')
  } catch (e) {
    toast.error('Export impossible pour le moment.')
  } finally {
    exportLoading.value = false
  }
}

function openMouvement(type) {
  mouvementType.value = type
  showMouvementModal.value = true
}

function onMouvementSaved() {
  showMouvementModal.value = false
  reload()
  if (onglet.value !== 'overview') {
    stockSummary.value = emptyStockSummary()
  }
  if (onglet.value !== 'valorisation') {
    stockValuation.value = emptyStockValuation()
  }
}

function formatQte(n) { return parseFloat(n || 0).toLocaleString('fr-FR', { maximumFractionDigits: 3 }) }
function formatPrice(n) { return new Intl.NumberFormat('fr-FR').format(Math.round(n || 0))  }
function formatDateTime(d) { return d ? new Date(d).toLocaleString('fr-FR') : '–' }
function stockReservedQty(stock) {
  return Math.max(0, Number(stock?.quantite_reservee || 0))
}
function stockAvailableQty(stock) {
  return Math.max(0, Number(stock?.quantite || 0) - stockReservedQty(stock))
}
function stockAvailableClass(stock) {
  const available = stockAvailableQty(stock)
  const alertThreshold = Number(stock?.produit?.stock_alerte || 0)
  if (available <= 0) return 'text-red-700'
  if (alertThreshold > 0 && available <= alertThreshold) return 'text-orange-700'
  return 'text-emerald-700'
}
function formatSignedQte(n) {
  const value = Number(n || 0)
  if (Math.abs(value) < 0.0001) return '0'
  return `${value > 0 ? '+' : '-'}${formatQte(Math.abs(value))}`
}
function typeLabel(t) { return { entree: 'Entrée', sortie: 'Sortie', transfert: 'Transfert', ajustement: 'Ajustement', inventaire: 'Inventaire' }[t] || t }
function emplacementLabel(emp) {
  if (!emp) return 'Sans emplacement'
  return [
    emp.allee && `Rayon ${emp.allee}`,
    emp.rangee && `Rangée ${emp.rangee}`,
    emp.niveau && `Niveau ${emp.niveau}`,
    emp.code,
  ].filter(Boolean).join(' / ')
}

function destinationEntrepot(mouvement) {
  return mouvement?.destination_entrepot || mouvement?.destinationEntrepot || null
}

function destinationEmplacement(mouvement) {
  return mouvement?.destination_emplacement || mouvement?.destinationEmplacement || null
}

function mouvementEntrepotLabel(mouvement) {
  if (mouvement?.type === 'transfert' && destinationEntrepot(mouvement)) {
    return `${mouvement.entrepot?.libelle || 'Source'} → ${destinationEntrepot(mouvement)?.libelle || 'Destination'}`
  }

  return mouvement?.entrepot?.libelle || 'Entrepôt'
}

function mouvementEmplacementLabel(mouvement) {
  if (mouvement?.type === 'transfert' && destinationEntrepot(mouvement)) {
    return `${emplacementLabel(mouvement.emplacement)} → ${emplacementLabel(destinationEmplacement(mouvement))}`
  }

  return mouvement?.emplacement ? emplacementLabel(mouvement.emplacement) : 'Sans emplacement'
}

async function openDeplacement(stock) {
  stockADeplacer.value = stock
  deplacementForm.emplacement_id = null
  deplacementForm.motif = stock.emplacement ? 'Déplacement de stock' : 'Affectation d’un emplacement'
  try {
    const { data } = await api.get(`/entrepots/${stock.entrepot_id}`)
    emplacementsDeplacement.value = (data.entrepot?.zones || []).filter(zone => zone.is_active !== false).flatMap(zone =>
      (zone.emplacements || []).filter(emp => emp.is_active !== false && emp.id !== stock.emplacement_id).map(emp => ({ ...emp, zone }))
    )
    if (emplacementsDeplacement.value.length === 0) {
      toast.error('Aucun autre emplacement disponible dans cet entrepôt.')
      return
    }
    showDeplacementModal.value = true
  } catch (e) {
    toast.error('Impossible de charger les emplacements.')
  }
}

async function deplacerStock() {
  if (!stockADeplacer.value) return
  deplacementSaving.value = true
  try {
    await api.post(`/stocks/${stockADeplacer.value.id}/deplacer`, deplacementForm)
    toast.success('Stock déplacé vers le nouvel emplacement.')
    showDeplacementModal.value = false
    await reload(meta.current_page)
  } catch (e) {
    toast.error(e.response?.data?.errors?.emplacement_id?.[0] || e.response?.data?.message || 'Déplacement impossible.')
  } finally {
    deplacementSaving.value = false
  }
}

async function openTransfert(stock) {
  stockATransferer.value = stock
  emplacementsTransfert.value = []
  transfertForm.destination_emplacement_id = null
  transfertForm.quantite = transfertDisponible.value >= 1 ? 1 : transfertDisponible.value
  transfertForm.motif = 'Transfert inter-entrepôts'

  if (transfertDisponible.value <= 0) {
    toast.error('Aucune quantité disponible à transférer sur cette ligne.')
    return
  }

  const destination = entrepotsDestination.value[0]
  transfertForm.destination_entrepot_id = destination?.id || null

  if (!destination) {
    toast.error('Ajoutez au moins un autre entrepôt actif avant de transférer.')
    return
  }

  await loadEmplacementsTransfert()
  showTransfertModal.value = true
}

async function loadEmplacementsTransfert() {
  emplacementsTransfert.value = []
  transfertForm.destination_emplacement_id = null

  if (!transfertForm.destination_entrepot_id) return

  transfertLoadingEmplacements.value = true
  try {
    const { data } = await api.get(`/entrepots/${transfertForm.destination_entrepot_id}`)
    emplacementsTransfert.value = (data.entrepot?.zones || []).filter(zone => zone.is_active !== false).flatMap(zone =>
      (zone.emplacements || []).filter(emp => emp.is_active !== false).map(emp => ({ ...emp, zone }))
    )
  } catch (e) {
    toast.error('Impossible de charger les emplacements destination.')
  } finally {
    transfertLoadingEmplacements.value = false
  }
}

async function transfererStock() {
  if (!stockATransferer.value) return

  transfertSaving.value = true
  try {
    await api.post(`/stocks/${stockATransferer.value.id}/transferer`, transfertForm)
    toast.success('Transfert envoyé. Il reste en attente de réception à destination.')
    showTransfertModal.value = false
    if (onglet.value !== 'transferts') {
      onglet.value = 'transferts'
    } else {
      await reload(1)
    }
  } catch (e) {
    const errors = e.response?.data?.errors || {}
    toast.error(
      errors.quantite?.[0]
        || errors.destination_entrepot_id?.[0]
        || errors.destination_emplacement_id?.[0]
        || e.response?.data?.message
        || 'Transfert impossible.'
    )
  } finally {
    transfertSaving.value = false
  }
}

async function recevoirTransfert(transfer) {
  if (!transfer?.id) return
  transferActionId.value = transfer.id
  try {
    await api.post(`/stocks/transferts/${transfer.id}/recevoir`)
    toast.success('Transfert réceptionné. Le stock destination est maintenant disponible.')
    await reload(meta.current_page)
  } catch (e) {
    const errors = e.response?.data?.errors || {}
    toast.error(errors.statut?.[0] || e.response?.data?.message || 'Réception impossible.')
  } finally {
    transferActionId.value = null
  }
}

async function annulerTransfert(transfer) {
  if (!transfer?.id) return

  const motif = window.prompt(`Motif d’annulation du transfert ${transfer.reference}`, 'Annulation transfert')
  if (motif === null) return

  transferActionId.value = transfer.id
  try {
    await api.post(`/stocks/transferts/${transfer.id}/annuler`, { motif })
    toast.success('Transfert annulé. La quantité est retournée à la source.')
    await reload(meta.current_page)
  } catch (e) {
    const errors = e.response?.data?.errors || {}
    toast.error(errors.statut?.[0] || e.response?.data?.message || 'Annulation impossible.')
  } finally {
    transferActionId.value = null
  }
}

function typeBadge(t) {
  return {
    entree: 'bg-green-100 text-green-800',
    sortie: 'bg-red-100 text-red-800',
    ajustement: 'bg-blue-100 text-blue-800',
    transfert: 'bg-purple-100 text-purple-800',
    inventaire: 'bg-yellow-100 text-yellow-800',
  }[t] || 'bg-gray-100'
}

function movementFilterParams() {
  return {
    search: filters.search || undefined,
    entrepot_id: filters.entrepot_id || undefined,
    type: filters.type || undefined,
    document_type: filters.document_type || undefined,
    date_from: filters.date_from || undefined,
    date_to: filters.date_to || undefined,
  }
}

function transferFilterParams() {
  return {
    search: filters.search || undefined,
    entrepot_id: filters.entrepot_id || undefined,
    statut: filters.transfer_statut || undefined,
  }
}

function valuationFilterParams() {
  return {
    mode: 'valorisation',
    search: filters.search || undefined,
    entrepot_id: filters.entrepot_id || undefined,
    dormant_days: filters.dormant_days || 90,
  }
}

function alertFilterParams() {
  return {
    search: filters.search || undefined,
    niveau: filters.alert_niveau || undefined,
  }
}

function reapproFilterParams() {
  return {
    search: filters.search || undefined,
    periode_jours: filters.reappro_period || 90,
  }
}

function setMouvementType(type) {
  filters.type = type
  reload(1)
}

function setMovementDocumentType(type) {
  filters.document_type = filters.document_type === type ? '' : type
  reload(1)
}

function movementTypeCount(type) {
  return Number(movementResume.value.types?.[type]?.total || 0)
}

function movementTypeQuantity(type) {
  return Number(movementResume.value.types?.[type]?.quantite || 0)
}

function emptyMovementResume() {
  return {
    total: 0,
    types: {},
    documents: [],
  }
}

function normalizeMovementResume(data) {
  return {
    total: Number(data?.total || 0),
    types: data?.types || {},
    documents: Array.isArray(data?.documents) ? data.documents : [],
  }
}

function documentTypeLabel(type) {
  return {
    null: 'Manuel',
    manuel: 'Manuel',
    facture: 'Facture',
    facture_annulation: 'Annulation facture',
    achat: 'Achat',
    reception: 'Réception',
    retour_fournisseur: 'Retour fournisseur',
    transfert: 'Transfert',
    stock_transfer_sent: 'Transfert envoyé',
    stock_transfer_received: 'Transfert reçu',
    stock_transfer_cancelled: 'Transfert annulé',
    ajustement: 'Ajustement',
  }[type || 'manuel'] || String(type).replaceAll('_', ' ')
}

function emptyTransferResume() {
  return {
    envoye: 0,
    recu: 0,
    annule: 0,
  }
}

function normalizeTransferResume(data) {
  return {
    envoye: Number(data?.envoye || 0),
    recu: Number(data?.recu || 0),
    annule: Number(data?.annule || 0),
  }
}

function emptyAlertResume() {
  return {
    total: 0,
    rupture: 0,
    critique: 0,
    alerte: 0,
    quantite_recommandee: 0,
    valeur_estimee: 0,
  }
}

function normalizeAlertResume(data) {
  return {
    total: Number(data?.total || 0),
    rupture: Number(data?.rupture || 0),
    critique: Number(data?.critique || 0),
    alerte: Number(data?.alerte || 0),
    quantite_recommandee: Number(data?.quantite_recommandee || 0),
    valeur_estimee: Number(data?.valeur_estimee || 0),
  }
}

function emptyReservationResume() {
  return { active: 0, consommee: 0, liberee: 0, quantite_active: 0 }
}

function normalizeReservationResume(data) {
  return {
    active: Number(data?.active || 0),
    consommee: Number(data?.consommee || 0),
    liberee: Number(data?.liberee || 0),
    quantite_active: Number(data?.quantite_active || 0),
  }
}

function emptyReapproResume() {
  return { produits: 0, ruptures: 0, critiques: 0, quantite_recommandee: 0, budget_estime: 0, periode_jours: 90 }
}

function normalizeReapproResume(data) {
  return {
    produits: Number(data?.produits || 0),
    ruptures: Number(data?.ruptures || 0),
    critiques: Number(data?.critiques || 0),
    quantite_recommandee: Number(data?.quantite_recommandee || 0),
    budget_estime: Number(data?.budget_estime || 0),
    periode_jours: Number(data?.periode_jours || 90),
  }
}

function emptySeriesResume() {
  return { disponible: 0, reserve: 0, vendu: 0, sav: 0 }
}

function normalizeSeriesResume(data) {
  return {
    disponible: Number(data?.disponible || 0),
    reserve: Number(data?.reserve || 0),
    vendu: Number(data?.vendu || 0),
    sav: Number(data?.sav || 0),
  }
}

function emptyValidationResume() {
  return { a_valider: 0, valide: 0 }
}

function normalizeValidationResume(data) {
  return {
    a_valider: Number(data?.a_valider || 0),
    valide: Number(data?.valide || 0),
  }
}

function emptyRapports() {
  return {
    summary: {},
    valorisation: {},
    exports: [],
  }
}

function normalizeRapports(data) {
  const fallback = emptyRapports()
  return {
    summary: data?.summary || fallback.summary,
    valorisation: data?.valorisation || fallback.valorisation,
    exports: Array.isArray(data?.exports) ? data.exports : [],
  }
}

function setAlertLevel(niveau) {
  filters.alert_niveau = niveau
  reload(1)
}

function alertLevelLabel(niveau) {
  return {
    rupture: 'Rupture',
    critique: 'Critique',
    alerte: 'À commander',
  }[niveau] || 'Alerte'
}

function alertLevelRank(niveau) {
  return {
    rupture: 0,
    critique: 1,
    alerte: 2,
  }[niveau] ?? 9
}

function alertLevelBadge(niveau) {
  return {
    rupture: 'bg-red-100 text-red-800',
    critique: 'bg-orange-100 text-orange-800',
    alerte: 'bg-amber-100 text-amber-800',
  }[niveau] || 'bg-gray-100 text-gray-700'
}

function alertChipClass(niveau) {
  if (filters.alert_niveau === niveau) {
    return 'border-cyan-500 bg-cyan-100 text-cyan-900'
  }

  return 'border-cyan-200 bg-white text-slate-700 hover:border-cyan-400'
}

function alertRowClass(alerte) {
  return {
    rupture: 'bg-red-50/40',
    critique: 'bg-orange-50/40',
    alerte: '',
  }[alerte?.niveau] || ''
}

function reservationStatusLabel(statut) {
  return {
    active: 'Active',
    consommee: 'Consommée',
    liberee: 'Libérée',
    remplacee: 'Remplacée',
  }[statut] || statut
}

function reservationStatusBadge(statut) {
  return {
    active: 'bg-amber-100 text-amber-800',
    consommee: 'bg-emerald-100 text-emerald-800',
    liberee: 'bg-slate-100 text-slate-700',
    remplacee: 'bg-blue-100 text-blue-800',
  }[statut] || 'bg-gray-100 text-gray-700'
}

function serieStatusLabel(statut) {
  return {
    disponible: 'Disponible',
    reserve: 'Réservé',
    vendu: 'Vendu',
    sav: 'SAV',
    sorti: 'Sorti',
    perdu: 'Perdu',
  }[statut] || statut
}

function serieStatusBadge(statut) {
  return {
    disponible: 'bg-emerald-100 text-emerald-800',
    reserve: 'bg-amber-100 text-amber-800',
    vendu: 'bg-blue-100 text-blue-800',
    sav: 'bg-purple-100 text-purple-800',
    sorti: 'bg-slate-100 text-slate-700',
    perdu: 'bg-red-100 text-red-800',
  }[statut] || 'bg-gray-100 text-gray-700'
}

async function openSerieModal() {
  Object.assign(serieForm, {
    produit_id: '',
    stock_id: '',
    serial_number: '',
    lot_number: '',
    statut: 'disponible',
    garantie_jusquau: '',
    notes: '',
  })
  await loadStockOptions()
  showSerieModal.value = true
}

async function loadStockOptions() {
  try {
    const { data } = await api.get('/stocks', { params: { per_page: 100, search: filters.search || undefined, entrepot_id: filters.entrepot_id || undefined } })
    stockOptions.value = data.data || []
  } catch (e) {
    stockOptions.value = []
  }
}

function syncSerieProductFromStock() {
  const selected = stockOptions.value.find((stock) => Number(stock.id) === Number(serieForm.stock_id))
  serieForm.produit_id = selected?.produit_id || ''
}

async function saveSerie() {
  if (!serieForm.produit_id && !serieForm.stock_id) {
    toast.error('Sélectionnez une ligne de stock ou renseignez le produit.')
    return
  }

  if (!String(serieForm.serial_number || '').trim() && !String(serieForm.lot_number || '').trim()) {
    toast.error('Renseignez au moins un numéro de série ou un numéro de lot.')
    return
  }

  serieSaving.value = true
  try {
    await api.post('/stocks/series', {
      produit_id: serieForm.produit_id || undefined,
      stock_id: serieForm.stock_id || undefined,
      serial_number: serieForm.serial_number || undefined,
      lot_number: serieForm.lot_number || undefined,
      statut: serieForm.statut,
      garantie_jusquau: serieForm.garantie_jusquau || undefined,
      notes: serieForm.notes || undefined,
    })
    toast.success('Série / lot enregistré.')
    showSerieModal.value = false
    await reload(meta.current_page)
  } catch (e) {
    const errors = e.response?.data?.errors || {}
    toast.error(Object.values(errors)?.[0]?.[0] || e.response?.data?.message || 'Enregistrement impossible.')
  } finally {
    serieSaving.value = false
  }
}

async function updateSerieStatus(serie, statut) {
  try {
    await api.patch(`/stocks/series/${serie.id}`, { statut })
    serie.statut = statut
    toast.success('Statut mis à jour.')
  } catch (e) {
    toast.error(e.response?.data?.message || 'Mise à jour impossible.')
    await reload(meta.current_page)
  }
}

async function validateMovement(mouvement) {
  const commentaire = window.prompt('Commentaire de validation', 'Contrôle stock validé')
  if (commentaire === null) return

  try {
    await api.post(`/stocks/mouvements/${mouvement.id}/valider`, { commentaire })
    toast.success('Mouvement validé.')
    await reload(meta.current_page)
  } catch (e) {
    toast.error(e.response?.data?.message || 'Validation impossible.')
  }
}

async function openPdf(url) {
  try {
    const response = await api.get(url, { responseType: 'blob' })
    const blob = response.data instanceof Blob ? response.data : new Blob([response.data], { type: 'application/pdf' })
    const objectUrl = window.URL.createObjectURL(blob)
    window.open(objectUrl, '_blank', 'noopener,noreferrer')
    window.setTimeout(() => window.URL.revokeObjectURL(objectUrl), 60_000)
  } catch (e) {
    toast.error('Ouverture du PDF impossible.')
  }
}

function openEtiquettesPdf() {
  openPdf('/stocks/etiquettes.pdf')
}

function openProduitFromAlert(alerte) {
  if (!alerte?.id) return
  router.push({ path: '/produits', query: { open: alerte.id } })
}

function addDaysIso(days) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return isoDate(date)
}

function alertDemandPriority(rows) {
  if (rows.some(row => row.niveau === 'rupture')) return 'urgente'
  if (rows.some(row => row.niveau === 'critique')) return 'haute'
  return 'normale'
}

function alertDemandRows(source = null) {
  const rows = source ? [source] : sortedAlertes.value
  return rows.filter(row => Number(row?.id || 0) > 0 && Number(row?.quantite_recommandee || 0) > 0)
}

function buildAlertDemandPayload(rows) {
  const single = rows.length === 1 ? rows[0] : null
  const estimatedBudget = rows.reduce((sum, row) => sum + Number(row.valeur_estimee || 0), 0)

  return {
    date_demande: isoDate(new Date()),
    date_besoin: addDaysIso(rows.some(row => row.niveau === 'rupture') ? 2 : 7),
    service_demandeur: 'Stock',
    priorite: alertDemandPriority(rows),
    objet: single
      ? `Réapprovisionnement stock - ${single.reference || single.libelle}`
      : `Réapprovisionnement stock - ${rows.length} produit(s) en alerte`,
    justification: [
      `Demande générée depuis les alertes de stock le ${new Date().toLocaleDateString('fr-FR')}.`,
      `Budget estimé : ${formatPrice(estimatedBudget)} XOF.`,
      'Les quantités proposées sont calculées à partir du stock actuel, du stock d’alerte et du stock de sécurité.',
    ].join('\n'),
    lignes: rows.map(row => ({
      produit_id: row.id,
      quantite: Math.max(0.001, Number(row.quantite_recommandee || 0)),
      prix_estime_ht: Number(row.prix_achat_ht || 0),
      notes: [
        `Urgence : ${alertLevelLabel(row.niveau)}`,
        `Stock actuel : ${formatQte(row.stock_total)} ${row.unite || ''}`.trim(),
        `Seuil pilotage : ${formatQte(row.seuil_pilotage)}`,
        `Quantité recommandée : ${formatQte(row.quantite_recommandee)} ${row.unite || ''}`.trim(),
      ].join(' · '),
    })),
  }
}

async function createPurchaseDemandFromAlerts(source = null) {
  const rows = alertDemandRows(source)
  if (!rows.length) {
    toast.error('Aucune quantité à recommander sur cette sélection.')
    return
  }

  const message = rows.length === 1
    ? `Créer une demande d’achat pour ${rows[0].reference || rows[0].libelle} ?`
    : `Créer une demande d’achat avec ${rows.length} ligne(s) du filtre actuel ?`

  if (!window.confirm(message)) return

  alertDemandCreating.value = true
  alertDemandCreatingId.value = source?.id || null

  try {
    const { data } = await api.post('/achats/demandes', buildAlertDemandPayload(rows))
    toast.success(`Demande d’achat ${data.numero || ''} créée en brouillon.`)
    router.push({ path: '/achats', query: { demandes: 1 } })
  } catch (e) {
    const errors = e.response?.data?.errors || {}
    toast.error(
      Object.values(errors)?.[0]?.[0]
      || e.response?.data?.message
      || 'Création de la demande d’achat impossible.'
    )
  } finally {
    alertDemandCreating.value = false
    alertDemandCreatingId.value = null
  }
}

function setTransferStatus(statut) {
  filters.transfer_statut = filters.transfer_statut === statut ? '' : statut
  reload(1)
}

function transferStatusLabel(statut) {
  return {
    envoye: 'En transit',
    recu: 'Reçu',
    annule: 'Annulé',
  }[statut] || statut
}

function transferStatusBadge(statut) {
  return {
    envoye: 'bg-amber-100 text-amber-800',
    recu: 'bg-green-100 text-green-800',
    annule: 'bg-slate-100 text-slate-700',
  }[statut] || 'bg-gray-100 text-gray-700'
}

function transferStatusChipClass(statut) {
  if (filters.transfer_statut === statut) {
    return 'border-cyan-500 bg-cyan-100 text-cyan-900'
  }

  return 'border-cyan-200 bg-white text-slate-700 hover:border-cyan-400'
}

function transferEntrepotLabel(transfer) {
  return `${transfer?.source_entrepot?.libelle || 'Source'} → ${transfer?.destination_entrepot?.libelle || 'Destination'}`
}

function transferEmplacementLabel(transfer) {
  return `${emplacementLabel(transfer?.source_emplacement)} → ${emplacementLabel(transfer?.destination_emplacement)}`
}

function isoDate(date) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return localDate.toISOString().slice(0, 10)
}

function setMovementPeriod(period) {
  const today = new Date()
  const from = new Date(today)

  if (period === 'today') {
    filters.date_from = isoDate(today)
    filters.date_to = isoDate(today)
  } else if (period === '7d') {
    from.setDate(today.getDate() - 6)
    filters.date_from = isoDate(from)
    filters.date_to = isoDate(today)
  } else if (period === '30d') {
    from.setDate(today.getDate() - 29)
    filters.date_from = isoDate(from)
    filters.date_to = isoDate(today)
  }

  reload(1)
}

function resetMovementFilters() {
  filters.type = ''
  filters.document_type = ''
  filters.date_from = ''
  filters.date_to = ''
  reload(1)
}

function emptyStockSummary() {
  return {
    kpis: {
      produits_geres: 0,
      produits_en_stock: 0,
      lignes_stock: 0,
      quantite_totale: 0,
      quantite_reservee: 0,
      quantite_disponible: 0,
      valeur_stock: 0,
      alertes: 0,
      ruptures: 0,
      entrepots_actifs: 0,
      mouvements_aujourdhui: 0,
    },
    stock_par_entrepot: [],
    mouvements_par_type: {},
    derniers_mouvements: [],
    alertes: [],
  }
}

function normalizeStockSummary(data) {
  const fallback = emptyStockSummary()
  return {
    kpis: { ...fallback.kpis, ...(data?.kpis || {}) },
    stock_par_entrepot: Array.isArray(data?.stock_par_entrepot) ? data.stock_par_entrepot : [],
    mouvements_par_type: data?.mouvements_par_type || {},
    derniers_mouvements: Array.isArray(data?.derniers_mouvements) ? data.derniers_mouvements : [],
    alertes: Array.isArray(data?.alertes) ? data.alertes : [],
  }
}

function emptyStockValuation() {
  return {
    kpis: {
      valeur_stock: 0,
      quantite_totale: 0,
      produits_valorises: 0,
      lignes_stock: 0,
      pmp_moyen: 0,
      dormant_days: 90,
    },
    par_entrepot: [],
    par_categorie: [],
    top_produits: [],
    produits_dormants: [],
  }
}

function normalizeStockValuation(data) {
  const fallback = emptyStockValuation()
  return {
    kpis: { ...fallback.kpis, ...(data?.kpis || {}) },
    par_entrepot: Array.isArray(data?.par_entrepot) ? data.par_entrepot : [],
    par_categorie: Array.isArray(data?.par_categorie) ? data.par_categorie : [],
    top_produits: Array.isArray(data?.top_produits) ? data.top_produits : [],
    produits_dormants: Array.isArray(data?.produits_dormants) ? data.produits_dormants : [],
  }
}

async function loadInventorySessions() {
  try {
    const { data } = await api.get('/stocks/summary', {
      params: {
        mode: 'inventaires',
        per_page: 6,
        statut: 'en_cours',
        entrepot_id: filters.entrepot_id || undefined,
      },
    })
    inventorySessions.value = Array.isArray(data) ? data : data.data || []
  } catch (e) {
    inventorySessions.value = []
  }
}

async function startInventorySession() {
  inventorySessionActionLoading.value = true
  try {
    const entrepot = entrepots.value.find((item) => Number(item.id) === Number(filters.entrepot_id))
    const titre = `Inventaire ${entrepot?.libelle || 'global'} - ${new Date().toLocaleDateString('fr-FR')}`
    const { data } = await api.post('/stocks/ajustement', {
      mode: 'inventaire_create',
      titre,
      entrepot_id: filters.entrepot_id || undefined,
      search: filters.search || undefined,
      notes: 'Session créée depuis le module Stock.',
    })
    activeInventory.value = data
    prepareInventorySessionDrafts(data)
    toast.success('Session d’inventaire créée.')
    await loadInventorySessions()
  } catch (e) {
    const errors = e.response?.data?.errors || {}
    toast.error(errors.stock?.[0] || e.response?.data?.message || 'Création de la session impossible.')
  } finally {
    inventorySessionActionLoading.value = false
  }
}

async function openInventorySession(session) {
  if (!session?.id) return
  inventorySessionLoading.value = true
  try {
    const { data } = await api.get('/stocks/summary', {
      params: {
        mode: 'inventaire_show',
        inventaire_id: session.id,
      },
    })
    activeInventory.value = data
    prepareInventorySessionDrafts(data)
  } catch (e) {
    toast.error('Impossible d’ouvrir cette session.')
  } finally {
    inventorySessionLoading.value = false
  }
}

function prepareInventorySessionDrafts(inventory) {
  Object.keys(inventoryLineDrafts).forEach((key) => delete inventoryLineDrafts[key])
  ;(inventory?.lignes || []).forEach((line) => {
    inventoryLineDrafts[line.id] = {
      quantite_comptee: line.quantite_comptee ?? '',
      motif: line.motif || defaultInventoryMotif(),
    }
  })
}

function ensureInventoryLineDraft(line) {
  if (!inventoryLineDrafts[line.id]) {
    inventoryLineDrafts[line.id] = {
      quantite_comptee: line.quantite_comptee ?? '',
      motif: line.motif || defaultInventoryMotif(),
    }
  }

  return inventoryLineDrafts[line.id]
}

function setInventorySessionLineCount(line, value) {
  ensureInventoryLineDraft(line).quantite_comptee = value
}

function setInventorySessionLineMotif(line, value) {
  ensureInventoryLineDraft(line).motif = value
}

function inventorySessionDelta(line) {
  const draft = ensureInventoryLineDraft(line)
  const counted = draft.quantite_comptee
  if (counted === '' || counted === null || counted === undefined) {
    return Number(line.ecart || 0)
  }

  return Number(counted || 0) - Number(line.quantite_theorique || 0)
}

function inventorySessionDeltaClass(line) {
  const delta = inventorySessionDelta(line)
  if (Math.abs(delta) < 0.0001) return 'text-slate-500'
  return delta > 0 ? 'text-emerald-700' : 'text-red-700'
}

async function saveInventorySessionLine(line) {
  const draft = ensureInventoryLineDraft(line)
  const counted = Number(draft.quantite_comptee)

  if (draft.quantite_comptee === '' || Number.isNaN(counted) || counted < 0) {
    toast.error('Saisissez une quantité comptée valide.')
    return
  }

  inventoryLineSavingId.value = line.id
  try {
    const { data } = await api.post('/stocks/ajustement', {
      mode: 'inventaire_line',
      inventaire_id: activeInventory.value.id,
      line_id: line.id,
      quantite_comptee: counted,
      motif: draft.motif || defaultInventoryMotif(),
    })
    const index = activeInventory.value.lignes.findIndex((item) => item.id === line.id)
    if (index >= 0) {
      activeInventory.value.lignes[index] = data
    }
    await openInventorySession(activeInventory.value)
    toast.success('Ligne comptée enregistrée.')
  } catch (e) {
    toast.error(e.response?.data?.message || 'Enregistrement impossible.')
  } finally {
    inventoryLineSavingId.value = null
  }
}

async function validateInventorySession() {
  if (!activeInventory.value?.id) return
  inventorySessionActionLoading.value = true
  try {
    const { data } = await api.post('/stocks/ajustement', {
      mode: 'inventaire_validate',
      inventaire_id: activeInventory.value.id,
      motif: `Validation ${activeInventory.value.reference}`,
    })
    activeInventory.value = data
    prepareInventorySessionDrafts(data)
    toast.success('Inventaire validé et écarts appliqués.')
    await loadInventorySessions()
    await reload(meta.current_page)
  } catch (e) {
    const errors = e.response?.data?.errors || {}
    toast.error(errors.lignes?.[0] || errors.inventaire?.[0] || e.response?.data?.message || 'Validation impossible.')
  } finally {
    inventorySessionActionLoading.value = false
  }
}

async function cancelInventorySession() {
  if (!activeInventory.value?.id) return
  if (!window.confirm('Annuler cette session d’inventaire ? Les comptages saisis seront conservés dans l’historique mais aucun écart ne sera appliqué.')) return

  inventorySessionActionLoading.value = true
  try {
    const { data } = await api.post('/stocks/ajustement', {
      mode: 'inventaire_cancel',
      inventaire_id: activeInventory.value.id,
      motif: 'Annulation utilisateur',
    })
    activeInventory.value = data
    toast.success('Session annulée.')
    await loadInventorySessions()
  } catch (e) {
    toast.error(e.response?.data?.message || 'Annulation impossible.')
  } finally {
    inventorySessionActionLoading.value = false
  }
}

function inventoryStatusLabel(statut) {
  return {
    en_cours: 'En cours',
    valide: 'Validé',
    annule: 'Annulé',
  }[statut] || statut
}

function defaultInventoryMotif() {
  return `Inventaire physique du ${new Date().toLocaleDateString('fr-FR')}`
}

function ensureInventoryDraft(stock) {
  if (!inventoryDrafts[stock.id]) {
    inventoryDrafts[stock.id] = {
      nouvelle_quantite: '',
      motif: defaultInventoryMotif(),
    }
  }

  return inventoryDrafts[stock.id]
}

function prepareInventoryDrafts(rows) {
  rows.forEach((stock) => ensureInventoryDraft(stock))
}

function setInventoryCount(stock, value) {
  ensureInventoryDraft(stock).nouvelle_quantite = value
}

function setInventoryMotif(stock, value) {
  ensureInventoryDraft(stock).motif = value
}

function inventoryDelta(stock) {
  const value = inventoryDrafts[stock.id]?.nouvelle_quantite
  if (value === '' || value === null || value === undefined) {
    return null
  }

  return Number(value) - Number(stock.quantite || 0)
}

function formatInventoryDelta(stock) {
  const delta = inventoryDelta(stock)
  if (delta === null || Number.isNaN(delta)) return '—'
  if (Math.abs(delta) < 0.0001) return '0'

  return `${delta > 0 ? '+' : '-'}${formatQte(Math.abs(delta))}`
}

function inventoryDeltaClass(stock) {
  const delta = inventoryDelta(stock)
  if (delta === null || Number.isNaN(delta) || Math.abs(delta) < 0.0001) {
    return 'text-slate-500'
  }

  return delta > 0 ? 'text-emerald-700' : 'text-red-700'
}

async function submitInventoryLine(stock) {
  const draft = ensureInventoryDraft(stock)
  const quantite = Number(draft.nouvelle_quantite)
  const delta = inventoryDelta(stock)

  if (draft.nouvelle_quantite === '' || Number.isNaN(quantite) || quantite < 0) {
    toast.error('Saisissez une quantité réelle valide.')
    return
  }

  if (delta === null || Number.isNaN(delta)) {
    toast.error('Impossible de calculer l’écart.')
    return
  }

  if (Math.abs(delta) < 0.0001) {
    toast.success('Aucun écart à corriger pour cette ligne.')
    draft.nouvelle_quantite = ''
    return
  }

  if (!String(draft.motif || '').trim()) {
    toast.error('Indiquez une justification pour valider l’écart.')
    return
  }

  inventorySavingId.value = stock.id
  try {
    await api.post('/stocks/ajustement', {
      produit_id: stock.produit_id,
      entrepot_id: stock.entrepot_id,
      emplacement_id: stock.emplacement_id || null,
      nouvelle_quantite: quantite,
      motif: draft.motif,
    })
    toast.success('Écart d’inventaire validé et stock corrigé.')
    delete inventoryDrafts[stock.id]
    await reload(meta.current_page)
  } catch (e) {
    const errors = e.response?.data?.errors || {}
    toast.error(
      errors.nouvelle_quantite?.[0]
        || errors.emplacement_id?.[0]
        || errors.produit_id?.[0]
        || e.response?.data?.message
        || 'Validation inventaire impossible.'
    )
  } finally {
    inventorySavingId.value = null
  }
}

watch(onglet, () => {
  if (onglet.value !== 'mouvements') {
    filters.type = ''
    filters.document_type = ''
    filters.date_from = ''
    filters.date_to = ''
    movementResume.value = emptyMovementResume()
  }
  if (onglet.value !== 'transferts') {
    filters.transfer_statut = ''
    transferResume.value = emptyTransferResume()
  }
  if (onglet.value !== 'valorisation') {
    stockValuation.value = emptyStockValuation()
  }
  if (onglet.value !== 'alertes') {
    filters.alert_niveau = ''
    alertResume.value = emptyAlertResume()
  }
  if (onglet.value !== 'reservations') {
    filters.reservation_statut = 'active'
    reservationResume.value = emptyReservationResume()
  }
  if (onglet.value !== 'series') {
    filters.series_statut = ''
    seriesResume.value = emptySeriesResume()
  }
  if (onglet.value !== 'validations') {
    filters.validation_statut = 'a_valider'
    validationResume.value = emptyValidationResume()
  }
  if (onglet.value !== 'reappro') {
    reapproResume.value = emptyReapproResume()
  }
  if (onglet.value !== 'rapports') {
    rapports.value = emptyRapports()
  }
  reload(1)
})

onUnmounted(() => {
  clearTimeout(searchTimeout)
})

onMounted(async () => {
  await loadEntrepots()
  reload()
})
</script>
