<template>
  <div class="app-surface space-y-4">
    <div class="rounded-2xl border border-cyan-200 bg-white p-4 shadow-sm">
      <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <button type="button" class="mb-3 text-sm font-bold text-cyan-700 hover:text-cyan-900" @click="goBack">
            ← Retour fiche commande
          </button>
          <div class="flex flex-wrap items-center gap-2">
            <h1 class="text-2xl font-black text-slate-950">Avoir fournisseur</h1>
            <span v-if="retour?.avoir" class="badge bg-violet-100 text-violet-800">Déjà généré</span>
          </div>
          <p class="mt-1 text-sm text-slate-600">
            <template v-if="commande && retour">
              {{ commande.numero }} · {{ retour.numero }} · {{ commande.fournisseur?.nom || 'Fournisseur non renseigné' }}
            </template>
            <template v-else>Chargement du retour fournisseur...</template>
          </p>
        </div>

        <div v-if="commande" class="flex flex-wrap gap-2">
          <button type="button" class="btn-secondary" @click="goBack">Voir fiche commande</button>
          <button v-if="commande.facture_fournisseur" type="button" class="btn-secondary" @click="goToInvoice(commande.facture_fournisseur)">Voir facture</button>
        </div>
      </div>
    </div>

    <div v-if="loading" class="rounded-2xl border border-cyan-200 bg-white p-10 text-center text-slate-500 shadow-sm">
      Chargement...
    </div>

    <div v-else-if="retour?.avoir" class="rounded-2xl border border-violet-200 bg-white p-5 shadow-sm">
      <p class="text-xs font-black uppercase tracking-[0.2em] text-violet-700">Avoir déjà généré</p>
      <h2 class="mt-2 text-xl font-black text-slate-950">{{ retour.avoir.numero }}</h2>
      <p class="mt-1 text-sm text-slate-600">Ce retour possède déjà un avoir fournisseur.</p>
      <div class="mt-4 flex flex-wrap gap-2">
        <button type="button" class="btn-primary" @click="goBack">Retour fiche commande</button>
        <button v-if="commande?.facture_fournisseur" type="button" class="btn-secondary" @click="goToInvoice(commande.facture_fournisseur)">Ouvrir la facture</button>
      </div>
    </div>

    <div v-else-if="!commande?.facture_fournisseur" class="rounded-2xl border border-amber-200 bg-white p-5 shadow-sm">
      <p class="text-xs font-black uppercase tracking-[0.2em] text-amber-700">Facture requise</p>
      <h2 class="mt-2 text-xl font-black text-slate-950">Impossible de générer l’avoir maintenant</h2>
      <p class="mt-1 text-sm text-slate-600">Une facture fournisseur validée doit d’abord être liée à cette commande.</p>
      <div class="mt-4 flex flex-wrap gap-2">
        <button type="button" class="btn-primary" @click="goToSupplierInvoiceCreate">Facturer la commande</button>
        <button type="button" class="btn-secondary" @click="goBack">Retour fiche commande</button>
      </div>
    </div>

    <form v-else class="rounded-2xl border border-cyan-200 bg-white p-4 shadow-sm" @submit.prevent="saveCredit">
      <section v-if="commande && retour" class="mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div class="credit-kpi">
          <span>Commande</span>
          <strong>{{ commande.numero }}</strong>
        </div>
        <div class="credit-kpi">
          <span>Retour</span>
          <strong>{{ retour.numero }}</strong>
        </div>
        <div class="credit-kpi">
          <span>Facture liée</span>
          <strong>{{ commande.facture_fournisseur?.numero || '—' }}</strong>
        </div>
        <div class="credit-kpi">
          <span>Montant avoir</span>
          <strong>{{ money(retour.total_ttc) }}</strong>
        </div>
      </section>

      <section class="mb-5 rounded-2xl border border-violet-100 bg-violet-50/70 p-4">
        <p class="text-xs font-black uppercase tracking-[0.2em] text-violet-700">Informations avoir</p>
        <p class="mt-2 text-sm text-violet-950">
          L’avoir sera comptabilisé et diminuera automatiquement le reste à payer de la facture fournisseur liée.
        </p>
        <div class="mt-3 grid gap-3 md:grid-cols-2">
          <label class="field-label">Référence fournisseur
            <input v-model="creditForm.reference_fournisseur" class="input" placeholder="Référence figurant sur l’avoir reçu" />
          </label>
          <label class="field-label">Date avoir
            <input v-model="creditForm.date_avoir" type="date" class="input" required />
          </label>
          <label class="field-label md:col-span-2">Notes
            <textarea v-model="creditForm.notes" rows="3" class="input" placeholder="Informations complémentaires"></textarea>
          </label>
        </div>
      </section>

      <section class="overflow-hidden rounded-2xl border border-slate-200">
        <div class="border-b border-slate-200 bg-slate-50 px-4 py-3">
          <h2 class="font-black text-slate-900">Produits retournés</h2>
          <p class="text-sm text-slate-500">Montants repris depuis le retour fournisseur.</p>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full min-w-[760px]">
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
              <tr v-for="line in retour?.lignes || []" :key="line.id">
                <td>
                  <strong>{{ line.commande_ligne?.designation || line.commandeLigne?.designation || line.commande_ligne?.produit?.libelle || line.commandeLigne?.produit?.libelle || 'Produit' }}</strong>
                  <p class="text-xs text-slate-500">{{ line.commande_ligne?.reference || line.commandeLigne?.reference || line.commande_ligne?.produit?.reference || line.commandeLigne?.produit?.reference || '—' }}</p>
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
        <button class="btn-primary" :disabled="saving || !canCredit">
          {{ saving ? 'Génération...' : 'Générer et comptabiliser' }}
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
const reception = ref(null)
const retour = ref(null)
const loading = ref(false)
const saving = ref(false)
const creditForm = reactive({
  reference_fournisseur: '',
  date_avoir: new Date().toISOString().slice(0, 10),
  notes: '',
})

