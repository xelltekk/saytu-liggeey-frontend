<template>
  <div>
    <div v-if="loading" class="rounded-lg bg-white p-12 text-center text-gray-500">
      Chargement du tableau de bord...
    </div>

    <div v-else class="dashboard-page dashboard-readable dashboard-sortable-root space-y-4">
      <div class="dashboard-hero rounded-lg px-4 py-3 text-white shadow-sm sm:px-5">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 class="text-lg font-bold">Bonjour {{ userName }}</h2>
            <p class="mt-0.5 text-xs text-xelltekk-100">{{ dashboardIntro }}</p>
          </div>
          <div class="flex flex-col items-end gap-2 text-right text-xs sm:text-sm">
            <div class="font-mono">{{ today }}</div>
            <div class="mt-0.5 text-[11px] text-xelltekk-200">Saytu Liggéey 2.0</div>
            <div class="flex flex-wrap justify-end gap-2">
              <button type="button" class="dashboard-customize-button" @click="isCustomizingDashboard = !isCustomizingDashboard">
                {{ isCustomizingDashboard ? 'Terminer' : 'Personnaliser' }}
              </button>
              <button v-if="isCustomizingDashboard" type="button" class="dashboard-customize-button dashboard-customize-button-soft" @click="resetDashboardLayout">
                Réinitialiser
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="isCustomizingDashboard" class="dashboard-layout-hint">
        Glissez un bloc ou utilisez Monter / Descendre pour personnaliser votre tableau de bord. L’ordre est sauvegardé sur ce navigateur.
      </div>

      <section v-if="annonces.length" class="dashboard-block rounded-lg border border-blue-100 bg-blue-50 p-4 shadow-sm sm:p-5" v-bind="dashboardBlockAttrs('annonces')">
        <DashboardBlockControls
          v-if="isCustomizingDashboard"
          block-id="annonces"
          label="Annonces"
          :can-up="canMoveDashboardBlock('annonces', 'up')"
          :can-down="canMoveDashboardBlock('annonces', 'down')"
          @move="moveDashboardBlock"
        />
        <div class="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 class="font-semibold text-blue-950">Annonces internes</h3>
            <p class="text-xs text-blue-700">Messages visibles par tous les utilisateurs.</p>
          </div>
          <span class="text-xs font-semibold uppercase text-blue-700">{{ annonces.length }} annonce(s)</span>
        </div>
        <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <article v-for="annonce in annonces" :key="annonce.id" class="rounded-lg border border-blue-100 bg-white p-3">
            <h4 class="font-semibold text-gray-900">{{ annonce.titre }}</h4>
            <p class="mt-1 text-sm text-gray-600">{{ annonce.contenu }}</p>
            <p class="mt-2 text-xs text-gray-400">{{ formatDateTime(annonce.publie_le) }} · {{ annonce.auteur?.name || 'RH' }}</p>
          </article>
        </div>
      </section>

      <div v-if="hasKpiCards" class="dashboard-block stat-grid grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4" v-bind="dashboardBlockAttrs('kpis')">
        <DashboardBlockControls
          v-if="isCustomizingDashboard"
          block-id="kpis"
          label="Indicateurs"
          :can-up="canMoveDashboardBlock('kpis', 'up')"
          :can-down="canMoveDashboardBlock('kpis', 'down')"
          @move="moveDashboardBlock"
        />
        <KpiCard v-if="isBusinessDashboard" label="Chiffre d’affaires" :value="formatPrice(kpi.ca_mois)" suffix="FCFA" :icon-component="TrendingUp" color="blue" :sub="`Ce mois · Année : ${formatPrice(kpi.ca_annee)} FCFA`" />
        <KpiCard v-if="isBusinessDashboard" to="/paiements" label="Encaissements" :value="formatPrice(kpi.paiements_mois)" suffix="FCFA" :icon-component="Wallet" color="green" sub="Paiements enregistrés ce mois" />
        <KpiCard v-if="isBusinessDashboard" :to="{ path: '/factures', query: { quick: 'encours' } }" label="Reste à encaisser" :value="formatPrice(kpi.encours_total)" suffix="FCFA" :icon-component="FileClock" color="orange" sub="Facturation · Toutes périodes" />
        <KpiCard v-if="isBusinessDashboard" :to="{ path: '/factures', query: { quick: 'impayees' } }" label="Factures impayées" :value="kpi.factures_impayees || 0" :icon-component="FileWarning" :color="kpi.factures_en_retard ? 'red' : 'blue'" :sub="`dont ${kpi.factures_en_retard || 0} en retard · Toutes périodes`" />

        <KpiCard v-if="isCommercial" to="/clients" label="Mes clients actifs" :value="kpi.clients_actifs || 0" icon="CL" :icon-component="UsersRound" color="green" />
        <KpiCard v-if="isCommercial" to="/devis" label="Mes devis en cours" :value="kpi.devis_en_cours || 0" icon="DV" :icon-component="FileText" color="blue" />

        <KpiCard v-if="isStockManager" to="/stock" label="Produits en stock" :value="kpi.produits_stockes || 0" icon="ST" :icon-component="Package" color="green" />
        <KpiCard v-if="isStockManager" to="/stock" label="Alertes stock" :value="kpi.stock_alertes || 0" icon="AL" :icon-component="TriangleAlert" color="orange" />
        <KpiCard v-if="isStockManager" to="/stock" label="Ruptures" :value="kpi.ruptures_stock || 0" icon="RP" :icon-component="TriangleAlert" color="purple" />
        <KpiCard v-if="isStockManager" to="/stock" label="Valeur stock" :value="formatPrice(kpi.valeur_stock)" icon="VS" :icon-component="Wallet" color="blue" />
      </div>

      <section v-else class="dashboard-block rounded-lg border border-gray-200 bg-white p-5 shadow-sm" v-bind="dashboardBlockAttrs('empty')">
        <DashboardBlockControls
          v-if="isCustomizingDashboard"
          block-id="empty"
          label="Tableau de bord"
          :can-up="canMoveDashboardBlock('empty', 'up')"
          :can-down="canMoveDashboardBlock('empty', 'down')"
          @move="moveDashboardBlock"
        />
        <h3 class="font-semibold text-gray-900">Tableau de bord</h3>
        <p class="mt-1 text-sm text-gray-500">
          Votre profil est bien connecte. Aucun indicateur specifique n'est encore configure pour ce role.
        </p>
      </section>

      <div v-if="isStockManager" class="dashboard-block grid grid-cols-1 gap-6 lg:grid-cols-2" v-bind="dashboardBlockAttrs('stock')">
        <DashboardBlockControls
          v-if="isCustomizingDashboard"
          block-id="stock"
          label="Stock"
          :can-up="canMoveDashboardBlock('stock', 'up')"
          :can-down="canMoveDashboardBlock('stock', 'down')"
          @move="moveDashboardBlock"
        />
        <section class="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <div class="mb-4 flex items-center justify-between">
            <h3 class="font-semibold text-gray-900">Produits en alerte</h3>
            <router-link to="/stock" class="text-xs text-xelltekk-600 hover:underline">Voir le stock</router-link>
          </div>
          <div v-if="stockAlertes.length" class="space-y-2">
            <router-link
              v-for="produit in stockAlertes"
              :key="produit.id"
              to="/stock"
              class="flex items-center justify-between gap-3 rounded-lg border border-orange-100 bg-orange-50 p-3 transition hover:bg-cyan-100"
            >
              <div class="min-w-0">
                <div class="truncate text-sm font-semibold text-gray-900">{{ produit.libelle }}</div>
                <div class="text-xs text-gray-500">{{ produit.reference || 'Sans reference' }}</div>
              </div>
              <div class="text-right">
                <div class="font-mono text-sm font-bold text-orange-700">{{ formatQty(produit.stock_total) }}</div>
                <div class="text-[10px] text-gray-500">seuil {{ produit.stock_alerte || 0 }}</div>
              </div>
            </router-link>
          </div>
          <div v-else class="py-8 text-center text-sm text-green-600">
            Aucun produit en alerte.
          </div>
        </section>

        <section class="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <div class="mb-4 flex items-center justify-between">
            <h3 class="font-semibold text-gray-900">Derniers mouvements de stock</h3>
            <router-link to="/stock" class="text-xs text-xelltekk-600 hover:underline">Voir tout</router-link>
          </div>
          <div v-if="derniersMouvementsStock.length" class="space-y-2">
            <router-link
              v-for="mouvement in derniersMouvementsStock"
              :key="mouvement.id"
              to="/stock"
              class="block rounded-lg border border-gray-200 p-3 transition hover:bg-cyan-50"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <div class="truncate text-sm font-semibold text-gray-900">{{ mouvement.produit?.libelle || 'Produit' }}</div>
                  <div class="text-xs text-gray-500">
                    {{ mouvement.produit?.reference || 'Sans référence' }} - {{ mouvement.entrepot?.libelle || mouvement.entrepot?.code || 'Entrepôt' }}
                  </div>
                  <div class="mt-1 text-xs text-gray-500">{{ mouvement.motif || mouvement.type }}</div>
                </div>
                <div class="text-right">
                  <div class="font-mono text-sm font-bold" :class="mouvementTypeClass(mouvement.type)">
                    {{ mouvement.type }} {{ formatQty(mouvement.quantite) }}
                  </div>
                  <div class="text-[10px] text-gray-500">{{ formatDate(mouvement.date_mouvement) }}</div>
                </div>
              </div>
            </router-link>
          </div>
          <div v-else class="py-8 text-center text-sm text-gray-400">
            Aucun mouvement recent.
          </div>
        </section>
      </div>

      <section v-if="isBusinessDashboard" class="dashboard-block rounded-lg border border-gray-200 bg-white p-5 shadow-sm" v-bind="dashboardBlockAttrs('tresorerie')">
        <DashboardBlockControls
          v-if="isCustomizingDashboard"
          block-id="tresorerie"
          label="Trésorerie"
          :can-up="canMoveDashboardBlock('tresorerie', 'up')"
          :can-down="canMoveDashboardBlock('tresorerie', 'down')"
          @move="moveDashboardBlock"
        />
        <div class="mb-4 flex items-center justify-between">
          <h3 class="font-semibold text-gray-900">Soldes de trésorerie</h3>
          <span class="text-xs text-gray-500">Temps réel</span>
        </div>
        <div v-if="soldesTresorerieComptes.length" class="dashboard-treasury">
          <router-link to="/tresorerie-comptes" class="dashboard-treasury-total">
            <Wallet :size="26" aria-hidden="true" />
            <span>Solde total disponible</span>
            <strong>{{ formatPrice(soldesTresorerieTotal) }} <small>FCFA</small></strong>
            <span>{{ soldesTresorerieComptes.length }} comptes actifs · Voir les comptes →</span>
          </router-link>
          <div class="dashboard-account-list">
            <router-link v-for="compte in soldesTresorerieComptes" :key="compte.id || compte.code" to="/tresorerie-comptes" class="dashboard-account-row">
              <component :is="compte.iconComponent" :size="20" aria-hidden="true" />
              <div class="dashboard-account-name"><strong>{{ compte.label }}</strong><span>{{ compte.sub }}</span></div>
              <strong class="dashboard-account-balance" :class="{ 'is-negative': compte.solde_actuel < 0 }">{{ formatPrice(compte.solde_actuel) }} <small>FCFA</small></strong>
            </router-link>
          </div>
        </div>
        <div v-else class="flex min-h-52 items-center justify-center text-sm text-gray-400">
          Aucun compte de trésorerie actif
        </div>
      </section>

      <div v-if="isBusinessDashboard" class="dashboard-block grid grid-cols-1 gap-6" v-bind="dashboardBlockAttrs('ca')">
        <DashboardBlockControls
          v-if="isCustomizingDashboard"
          block-id="ca"
          label="Chiffre d’affaires"
          :can-up="canMoveDashboardBlock('ca', 'up')"
          :can-down="canMoveDashboardBlock('ca', 'down')"
          @move="moveDashboardBlock"
        />
        <section class="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <div class="mb-4 flex items-center justify-between">
            <h3 class="font-semibold text-gray-900">Chiffre d'affaires mensuel</h3>
            <span class="text-xs text-gray-500">12 derniers mois · FCFA</span>
          </div>
          <div class="h-64">
            <Line v-if="caChartData" :data="caChartData" :options="caChartOptions" />
          </div>
        </section>
      </div>

      <div v-if="isBusinessDashboard" class="dashboard-block grid grid-cols-1 gap-6 lg:grid-cols-2" v-bind="dashboardBlockAttrs('tops')">
        <DashboardBlockControls
          v-if="isCustomizingDashboard"
          block-id="tops"
          label="Top clients / produits"
          :can-up="canMoveDashboardBlock('tops', 'up')"
          :can-down="canMoveDashboardBlock('tops', 'down')"
          @move="moveDashboardBlock"
        />
        <section class="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <div class="mb-4 flex items-center justify-between">
            <h3 class="font-semibold text-gray-900">Top 10 clients</h3>
            <span class="text-xs text-gray-500">Année en cours</span>
          </div>
          <div v-if="topClients.length" class="space-y-2">
            <router-link
              v-for="(client, index) in topClients"
              :key="client.id"
              :to="{ path: '/clients', query: { open: client.id } }"
              class="flex items-center gap-3 rounded p-2 transition hover:bg-cyan-50 focus:outline-none focus:ring-2 focus:ring-cyan-300"
            >
              <div class="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold" :class="rangColor(index)">
                {{ index + 1 }}
              </div>
              <div class="min-w-0 flex-1">
                <div class="truncate text-sm font-medium text-gray-900">{{ client.nom }}</div>
                <div class="text-xs text-gray-500">{{ client.nb_factures }} facture(s) - {{ client.code }}</div>
              </div>
              <div class="whitespace-nowrap font-mono text-sm font-semibold text-xelltekk-700">
                {{ formatPrice(client.ca_total) }}
              </div>
            </router-link>
          </div>
          <div v-else class="py-8 text-center text-sm text-gray-400">
            Aucune vente cette année
          </div>
        </section>

        <section class="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <div class="mb-4 flex items-center justify-between">
            <h3 class="font-semibold text-gray-900">Top 10 produits vendus</h3>
            <span class="text-xs text-gray-500">Année en cours</span>
          </div>
          <div v-if="topProduits.length" class="space-y-2">
            <router-link
              v-for="(produit, index) in topProduits"
              :key="produit.id"
              :to="{ path: '/produits', query: { open: produit.id } }"
              class="flex items-center gap-3 rounded p-2 transition hover:bg-cyan-50 focus:outline-none focus:ring-2 focus:ring-cyan-300"
            >
              <div class="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold" :class="rangColor(index)">
                {{ index + 1 }}
              </div>
              <div class="min-w-0 flex-1">
                <div class="truncate text-sm font-medium text-gray-900">{{ produit.libelle }}</div>
                <div class="text-xs text-gray-500">
                  {{ produit.reference || 'Sans référence' }} - Qté {{ formatQty(produit.quantite_vendue) }} - {{ produit.nb_factures }} facture(s)
                </div>
              </div>
              <div class="whitespace-nowrap font-mono text-sm font-semibold text-green-700">
                {{ formatPrice(produit.ca_total) }}
              </div>
            </router-link>
          </div>
          <div v-else class="py-8 text-center text-sm text-gray-400">
            Aucun produit vendu cette année
          </div>
        </section>
      </div>

      <section v-if="isBusinessDashboard" class="dashboard-block rounded-lg border border-gray-200 bg-white p-5 shadow-sm" v-bind="dashboardBlockAttrs('factures')">
        <DashboardBlockControls
          v-if="isCustomizingDashboard"
          block-id="factures"
          label="Factures en retard"
          :can-up="canMoveDashboardBlock('factures', 'up')"
          :can-down="canMoveDashboardBlock('factures', 'down')"
          @move="moveDashboardBlock"
        />
        <div class="mb-4 flex items-center justify-between">
          <h3 class="font-semibold text-gray-900">Factures en retard</h3>
          <router-link :to="{ path: '/factures', query: { quick: 'en_retard' } }" class="text-xs text-xelltekk-600 hover:underline">Voir tout</router-link>
        </div>
        <div v-if="facturesRetard.length" class="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <router-link
            v-for="facture in facturesRetard"
            :key="facture.id"
            :to="{ path: '/factures', query: { open: facture.id } }"
            class="block rounded-lg border border-red-100 bg-red-50 p-3 transition-colors hover:bg-cyan-100 focus:outline-none focus:ring-2 focus:ring-cyan-300"
          >
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2">
                  <span class="font-mono text-xs font-semibold text-gray-700">{{ facture.numero }}</span>
                  <span class="badge bg-red-200 text-[10px] text-red-800">{{ facture.jours_retard }} j</span>
                </div>
                <div class="mt-1 truncate text-sm font-medium text-gray-900">{{ facture.client?.nom || 'Client' }}</div>
                <div class="text-xs text-gray-500">Echu le {{ formatDate(facture.date_echeance) }}</div>
              </div>
              <div class="whitespace-nowrap text-right">
                <div class="font-mono font-bold text-red-700">{{ formatPrice(facture.reste_a_payer) }}</div>

              </div>
            </div>
          </router-link>
        </div>
        <div v-else class="py-8 text-center text-sm text-green-600">
          Aucune facture en retard.
        </div>
      </section>
      <div v-if="!isStockManager" class="dashboard-block grid grid-cols-1 gap-6" :class="isBusinessDashboard ? 'lg:grid-cols-2' : ''" v-bind="dashboardBlockAttrs('suivis')">
        <DashboardBlockControls
          v-if="isCustomizingDashboard"
          block-id="suivis"
          label="Paiements / devis"
          :can-up="canMoveDashboardBlock('suivis', 'up')"
          :can-down="canMoveDashboardBlock('suivis', 'down')"
          @move="moveDashboardBlock"
        />
        <section v-if="isBusinessDashboard" class="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <div class="mb-4 flex items-center justify-between">
            <h3 class="font-semibold text-gray-900">Derniers paiements</h3>
            <router-link to="/paiements" class="text-xs text-xelltekk-600 hover:underline">Voir tout</router-link>
          </div>
          <div v-if="derniersPaiements.length" class="space-y-2">
            <router-link
              v-for="paiement in derniersPaiements"
              :key="paiement.id"
              to="/paiements"
              class="flex items-center gap-3 rounded p-2 transition hover:bg-cyan-50 focus:outline-none focus:ring-2 focus:ring-cyan-300"
            >
              <div class="min-w-0 flex-1">
                <div class="truncate text-sm font-medium text-gray-900">{{ paiement.client?.nom || 'Client' }}</div>
                <div class="text-xs text-gray-500">{{ formatDate(paiement.date_paiement) }} - {{ paiement.reference }}</div>
              </div>
              <div class="whitespace-nowrap font-mono font-bold text-green-700">
                +{{ formatPrice(paiement.montant) }}
              </div>
            </router-link>
          </div>
          <div v-else class="py-8 text-center text-sm text-gray-400">
            Aucun paiement recent
          </div>
        </section>

        <section class="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <div class="mb-4 flex items-center justify-between">
            <h3 class="font-semibold text-gray-900">Devis en attente</h3>
            <router-link :to="{ path: '/devis', query: { statut: 'envoye' } }" class="text-xs text-xelltekk-600 hover:underline">Voir tout</router-link>
          </div>
          <div v-if="devisEnAttente.length" class="space-y-2">
            <router-link
              v-for="devis in devisEnAttente"
              :key="devis.id"
              :to="{ path: '/devis', query: { open: devis.id } }"
              class="block rounded-lg border border-gray-200 p-3 transition hover:bg-cyan-50 focus:outline-none focus:ring-2 focus:ring-cyan-300"
            >
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2">
                    <span class="font-mono text-xs font-semibold text-gray-700">{{ devis.numero }}</span>
                    <span class="badge text-[10px]" :class="devis.statut === 'brouillon' ? 'bg-gray-100 text-gray-700' : 'bg-blue-100 text-blue-800'">
                      {{ devis.statut }}
                    </span>
                  </div>
                  <div class="mt-1 truncate text-sm font-medium text-gray-900">{{ devis.client?.nom || 'Client' }}</div>
                  <div class="text-xs text-gray-500">Validité : {{ formatDate(devis.date_validite) }}</div>
                </div>
                <div class="whitespace-nowrap text-right">
                  <div class="font-mono font-bold text-gray-900">{{ formatPrice(devis.total_ttc) }}</div>

                </div>
              </div>
            </router-link>
          </div>
          <div v-else class="py-8 text-center text-sm text-gray-400">
            Aucun devis en attente
          </div>
        </section>
      </div>
      <section v-if="isManagerDashboard" class="dashboard-block rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-5" v-bind="dashboardBlockAttrs('commerciaux')">
        <DashboardBlockControls
          v-if="isCustomizingDashboard"
          block-id="commerciaux"
          label="Commerciaux"
          :can-up="canMoveDashboardBlock('commerciaux', 'up')"
          :can-down="canMoveDashboardBlock('commerciaux', 'down')"
          @move="moveDashboardBlock"
        />
        <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 class="font-semibold text-gray-900">Avancement des commerciaux</h3>
            <p class="mt-0.5 text-xs text-gray-500">Objectifs actifs et réalisations sur leur période en cours.</p>
          </div>
          <div class="flex flex-wrap gap-2">
            <router-link to="/prospection" class="btn-secondary px-3 py-1.5 text-xs">Voir le suivi</router-link>
            <button type="button" class="btn-primary px-3 py-1.5 text-xs" :disabled="commercialPdfLoading" @click="ouvrirEtatCommerciauxPdf">
              {{ commercialPdfLoading ? 'PDF...' : 'État PDF' }}
            </button>
          </div>
        </div>

        <div v-if="avancementCommerciaux.length" class="overflow-x-auto">
          <table class="w-full">
            <thead class="border-b border-gray-200 bg-gray-50">
              <tr>
                <th class="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-600">Commercial</th>
                <th class="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-600">Score global</th>
                <th class="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-600">Prospects</th>
                <th class="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-600">Actions</th>
                <th class="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-600">Devis</th>
                <th class="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-600">CA</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="ligne in avancementCommerciaux" :key="ligne.commercial?.id || ligne.commercial_id || ligne.id" class="hover:bg-cyan-50">
                <td class="px-3 py-3">
                  <div class="font-medium text-gray-900">{{ ligne.commercial?.name || 'Commercial' }}</div>
                  <div class="text-xs text-gray-500">{{ formatDate(ligne.periode_debut) }} - {{ formatDate(ligne.periode_fin) }}</div>
                  <div v-if="!ligne.has_objectif" class="mt-1 text-[11px] font-medium text-orange-700">Aucun objectif actif</div>
                </td>
                <td class="px-3 py-3"><CommercialProgress :percent="ligne.score_global" score /></td>
                <td class="px-3 py-3"><CommercialProgress :value="ligne.realisation.prospects" :target="ligne.targets.prospects" :percent="ligne.percentages.prospects" /></td>
                <td class="px-3 py-3"><CommercialProgress :value="ligne.realisation.actions" :target="ligne.targets.actions" :percent="ligne.percentages.actions" /></td>
                <td class="px-3 py-3"><CommercialProgress :value="ligne.realisation.devis" :target="ligne.targets.devis" :percent="ligne.percentages.devis" /></td>
                <td class="px-3 py-3"><CommercialProgress :value="ligne.realisation.ca" :target="ligne.targets.ca" :percent="ligne.percentages.ca" money /></td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="rounded-lg border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500">
          Aucun objectif commercial actif. Créez les objectifs depuis la rubrique Prospection.
        </div>
      </section>

    </div>
  </div>
