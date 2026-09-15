<template>
  <div>
    <!-- Onglets -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
      <div class="flex overflow-x-auto border-b border-gray-200">
        <button @click="onglet = 'overview'" class="px-6 py-3 text-sm font-medium transition-colors"
                :class="onglet === 'overview' ? 'text-xelltekk-700 border-b-2 border-xelltekk-700' : 'text-gray-500 hover:text-gray-700'">
          📊 Vue d’ensemble
        </button>
        <button @click="onglet = 'stock'" class="px-6 py-3 text-sm font-medium transition-colors"
                :class="onglet === 'stock' ? 'text-xelltekk-700 border-b-2 border-xelltekk-700' : 'text-gray-500 hover:text-gray-700'">
          📦 Stock par emplacement
        </button>
        <button @click="onglet = 'inventaire'" class="px-6 py-3 text-sm font-medium transition-colors"
                :class="onglet === 'inventaire' ? 'text-xelltekk-700 border-b-2 border-xelltekk-700' : 'text-gray-500 hover:text-gray-700'">
          🧮 Inventaire rapide
        </button>
        <button @click="onglet = 'mouvements'" class="px-6 py-3 text-sm font-medium transition-colors"
                :class="onglet === 'mouvements' ? 'text-xelltekk-700 border-b-2 border-xelltekk-700' : 'text-gray-500 hover:text-gray-700'">
          🔄 Mouvements
        </button>
        <button @click="onglet = 'alertes'" class="px-6 py-3 text-sm font-medium transition-colors"
                :class="onglet === 'alertes' ? 'text-xelltekk-700 border-b-2 border-xelltekk-700' : 'text-gray-500 hover:text-gray-700'">
          ⚠️ Alertes
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
          <p class="mt-1 text-xs text-cyan-800">{{ formatQte(stockSummary.kpis.quantite_totale) }} unité(s) au total</p>
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
                  <p class="text-xs text-slate-500">{{ formatQte(entrepot.quantite) }} unité(s)</p>
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
            <p class="font-bold text-slate-900">{{ a.libelle }}</p>
            <p class="text-xs font-mono text-slate-500">{{ a.reference || '-' }}</p>
            <p class="mt-2 text-sm">
              Stock : <strong class="text-red-700">{{ formatQte(a.stock_total) }}</strong>
              <span class="text-slate-500"> / seuil {{ a.stock_alerte }}</span>
            </p>
          </article>
        </div>
        <p v-else class="rounded-xl bg-emerald-50 p-5 text-center text-sm font-bold text-emerald-700">Aucune alerte critique actuellement.</p>
      </section>
    </div>

    <!-- TAB: Stock -->
    <div v-else-if="onglet === 'stock'" class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div class="border-b border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
        Un produit peut apparaître sur plusieurs lignes lorsqu'il est rangé dans plusieurs emplacements. La colonne « Total produit » affiche sa quantité globale.
      </div>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <SortableTh column="reference" :active="stockSort.key === 'reference'" :icon="stockSortIcon('reference')" @sort="toggleStockSort">Référence</SortableTh>
              <SortableTh column="produit" :active="stockSort.key === 'produit'" :icon="stockSortIcon('produit')" @sort="toggleStockSort">Produit</SortableTh>
              <SortableTh column="entrepot" :active="stockSort.key === 'entrepot'" :icon="stockSortIcon('entrepot')" @sort="toggleStockSort">Entrepôt</SortableTh>
              <SortableTh column="emplacement" :active="stockSort.key === 'emplacement'" :icon="stockSortIcon('emplacement')" @sort="toggleStockSort">Emplacement</SortableTh>
              <SortableTh column="quantite" :active="stockSort.key === 'quantite'" :icon="stockSortIcon('quantite')" align="right" @sort="toggleStockSort">Quantité</SortableTh>
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
                  :class="parseFloat(s.quantite) <= parseFloat(s.produit?.stock_alerte || 0) ? 'text-orange-600' : 'text-gray-900'">
                {{ formatQte(s.quantite) }} {{ s.produit?.unite || '' }}
              </td>
              <td class="px-4 py-3 text-sm text-right font-mono font-semibold text-blue-700">
                {{ formatQte(s.stock_total_produit) }} {{ s.produit?.unite || '' }}
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
              <td colspan="9" class="px-4 py-12 text-center text-gray-400 text-sm">
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
      <div class="border-b border-cyan-100 bg-cyan-50 px-4 py-3 text-sm text-cyan-900">
        Saisissez la quantité réellement comptée. Saytu calcule l’écart et enregistre un mouvement d’ajustement avec justification.
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
      <div class="overflow-x-auto">
      <table class="w-full">
        <thead class="bg-gray-50 border-b border-gray-200">
          <tr>
            <SortableTh column="reference" :active="alerteSort.key === 'reference'" :icon="alerteSortIcon('reference')" @sort="toggleAlerteSort">Référence</SortableTh>
            <SortableTh column="produit" :active="alerteSort.key === 'produit'" :icon="alerteSortIcon('produit')" @sort="toggleAlerteSort">Produit</SortableTh>
            <SortableTh column="stock" :active="alerteSort.key === 'stock'" :icon="alerteSortIcon('stock')" align="right" @sort="toggleAlerteSort">Stock actuel</SortableTh>
            <SortableTh column="seuil" :active="alerteSort.key === 'seuil'" :icon="alerteSortIcon('seuil')" align="right" @sort="toggleAlerteSort">Seuil d'alerte</SortableTh>
            <SortableTh column="statut" :active="alerteSort.key === 'statut'" :icon="alerteSortIcon('statut')" align="center" @sort="toggleAlerteSort">Statut</SortableTh>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="a in sortedAlertes" :key="a.id" class="hover:bg-gray-50">
            <td class="px-4 py-3 text-sm font-mono text-gray-600">{{ a.reference }}</td>
            <td class="px-4 py-3 text-sm font-medium">{{ a.libelle }}</td>
            <td class="px-4 py-3 text-sm text-right font-mono font-bold text-red-600">{{ formatQte(a.stock_total) }}</td>
            <td class="px-4 py-3 text-sm text-right font-mono text-gray-600">{{ a.stock_alerte }}</td>
            <td class="px-4 py-3 text-center">
              <span v-if="parseFloat(a.stock_total) === 0" class="badge bg-red-100 text-red-800">RUPTURE</span>
              <span v-else class="badge bg-orange-100 text-orange-800">ALERTE</span>
            </td>
          </tr>
          <tr v-if="alertes.length === 0">
            <td colspan="5" class="px-4 py-12 text-center text-green-600 text-sm">
              ✅ Aucun produit en alerte de stock !
            </td>
          </tr>
        </tbody>
      </table>
      </div>
    </div>

    <!-- Modal mouvement -->
    <AppModal v-model="showMouvementModal" :title="mouvementTitle" size="md">
      <MouvementForm :type="mouvementType" :entrepots="entrepots" @saved="onMouvementSaved" @cancel="showMouvementModal = false" />
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

    <AppModal v-model="showTransfertModal" title="Transférer vers un autre entrepôt" size="md">
      <form class="space-y-4" @submit.prevent="transfererStock">
        <div class="rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
          <strong>{{ stockATransferer?.produit?.reference || '' }} — {{ stockATransferer?.produit?.libelle || 'Produit' }}</strong>
          <p class="mt-1">Source : {{ stockATransferer?.entrepot?.libelle || '-' }} · {{ emplacementLabel(stockATransferer?.emplacement) }}</p>
          <p>Disponible : {{ formatQte(transfertDisponible) }} {{ stockATransferer?.produit?.unite || '' }}</p>
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
            {{ transfertSaving ? 'Transfert...' : 'Valider le transfert' }}
          </button>
        </div>
      </form>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, computed, h, watch } from 'vue'
