<template>
  <div class="app-surface space-y-4">
    <div class="rounded-2xl border border-cyan-200 bg-white p-4 shadow-sm">
      <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <button type="button" class="mb-3 text-sm font-bold text-cyan-700 hover:text-cyan-900" @click="goBack">
            ← Retour liste
          </button>
          <div class="flex flex-wrap items-center gap-2">
            <h1 class="text-2xl font-black text-slate-950">Facture fournisseur</h1>
            <span v-if="commande" class="badge text-xs" :class="statusClass(commande.statut)">
              {{ statusLabel(commande.statut) }}
            </span>
          </div>
          <p class="mt-1 text-sm text-slate-600">
            <template v-if="commande">
              {{ commande.numero }} · {{ commande.fournisseur?.nom || 'Fournisseur non renseigné' }}
            </template>
            <template v-else>Chargement du bon de commande...</template>
          </p>
        </div>

        <div v-if="commande" class="flex flex-wrap gap-2">
          <button type="button" class="btn-secondary" @click="goToCommande">Voir fiche commande</button>
          <button v-if="commande.facture_fournisseur" type="button" class="btn-primary" @click="goToInvoice(commande.facture_fournisseur)">
            Voir facture
          </button>
        </div>
      </div>
    </div>

    <div v-if="loading" class="rounded-2xl border border-cyan-200 bg-white p-10 text-center text-slate-500 shadow-sm">
      Chargement...
    </div>

    <div v-else-if="commande?.facture_fournisseur" class="rounded-2xl border border-violet-200 bg-white p-5 shadow-sm">
      <p class="text-xs font-black uppercase tracking-[0.2em] text-violet-700">Facture déjà générée</p>
      <h2 class="mt-2 text-xl font-black text-slate-950">{{ commande.facture_fournisseur.numero }}</h2>
      <p class="mt-1 text-sm text-slate-600">
        Cette commande possède déjà une facture fournisseur. Ouvrez-la depuis le suivi des règlements fournisseurs.
      </p>
      <div class="mt-4 flex flex-wrap gap-2">
        <button type="button" class="btn-primary" @click="goToInvoice(commande.facture_fournisseur)">Ouvrir la facture</button>
        <button type="button" class="btn-secondary" @click="goToCommande">Retour fiche commande</button>
      </div>
    </div>

    <form v-else class="rounded-2xl border border-cyan-200 bg-white p-4 shadow-sm" @submit.prevent="saveInvoice">
      <section v-if="commande" class="mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div class="invoice-kpi">
          <span>Commande</span>
          <strong>{{ commande.numero }}</strong>
        </div>
        <div class="invoice-kpi">
          <span>Fournisseur</span>
          <strong>{{ commande.fournisseur?.nom || '—' }}</strong>
        </div>
        <div class="invoice-kpi">
          <span>Montant à facturer</span>
          <strong>{{ money(commande.total_ttc) }}</strong>
        </div>
        <div class="invoice-kpi">
          <span>Devise</span>
          <strong>{{ commande.devise || 'XOF' }}</strong>
        </div>
      </section>

      <section class="mb-5 rounded-2xl border border-cyan-100 bg-cyan-50/60 p-4">
        <p class="text-xs font-black uppercase tracking-[0.2em] text-cyan-700">Informations facture fournisseur</p>
        <div class="mt-3 grid gap-3 md:grid-cols-2">
          <label class="field-label md:col-span-2">Référence de la facture fournisseur
            <input v-model="invoiceForm.reference_fournisseur" class="input" placeholder="N° figurant sur la facture reçue" required />
          </label>
          <label class="field-label">Date facture
            <input v-model="invoiceForm.date_facture" type="date" class="input" required />
          </label>
          <label class="field-label">Date échéance
            <input v-model="invoiceForm.date_echeance" type="date" class="input" />
          </label>
          <label class="field-label">Statut
            <select v-model="invoiceForm.statut" class="input">
              <option value="validee">Validée et comptabilisée</option>
              <option value="brouillon">Brouillon</option>
            </select>
          </label>
          <label class="field-label md:col-span-2">Notes
            <textarea v-model="invoiceForm.notes" rows="3" class="input" placeholder="Informations complémentaires"></textarea>
          </label>
        </div>
      </section>

      <section class="overflow-hidden rounded-2xl border border-slate-200">
        <div class="border-b border-slate-200 bg-slate-50 px-4 py-3">
          <h2 class="font-black text-slate-900">Lignes issues de la commande</h2>
          <p class="text-sm text-slate-500">Le fournisseur, les produits, les montants et la devise proviennent automatiquement de la commande.</p>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full min-w-[780px]">
            <thead>
              <tr>
                <th>Produit</th>
                <th class="text-right">Qté</th>
                <th class="text-right">PU HT</th>
                <th class="text-right">TVA</th>
                <th class="text-right">Total TTC</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="line in commande?.lignes || []" :key="line.id">
                <td>
                  <strong>{{ line.designation || line.produit?.libelle || 'Produit' }}</strong>
                  <p class="text-xs text-slate-500">{{ line.reference || line.produit?.reference || '—' }}</p>
                </td>
                <td class="text-right">{{ number(line.quantite) }}</td>
                <td class="text-right">{{ money(line.prix_unitaire_ht) }}</td>
                <td class="text-right">{{ number(line.taux_tva) }}%</td>
                <td class="text-right font-black">{{ money(line.total_ttc) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <div class="mt-4 flex flex-wrap justify-end gap-2">
        <button type="button" class="btn-secondary" @click="goBack">Annuler</button>
        <button class="btn-primary" :disabled="saving || !canInvoice">
          {{ saving ? 'Génération...' : 'Générer la facture' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { hasAnyRole } from '@/utils/access'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const toast = useToast()

const commande = ref(null)
const loading = ref(false)
const saving = ref(false)
const invoiceForm = reactive({
  reference_fournisseur: '',
  date_facture: new Date().toISOString().slice(0, 10),
  date_echeance: '',
  statut: 'validee',
  notes: '',
})

const canInvoice = computed(() => hasAnyRole(auth.user, ['admin', 'gerant', 'comptable']))

onMounted(loadCommande)

async function loadCommande() {
  loading.value = true
  try {
    const { data } = await api.get(`/achats/commandes/${route.params.id}`)
    commande.value = data
    invoiceForm.reference_fournisseur = ''
    invoiceForm.date_facture = new Date().toISOString().slice(0, 10)
    invoiceForm.date_echeance = ''
    invoiceForm.statut = 'validee'
    invoiceForm.notes = `Facture liée à la commande ${data.numero}.`
  } catch (error) {
    toast.error(error.response?.data?.message || 'Bon de commande introuvable.')
    router.replace({ name: 'achats' })
  } finally {
    loading.value = false
  }
}

async function saveInvoice() {
  if (!canInvoice.value) return toast.error('Vous n’avez pas le droit de générer une facture fournisseur.')
  if (!commande.value?.id) return

  saving.value = true
  try {
    const { data } = await api.post(`/achats/commandes/${commande.value.id}/facture`, {
      ...invoiceForm,
      date_echeance: invoiceForm.date_echeance || null,
      notes: invoiceForm.notes || null,
    })
    toast.success(`Facture fournisseur ${data?.numero || ''} générée.`)
    if (data?.numero) {
      goToInvoice(data)
    } else {
      await router.push({ path: '/fournisseurs-reglements' })
    }
  } catch (error) {
    toast.error(Object.values(error.response?.data?.errors || {})[0]?.[0] || error.response?.data?.message || 'Génération de la facture impossible.')
  } finally {
    saving.value = false
  }
}

function goBack() {
  router.push({ name: 'achats' })
}

function goToCommande() {
  if (!commande.value?.id) return goBack()
  router.push({ name: 'achat-commande-detail', params: { id: commande.value.id }, query: { tab: 'fiche' } })
}

function goToInvoice(invoice) {
  router.push({ path: '/fournisseurs-reglements', query: invoice?.numero ? { search: invoice.numero } : {} })
}

function money(value) {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Number(value || 0))
}

function number(value) {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 3 }).format(Number(value || 0))
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
.invoice-kpi {
  border: 1px solid color-mix(in srgb, var(--saytu-primary, #0ea5e9) 16%, var(--saytu-border, #bae6fd));
  border-radius: 1rem;
  background: color-mix(in srgb, var(--saytu-surface, #ffffff) 90%, var(--saytu-primary, #0ea5e9) 10%);
  padding: 0.9rem;
}

.invoice-kpi span {
  display: block;
  color: color-mix(in srgb, var(--saytu-shell-text, #0f172a) 62%, var(--saytu-primary, #0ea5e9));
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.invoice-kpi strong {
  display: block;
  margin-top: 0.35rem;
  color: var(--saytu-shell-text, #0f172a);
  font-size: 1rem;
  font-weight: 950;
}
</style>
