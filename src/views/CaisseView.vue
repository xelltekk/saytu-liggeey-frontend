<template>
  <div class="space-y-5">
    <div class="stat-grid grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
      <div class="rounded-lg border border-slate-200 bg-white p-4">
        <p class="text-xs uppercase text-slate-500">Caisses ouvertes</p>
        <p class="mt-1 text-2xl font-bold text-slate-900">{{ stats.sessions_ouvertes || 0 }}</p>
      </div>
      <div class="rounded-lg border border-emerald-100 bg-emerald-50 p-4">
        <p class="text-xs uppercase text-emerald-700">Entrees du jour</p>
        <p class="mt-1 text-xl font-bold text-emerald-800">{{ formatPrice(stats.entrees_jour) }}</p>
      </div>
      <div class="rounded-lg border border-red-100 bg-red-50 p-4">
        <p class="text-xs uppercase text-red-700">Sorties du jour</p>
        <p class="mt-1 text-xl font-bold text-red-800">{{ formatPrice(stats.sorties_jour) }}</p>
      </div>
      <div class="rounded-lg border border-cyan-100 bg-cyan-50 p-4">
        <p class="text-xs uppercase text-cyan-700">Solde net jour</p>
        <p class="mt-1 text-xl font-bold text-cyan-800">{{ formatPrice(stats.solde_net_jour) }}</p>
      </div>
    </div>

    <div v-if="loading" class="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
      Chargement...
    </div>

    <div v-else-if="isAdmin" class="grid grid-cols-1 gap-5 xl:grid-cols-[420px_1fr]">
      <div class="rounded-lg border border-slate-200 bg-white">
        <div class="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div>
            <h3 class="font-bold text-slate-900">Historique des caisses</h3>
            <p class="text-xs text-slate-500">{{ sessionsActivesCount }} ouverte(s) / {{ sessionsOuvertes.length }} total</p>
          </div>
          <div class="flex gap-2">
            <button class="btn-secondary px-3 py-1.5 text-sm" :disabled="exportLoading" @click="exporterSessionsCSV">
              {{ exportLoading ? 'Export...' : 'Exporter' }}
            </button>
            <button class="btn-secondary px-3 py-1.5 text-sm" @click="loadVueAdmin">Actualiser</button>
          </div>
        </div>

        <div class="max-h-[520px] overflow-y-auto">
          <button
            v-for="s in sessionsOuvertes"
            :key="s.id"
            type="button"
            class="block w-full border-b border-slate-100 px-4 py-3 text-left last:border-b-0 hover:bg-slate-50"
            :class="sessionAdminSelection?.id === s.id ? 'bg-cyan-50' : ''"
            @click="selectionnerSessionAdmin(s)"
          >
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="font-semibold text-slate-900">{{ s.reference }}</p>
                <p class="text-sm text-slate-500">{{ s.user?.name || 'Utilisateur' }}</p>
                <p class="text-xs text-slate-400">{{ formatDateTime(s.opened_at) }}</p>
                <p v-if="s.closed_at" class="text-xs text-slate-400">Fermée le {{ formatDateTime(s.closed_at) }}</p>
              </div>
              <div class="text-right">
                <span class="rounded-full px-2 py-1 text-xs font-semibold" :class="s.statut === 'ouverte' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'">
                  {{ s.statut }}
                </span>
                <p class="font-mono font-bold text-slate-900">{{ formatPrice(s.solde_fermeture_theorique) }}</p>
                <p class="text-xs text-slate-500">{{ s.mouvements_count || 0 }} mouvement(s)</p>
              </div>
            </div>
          </button>

          <div v-if="sessionsOuvertes.length === 0" class="px-4 py-10 text-center text-sm text-slate-400">
            Aucun historique de caisse
          </div>
        </div>
      </div>

      <div class="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div class="border-b border-slate-200 px-4 py-3">
          <h3 class="font-bold text-slate-900">
            Mouvements {{ sessionAdminSelection ? `- ${sessionAdminSelection.reference}` : '' }}
          </h3>
          <p class="text-xs text-slate-500">
            {{ sessionAdminSelection?.user?.name || 'Selectionnez une caisse ouverte' }}
          </p>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th class="px-4 py-3 text-left">Heure</th>
                <th class="px-4 py-3 text-left">Libelle</th>
                <th class="px-4 py-3 text-center">Type</th>
                <th class="px-4 py-3 text-left">Reference</th>
                <th class="px-4 py-3 text-right">Montant</th>
                <th class="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="m in mouvementsAdmin" :key="m.id" class="text-sm">
                <td class="px-4 py-3 text-slate-500">{{ formatTime(m.created_at) }}</td>
                <td class="px-4 py-3">
                  <p class="font-medium text-slate-900">{{ m.libelle }}</p>
                  <p v-if="produitsMouvement(m)" class="text-xs text-slate-600">{{ produitsMouvement(m) }}</p>
                  <p class="text-xs text-slate-500">{{ m.user?.name || 'Utilisateur' }}</p>
                </td>
                <td class="px-4 py-3 text-center">
                  <span class="rounded-full px-2 py-1 text-xs font-semibold" :class="m.sens === 'entree' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'">
                    {{ typeLabel(m.type) }}
                  </span>
                </td>
                <td class="px-4 py-3 text-xs text-slate-500">
                  {{ m.facture?.numero || m.paiement?.reference || m.reference || '-' }}
                </td>
                <td class="px-4 py-3 text-right font-mono font-semibold" :class="m.sens === 'entree' ? 'text-emerald-700' : 'text-red-700'">
                  {{ m.sens === 'entree' ? '+' : '-' }} {{ formatPrice(m.montant) }}
                </td>
                <td class="px-4 py-3 text-right">
                  <button v-if="m.type === 'vente' && m.facture?.id" class="btn-secondary px-3 py-1.5 text-xs" @click="reimprimerTicket(m)">
                    Réimprimer
                  </button>
                </td>
              </tr>
              <tr v-if="mouvementsAdminLoading">
                <td colspan="6" class="px-4 py-10 text-center text-sm text-slate-400">
                  Chargement des mouvements...
                </td>
              </tr>
              <tr v-else-if="mouvementsAdmin.length === 0">
                <td colspan="6" class="px-4 py-10 text-center text-sm text-slate-400">
                  Aucun mouvement a afficher
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="overflow-hidden rounded-lg border border-slate-200 bg-white xl:col-span-2">
        <div class="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div>
            <h3 class="font-bold text-slate-900">Opérations en temps réel</h3>
            <p class="text-xs text-slate-500">Derniers mouvements de toutes les caisses</p>
          </div>
          <div class="flex gap-2">
            <button class="btn-secondary px-3 py-1.5 text-sm" :disabled="exportLoading" @click="exporterMouvementsCSV()">
              {{ exportLoading ? 'Export...' : 'Exporter' }}
            </button>
            <button class="btn-secondary px-3 py-1.5 text-sm" @click="loadJournalAdmin">Actualiser</button>
          </div>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th class="px-4 py-3 text-left">Heure</th>
                <th class="px-4 py-3 text-left">Caisse</th>
                <th class="px-4 py-3 text-left">Opération</th>
                <th class="px-4 py-3 text-left">Client / Référence</th>
                <th class="px-4 py-3 text-right">Montant</th>
                <th class="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="m in journalAdmin" :key="m.id" class="text-sm">
                <td class="px-4 py-3 text-slate-500">{{ formatDateTime(m.created_at) }}</td>
                <td class="px-4 py-3">
                  <p class="font-medium text-slate-900">{{ m.session?.reference || '-' }}</p>
                  <p class="text-xs text-slate-500">{{ m.session?.user?.name || m.user?.name || 'Utilisateur' }}</p>
                </td>
                <td class="px-4 py-3">
                  <p class="font-medium text-slate-900">{{ m.libelle }}</p>
                  <p v-if="produitsMouvement(m)" class="text-xs text-slate-600">{{ produitsMouvement(m) }}</p>
                </td>
                <td class="px-4 py-3 text-slate-600">
                  <p>{{ m.facture?.client?.nom || '-' }}</p>
                  <p class="text-xs">{{ m.facture?.numero || m.paiement?.reference || m.reference || '-' }}</p>
                </td>
                <td class="px-4 py-3 text-right font-mono font-semibold" :class="m.sens === 'entree' ? 'text-emerald-700' : 'text-red-700'">
                  {{ m.sens === 'entree' ? '+' : '-' }} {{ formatPrice(m.montant) }}
                </td>
                <td class="px-4 py-3 text-right">
                  <button v-if="m.type === 'vente' && m.facture?.id" class="btn-secondary px-3 py-1.5 text-xs" @click="reimprimerTicket(m)">
                    Réimprimer
                  </button>
                </td>
              </tr>
              <tr v-if="journalAdmin.length === 0">
                <td colspan="6" class="px-4 py-10 text-center text-sm text-slate-400">Aucune opération récente</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div v-else-if="!session" class="rounded-lg border border-slate-200 bg-white p-4 sm:p-6">
      <h3 class="text-xl font-bold text-slate-900 sm:text-2xl">Ouvrir une caisse</h3>
      <p class="mt-1 text-sm text-slate-500 sm:text-base">Renseignez le fonds de caisse de depart pour commencer la journee.</p>

      <form class="mt-4 grid grid-cols-1 gap-3 md:grid-cols-[220px_1fr_auto]" @submit.prevent="ouvrirCaisse">
        <input v-model.number="openForm.solde_ouverture" type="number" min="0" step="0.01" class="input" :class="isTouchPos ? 'min-h-14 text-lg' : ''" placeholder="Solde ouverture" />
        <input v-model="openForm.notes_ouverture" type="text" class="input" :class="isTouchPos ? 'min-h-14 text-lg' : ''" placeholder="Note d'ouverture (optionnel)" />
        <button class="btn-primary" :class="isTouchPos ? 'min-h-14 text-base' : ''" :disabled="saving">
          <span v-if="saving">Ouverture...</span>
          <span v-else>Ouvrir la caisse</span>
        </button>
      </form>
    </div>

    <div v-else class="space-y-5">
      <div class="space-y-5">
        <div class="rounded-lg border border-slate-200 bg-white p-4">
          <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p class="text-xs uppercase text-slate-500">Caisse active</p>
              <h3 class="text-xl font-bold text-slate-900">{{ session.reference }}</h3>
              <p class="text-sm text-slate-500">Ouverte par {{ session.user?.name || 'Utilisateur' }} le {{ formatDateTime(session.opened_at) }}</p>
            </div>
            <div class="rounded-lg bg-slate-50 px-4 py-3 text-right">
              <p class="text-xs uppercase text-slate-500">Solde theorique</p>
              <p class="text-2xl font-bold text-slate-900">{{ formatPrice(session.solde_fermeture_theorique) }}</p>
            </div>
          </div>
        </div>

        <div class="rounded-lg border border-slate-200 bg-white p-4" :class="isTouchPos ? 'touch-pos-surface' : ''">
          <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 class="font-bold text-slate-900" :class="isTouchPos ? 'text-2xl' : 'text-lg'">Vente boutique POS</h3>
              <p class="text-sm text-slate-500" :class="isTouchPos ? 'sm:text-base' : ''">Ajoutez les articles au panier, encaissez et imprimez le ticket.</p>
            </div>
            <button class="btn-secondary" :class="isTouchPos ? 'min-h-12 px-5 text-base' : ''" :disabled="panier.length === 0" @click="viderPanier">Vider le panier</button>
          </div>

          <div class="mt-4 grid grid-cols-1 gap-4" :class="isTouchPos ? 'xl:grid-cols-[minmax(0,1fr)_460px]' : 'xl:grid-cols-[1fr_380px]'">
            <div class="space-y-3">
              <input
                v-model="productSearch"
                type="search"
                class="input"
                :class="isTouchPos ? 'min-h-14 rounded-lg text-lg' : ''"
                placeholder="Scanner ou rechercher un produit..."
                @keydown.enter.prevent="ajouterPremierProduit"
              />

              <div
                class="overflow-y-auto rounded-lg border border-slate-200"
                :class="isTouchPos ? 'max-h-[62vh] divide-y divide-slate-100 rounded-xl border-2 bg-white' : 'max-h-80'"
              >
                <button
                  v-for="p in produits"
                  :key="p.id"
                  type="button"
                  class="flex w-full items-center justify-between gap-3 text-left hover:bg-slate-50"
                  :class="isTouchPos ? 'min-h-24 px-4 py-3 active:bg-cyan-50' : 'border-b border-slate-100 px-3 py-3 last:border-b-0'"
                  @click="ajouterAuPanier(p)"
                >
                  <div class="min-w-0 flex-1">
                    <p class="font-medium text-slate-900" :class="isTouchPos ? 'text-lg' : 'truncate'">{{ p.libelle }}</p>
                    <div class="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500" :class="isTouchPos ? 'text-sm' : ''">
                      <span class="font-mono">Ref: {{ p.reference }}</span>
                      <span v-if="p.code_barre" class="font-mono">Code: {{ p.code_barre }}</span>
                      <span>{{ p.type === 'service' ? 'Service' : 'Produit' }}</span>
                    </div>
                  </div>
                  <div class="grid shrink-0 grid-cols-2 items-center gap-3 text-right sm:min-w-60">
                    <div>
                      <p class="text-xs uppercase text-slate-500">Stock</p>
                      <p class="font-semibold" :class="[isTouchPos ? 'text-lg' : 'text-sm', stockDisponible(p) > 0 || !p.gere_stock ? 'text-slate-700' : 'text-red-600']">
                        {{ p.gere_stock ? stockDisponible(p) : '-' }}
                      </p>
                    </div>
                    <div>
                      <p class="text-xs uppercase text-slate-500">Prix TTC</p>
                      <p class="font-mono font-bold text-slate-900" :class="isTouchPos ? 'text-lg' : 'text-sm'">{{ formatPrice(prixTtc(p)) }}</p>
                    </div>
                  </div>
                  <div v-if="isTouchPos" class="hidden shrink-0 items-center justify-center rounded-full bg-cyan-600 px-4 py-3 font-bold text-white sm:flex">
                    +
                  </div>
                </button>
                <div v-if="produits.length === 0" class="px-4 py-8 text-center text-sm text-slate-400">
                  Aucun produit trouve
                </div>
              </div>
            </div>

            <div class="rounded-lg border border-slate-200 bg-slate-50 p-3" :class="isTouchPos ? 'sticky top-3 self-start rounded-xl p-4' : ''">
              <div class="mb-3 flex items-center justify-between">
                <h4 class="font-bold text-slate-900" :class="isTouchPos ? 'text-xl' : ''">Panier</h4>
                <span class="text-sm text-slate-500">{{ panier.length }} ligne(s)</span>
              </div>

              <div class="space-y-2 overflow-y-auto" :class="isTouchPos ? 'max-h-[36vh]' : 'max-h-72'">
                <div v-for="ligne in panier" :key="ligne.produit_id" class="rounded-lg bg-white p-3 shadow-sm">
                  <div class="flex items-start justify-between gap-3">
                    <div class="min-w-0">
                      <p class="truncate font-semibold text-slate-900" :class="isTouchPos ? 'text-base' : 'text-sm'">{{ ligne.libelle }}</p>
                      <p class="font-mono text-xs text-slate-500">{{ formatPrice(ligne.prix_ttc) }}</p>
                    </div>
                    <button class="text-sm text-red-600 hover:text-red-800" :class="isTouchPos ? 'min-h-10 px-2' : ''" @click="retirerDuPanier(ligne.produit_id)">Supprimer</button>
                  </div>
                  <div class="mt-3 grid items-center gap-2" :class="isTouchPos ? 'grid-cols-[48px_80px_48px_1fr]' : 'grid-cols-[88px_1fr]'">
                    <button v-if="isTouchPos" type="button" class="touch-step-btn" @click="decrementerLigne(ligne)">-</button>
                    <input v-model.number="ligne.quantite" type="number" min="0.001" step="1" class="input text-center" :class="isTouchPos ? 'min-h-12 text-lg' : ''" />
                    <button v-if="isTouchPos" type="button" class="touch-step-btn" @click="incrementerLigne(ligne)">+</button>
                    <div class="text-right font-mono font-bold text-slate-900">{{ formatPrice(totalLigne(ligne)) }}</div>
                  </div>
                </div>
                <div v-if="panier.length === 0" class="rounded-lg bg-white px-4 py-8 text-center text-sm text-slate-400">
                  Panier vide
                </div>
              </div>

              <div class="mt-4 space-y-2 border-t border-slate-200 pt-3" :class="isTouchPos ? 'text-base' : 'text-sm'">
                <div class="flex justify-between" :class="isTouchPos ? 'text-2xl' : 'text-lg'">
                  <span class="font-bold text-slate-900">Total</span>
                  <strong>{{ formatPrice(totauxPanier.ttc) }}</strong>
                </div>
              </div>

              <div class="mt-4 space-y-2">
                <div class="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    class="touch-pay-btn"
                    :class="posForm.document_type === 'ticket' ? 'touch-pay-btn-active' : ''"
                    @click="posForm.document_type = 'ticket'"
                  >
                    Ticket
                  </button>
                  <button
                    type="button"
                    class="touch-pay-btn"
                    :class="posForm.document_type === 'facture' ? 'touch-pay-btn-active' : ''"
                    @click="posForm.document_type = 'facture'"
                  >
                    Facture client
                  </button>
                </div>
                <input
                  v-model="posForm.client_nom"
                  class="input"
                  :class="isTouchPos ? 'min-h-12 text-base' : ''"
                  :placeholder="posForm.document_type === 'facture' ? 'Nom du client obligatoire' : 'Client (optionnel)'"
                />
                <div v-if="encaissements.length === 1" class="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  <button
                    v-for="mode in modesPaiementTactiles"
                    :key="mode.value"
                    type="button"
                    class="touch-pay-btn"
                    :class="encaissements[0].mode_paiement === mode.value ? 'touch-pay-btn-active' : ''"
                    @click="encaissements[0].mode_paiement = mode.value"
                  >
                    {{ mode.label }}
                  </button>
                </div>
                <input
                  v-if="encaissements.length === 1 && encaissements[0].mode_paiement === 'especes'"
                  v-model.number="encaissements[0].montant_recu"
                  type="number"
                  min="0"
                  step="0.01"
                  class="input"
                  :class="isTouchPos ? 'min-h-12 text-base' : ''"
                  placeholder="Espèces reçues"
                />
                <input
                  v-if="encaissements.length === 1 && encaissements[0].mode_paiement !== 'especes'"
                  v-model="encaissements[0].reference_paiement"
                  class="input"
                  :class="isTouchPos ? 'min-h-12 text-base' : ''"
                  placeholder="Référence paiement (optionnel)"
                />

                <div class="space-y-2 rounded-lg border border-slate-200 bg-white p-3">
                  <div class="flex items-center justify-between gap-2">
                    <div>
                      <h5 class="text-sm font-bold text-slate-900">Encaissement</h5>
                      <p class="text-xs text-slate-500">{{ isPaiementFractionne ? 'Paiement fractionné' : 'Paiement simple' }}</p>
                    </div>
                    <button type="button" class="btn-secondary px-3 py-1.5 text-xs" @click="ajouterEncaissement">
                      {{ isPaiementFractionne ? '+ Moyen de paiement' : '+ Fractionner' }}
                    </button>
                  </div>
                  <div v-for="(encaissement, index) in encaissements" v-if="isPaiementFractionne" :key="encaissement.id" class="space-y-2 rounded-lg border border-slate-200 p-2">
                    <div class="grid grid-cols-[1fr_auto] gap-2">
                      <select v-model="encaissement.mode_paiement" class="input">
                        <option value="especes">Especes</option>
                        <option value="wave">Wave</option>
                        <option value="orange_money">Orange Money</option>
                        <option value="carte_bancaire">Carte bancaire</option>
                        <option value="cheque">Cheque</option>
                        <option value="virement">Virement</option>
                        <option value="autre">Autre</option>
                      </select>
                      <button v-if="encaissements.length > 1" type="button" class="min-h-10 px-2 text-red-600" title="Supprimer ce paiement" @click="retirerEncaissement(index)">✕</button>
                    </div>
                    <div class="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto_1fr]">
                      <input v-model.number="encaissement.montant" type="number" min="0.01" step="0.01" class="input" placeholder="Montant payé" />
                      <button type="button" class="btn-secondary px-3 text-xs" title="Utiliser le reste à encaisser" @click="completerEncaissement(index)">Solde</button>
                      <input
                        v-if="encaissement.mode_paiement === 'especes'"
                        v-model.number="encaissement.montant_recu"
                        type="number"
                        min="0"
                        step="0.01"
                        class="input"
                        placeholder="Espèces reçues"
                      />
                    </div>
                    <input v-if="encaissement.mode_paiement !== 'especes'" v-model="encaissement.reference_paiement" class="input" placeholder="Référence paiement (optionnel)" />
                  </div>
                  <div class="space-y-1 border-t border-slate-200 pt-2 text-sm">
                    <div class="flex justify-between"><span>Payé</span><strong>{{ formatPrice(totalEncaissements) }}</strong></div>
                    <div class="flex justify-between" :class="resteAEncaisser > 0.01 ? 'text-red-700' : 'text-green-700'">
                      <span>Reste à encaisser</span><strong>{{ formatPrice(resteAEncaisser) }}</strong>
                    </div>
                    <div v-if="excedentEncaissement > 0.01" class="flex justify-between font-bold text-red-700">
                      <span>Montant en trop</span><strong>{{ formatPrice(excedentEncaissement) }}</strong>
                    </div>
                    <div v-if="monnaieARendre > 0" class="flex justify-between text-lg font-bold text-blue-700">
                      <span>Monnaie à rendre</span><strong>{{ formatPrice(monnaieARendre) }}</strong>
                    </div>
                  </div>
                </div>

                <button class="btn-primary w-full" :class="isTouchPos ? 'min-h-16 text-lg font-bold' : ''" :disabled="saving || panier.length === 0 || Math.abs(ecartEncaissement) > 0.01" @click="encaisserVente">
                  <span v-if="saving">Encaissement...</span>
                  <span v-else>{{ posForm.document_type === 'facture' ? 'Encaisser et ouvrir facture' : 'Encaisser et imprimer' }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <details class="rounded-lg border border-slate-200 bg-white p-4">
          <summary class="cursor-pointer select-none text-lg font-bold text-slate-900">Nouveau mouvement manuel</summary>
          <form class="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2" @submit.prevent="ajouterMouvement">
            <select v-model="movementForm.sens" class="input">
              <option value="entree">Entree</option>
              <option value="sortie">Sortie</option>
            </select>
            <select v-model="movementForm.type" class="input">
              <option value="vente">Vente boutique</option>
              <option value="encaissement">Encaissement facture</option>
              <option value="depense">Depense</option>
              <option value="retrait">Retrait caisse</option>
              <option value="depot">Depot caisse</option>
              <option value="correction">Correction</option>
              <option value="remboursement">Remboursement</option>
              <option value="autre">Autre</option>
            </select>
            <input v-model="movementForm.libelle" class="input md:col-span-2" placeholder="Libelle" />
            <input v-model.number="movementForm.montant" type="number" min="0.01" step="0.01" class="input" placeholder="Montant" />
            <select v-model="movementForm.mode_paiement" class="input">
              <option value="especes">Especes</option>
              <option value="wave">Wave</option>
              <option value="orange_money">Orange Money</option>
              <option value="carte_bancaire">Carte bancaire</option>
              <option value="cheque">Cheque</option>
              <option value="virement">Virement</option>
              <option value="autre">Autre</option>
            </select>
            <input v-model="movementForm.reference" class="input md:col-span-2" placeholder="Reference ticket, facture ou transaction" />
            <textarea v-model="movementForm.description" class="input md:col-span-2" rows="2" placeholder="Description (optionnel)"></textarea>
            <div class="md:col-span-2 flex justify-end">
              <button class="btn-primary" :disabled="saving">
                <span v-if="saving">Enregistrement...</span>
                <span v-else>Ajouter le mouvement</span>
              </button>
            </div>
          </form>
        </details>

        <details class="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <summary class="cursor-pointer select-none px-4 py-3 font-bold text-slate-900">Historique et réimpression</summary>
          <div class="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <h3 class="font-bold text-slate-900">Mouvements de caisse</h3>
            <button class="btn-secondary px-3 py-1.5 text-sm" :disabled="exportLoading" @click="exporterMouvementsCSV(session.id)">
              {{ exportLoading ? 'Export...' : 'Exporter' }}
            </button>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th class="px-4 py-3 text-left">Heure</th>
                  <th class="px-4 py-3 text-left">Libelle</th>
                  <th class="px-4 py-3 text-center">Type</th>
                  <th class="px-4 py-3 text-right">Montant</th>
                  <th class="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr v-for="m in mouvements" :key="m.id" class="text-sm">
                  <td class="px-4 py-3 text-slate-500">{{ formatTime(m.created_at) }}</td>
                  <td class="px-4 py-3">
                    <p class="font-medium text-slate-900">{{ m.libelle }}</p>
                    <p v-if="produitsMouvement(m)" class="text-xs text-slate-600">{{ produitsMouvement(m) }}</p>
                    <p class="text-xs text-slate-500">{{ m.reference || m.mode_paiement }}</p>
                  </td>
                  <td class="px-4 py-3 text-center">
                    <span class="rounded-full px-2 py-1 text-xs font-semibold" :class="m.sens === 'entree' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'">
                      {{ typeLabel(m.type) }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-right font-mono font-semibold" :class="m.sens === 'entree' ? 'text-emerald-700' : 'text-red-700'">
                    {{ m.sens === 'entree' ? '+' : '-' }} {{ formatPrice(m.montant) }}
                  </td>
                  <td class="px-4 py-3 text-right">
                    <button v-if="m.type === 'vente' && m.facture?.id" class="btn-secondary px-3 py-1.5 text-xs" @click="reimprimerTicket(m)">
                      Réimprimer
                    </button>
                  </td>
                </tr>
                <tr v-if="mouvements.length === 0">
                  <td colspan="5" class="px-4 py-10 text-center text-sm text-slate-400">Aucun mouvement pour cette caisse</td>
                </tr>
              </tbody>
            </table>
          </div>
        </details>
      </div>

      <section class="rounded-lg border border-slate-200 bg-white p-4">
        <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h3 class="text-lg font-bold text-slate-900">Fermer la caisse</h3>
            <p class="mt-1 text-sm text-slate-500">Saisissez le montant reel compte dans la caisse.</p>
          </div>
          <div class="rounded-lg bg-slate-50 p-3 text-sm lg:min-w-72">
            <div class="flex justify-between">
              <span class="text-slate-500">Theorique</span>
              <strong>{{ formatPrice(session.solde_fermeture_theorique) }}</strong>
            </div>
            <div class="mt-2 flex justify-between">
              <span class="text-slate-500">Ecart prevu</span>
              <strong :class="ecartPrevu === 0 ? 'text-slate-700' : ecartPrevu > 0 ? 'text-emerald-700' : 'text-red-700'">
                {{ formatPrice(ecartPrevu) }}
              </strong>
            </div>
          </div>
        </div>
        <form class="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-[220px_1fr_auto]" @submit.prevent="fermerCaisse">
          <input v-model.number="closeForm.solde_fermeture_reel" type="number" min="0" step="0.01" class="input" placeholder="Solde reel" />
          <textarea v-model="closeForm.notes_fermeture" class="input" rows="1" placeholder="Note de fermeture (optionnel)"></textarea>
          <button class="btn-danger" :disabled="saving">Fermer la caisse</button>
        </form>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth'
import { ouvrirPDF } from '@/services/pdf'
import { telechargerCSV } from '@/services/exports'

const toast = useToast()
const auth = useAuthStore()
const loading = ref(false)
const saving = ref(false)
const exportLoading = ref(false)
const session = ref(null)
const mouvements = ref([])
const sessionsOuvertes = ref([])
const sessionAdminSelection = ref(null)
const mouvementsAdmin = ref([])
const mouvementsAdminLoading = ref(false)
const journalAdmin = ref([])
const produits = ref([])
const panier = ref([])
const productSearch = ref('')
const stats = reactive({ sessions_ouvertes: 0, entrees_jour: 0, sorties_jour: 0, solde_net_jour: 0 })

const openForm = reactive({ solde_ouverture: 0, notes_ouverture: '' })
const closeForm = reactive({ solde_fermeture_reel: 0, notes_fermeture: '' })
const movementForm = reactive({
  sens: 'entree',
  type: 'vente',
  libelle: '',
  montant: null,
  mode_paiement: 'especes',
  reference: '',
  description: '',
})
const posForm = reactive({ client_nom: '', mode_paiement: 'especes', reference_paiement: '', document_type: 'ticket' })
let encaissementSequence = 0
const creerEncaissement = (montant = 0, mode = 'especes') => ({
  id: ++encaissementSequence,
  mode_paiement: mode,
  montant: Number(montant || 0),
  montant_recu: Number(montant || 0),
  reference_paiement: '',
})
const encaissements = ref([creerEncaissement()])
const isAdmin = computed(() => ['admin', 'gerant'].includes(auth.user?.role))
const isTouchPos = computed(() => auth.user?.role === 'caissier')
const sessionsActivesCount = computed(() => sessionsOuvertes.value.filter(s => s.statut === 'ouverte').length)
const modesPaiementTactiles = [
  { value: 'especes', label: 'Especes' },
  { value: 'wave', label: 'Wave' },
  { value: 'orange_money', label: 'Orange Money' },
  { value: 'carte_bancaire', label: 'Carte' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'autre', label: 'Autre' },
]

const ecartPrevu = computed(() => {
  return Number(closeForm.solde_fermeture_reel || 0) - Number(session.value.solde_fermeture_theorique || 0)
})

const totauxPanier = computed(() => {
  return panier.value.reduce((acc, ligne) => {
    const quantite = Number(ligne.quantite || 0)
    const ht = quantite * Number(ligne.prix_ht || 0)
    const htRemise = ht * (1 - Number(ligne.remise_pourcent || 0) / 100)
    const tva = htRemise * Number(ligne.taux_tva || 0) / 100
    acc.ht += htRemise
    acc.tva += tva
    acc.ttc += htRemise + tva
    return acc
  }, { ht: 0, tva: 0, ttc: 0 })
})

const totalEncaissements = computed(() => {
  return encaissements.value.reduce((total, item) => total + Number(item.montant || 0), 0)
})

const isPaiementFractionne = computed(() => encaissements.value.length > 1)

const ecartEncaissement = computed(() => {
  return Number(totauxPanier.value.ttc || 0) - totalEncaissements.value
})

const resteAEncaisser = computed(() => {
  return Math.max(ecartEncaissement.value, 0)
})

const excedentEncaissement = computed(() => {
  return Math.max(-ecartEncaissement.value, 0)
})

const monnaieARendre = computed(() => {
  return encaissements.value.reduce((total, item) => {
    if (item.mode_paiement !== 'especes') return total
    return total + Math.max(Number(item.montant_recu || 0) - Number(item.montant || 0), 0)
  }, 0)
})

watch(() => totauxPanier.value.ttc, (nouveauTotal, ancienTotal) => {
  if (encaissements.value.length !== 1) return
  const item = encaissements.value[0]
  if (Number(item.montant || 0) === Number(ancienTotal || 0) || Number(item.montant || 0) === 0) {
    item.montant = Number(nouveauTotal || 0)
    if (item.mode_paiement === 'especes') item.montant_recu = Number(nouveauTotal || 0)
  }
})

async function loadCaisse() {
  loading.value = true
  try {
    const { data } = await api.get('/caisse/active')
    session.value = data.session
    Object.assign(stats, data.stats || {})
    if (session.value) {
      closeForm.solde_fermeture_reel = Number(session.value.solde_fermeture_theorique || 0)
    } else {
      closeForm.solde_fermeture_reel = 0
    }
  } catch (e) {
    toast.error('Erreur de chargement de la caisse')
  } finally {
    loading.value = false
  }

  if (isAdmin.value) {
    loadVueAdmin().catch(() => toast.error('Erreur de chargement de la vue administrateur caisse'))
  }

  if (session.value) {
    loadMouvements().catch(() => toast.error('Erreur de chargement des mouvements de caisse'))
    loadProduits().catch(() => toast.error('Erreur de chargement des produits caisse'))
  }
}

async function loadVueAdmin() {
  const { data } = await api.get('/caisse/sessions', {
    params: { per_page: 100 },
  })
  sessionsOuvertes.value = data.data || []
  await loadJournalAdmin()

  if (!sessionAdminSelection.value && sessionsOuvertes.value.length > 0) {
    selectionnerSessionAdmin(sessionsOuvertes.value[0]).catch(() => toast.error('Erreur de chargement des mouvements de caisse'))
    return
  }

  if (sessionAdminSelection.value) {
    const fresh = sessionsOuvertes.value.find(s => s.id === sessionAdminSelection.value.id)
    if (fresh) {
      sessionAdminSelection.value = fresh
      loadMouvementsAdmin(fresh.id).catch(() => toast.error('Erreur de chargement des mouvements de caisse'))
    } else {
      sessionAdminSelection.value = null
      mouvementsAdmin.value = []
    }
  }
}

async function loadJournalAdmin() {
  const { data } = await api.get('/caisse/journal', {
    params: { per_page: 40 },
  })
  journalAdmin.value = data.data || []
}

async function exporterSessionsCSV() {
  exportLoading.value = true
  try {
    await telechargerCSV('/exports/caisse-sessions', {}, 'sessions_caisse.csv')
    toast.success('Export des sessions de caisse téléchargé.')
  } catch (e) {
    toast.error('Export impossible pour le moment.')
  } finally {
    exportLoading.value = false
  }
}

async function exporterMouvementsCSV(sessionId = null) {
  exportLoading.value = true
  try {
    await telechargerCSV('/exports/caisse-mouvements', {
      session_id: sessionId || undefined,
    }, 'journal_caisse.csv')
    toast.success('Export du journal de caisse téléchargé.')
  } catch (e) {
    toast.error('Export impossible pour le moment.')
  } finally {
    exportLoading.value = false
  }
}

async function selectionnerSessionAdmin(caisseSession) {
  sessionAdminSelection.value = caisseSession
  await loadMouvementsAdmin(caisseSession.id)
}

async function loadMouvementsAdmin(sessionId) {
  mouvementsAdminLoading.value = true
  try {
    const { data } = await api.get(`/caisse/sessions/${sessionId}/mouvements`, {
      params: { per_page: 100 },
    })
    mouvementsAdmin.value = data.data || []
  } finally {
    mouvementsAdminLoading.value = false
  }
}

let productTimer = null
watch(productSearch, () => {
  clearTimeout(productTimer)
  productTimer = setTimeout(loadProduits, 250)
})

async function loadProduits() {
  const { data } = await api.get('/caisse/produits', {
    params: { search: productSearch.value || undefined },
  })
  produits.value = data
}

function prixTtc(produit) {
  return Number(produit.prix_vente_ht || 0) * (1 + Number(produit.taux_tva || 0) / 100)
}

function stockDisponible(produit) {
  return Number(produit.stock_disponible || 0)
}

function ajouterPremierProduit() {
  if (produits.value.length > 0) ajouterAuPanier(produits.value[0])
}

function ajouterAuPanier(produit) {
  if (produit.gere_stock && stockDisponible(produit) <= 0) {
    toast.error('Stock insuffisant pour ce produit')
    return
  }

  const existante = panier.value.find(l => l.produit_id === produit.id)
  if (existante) {
    if (produit.gere_stock && existante.quantite + 1 > stockDisponible(produit)) {
      toast.error('Quantite superieure au stock disponible')
      return
    }
    existante.quantite += 1
    return
  }

  panier.value.push({
    produit_id: produit.id,
    reference: produit.reference,
    libelle: produit.libelle,
    quantite: 1,
    prix_ht: Number(produit.prix_vente_ht || 0),
    prix_ttc: prixTtc(produit),
    taux_tva: Number(produit.taux_tva || 0),
    remise_pourcent: 0,
  })
}

function incrementerLigne(ligne) {
  ligne.quantite = Number(ligne.quantite || 0) + 1
}

function decrementerLigne(ligne) {
  const prochaineQuantite = Number(ligne.quantite || 0) - 1
  if (prochaineQuantite <= 0) {
    retirerDuPanier(ligne.produit_id)
    return
  }
  ligne.quantite = prochaineQuantite
}

function retirerDuPanier(produitId) {
  panier.value = panier.value.filter(l => l.produit_id !== produitId)
}

function viderPanier() {
  panier.value = []
}

function ajouterEncaissement() {
  const reste = Math.max(Number(totauxPanier.value.ttc || 0) - totalEncaissements.value, 0)
  encaissements.value.push(creerEncaissement(reste, 'wave'))
}

function retirerEncaissement(index) {
  encaissements.value.splice(index, 1)
  if (encaissements.value.length === 0) {
    encaissements.value.push(creerEncaissement(totauxPanier.value.ttc))
  }
}

function completerEncaissement(index) {
  const item = encaissements.value[index]
  const autresPaiements = encaissements.value.reduce((total, paiement, paiementIndex) => {
    return paiementIndex === index ? total : total + Number(paiement.montant || 0)
  }, 0)
  const solde = Math.max(Number(totauxPanier.value.ttc || 0) - autresPaiements, 0)
  item.montant = solde
  if (item.mode_paiement === 'especes' && Number(item.montant_recu || 0) < solde) {
    item.montant_recu = solde
  }
}

function reinitialiserEncaissements() {
  encaissements.value = [creerEncaissement(totauxPanier.value.ttc)]
}

function totalLigne(ligne) {
  const ht = Number(ligne.quantite || 0) * Number(ligne.prix_ht || 0)
  const htRemise = ht * (1 - Number(ligne.remise_pourcent || 0) / 100)
  return htRemise * (1 + Number(ligne.taux_tva || 0) / 100)
}

async function encaisserVente() {
  if (posForm.document_type === 'facture' && !posForm.client_nom.trim()) {
    toast.error('Renseignez le nom du client pour generer une facture')
    return
  }

  if (Math.abs(Number(totauxPanier.value.ttc || 0) - totalEncaissements.value) > 0.01) {
    toast.error('Répartissez exactement le total du ticket entre les moyens de paiement.')
    return
  }

  saving.value = true
  try {
    const premierPaiement = encaissements.value[0]
    const { data } = await api.post('/caisse/vente', {
      client_nom: posForm.client_nom || undefined,
      mode_paiement: premierPaiement.mode_paiement,
      reference_paiement: premierPaiement.reference_paiement || undefined,
      paiements: encaissements.value.map(item => ({
        mode_paiement: item.mode_paiement,
        montant: Number(item.montant || 0),
        montant_recu: item.mode_paiement === 'especes' ? Number(item.montant_recu || item.montant || 0) : Number(item.montant || 0),
        reference_paiement: item.reference_paiement || undefined,
      })),
      lignes: panier.value.map(l => ({
        produit_id: l.produit_id,
        quantite: l.quantite,
        remise_pourcent: l.remise_pourcent || 0,
      })),
    })
    toast.success(`Vente ${data.ticket.numero} encaissee`)
    if (posForm.document_type === 'facture') {
      if (data.facture?.id) {
        await ouvrirPDF(`/caisse/factures/${data.facture.id}/pdf`, `${data.facture.numero}.pdf`)
      }
    } else {
      imprimerTicket(data)
    }
    viderPanier()
    Object.assign(posForm, { client_nom: '', mode_paiement: 'especes', reference_paiement: '', document_type: 'ticket' })
    reinitialiserEncaissements()
    await loadCaisse()
  } catch (e) {
    toast.error(e.response.data.errors.stock?.[0] || e.response.data.errors.caisse?.[0] || e.response.data.message || 'Vente impossible')
  } finally {
    saving.value = false
  }
}

function imprimerTicket(data) {
  const lignes = data.facture?.lignes || []
  const paiements = data.ticket.paiements || []
  const html = `
    <html>
      <head>
        <title>Ticket ${data.ticket.numero}</title>
        <style>
          body { font-family: Arial, sans-serif; width: 280px; margin: 0 auto; color: #111; }
          h1 { font-size: 16px; text-align: center; margin: 12px 0 4px; }
          .center { text-align: center; }
          .line { border-top: 1px dashed #999; margin: 8px 0; }
          .row { display: flex; justify-content: space-between; gap: 8px; font-size: 12px; margin: 4px 0; }
          .total { font-weight: 700; font-size: 14px; }
          small { color: #444; }
        </style>
      </head>
      <body>
        <h1>Saytu Liggeey 2.0</h1>
        <div class="center"><small>Ticket ${data.ticket.numero}</small></div>
        <div class="center"><small>${data.ticket.date} - ${data.ticket.caissier}</small></div>
        <div class="line"></div>
        ${lignes.map(l => `
          <div class="row">
            <span>${l.designation} x ${Number(l.quantite)}</span>
            <strong>${formatPrice(l.total_ttc)}</strong>
          </div>
        `).join('')}
        <div class="line"></div>
        <div class="row total"><span>Total</span><strong>${formatPrice(data.ticket.total_ttc)}</strong></div>
        ${paiements.length ?
           paiements.map(p => `<div class="row"><span>${modePaiementLabel(p.mode_paiement)}</span><strong>${formatPrice(p.montant)}</strong></div>`).join('')
          : `<div class="row"><span>Paiement</span><strong>${modePaiementLabel(data.ticket.mode_paiement)}</strong></div>`
        }
        ${Number(data.ticket.monnaie_rendue || 0) > 0 ? `
          <div class="row"><span>Reçu</span><strong>${formatPrice(data.ticket.total_recu)}</strong></div>
          <div class="row total"><span>Monnaie rendue</span><strong>${formatPrice(data.ticket.monnaie_rendue)}</strong></div>
        ` : ''}
        <div class="line"></div>
        <p class="center">Merci pour votre achat</p>
      </body>
    </html>
  `
  const win = window.open('', '_blank', 'width=360,height=640')
  if (!win) return
  win.document.write(html)
  win.document.close()
  win.focus()
  win.print()
}

function modePaiementLabel(mode) {
  return {
    especes: 'Espèces',
    wave: 'Wave',
    orange_money: 'Orange Money',
    carte_bancaire: 'Carte bancaire',
    cheque: 'Chèque',
    virement: 'Virement',
    mobile_money: 'Mobile Money',
    compensation: 'Compensation',
    autre: 'Autre',
  }[mode] || mode
}

async function reimprimerTicket(mouvement) {
  if (!mouvement.facture?.id) {
    toast.error('Ticket introuvable pour ce mouvement')
    return
  }

  try {
    const { data } = await api.get(`/caisse/factures/${mouvement.facture?.id}/ticket`)
    imprimerTicket(data)
  } catch (e) {
    toast.error(e.response.data.message || 'Réimpression impossible')
  }
}

async function loadMouvements() {
  if (!session.value) return
  const { data } = await api.get(`/caisse/sessions/${session.value.id}/mouvements`, { params: { per_page: 50 } })
  mouvements.value = data.data || []
}

async function ouvrirCaisse() {
  saving.value = true
  try {
    await api.post('/caisse/ouvrir', openForm)
    toast.success('Caisse ouverte')
    openForm.solde_ouverture = 0
    openForm.notes_ouverture = ''
    await loadCaisse()
  } catch (e) {
    toast.error(e.response.data.message || e.response.data.errors.caisse?.[0] || 'Ouverture impossible')
  } finally {
    saving.value = false
  }
}

async function ajouterMouvement() {
  saving.value = true
  try {
    await api.post('/caisse/mouvements', movementForm)
    toast.success('Mouvement ajoute')
    Object.assign(movementForm, { sens: 'entree', type: 'vente', libelle: '', montant: null, mode_paiement: 'especes', reference: '', description: '' })
    await loadCaisse()
  } catch (e) {
    toast.error(e.response.data.message || e.response.data.errors.caisse?.[0] || 'Enregistrement impossible')
  } finally {
    saving.value = false
  }
}

async function fermerCaisse() {
  saving.value = true
  try {
    await api.post(`/caisse/sessions/${session.value.id}/fermer`, closeForm)
    toast.success('Caisse fermee')
    session.value = null
    mouvements.value = []
    closeForm.solde_fermeture_reel = 0
    closeForm.notes_fermeture = ''
    await loadCaisse()
  } catch (e) {
    toast.error(e.response.data.message || e.response.data.errors.caisse?.[0] || 'Fermeture impossible')
  } finally {
    saving.value = false
  }
}

function formatPrice(n) {
  return new Intl.NumberFormat('fr-FR').format(Math.round(Number(n || 0))) + ' XOF'
}

function formatDateTime(value) {
  return value ? new Date(value).toLocaleString('fr-FR') : '-'
}

function formatTime(value) {
  return value ? new Date(value).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '-'
}

function typeLabel(type) {
  return {
    vente: 'Vente',
    encaissement: 'Encaissement',
    depense: 'Depense',
    retrait: 'Retrait',
    depot: 'Depot',
    correction: 'Correction',
    remboursement: 'Remboursement',
    autre: 'Autre',
  }[type] || type
}

function produitsMouvement(mouvement) {
  const lignes = mouvement.facture?.lignes || []
  if (!lignes.length) return ''
  return lignes
    .slice(0, 3)
    .map(l => `${l.designation} x ${Number(l.quantite)}`)
    .join(', ') + (lignes.length > 3 ? '...' : '')
}

onMounted(loadCaisse)
</script>

<style scoped>
.touch-pos-surface {
  touch-action: manipulation;
}

.touch-step-btn {
  min-height: 48px;
  border-radius: 10px;
  border: 1px solid rgb(203 213 225);
  background: white;
  font-size: 24px;
  font-weight: 800;
  line-height: 1;
  color: rgb(15 23 42);
}

.touch-step-btn:active {
  transform: scale(0.97);
}

.touch-pay-btn {
  min-height: 54px;
  border-radius: 12px;
  border: 2px solid rgb(203 213 225);
  background: white;
  padding: 10px 12px;
  font-weight: 700;
  color: rgb(51 65 85);
}

.touch-pay-btn-active {
  border-color: rgb(8 145 178);
  background: rgb(236 254 255);
  color: rgb(14 116 144);
}
</style>