</template>

<script setup>
import { usePageReactivation } from '@/composables/usePageReactivation'
import { ref, computed, onMounted, h, resolveComponent, watch } from 'vue'
import { Line } from 'vue-chartjs'
import {
  ArrowRightLeft,
  Banknote,
  CreditCard,
  FileClock,
  FileText,
  FileWarning,
  Landmark,
  Package,
  TriangleAlert,
  TrendingUp,
  UsersRound,
  Smartphone,
  Wallet,
} from 'lucide-vue-next'
import {
  Chart as ChartJS, Title, Tooltip, Legend,
  CategoryScale, LinearScale, PointElement, LineElement, Filler,
} from 'chart.js'
import api from '@/services/api'
import { ouvrirPDF } from '@/services/pdf'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { effectiveRole, hasAnyRole } from '@/utils/access'

ChartJS.register(Title, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Filler)

const auth = useAuthStore()
const toast = useToast()

const loading = ref(true)
const dashboardScope = ref('business')
const kpi = ref({})
const annonces = ref([])
const caChartData = ref(null)
const soldesTresorerie = ref({ total: 0, comptes: [] })
const topClients = ref([])
const topProduits = ref([])
const facturesRetard = ref([])
const derniersPaiements = ref([])
const devisEnAttente = ref([])
const stockAlertes = ref([])
const derniersMouvementsStock = ref([])
const avancementCommerciaux = ref([])
const commercialPdfLoading = ref(false)
const isCustomizingDashboard = ref(false)
const dashboardLayoutOrder = ref([])
const draggedDashboardBlock = ref('')

