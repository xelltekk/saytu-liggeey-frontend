<template>
  <div class="caisse-page space-y-4">
    <div class="caisse-summary">
      <div class="min-w-0">
        <p class="text-xs font-black uppercase tracking-[0.18em] text-[color:var(--saytu-primary,#2563eb)]">Caisse</p>
        <h2 class="truncate text-lg font-black text-[color:var(--saytu-shell-text,#0f172a)]">Vue rapide du jour</h2>
      </div>
      <div class="caisse-summary-items">
        <div v-for="item in summaryItems" :key="item.key" class="caisse-summary-chip">
          <span>{{ item.label }}</span>
          <strong :class="item.class">{{ item.value }}</strong>
        </div>
      </div>
    </div>

    <div v-if="loading" class="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
      Chargement...
    </div>

    <div v-else-if="isAdmin && !session" class="space-y-5">
      <section class="caisse-tabs-wrap">
        <div class="caisse-tabs">
          <button
            type="button"
            class="caisse-tab"
            :class="activeCaisseTab !== 'factures-comptoir' ? 'caisse-tab-active' : 'caisse-tab-idle'"
            @click="activeCaisseTab = 'vente'"
          >
            <span>Suivi caisse</span>
            <small v-if="sessionsOuvertes.length">{{ sessionsOuvertes.length }}</small>
          </button>
          <button
            type="button"
            class="caisse-tab"
            :class="activeCaisseTab === 'factures-comptoir' ? 'caisse-tab-active' : 'caisse-tab-idle'"
            @click="activeCaisseTab = 'factures-comptoir'"
          >
            <span>Factures comptoir</span>
            <small v-if="facturesComptoirTotal">{{ facturesComptoirTotal }}</small>
          </button>
        </div>
      </section>

      <div v-show="activeCaisseTab !== 'factures-comptoir'" class="grid grid-cols-1 gap-5 xl:grid-cols-[420px_1fr]">
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
    </div>

    <div v-else-if="!session" class="rounded-2xl border border-[color:var(--saytu-border,#e2e8f0)] bg-[color:var(--saytu-surface,#ffffff)] p-4">
      <div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 class="text-lg font-black text-[color:var(--saytu-shell-text,#0f172a)]">Ouvrir une caisse</h3>
          <p class="text-sm text-[color:var(--saytu-topbar-subtitle,#64748b)]">Fond initial, note courte, puis vente directe.</p>
        </div>
        <button type="button" class="btn-secondary rounded-full px-4 py-2 text-sm" @click="loadCaisse">Actualiser</button>
      </div>

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
      <section class="caisse-session-bar">
        <div class="min-w-0">
          <div class="flex flex-wrap items-center gap-2">
            <span class="caisse-live-dot"></span>
            <span class="text-sm font-black text-[color:var(--saytu-shell-text,#0f172a)]">Session ouverte</span>
            <span class="rounded-full bg-[color:var(--saytu-soft,#eff6ff)] px-2.5 py-1 font-mono text-xs font-bold text-[color:var(--saytu-primary,#2563eb)]">{{ session.reference }}</span>
          </div>
          <p class="mt-1 truncate text-xs text-[color:var(--saytu-topbar-subtitle,#64748b)]">
            Ouverte {{ formatDateTime(session.opened_at) }} · Fond initial {{ formatPrice(session.solde_ouverture) }} · Solde théorique {{ formatPrice(session.solde_fermeture_theorique) }}
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <button type="button" class="btn-secondary rounded-full px-4 py-2 text-sm" @click="loadCaisse">Actualiser</button>
          <button type="button" class="btn-primary rounded-full px-4 py-2 text-sm" @click="activeCaisseTab = 'cloture'">Clôturer</button>
        </div>
      </section>

      <section class="caisse-tabs-wrap">
        <div class="caisse-tabs">
          <button
            v-for="tab in caisseTabs"
            :key="tab.key"
            type="button"
            class="caisse-tab"
            :class="activeCaisseTab === tab.key ? 'caisse-tab-active' : 'caisse-tab-idle'"
            @click="activeCaisseTab = tab.key"
          >
            <span>{{ tab.label }}</span>
            <small v-if="tab.badge">{{ tab.badge }}</small>
          </button>
        </div>
      </section>

      <section v-show="activeCaisseTab === 'vente'" class="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_340px] 2xl:grid-cols-[minmax(0,1fr)_380px]">
        <div class="space-y-4">
          <div>
            <div class="relative">
              <span class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">&#9906;</span>
              <input
                v-model="productSearch"
                type="search"
                class="input min-h-12 rounded-full border-slate-200 bg-white pl-10 shadow-sm"
                placeholder="Rechercher ou scanner un code-barres..."
                @keydown.enter.prevent="ajouterPremierProduit"
              />
            </div>
            <p class="mt-2 text-xs text-slate-500">Lecteur 2D compatible : scannez le code-barres ou la r&eacute;f&eacute;rence SKU pour ajouter directement au panier.</p>
          </div>

          <div class="max-h-[62vh] overflow-y-auto pr-1">
            <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              <button
                v-for="p in produits"
                :key="p.id"
                type="button"
                class="group overflow-hidden rounded-2xl border border-[color:var(--saytu-border,#e2e8f0)] bg-[color:var(--saytu-surface,#ffffff)] p-2.5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[color:var(--saytu-primary,#2563eb)] hover:shadow-lg active:scale-[0.99]"
                @click="ajouterAuPanier(p)"
              >
                <div class="flex h-28 items-center justify-center overflow-hidden rounded-xl bg-[color:var(--saytu-soft,#f8fafc)] ring-1 ring-[color:var(--saytu-border,#e2e8f0)] sm:h-32">
                  <img v-if="imageProduit(p)" :src="imageProduit(p)" :alt="p.libelle" class="h-full w-full object-contain p-2 transition duration-200 group-hover:scale-105" />
                  <div v-else class="flex h-full w-full items-center justify-center text-3xl text-slate-300">&#9633;</div>
                </div>
                <div class="mt-2 min-h-[72px]">
                  <h3 class="line-clamp-2 text-sm font-black uppercase tracking-tight text-slate-950">{{ p.libelle }}</h3>
                  <p class="mt-1 font-mono text-sm font-black text-violet-600">{{ formatPrice(prixTtc(p)) }}</p>
                  <div class="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span>Reste : {{ p.gere_stock ? stockDisponible(p) : '-' }}</span>
                    <span v-if="p.reference" class="font-mono">{{ p.reference }}</span>
                  </div>
                </div>
              </button>
            </div>

            <div v-if="produits.length === 0" class="rounded-[1.5rem] border border-dashed border-slate-200 bg-white px-4 py-12 text-center text-sm text-slate-400">
              Aucun produit trouv&eacute;
            </div>
          </div>
        </div>

        <aside class="xl:sticky xl:top-3 xl:self-start">
          <div class="rounded-2xl border border-[color:var(--saytu-border,#e2e8f0)] bg-[color:var(--saytu-surface,#ffffff)] p-3 shadow-lg shadow-slate-200/50">
            <div class="flex items-center justify-between">
              <h3 class="text-base font-black text-slate-950">Panier</h3>
              <span class="rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700">{{ panier.length }} article(s)</span>
            </div>

            <div class="mt-3 space-y-2">
              <input v-model="posForm.client_nom" class="input rounded-full" :placeholder="posForm.document_type === 'facture' ? 'Nom du client obligatoire' : 'Nom du client (optionnel)'" />
              <input
                v-if="encaissements.length === 1 && encaissements[0].mode_paiement !== 'especes'"
                v-model="encaissements[0].reference_paiement"
                class="input rounded-full"
                placeholder="R&eacute;f&eacute;rence paiement (optionnel)"
              />
              <input
                v-if="encaissements.length === 1 && encaissements[0].mode_paiement === 'especes'"
                v-model.number="encaissements[0].montant_recu"
                type="number"
                min="0"
                step="0.01"
                class="input rounded-full"
                placeholder="Esp&egrave;ces re&ccedil;ues"
              />
            </div>

            <div class="mt-4 flex items-center justify-between text-xs uppercase tracking-wide text-slate-500">
              <span>Mode pr&eacute;f&eacute;r&eacute;</span>
              <span>{{ modePaiementLabel(encaissements[0]?.mode_paiement || 'especes') }}</span>
            </div>
            <div v-if="encaissements.length === 1" class="mt-2 grid grid-cols-2 gap-2">
              <button
                v-for="mode in modesPaiementTactiles.slice(0, 4)"
                :key="mode.value"
                type="button"
                class="touch-pay-btn rounded-full"
                :class="encaissements[0].mode_paiement === mode.value ? 'touch-pay-btn-active' : ''"
                @click="encaissements[0].mode_paiement = mode.value"
              >
                {{ mode.label }}
              </button>
            </div>

            <div class="mt-4 max-h-[30vh] space-y-2 overflow-y-auto pr-1">
              <div v-for="ligne in panier" :key="ligne.produit_id" class="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <p class="truncate text-sm font-bold text-slate-900">{{ ligne.libelle }}</p>
                    <p class="font-mono text-xs text-slate-500">{{ formatPrice(ligne.prix_ttc) }}</p>
                  </div>
                  <button class="rounded-full px-2 py-1 text-xs font-bold text-red-500 hover:bg-red-50" @click="retirerDuPanier(ligne.produit_id)">&times;</button>
                </div>
                <div class="mt-3 grid grid-cols-[38px_1fr_38px_auto] items-center gap-2">
                  <button type="button" class="touch-step-btn h-9 w-9" @click="decrementerLigne(ligne)">-</button>
                  <input v-model.number="ligne.quantite" type="number" min="0.001" step="1" class="input h-9 rounded-full text-center text-sm" />
                  <button type="button" class="touch-step-btn h-9 w-9" @click="incrementerLigne(ligne)">+</button>
                  <strong class="whitespace-nowrap font-mono text-sm text-slate-900">{{ formatPrice(totalLigne(ligne)) }}</strong>
                </div>
              </div>

              <div v-if="panier.length === 0" class="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-12 text-center text-sm text-slate-400">
                <div class="text-4xl">&#128722;</div>
                <p class="mt-2">S&eacute;lectionnez des produits</p>
              </div>
            </div>

            <div class="mt-4 border-t border-slate-100 pt-3">
              <label class="text-xs font-semibold uppercase tracking-wide text-slate-500">Remise %</label>
              <input v-if="panier.length" v-model.number="panier[0].remise_pourcent" type="number" min="0" max="100" step="0.01" class="input mt-1 rounded-full" placeholder="Remise globale" @input="appliquerRemiseGlobale" />
              <div class="mt-2 rounded-2xl bg-slate-50 p-3 text-sm">
                <div class="flex justify-between text-slate-500"><span>Sous-total HT</span><strong>{{ formatPrice(totauxPanier.ht) }}</strong></div>
                <div class="mt-1 flex justify-between text-slate-500"><span>TVA</span><strong>{{ formatPrice(totauxPanier.tva) }}</strong></div>
                <div class="mt-3 flex justify-between text-lg font-black text-slate-950"><span>Total</span><strong class="text-violet-600">{{ formatPrice(totauxPanier.ttc) }}</strong></div>
              </div>
            </div>

            <div class="mt-4 grid grid-cols-2 gap-2">
              <button type="button" class="touch-pay-btn rounded-full" :class="posForm.document_type === 'ticket' ? 'touch-pay-btn-active' : ''" @click="posForm.document_type = 'ticket'">Ticket</button>
              <button type="button" class="touch-pay-btn rounded-full" :class="posForm.document_type === 'facture' ? 'touch-pay-btn-active' : ''" @click="posForm.document_type = 'facture'">Facture</button>
            </div>

            <details class="mt-3 rounded-2xl border border-slate-100 bg-white p-3">
              <summary class="cursor-pointer text-sm font-bold text-slate-700">Paiement fractionn&eacute;</summary>
              <div class="mt-3 space-y-2">
                <button type="button" class="btn-secondary w-full rounded-full px-3 py-2 text-xs" @click="ajouterEncaissement">
                  {{ isPaiementFractionne ? '+ Moyen de paiement' : '+ Fractionner' }}
                </button>
                <div v-for="(encaissement, index) in encaissements" v-if="isPaiementFractionne" :key="encaissement.id" class="space-y-2 rounded-xl border border-slate-200 p-2">
                  <div class="grid grid-cols-[1fr_auto] gap-2">
                    <select v-model="encaissement.mode_paiement" class="input rounded-full">
                      <option value="especes">Esp&egrave;ces</option>
                      <option value="wave">Wave</option>
                      <option value="orange_money">Orange Money</option>
                      <option value="carte_bancaire">Carte bancaire</option>
                      <option value="cheque">Ch&egrave;que</option>
                      <option value="virement">Virement</option>
                      <option value="autre">Autre</option>
                    </select>
                    <button v-if="encaissements.length > 1" type="button" class="px-2 text-red-600" title="Supprimer ce paiement" @click="retirerEncaissement(index)">&times;</button>
                  </div>
                  <div class="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto]">
                    <input v-model.number="encaissement.montant" type="number" min="0.01" step="0.01" class="input rounded-full" placeholder="Montant pay&eacute;" />
                    <button type="button" class="btn-secondary rounded-full px-3 text-xs" @click="completerEncaissement(index)">Solde</button>
                  </div>
                  <input v-if="encaissement.mode_paiement !== 'especes'" v-model="encaissement.reference_paiement" class="input rounded-full" placeholder="R&eacute;f&eacute;rence paiement" />
                </div>
              </div>
            </details>

            <div class="mt-3 space-y-1 text-sm">
              <div class="flex justify-between"><span>Pay&eacute;</span><strong>{{ formatPrice(totalEncaissements) }}</strong></div>
              <div class="flex justify-between" :class="resteAEncaisser > 0.01 ? 'text-red-700' : 'text-green-700'"><span>Reste &agrave; encaisser</span><strong>{{ formatPrice(resteAEncaisser) }}</strong></div>
              <div v-if="excedentEncaissement > 0.01" class="flex justify-between font-bold text-red-700"><span>Montant en trop</span><strong>{{ formatPrice(excedentEncaissement) }}</strong></div>
              <div v-if="monnaieARendre > 0" class="flex justify-between text-blue-700"><span>Monnaie &agrave; rendre</span><strong>{{ formatPrice(monnaieARendre) }}</strong></div>
            </div>

            <button class="mt-4 w-full rounded-2xl bg-violet-600 px-5 py-3 text-base font-black text-white shadow-xl shadow-violet-200 transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-violet-300" :disabled="saving || panier.length === 0 || Math.abs(ecartEncaissement) > 0.01" @click="encaisserVente">
              <span v-if="saving">Encaissement...</span>
              <span v-else>Encaisser</span>
            </button>
            <button type="button" class="mt-2 w-full rounded-full px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-50" :disabled="panier.length === 0" @click="viderPanier">Vider le panier</button>
          </div>
        </aside>
      </section>

      <section v-show="activeCaisseTab === 'mouvements'" class="rounded-2xl border border-[color:var(--saytu-border,#e2e8f0)] bg-[color:var(--saytu-surface,#ffffff)] p-4">
        <div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 class="text-lg font-black text-[color:var(--saytu-shell-text,#0f172a)]">Mouvement manuel</h3>
            <p class="text-sm text-[color:var(--saytu-topbar-subtitle,#64748b)]">Entrée, sortie, correction ou retrait avec motif obligatoire.</p>
          </div>
          <button type="button" class="btn-secondary rounded-full px-4 py-2 text-sm" @click="loadCaisse">Actualiser</button>
        </div>
        <form class="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2" @submit.prevent="ajouterMouvement">
          <select v-model="movementForm.sens" class="input">
            <option value="entree">Entr&eacute;e</option>
            <option value="sortie">Sortie</option>
          </select>
          <select v-model="movementForm.type" class="input">
            <option value="vente">Vente boutique</option>
            <option value="encaissement">Encaissement facture</option>
            <option value="depense">D&eacute;pense</option>
            <option value="retrait">Retrait caisse</option>
            <option value="depot">D&eacute;p&ocirc;t caisse</option>
            <option value="correction">Correction</option>
            <option value="remboursement">Remboursement</option>
            <option value="autre">Autre</option>
          </select>
          <input v-model="movementForm.libelle" class="input md:col-span-2" placeholder="Libell&eacute;" />
          <input v-model.number="movementForm.montant" type="number" min="0.01" step="0.01" class="input" placeholder="Montant" />
          <select v-model="movementForm.mode_paiement" class="input">
            <option value="especes">Esp&egrave;ces</option>
            <option value="wave">Wave</option>
            <option value="orange_money">Orange Money</option>
            <option value="carte_bancaire">Carte bancaire</option>
            <option value="cheque">Ch&egrave;que</option>
            <option value="virement">Virement</option>
            <option value="autre">Autre</option>
          </select>
          <input v-model="movementForm.reference" class="input md:col-span-2" placeholder="R&eacute;f&eacute;rence ticket, facture ou transaction" />
          <textarea v-model="movementForm.description" class="input md:col-span-2" rows="2" placeholder="Description (optionnel)"></textarea>
          <div class="md:col-span-2 flex justify-end">
            <button class="btn-primary" :disabled="saving">
              <span v-if="saving">Enregistrement...</span>
              <span v-else>Ajouter le mouvement</span>
            </button>
          </div>
        </form>
      </section>

      <section v-show="activeCaisseTab === 'historique'" id="historique-caisse" class="overflow-hidden rounded-2xl border border-[color:var(--saytu-border,#e2e8f0)] bg-[color:var(--saytu-surface,#ffffff)]">
        <div class="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div>
            <h3 class="font-black text-[color:var(--saytu-shell-text,#0f172a)]">Historique et réimpression</h3>
            <p class="text-xs text-[color:var(--saytu-topbar-subtitle,#64748b)]">{{ mouvements.length }} mouvement(s) sur cette session.</p>
          </div>
          <div class="flex gap-2">
            <button class="btn-secondary px-3 py-1.5 text-sm" :disabled="exportLoading" @click="exporterMouvementsCSV(session.id)">
              {{ exportLoading ? 'Export...' : 'Exporter' }}
            </button>
            <button type="button" class="btn-secondary px-3 py-1.5 text-sm" @click="loadMouvements">Actualiser</button>
          </div>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th class="px-4 py-3 text-left">Heure</th>
                <th class="px-4 py-3 text-left">Libell&eacute;</th>
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
                    R&eacute;imprimer
                  </button>
                </td>
              </tr>
              <tr v-if="mouvements.length === 0">
                <td colspan="5" class="px-4 py-10 text-center text-sm text-slate-400">Aucun mouvement pour cette caisse</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section v-show="activeCaisseTab === 'cloture'" id="fermeture-caisse" class="rounded-2xl border border-[color:var(--saytu-border,#e2e8f0)] bg-[color:var(--saytu-surface,#ffffff)] p-4">
        <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h3 class="text-lg font-bold text-slate-900">Fermer la caisse</h3>
            <p class="mt-1 text-sm text-slate-500">Saisissez le montant r&eacute;el compt&eacute; dans la caisse.</p>
          </div>
          <div class="rounded-lg bg-slate-50 p-3 text-sm lg:min-w-72">
            <div class="flex justify-between">
              <span class="text-slate-500">Th&eacute;orique</span>
              <strong>{{ formatPrice(session.solde_fermeture_theorique) }}</strong>
            </div>
            <div class="mt-2 flex justify-between">
              <span class="text-slate-500">&Eacute;cart pr&eacute;vu</span>
              <strong :class="ecartPrevu === 0 ? 'text-slate-700' : ecartPrevu > 0 ? 'text-emerald-700' : 'text-red-700'">
                {{ formatPrice(ecartPrevu) }}
              </strong>
            </div>
          </div>
        </div>
        <form class="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-[220px_1fr_auto]" @submit.prevent="fermerCaisse">
          <input v-model.number="closeForm.solde_fermeture_reel" type="number" min="0" step="0.01" class="input" placeholder="Solde r&eacute;el" />
          <textarea v-model="closeForm.notes_fermeture" class="input" rows="1" placeholder="Note de fermeture (optionnel)"></textarea>
          <button class="btn-danger" :disabled="saving">Fermer la caisse</button>
        </form>
      </section>
    </div>

    <section
      v-if="showFacturesComptoirPanel"
      class="overflow-hidden rounded-2xl border border-[color:var(--saytu-border,#e2e8f0)] bg-[color:var(--saytu-surface,#ffffff)] shadow-sm"
    >
      <div class="flex flex-col gap-3 border-b border-[color:var(--saytu-border,#e2e8f0)] px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 class="font-black text-[color:var(--saytu-shell-text,#0f172a)]">Factures comptoir</h3>
          <p class="text-xs text-[color:var(--saytu-topbar-subtitle,#64748b)]">
            Ventes encaissées depuis la caisse, séparées de la facturation classique.
          </p>
        </div>
        <div class="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(220px,1fr)_auto_auto_auto]">
          <input
            v-model="facturesComptoirFilters.search"
            type="search"
            class="input rounded-full"
            placeholder="Rechercher facture, client..."
          />
          <input v-model="facturesComptoirFilters.date_from" type="date" class="input rounded-full" />
          <input v-model="facturesComptoirFilters.date_to" type="date" class="input rounded-full" />
          <button type="button" class="btn-secondary rounded-full px-4 py-2 text-sm" :disabled="facturesComptoirLoading" @click="loadFacturesComptoir(1)">
            {{ facturesComptoirLoading ? 'Chargement...' : 'Actualiser' }}
          </button>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-[color:var(--saytu-soft,#f8fafc)] text-xs uppercase text-[color:var(--saytu-topbar-subtitle,#64748b)]">
            <tr>
              <th class="px-4 py-3 text-left">N°</th>
              <th class="px-4 py-3 text-left">Date</th>
              <th class="px-4 py-3 text-left">Client</th>
              <th class="px-4 py-3 text-left">Caisse</th>
              <th class="px-4 py-3 text-left">Paiement</th>
              <th class="px-4 py-3 text-right">Total</th>
              <th class="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[color:var(--saytu-border,#e2e8f0)]">
            <tr v-for="facture in facturesComptoir" :key="facture.id" class="text-sm">
              <td class="px-4 py-3 font-mono font-bold text-[color:var(--saytu-primary,#2563eb)]">{{ facture.numero }}</td>
              <td class="px-4 py-3 text-[color:var(--saytu-topbar-subtitle,#64748b)]">{{ formatDate(facture.date_facture) }}</td>
              <td class="px-4 py-3">
                <p class="font-semibold text-[color:var(--saytu-shell-text,#0f172a)]">{{ facture.client?.nom || 'Client comptoir' }}</p>
                <p class="text-xs text-[color:var(--saytu-topbar-subtitle,#64748b)]">{{ facture.client?.code || '-' }}</p>
              </td>
              <td class="px-4 py-3 text-[color:var(--saytu-topbar-subtitle,#64748b)]">
                <p>{{ caissierFactureComptoir(facture) }}</p>
                <p class="text-xs">{{ sessionFactureComptoir(facture) }}</p>
              </td>
              <td class="px-4 py-3 text-[color:var(--saytu-topbar-subtitle,#64748b)]">{{ modesFactureComptoir(facture) }}</td>
              <td class="px-4 py-3 text-right font-mono font-black text-[color:var(--saytu-shell-text,#0f172a)]">{{ formatPrice(facture.total_ttc) }}</td>
              <td class="px-4 py-3">
                <div class="flex justify-end gap-2">
                  <button type="button" class="btn-secondary px-3 py-1.5 text-xs" @click="reimprimerFactureComptoir(facture)">
                    Ticket
                  </button>
                  <button type="button" class="btn-secondary px-3 py-1.5 text-xs" @click="ouvrirPdfFactureComptoir(facture)">
                    PDF
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="facturesComptoirLoading">
              <td colspan="7" class="px-4 py-10 text-center text-sm text-[color:var(--saytu-topbar-subtitle,#64748b)]">
                Chargement des factures comptoir...
              </td>
            </tr>
            <tr v-else-if="facturesComptoir.length === 0">
              <td colspan="7" class="px-4 py-10 text-center text-sm text-[color:var(--saytu-topbar-subtitle,#64748b)]">
                Aucune facture comptoir trouvée.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="facturesComptoirMeta.last_page > 1" class="flex flex-wrap items-center justify-between gap-3 border-t border-[color:var(--saytu-border,#e2e8f0)] px-4 py-3 text-sm">
        <span class="text-[color:var(--saytu-topbar-subtitle,#64748b)]">
          {{ facturesComptoirMeta.from || 0 }}-{{ facturesComptoirMeta.to || 0 }} sur {{ facturesComptoirMeta.total || 0 }}
        </span>
        <div class="flex items-center gap-2">
          <button type="button" class="btn-secondary px-3 py-1.5 text-sm" :disabled="facturesComptoirMeta.current_page <= 1 || facturesComptoirLoading" @click="loadFacturesComptoir(facturesComptoirMeta.current_page - 1)">
            ←
          </button>
          <span class="font-semibold text-[color:var(--saytu-shell-text,#0f172a)]">
            Page {{ facturesComptoirMeta.current_page }} / {{ facturesComptoirMeta.last_page }}
          </span>
          <button type="button" class="btn-secondary px-3 py-1.5 text-sm" :disabled="facturesComptoirMeta.current_page >= facturesComptoirMeta.last_page || facturesComptoirLoading" @click="loadFacturesComptoir(facturesComptoirMeta.current_page + 1)">
            →
          </button>
        </div>
      </div>
    </section>

    <AppModal v-model="showTicketPreview" :title="ticketModalTitle" size="sm" centered>
      <div v-if="ticketPreview" class="ticket-preview-shell">
        <div class="ticket-paper">
          <div class="ticket-topline">
            <span>Ticket</span>
            <strong>{{ ticketPreview.ticket?.numero || '-' }}</strong>
          </div>

          <div class="ticket-brand">
            <div class="ticket-logo">SL</div>
            <div>
              <h3>Saytu Liggéey 2.0</h3>
              <p>{{ ticketPreview.ticket?.date || '-' }}</p>
            </div>
          </div>

          <div class="ticket-meta">
            <div>
              <span>Caissier</span>
              <strong>{{ ticketPreview.ticket?.caissier || '-' }}</strong>
            </div>
            <div v-if="ticketClientLabel">
              <span>Client</span>
              <strong>{{ ticketClientLabel }}</strong>
            </div>
          </div>

          <div class="ticket-divider"></div>

          <div class="space-y-2">
            <div v-for="(ligne, index) in ticketPreviewLignes" :key="`${ligne.designation}-${ligne.total_ttc}-${index}`" class="ticket-line">
              <div>
                <strong>{{ ligne.designation }}</strong>
                <span>Qté {{ Number(ligne.quantite || 0) }}</span>
              </div>
              <strong>{{ formatPrice(ligne.total_ttc) }}</strong>
            </div>
          </div>

          <div class="ticket-divider"></div>

          <div class="ticket-total">
            <span>Total</span>
            <strong>{{ formatPrice(ticketPreview.ticket?.total_ttc) }}</strong>
          </div>

          <div class="mt-2 space-y-1">
            <div v-for="(paiement, index) in ticketPreviewPaiements" :key="`${paiement.mode_paiement}-${paiement.montant}-${index}`" class="ticket-payment">
              <span>{{ modePaiementLabel(paiement.mode_paiement) }}</span>
              <strong>{{ formatPrice(paiement.montant) }}</strong>
            </div>
            <div v-if="Number(ticketPreview.ticket?.monnaie_rendue || 0) > 0" class="ticket-payment">
              <span>Reçu</span>
              <strong>{{ formatPrice(ticketPreview.ticket?.total_recu) }}</strong>
            </div>
            <div v-if="Number(ticketPreview.ticket?.monnaie_rendue || 0) > 0" class="ticket-payment font-black">
              <span>Monnaie rendue</span>
              <strong>{{ formatPrice(ticketPreview.ticket?.monnaie_rendue) }}</strong>
            </div>
          </div>

          <p class="ticket-thanks">Merci pour votre achat</p>
        </div>
      </div>

      <template #footer>
        <button type="button" class="btn-secondary" @click="showTicketPreview = false">Fermer</button>
        <button type="button" class="btn-primary" @click="lancerImpressionTicket">Imprimer</button>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import AppModal from '@/components/AppModal.vue'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth'
import { ouvrirPDF } from '@/services/pdf'
import { telechargerCSV } from '@/services/exports'
import { useRoute } from 'vue-router'

const toast = useToast()
const auth = useAuthStore()
const route = useRoute()
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
const showTicketPreview = ref(false)
const ticketPreview = ref(null)
const stats = reactive({ sessions_ouvertes: 0, entrees_jour: 0, sorties_jour: 0, solde_net_jour: 0 })
const activeCaisseTab = ref('vente')
const facturesComptoir = ref([])
const facturesComptoirLoading = ref(false)
const facturesComptoirFilters = reactive({ search: '', date_from: '', date_to: '' })
const facturesComptoirMeta = reactive({ current_page: 1, last_page: 1, total: 0, from: 0, to: 0 })

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
const facturesComptoirTotal = computed(() => Number(facturesComptoirMeta.total || facturesComptoir.value.length || 0))
const showFacturesComptoirPanel = computed(() => activeCaisseTab.value === 'factures-comptoir' && (Boolean(session.value) || isAdmin.value))
const summaryItems = computed(() => [
  { key: 'sessions', label: 'Ouvertes', value: stats.sessions_ouvertes || 0, class: 'text-[color:var(--saytu-primary,#2563eb)]' },
  { key: 'entrees', label: 'Entrées', value: formatPrice(stats.entrees_jour), class: 'text-emerald-700' },
  { key: 'sorties', label: 'Sorties', value: formatPrice(stats.sorties_jour), class: 'text-red-700' },
  { key: 'net', label: 'Net jour', value: formatPrice(stats.solde_net_jour), class: Number(stats.solde_net_jour || 0) < 0 ? 'text-red-700' : 'text-[color:var(--saytu-primary,#2563eb)]' },
])
const caisseTabs = computed(() => [
  { key: 'vente', label: 'Vente rapide', badge: panier.value.length ? `${panier.value.length}` : '' },
  { key: 'mouvements', label: 'Mouvements', badge: '' },
  { key: 'historique', label: 'Historique', badge: mouvements.value.length ? `${mouvements.value.length}` : '' },
  { key: 'factures-comptoir', label: 'Factures comptoir', badge: facturesComptoirTotal.value ? `${facturesComptoirTotal.value}` : '' },
  { key: 'cloture', label: 'Clôture', badge: '' },
])
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

const ticketModalTitle = computed(() => {
  const numero = ticketPreview.value?.ticket?.numero
  return numero ? `Aperçu ticket ${numero}` : 'Aperçu ticket'
})

const ticketPreviewLignes = computed(() => extraireLignesTicket(ticketPreview.value))
const ticketPreviewPaiements = computed(() => extrairePaiementsTicket(ticketPreview.value))
const ticketClientLabel = computed(() => {
  const data = ticketPreview.value
  return data?.facture?.client?.nom || data?.facture?.client_nom || data?.ticket?.client_nom || ''
})

watch(() => totauxPanier.value.ttc, (nouveauTotal, ancienTotal) => {
  if (encaissements.value.length !== 1) return
  const item = encaissements.value[0]
  if (Number(item.montant || 0) === Number(ancienTotal || 0) || Number(item.montant || 0) === 0) {
    item.montant = Number(nouveauTotal || 0)
    if (item.mode_paiement === 'especes') item.montant_recu = Number(nouveauTotal || 0)
  }
})

function syncCaisseTabFromRoute() {
  const tab = typeof route.query.tab === 'string' ? route.query.tab : ''
  if (['vente', 'mouvements', 'historique', 'factures-comptoir', 'cloture'].includes(tab)) {
    activeCaisseTab.value = tab
  }
}

watch(() => route.query.tab, () => syncCaisseTabFromRoute(), { immediate: true })

watch(activeCaisseTab, (tab) => {
  if (tab === 'factures-comptoir') {
    loadFacturesComptoir(1).catch(() => toast.error('Erreur de chargement des factures comptoir'))
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

  if (showFacturesComptoirPanel.value) {
    loadFacturesComptoir().catch(() => toast.error('Erreur de chargement des factures comptoir'))
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

let facturesComptoirTimer = null
watch(() => facturesComptoirFilters.search, () => {
  if (!showFacturesComptoirPanel.value) return
  clearTimeout(facturesComptoirTimer)
  facturesComptoirTimer = setTimeout(() => loadFacturesComptoir(1), 300)
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

function appliquerRemiseGlobale() {
  const remise = Number(panier.value[0]?.remise_pourcent || 0)
  panier.value.forEach((ligne) => {
    ligne.remise_pourcent = remise
  })
}

function imageProduit(produit) {
  const image = produit?.image_url || produit?.image || produit?.photo_url || produit?.photo || produit?.image_path || produit?.photo_path
  if (!image) return ''
  if (String(image).startsWith('http') || String(image).startsWith('data:')) return image
  return String(image).startsWith('/') ? image : `/${image}`
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
      afficherTicket(data)
    }
    viderPanier()
    Object.assign(posForm, { client_nom: '', mode_paiement: 'especes', reference_paiement: '', document_type: 'ticket' })
    reinitialiserEncaissements()
    await loadCaisse()
  } catch (e) {
    toast.error(e.response?.data?.errors?.stock?.[0] || e.response?.data?.errors?.caisse?.[0] || e.response?.data?.message || 'Vente impossible')
  } finally {
    saving.value = false
  }
}

function afficherTicket(data) {
  ticketPreview.value = data
  showTicketPreview.value = true
}

function extraireLignesTicket(data) {
  return data?.facture?.lignes || []
}

function extrairePaiementsTicket(data) {
  const paiements = data?.ticket?.paiements || []
  if (paiements.length) return paiements
  if (!data?.ticket?.mode_paiement) return []
  return [{
    mode_paiement: data.ticket.mode_paiement,
    montant: Number(data.ticket.total_ttc || 0),
  }]
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }[char]))
}

function lancerImpressionTicket() {
  if (imprimerTicket(ticketPreview.value)) {
    showTicketPreview.value = false
  }
}

function imprimerTicket(data = ticketPreview.value) {
  if (!data?.ticket) return false
  const lignes = extraireLignesTicket(data)
  const paiements = extrairePaiementsTicket(data)
  const html = `
    <html>
      <head>
        <title>Ticket ${escapeHtml(data.ticket.numero)}</title>
        <style>
          @page { size: 80mm auto; margin: 5mm; }
          * { box-sizing: border-box; }
          body { font-family: Arial, sans-serif; width: 72mm; margin: 0 auto; color: #111; }
          h1 { font-size: 15px; text-align: center; margin: 8px 0 4px; }
          .center { text-align: center; }
          .line { border-top: 1px dashed #999; margin: 8px 0; }
          .row { display: flex; justify-content: space-between; gap: 8px; font-size: 12px; margin: 4px 0; }
          .total { font-weight: 700; font-size: 14px; }
          small { color: #444; }
        </style>
      </head>
      <body>
        <h1>Saytu Liggéey 2.0</h1>
        <div class="center"><small>Ticket ${escapeHtml(data.ticket.numero)}</small></div>
        <div class="center"><small>${escapeHtml(data.ticket.date)} - ${escapeHtml(data.ticket.caissier)}</small></div>
        <div class="line"></div>
        ${lignes.map(l => `
          <div class="row">
            <span>${escapeHtml(l.designation)} x ${Number(l.quantite)}</span>
            <strong>${formatPrice(l.total_ttc)}</strong>
          </div>
        `).join('')}
        <div class="line"></div>
        <div class="row total"><span>Total</span><strong>${formatPrice(data.ticket.total_ttc)}</strong></div>
        ${paiements.map(p => `<div class="row"><span>${escapeHtml(modePaiementLabel(p.mode_paiement))}</span><strong>${formatPrice(p.montant)}</strong></div>`).join('')}
        ${Number(data.ticket.monnaie_rendue || 0) > 0 ? `
          <div class="row"><span>Reçu</span><strong>${formatPrice(data.ticket.total_recu)}</strong></div>
          <div class="row total"><span>Monnaie rendue</span><strong>${formatPrice(data.ticket.monnaie_rendue)}</strong></div>
        ` : ''}
        <div class="line"></div>
        <p class="center">Merci pour votre achat</p>
      </body>
    </html>
  `
  const frame = document.createElement('iframe')
  frame.setAttribute('title', `Ticket ${data.ticket.numero}`)
  frame.style.position = 'fixed'
  frame.style.right = '0'
  frame.style.bottom = '0'
  frame.style.width = '0'
  frame.style.height = '0'
  frame.style.border = '0'
  frame.style.opacity = '0'
  frame.style.pointerEvents = 'none'
  document.body.appendChild(frame)

  const doc = frame.contentDocument || frame.contentWindow?.document
  if (!doc) {
    frame.remove()
    toast.error('Impression impossible')
    return false
  }

  doc.open()
  doc.write(html)
  doc.close()

  setTimeout(() => {
    frame.contentWindow?.focus()
    frame.contentWindow?.print()
    setTimeout(() => frame.remove(), 1000)
  }, 120)
  return true
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
    afficherTicket(data)
  } catch (e) {
    toast.error(e.response?.data?.message || 'Réimpression impossible')
  }
}

async function loadMouvements() {
  if (!session.value) return
  const { data } = await api.get(`/caisse/sessions/${session.value.id}/mouvements`, { params: { per_page: 50 } })
  mouvements.value = data.data || []
}

async function loadFacturesComptoir(page = facturesComptoirMeta.current_page || 1) {
  facturesComptoirLoading.value = true
  try {
    const { data } = await api.get('/caisse/factures-comptoir', {
      params: {
        page,
        per_page: 20,
        search: facturesComptoirFilters.search || undefined,
        date_from: facturesComptoirFilters.date_from || undefined,
        date_to: facturesComptoirFilters.date_to || undefined,
      },
    })
    facturesComptoir.value = data.data || []
    Object.assign(facturesComptoirMeta, {
      current_page: data.current_page || 1,
      last_page: data.last_page || 1,
      total: data.total || 0,
      from: data.from || 0,
      to: data.to || 0,
    })
  } finally {
    facturesComptoirLoading.value = false
  }
}

function mouvementsFactureComptoir(facture) {
  return Array.isArray(facture?.caisse_mouvements) ? facture.caisse_mouvements : []
}

function caissierFactureComptoir(facture) {
  const mouvementVente = mouvementsFactureComptoir(facture).find(m => m.type === 'vente')
  return mouvementVente?.user?.name || facture?.commercial?.name || '-'
}

function modesFactureComptoir(facture) {
  const modes = mouvementsFactureComptoir(facture)
    .map(m => modePaiementLabel(m.mode_paiement))
    .filter(Boolean)

  return [...new Set(modes)].join(' + ') || '-'
}

function sessionFactureComptoir(facture) {
  const mouvementVente = mouvementsFactureComptoir(facture).find(m => m.type === 'vente')
  return mouvementVente?.session?.reference || '-'
}

async function ouvrirPdfFactureComptoir(facture) {
  try {
    await ouvrirPDF(`/caisse/factures/${facture.id}/pdf`, `${facture.numero}.pdf`)
  } catch (e) {
    toast.error('PDF impossible pour cette facture comptoir')
  }
}

async function reimprimerFactureComptoir(facture) {
  if (!facture?.id) return
  try {
    const { data } = await api.get(`/caisse/factures/${facture.id}/ticket`)
    afficherTicket(data)
  } catch (e) {
    toast.error(e.response?.data?.message || 'Réimpression impossible')
  }
}

async function ouvrirCaisse() {
  saving.value = true
  try {
    await api.post('/caisse/ouvrir', openForm)
    toast.success('Caisse ouverte')
    openForm.solde_ouverture = 0
    openForm.notes_ouverture = ''
    activeCaisseTab.value = 'vente'
    await loadCaisse()
  } catch (e) {
    toast.error(e.response?.data?.message || e.response?.data?.errors?.caisse?.[0] || 'Ouverture impossible')
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
    toast.error(e.response?.data?.message || e.response?.data?.errors?.caisse?.[0] || 'Enregistrement impossible')
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
    activeCaisseTab.value = 'vente'
    closeForm.solde_fermeture_reel = 0
    closeForm.notes_fermeture = ''
    await loadCaisse()
  } catch (e) {
    toast.error(e.response?.data?.message || e.response?.data?.errors?.caisse?.[0] || 'Fermeture impossible')
  } finally {
    saving.value = false
  }
}

function formatPrice(n) {
  return new Intl.NumberFormat('fr-FR').format(Math.round(Number(n || 0)))
}

function formatDateTime(value) {
  return value ? new Date(value).toLocaleString('fr-FR') : '-'
}

function formatDate(value) {
  if (!value) return '-'
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (match) return `${match[3]}/${match[2]}/${match[1]}`
  return new Date(value).toLocaleDateString('fr-FR')
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
.caisse-page {
  color: var(--saytu-shell-text, #0f172a);
}

.caisse-summary,
.caisse-session-bar,
.caisse-tabs-wrap {
  border: 1px solid color-mix(in srgb, var(--saytu-primary, #2563eb) 14%, var(--saytu-border, #e2e8f0));
  background:
    linear-gradient(135deg, color-mix(in srgb, var(--saytu-primary, #2563eb) 6%, transparent), transparent 48%),
    var(--saytu-surface, #ffffff);
  box-shadow: 0 10px 30px color-mix(in srgb, var(--saytu-primary, #2563eb) 7%, transparent);
}

.caisse-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  border-radius: 1.25rem;
  padding: 0.75rem 1rem;
}

.caisse-summary-items {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.5rem;
}

.caisse-summary-chip {
  display: inline-flex;
  min-width: 8.2rem;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--saytu-primary, #2563eb) 12%, var(--saytu-border, #e2e8f0));
  background: color-mix(in srgb, var(--saytu-surface, #ffffff) 88%, var(--saytu-primary, #2563eb) 12%);
  padding: 0.45rem 0.75rem;
}

.caisse-summary-chip span {
  color: var(--saytu-topbar-subtitle, #64748b);
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.caisse-summary-chip strong {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.9rem;
  font-weight: 950;
}

.caisse-session-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  border-radius: 1.25rem;
  padding: 0.85rem 1rem;
}

.caisse-live-dot {
  height: 0.65rem;
  width: 0.65rem;
  border-radius: 999px;
  background: #10b981;
  box-shadow: 0 0 0 5px rgb(16 185 129 / 12%);
}

.caisse-tabs-wrap {
  border-radius: 1.2rem;
  padding: 0.35rem;
}

.caisse-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.caisse-tab {
  display: inline-flex;
  min-height: 2.45rem;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border-radius: 999px;
  padding: 0.55rem 0.9rem;
  font-size: 0.82rem;
  font-weight: 850;
  transition: all 0.15s ease;
}

.caisse-tab small {
  border-radius: 999px;
  background: rgb(255 255 255 / 78%);
  padding: 0.1rem 0.45rem;
  font-size: 0.68rem;
  font-weight: 950;
}

.caisse-tab-active {
  background: linear-gradient(135deg, var(--saytu-primary, #2563eb), var(--saytu-brand-to, #06b6d4));
  color: white;
  box-shadow: 0 10px 24px color-mix(in srgb, var(--saytu-primary, #2563eb) 22%, transparent);
}

.caisse-tab-idle {
  color: var(--saytu-topbar-subtitle, #64748b);
}

.caisse-tab-idle:hover {
  background: color-mix(in srgb, var(--saytu-primary, #2563eb) 8%, var(--saytu-surface, #ffffff));
  color: var(--saytu-shell-text, #0f172a);
}

@media (max-width: 768px) {
  .caisse-summary,
  .caisse-session-bar {
    align-items: stretch;
    flex-direction: column;
  }

  .caisse-summary-items,
  .caisse-tabs {
    justify-content: stretch;
  }

  .caisse-summary-chip,
  .caisse-tab {
    flex: 1 1 9rem;
  }
}

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

.ticket-preview-shell {
  border-radius: 1.5rem;
  border: 1px solid color-mix(in srgb, var(--saytu-primary, #2563eb) 18%, var(--saytu-border, #e2e8f0));
  background:
    radial-gradient(circle at top left, color-mix(in srgb, var(--saytu-primary, #2563eb) 16%, transparent), transparent 34%),
    color-mix(in srgb, var(--saytu-surface, #ffffff) 92%, var(--saytu-primary, #2563eb) 8%);
  padding: 1rem;
}

.ticket-paper {
  margin: 0 auto;
  max-width: 20rem;
  border-radius: 1.25rem;
  border: 1px solid color-mix(in srgb, var(--saytu-primary, #2563eb) 16%, var(--saytu-border, #e2e8f0));
  background: var(--saytu-surface, #ffffff);
  color: var(--saytu-shell-text, #0f172a);
  padding: 1rem;
  box-shadow: 0 18px 45px color-mix(in srgb, var(--saytu-primary, #2563eb) 12%, transparent);
}

.ticket-topline,
.ticket-line,
.ticket-total,
.ticket-payment {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.ticket-topline {
  color: var(--saytu-topbar-subtitle, #64748b);
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.ticket-brand {
  margin-top: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.ticket-logo {
  display: inline-flex;
  height: 2.6rem;
  width: 2.6rem;
  align-items: center;
  justify-content: center;
  border-radius: 1rem;
  background: linear-gradient(135deg, var(--saytu-primary, #2563eb), var(--saytu-brand-to, #06b6d4));
  color: white;
  font-size: 0.85rem;
  font-weight: 900;
  box-shadow: 0 12px 22px color-mix(in srgb, var(--saytu-primary, #2563eb) 20%, transparent);
}

.ticket-brand h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 900;
}

.ticket-brand p,
.ticket-meta span,
.ticket-line span {
  color: var(--saytu-topbar-subtitle, #64748b);
  font-size: 0.76rem;
}

.ticket-meta {
  margin-top: 0.9rem;
  display: grid;
  gap: 0.45rem;
  border-radius: 1rem;
  background: color-mix(in srgb, var(--saytu-primary, #2563eb) 6%, var(--saytu-surface, #ffffff));
  padding: 0.75rem;
  font-size: 0.8rem;
}

.ticket-meta div {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
}

.ticket-divider {
  margin: 0.85rem 0;
  border-top: 1px dashed color-mix(in srgb, var(--saytu-primary, #2563eb) 28%, var(--saytu-border, #e2e8f0));
}

.ticket-line {
  align-items: flex-start;
  font-size: 0.82rem;
}

.ticket-line div {
  display: grid;
  gap: 0.15rem;
}

.ticket-total {
  border-radius: 1rem;
  background: color-mix(in srgb, var(--saytu-primary, #2563eb) 11%, var(--saytu-surface, #ffffff));
  padding: 0.75rem;
  color: var(--saytu-primary, #2563eb);
  font-size: 0.95rem;
  font-weight: 900;
}

.ticket-payment {
  color: var(--saytu-topbar-subtitle, #64748b);
  font-size: 0.8rem;
}

.ticket-payment strong,
.ticket-line > strong {
  color: var(--saytu-shell-text, #0f172a);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.ticket-thanks {
  margin-top: 1rem;
  text-align: center;
  color: var(--saytu-primary, #2563eb);
  font-size: 0.82rem;
  font-weight: 800;
}
</style>
