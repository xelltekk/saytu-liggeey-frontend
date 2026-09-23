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
              {{ isCreate ? 'Nouveau devis' : devis?.numero || 'Devis' }}
            </h1>
            <span v-if="devis" class="badge text-xs" :class="statutBadge(devis.statut)">{{ statutLabel(devis.statut) }}</span>
            <span v-if="suivi" class="badge bg-cyan-100 text-cyan-800">{{ suivi.label }}</span>
          </div>
          <p class="mt-1 text-sm text-slate-600">
            <template v-if="isCreate">Saisie en page complète, organisée par onglets.</template>
            <template v-else>
              {{ devis?.client?.nom || 'Client non renseigné' }}
              <span v-if="devis?.client?.email"> · {{ devis.client.email }}</span>
              <span v-if="devis?.objet"> · {{ devis.objet }}</span>
            </template>
          </p>
        </div>

        <div v-if="devis" class="flex flex-wrap gap-2">
          <button type="button" class="btn-secondary" @click="ouvrirPdf">PDF</button>
          <button type="button" class="btn-secondary" @click="setTab('saisie')">Modifier</button>
          <button v-if="canAccepter(devis)" type="button" class="btn-secondary text-emerald-700" :disabled="actionLoading === 'accepter'" @click="changeStatutDevis('accepter')">Accepter</button>
          <button v-if="canRefuser(devis)" type="button" class="btn-secondary text-red-700" :disabled="actionLoading === 'refuser'" @click="changeStatutDevis('refuser')">Refuser</button>
          <button v-if="devis.statut !== 'facture' && devis.statut !== 'refuse'" type="button" class="btn-primary" :disabled="actionLoading === 'convertir'" @click="convertirEnFacture">Convertir en facture</button>
          <button type="button" class="btn-secondary" :disabled="actionLoading === 'cloner'" @click="clonerDevis">Nouvelle version</button>
          <button v-if="canRelancer(devis)" type="button" class="btn-secondary" @click="setTab('suivi')">Relancer</button>
        </div>
      </div>
    </div>

    <div v-if="devis" class="sticky top-2 z-20 rounded-2xl border border-cyan-200 bg-white/95 p-3 shadow-sm backdrop-blur">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="text-sm">
          <span class="font-black text-slate-950">{{ devis.numero }}</span>
          <span class="mx-2 text-slate-300">•</span>
          <span class="text-slate-600">{{ devis.client?.nom || 'Client non renseigné' }}</span>
          <span class="mx-2 text-slate-300">•</span>
          <span class="font-mono font-black text-cyan-700">{{ formatPrice(devis.total_ttc) }} {{ devis.devise || 'XOF' }}</span>
        </div>
        <div class="flex flex-wrap gap-2">
          <button type="button" class="rounded-full border border-cyan-200 px-3 py-1.5 text-xs font-black text-cyan-800 hover:bg-cyan-50" @click="setTab('fiche')">Fiche</button>
          <button type="button" class="rounded-full border border-cyan-200 px-3 py-1.5 text-xs font-black text-cyan-800 hover:bg-cyan-50" @click="setTab('saisie')">Modifier</button>
          <button v-if="canRelancer(devis)" type="button" class="rounded-full border border-orange-200 px-3 py-1.5 text-xs font-black text-orange-800 hover:bg-orange-50" @click="setTab('suivi')">Relancer</button>
          <button v-if="devis.statut !== 'facture' && devis.statut !== 'refuse'" type="button" class="rounded-full bg-cyan-600 px-3 py-1.5 text-xs font-black text-white hover:bg-cyan-700" @click="convertirEnFacture">Convertir</button>
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
          <span v-if="tab.count !== null" class="ml-1 rounded-full bg-white/80 px-2 py-0.5 text-xs">{{ tab.count }}</span>
        </button>
      </div>

      <div v-if="loading" class="p-10 text-center text-slate-500">Chargement...</div>

      <div v-else class="p-4">
        <section v-if="activeTab === 'fiche' && devis" class="space-y-4">
          <div class="grid grid-cols-1 gap-3 lg:grid-cols-4">
            <div class="rounded-xl border border-cyan-100 bg-cyan-50 p-4">
              <div class="text-xs font-black uppercase text-cyan-700">Total TTC</div>
              <div class="mt-2 text-xl font-black text-slate-950">{{ formatPrice(devis.total_ttc) }}</div>
              <p class="text-xs text-slate-600">{{ devis.devise || 'XOF' }}</p>
            </div>
            <div class="rounded-xl border border-sky-100 bg-sky-50 p-4">
              <div class="text-xs font-black uppercase text-sky-700">Validité</div>
              <div class="mt-2 text-xl font-black text-slate-950">{{ formatDate(devis.date_validite) }}</div>
              <p class="text-xs text-slate-600">{{ suivi?.jours_restant ?? '—' }} jour(s) restant(s)</p>
            </div>
            <div class="rounded-xl border border-orange-100 bg-orange-50 p-4">
              <div class="text-xs font-black uppercase text-orange-700">Suivi</div>
              <div class="mt-2 text-xl font-black text-slate-950">{{ suivi?.label || '—' }}</div>
              <p class="text-xs text-slate-600">{{ suivi?.action_recommandee || 'À suivre' }}</p>
            </div>
            <div class="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
              <div class="text-xs font-black uppercase text-emerald-700">Version</div>
              <div class="mt-2 text-xl font-black text-slate-950">V{{ devis.version_numero || 1 }}</div>
              <p class="text-xs text-slate-600">{{ devis.commercial?.name || 'Non affecté' }}</p>
            </div>
          </div>

          <div class="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <div class="rounded-xl border border-cyan-100 bg-white p-4">
              <h2 class="mb-3 font-black text-slate-950">Informations devis</h2>
              <dl class="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                <div><dt class="font-bold text-slate-500">Client</dt><dd class="text-slate-950">{{ devis.client?.nom || '—' }}</dd></div>
                <div><dt class="font-bold text-slate-500">Contact</dt><dd class="text-slate-950">{{ devis.client?.email || devis.client?.telephone || '—' }}</dd></div>
                <div><dt class="font-bold text-slate-500">Date devis</dt><dd class="text-slate-950">{{ formatDate(devis.date_devis) }}</dd></div>
                <div><dt class="font-bold text-slate-500">Réf. client</dt><dd class="text-slate-950">{{ devis.reference_client || '—' }}</dd></div>
                <div class="sm:col-span-2"><dt class="font-bold text-slate-500">Objet</dt><dd class="text-slate-950">{{ devis.objet || '—' }}</dd></div>
                <div class="sm:col-span-2"><dt class="font-bold text-slate-500">Conditions</dt><dd class="whitespace-pre-line text-slate-950">{{ devis.conditions_paiement || '—' }}</dd></div>
              </dl>
            </div>

            <div class="rounded-xl border border-cyan-100 bg-white p-4">
              <h2 class="mb-3 font-black text-slate-950">Contrôle avant envoi</h2>
              <div v-if="controle?.erreurs?.length || controle?.alertes?.length" class="space-y-2 text-sm">
                <div v-for="item in controle.erreurs" :key="`err-${item}`" class="rounded-lg border border-red-200 bg-red-50 p-2 text-red-800">{{ item }}</div>
                <div v-for="item in controle.alertes" :key="`warn-${item}`" class="rounded-lg border border-yellow-200 bg-yellow-50 p-2 text-yellow-800">{{ item }}</div>
              </div>
              <div v-else class="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-bold text-emerald-800">
                Devis cohérent.
              </div>
              <div v-if="controle?.ok?.length" class="mt-3 space-y-1 text-xs text-emerald-700">
                <p v-for="item in controle.ok" :key="`ok-${item}`">✓ {{ item }}</p>
              </div>
            </div>
          </div>
        </section>

        <section v-else-if="activeTab === 'saisie'" class="space-y-4">
          <div v-if="lastSavedAt" class="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-bold text-emerald-800">
            Enregistré à {{ lastSavedAt }}. Vous restez sur cette fiche pour continuer.
          </div>
          <DevisForm
            :key="formKey"
            :devis="devis"
            :client="creatingClient"
            @saved="onSaved"
            @cancel="goBack"
            @dirty-change="formDirty = $event"
          />
        </section>

        <section v-else-if="activeTab === 'lignes' && devis" class="space-y-3">
          <div class="overflow-hidden rounded-xl border border-cyan-100">
            <table class="w-full text-sm">
              <thead class="bg-cyan-50 text-left text-xs uppercase text-cyan-900">
                <tr>
                  <th class="px-3 py-2">Désignation</th>
                  <th class="px-3 py-2 text-right">Qté</th>
                  <th class="px-3 py-2 text-right">P.U. HT</th>
                  <th class="px-3 py-2 text-right">TVA</th>
                  <th class="px-3 py-2 text-right">Total TTC</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-cyan-100">
                <tr v-for="ligne in devis.lignes || []" :key="ligne.id">
                  <td class="px-3 py-2">
                    <div class="font-bold text-slate-950">{{ ligne.designation }}</div>
                    <div v-if="ligne.description" class="text-xs text-slate-500">{{ ligne.description }}</div>
                  </td>
                  <td class="px-3 py-2 text-right">{{ formatQte(ligne.quantite) }} {{ ligne.unite }}</td>
                  <td class="px-3 py-2 text-right">{{ formatPrice(ligne.prix_unitaire_ht) }}</td>
                  <td class="px-3 py-2 text-right">{{ ligne.taux_tva || 0 }}%</td>
                  <td class="px-3 py-2 text-right font-black">{{ formatPrice(ligne.total_ttc) }}</td>
                </tr>
                <tr v-if="!devis.lignes?.length">
                  <td colspan="5" class="px-3 py-8 text-center text-slate-400">Aucune ligne</td>
                </tr>
              </tbody>
            </table>
          </div>
          <button type="button" class="btn-secondary" @click="setTab('saisie')">Modifier les lignes</button>
        </section>

        <section v-else-if="activeTab === 'suivi' && devis" class="grid grid-cols-1 gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <div class="rounded-xl border border-cyan-100 bg-cyan-50 p-4">
            <h2 class="mb-3 font-black text-slate-950">Relance recommandée</h2>
            <p class="text-sm font-semibold text-slate-800">{{ detailData?.relance_auto?.message || 'Aucune recommandation.' }}</p>
            <div class="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div class="rounded-lg bg-white p-3"><span class="block text-slate-500">Urgence</span><strong>{{ detailData?.relance_auto?.urgence || '—' }}</strong></div>
              <div class="rounded-lg bg-white p-3"><span class="block text-slate-500">Canal</span><strong>{{ detailData?.relance_auto?.canal || '—' }}</strong></div>
              <div class="rounded-lg bg-white p-3"><span class="block text-slate-500">Relances</span><strong>{{ suivi?.relance_count || 0 }}</strong></div>
              <div class="rounded-lg bg-white p-3"><span class="block text-slate-500">Dernière</span><strong>{{ formatDateTime(suivi?.last_relance_at) }}</strong></div>
            </div>
            <button type="button" class="btn-primary mt-4 w-full" :disabled="relanceTracking || !canRelancer(devis)" @click="tracerRelanceDevis">
              {{ relanceTracking ? 'Traçage...' : 'Tracer une relance' }}
            </button>
          </div>

          <div class="rounded-xl border border-cyan-100 bg-white p-4">
            <h2 class="mb-3 font-black text-slate-950">Email de relance</h2>
            <p class="text-sm text-slate-600">Destinataire : <strong>{{ detailData?.email_relance?.to || 'Email client absent' }}</strong></p>
            <div class="mt-3 rounded-xl border border-cyan-100 bg-cyan-50/60 p-3 text-sm">
              <p class="font-bold text-slate-900">{{ detailData?.email_relance?.subject }}</p>
              <pre class="mt-2 whitespace-pre-wrap font-sans text-xs text-slate-600">{{ detailData?.email_relance?.body }}</pre>
            </div>
            <EmailActionButtons
              v-if="detailData?.email_relance?.to"
              :draft="detailEmailDraft"
              :filename="`relance-devis-${devis.numero || devis.id}`"
              dialog
              class="mt-3"
            />
          </div>
        </section>

        <section v-else-if="activeTab === 'historique' && devis" class="space-y-3">
          <div v-for="item in detailData?.historique || []" :key="`${item.date}-${item.event}-${item.description}`" class="rounded-xl border border-cyan-100 bg-white p-4">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <p class="font-bold text-slate-900">{{ item.title || item.event }}</p>
              <span class="text-xs text-slate-500">{{ formatDateTime(item.date) }}</span>
            </div>
            <p class="mt-1 text-sm text-slate-600">{{ item.description }}</p>
            <p v-if="item.user_name" class="mt-2 text-xs text-cyan-700">Par {{ item.user_name }}</p>
          </div>
          <p v-if="!(detailData?.historique || []).length" class="rounded-xl border border-dashed border-cyan-200 p-6 text-center text-sm text-slate-400">Aucun historique pour ce devis.</p>
        </section>

        <section v-else-if="activeTab === 'documents' && devis" class="grid gap-4 lg:grid-cols-2">
          <div class="rounded-xl border border-cyan-100 bg-white p-4">
            <h2 class="mb-3 font-black text-slate-950">Versions du devis</h2>
            <div class="space-y-2">
              <button
                v-for="version in detailData?.documents_lies?.versions || []"
                :key="version.id"
                type="button"
                class="flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-sm"
                :class="version.is_current ? 'border-cyan-300 bg-cyan-50' : 'border-cyan-100 hover:bg-cyan-50'"
                @click="openLinkedDevis(version)"
              >
                <span>
                  <strong>{{ version.numero }}</strong>
                  <span class="ml-2 text-xs text-slate-500">V{{ version.version_numero }}</span>
                </span>
                <span class="text-xs font-bold text-cyan-700">{{ statutLabel(version.statut) }}</span>
              </button>
            </div>
          </div>

          <div class="rounded-xl border border-cyan-100 bg-white p-4">
            <h2 class="mb-3 font-black text-slate-950">Factures liées</h2>
            <div class="space-y-2">
              <button
                v-for="facture in detailData?.documents_lies?.factures || []"
                :key="facture.id"
                type="button"
                class="flex w-full items-center justify-between rounded-xl border border-cyan-100 px-3 py-2 text-left text-sm hover:bg-cyan-50"
                @click="router.push({ name: 'facture-detail', params: { id: facture.id } })"
              >
                <span>
                  <strong>{{ facture.numero }}</strong>
                  <span class="ml-2 text-xs text-slate-500">{{ formatDate(facture.date_facture) }}</span>
                </span>
                <span class="font-bold text-cyan-700">{{ formatPrice(facture.total_ttc) }}</span>
              </button>
              <p v-if="!(detailData?.documents_lies?.factures || []).length" class="rounded-xl border border-dashed border-cyan-100 p-4 text-center text-sm text-slate-400">Aucune facture liée.</p>
            </div>
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
import DevisForm from '@/components/DevisForm.vue'
import EmailActionButtons from '@/components/EmailActionButtons.vue'
import { useToast } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth'
import { buildEmailDraft } from '@/utils/emailComposer'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const auth = useAuthStore()

