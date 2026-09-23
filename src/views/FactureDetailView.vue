<template>
  <div class="app-surface space-y-4">
    <div class="rounded-2xl border border-sky-200 bg-white p-4 shadow-sm">
      <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <button type="button" class="mb-3 text-sm font-bold text-sky-700 hover:text-sky-900" @click="goBack">
            ← Retour liste
          </button>
          <div class="flex flex-wrap items-center gap-2">
            <h1 class="text-2xl font-black text-slate-950">
              {{ isCreate ? 'Nouvelle facture' : facture?.numero || 'Facture' }}
            </h1>
            <span v-if="facture" class="badge text-xs" :class="statutBadge(facture.statut)">{{ statutLabel(facture.statut) }}</span>
            <span v-if="facture?.type === 'avoir'" class="rounded-full bg-red-50 px-2 py-1 text-xs font-black text-red-700">AVOIR</span>
          </div>
          <p class="mt-1 text-sm text-slate-600">
            <template v-if="isCreate">Saisie en page complète, organisée par onglets.</template>
            <template v-else>
              {{ facture?.client?.nom || 'Client non renseigné' }}
              <span v-if="facture?.client?.email"> · {{ facture.client.email }}</span>
            </template>
          </p>
        </div>

        <div v-if="facture" class="flex flex-wrap gap-2">
          <button type="button" class="btn-secondary" @click="ouvrirPdf">PDF</button>
          <button
            v-if="canValidateInvoices && facture.type !== 'avoir' && facture.statut === 'brouillon'"
            type="button"
            class="btn-secondary"
            :disabled="actionLoading === 'valider'"
            @click="handleValider"
          >
            Valider
          </button>
          <button
            v-if="canValidateInvoices && facture.type !== 'avoir' && ['brouillon', 'validee'].includes(facture.statut)"
            type="button"
            class="btn-primary"
            :disabled="actionLoading === 'envoyer'"
            @click="handleEnvoyer"
          >
            {{ facture.statut === 'brouillon' ? 'Valider + envoyée' : 'Marquer envoyée' }}
          </button>
          <button
            v-if="canManagePayments && facture.type !== 'avoir' && !['brouillon','payee','annulee'].includes(facture.statut)"
            type="button"
            class="btn-primary"
            @click="setTab('paiements')"
          >
            Encaisser
          </button>
        </div>
      </div>
    </div>

    <div class="rounded-2xl border border-sky-200 bg-white shadow-sm">
      <div class="flex flex-wrap gap-1 border-b border-sky-100 px-3 pt-3">
        <button
          v-for="tab in visibleTabs"
          :key="tab.key"
          type="button"
          class="rounded-t-xl px-4 py-2 text-sm font-black transition"
          :class="activeTab === tab.key ? 'bg-sky-100 text-sky-900' : 'text-slate-600 hover:bg-sky-50 hover:text-sky-800'"
          @click="setTab(tab.key)"
        >
          {{ tab.label }}
          <span v-if="tab.count !== null" class="ml-1 rounded-full bg-white/80 px-2 py-0.5 text-xs">{{ tab.count }}</span>
        </button>
      </div>

      <div v-if="loading" class="p-10 text-center text-slate-500">Chargement...</div>

      <div v-else class="p-4">
        <section v-if="activeTab === 'fiche' && facture" class="space-y-4">
          <div class="grid grid-cols-1 gap-3 lg:grid-cols-4">
            <div class="rounded-xl border border-sky-100 bg-sky-50 p-4">
              <div class="text-xs font-black uppercase text-sky-700">Total TTC</div>
              <div class="mt-2 text-xl font-black text-slate-950">{{ formatPrice(facture.total_ttc) }}</div>
              <p class="text-xs text-slate-600">{{ facture.devise || 'XOF' }}</p>
            </div>
            <div class="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
              <div class="text-xs font-black uppercase text-emerald-700">Payé</div>
              <div class="mt-2 text-xl font-black text-slate-950">{{ formatPrice(facture.montant_paye) }}</div>
              <p class="text-xs text-slate-600">{{ pilotage?.analyse_encaissement?.taux_paiement || 0 }}% encaissé</p>
            </div>
            <div class="rounded-xl border border-orange-100 bg-orange-50 p-4">
              <div class="text-xs font-black uppercase text-orange-700">Reste</div>
              <div class="mt-2 text-xl font-black text-slate-950">{{ formatPrice(facture.reste_a_payer) }}</div>
              <p class="text-xs text-slate-600">{{ pilotage?.analyse_encaissement?.jours_retard || 0 }} jour(s) retard</p>
            </div>
            <div class="rounded-xl border border-cyan-100 bg-cyan-50 p-4">
              <div class="text-xs font-black uppercase text-cyan-700">Échéance</div>
              <div class="mt-2 text-xl font-black text-slate-950">{{ formatDate(facture.date_echeance) }}</div>
              <p class="text-xs text-slate-600">{{ facture.commercial?.name || 'Non affectée' }}</p>
            </div>
          </div>

          <div class="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <div class="rounded-xl border border-sky-100 bg-white p-4">
              <h2 class="mb-3 font-black text-slate-950">Informations facture</h2>
              <dl class="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                <div><dt class="font-bold text-slate-500">Client</dt><dd class="text-slate-950">{{ facture.client?.nom || '—' }}</dd></div>
                <div><dt class="font-bold text-slate-500">Contact</dt><dd class="text-slate-950">{{ facture.client?.email || facture.client?.telephone || '—' }}</dd></div>
                <div><dt class="font-bold text-slate-500">Date facture</dt><dd class="text-slate-950">{{ formatDate(facture.date_facture) }}</dd></div>
                <div><dt class="font-bold text-slate-500">Réf. client</dt><dd class="text-slate-950">{{ facture.reference_client || '—' }}</dd></div>
                <div class="sm:col-span-2"><dt class="font-bold text-slate-500">Objet</dt><dd class="text-slate-950">{{ facture.objet || '—' }}</dd></div>
                <div class="sm:col-span-2"><dt class="font-bold text-slate-500">Conditions</dt><dd class="whitespace-pre-line text-slate-950">{{ facture.conditions_paiement || '—' }}</dd></div>
              </dl>
            </div>

            <div class="rounded-xl border border-sky-100 bg-white p-4">
              <h2 class="mb-3 font-black text-slate-950">Contrôle avant validation</h2>
              <div v-if="controle?.erreurs?.length || controle?.alertes?.length" class="space-y-2 text-sm">
                <div v-for="item in controle.erreurs" :key="`err-${item}`" class="rounded-lg border border-red-200 bg-red-50 p-2 text-red-800">{{ item }}</div>
                <div v-for="item in controle.alertes" :key="`warn-${item}`" class="rounded-lg border border-yellow-200 bg-yellow-50 p-2 text-yellow-800">{{ item }}</div>
              </div>
              <div v-else class="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-bold text-emerald-800">
                Facture cohérente.
              </div>
            </div>
          </div>
        </section>

        <section v-else-if="activeTab === 'saisie'" class="space-y-4">
          <FactureForm
            :key="formKey"
            :facture="facture"
            :client="creatingClient"
            @saved="onSaved"
            @cancel="goBack"
            @dirty-change="formDirty = $event"
          />
        </section>

        <section v-else-if="activeTab === 'lignes' && facture" class="space-y-3">
          <div class="overflow-hidden rounded-xl border border-sky-100">
            <table class="w-full text-sm">
              <thead class="bg-sky-50 text-left text-xs uppercase text-sky-900">
                <tr>
                  <th class="px-3 py-2">Désignation</th>
                  <th class="px-3 py-2 text-right">Qté</th>
                  <th class="px-3 py-2 text-right">P.U. HT</th>
                  <th class="px-3 py-2 text-right">TVA</th>
                  <th class="px-3 py-2 text-right">Total TTC</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-sky-100">
                <tr v-for="ligne in facture.lignes || []" :key="ligne.id">
                  <td class="px-3 py-2">
                    <div class="font-bold text-slate-950">{{ ligne.designation }}</div>
                    <div v-if="ligne.description" class="text-xs text-slate-500">{{ ligne.description }}</div>
                  </td>
                  <td class="px-3 py-2 text-right">{{ formatQte(ligne.quantite) }} {{ ligne.unite }}</td>
                  <td class="px-3 py-2 text-right">{{ formatPrice(ligne.prix_unitaire_ht) }}</td>
                  <td class="px-3 py-2 text-right">{{ ligne.taux_tva || 0 }}%</td>
                  <td class="px-3 py-2 text-right font-black">{{ formatPrice(ligne.total_ttc) }}</td>
                </tr>
                <tr v-if="!facture.lignes?.length">
                  <td colspan="5" class="px-3 py-8 text-center text-slate-400">Aucune ligne</td>
                </tr>
              </tbody>
            </table>
          </div>
          <button type="button" class="btn-secondary" @click="setTab('saisie')">Modifier les lignes</button>
        </section>

        <section v-else-if="activeTab === 'paiements' && facture" class="grid grid-cols-1 gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <div class="rounded-xl border border-sky-100 bg-sky-50 p-4">
            <h2 class="mb-3 font-black text-slate-950">Encaisser depuis la facture</h2>
            <div v-if="!canEncaisser" class="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-900">
              La facture doit être validée/envoyée et non soldée pour être encaissée.
            </div>
            <form v-else class="space-y-3" @submit.prevent="handleEncaisser">
              <div class="grid grid-cols-3 gap-2 text-sm">
                <div class="rounded-lg bg-white p-3"><div class="text-[10px] font-black uppercase text-sky-700">Total</div><div class="font-black">{{ formatPrice(facture.total_ttc) }}</div></div>
                <div class="rounded-lg bg-white p-3"><div class="text-[10px] font-black uppercase text-emerald-700">Payé</div><div class="font-black">{{ formatPrice(facture.montant_paye) }}</div></div>
                <div class="rounded-lg bg-white p-3"><div class="text-[10px] font-black uppercase text-orange-700">Reste</div><div class="font-black">{{ formatPrice(facture.reste_a_payer) }}</div></div>
              </div>
              <label class="block text-sm font-bold text-slate-700">
                Montant encaissé
                <input v-model.number="encaissementForm.montant" type="number" min="0.01" step="0.01" class="input mt-1" required />
              </label>
              <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label class="block text-sm font-bold text-slate-700">
                  Mode
                  <select v-model="encaissementForm.mode_paiement" class="input mt-1">
                    <option value="especes">Espèces</option>
                    <option value="virement">Virement</option>
                    <option value="cheque">Chèque</option>
                    <option value="wave">Wave</option>
                    <option value="orange_money">Orange Money</option>
                    <option value="free_money">Free Money</option>
                    <option value="carte_bancaire">Carte bancaire</option>
                    <option value="compensation">Compensation</option>
                    <option value="autre">Autre</option>
                  </select>
                </label>
                <label class="block text-sm font-bold text-slate-700">
                  Date
                  <input v-model="encaissementForm.date_paiement" type="date" class="input mt-1" />
                </label>
              </div>
              <input v-model="encaissementForm.reference_paiement" type="text" class="input" placeholder="Référence paiement" />
              <textarea v-model="encaissementForm.notes" rows="2" class="input" placeholder="Notes internes"></textarea>
              <button type="submit" class="btn-primary" :disabled="encaissementLoading">
                {{ encaissementLoading ? 'Enregistrement...' : 'Enregistrer paiement' }}
              </button>
            </form>
          </div>

          <div class="rounded-xl border border-sky-100 bg-white p-4">
            <h2 class="mb-3 font-black text-slate-950">Paiements enregistrés</h2>
            <div v-if="pilotage?.paiements?.length" class="space-y-2">
              <div v-for="paiement in pilotage.paiements" :key="paiement.id" class="rounded-lg bg-slate-50 p-3 text-sm">
                <div class="flex items-center justify-between gap-3">
                  <div class="font-black text-slate-950">{{ paiement.reference }}</div>
                  <div class="font-mono font-black text-emerald-700">{{ formatPrice(paiement.montant) }}</div>
                </div>
                <div class="text-xs text-slate-500">{{ formatDate(paiement.date_paiement) }} · {{ modePaiementLabel(paiement.mode_paiement) }}</div>
              </div>
            </div>
            <p v-else class="text-sm text-slate-500">Aucun paiement enregistré.</p>
          </div>
        </section>

        <section v-else-if="activeTab === 'suivi' && facture" class="grid grid-cols-1 gap-4 xl:grid-cols-[0.8fr_1.2fr]">
          <div class="rounded-xl border border-sky-100 bg-sky-50 p-4">
            <h2 class="mb-3 font-black text-slate-950">Relance client</h2>
            <p class="mb-3 text-sm text-slate-600">{{ pilotage?.relance_auto?.message || 'Aucune recommandation.' }}</p>
            <div class="flex flex-wrap gap-2">
              <EmailActionButtons
                v-if="canRelancer(facture)"
                :draft="relanceFactureEmailDraft(facture)"
                :filename="`relance-facture-${facture.numero || facture.id}`"
                dialog
                compact
              />
              <button type="button" class="btn-secondary" :disabled="tracingRelance || !canRelancer(facture)" @click="handleTracerRelance">
                Tracer relance
              </button>
            </div>
          </div>
          <div class="rounded-xl border border-sky-100 bg-white p-4">
            <h2 class="mb-3 font-black text-slate-950">Historique relances</h2>
            <div v-if="pilotage?.recouvrements?.length" class="space-y-2">
              <div v-for="suivi in pilotage.recouvrements" :key="suivi.id" class="rounded-lg bg-slate-50 p-3 text-sm">
                <div class="font-black text-slate-950">{{ actionLabel(suivi.type_action) }}</div>
                <div class="text-xs text-slate-500">{{ formatDateTime(suivi.date_action) }} · {{ suivi.user?.name || '—' }}</div>
                <p v-if="suivi.commentaire" class="mt-1 text-slate-600">{{ suivi.commentaire }}</p>
              </div>
            </div>
            <p v-else class="text-sm text-slate-500">Aucune relance tracée.</p>
          </div>
        </section>

        <section v-else-if="activeTab === 'historique' && facture" class="space-y-2">
          <div v-if="pilotage?.historique?.length" class="space-y-2">
            <div v-for="(item, index) in pilotage.historique" :key="`${item.type}-${index}`" class="rounded-xl border border-sky-100 bg-white p-3 text-sm">
              <div class="font-black text-slate-950">{{ item.titre }}</div>
              <div class="text-xs text-slate-500">{{ formatDateTime(item.date) }} · {{ item.utilisateur || 'Système' }}</div>
              <p v-if="item.detail" class="mt-1 text-slate-600">{{ item.detail }}</p>
            </div>
          </div>
          <p v-else class="text-sm text-slate-500">Aucun historique disponible.</p>
        </section>

        <section v-else-if="activeTab === 'documents' && facture" class="space-y-3">
          <div class="rounded-xl border border-sky-100 bg-sky-50 p-4">
            <h2 class="mb-2 font-black text-slate-950">Documents facture</h2>
            <p class="mb-3 text-sm text-slate-600">PDF, reçu et documents associés à cette facture.</p>
            <button type="button" class="btn-primary" @click="ouvrirPdf">Ouvrir PDF facture</button>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import api from '@/services/api'
