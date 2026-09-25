<template>
  <div class="app-surface space-y-4">
    <div class="rounded-2xl border border-cyan-200 bg-white p-4 shadow-sm">
      <button type="button" class="mb-3 text-sm font-bold text-cyan-700 hover:text-cyan-900" @click="goBack">
        ← Retour liste
      </button>

      <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p class="text-xs font-black uppercase tracking-[0.2em] text-cyan-700">Fiche fournisseur 360</p>
          <h1 class="mt-2 text-2xl font-black text-slate-950">
            {{ supplier.fournisseur?.nom || 'Fournisseur' }}
          </h1>
          <p class="mt-1 text-sm text-slate-600">
            {{ supplier.fournisseur?.code || '-' }}
            · {{ supplier.fournisseur?.email || 'Email non renseigné' }}
            · {{ supplier.fournisseur?.telephone || supplier.fournisseur?.mobile || 'Téléphone non renseigné' }}
          </p>
        </div>
      </div>
    </div>

    <div v-if="loading" class="rounded-2xl border border-cyan-200 bg-white p-10 text-center text-sm text-slate-500 shadow-sm">
      Chargement fournisseur...
    </div>

    <template v-else-if="supplier.fournisseur">
      <section class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div v-for="card in supplierCards" :key="card.label" class="supplier-kpi">
          <span>{{ card.label }}</span>
          <strong>{{ card.value }}</strong>
        </div>
      </section>

      <section class="grid gap-3 xl:grid-cols-2">
        <div class="supplier-panel">
          <h2>Dernières commandes</h2>
          <div v-for="row in supplier.commandes" :key="row.id" class="supplier-row">
            <button type="button" @click="goToCommande(row)">{{ row.numero }}</button>
            <span>{{ statusLabel(row.statut) }} · {{ money(row.total_ttc) }}</span>
          </div>
          <p v-if="!supplier.commandes?.length" class="supplier-empty">Aucune commande.</p>
        </div>

        <div class="supplier-panel">
          <h2>Factures récentes</h2>
          <div v-for="row in supplier.factures" :key="row.id" class="supplier-row">
            <button type="button" @click="goToInvoice(row)">{{ row.numero }}</button>
            <span>{{ statusInvoiceLabel(row.statut) }} · reste {{ money(row.reste_a_payer) }}</span>
          </div>
          <p v-if="!supplier.factures?.length" class="supplier-empty">Aucune facture.</p>
        </div>
      </section>

      <section class="supplier-panel">
        <h2>Produits rattachés au fournisseur</h2>
        <div class="mt-3 flex flex-wrap gap-2">
          <span
            v-for="product in supplier.produits"
            :key="product.id"
            class="rounded-full bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-800"
          >
            {{ product.reference }} · {{ product.libelle }}
          </span>
          <span v-if="!supplier.produits?.length" class="supplier-empty">Aucun produit rattaché.</span>
        </div>
      </section>
    </template>

    <div v-else class="rounded-2xl border border-cyan-200 bg-white p-10 text-center text-sm text-slate-500 shadow-sm">
      Fournisseur introuvable.
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const loading = ref(false)
const supplier = reactive({
  fournisseur: null,
  resume: {},
  commandes: [],
  factures: [],
  reglements: [],
  retours: [],
  produits: [],
})

const supplierCards = computed(() => [
  { label: 'Commandes', value: supplier.resume?.commandes || 0 },
  { label: 'Volume achats', value: money(supplier.resume?.montant_achats) },
  { label: 'Reste à payer', value: money(supplier.resume?.reste_a_payer) },
  { label: 'Litiges ouverts', value: supplier.resume?.litiges_ouverts || 0 },
])

onMounted(loadSupplier)

async function loadSupplier() {
  if (!route.params.id) return
  loading.value = true
  try {
    const { data } = await api.get(`/achats/fournisseurs/${route.params.id}/360`)
    Object.assign(supplier, {
      fournisseur: data.fournisseur || null,
      resume: data.resume || {},
      commandes: data.commandes || [],
      factures: data.factures || [],
      reglements: data.reglements || [],
      retours: data.retours || [],
      produits: data.produits || [],
    })
  } catch (error) {
    toast.error(error.response?.data?.message || 'Impossible de charger la fiche fournisseur.')
    router.replace({ name: 'achats' })
  } finally {
    loading.value = false
  }
}

function goBack() {
  router.push({ name: 'achats' })
}

function goToCommande(row) {
  if (!row?.id) return
  router.push({ name: 'achat-commande-detail', params: { id: row.id }, query: { tab: 'fiche' } })
}

function goToInvoice(invoice) {
  router.push({ path: '/fournisseurs-reglements', query: invoice?.numero ? { search: invoice.numero } : {} })
}

function money(value) {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Number(value || 0))
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
</script>

<style scoped>
.supplier-kpi,
.supplier-panel {
  border: 1px solid color-mix(in srgb, var(--saytu-primary, #0ea5e9) 14%, var(--saytu-border, #bae6fd));
  border-radius: 1rem;
  background: rgb(255 255 255 / 76%);
  padding: 1rem;
  box-shadow: 0 10px 24px rgb(14 165 233 / 0.06);
}

.supplier-kpi span,
.supplier-panel h2 {
  color: var(--saytu-muted, #64748b);
  font-size: 0.7rem;
  font-weight: 950;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.supplier-kpi strong {
  display: block;
  color: var(--saytu-shell-text, #0f172a);
  font-size: 1.25rem;
  font-weight: 950;
  margin-top: 0.35rem;
}

.supplier-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  border-top: 1px solid color-mix(in srgb, var(--saytu-primary, #0ea5e9) 12%, transparent);
  margin-top: 0.6rem;
  padding-top: 0.6rem;
}

.supplier-row button {
  color: var(--saytu-primary, #0ea5e9);
  font-weight: 900;
  text-align: left;
}

.supplier-row span,
.supplier-empty {
  color: var(--saytu-muted, #64748b);
  font-size: 0.78rem;
  font-weight: 700;
}
</style>