const DASHBOARD_LAYOUT_STORAGE_PREFIX = 'saytu.dashboard.layout'
const dashboardDefaultOrder = [
  'annonces',
  'kpis',
  'empty',
  'stock',
  'tresorerie',
  'ca',
  'tops',
  'factures',
  'suivis',
  'commerciaux',
]

const userName = computed(() => auth.user?.name?.split(' ')[0] || 'Utilisateur')
const userRole = computed(() => String(effectiveRole(auth.user) || '').toLowerCase())
const isCommercial = computed(() => dashboardScope.value === 'commercial' || userRole.value.includes('commercial'))
const isStockManager = computed(() => dashboardScope.value === 'stock' || userRole.value === 'magasinier' || userRole.value.includes('stock'))
const isManagerDashboard = computed(() => hasAnyRole(auth.user, ['admin', 'gerant']))
const isBusinessDashboard = computed(() => dashboardScope.value === 'business' && !isCommercial.value && !isStockManager.value)
const hasKpiCards = computed(() => isBusinessDashboard.value || isCommercial.value || isStockManager.value)
const dashboardLayoutStorageKey = computed(() => `${DASHBOARD_LAYOUT_STORAGE_PREFIX}.${userRole.value || 'user'}.${dashboardScope.value || 'default'}`)
const visibleDashboardBlockIds = computed(() => {
  return dashboardDefaultOrder.filter((id) => {
    if (id === 'annonces') return annonces.value.length > 0
    if (id === 'kpis') return hasKpiCards.value
    if (id === 'empty') return !hasKpiCards.value
    if (id === 'stock') return isStockManager.value
    if (['tresorerie', 'ca', 'tops', 'factures'].includes(id)) return isBusinessDashboard.value
    if (id === 'suivis') return !isStockManager.value
    if (id === 'commerciaux') return isManagerDashboard.value
    return false
  })
})
const dashboardIntro = computed(() => {
  if (isStockManager.value) return 'Voici les informations de stock qui vous concernent.'
  if (isCommercial.value) return 'Voici votre activit commerciale.'
  return "Voici votre vue d'ensemble pour aujourd'hui."
})