import { ouvrirPDF } from '@/services/pdf'
import FactureForm from '@/components/FactureForm.vue'
import EmailActionButtons from '@/components/EmailActionButtons.vue'
import { useToast } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth'
import { buildEmailDraft } from '@/utils/emailComposer'
import { hasAnyRole } from '@/utils/access'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const auth = useAuthStore()

const facture = ref(null)
const pilotage = ref(null)
const creatingClient = ref(null)
const loading = ref(false)
const activeTab = ref('fiche')
const formDirty = ref(false)
const actionLoading = ref('')
const encaissementLoading = ref(false)
const tracingRelance = ref(false)

const encaissementForm = reactive({
  montant: null,
  mode_paiement: 'especes',
  date_paiement: new Date().toISOString().slice(0, 10),
  reference_paiement: '',
  notes: '',
})

const isCreate = computed(() => route.name === 'facture-create')
const isInvoiceDetailRoute = computed(() => ['facture-create', 'facture-detail'].includes(route.name))
const formKey = computed(() => isCreate.value
  ? `new-${creatingClient.value?.id || 'none'}`
  : `facture-${facture.value?.id || route.params.id || 'loading'}`)
const canManagePayments = computed(() => hasAnyRole(auth.user, ['admin', 'gerant', 'comptable']))
const canValidateInvoices = computed(() => hasAnyRole(auth.user, ['admin', 'gerant', 'commercial']))
const controle = computed(() => facture.value?.validation_controle || pilotage.value?.validation_controle || null)
const canEncaisser = computed(() => facture.value
  && canManagePayments.value
  && facture.value.type !== 'avoir'
  && !['brouillon', 'payee', 'annulee'].includes(facture.value.statut)
  && parseFloat(facture.value.reste_a_payer || 0) > 0)

