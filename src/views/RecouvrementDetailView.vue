<template>
  <div class="app-surface space-y-4">
    <section class="rounded-3xl border border-cyan-200 bg-cyan-50/80 p-5 shadow-sm">
      <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <button
            type="button"
            class="mb-4 text-sm font-black text-cyan-700 hover:text-cyan-900"
            @click="goBack"
          >
            ← Retour liste
          </button>

          <p class="text-xs font-black uppercase tracking-[0.22em] text-cyan-700">Dossier recouvrement</p>
          <h1 class="mt-2 text-2xl font-black text-slate-950">
            {{ dossier.facture?.numero || 'Facture' }}
          </h1>
          <p class="mt-1 text-sm text-cyan-800">
            {{ dossier.facture?.client?.nom || 'Client non renseigné' }} · suivi en page complète, sans fenêtre flottante.
          </p>
        </div>

        <button
          v-if="dossier.facture?.id"
          type="button"
          class="btn-secondary"
          @click="openFacture"
        >
          Ouvrir la facture
        </button>
      </div>
    </section>

    <section class="rounded-3xl border border-cyan-200 bg-white p-5 shadow-sm">
      <div v-if="loading" class="p-10 text-center text-slate-500">Chargement du dossier...</div>

      <template v-else>
        <div v-if="dossier.facture" class="mb-4 grid grid-cols-1 gap-3 rounded-2xl border border-cyan-100 bg-cyan-50 p-3 text-sm sm:grid-cols-3">
          <div>
            <p class="text-xs text-slate-500">Client</p>
            <p class="font-bold text-slate-950">{{ dossier.facture.client?.nom || '-' }}</p>
          </div>
          <div>
            <p class="text-xs text-slate-500">Reste à payer</p>
            <p class="font-mono font-black text-cyan-700">{{ formatPrice(dossier.facture.reste_a_payer) }}</p>
          </div>
          <div class="sm:text-right">
            <p class="text-xs text-slate-500">Échéance</p>
            <p class="font-bold text-slate-950">{{ formatDate(dossier.facture.date_echeance) }}</p>
          </div>
        </div>

        <div class="mb-4 flex flex-wrap gap-1 border-b border-cyan-100">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            type="button"
            class="-mb-px rounded-t-2xl px-5 py-3 text-sm font-black"
            :class="activeTab === tab.key ? 'border border-cyan-200 border-b-white bg-white text-cyan-700' : 'text-slate-600 hover:bg-cyan-50 hover:text-cyan-800'"
            @click="setTab(tab.key)"
          >
            {{ tab.label }}
          </button>
        </div>

        <form v-if="activeTab === 'suivi'" class="space-y-4" @submit.prevent="saveSuivi">
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label class="text-sm font-semibold text-slate-700">
              Statut recouvrement
              <select v-model="suiviForm.statut" class="input mt-1 rounded-2xl" required>
                <option value="a_surveiller">À surveiller</option>
                <option value="a_relancer">À relancer</option>
                <option value="relance">Relancé</option>
                <option value="promesse_paiement">Promesse de paiement</option>
                <option value="litige">Litige</option>
                <option value="paye">Payé / clôturé</option>
              </select>
            </label>
            <label class="text-sm font-semibold text-slate-700">
              Type d’action
              <select v-model="suiviForm.type_action" class="input mt-1 rounded-2xl" required>
                <option value="note">Note</option>
                <option value="relance_email">Relance email</option>
                <option value="appel">Appel</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="promesse_paiement">Promesse paiement</option>
                <option value="litige">Litige</option>
                <option value="paiement_recu">Paiement reçu</option>
                <option value="cloture">Clôture</option>
              </select>
            </label>
            <label class="text-sm font-semibold text-slate-700">
              Date promise
              <input v-model="suiviForm.date_promesse" type="date" class="input mt-1 rounded-2xl" />
            </label>
            <label class="text-sm font-semibold text-slate-700">
              Prochain rappel
              <input v-model="suiviForm.prochain_rappel" type="date" class="input mt-1 rounded-2xl" />
            </label>
          </div>

          <label class="text-sm font-semibold text-slate-700">
            Commentaire
            <textarea v-model="suiviForm.commentaire" rows="5" class="input mt-1 rounded-2xl" placeholder="Ex : client relancé, promesse de virement vendredi, litige sur BL..."></textarea>
          </label>

          <div class="flex justify-end gap-2 border-t border-cyan-100 pt-4">
            <button type="button" class="btn-secondary rounded-full px-4 py-2" @click="goBack">Annuler</button>
            <button type="submit" class="btn-primary rounded-full px-4 py-2" :disabled="saving">
              {{ saving ? 'Enregistrement...' : 'Enregistrer le suivi' }}
            </button>
          </div>
        </form>

        <section v-else class="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div>
            <h3 class="text-sm font-black uppercase tracking-wide text-slate-500">Actions de recouvrement</h3>
            <div class="mt-2 space-y-2">
              <div v-if="!dossier.suivis?.length" class="rounded-2xl border border-dashed border-cyan-200 p-4 text-center text-sm text-slate-500">
                Aucun suivi enregistré.
              </div>
              <div v-for="suivi in dossier.suivis" :key="suivi.id" class="rounded-2xl border border-cyan-100 p-3">
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <p class="font-bold text-slate-950">{{ typeActionLabel(suivi.type_action) }}</p>
                    <p class="text-xs text-slate-500">{{ statusLabel(suivi.statut) }} · {{ suivi.user?.name || 'Utilisateur' }}</p>
                  </div>
                  <span class="text-xs text-slate-400">{{ formatDateTime(suivi.date_action) }}</span>
                </div>
                <p v-if="suivi.commentaire" class="mt-2 text-sm text-slate-600">{{ suivi.commentaire }}</p>
                <div v-if="suivi.date_promesse || suivi.prochain_rappel" class="mt-2 flex flex-wrap gap-2 text-xs">
                  <span v-if="suivi.date_promesse" class="rounded-full bg-emerald-50 px-2 py-1 font-semibold text-emerald-700">Promesse : {{ formatDate(suivi.date_promesse) }}</span>
                  <span v-if="suivi.prochain_rappel" class="rounded-full bg-amber-50 px-2 py-1 font-semibold text-amber-700">Rappel : {{ formatDate(suivi.prochain_rappel) }}</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 class="text-sm font-black uppercase tracking-wide text-slate-500">Paiements liés</h3>
            <div class="mt-2 space-y-2">
              <div v-if="!dossier.paiements?.length" class="rounded-2xl border border-dashed border-cyan-200 p-4 text-center text-sm text-slate-500">
                Aucun paiement affecté.
              </div>
              <div v-for="paiement in dossier.paiements" :key="paiement.id" class="rounded-2xl border border-cyan-100 p-3">
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <p class="font-mono font-bold text-slate-950">{{ paiement.reference }}</p>
                    <p class="text-xs text-slate-500">{{ modePaiementLabel(paiement.mode_paiement) }} · {{ formatDate(paiement.date_paiement) }}</p>
                  </div>
                  <span class="font-mono font-black text-emerald-700">{{ formatPrice(paiement.montant_affecte || paiement.montant) }}</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </template>
    </section>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'