const today = computed(() => {
  return new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
})

const soldesTresorerieComptes = computed(() => {
  const comptes = Array.isArray(soldesTresorerie.value.comptes) ? soldesTresorerie.value.comptes : []

  return comptes.map((compte, index) => {
    const solde = Number(compte.solde_actuel ?? compte.solde_initial ?? 0)

    return {
      ...compte,
      solde_actuel: solde,
      label: tresorerieCompteLabel(compte),
      icon: modePaiementIcon(compte.mode_paiement || compte.type || compte.libelle),
      iconImage: modePaiementIconImage([compte.mode_paiement, compte.type, compte.libelle].filter(Boolean).join(' ')),
      iconComponent: modePaiementIconComponent([compte.mode_paiement, compte.type, compte.libelle].filter(Boolean).join(' ')),
      color: modePaiementColor(compte.mode_paiement || compte.type || compte.libelle, index),
      sub: tresorerieCompteSub(compte),
    }
  })
})

const soldesTresorerieTotal = computed(() => {
  const total = Number(soldesTresorerie.value.total)
  return Number.isFinite(total)
    ? total
    : soldesTresorerieComptes.value.reduce((sum, compte) => sum + Number(compte.solde_actuel || 0), 0)
})

const DashboardBlockControls = {
  props: {
    blockId: { type: String, required: true },
    label: { type: String, required: true },
    canUp: { type: Boolean, default: false },
    canDown: { type: Boolean, default: false },
  },
  emits: ['move'],
  setup(props, { emit }) {
    const move = (direction) => emit('move', props.blockId, direction)

    return () => h('div', { class: 'dashboard-block-controls' }, [
      h('span', { class: 'dashboard-block-corner dashboard-block-corner-tl' }, '✣'),
      h('span', { class: 'dashboard-block-corner dashboard-block-corner-tr' }, '✣'),
      h('span', { class: 'dashboard-block-corner dashboard-block-corner-bl' }, '✣'),
      h('span', { class: 'dashboard-block-corner dashboard-block-corner-br' }, '✣'),
      h('div', { class: 'dashboard-block-control-panel' }, [
        h('span', { class: 'dashboard-block-control-title' }, props.label),
        h('button', {
          type: 'button',
          class: 'dashboard-block-control-button',
          disabled: !props.canUp,
          onClick: () => move('up'),
        }, '↑ Monter'),
        h('button', {
          type: 'button',
          class: 'dashboard-block-control-button',
          disabled: !props.canDown,
          onClick: () => move('down'),
        }, '↓ Descendre'),
      ]),
    ])
  },
}

