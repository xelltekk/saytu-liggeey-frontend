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
              {{ isCreate ? 'Nouvelle demande d’achat' : demande?.numero || 'Demande d’achat' }}
            </h1>
            <span v-if="demande" class="badge text-xs" :class="demandStatusClass(demande.statut)">
              {{ demandStatusLabel(demande.statut) }}
            </span>
          </div>
          <p class="mt-1 text-sm text-slate-600">
            <template v-if="isCreate">Saisie en page complète, sans fenêtre flottante.</template>
            <template v-else>
              {{ demande?.objet || 'Objet non renseigné' }}
              <span v-if="demande?.demandeur?.name"> · {{ demande.demandeur.name }}</span>
            </template>
          </p>
        </div>

        <div v-if="demande" class="flex flex-wrap gap-2">
          <button v-if="demande.statut === 'brouillon'" type="button" class="btn-secondary" @click="setTab('saisie')">Modifier</button>
          <button v-if="demande.statut === 'brouillon'" type="button" class="btn-primary" @click="submitDemand">Soumettre</button>
          <button v-if="demande.statut === 'soumise' && canApprove" type="button" class="btn-primary" @click="approveDemand">Approuver</button>
          <button v-if="demande.statut === 'soumise' && canApprove" type="button" class="btn-secondary text-red-700" @click="showRejectBox = !showRejectBox">Rejeter</button>
          <button v-if="demande.statut === 'approuvee' && canApprove" type="button" class="btn-primary" @click="setTab('conversion')">Convertir</button>
          <button v-if="demande.commande" type="button" class="btn-secondary" @click="goToCommande(demande.commande)">Voir commande</button>
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

      <div v-else-if="activeTab === 'fiche' && demande" class="space-y-4 p-4">
        <section class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div class="purchase-kpi">
            <span>Demandeur</span>
            <strong>{{ demande.demandeur?.name || '—' }}</strong>
          </div>
          <div class="purchase-kpi">
            <span>Date demande</span>
            <strong>{{ formatDate(demande.date_demande) }}</strong>
          </div>
          <div class="purchase-kpi">
            <span>Date besoin</span>
            <strong>{{ formatDate(demande.date_besoin) }}</strong>
          </div>
          <div class="purchase-kpi">
            <span>Estimation TTC</span>
            <strong>{{ money(demande.montant_estime) }}</strong>
          </div>
        </section>

        <section class="rounded-2xl border border-cyan-100 bg-cyan-50/60 p-4">
          <div class="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
            <div>
              <p class="text-xs font-black uppercase tracking-[0.2em] text-cyan-700">Informations demande</p>
              <h2 class="mt-2 text-xl font-black text-slate-950">{{ demande.objet }}</h2>
              <p class="mt-1 text-sm text-slate-600">
                Service : {{ demande.service_demandeur || 'Non précisé' }} · Priorité :
                <span class="font-bold">{{ priorityLabel(demande.priorite) }}</span>
              </p>
            </div>
            <span class="badge" :class="demandStatusClass(demande.statut)">{{ demandStatusLabel(demande.statut) }}</span>
          </div>
          <p v-if="demande.justification" class="mt-3 whitespace-pre-line text-sm text-slate-600">{{ demande.justification }}</p>
          <p v-if="demande.motif_rejet" class="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
            Motif rejet : {{ demande.motif_rejet }}
          </p>
        </section>

        <section v-if="showRejectBox" class="rounded-2xl border border-red-200 bg-red-50 p-4">
          <form class="space-y-3" @submit.prevent="rejectDemand">
            <div>
              <p class="text-xs font-black uppercase tracking-[0.2em] text-red-700">Rejeter la demande</p>
              <h3 class="mt-1 font-black text-red-950">{{ demande.numero }}</h3>
            </div>
            <label class="field-label text-red-950">
              Motif du rejet
              <textarea v-model="rejectReason" rows="4" class="input" required placeholder="Expliquez pourquoi la demande est rejetée."></textarea>
            </label>
            <div class="flex justify-end gap-2">
              <button type="button" class="btn-secondary" @click="showRejectBox = false">Annuler</button>
              <button class="btn-primary bg-red-600 hover:bg-red-700" :disabled="saving">Confirmer le rejet</button>
            </div>
          </form>
        </section>

        <section class="overflow-hidden rounded-2xl border border-slate-200">
          <div class="border-b border-slate-200 bg-slate-50 px-4 py-3">
            <h3 class="font-black text-slate-900">Produits demandés</h3>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full min-w-[780px]">
              <thead>
                <tr>
                  <th>Produit</th>
                  <th class="text-right">Qté</th>
                  <th class="text-right">Prix estimé HT</th>
                  <th class="text-right">TVA</th>
                  <th class="text-right">Total TTC</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="line in demande.lignes || []" :key="line.id">
                  <td>
                    <strong>{{ line.designation || line.produit?.libelle || 'Produit' }}</strong>
                    <p class="text-xs text-slate-500">{{ line.reference || line.produit?.reference }}</p>
                  </td>
                  <td class="text-right">{{ number(line.quantite) }}</td>
                  <td class="text-right">{{ money(line.prix_estime_ht) }}</td>
                  <td class="text-right">{{ number(line.taux_tva) }}%</td>
                  <td class="text-right font-black">{{ money(line.total_estime_ttc) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <form v-else-if="activeTab === 'saisie'" class="space-y-4 p-4" @submit.prevent="saveDemand">
        <div v-if="referentielsError" class="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {{ referentielsError }}
        </div>

        <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label class="field-label">Date demande<input v-model="form.date_demande" type="date" class="input" required /></label>
          <label class="field-label">Date du besoin<input v-model="form.date_besoin" type="date" class="input" /></label>
          <label class="field-label">Service demandeur<input v-model="form.service_demandeur" class="input" placeholder="Informatique, Stock..." /></label>
          <label class="field-label">Priorité
            <select v-model="form.priorite" class="input">
              <option value="basse">Basse</option>
              <option value="normale">Normale</option>
              <option value="haute">Haute</option>
              <option value="urgente">Urgente</option>
            </select>
          </label>
          <label class="field-label md:col-span-2">Objet<input v-model="form.objet" class="input" required placeholder="Objet du besoin" /></label>
          <label class="field-label md:col-span-2">Justification<textarea v-model="form.justification" rows="2" class="input" placeholder="Pourquoi cet achat est nécessaire"></textarea></label>
        </div>

        <div class="border-y border-slate-200 py-4">
          <div class="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 class="font-bold text-slate-900">Produits demandés</h3>
              <p class="text-sm text-slate-500">Les prix d’achat servent uniquement d’estimation.</p>
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
              <div class="grid items-end gap-2 lg:grid-cols-[minmax(260px,1fr)_110px_150px_150px]">
                <label class="block"><span class="document-line-label">Produit</span>
                  <select v-model.number="line.produit_id" class="input" required @change="selectProduct(line)">
                    <option :value="null">{{ loadingReferentiels ? 'Chargement des produits...' : 'Choisir un produit' }}</option>
                    <option v-for="product in visibleProducts(line)" :key="product.id" :value="product.id">
                      {{ product.reference }} - {{ product.libelle }}
                    </option>
                  </select>
                </label>
                <label class="block"><span class="document-line-label">Quantité</span><input v-model.number="line.quantite" type="number" min="0.001" step="0.001" class="input text-right" required /></label>
                <label class="block"><span class="document-line-label">Prix estimé HT</span><input v-model.number="line.prix_estime_ht" type="number" min="0" step="1" class="input text-right" /></label>
                <div><span class="document-line-label">Estimation TTC</span><div class="document-line-total">{{ money(lineTotal(line)) }}</div></div>
              </div>
            </div>
          </div>
        </div>

        <div class="grid gap-4 md:grid-cols-[1fr_320px]">
          <label class="field-label">Notes / justification détaillée<textarea v-model="form.justification" rows="4" class="input" placeholder="Détails, contexte, urgence..."></textarea></label>
          <div class="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
            <span>Estimation totale</span>
            <strong class="mt-2 block text-2xl text-cyan-700">{{ money(formTotal) }}</strong>
          </div>
        </div>

        <div class="flex justify-end gap-2">
          <button type="button" class="btn-secondary" @click="goBack">Annuler</button>
          <button class="btn-primary" :disabled="saving">{{ saving ? 'Enregistrement...' : 'Enregistrer la demande' }}</button>
        </div>
      </form>

      <form v-else-if="activeTab === 'conversion' && demande" class="space-y-4 p-4" @submit.prevent="convertDemand">
        <div class="rounded-2xl border border-violet-200 bg-violet-50 p-4 text-violet-950">
          <p class="text-xs font-black uppercase tracking-[0.2em] text-violet-700">Conversion en bon de commande</p>
          <h2 class="mt-2 text-xl font-black">{{ demande.numero }} · {{ demande.objet }}</h2>
          <p class="mt-1 text-sm">Estimation : <strong>{{ money(demande.montant_estime) }}</strong></p>
        </div>

        <div class="grid gap-3 md:grid-cols-2">
          <label class="field-label md:col-span-2">Fournisseur
            <select v-model.number="convertForm.fournisseur_id" class="input" required>
              <option :value="null">{{ loadingReferentiels ? 'Chargement...' : 'Choisir un fournisseur' }}</option>
              <option v-for="supplier in referentiels.fournisseurs" :key="supplier.id" :value="supplier.id">
                {{ supplier.code }} - {{ supplier.nom }}
              </option>
            </select>
          </label>
          <label class="field-label">Entrepôt prévu
            <select v-model.number="convertForm.entrepot_id" class="input">
              <option :value="null">À définir</option>
              <option v-for="warehouse in referentiels.entrepots" :key="warehouse.id" :value="warehouse.id">
                {{ warehouse.code }} - {{ warehouse.libelle }}
              </option>
            </select>
          </label>
          <label class="field-label">Date commande<input v-model="convertForm.date_commande" type="date" class="input" required /></label>
          <label class="field-label">Livraison prévue<input v-model="convertForm.date_livraison_prevue" type="date" class="input" /></label>
        </div>

        <div class="flex justify-end gap-2">
          <button type="button" class="btn-secondary" @click="setTab('fiche')">Annuler</button>
          <button class="btn-primary" :disabled="saving">{{ saving ? 'Conversion...' : 'Créer le bon de commande' }}</button>
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
import { hasAnyRole } from '@/utils/access'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const toast = useToast()
const { confirm: askConfirm } = useConfirm()

const demande = ref(null)
const loading = ref(false)
const saving = ref(false)
const loadingReferentiels = ref(false)
const referentielsError = ref('')
const productSearch = ref('')
const activeTab = ref(String(route.query.tab || 'fiche'))
const showRejectBox = ref(false)
const rejectReason = ref('')
const referentiels = reactive({ fournisseurs: [], produits: [], entrepots: [] })
const convertForm = reactive({ fournisseur_id: null, entrepot_id: null, date_commande: new Date().toISOString().slice(0, 10), date_livraison_prevue: '' })

let lineKey = 0
const form = reactive(emptyForm())

const isCreate = computed(() => route.name === 'achat-demande-create')
const canApprove = computed(() => hasAnyRole(auth.user, ['admin', 'gerant', 'comptable']))
const visibleTabs = computed(() => isCreate.value
  ? [{ key: 'saisie', label: 'Saisie demande' }]
  : [
      { key: 'fiche', label: 'Fiche' },
      ...(demande.value?.statut === 'brouillon' ? [{ key: 'saisie', label: 'Saisie demande' }] : []),
      ...(demande.value?.statut === 'approuvee' && canApprove.value ? [{ key: 'conversion', label: 'Conversion BC' }] : []),
    ])
const formTotal = computed(() => form.lignes.reduce((sum, line) => sum + lineTotal(line), 0))

onMounted(async () => {
  await loadReferentiels()
  await loadDemande()
})

watch(() => route.params.id, loadDemande)
watch(() => route.query.tab, (tab) => {
  const next = typeof tab === 'string' ? tab : (isCreate.value ? 'saisie' : 'fiche')
  if (visibleTabs.value.some((item) => item.key === next)) activeTab.value = next
}, { immediate: true })

function emptyLine() {
  return { key: ++lineKey, produit_id: null, quantite: 1, prix_estime_ht: 0, notes: '' }
}

function emptyForm() {
  return {
    date_demande: new Date().toISOString().slice(0, 10),
    date_besoin: '',
    service_demandeur: '',
    objet: '',
    priorite: 'normale',
    justification: '',
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

async function loadDemande() {
  if (isCreate.value) {
    demande.value = null
    Object.assign(form, emptyForm())
    activeTab.value = 'saisie'
    return
  }

  if (route.name !== 'achat-demande-detail' || !route.params.id) return

  loading.value = true
  try {
    const { data } = await api.get(`/achats/demandes/${route.params.id}`)
    demande.value = data
    fillFormFromDemande(data)
    Object.assign(convertForm, {
      fournisseur_id: null,
      entrepot_id: null,
      date_commande: new Date().toISOString().slice(0, 10),
      date_livraison_prevue: data.date_besoin ? String(data.date_besoin).slice(0, 10) : '',
    })
  } catch (error) {
    toast.error(error.response?.data?.message || 'Demande d’achat introuvable.')
    router.replace({ name: 'achats', query: { demandes: 1 } })
  } finally {
    loading.value = false
  }
}

function fillFormFromDemande(row) {
  Object.assign(form, {
    date_demande: row.date_demande ? String(row.date_demande).slice(0, 10) : new Date().toISOString().slice(0, 10),
    date_besoin: row.date_besoin ? String(row.date_besoin).slice(0, 10) : '',
    service_demandeur: row.service_demandeur || '',
    objet: row.objet || '',
    priorite: row.priorite || 'normale',
    justification: row.justification || '',
    lignes: (row.lignes || []).map((line) => ({
      key: ++lineKey,
      produit_id: line.produit_id,
      quantite: Number(line.quantite),
      prix_estime_ht: Number(line.prix_estime_ht),
      notes: line.notes || '',
    })),
  })
  if (!form.lignes.length) form.lignes = [emptyLine()]
}

function setTab(tab) {
  activeTab.value = tab
  router.replace({ query: { ...route.query, tab } })
}

function goBack() {
  router.push({ name: 'achats', query: { demandes: 1 } })
}

function goToCommande(row) {
  if (!row?.id) return
  router.push({ name: 'achat-commande-detail', params: { id: row.id }, query: { tab: 'fiche' } })
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
  line.prix_estime_ht = Number(product.prix_achat_ht || 0)
}

function addLine() {
  form.lignes.push(emptyLine())
}

function removeLine(index) {
  if (form.lignes.length === 1) return toast.error('La demande doit contenir au moins une ligne.')
  form.lignes.splice(index, 1)
}

function moveLine(index, direction) {
  const target = index + direction
  if (target < 0 || target >= form.lignes.length) return
  const [line] = form.lignes.splice(index, 1)
  form.lignes.splice(target, 0, line)
}

function lineTotal(line) {
  const product = referentiels.produits.find((item) => Number(item.id) === Number(line.produit_id))
  return Number(line.quantite || 0) * Number(line.prix_estime_ht || 0) * (1 + Number(product?.taux_tva || 0) / 100)
}

async function saveDemand() {
  saving.value = true
  try {
    const payload = {
      ...form,
      date_besoin: form.date_besoin || null,
      service_demandeur: form.service_demandeur || null,
      justification: form.justification || null,
      lignes: form.lignes.map(({ produit_id, quantite, prix_estime_ht, notes }) => ({
        produit_id,
        quantite,
        prix_estime_ht,
        notes: notes || null,
      })),
    }

    if (isCreate.value) {
      const { data } = await api.post('/achats/demandes', payload)
      toast.success('Demande d’achat enregistrée.')
      await router.replace({ name: 'achat-demande-detail', params: { id: data.id }, query: { tab: 'fiche' } })
    } else {
      await api.put(`/achats/demandes/${route.params.id}`, payload)
      toast.success('Demande d’achat mise à jour.')
      activeTab.value = 'fiche'
      await router.replace({ query: { ...route.query, tab: 'fiche' } })
      await loadDemande()
    }
  } catch (error) {
    toast.error(Object.values(error.response?.data?.errors || {})[0]?.[0] || error.response?.data?.message || 'Enregistrement impossible.')
  } finally {
    saving.value = false
  }
}

async function submitDemand() {
  if (!demande.value?.id) return
  if (!await askConfirm({ message: `Soumettre ${demande.value.numero} pour approbation ?`, tone: 'primary' })) return
  try {
    await api.post(`/achats/demandes/${demande.value.id}/soumettre`)
    toast.success('Demande soumise.')
    await loadDemande()
  } catch (error) {
    toast.error(error.response?.data?.message || 'Soumission impossible.')
  }
}

async function approveDemand() {
  if (!demande.value?.id) return
  if (!await askConfirm({ message: `Approuver ${demande.value.numero} ?`, tone: 'primary' })) return
  try {
    await api.post(`/achats/demandes/${demande.value.id}/approuver`)
    toast.success('Demande approuvée.')
    await loadDemande()
  } catch (error) {
    toast.error(error.response?.data?.message || 'Approbation impossible.')
  }
}

async function rejectDemand() {
  if (!demande.value?.id) return
  saving.value = true
  try {
    await api.post(`/achats/demandes/${demande.value.id}/rejeter`, { motif_rejet: rejectReason.value })
    toast.success('Demande rejetée.')
    showRejectBox.value = false
    rejectReason.value = ''
    await loadDemande()
  } catch (error) {
    toast.error(error.response?.data?.message || 'Rejet impossible.')
  } finally {
    saving.value = false
  }
}

async function convertDemand() {
  if (!demande.value?.id) return
  saving.value = true
  try {
    const { data } = await api.post(`/achats/demandes/${demande.value.id}/convertir`, {
      ...convertForm,
      entrepot_id: convertForm.entrepot_id || null,
      date_livraison_prevue: convertForm.date_livraison_prevue || null,
    })
    toast.success(`Bon de commande ${data.numero} créé en brouillon.`)
    await router.replace({ name: 'achat-commande-detail', params: { id: data.id }, query: { tab: 'fiche' } })
  } catch (error) {
    toast.error(Object.values(error.response?.data?.errors || {})[0]?.[0] || error.response?.data?.message || 'Conversion impossible.')
  } finally {
    saving.value = false
  }
}

function demandStatusLabel(status) {
  return { brouillon: 'Brouillon', soumise: 'Soumise', approuvee: 'Approuvée', rejetee: 'Rejetée', convertie: 'Convertie', annulee: 'Annulée' }[status] || status
}

function demandStatusClass(status) {
  return { brouillon: 'bg-slate-100 text-slate-700', soumise: 'bg-amber-100 text-amber-800', approuvee: 'bg-green-100 text-green-800', rejetee: 'bg-red-100 text-red-700', convertie: 'bg-blue-100 text-blue-800', annulee: 'bg-slate-100 text-slate-500' }[status] || 'bg-slate-100 text-slate-700'
}

function priorityLabel(value) {
  return { basse: 'Basse', normale: 'Normale', haute: 'Haute', urgente: 'Urgente' }[value] || value
}

function money(value) {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Number(value || 0))
}

function number(value) {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 3 }).format(Number(value || 0))
}

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString('fr-FR') : '-'
}
</script>

<style scoped>
.purchase-kpi {
  border: 1px solid color-mix(in srgb, var(--saytu-primary, #0ea5e9) 14%, var(--saytu-border, #e2e8f0));
  border-radius: 1rem;
  background: color-mix(in srgb, var(--saytu-primary, #0ea5e9) 6%, white);
  padding: 1rem;
}

.purchase-kpi span {
  display: block;
  color: #64748b;
  font-size: 0.72rem;
  font-weight: 950;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.purchase-kpi strong {
  display: block;
  color: #0f172a;
  font-weight: 950;
  margin-top: 0.35rem;
}
</style>
