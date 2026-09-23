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
              {{ isCreate ? 'Nouveau client' : client?.nom || 'Client' }}
            </h1>
            <span v-if="client?.code" class="rounded-full bg-cyan-50 px-3 py-1 font-mono text-xs font-bold text-cyan-700">{{ client.code }}</span>
            <span v-if="client" class="badge" :class="typeBadgeClass(client.type)">{{ typeLabel(client.type) }}</span>
            <span v-if="client" class="badge" :class="statutBadgeClass(client.statut)">{{ client.statut }}</span>
          </div>
          <p class="mt-1 text-sm text-slate-600">
            <template v-if="isCreate">Saisie client en page complète, organisée par onglets.</template>
            <template v-else>
              {{ client?.secteur_activite || 'Secteur non renseigné' }}
              <span v-if="client?.commercial?.name"> · Commercial : {{ client.commercial.name }}</span>
            </template>
          </p>
        </div>

        <div v-if="client" class="flex flex-wrap gap-2">
          <button v-if="canSellTo(client)" type="button" class="btn-primary" @click="creerDevis">+ Devis</button>
          <button v-if="canSellTo(client)" type="button" class="btn-secondary" @click="creerFacture">+ Facture</button>
          <button type="button" class="btn-secondary" @click="creerPaiement">+ Paiement</button>
          <button type="button" class="btn-secondary" @click="ouvrirSituationClientPdf">Situation PDF</button>
          <button type="button" class="btn-secondary" @click="setTab('saisie')">Modifier</button>
        </div>
      </div>
    </div>

    <div v-if="client" class="sticky top-2 z-20 rounded-2xl border border-cyan-200 bg-white/95 p-3 shadow-sm backdrop-blur">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="text-sm">
          <span class="font-black text-slate-950">{{ client.code }}</span>
          <span class="mx-2 text-slate-300">•</span>
          <span class="text-slate-600">{{ client.nom }}</span>
          <span class="mx-2 text-slate-300">•</span>
          <span class="font-mono font-black text-amber-700">Reste {{ formatPrice(summary.reste_a_payer) }}</span>
        </div>
        <div class="flex flex-wrap gap-2">
          <button type="button" class="rounded-full border border-cyan-200 px-3 py-1.5 text-xs font-black text-cyan-800 hover:bg-cyan-50" @click="setTab('fiche')">Fiche</button>
          <button type="button" class="rounded-full border border-cyan-200 px-3 py-1.5 text-xs font-black text-cyan-800 hover:bg-cyan-50" @click="setTab('saisie')">Modifier</button>
          <button type="button" class="rounded-full border border-orange-200 px-3 py-1.5 text-xs font-black text-orange-800 hover:bg-orange-50" @click="setTab('situation')">Situation</button>
          <EmailActionButtons
            v-if="client.email"
            :draft="relanceDraftForClient(client)"
            :filename="`relance-client-${client.code || client.id}`"
            dialog
            compact
          />
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
        <section v-if="activeTab === 'fiche' && client" class="space-y-4">
          <div class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div class="client-card">
              <div class="text-xs font-black uppercase text-cyan-700">CA total</div>
              <div class="mt-2 text-xl font-black text-slate-950">{{ formatPrice(summary.ca_total) }}</div>
              <p class="text-xs text-slate-600">{{ summary.factures_count || 0 }} facture(s)</p>
            </div>
            <div class="client-card">
              <div class="text-xs font-black uppercase text-amber-700">Reste à payer</div>
              <div class="mt-2 text-xl font-black text-slate-950">{{ formatPrice(summary.reste_a_payer) }}</div>
              <p class="text-xs text-slate-600">{{ summary.factures_impayees_count || 0 }} facture(s) impayée(s)</p>
            </div>
            <div class="client-card">
              <div class="text-xs font-black uppercase text-rose-700">Retard</div>
              <div class="mt-2 text-xl font-black text-slate-950">{{ formatPrice(summary.retard_total) }}</div>
              <p class="text-xs text-slate-600">{{ summary.factures_retard_count || 0 }} facture(s)</p>
            </div>
            <div class="client-card">
              <div class="text-xs font-black uppercase text-blue-700">Crédit disponible</div>
              <div class="mt-2 text-xl font-black text-slate-950">{{ formatPrice(summary.credit_disponible) }}</div>
              <p class="text-xs text-slate-600">Plafond : {{ formatPrice(summary.plafond_credit) }}</p>
            </div>
          </div>

          <div class="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <div class="rounded-xl border border-cyan-100 bg-white p-4">
              <h2 class="mb-3 font-black text-slate-950">Informations client</h2>
              <dl class="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                <div><dt class="font-bold text-slate-500">Nom</dt><dd class="text-slate-950">{{ client.nom || '—' }}</dd></div>
                <div><dt class="font-bold text-slate-500">Contact</dt><dd class="text-slate-950">{{ client.email || client.telephone || client.mobile || '—' }}</dd></div>
                <div><dt class="font-bold text-slate-500">Adresse</dt><dd class="text-slate-950">{{ [client.adresse, client.ville, client.pays].filter(Boolean).join(', ') || '—' }}</dd></div>
                <div><dt class="font-bold text-slate-500">Fiscalité</dt><dd class="text-slate-950">NINEA {{ client.ninea || '—' }} · RCCM {{ client.rccm || '—' }}</dd></div>
                <div><dt class="font-bold text-slate-500">Délai paiement</dt><dd class="text-slate-950">{{ client.delai_paiement_jours || 0 }} jours</dd></div>
                <div><dt class="font-bold text-slate-500">Plafond crédit</dt><dd class="text-slate-950">{{ formatPrice(client.plafond_credit) }}</dd></div>
                <div class="sm:col-span-2"><dt class="font-bold text-slate-500">Notes publiques</dt><dd class="whitespace-pre-line text-slate-950">{{ client.notes_publiques || '—' }}</dd></div>
              </dl>
            </div>

            <div class="rounded-xl border border-cyan-100 bg-white p-4">
              <h2 class="mb-3 font-black text-slate-950">Actions rapides</h2>
              <div class="grid grid-cols-2 gap-2">
                <button v-if="canSellTo(client)" type="button" class="quick-client-btn" @click="creerDevis">+ Devis</button>
                <button v-if="canSellTo(client)" type="button" class="quick-client-btn" @click="creerFacture">+ Facture</button>
                <button type="button" class="quick-client-btn" @click="creerPaiement">+ Paiement</button>
                <button type="button" class="quick-client-btn" @click="creerRdv">+ Rendez-vous</button>
                <button type="button" class="quick-client-btn" @click="creerIntervention">+ Intervention</button>
                <button type="button" class="quick-client-btn" @click="ouvrirSituationClientPdf">Situation PDF</button>
              </div>
            </div>
          </div>
        </section>

        <section v-else-if="activeTab === 'saisie'" class="space-y-4">
          <div v-if="lastSavedAt" class="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-bold text-emerald-800">
            Enregistré à {{ lastSavedAt }}. Vous restez sur cette fiche pour continuer.
          </div>
          <ClientForm
            :key="formKey"
            :client="client"
            @saved="onSaved"
            @cancel="goBack"
          />
        </section>

        <section v-else-if="activeTab === 'situation' && client" class="space-y-4">
          <div class="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-6">
            <div class="client-mini-stat"><span>Total facturé</span><strong>{{ formatPrice(situation.total_facture) }}</strong></div>
            <div class="client-mini-stat"><span>Total payé</span><strong class="text-emerald-700">{{ formatPrice(situation.total_paye) }}</strong></div>
            <div class="client-mini-stat"><span>Reste dû</span><strong class="text-amber-700">{{ formatPrice(situation.reste_du) }}</strong></div>
            <div class="client-mini-stat"><span>En retard</span><strong class="text-rose-700">{{ formatPrice(situation.montant_retard) }}</strong></div>
            <div class="client-mini-stat"><span>Partielles</span><strong class="text-blue-700">{{ situation.factures_partielles_count || 0 }}</strong></div>
            <div class="client-mini-stat"><span>Échéance</span><strong>{{ nextDueLabel(situation.prochaine_echeance) }}</strong></div>
          </div>

          <div class="overflow-hidden rounded-xl border border-cyan-100">
            <div class="bg-cyan-50 px-3 py-2 text-xs font-bold uppercase text-cyan-800">Factures ouvertes</div>
            <div v-if="situation.factures_impayees?.length" class="divide-y divide-cyan-100">
              <article v-for="facture in situation.factures_impayees" :key="facture.id" class="grid gap-2 px-3 py-3 text-sm lg:grid-cols-[1fr_auto_auto]">
                <div>
                  <button type="button" class="font-mono font-bold text-cyan-700 hover:underline" @click="router.push({ name: 'facture-detail', params: { id: facture.id } })">
                    {{ facture.numero }}
                  </button>
                  <div class="text-xs text-slate-500">Échéance {{ formatDate(facture.date_echeance) }} · {{ facture.statut }}</div>
                </div>
                <div class="text-left lg:text-right">
                  <div class="font-semibold text-slate-600">Payé {{ formatPrice(facture.montant_paye) }}</div>
                  <div class="font-black text-amber-700">Reste {{ formatPrice(facture.reste_a_payer) }}</div>
                </div>
                <button type="button" class="mini-action-btn" @click="ouvrirFacturePdf(facture)">PDF</button>
              </article>
            </div>
            <div v-else class="p-4 text-center text-sm text-slate-400">Aucune facture ouverte.</div>
          </div>
        </section>

        <section v-else-if="activeTab === 'alertes' && client" class="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <ClientListPanel title="Factures en retard" :items="client.alertes?.factures_en_retard || []" empty="Aucune facture en retard">
            <template #default="{ item }">
              <div class="font-mono font-semibold">{{ item.numero }}</div>
              <div class="text-xs text-slate-500">Échéance {{ formatDate(item.date_echeance) }}</div>
              <div class="font-mono text-sm font-bold text-rose-700">{{ formatPrice(item.reste_a_payer) }}</div>
            </template>
          </ClientListPanel>
          <ClientListPanel title="Devis à relancer" :items="client.alertes?.devis_a_relancer || []" empty="Aucun devis proche de l’échéance">
            <template #default="{ item }">
              <button type="button" class="font-mono font-semibold text-cyan-700 hover:underline" @click="router.push({ name: 'devis-detail', params: { id: item.id } })">{{ item.numero }}</button>
              <div class="text-xs text-slate-500">Validité {{ formatDate(item.date_validite) }}</div>
              <div class="font-mono text-sm font-bold text-blue-700">{{ formatPrice(item.total_ttc) }}</div>
            </template>
          </ClientListPanel>
          <ClientListPanel title="Interventions ouvertes" :items="client.alertes?.interventions_ouvertes || []" empty="Aucune intervention ouverte">
            <template #default="{ item }">
              <div class="font-mono font-semibold">{{ item.reference }}</div>
              <div class="text-xs text-slate-500">{{ item.type }} · {{ formatDate(item.date_intervention) }}</div>
            </template>
          </ClientListPanel>
        </section>

        <section v-else-if="activeTab === 'historique' && client" class="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <ClientListPanel title="Dernières factures" :items="client.historique?.factures || []" empty="Aucune facture">
            <template #default="{ item }">
              <button type="button" class="font-mono font-semibold text-cyan-700 hover:underline" @click="router.push({ name: 'facture-detail', params: { id: item.id } })">{{ item.numero }}</button>
              <div class="text-xs text-slate-500">{{ formatDate(item.date_facture) }} · {{ item.statut }}</div>
              <div class="font-mono text-sm font-bold">{{ formatPrice(item.total_ttc) }}</div>
            </template>
          </ClientListPanel>
          <ClientListPanel title="Derniers devis" :items="client.historique?.devis || []" empty="Aucun devis">
            <template #default="{ item }">
              <button type="button" class="font-mono font-semibold text-cyan-700 hover:underline" @click="router.push({ name: 'devis-detail', params: { id: item.id } })">{{ item.numero }}</button>
              <div class="text-xs text-slate-500">{{ formatDate(item.date_devis) }} · {{ item.statut }}</div>
              <div class="font-mono text-sm font-bold">{{ formatPrice(item.total_ttc) }}</div>
            </template>
          </ClientListPanel>
          <ClientListPanel title="Derniers paiements" :items="client.historique?.paiements || []" empty="Aucun paiement">
            <template #default="{ item }">
              <div class="font-mono font-semibold">{{ item.reference || item.id }}</div>
              <div class="text-xs text-slate-500">{{ formatDate(item.date_paiement) }}</div>
              <div class="font-mono text-sm font-bold text-emerald-700">{{ formatPrice(item.montant) }}</div>
            </template>
          </ClientListPanel>
          <ClientListPanel title="Relances" :items="client.historique?.recouvrement || []" empty="Aucune relance">
            <template #default="{ item }">
              <div class="font-semibold">{{ item.type_action || item.statut }}</div>
              <div class="text-xs text-slate-500">{{ formatDateTime(item.date_action) }}</div>
              <p v-if="item.commentaire" class="text-xs text-slate-600">{{ item.commentaire }}</p>
            </template>
          </ClientListPanel>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, defineComponent, h, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'