const KpiCard = {
  props: ['label', 'value', 'suffix', 'icon', 'iconImage', 'iconComponent', 'color', 'sub', 'to'],
  setup(props) {
    const RouterLink = resolveComponent('RouterLink')
    const toneClass = dashboardToneClass(props.color)

    const iconNode = () => h('span', { class: 'dashboard-kpi-icon' }, [
      props.iconComponent
        ? h(props.iconComponent, { class: 'h-6 w-6', strokeWidth: 2.3, 'aria-hidden': 'true' })
        : h('span', { class: 'dashboard-kpi-icon-text' }, props.icon || 'SL'),
    ])

    const children = () => [
        h('div', { class: 'mb-2 flex items-center justify-between gap-3' }, [
          h('span', { class: 'dashboard-kpi-label text-xs font-semibold uppercase' }, props.label),
          iconNode(),
        ]),
        h('div', { class: 'flex flex-wrap items-baseline gap-1' }, [
          h('span', { class: 'dashboard-kpi-value text-xl font-bold' }, props.value),
          props.suffix ? h('span', { class: 'dashboard-kpi-suffix text-xs' }, props.suffix) : null,
        ]),
        props.sub ? h('div', { class: 'dashboard-kpi-sub mt-0.5 text-xs' }, props.sub) : null,
      ]

    return () => h(
      props.to ? RouterLink : 'div',
      {
        ...(props.to ? { to: props.to } : {}),
        class: `dashboard-kpi-card ${toneClass} dashboard-accent-${props.color || 'blue'} block rounded-lg border p-3 transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-cyan-300`,
      },
      props.to ? { default: children } : children()
    )
  },
}

const CommercialProgress = {
  props: ['value', 'target', 'percent', 'money', 'score'],
  setup(props) {
    return () => {
      const percent = props.percent === null || props.percent === undefined ? null : Number(props.percent)
      const width = Math.min(Math.max(percent || 0, 2), 100)
      const color = progressColor(percent)
      const value = props.score ?
         `${Math.round(percent || 0)}%`
        : `${props.money ? formatPrice(props.value) : formatQty(props.value)} / ${props.money ? formatPrice(props.target) : formatQty(props.target)}`

      return h('div', { class: 'min-w-28' }, [
        h('div', { class: 'mb-1 flex items-center justify-between gap-2 text-xs' }, [
          h('span', { class: 'font-semibold text-gray-800' }, value),
          props.score ? null : h('span', { class: color.text }, percent === null ? '-' : `${percent}%`),
        ]),
        h('div', { class: 'h-2 overflow-hidden rounded-full bg-gray-200' }, [
          h('div', { class: `h-full rounded-full ${color.bar}`, style: { width: `${width}%` } }),
        ]),
      ])
    }
  },
}

function normalizeDashboardLayout(order = []) {
  const saved = Array.isArray(order) ? order.filter((id) => dashboardDefaultOrder.includes(id)) : []
  return [...saved, ...dashboardDefaultOrder.filter((id) => !saved.includes(id))]
}

function loadDashboardLayout() {
  if (typeof window === 'undefined') {
    dashboardLayoutOrder.value = [...dashboardDefaultOrder]
    return
  }

  try {
    const raw = window.localStorage.getItem(dashboardLayoutStorageKey.value)
    dashboardLayoutOrder.value = normalizeDashboardLayout(raw ? JSON.parse(raw) : [])
  } catch (error) {
    dashboardLayoutOrder.value = [...dashboardDefaultOrder]
  }
}

function saveDashboardLayout() {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(dashboardLayoutStorageKey.value, JSON.stringify(normalizeDashboardLayout(dashboardLayoutOrder.value)))
  } catch (error) {
    // Le tableau de bord reste utilisable même si le stockage navigateur est indisponible.
  }
}

function orderedVisibleDashboardBlockIds() {
  const visible = new Set(visibleDashboardBlockIds.value)
  const ordered = normalizeDashboardLayout(dashboardLayoutOrder.value).filter((id) => visible.has(id))
  const missing = visibleDashboardBlockIds.value.filter((id) => !ordered.includes(id))
  return [...ordered, ...missing]
}

function dashboardBlockStyle(blockId) {
  const ordered = normalizeDashboardLayout(dashboardLayoutOrder.value)
  const index = ordered.indexOf(blockId)
  return { order: index >= 0 ? index + 10 : 999 }
}

function dashboardBlockAttrs(blockId) {
  return {
    class: {
      'dashboard-block-customizing': isCustomizingDashboard.value,
      'dashboard-block-dragging': draggedDashboardBlock.value === blockId,
    },
    style: dashboardBlockStyle(blockId),
    draggable: isCustomizingDashboard.value,
    onDragstart: (event) => onDashboardDragStart(event, blockId),
    onDragover: (event) => onDashboardDragOver(event),
    onDrop: (event) => onDashboardDrop(event, blockId),
    onDragend: () => {
      draggedDashboardBlock.value = ''
    },
  }
}

function canMoveDashboardBlock(blockId, direction) {
  const ordered = orderedVisibleDashboardBlockIds()
  const index = ordered.indexOf(blockId)
  if (index < 0) return false
  return direction === 'up' ? index > 0 : index < ordered.length - 1
}

function setVisibleDashboardOrder(nextVisibleOrder) {
  const visible = new Set(visibleDashboardBlockIds.value)
  const hidden = normalizeDashboardLayout(dashboardLayoutOrder.value).filter((id) => !visible.has(id))
  dashboardLayoutOrder.value = normalizeDashboardLayout([...nextVisibleOrder, ...hidden])
  saveDashboardLayout()
}