import api from '@/services/api'
import AppModal from '@/components/AppModal.vue'
import MouvementForm from '@/components/MouvementForm.vue'
import SortableTh from '@/components/SortableTh.vue'
import { useToast } from '@/composables/useToast'
import { useTableSort } from '@/composables/useTableSort'
import { telechargerCSV } from '@/services/exports'

const toast = useToast()
const onglet = ref('overview')
const stocks = ref([])
const mouvements = ref([])
const alertes = ref([])
const stockSummary = ref(emptyStockSummary())
const movementResume = ref(emptyMovementResume())
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
const filters = reactive({ search: '', entrepot_id: '', type: '', document_type: '', date_from: '', date_to: '' })
const inventoryDrafts = reactive({})
const inventorySavingId = ref(null)

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
  stock: (alerte) => parseFloat(alerte.stock_total || 0),
  seuil: (alerte) => parseFloat(alerte.stock_alerte || 0),
  statut: (alerte) => (parseFloat(alerte.stock_total || 0) === 0 ? 'rupture' : 'alerte'),
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
    } else if (tab === 'stock' || tab === 'inventaire') {
      const { data } = await api.get('/stocks', { params: { page, per_page: 25, search: filters.search || undefined, entrepot_id: filters.entrepot_id || undefined } })
      if (requestId !== reloadRequestId || tab !== onglet.value) return
      stocks.value = data.data
      if (tab === 'inventaire') {
        prepareInventoryDrafts(stocks.value)
      }
      Object.assign(meta, { current_page: data.current_page, last_page: data.last_page, total: data.total, from: data.from || 0, to: data.to || 0 })
    } else if (tab === 'mouvements') {
      const { data } = await api.get('/stocks/mouvements', { params: { page, per_page: 25, ...movementFilterParams() } })
      if (requestId !== reloadRequestId || tab !== onglet.value) return
      mouvements.value = data.data
      movementResume.value = normalizeMovementResume(data.resume)
      Object.assign(meta, { current_page: data.current_page, last_page: data.last_page, total: data.total, from: data.from || 0, to: data.to || 0 })
    } else if (tab === 'alertes') {
      const { data } = await api.get('/stocks/alerts', { params: { search: filters.search || undefined } })
      if (requestId !== reloadRequestId || tab !== onglet.value) return
      alertes.value = data
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
}

function formatQte(n) { return parseFloat(n || 0).toLocaleString('fr-FR', { maximumFractionDigits: 3 }) }
function formatPrice(n) { return new Intl.NumberFormat('fr-FR').format(Math.round(n || 0))  }
function formatDateTime(d) { return d ? new Date(d).toLocaleString('fr-FR') : '–' }
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
    toast.success('Transfert inter-entrepôts enregistré.')
    showTransfertModal.value = false
    await reload(meta.current_page)
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
    ajustement: 'Ajustement',
  }[type || 'manuel'] || String(type).replaceAll('_', ' ')
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