import { ouvrirPDF } from '@/services/pdf'
import ClientForm from '@/components/ClientForm.vue'
import EmailActionButtons from '@/components/EmailActionButtons.vue'
import { useToast } from '@/composables/useToast'
import { buildEmailDraft } from '@/utils/emailComposer'

const ClientListPanel = defineComponent({
  props: {
    title: { type: String, required: true },
    items: { type: Array, default: () => [] },
    empty: { type: String, default: 'Aucun élément' },
  },
  setup(props, { slots }) {
    return () => h('section', { class: 'rounded-xl border border-cyan-100 bg-white p-4' }, [
      h('h2', { class: 'mb-3 font-black text-slate-950' }, props.title),
      props.items.length
        ? h('div', { class: 'space-y-2' }, props.items.map((item, index) => h('article', { key: item.id || item.numero || index, class: 'rounded-lg border border-cyan-50 bg-cyan-50/40 p-3 text-sm' }, slots.default?.({ item }) || [])))
        : h('p', { class: 'rounded-lg border border-dashed border-cyan-100 p-4 text-center text-sm text-slate-400' }, props.empty),
    ])
  },
})

const route = useRoute()
const router = useRouter()
const toast = useToast()

const client = ref(null)
const loading = ref(false)
const activeTab = ref('fiche')
const lastSavedAt = ref('')