function moveDashboardBlock(blockId, direction) {
  const ordered = orderedVisibleDashboardBlockIds()
  const index = ordered.indexOf(blockId)
  if (index < 0) return

  const targetIndex = direction === 'up' ? index - 1 : index + 1
  if (targetIndex < 0 || targetIndex >= ordered.length) return

  const next = [...ordered]
  const [item] = next.splice(index, 1)
  next.splice(targetIndex, 0, item)
  setVisibleDashboardOrder(next)
}

function resetDashboardLayout() {
  dashboardLayoutOrder.value = [...dashboardDefaultOrder]
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(dashboardLayoutStorageKey.value)
  }
}

function onDashboardDragStart(event, blockId) {
  if (!isCustomizingDashboard.value) {
    event.preventDefault()
    return
  }

  draggedDashboardBlock.value = blockId
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('text/plain', blockId)
}

function onDashboardDragOver(event) {
  if (!isCustomizingDashboard.value || !draggedDashboardBlock.value) return
  event.preventDefault()
  event.dataTransfer.dropEffect = 'move'
}

function onDashboardDrop(event, targetBlockId) {
  if (!isCustomizingDashboard.value) return
  event.preventDefault()

  const sourceBlockId = draggedDashboardBlock.value || event.dataTransfer.getData('text/plain')
  draggedDashboardBlock.value = ''
  if (!sourceBlockId || sourceBlockId === targetBlockId) return

  const ordered = orderedVisibleDashboardBlockIds()
  const from = ordered.indexOf(sourceBlockId)
  const to = ordered.indexOf(targetBlockId)
  if (from < 0 || to < 0) return

  const next = [...ordered]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  setVisibleDashboardOrder(next)
}

const caChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: true, labels: { color: '#334155', font: { size: 13 }, padding: 18, usePointStyle: true, boxWidth: 8 } },
    tooltip: {
      callbacks: {
        label: (ctx) => `${ctx.dataset.label || 'CA'} : ${new Intl.NumberFormat('fr-FR').format(ctx.parsed.y)} FCFA` ,
      },
    },
  },
  scales: {
    x: { ticks: { color: '#475569', font: { size: 12 } }, grid: { display: false } },
    y: {
      beginAtZero: true,
      grid: { color: '#e2e8f0' },
      ticks: {
        color: '#475569',
        callback: (value) => new Intl.NumberFormat('fr-FR', { notation: 'compact', maximumFractionDigits: 1 }).format(value),
      },
    },
  },
}


async function loadDashboard() {
  loading.value = true
  try {
    const { data } = await api.get('/dashboard')

    dashboardScope.value = data.scope || (userRole.value.includes('commercial') ? 'commercial' : (userRole.value.includes('stock') || userRole.value === 'magasinier' ? 'stock' : 'business'))
    kpi.value = data.kpi || {}
    stockAlertes.value = data.stock_alertes || []
    derniersMouvementsStock.value = data.derniers_mouvements_stock || []
    avancementCommerciaux.value = data.avancement_commerciaux || []
    annonces.value = Array.isArray(data.annonces) ? data.annonces : []

    if (data.ca_mensuel) {
      const datasets = [{
        label: 'CA total',
        data: data.ca_mensuel.data,
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37, 99, 235, 0.06)',
        fill: true,
        tension: 0.3,
        pointBackgroundColor: '#2563eb',
        pointRadius: 4,
        pointHoverRadius: 6,
      }]

      if (Array.isArray(data.ca_mensuel.boutique)) {
        datasets.push({
          label: 'CA boutique',
          data: data.ca_mensuel.boutique,
          borderColor: '#047857',
          backgroundColor: 'transparent',
          fill: false,
          tension: 0.3,
          pointRadius: 3,
          pointHoverRadius: 5,
        })
      }

      if (Array.isArray(data.ca_mensuel.facturation)) {
        datasets.push({
          label: 'CA facturation',
          data: data.ca_mensuel.facturation,
          borderColor: '#7c3aed',
          backgroundColor: 'transparent',
          fill: false,
          tension: 0.3,
          borderDash: [5, 4],
          pointRadius: 3,
          pointHoverRadius: 5,
        })
      }

      caChartData.value = {
        labels: data.ca_mensuel.labels,
        datasets,
      }
    }

    soldesTresorerie.value = normalizeSoldesTresorerie(data.soldes_tresorerie)

    topClients.value = data.top_clients || []
    topProduits.value = data.top_produits || []
    facturesRetard.value = data.factures_retard || []
    derniersPaiements.value = data.derniers_paiements || []
    devisEnAttente.value = data.devis_en_attente || []
  } catch (e) {
    toast.error('Erreur de chargement du dashboard')
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function ouvrirEtatCommerciauxPdf() {
  commercialPdfLoading.value = true
  try {
    await ouvrirPDF('/prospection/etat-commerciaux/pdf', 'Etat-avancement-commerciaux.pdf')
  } catch (e) {
    toast.error('Impossible de générer le PDF des commerciaux.')
  } finally {
    commercialPdfLoading.value = false
  }
}

function normalizeSoldesTresorerie(payload) {
  const comptes = Array.isArray(payload?.comptes) ? payload.comptes : []
  const total = Number(payload?.total)

  return {
    total: Number.isFinite(total)
      ? total
      : comptes.reduce((sum, compte) => sum + Number(compte.solde_actuel ?? compte.solde_initial ?? 0), 0),
    comptes,
  }
}

function tresorerieCompteLabel(compte) {
  const fallback = modePaiementLabel(compte.mode_paiement || compte.type)
  const label = String(compte.libelle || fallback || '')
  return label.replace(/free\s*money/gi, 'YAS') || fallback || 'Compte'
}
function tresorerieCompteSub(compte) {
  return [
    modePaiementLabel(compte.mode_paiement || compte.type),
    compte.code,
    compte.is_default ? 'Par défaut' : null,
  ].filter(Boolean).join(' · ')
}

function modePaiementLabel(value) {
  const slug = modePaiementSlug(value)
  const labels = {
    especes: 'Caisse espèces',
    caisse: 'Caisse',
    wave: 'Wave',
    virement: 'Virement / Banque',
    banque: 'Banque',
    orange_money: 'Orange Money',
    orange: 'Orange Money',
    om: 'Orange Money',
    compensation: 'Compensation',
    cheque: 'Chèque',
    carte: 'Carte bancaire',
    carte_bancaire: 'Carte bancaire',
    free_money: 'YAS',
    yas: 'YAS',
    mobile_money: 'Mobile Money',
    autre: 'Autre compte',
  }

  return labels[slug] || String(value || '').replace(/_/g, ' ')
}

function modePaiementSlug(label) {
  return String(label || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
}

function modePaiementIcon(label) {
  const slug = modePaiementSlug(label)
  const map = {
    especes: 'ES',
    wave: 'WV',
    virement: 'VR',
    orange_money: 'OM',
    compensation: 'CP',
    cheque: 'CH',
    carte: 'CB',
    carte_bancaire: 'CB',
    free_money: 'YAS',
    yas: 'YAS',
    mobile_money: 'MM',
  }

  if (map[slug]) return map[slug]
  return slug.split('_').map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'MP'
}

function modePaiementIconImage(label) {
  const slug = modePaiementSlug(label)
  if (slug.includes('wave')) return '/images/payment/wave.png'
  if (slug.includes('orange_money') || slug === 'om' || slug.includes('orange')) return '/images/payment/orange-money.png'
  if (slug.includes('free_money') || slug.includes('yas')) return '/images/payment/yas.svg'
  if (slug.includes('banque') || slug.includes('bank')) return '/images/dashboard/banque.png'
  if (slug.includes('caisse') || slug.includes('especes')) return '/images/dashboard/caisse.png'
  if (slug.includes('virement') || slug.includes('compensation')) return '/images/dashboard/virement.svg'
  if (slug.includes('carte')) return '/images/dashboard/carte.svg'
  return '/images/dashboard/solde-total.png'
}
function modePaiementIconComponent(label) {
  const slug = modePaiementSlug(label)
  if (slug.includes('wave') || slug.includes('orange') || slug.includes('free_money') || slug.includes('yas') || slug.includes('mobile_money')) return Smartphone
  if (slug.includes('banque') || slug.includes('bank')) return Landmark
  if (slug.includes('caisse') || slug.includes('especes')) return Banknote
  if (slug.includes('virement') || slug.includes('compensation')) return ArrowRightLeft
  if (slug.includes('cheque')) return FileText
  if (slug.includes('carte')) return CreditCard
  return Wallet
}
function modePaiementColor(label, index) {
  const slug = modePaiementSlug(label)
  const map = {
    especes: 'blue',
    caisse: 'blue',
    banque: 'orange',
    virement: 'orange',
    wave: 'green',
    orange_money: 'orange',
    orange: 'orange',
    om: 'orange',
    compensation: 'green',
    cheque: 'blue',
    carte: 'blue',
    carte_bancaire: 'blue',
    free_money: 'green',
    yas: 'green',
    mobile_money: 'green',
  }
  const fallback = ['blue', 'green', 'orange']

  return map[slug] || fallback[index % fallback.length]
}

function dashboardToneClass(color) {
  return {
    green: 'dashboard-tone-1',
    blue: 'dashboard-tone-2',
    cyan: 'dashboard-tone-2',
    orange: 'dashboard-tone-3',
    red: 'dashboard-tone-3',
    purple: 'dashboard-tone-1',
    slate: 'dashboard-tone-3',
  }[color] || 'dashboard-tone-1'
}

function formatPrice(value) {
  return new Intl.NumberFormat('fr-FR').format(Math.round(value || 0))
}

function formatQty(value) {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 3 }).format(Number(value || 0))
}