const tabs = computed(() => [
  { key: 'fiche', label: 'Fiche', count: null, create: false },
  { key: 'saisie', label: isCreate.value ? 'Saisie facture' : 'Modifier / lignes', count: null, create: true },
  { key: 'lignes', label: 'Lignes', count: facture.value?.lignes?.length ?? 0, create: false },
  { key: 'paiements', label: 'Paiements', count: pilotage.value?.paiements?.length ?? 0, create: false },
  { key: 'suivi', label: 'Relances / suivi', count: pilotage.value?.recouvrements?.length ?? 0, create: false },
  { key: 'historique', label: 'Historique', count: pilotage.value?.historique?.length ?? 0, create: false },
  { key: 'documents', label: 'Documents PDF', count: null, create: false },
])
const visibleTabs = computed(() => tabs.value.filter(tab => tab.create || !isCreate.value))

function routeTab() {
  const tab = typeof route.query.tab === 'string' ? route.query.tab : ''
  if (visibleTabs.value.some(t => t.key === tab)) return tab
  return isCreate.value ? 'saisie' : 'fiche'
}

function setTab(tab) {
  activeTab.value = tab
  router.replace({ query: { ...route.query, tab } })
  if (tab === 'paiements') resetEncaissementForm()
}

async function loadAll() {
  if (!isInvoiceDetailRoute.value) return

  if (isCreate.value) {
    facture.value = null
    pilotage.value = null
    await loadCreatingClient()
    activeTab.value = 'saisie'
    return
  }

  loading.value = true
  try {
    const id = route.params.id
    if (!id) return

    const [factureResp, pilotageResp] = await Promise.all([
      api.get(`/factures/${id}`),
      api.get(`/factures/${id}/pilotage`),
    ])
    facture.value = factureResp.data
    pilotage.value = pilotageResp.data
    resetEncaissementForm()
    activeTab.value = routeTab()
  } catch (err) {
    toast.error(err.response?.data?.message || 'Facture introuvable')
    router.push('/factures')
  } finally {
    loading.value = false
  }
}