const devis = ref(null)
const detailData = ref(null)
const loading = ref(false)
const activeTab = ref('fiche')
const formDirty = ref(false)
const actionLoading = ref('')
const relanceTracking = ref(false)
const lastSavedAt = ref('')
const creatingClient = ref(null)

const isCreate = computed(() => route.name === 'devis-create')
const isDevisDetailRoute = computed(() => ['devis-create', 'devis-detail'].includes(route.name))
const suivi = computed(() => detailData.value?.suivi_commercial || devis.value?.suivi_commercial || null)
const controle = computed(() => detailData.value?.validation_controle || null)
const formKey = computed(() => isCreate.value
  ? `new-${creatingClient.value?.id || 'none'}`
  : `devis-${devis.value?.id || route.params.id || 'loading'}`)
const detailEmailDraft = computed(() => {
  const email = detailData.value?.email_relance
  if (!email?.to) return buildEmailDraft()
  return buildEmailDraft({
    to: email.to,
    subject: email.subject || '',
    body: email.body || '',
    context_type: 'devis',
    context_id: devis.value?.id,
  })
})

const tabs = computed(() => [
  { key: 'fiche', label: 'Fiche', count: null, create: false },
  { key: 'saisie', label: isCreate.value ? 'Saisie devis' : 'Modifier / lignes', count: null, create: true },
  { key: 'lignes', label: 'Lignes', count: devis.value?.lignes?.length ?? 0, create: false },
  { key: 'suivi', label: 'Relances / suivi', count: suivi.value?.relance_count ?? 0, create: false },
  { key: 'historique', label: 'Historique', count: detailData.value?.historique?.length ?? 0, create: false },
  { key: 'documents', label: 'Documents liés', count: null, create: false },
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
}

async function loadAll() {
  if (!isDevisDetailRoute.value) return

  if (isCreate.value) {
    devis.value = null
    detailData.value = null
    await loadCreatingClient()
    activeTab.value = 'saisie'
    return
  }

  loading.value = true
  try {
    const id = route.params.id
    if (!id) return
    const { data } = await api.get(`/devis/${id}/pilotage`)
    detailData.value = data
    devis.value = data.devis
    activeTab.value = routeTab()
  } catch (err) {
    toast.error(err.response?.data?.message || 'Devis introuvable')
    router.push('/devis')
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

async function onSaved(saved) {
  formDirty.value = false
  if (isCreate.value && saved?.id) {
    await router.replace({ name: 'devis-detail', params: { id: saved.id }, query: { tab: 'saisie' } })
    return
  }
  await loadAll()
  activeTab.value = 'saisie'
  lastSavedAt.value = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

async function ouvrirPdf() {
  if (!devis.value) return
  try {
    await ouvrirPDF(`/devis/${devis.value.id}/pdf`, `${devis.value.numero}.pdf`)
  } catch (e) {
    toast.error('Impossible d’ouvrir le PDF')
  }
}

async function tracerRelanceDevis() {
  if (!devis.value) return
  relanceTracking.value = true
  try {
    await api.post(`/devis/${devis.value.id}/relance`, {
      type_action: 'relance_email',
      commentaire: `Relance préparée depuis la fiche devis ${devis.value.numero || ''}.`,
    })
    toast.success('Relance devis tracée.')
    await loadAll()
    activeTab.value = 'suivi'
  } catch (err) {
    toastError(err, 'Impossible de tracer la relance')
  } finally {
    relanceTracking.value = false
  }
}

async function changeStatutDevis(action) {
  if (!devis.value) return
  actionLoading.value = action
  try {
    await api.post(`/devis/${devis.value.id}/${action}`)
    toast.success(action === 'accepter' ? `Devis ${devis.value.numero} accepté` : `Devis ${devis.value.numero} refusé`)
    await loadAll()
  } catch (err) {
    toastError(err, 'Impossible de modifier le statut du devis')
  } finally {
    actionLoading.value = ''
  }
}

async function convertirEnFacture() {
  if (!devis.value) return
  if (!window.confirm(`Convertir le devis ${devis.value.numero} en facture ?`)) return
  actionLoading.value = 'convertir'
  try {
    const { data } = await api.post(`/devis/${devis.value.id}/convertir-en-facture`)
    toast.success(`Facture ${data.facture?.numero || ''} créée`)
    if (data.facture?.id) {
      router.push({ name: 'facture-detail', params: { id: data.facture.id }, query: { tab: 'saisie' } })
      return
    }
    await loadAll()
  } catch (err) {
    toastError(err, 'Erreur de conversion')
  } finally {
    actionLoading.value = ''
  }
}

async function clonerDevis() {
  if (!devis.value) return
  actionLoading.value = 'cloner'
  try {
    const { data } = await api.post(`/devis/${devis.value.id}/cloner`)
    toast.success(data.message || `Devis ${devis.value.numero} cloné`)
    if (data.devis?.id) {
      router.push({ name: 'devis-detail', params: { id: data.devis.id }, query: { tab: 'saisie' } })
      return
    }
    await loadAll()
  } catch (err) {
    toastError(err, 'Erreur lors du clonage du devis')
  } finally {
    actionLoading.value = ''
  }
}

function openLinkedDevis(version) {
  if (!version?.id) return
  router.push({ name: 'devis-detail', params: { id: version.id }, query: { tab: 'fiche' } })
}

function goBack() {
  router.push('/devis')
}

function toastError(err, fallback) {
  const errors = err.response?.data?.errors || err.response?.data?.validation_controle?.erreurs
  const firstError = Array.isArray(errors) ? errors[0] : errors ? Object.values(errors).flat()[0] : null
  toast.error(firstError || err.response?.data?.message || fallback)
}

function canAccepter(row) {
  return row && !['accepte', 'facture', 'refuse'].includes(row.statut)
}

function canRefuser(row) {
  return row && !['refuse', 'facture', 'accepte'].includes(row.statut)
}

function canRelancer(row) {
  return Boolean(row?.client?.email) && !['facture', 'refuse'].includes(row.statut)
}

function formatPrice(n) { return new Intl.NumberFormat('fr-FR').format(Math.round(n || 0)) }
function formatQte(n) { return parseFloat(n || 0).toLocaleString('fr-FR', { maximumFractionDigits: 3 }) }
function formatDate(d) { return d ? new Date(d).toLocaleDateString('fr-FR') : '–' }
function formatDateTime(d) { return d ? new Date(d).toLocaleString('fr-FR') : '–' }
function statutLabel(statut) {
  return {
    brouillon: 'Brouillon',
    envoye: 'Envoyé',
    accepte: 'Accepté',
    refuse: 'Refusé',
    expire: 'Expiré',
    facture: 'Facturé',
  }[statut] || statut || '–'
}
function statutBadge(statut) {
  return {
    brouillon: 'bg-gray-100 text-gray-700',
    envoye: 'bg-blue-100 text-blue-800',
    accepte: 'bg-green-100 text-green-800',
    refuse: 'bg-red-100 text-red-800',
    expire: 'bg-yellow-100 text-yellow-800',
    facture: 'bg-purple-100 text-purple-800',
  }[statut] || 'bg-gray-100'
}

onMounted(loadAll)

watch(() => route.params.id, loadAll)
watch(() => route.name, loadAll)
watch(() => route.query.tab, () => {
  if (!isDevisDetailRoute.value) return
  activeTab.value = routeTab()
})

onBeforeRouteLeave(() => {
  if (formDirty.value) {
    return window.confirm('Quitter la saisie ? Les modifications non enregistrées seront perdues.')
  }
  return true
})
</script>