function formatDate(value) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatDateTime(value) {
  if (!value) return '-'
  return new Date(value).toLocaleString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function rangColor(index) {
  return ['dashboard-rank dashboard-tone-1', 'dashboard-rank dashboard-tone-2', 'dashboard-rank dashboard-tone-3'][index % 3]
}

function mouvementTypeClass(type) {
  return {
    entree: 'dashboard-text-tone-1',
    sortie: 'dashboard-text-tone-3',
    ajustement: 'dashboard-text-tone-2',
  }[type] || 'dashboard-text-tone-3'
}

function progressColor(percent) {
  if (percent === null || percent === undefined) return { bar: 'dashboard-progress-tone-3', text: 'dashboard-text-tone-3' }
  if (percent >= 100) return { bar: 'dashboard-progress-tone-1', text: 'dashboard-text-tone-1' }
  if (percent >= 70) return { bar: 'dashboard-progress-tone-2', text: 'dashboard-text-tone-2' }
  if (percent >= 40) return { bar: 'dashboard-progress-tone-3', text: 'dashboard-text-tone-3' }
  return { bar: 'dashboard-progress-tone-3', text: 'dashboard-text-tone-3' }
}

watch(dashboardLayoutStorageKey, () => loadDashboardLayout(), { immediate: true })

onMounted(() => loadDashboard())

usePageReactivation(loadDashboard)
</script>

<style>
.dashboard-sortable-root {
  display: flex;
  flex-direction: column;
}

.dashboard-customize-button {
  border: 1px solid rgba(255, 255, 255, .32);
  border-radius: 999px;
  background: rgba(255, 255, 255, .16);
  color: #ffffff;
  padding: .35rem .7rem;
  font-size: .72rem;
  font-weight: 800;
  line-height: 1;
  backdrop-filter: blur(10px);
  transition: background .18s ease, transform .18s ease;
}

.dashboard-customize-button:hover {
  background: rgba(255, 255, 255, .25);
  transform: translateY(-1px);
}

.dashboard-customize-button-soft {
  background: rgba(15, 23, 42, .2);
}

.dashboard-layout-hint {
  order: 1;
  border: 1px dashed color-mix(in srgb, var(--saytu-primary, #2563eb) 38%, var(--saytu-border, #bfdbfe));
  border-radius: 1rem;
  background: color-mix(in srgb, var(--saytu-primary, #2563eb) 8%, var(--saytu-surface, #ffffff));
  color: var(--saytu-topbar-title, #0f172a);
  padding: .75rem 1rem;
  font-size: .82rem;
  font-weight: 700;
}

.dashboard-block {
  position: relative;
  transition: transform .18s ease, outline-color .18s ease, box-shadow .18s ease, opacity .18s ease;
}

.dashboard-block-customizing {
  outline: 2px dashed color-mix(in srgb, var(--saytu-primary, #2563eb) 44%, transparent);
  outline-offset: 5px;
  cursor: grab;
}

.dashboard-block-customizing:hover {
  box-shadow: 0 14px 32px color-mix(in srgb, var(--saytu-primary, #2563eb) 13%, transparent);
}

.dashboard-block-dragging {
  opacity: .58;
  transform: scale(.995);
}

.dashboard-block-controls {
  pointer-events: none;
  position: absolute;
  inset: 0;
  z-index: 20;
}

.dashboard-block-corner {
  position: absolute;
  display: inline-flex;
  height: 1.35rem;
  width: 1.35rem;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: linear-gradient(135deg, var(--saytu-primary, #2563eb), var(--saytu-brand-to, #06b6d4));
  color: #ffffff;
  font-size: .72rem;
  font-weight: 950;
  box-shadow: 0 8px 18px color-mix(in srgb, var(--saytu-primary, #2563eb) 24%, transparent);
}

.dashboard-block-corner-tl {
  left: -.7rem;
  top: -.7rem;
}

.dashboard-block-corner-tr {
  right: -.7rem;
  top: -.7rem;
}

.dashboard-block-corner-bl {
  bottom: -.7rem;
  left: -.7rem;
}

.dashboard-block-corner-br {
  bottom: -.7rem;
  right: -.7rem;
}

.dashboard-block-control-panel {
  pointer-events: auto;
  position: absolute;
  right: .75rem;
  top: .75rem;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: .35rem;
  border: 1px solid color-mix(in srgb, var(--saytu-primary, #2563eb) 18%, var(--saytu-border, #e2e8f0));
  border-radius: 999px;
  background: color-mix(in srgb, var(--saytu-surface, #ffffff) 92%, var(--saytu-primary, #2563eb) 8%);
  padding: .35rem;
  box-shadow: 0 10px 24px rgba(15, 23, 42, .12);
}

.dashboard-block-control-title {
  color: var(--saytu-topbar-subtitle, #64748b);
  padding: 0 .45rem;
  font-size: .68rem;
  font-weight: 900;
  letter-spacing: .04em;
  text-transform: uppercase;
}

.dashboard-block-control-button {
  border-radius: 999px;
  background: var(--saytu-primary, #2563eb);
  color: #ffffff;
  padding: .36rem .58rem;
  font-size: .68rem;
  font-weight: 900;
  line-height: 1;
  transition: opacity .18s ease, transform .18s ease;
}

.dashboard-block-control-button:hover:not(:disabled) {
  transform: translateY(-1px);
}

.dashboard-block-control-button:disabled {
  cursor: not-allowed;
  opacity: .38;
}

@media (max-width: 768px) {
  .dashboard-block-control-panel {
    left: .65rem;
    right: .65rem;
    justify-content: center;
    border-radius: 1rem;
  }

  .dashboard-block-control-title {
    width: 100%;
    text-align: center;
  }
}

/* Dashboard-only contrast: do not inherit the decorative cyan theme for data. */
.dashboard-page.dashboard-readable {
  --dashboard-text-main: #0f172a;
  --dashboard-text-muted: #475569;
  --dashboard-tone-1: #047857;
  --dashboard-tone-2: #1d4ed8;
  --dashboard-tone-3: #b45309;
  background: #f1f5f9;
  padding: 16px;
  border-radius: 16px;
  color: #0f172a;
}
.dashboard-page.dashboard-readable .bg-white { background: #fff !important; border-color: #dce3ed !important; }
.dashboard-page.dashboard-readable .dashboard-hero { background: #163c58 !important; padding: 20px 24px; }
.dashboard-page.dashboard-readable .dashboard-hero * { color: #fff !important; }
.dashboard-page.dashboard-readable .dashboard-hero h2 { font-size: 22px; }
.dashboard-page.dashboard-readable .dashboard-hero p { font-size: 14px; }
.dashboard-page.dashboard-readable h3 { font-size: 17px; color: #0f172a !important; }
.dashboard-page.dashboard-readable .text-xs { font-size: 13px; line-height: 1.5; }
.dashboard-page.dashboard-readable .text-gray-400,
.dashboard-page.dashboard-readable .text-gray-500,
.dashboard-page.dashboard-readable .text-gray-600 { color: #475569 !important; }
.dashboard-page.dashboard-readable .text-xelltekk-600 { color: #1d4ed8 !important; }
.dashboard-page.dashboard-readable .dashboard-kpi-card {
  --readable-accent: #1d4ed8;
  background: #fff !important;
  border: 1px solid #dce3ed !important;
  border-top: 4px solid var(--readable-accent) !important;
  padding: 18px;
  min-width: 0;
  border-radius: 12px;
}
.dashboard-page.dashboard-readable .dashboard-accent-green { --readable-accent: #047857; }
.dashboard-page.dashboard-readable .dashboard-accent-orange { --readable-accent: #b45309; }
.dashboard-page.dashboard-readable .dashboard-accent-red { --readable-accent: #b91c1c; }
.dashboard-page.dashboard-readable .dashboard-kpi-label { color: #334155 !important; font-size: 13px; text-transform: none; }
.dashboard-page.dashboard-readable .dashboard-kpi-value { color: #0f172a !important; font-size: clamp(24px, 2vw, 32px); font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
.dashboard-page.dashboard-readable .dashboard-kpi-sub,
.dashboard-page.dashboard-readable .dashboard-kpi-suffix { color: #475569 !important; font-size: 13px; }
.dashboard-page.dashboard-readable .dashboard-accent-red .dashboard-kpi-sub { color: #b91c1c !important; font-weight: 600; }
.dashboard-page.dashboard-readable .dashboard-kpi-icon { color: var(--readable-accent) !important; background: #f1f5f9 !important; border: 0; box-shadow: none; width: 36px; height: 36px; }
.dashboard-page.dashboard-readable .bg-orange-50 { background: #fff7ed !important; }
.dashboard-page.dashboard-readable .bg-red-50 { background: #fef2f2 !important; }
.dashboard-page.dashboard-readable .text-orange-700 { color: #9a3412 !important; }
.dashboard-page.dashboard-readable .text-red-700,
.dashboard-page.dashboard-readable .text-red-800 { color: #b91c1c !important; }
.dashboard-page.dashboard-readable .text-green-600,
.dashboard-page.dashboard-readable .text-green-700 { color: #047857 !important; }
.dashboard-page.dashboard-readable .dashboard-treasury { display: grid; grid-template-columns: minmax(240px, 1fr) minmax(0, 2fr); gap: 24px; }
.dashboard-page.dashboard-readable .dashboard-treasury-total { display: flex; flex-direction: column; justify-content: center; gap: 10px; padding: 24px; background: #eff6ff !important; border-radius: 12px; color: #1e3a8a !important; }
.dashboard-page.dashboard-readable .dashboard-treasury-total strong { font-size: 30px; line-height: 1.3; overflow-wrap: anywhere; }
.dashboard-page.dashboard-readable .dashboard-treasury-total span { font-size: 14px; }
.dashboard-page.dashboard-readable small { font-size: 12px; font-weight: 500; }
.dashboard-page.dashboard-readable .dashboard-account-row { display: flex; align-items: center; gap: 12px; padding: 13px 0; border-bottom: 1px solid #e2e8f0; color: #0f172a !important; }
.dashboard-page.dashboard-readable .dashboard-account-row:last-child { border-bottom: 0; }
.dashboard-page.dashboard-readable .dashboard-account-row > svg { flex-shrink: 0; color: #475569; }
.dashboard-page.dashboard-readable .dashboard-account-name { flex: 1; min-width: 0; }
.dashboard-page.dashboard-readable .dashboard-account-name strong { display: block; font-size: 14px; overflow-wrap: anywhere; }
.dashboard-page.dashboard-readable .dashboard-account-name span { display: block; font-size: 12px; color: #475569; overflow-wrap: anywhere; }
.dashboard-page.dashboard-readable .dashboard-account-balance { font-size: 17px; font-variant-numeric: tabular-nums; text-align: right; }
.dashboard-page.dashboard-readable .is-negative { color: #b91c1c !important; }
.dashboard-page.dashboard-readable a:focus-visible { outline: 3px solid #2563eb; outline-offset: 3px; }
@media (max-width: 767px) {
  .dashboard-page.dashboard-readable { padding: 8px; }
  .dashboard-page.dashboard-readable .dashboard-treasury { grid-template-columns: 1fr; gap: 12px; }
  .dashboard-page.dashboard-readable .dashboard-account-row { flex-wrap: wrap; }
  .dashboard-page.dashboard-readable .dashboard-account-balance { margin-left: auto; max-width: 100%; overflow-wrap: anywhere; }
}

</style>