async function loadCreatingClient() {
  creatingClient.value = null
  const clientId = route.query.client_id
  if (!clientId) return
  try {
    const { data } = await api.get(`/clients/${parseInt(clientId)}`)
    creatingClient.value = data
  } catch (e) {
    toast.error('Client introuvable')
  }
}

function resetEncaissementForm() {
  encaissementForm.montant = Math.max(parseFloat(facture.value?.reste_a_payer || 0), 0)
  encaissementForm.mode_paiement = 'especes'
  encaissementForm.date_paiement = new Date().toISOString().slice(0, 10)
  encaissementForm.reference_paiement = ''
  encaissementForm.notes = ''
}

async function onSaved(saved) {
  formDirty.value = false
  if (isCreate.value && saved?.id) {
    await router.replace({ name: 'facture-detail', params: { id: saved.id }, query: { tab: 'fiche' } })
    return
  }
  await loadAll()
  activeTab.value = 'fiche'
}

async function handleValider() {
  if (!facture.value) return
  actionLoading.value = 'valider'
  try {
    await api.post(`/factures/${facture.value.id}/valider`)
    toast.success(`Facture ${facture.value.numero} validée`)
    await loadAll()
  } catch (err) {
    toastError(err, 'Erreur lors de la validation')
  } finally {
    actionLoading.value = ''
  }
}

