<template>
  <div class="space-y-5">
    <div class="rounded-3xl border border-cyan-200 bg-cyan-50/70 p-6 shadow-sm">
      <button class="mb-6 text-sm font-bold text-cyan-700 hover:text-cyan-900" type="button" @click="goBack">
        ← Retour liste
      </button>
      <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p class="text-xs font-black uppercase tracking-[0.22em] text-cyan-700">Situation fournisseur</p>
          <h1 class="mt-2 text-3xl font-black text-slate-900">{{ situation.fournisseur?.nom || 'Chargement...' }}</h1>
          <p class="mt-1 text-sm text-slate-600">{{ situation.fournisseur?.code || '-' }} · {{ situation.fournisseur?.email || 'Email non renseigné' }}</p>
        </div>
        <button v-if="situation.fournisseur" type="button" class="btn-primary self-start" @click="openSupplierSituationPdf">
          Situation PDF
        </button>
      </div>
    </div>

    <div v-if="loading" class="rounded-3xl border border-cyan-100 bg-white p-12 text-center text-sm text-slate-500">
      Chargement de la situation...
    </div>

    <template v-else-if="situation.fournisseur">
      <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article v-for="card in supplierSituationCards" :key="card.label" class="rounded-2xl border border-cyan-200 bg-white p-4 shadow-sm">
          <span class="block text-xs font-black uppercase tracking-[0.14em] text-cyan-700">{{ card.label }}</span>
          <strong class="mt-2 block text-2xl font-black" :class="card.color">{{ card.value }}</strong>
        </article>
      </div>

      <section class="overflow-hidden rounded-3xl border border-cyan-200 bg-white shadow-sm">
        <div class="border-b border-cyan-100 bg-cyan-50 px-4 py-3">
          <h2 class="font-black text-slate-900">Factures impayées</h2>
          <p class="text-xs text-slate-500">Échéances et montants restant à payer.</p>
        </div>
        <div class="divide-y divide-cyan-100">
          <div v-for="facture in situation.factures_impayees" :key="facture.id" class="flex items-center justify-between gap-4 px-4 py-3 hover:bg-cyan-50/60">
            <div>
              <div class="font-mono text-sm font-black text-slate-800">{{ facture.numero }}</div>
              <p class="text-xs text-slate-500">Échéance {{ formatDate(facture.date_echeance) }} · {{ urgenceLabel(facture) }}</p>
              <span class="badge mt-1 inline-flex" :class="controlePaiementBadge(facture.controle_paiement_statut)">{{ controlePaiementLabel(facture.controle_paiement_statut) }}</span>
            </div>
            <div class="flex flex-col items-end gap-2">
              <span class="font-mono font-black text-orange-700">{{ formatPrice(facture.reste_a_payer) }}</span>
              <button v-if="canPayFacture(facture)" type="button" class="rounded-lg px-2 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50" @click="openReglementForFacture(facture)">Payer</button>
            </div>
          </div>
          <p v-if="!situation.factures_impayees?.length" class="px-4 py-8 text-center text-sm text-slate-500">Aucune facture impayée.</p>
        </div>
      </section>

      <section class="overflow-hidden rounded-3xl border border-cyan-200 bg-white shadow-sm">
        <div class="border-b border-cyan-100 bg-cyan-50 px-4 py-3">
          <h2 class="font-black text-slate-900">Derniers règlements</h2>
          <p class="text-xs text-slate-500">Historique récent des paiements fournisseur.</p>
        </div>
        <div class="divide-y divide-cyan-100">
          <div v-for="reglement in situation.reglements" :key="reglement.id" class="flex items-center justify-between gap-4 px-4 py-3 hover:bg-cyan-50/60">
            <div>
              <div class="font-mono text-sm font-black text-slate-800">{{ reglement.reference }}</div>
              <p class="text-xs text-slate-500">{{ formatDate(reglement.date_reglement) }} · {{ modeLabel(reglement.mode_paiement) }}</p>
            </div>
            <span class="font-mono font-black text-emerald-700">{{ formatPrice(reglement.montant) }}</span>
          </div>
          <p v-if="!situation.reglements?.length" class="px-4 py-8 text-center text-sm text-slate-500">Aucun règlement enregistré.</p>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'