const canCredit = computed(() => hasAnyRole(auth.user, ['admin', 'gerant', 'comptable']))

onMounted(loadContext)

async function loadContext() {
  loading.value = true
  try {
    const { data } = await api.get(`/achats/commandes/${route.params.commandeId}`)
    commande.value = data
    const found = findReturn(data, route.params.retourId)
    reception.value = found?.reception || null
    retour.value = found?.retour || null
    if (!retour.value) {
      toast.error('Retour fournisseur introuvable.')
      return goBack()
    }
    Object.assign(creditForm, {
      reference_fournisseur: '',
      date_avoir: new Date().toISOString().slice(0, 10),
      notes: `Avoir lié au retour ${retour.value.numero}.`,
    })
  } catch (error) {
    toast.error(error.response?.data?.message || 'Chargement impossible.')
    router.replace({ name: 'achats' })
  } finally {
    loading.value = false
  }
}

function findReturn(row, retourId) {
  for (const item of row.receptions || []) {
    const match = (item.retours || []).find((candidate) => Number(candidate.id) === Number(retourId))
    if (match) return { reception: item, retour: match }
  }
  return null
}

async function saveCredit() {
  if (!canCredit.value) return toast.error('Vous n’avez pas le droit de générer un avoir fournisseur.')
  if (!retour.value?.id) return

  saving.value = true
  try {
    const { data } = await api.post(`/achats/retours/${retour.value.id}/avoir`, {
      reference_fournisseur: creditForm.reference_fournisseur || null,
      date_avoir: creditForm.date_avoir,
      notes: creditForm.notes || null,
    })
    toast.success(`Avoir fournisseur ${data?.numero || ''} généré et comptabilisé.`)
    goToInvoice(data?.facture || commande.value?.facture_fournisseur)
  } catch (error) {
    toast.error(Object.values(error.response?.data?.errors || {})[0]?.[0] || error.response?.data?.message || 'Génération de l’avoir impossible.')
  } finally {
    saving.value = false
  }
}

function goBack() {
  return router.push({ name: 'achat-commande-detail', params: { id: route.params.commandeId }, query: { tab: 'fiche' } })
}

function goToSupplierInvoiceCreate() {
  router.push({ name: 'achat-facture-create', params: { id: route.params.commandeId } })
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
</script>

<style scoped>
.credit-kpi {
  border: 1px solid color-mix(in srgb, var(--saytu-primary, #0ea5e9) 16%, var(--saytu-border, #bae6fd));
  border-radius: 1rem;
  background: color-mix(in srgb, var(--saytu-surface, #ffffff) 90%, var(--saytu-primary, #0ea5e9) 10%);
  padding: 0.9rem;
}

.credit-kpi span {
  display: block;
  color: color-mix(in srgb, var(--saytu-shell-text, #0f172a) 62%, var(--saytu-primary, #0ea5e9));
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.credit-kpi strong {
  display: block;
  margin-top: 0.35rem;
  color: var(--saytu-shell-text, #0f172a);
  font-size: 1rem;
  font-weight: 950;
}
</style>