async function handleEnvoyer() {
  if (!facture.value) return
  actionLoading.value = 'envoyer'
  try {
    const { data } = await api.post(`/factures/${facture.value.id}/envoyer`)
    toast.success(data.message || 'Facture marquée envoyée')
    await loadAll()
  } catch (err) {
    toastError(err, 'Erreur lors du changement de statut')
  } finally {
    actionLoading.value = ''
  }
}

async function handleEncaisser() {
  if (!facture.value) return
  encaissementLoading.value = true
  try {
    const { data } = await api.post(`/factures/${facture.value.id}/encaisser`, {
      montant: encaissementForm.montant,
      mode_paiement: encaissementForm.mode_paiement,
      date_paiement: encaissementForm.date_paiement || undefined,
      reference_paiement: encaissementForm.reference_paiement || undefined,
      notes: encaissementForm.notes || undefined,
    })
    toast.success(data.message || 'Paiement enregistré')
    await loadAll()
    activeTab.value = 'paiements'
  } catch (err) {
    toastError(err, 'Erreur lors de l’encaissement')
  } finally {
    encaissementLoading.value = false
  }
}

async function handleTracerRelance() {
  if (!facture.value) return
  tracingRelance.value = true
  try {
    const { data } = await api.post(`/recouvrement/factures/${facture.value.id}/suivis`, {
      statut: 'relance',
      type_action: 'relance_email',
      commentaire: `Relance préparée pour la facture ${facture.value.numero}.`,
      prochain_rappel: pilotage.value?.relance_auto?.prochain_rappel_suggere || undefined,
    })
    toast.success(data.message || 'Relance tracée')
    await loadAll()
    activeTab.value = 'suivi'
  } catch (err) {
    toastError(err, 'Erreur lors du traçage de la relance')
  } finally {
    tracingRelance.value = false
  }
}