import { useCurrency } from '@/composables/useCurrency'
import { useToast } from '@/composables/useToast'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const { formatMoney } = useCurrency()

const loading = ref(true)
const saving = ref(false)
const activeTab = ref(route.query.tab === 'historique' ? 'historique' : 'suivi')
const dossier = reactive({
  facture: null,
  suivis: [],
  paiements: [],
})
const suiviForm = reactive(defaultForm())
const tabs = [
  { key: 'suivi', label: 'Ajouter un suivi' },
  { key: 'historique', label: 'Historique' },
]

onMounted(loadDossier)
watch(() => route.query.tab, (tab) => {
  activeTab.value = tab === 'historique' ? 'historique' : 'suivi'
})

function defaultForm() {
  return {
    statut: String(route.query.statut || 'relance'),
    type_action: String(route.query.type_action || 'relance_email'),
    date_promesse: '',
    prochain_rappel: String(route.query.prochain_rappel || datePlus(7)),
    commentaire: String(route.query.commentaire || ''),
  }
}

async function loadDossier() {
  loading.value = true
  try {
    const { data } = await api.get(`/recouvrement/factures/${route.params.id}/historique`)
    Object.assign(dossier, {
      facture: data.facture || null,
      suivis: data.suivis || [],
      paiements: data.paiements || [],
    })
  } catch (error) {
    toast.error(error.response?.data?.message || 'Impossible de charger le dossier de recouvrement.')
    router.replace({ name: 'recouvrement' })
  } finally {
    loading.value = false
  }
}

async function saveSuivi() {
  if (!dossier.facture?.id) return
  saving.value = true
  try {
    await api.post(`/recouvrement/factures/${dossier.facture.id}/suivis`, {
      statut: suiviForm.statut,
      type_action: suiviForm.type_action,
      date_promesse: suiviForm.date_promesse || null,
      prochain_rappel: suiviForm.prochain_rappel || null,
      commentaire: suiviForm.commentaire || null,
    })
    toast.success('Suivi enregistré.')
    Object.assign(suiviForm, defaultForm())
    await loadDossier()
    setTab('historique')
  } catch (error) {
    toast.error(error.response?.data?.message || 'Impossible d’enregistrer le suivi.')
  } finally {
    saving.value = false
  }
}

function setTab(tab) {
  activeTab.value = tab
  router.replace({ query: { ...route.query, tab } })
}

function goBack() {
  router.push({ name: 'recouvrement' })
}

function openFacture() {
  if (!dossier.facture?.id) return
  router.push({ name: 'facture-detail', params: { id: dossier.facture.id }, query: { tab: 'suivi' } })
}

function datePlus(days) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

function formatPrice(value) {
  return formatMoney(value)
}

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('fr-FR').format(date)
}

function formatDateTime(value) {
  if (!value) return '—'
  const normalized = String(value).replace(' ', 'T')
  const date = new Date(normalized)
  if (Number.isNaN(date.getTime())) return formatDate(value)
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(date)
}

function statusLabel(status) {
  return {
    a_surveiller: 'À surveiller',
    a_relancer: 'À relancer',
    relance: 'Relancé',
    promesse_paiement: 'Promesse',
    litige: 'Litige',
    paye: 'Payé',
  }[status] || 'À surveiller'
}

function typeActionLabel(type) {
  return {
    note: 'Note',
    relance_email: 'Relance email',
    appel: 'Appel client',
    whatsapp: 'WhatsApp',
    promesse_paiement: 'Promesse paiement',
    litige: 'Litige',
    paiement_recu: 'Paiement reçu',
    cloture: 'Clôture',
  }[type] || type || 'Action'
}

function modePaiementLabel(mode) {
  return {
    especes: 'Espèces',
    cheque: 'Chèque',
    virement: 'Virement',
    virement_bancaire: 'Virement bancaire',
    carte_bancaire: 'Carte bancaire',
    wave: 'Wave',
    orange_money: 'Orange Money',
    free_money: 'YAS',
    mobile_money: 'Mobile money',
    compensation: 'Compensation',
  }[mode] || mode || 'Paiement'
}
</script>
