<template>
  <div class="app-surface space-y-4">
    <div class="rounded-2xl border border-cyan-200 bg-white p-4 shadow-sm">
      <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <button type="button" class="mb-3 text-sm font-bold text-cyan-700 hover:text-cyan-900" @click="goBack">
            ← Retour liste
          </button>
          <div class="flex flex-wrap items-center gap-2">
            <h1 class="text-2xl font-black text-slate-950">
              {{ isCreate ? 'Nouveau bon de commande' : commande?.numero || 'Bon de commande' }}
            </h1>
            <span v-if="commande" class="badge text-xs" :class="statusClass(commande.statut)">
              {{ statusLabel(commande.statut) }}
            </span>
          </div>
          <p class="mt-1 text-sm text-slate-600">
            <template v-if="isCreate">Saisie en page complète, sans fenêtre flottante.</template>
            <template v-else>
              {{ commande?.fournisseur?.nom || 'Fournisseur non renseigné' }}
              <span v-if="commande?.objet"> · {{ commande.objet }}</span>
            </template>
          </p>
        </div>

        <div v-if="commande" class="flex flex-wrap gap-2">
          <button type="button" class="btn-secondary" @click="downloadOrderPdf">PDF</button>
          <button v-if="commande.statut === 'brouillon'" type="button" class="btn-secondary" @click="setTab('saisie')">Modifier</button>
          <button v-if="commande.statut === 'brouillon'" type="button" class="btn-primary" @click="submitCommande">Soumettre</button>
          <button v-if="commande.statut === 'soumise' && canApprove" type="button" class="btn-primary" @click="approveCommande">Approuver</button>
          <button v-if="['approuvee', 'partiellement_recue'].includes(commande.statut) && canReceive" type="button" class="btn-primary" @click="goToReception">Réceptionner</button>
          <button v-if="['partiellement_recue', 'recue'].includes(commande.statut) && !commande.facture_fournisseur && canInvoice" type="button" class="btn-primary" @click="goToSupplierInvoiceCreate">Facturer</button>
          <button v-if="commande.facture_fournisseur" type="button" class="btn-secondary" @click="goToInvoice(commande.facture_fournisseur)">Voir facture</button>
        </div>
      </div>
    </div>

    <div class="rounded-2xl border border-cyan-200 bg-white shadow-sm">
      <div class="flex flex-wrap gap-1 border-b border-cyan-100 px-3 pt-3">
        <button
          v-for="tab in visibleTabs"
          :key="tab.key"
          type="button"
          class="rounded-t-xl px-4 py-2 text-sm font-black transition"
          :class="activeTab === tab.key ? 'bg-cyan-100 text-cyan-900' : 'text-slate-600 hover:bg-cyan-50 hover:text-cyan-800'"
          @click="setTab(tab.key)"
        >
          {{ tab.label }}
        </button>
      </div>

      <div v-if="loading" class="p-10 text-center text-slate-500">Chargement...</div>

      <div v-else-if="activeTab === 'fiche' && commande" class="space-y-4 p-4">
        <section class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div class="purchase-kpi">
            <span>Fournisseur</span>
            <strong>{{ commande.fournisseur?.nom || '—' }}</strong>
          </div>
          <div class="purchase-kpi">
            <span>Date commande</span>
            <strong>{{ formatDate(commande.date_commande) }}</strong>
          </div>
          <div class="purchase-kpi">
            <span>Livraison prévue</span>
            <strong>{{ formatDate(commande.date_livraison_prevue) }}</strong>
          </div>
          <div class="purchase-kpi">
            <span>Total TTC</span>
            <strong>{{ money(commande.total_ttc) }}</strong>
          </div>
        </section>

        <section class="rounded-2xl border border-cyan-100 bg-cyan-50/60 p-4">
          <div class="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
            <div>
              <p class="text-xs font-black uppercase tracking-[0.2em] text-cyan-700">Informations commande</p>
              <h2 class="mt-2 text-xl font-black text-slate-950">{{ commande.objet || 'Sans objet' }}</h2>
              <p class="mt-1 text-sm text-slate-600">
                Entrepôt prévu : {{ commande.entrepot?.libelle || 'À définir' }} · Devise : {{ commande.devise || 'XOF' }}
              </p>
            </div>
            <span class="badge" :class="statusClass(commande.statut)">{{ statusLabel(commande.statut) }}</span>
          </div>
          <p v-if="commande.notes" class="mt-3 whitespace-pre-line text-sm text-slate-600">{{ commande.notes }}</p>
        </section>

        <section class="overflow-hidden rounded-2xl border border-slate-200">
          <div class="border-b border-slate-200 bg-slate-50 px-4 py-3">
            <h3 class="font-black text-slate-900">Produits commandés</h3>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full min-w-[780px]">
              <thead>
                <tr>
                  <th>Produit</th>
                  <th class="text-right">Qté</th>
                  <th class="text-right">Prix HT</th>
                  <th class="text-right">TVA</th>
                  <th class="text-right">Total TTC</th>
                  <th class="text-right">Reçu</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="line in commande.lignes || []" :key="line.id">
                  <td>
                    <strong>{{ line.designation || line.produit?.libelle || 'Produit' }}</strong>
                    <p class="text-xs text-slate-500">{{ line.reference || line.produit?.reference }}</p>
                  </td>
                  <td class="text-right">{{ number(line.quantite) }}</td>
                  <td class="text-right">{{ money(line.prix_unitaire_ht) }}</td>
                  <td class="text-right">{{ number(line.taux_tva) }}%</td>
                  <td class="text-right font-black">{{ money(line.total_ttc ?? lineTotal(line)) }}</td>
                  <td class="text-right">{{ number(line.quantite_recue || 0) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section v-if="commande.facture_fournisseur" class="rounded-2xl border border-violet-200 bg-violet-50/70 p-4 text-sm text-violet-950">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p class="text-xs font-black uppercase tracking-[0.2em] text-violet-700">Facture fournisseur</p>
              <p class="mt-2">
                <strong class="font-mono">{{ commande.facture_fournisseur.numero }}</strong>
                · {{ statusInvoiceLabel(commande.facture_fournisseur.statut) }}
                · Reste {{ money(commande.facture_fournisseur.reste_a_payer) }}
              </p>
            </div>
            <button type="button" class="font-semibold text-violet-700 hover:underline" @click="goToInvoice(commande.facture_fournisseur)">Ouvrir la facture</button>
          </div>
        </section>

        <section class="overflow-hidden rounded-2xl border border-slate-200">
          <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3">
            <div>
              <h3 class="font-black text-slate-900">Réceptions et retours</h3>
              <p class="text-sm text-slate-500">Historique des bons de réception, retours fournisseur et avoirs associés.</p>
            </div>
            <button v-if="['approuvee', 'partiellement_recue'].includes(commande.statut) && canReceive" type="button" class="btn-secondary" @click="goToReception">
              Nouvelle réception
            </button>
          </div>

          <div v-if="commande.receptions?.length" class="divide-y divide-slate-100">
            <div v-for="reception in commande.receptions" :key="reception.id" class="p-4 text-sm">
              <div class="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <strong class="font-mono text-slate-950">{{ reception.numero }}</strong>
                  <p class="mt-1 text-slate-600">
                    {{ formatDate(reception.date_reception) }}
                    · {{ reception.entrepot?.libelle || 'Entrepôt non renseigné' }}
                    <span v-if="reception.emplacement"> · {{ reception.emplacement?.zone?.libelle || 'Zone' }} / {{ reception.emplacement?.code || reception.emplacement?.libelle }}</span>
                  </p>
                </div>
                <div class="flex flex-wrap gap-2">
                  <button v-if="canReturn && availableReturnLines(reception).length" type="button" class="font-semibold text-orange-700 hover:underline" @click="goToReturn(reception)">Retourner</button>
                  <button type="button" class="font-semibold text-cyan-700 hover:underline" @click="downloadReceptionPdf(reception)">PDF BR</button>
                </div>
              </div>

              <div class="mt-3 flex flex-wrap gap-2 text-xs">
                <span class="rounded-full bg-slate-100 px-2 py-1 font-bold text-slate-700">BL : {{ reception.reference_bl || '-' }}</span>
                <span class="rounded-full px-2 py-1 font-bold" :class="qualityBadge(reception.controle_qualite)">Contrôle : {{ qualityLabel(reception.controle_qualite) }}</span>
                <span v-if="reception.reserve_reception" class="rounded-full bg-amber-100 px-2 py-1 font-bold text-amber-800">Réserve : {{ reception.reserve_reception }}</span>
              </div>

              <div v-if="reception.retours?.length" class="mt-3 space-y-2">
                <div v-for="retour in reception.retours" :key="retour.id" class="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-orange-200 bg-orange-50 p-3 text-orange-950">
                  <span>
                    <strong class="font-mono">{{ retour.numero }}</strong>
                    · {{ formatDate(retour.date_retour) }}
                    · {{ motifRetourLabel(retour.motif) }}
                    · {{ litigeLabel(retour.litige_statut) }}
                    · {{ money(retour.total_ttc) }}
                  </span>
                  <span v-if="retour.avoir" class="font-semibold text-violet-700">Avoir {{ retour.avoir.numero }}</span>
                  <span v-else class="text-xs font-semibold text-orange-700">Avoir à traiter</span>
                </div>
              </div>
            </div>
          </div>

          <p v-else class="p-8 text-center text-sm text-slate-400">Aucune réception enregistrée pour cette commande.</p>
        </section>
      </div>

      <form v-else class="space-y-4 p-4" @submit.prevent="saveCommande">
        <div v-if="referentielsError" class="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {{ referentielsError }}
        </div>

        <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label class="field-label md:col-span-2">Fournisseur
            <select v-model.number="form.fournisseur_id" class="input" required>
              <option :value="null">{{ loadingReferentiels ? 'Chargement des fournisseurs...' : 'Choisir un fournisseur' }}</option>
              <option v-for="supplier in referentiels.fournisseurs" :key="supplier.id" :value="supplier.id">
                {{ supplier.code }} - {{ supplier.nom }}
              </option>
            </select>
          </label>
          <label class="field-label">Date commande<input v-model="form.date_commande" type="date" class="input" required /></label>
          <label class="field-label">Livraison prévue<input v-model="form.date_livraison_prevue" type="date" class="input" /></label>
          <label class="field-label md:col-span-2">Objet<input v-model="form.objet" class="input" placeholder="Ex. Réapprovisionnement mensuel" /></label>
          <label class="field-label">Entrepôt prévu
            <select v-model.number="form.entrepot_id" class="input">
              <option :value="null">À définir à la réception</option>
              <option v-for="warehouse in referentiels.entrepots" :key="warehouse.id" :value="warehouse.id">
                {{ warehouse.code }} - {{ warehouse.libelle }}
              </option>
            </select>
          </label>
          <label class="field-label">Devise
            <select v-model="form.devise" class="input">
              <option>XOF</option>
              <option>EUR</option>
              <option>USD</option>
            </select>
          </label>
        </div>

        <div class="border-y border-slate-200 py-4">
          <div class="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 class="font-bold text-slate-900">Produits commandés</h3>
              <p class="text-sm text-slate-500">Les prix d’achat sont préremplis depuis les fiches produits.</p>
            </div>
            <div class="flex gap-2">
              <input v-model="productSearch" class="input sm:w-72" placeholder="Filtrer les produits..." />
              <button type="button" class="btn-secondary" @click="addLine">+ Ligne</button>
            </div>
          </div>

          <div class="space-y-2.5">
            <div v-for="(line, index) in form.lignes" :key="line.key" class="document-line-card">
              <div class="mb-2 flex items-center justify-between gap-2">
                <span class="rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-bold text-cyan-700">Ligne {{ index + 1 }}</span>
                <div class="flex items-center gap-1">
                  <button type="button" class="document-line-order-button" :disabled="index === 0 || form.lignes.length < 2" @click="moveLine(index, -1)">↑ Monter</button>
                  <button type="button" class="document-line-order-button" :disabled="index === form.lignes.length - 1 || form.lignes.length < 2" @click="moveLine(index, 1)">↓ Descendre</button>
                  <button type="button" class="document-line-delete-button" @click="removeLine(index)">Supprimer</button>
                </div>
              </div>
              <div class="grid items-end gap-2 lg:grid-cols-[minmax(260px,1fr)_110px_150px_110px_150px]">
                <label class="block"><span class="document-line-label">Produit</span>
                  <select v-model.number="line.produit_id" class="input" required @change="selectProduct(line)">
                    <option :value="null">{{ loadingReferentiels ? 'Chargement des produits...' : 'Choisir un produit' }}</option>
                    <option v-for="product in visibleProducts(line)" :key="product.id" :value="product.id">
                      {{ product.reference }} - {{ product.libelle }}
                    </option>
                  </select>
                </label>
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
            <div class="mt-3 flex justify-between border-t border-slate-300 pt-3 text-lg"><span>Total TTC</span><strong class="text-cyan-700">{{ money(orderTotals.ttc) }}</strong></div>
          </div>
        </div>

        <div class="flex justify-end gap-2">
          <button type="button" class="btn-secondary" @click="goBack">Annuler</button>
          <button class="btn-primary" :disabled="saving">{{ saving ? 'Enregistrement...' : 'Enregistrer le brouillon' }}</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'
import { ouvrirPDF } from '@/services/pdf'
import { hasAnyRole } from '@/utils/access'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const toast = useToast()
const { confirm: askConfirm } = useConfirm()

const commande = ref(null)
const loading = ref(false)
const saving = ref(false)
const loadingReferentiels = ref(false)
const referentielsError = ref('')
const productSearch = ref('')
const activeTab = ref(String(route.query.tab || 'fiche'))
const referentiels = reactive({ fournisseurs: [], produits: [], entrepots: [] })
let lineKey = 0
const form = reactive(emptyForm())

const isCreate = computed(() => route.name === 'achat-commande-create')
const canApprove = computed(() => hasAnyRole(auth.user, ['admin', 'gerant', 'comptable']))
const canReceive = computed(() => hasAnyRole(auth.user, ['admin', 'gerant', 'magasinier']))
const canReturn = computed(() => hasAnyRole(auth.user, ['admin', 'gerant', 'magasinier']))
const canInvoice = computed(() => hasAnyRole(auth.user, ['admin', 'gerant', 'comptable']))
const visibleTabs = computed(() => isCreate.value
  ? [{ key: 'saisie', label: 'Saisie commande' }]
  : [
      { key: 'fiche', label: 'Fiche' },
      ...(commande.value?.statut === 'brouillon' ? [{ key: 'saisie', label: 'Saisie commande' }] : []),
    ])
const orderTotals = computed(() => form.lignes.reduce((totals, line) => {
  const ht = Number(line.quantite || 0) * Number(line.prix_unitaire_ht || 0)
  const tva = ht * Number(line.taux_tva || 0) / 100
  totals.ht += ht
  totals.tva += tva
  totals.ttc += ht + tva
  return totals
}, { ht: 0, tva: 0, ttc: 0 }))

onMounted(async () => {
  await loadReferentiels()
  await loadCommande()
})

watch(() => route.params.id, loadCommande)
watch(() => route.query.tab, (tab) => {
  const next = typeof tab === 'string' ? tab : (isCreate.value ? 'saisie' : 'fiche')
  if (visibleTabs.value.some((item) => item.key === next)) activeTab.value = next
}, { immediate: true })

function emptyLine() {
  return { key: ++lineKey, produit_id: null, quantite: 1, prix_unitaire_ht: 0, taux_tva: 0 }
}

function emptyForm() {
  return {
    fournisseur_id: null,
    entrepot_id: null,
    date_commande: new Date().toISOString().slice(0, 10),
    date_livraison_prevue: '',
    objet: '',
    devise: 'XOF',
    notes: '',
    lignes: [emptyLine()],
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
  } catch (error) {
    referentielsError.value = error?.response?.data?.message || 'Impossible de charger les fournisseurs, produits et entrepôts.'
    toast.error(referentielsError.value)
  } finally {
    loadingReferentiels.value = false
  }
}

async function loadCommande() {
  if (isCreate.value) {
    commande.value = null
    Object.assign(form, emptyForm())
    activeTab.value = 'saisie'
    return
  }

  loading.value = true
  try {
    const { data } = await api.get(`/achats/commandes/${route.params.id}`)
    commande.value = data
    fillFormFromCommande(data)
  } catch (error) {
    toast.error(error.response?.data?.message || 'Bon de commande introuvable.')
    router.replace({ name: 'achats' })
  } finally {
    loading.value = false
  }
}

function fillFormFromCommande(row) {
  Object.assign(form, {
    fournisseur_id: row.fournisseur_id,
    entrepot_id: row.entrepot_id || null,
    date_commande: row.date_commande ? String(row.date_commande).slice(0, 10) : new Date().toISOString().slice(0, 10),
    date_livraison_prevue: row.date_livraison_prevue ? String(row.date_livraison_prevue).slice(0, 10) : '',
    objet: row.objet || '',
    devise: row.devise || 'XOF',
    notes: row.notes || '',
    lignes: (row.lignes || []).map((line) => ({
      key: ++lineKey,
      produit_id: line.produit_id,
      quantite: Number(line.quantite),
      prix_unitaire_ht: Number(line.prix_unitaire_ht),
      taux_tva: Number(line.taux_tva),
    })),
  })
  if (!form.lignes.length) form.lignes = [emptyLine()]
}

function setTab(tab) {
  activeTab.value = tab
  router.replace({ query: { ...route.query, tab } })
}

function goBack() {
  router.push({ name: 'achats' })
}

function goToReception() {
  if (!commande.value?.id) return
  router.push({ name: 'achat-reception-create', params: { id: commande.value.id } })
}

function goToSupplierInvoiceCreate() {
  if (!commande.value?.id) return
  router.push({ name: 'achat-facture-create', params: { id: commande.value.id } })
}

function goToInvoice(invoice) {
  router.push({ path: '/fournisseurs-reglements', query: invoice?.numero ? { search: invoice.numero } : {} })
}

function goToReturn(reception) {
  if (!commande.value?.id || !reception?.id) return
  router.push({
    name: 'achat-retour-create',
    params: { commandeId: commande.value.id, receptionId: reception.id },
  })
}

function visibleProducts(line) {
  const term = productSearch.value.trim().toLowerCase()
  const filtered = !term
    ? referentiels.produits
    : referentiels.produits.filter((product) => `${product.reference} ${product.libelle}`.toLowerCase().includes(term))
  const current = referentiels.produits.find((product) => Number(product.id) === Number(line.produit_id))
  return current && !filtered.some((product) => product.id === current.id) ? [current, ...filtered] : filtered
}

function selectProduct(line) {
  const product = referentiels.produits.find((item) => Number(item.id) === Number(line.produit_id))
  if (!product) return
  line.prix_unitaire_ht = Number(product.prix_achat_ht || 0)
  line.taux_tva = Number(product.taux_tva || 0)
}

function addLine() {
  form.lignes.push(emptyLine())
}

function removeLine(index) {
  if (form.lignes.length === 1) return toast.error('Le bon doit contenir au moins une ligne.')
  form.lignes.splice(index, 1)
}

function moveLine(index, direction) {
  const target = index + direction
  if (target < 0 || target >= form.lignes.length) return
  const [line] = form.lignes.splice(index, 1)
  form.lignes.splice(target, 0, line)
}

async function saveCommande() {
  saving.value = true
  try {
    const payload = {
      ...form,
      date_livraison_prevue: form.date_livraison_prevue || null,
      entrepot_id: form.entrepot_id || null,
      lignes: form.lignes.map(({ produit_id, quantite, prix_unitaire_ht, taux_tva }) => ({
        produit_id,
        quantite,
        prix_unitaire_ht,
        taux_tva,
      })),
    }

    if (isCreate.value) {
      const { data } = await api.post('/achats/commandes', payload)
      const createdId = data?.id || data?.commande?.id
      toast.success('Bon de commande enregistré.')
      if (createdId) {
        await router.replace({ name: 'achat-commande-detail', params: { id: createdId }, query: { tab: 'fiche' } })
      } else {
        await router.replace({ name: 'achats' })
      }
    } else {
      await api.put(`/achats/commandes/${route.params.id}`, payload)
      toast.success('Bon de commande mis à jour.')
      activeTab.value = 'fiche'
      await router.replace({ query: { ...route.query, tab: 'fiche' } })
      await loadCommande()
    }
  } catch (error) {
    toast.error(Object.values(error.response?.data?.errors || {})[0]?.[0] || error.response?.data?.message || 'Enregistrement impossible.')
  } finally {
    saving.value = false
  }
}

async function runAction(action, message) {
  if (!commande.value?.id) return
  try {
    await api.post(`/achats/commandes/${commande.value.id}/${action}`)
    toast.success(message)
    await loadCommande()
  } catch (error) {
    toast.error(Object.values(error.response?.data?.errors || {})[0]?.[0] || error.response?.data?.message || 'Action impossible.')
  }
}

async function submitCommande() {
  if (await askConfirm({ message: `Soumettre ${commande.value.numero} pour approbation ?`, tone: 'primary' })) {
    await runAction('soumettre', 'Commande soumise.')
  }
}

async function approveCommande() {
  if (await askConfirm({ message: `Approuver ${commande.value.numero} ?`, tone: 'primary' })) {
    await runAction('approuver', 'Commande approuvée.')
  }
}

async function downloadOrderPdf() {
  try {
    await ouvrirPDF(`/achats/commandes/${commande.value.id}/pdf`, `${commande.value.numero}.pdf`)
  } catch (error) {
    toast.error('Impossible de générer le bon de commande PDF.')
  }
}

async function downloadReceptionPdf(reception) {
  try {
    await ouvrirPDF(`/achats/receptions/${reception.id}/pdf`, `${reception.numero}.pdf`)
  } catch (error) {
    toast.error('Impossible de générer le bon de réception PDF.')
  }
}

function availableReturnLines(reception) {
  const returned = new Map()
  for (const retour of reception.retours || []) {
    if (retour.statut !== 'valide') continue
    for (const line of retour.lignes || []) {
      returned.set(Number(line.reception_ligne_id), (returned.get(Number(line.reception_ligne_id)) || 0) + Number(line.quantite || 0))
    }
  }

  return (reception.lignes || []).map((line) => {
    const dejaRetourne = returned.get(Number(line.id)) || 0
    const recu = Number(line.quantite || 0)
    return {
      reception_ligne_id: line.id,
      disponible: Math.max(0, recu - dejaRetourne),
    }
  }).filter((line) => line.disponible > 0.0001)
}

function lineTotal(line) {
  const ht = Number(line.quantite || 0) * Number(line.prix_unitaire_ht || 0)
  return ht * (1 + Number(line.taux_tva || 0) / 100)
}

function money(value) {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Number(value || 0))
}

function number(value) {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 3 }).format(Number(value || 0))
}

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString('fr-FR') : '—'
}