async function ouvrirPdf() {
  if (!facture.value) return
  try {
    await ouvrirPDF(`/factures/${facture.value.id}/pdf`, `${facture.value.numero}.pdf`)
  } catch (e) {
    toast.error('Impossible d’ouvrir le PDF')
  }
}

function goBack() {
  router.push('/factures')
}

function toastError(err, fallback) {
  const errors = err.response?.data?.errors || err.response?.data?.validation_controle?.erreurs
  const firstError = Array.isArray(errors) ? errors[0] : errors ? Object.values(errors).flat()[0] : null
  toast.error(firstError || err.response?.data?.message || fallback)
}

function formatPrice(n) { return new Intl.NumberFormat('fr-FR').format(Math.round(n || 0)) }
function formatQte(n) { return parseFloat(n || 0).toLocaleString('fr-FR', { maximumFractionDigits: 3 }) }
function formatDate(d) { return d ? new Date(d).toLocaleDateString('fr-FR') : '–' }
function formatDateTime(d) { return d ? new Date(d).toLocaleString('fr-FR') : '–' }
function statutLabel(s) {
  return {
    brouillon: 'Brouillon',
    validee: 'Validée',
    envoyee: 'Envoyée',
    partiellement_payee: 'Partiel.',
    payee: 'Payée',
    impayee: 'Impayée',
    annulee: 'Annulée',
  }[s] || s
}
function statutBadge(s) {
  return {
    brouillon: 'bg-gray-100 text-gray-700',
    validee: 'bg-blue-100 text-blue-800',
    envoyee: 'bg-indigo-100 text-indigo-800',
    partiellement_payee: 'bg-yellow-100 text-yellow-800',
    payee: 'bg-green-100 text-green-800',
    impayee: 'bg-orange-100 text-orange-800',
    annulee: 'bg-red-100 text-red-800',
  }[s] || 'bg-gray-100'
}
function modePaiementLabel(mode) {
  return {
    especes: 'Espèces',
    cheque: 'Chèque',
    virement: 'Virement',
    carte_bancaire: 'Carte bancaire',
    mobile_money: 'Mobile money',
    wave: 'Wave',
    orange_money: 'Orange Money',
    free_money: 'Free Money',
    compensation: 'Compensation',
    autre: 'Autre',
  }[mode] || mode || 'Paiement'
}
function actionLabel(action) {
  return {
    note: 'Note',
    relance_email: 'Relance email',
    appel: 'Appel',
    whatsapp: 'WhatsApp',
    promesse_paiement: 'Promesse de paiement',
    litige: 'Litige',
    paiement_recu: 'Paiement reçu',
    cloture: 'Clôture',
  }[action] || action || 'Suivi'
}
function canRelancer(f) {
  return Boolean(f?.client?.email)
    && f.type !== 'avoir'
    && !['payee', 'annulee', 'brouillon'].includes(f.statut)
    && parseFloat(f.reste_a_payer || 0) > 0
}
function relanceFactureEmailDraft(f) {
  const client = f.client || {}
  if (!client.email) return buildEmailDraft()
  const reste = parseFloat(f.reste_a_payer || 0)
  return buildEmailDraft({
    to: client.email,
    subject: `Relance facture ${f.numero || ''} - ${client.nom || ''}`.trim(),
    body: [
      `Bonjour${client.nom ? ` ${client.nom}` : ''},`,
      '',
      `Nous revenons vers vous concernant la facture ${f.numero || ''}${f.objet ? ` (${f.objet})` : ''}.`,
      `Date facture : ${formatDate(f.date_facture)}.`,
      `Échéance : ${formatDate(f.date_echeance)}.`,
      `Montant total : ${formatPrice(f.total_ttc)}.`,
      reste > 0 ? `Reste à payer : ${formatPrice(reste)}.` : '',
      '',
      'Pouvez-vous nous confirmer la date de règlement prévue ?',
      '',
      'Cordialement,',
      auth.user?.name || 'XELLTEKK',
    ].filter(Boolean).join('\n'),
    context_type: 'facture',
    context_id: f.id,
  })
}

onMounted(loadAll)

watch(() => route.params.id, loadAll)
watch(() => route.name, loadAll)
watch(() => route.query.tab, () => {
  if (!isInvoiceDetailRoute.value) return
  activeTab.value = routeTab()
})

onBeforeRouteLeave(() => {
  if (formDirty.value) {
    return window.confirm('Quitter la saisie ? Les modifications non enregistrées seront perdues.')
  }
  return true
})
</script>