const isCreate = computed(() => route.name === 'client-create')
const isClientDetailRoute = computed(() => ['client-create', 'client-detail'].includes(route.name))
const summary = computed(() => client.value?.resume_commercial || {})
const situation = computed(() => client.value?.situation_financiere || {})
const formKey = computed(() => isCreate.value ? 'new-client' : `client-${client.value?.id || route.params.id || 'loading'}`)
const tabs = computed(() => [
  { key: 'fiche', label: 'Fiche', count: null, create: false },
  { key: 'saisie', label: isCreate.value ? 'Saisie client' : 'Modifier', count: null, create: true },
  { key: 'situation', label: 'Situation', count: situation.value.factures_impayees_count || 0, create: false },
  { key: 'alertes', label: 'Alertes', count: alertCount.value, create: false },
  { key: 'historique', label: 'Historique', count: null, create: false },
])
const visibleTabs = computed(() => tabs.value.filter(tab => tab.create || !isCreate.value))
const alertCount = computed(() => (
  (client.value?.alertes?.factures_en_retard?.length || 0)
  + (client.value?.alertes?.devis_a_relancer?.length || 0)
  + (client.value?.alertes?.interventions_ouvertes?.length || 0)
))

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
  if (!isClientDetailRoute.value) return
  if (isCreate.value) {
    client.value = null
    activeTab.value = 'saisie'
    return
  }
  loading.value = true
  try {
    const { data } = await api.get(`/clients/${route.params.id}`)
    client.value = data
    activeTab.value = routeTab()
  } catch (err) {
    toast.error(err.response?.data?.message || 'Client introuvable')
    router.push('/clients')
  } finally {
    loading.value = false
  }
}