function statusLabel(status) {
  return {
    brouillon: 'Brouillon',
    soumise: 'Soumise',
    approuvee: 'Approuvée',
    partiellement_recue: 'Partiellement reçue',
    recue: 'Reçue',
    annulee: 'Annulée',
  }[status] || status
}

function statusInvoiceLabel(status) {
  return {
    brouillon: 'Brouillon',
    validee: 'Validée',
    partiellement_payee: 'Partiellement payée',
    payee: 'Payée',
    annulee: 'Annulée',
  }[status] || status
}

function qualityLabel(status) {
  return {
    conforme: 'Conforme',
    reserve: 'Avec réserve',
    non_conforme: 'Non conforme',
  }[status] || 'Conforme'
}

function qualityBadge(status) {
  return {
    conforme: 'bg-emerald-100 text-emerald-800',
    reserve: 'bg-amber-100 text-amber-800',
    non_conforme: 'bg-red-100 text-red-700',
  }[status] || 'bg-emerald-100 text-emerald-800'
}

function motifRetourLabel(value) {
  return {
    defectueux: 'Défectueux',
    non_conforme: 'Non conforme',
    excedent: 'Excédent',
    erreur: 'Erreur',
    autre: 'Autre',
  }[value] || value
}

function litigeLabel(status) {
  return {
    ouvert: 'Litige ouvert',
    en_attente_avoir: 'Avoir attendu',
    clos: 'Clos',
  }[status] || 'Litige ouvert'
}

function statusClass(status) {
  return {
    brouillon: 'bg-slate-100 text-slate-700',
    soumise: 'bg-amber-100 text-amber-800',
    approuvee: 'bg-blue-100 text-blue-800',
    partiellement_recue: 'bg-cyan-100 text-cyan-800',
    recue: 'bg-green-100 text-green-800',
    annulee: 'bg-red-100 text-red-700',
  }[status] || 'bg-slate-100 text-slate-700'
}
</script>

<style scoped>
.purchase-kpi {
  border: 1px solid color-mix(in srgb, var(--saytu-primary, #0ea5e9) 16%, var(--saytu-border, #bae6fd));
  border-radius: 1rem;
  background: color-mix(in srgb, var(--saytu-surface, #ffffff) 90%, var(--saytu-primary, #0ea5e9) 10%);
  padding: 0.9rem;
}

.purchase-kpi span {
  display: block;
  color: color-mix(in srgb, var(--saytu-shell-text, #0f172a) 62%, var(--saytu-primary, #0ea5e9));
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.purchase-kpi strong {
  display: block;
  margin-top: 0.35rem;
  color: var(--saytu-shell-text, #0f172a);
  font-size: 1rem;
  font-weight: 950;
}
</style>