import { ouvrirPDF } from '@/services/pdf'
import { useToast } from '@/composables/useToast'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const loading = ref(false)

const situation = reactive({
  fournisseur: null,
  resume: {},
  factures_impayees: [],
  factures_recentes: [],
  reglements: [],
})

const supplierSituationCards = computed(() => [
  { label: 'Total facturé', value: formatPrice(situation.resume?.total_facture), color: 'text-slate-900' },
  { label: 'Total payé', value: formatPrice(situation.resume?.total_paye), color: 'text-emerald-700' },
  { label: 'Reste dû', value: formatPrice(situation.resume?.reste_a_payer), color: 'text-orange-700' },
  { label: 'En retard', value: formatPrice(situation.resume?.montant_en_retard), color: 'text-red-700' },
])

async function loadSituation() {
  loading.value = true
  try {
    const { data } = await api.get(`/fournisseurs-reglements/fournisseurs/${route.params.id}/situation`)
    Object.assign(situation, {
      fournisseur: data.fournisseur || null,
      resume: data.resume || {},
      factures_impayees: data.factures_impayees || [],
      factures_recentes: data.factures_recentes || [],
      reglements: data.reglements || [],
    })
  } catch (error) {
    toast.error(error.response?.data?.message || 'Situation fournisseur indisponible.')
    goBack()
  } finally {
    loading.value = false
  }
}

async function openSupplierSituationPdf() {
  const fournisseurId = situation.fournisseur?.id
  if (!fournisseurId) return
  try {
    await ouvrirPDF(`/fournisseurs-reglements/fournisseurs/${fournisseurId}/situation-pdf`, `situation-fournisseur-${situation.fournisseur.code || fournisseurId}.pdf`)
  } catch (error) {
    toast.error('Situation fournisseur PDF indisponible.')
  }
}

function openReglementForFacture(facture) {
  const fournisseurId = facture?.fournisseur_id || situation.fournisseur?.id
  router.push({
    name: 'fournisseur-reglement-create',
    query: {
      fournisseur_id: fournisseurId,
      facture_id: facture.id,
    },
  })
}

function goBack() {
  router.push({ name: 'fournisseurs-reglements', query: { tab: 'pilotage' } })
}

function formatPrice(value) {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Number(value || 0))
}

function formatDate(value) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('fr-FR')
}

function urgenceLabel(facture) {
  if (Number(facture?.jours_retard || 0) > 0) return `En retard de ${facture.jours_retard} j`
  if (facture?.jours_avant_echeance !== null && facture?.jours_avant_echeance !== undefined) return `À payer dans ${facture.jours_avant_echeance} j`
  return 'Échéance à planifier'
}

function controlePaiementLabel(statut) {
  return {
    a_controler: 'À contrôler',
    bon_a_payer: 'Bon à payer',
    bloque: 'Bloquée',
  }[statut || 'a_controler'] || 'À contrôler'
}

function controlePaiementBadge(statut) {
  return {
    a_controler: 'bg-slate-100 text-slate-700',
    bon_a_payer: 'bg-cyan-100 text-cyan-700',
    bloque: 'bg-red-100 text-red-700',
  }[statut || 'a_controler'] || 'bg-slate-100 text-slate-700'
}

function canPayFacture(facture) {
  return Number(facture?.reste_a_payer || 0) > 0 && (facture?.controle_paiement_statut || 'a_controler') !== 'bloque'
}

function modeLabel(mode) {
  return {
    especes: 'Espèces',
    cheque: 'Chèque',
    virement: 'Virement',
    carte_bancaire: 'Carte',
    mobile_money: 'Mobile money',
    wave: 'Wave',
    orange_money: 'Orange Money',
    free_money: 'Free Money',
    compensation: 'Compensation',
    autre: 'Autre',
  }[mode] || mode
}

onMounted(loadSituation)
</script>

<style scoped>
.badge {
  @apply inline-flex rounded-full px-2.5 py-1 text-xs font-semibold;
}
</style>