async function onSaved(saved) {
  if (isCreate.value && saved?.id) {
    await router.replace({ name: 'client-detail', params: { id: saved.id }, query: { tab: 'saisie' } })
    return
  }
  await loadAll()
  activeTab.value = 'saisie'
  lastSavedAt.value = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function goBack() { router.push('/clients') }
function canSellTo(row) { return ['client', 'client_fournisseur'].includes(row?.type) }
function creerDevis() { if (client.value?.id) router.push({ name: 'devis-create', query: { client_id: client.value.id, tab: 'saisie' } }) }
function creerFacture() { if (client.value?.id) router.push({ name: 'facture-create', query: { client_id: client.value.id, tab: 'saisie' } }) }
function creerPaiement() { router.push({ path: '/paiements', query: { search: client.value?.code || client.value?.nom } }) }
function creerRdv() { router.push({ path: '/agenda', query: { search: client.value?.code || client.value?.nom } }) }
function creerIntervention() { router.push({ path: '/leasing', query: { tab: 'interventions', search: client.value?.code || client.value?.nom } }) }

async function ouvrirSituationClientPdf() {
  if (!client.value?.id) return
  try {
    await ouvrirPDF(`/clients/${client.value.id}/situation-pdf`, `situation-client-${client.value.code || client.value.id}.pdf`)
  } catch (e) {
    toast.error('Situation client PDF indisponible pour le moment.')
  }
}

async function ouvrirFacturePdf(facture) {
  if (!facture?.id) return
  try {
    await ouvrirPDF(`/factures/${facture.id}/pdf`, `${facture.numero || 'facture'}.pdf`)
  } catch (e) {
    toast.error('Facture PDF indisponible pour le moment.')
  }
}

function relanceDraftForClient(row) {
  if (!row?.email) return buildEmailDraft()
  const totalDue = formatPrice(row.resume_commercial?.reste_a_payer || 0)
  const totalOverdue = formatPrice(row.resume_commercial?.retard_total || 0)
  return buildEmailDraft({
    to: row.email,
    subject: `Relance règlement - ${row.code || ''} ${row.nom}`.trim(),
    body: [
      'Bonjour,',
      '',
      `Nous vous contactons au sujet de votre compte client ${row.code || ''} - ${row.nom}.`,
      '',
      `Solde total à régulariser : ${totalDue}.`,
      `Montant en retard : ${totalOverdue}.`,
      '',
      'Merci de bien vouloir procéder au règlement ou nous transmettre une confirmation de paiement.',
      '',
      'Cordialement,',
      'XELLTEKK',
    ].join('\n'),
    context_type: 'client',
    context_id: row.id,
  })
}

function formatPrice(n) { return new Intl.NumberFormat('fr-FR').format(Math.round(n || 0)) }
function formatDate(d) { return d ? new Date(d).toLocaleDateString('fr-FR') : '–' }
function formatDateTime(d) { return d ? new Date(d).toLocaleString('fr-FR') : '–' }
function nextDueLabel(due) { return due ? formatDate(due.date || due.date_echeance || due) : '—' }
function typeLabel(type) {
  return {
    client: 'Client',
    prospect: 'Prospect',
    fournisseur: 'Fournisseur',
    client_fournisseur: 'Client/Four.',
  }[type] || type
}
function typeBadgeClass(type) {
  return {
    client: 'bg-blue-100 text-blue-800',
    prospect: 'bg-orange-100 text-orange-800',
    fournisseur: 'bg-purple-100 text-purple-800',
    client_fournisseur: 'bg-indigo-100 text-indigo-800',
  }[type] || 'bg-gray-100 text-gray-700'
}
function statutBadgeClass(statut) {
  return {
    actif: 'bg-green-100 text-green-800',
    inactif: 'bg-gray-100 text-gray-700',
    archive: 'bg-red-100 text-red-800',
  }[statut] || 'bg-gray-100 text-gray-700'
}

onMounted(loadAll)
watch(() => route.params.id, loadAll)
watch(() => route.name, loadAll)
watch(() => route.query.tab, () => {
  if (!isClientDetailRoute.value) return
  activeTab.value = routeTab()
})
</script>

<style scoped>
.client-card {
  @apply rounded-xl border border-cyan-100 bg-cyan-50 p-4;
}
.client-mini-stat {
  @apply rounded-xl border border-cyan-100 bg-cyan-50/60 p-3 text-sm;
}
.client-mini-stat span {
  @apply block text-xs font-black uppercase text-cyan-700;
}
.client-mini-stat strong {
  @apply mt-1 block font-mono text-base text-slate-950;
}
.quick-client-btn,
.mini-action-btn {
  @apply rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs font-black text-cyan-800 transition hover:bg-cyan-100;
}
</style>
