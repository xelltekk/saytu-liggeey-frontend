<template>
  <div class="app-surface space-y-4">
    <div class="rounded-2xl border border-cyan-200 bg-white p-4 shadow-sm">
      <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <button type="button" class="mb-3 text-sm font-bold text-cyan-700 hover:text-cyan-900" @click="goBack">
            ← Retour fiche commande
          </button>
          <div class="flex flex-wrap items-center gap-2">
            <h1 class="text-2xl font-black text-slate-950">Retour fournisseur</h1>
            <span v-if="commande" class="badge text-xs" :class="statusClass(commande.statut)">
              {{ statusLabel(commande.statut) }}
            </span>
          </div>
          <p class="mt-1 text-sm text-slate-600">
            <template v-if="commande && reception">
              {{ commande.numero }} · {{ reception.numero }} · {{ commande.fournisseur?.nom || 'Fournisseur non renseigné' }}
            </template>
            <template v-else>Chargement de la réception...</template>
          </p>
        </div>

        <div v-if="commande" class="flex flex-wrap gap-2">
          <button type="button" class="btn-secondary" @click="goBack">Voir fiche commande</button>
        </div>
      </div>
    </div>

    <div v-if="loading" class="rounded-2xl border border-cyan-200 bg-white p-10 text-center text-slate-500 shadow-sm">
      Chargement...
    </div>

    <form v-else class="rounded-2xl border border-cyan-200 bg-white p-4 shadow-sm" @submit.prevent="saveReturn">
      <section v-if="commande && reception" class="mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div class="return-kpi">
          <span>Commande</span>
          <strong>{{ commande.numero }}</strong>
        </div>
        <div class="return-kpi">
          <span>Réception</span>
          <strong>{{ reception.numero }}</strong>
        </div>
        <div class="return-kpi">
          <span>Fournisseur</span>
          <strong>{{ commande.fournisseur?.nom || '—' }}</strong>
        </div>
        <div class="return-kpi">
          <span>Disponible retour</span>
          <strong>{{ number(totalDisponible) }}</strong>
        </div>
      </section>

      <section class="mb-5 rounded-2xl border border-orange-100 bg-orange-50/70 p-4">
        <p class="text-xs font-black uppercase tracking-[0.2em] text-orange-700">Informations retour</p>
        <p class="mt-2 text-sm text-orange-900">Le stock sera diminué dès la validation du retour fournisseur.</p>
        <div class="mt-3 grid gap-3 md:grid-cols-3">
          <label class="field-label">Date retour
            <input v-model="returnForm.date_retour" type="date" class="input" required />
          </label>
          <label class="field-label">Motif
            <select v-model="returnForm.motif" class="input" required>
              <option value="defectueux">Produit défectueux</option>
              <option value="non_conforme">Non conforme</option>
              <option value="excedent">Excédent livré</option>
              <option value="erreur">Erreur de commande</option>
              <option value="autre">Autre</option>
            </select>
          </label>
          <label class="field-label">Litige
            <select v-model="returnForm.litige_statut" class="input">
              <option value="ouvert">Ouvert</option>
              <option value="en_attente_avoir">En attente d’avoir</option>
              <option value="clos">Clos</option>
            </select>
          </label>
          <label class="field-label md:col-span-3">Notes
            <input v-model="returnForm.notes" class="input" placeholder="Précisions sur le retour" />
          </label>
        </div>
      </section>

      <section class="overflow-hidden rounded-2xl border border-slate-200">
        <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3">
          <div>
            <h2 class="font-black text-slate-900">Produits à retourner</h2>
            <p class="text-sm text-slate-500">Saisissez uniquement les quantités réellement retournées.</p>
          </div>
          <span class="rounded-full bg-orange-100 px-3 py-1 text-xs font-black text-orange-700">
            Total à retourner : {{ number(totalARetourner) }}
          </span>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full min-w-[840px]">
            <thead>
              <tr>
                <th>Produit</th>
                <th class="text-right">Reçu</th>
                <th class="text-right">Déjà retourné</th>
                <th class="text-right">Disponible</th>
                <th class="text-right">À retourner</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="line in returnForm.lignes" :key="line.reception_ligne_id">
                <td>
                  <strong>{{ line.designation }}</strong>
                  <p class="text-xs text-slate-500">{{ line.reference || '—' }}</p>
                </td>
                <td class="text-right">{{ number(line.recu) }}</td>
                <td class="text-right">{{ number(line.deja_retourne) }}</td>
                <td class="text-right">{{ number(line.disponible) }}</td>
                <td>
                  <input v-model.number="line.quantite" type="number" min="0" :max="line.disponible" step="0.001" class="input ml-auto w-32 text-right" />
                </td>
              </tr>
              <tr v-if="!returnForm.lignes.length">
                <td colspan="5" class="py-10 text-center text-sm text-slate-400">
                  Cette réception n’a plus de quantité disponible au retour.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <div class="mt-4 flex flex-wrap justify-end gap-2">
        <button type="button" class="btn-secondary" @click="goBack">Annuler</button>
        <button class="btn-primary" :disabled="saving || !returnForm.lignes.length || !canReturn">
          {{ saving ? 'Validation...' : 'Valider le retour' }}
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
const loading = ref(false)
const saving = ref(false)
const returnForm = reactive({
  date_retour: new Date().toISOString().slice(0, 10),
  motif: 'defectueux',
  litige_statut: 'ouvert',
  notes: '',
  lignes: [],
})

const canReturn = computed(() => hasAnyRole(auth.user, ['admin', 'gerant', 'magasinier']))
const totalDisponible = computed(() => returnForm.lignes.reduce((sum, line) => sum + Number(line.disponible || 0), 0))
const totalARetourner = computed(() => returnForm.lignes.reduce((sum, line) => sum + Number(line.quantite || 0), 0))

onMounted(loadContext)

async function loadContext() {
  loading.value = true
  try {
    const { data } = await api.get(`/achats/commandes/${route.params.commandeId}`)
    commande.value = data
    reception.value = (data.receptions || []).find((item) => Number(item.id) === Number(route.params.receptionId)) || null
    if (!reception.value) {
      toast.error('Réception introuvable.')
      return goBack()
    }
    Object.assign(returnForm, {
      date_retour: new Date().toISOString().slice(0, 10),
      motif: 'defectueux',
      litige_statut: 'ouvert',
      notes: '',
      lignes: availableReturnLines(reception.value),
    })
  } catch (error) {
    toast.error(error.response?.data?.message || 'Chargement impossible.')
    router.replace({ name: 'achats' })
  } finally {
    loading.value = false
  }
}

function availableReturnLines(row) {
  const returned = new Map()
  for (const retour of row.retours || []) {
    if (retour.statut !== 'valide') continue
    for (const line of retour.lignes || []) {
      returned.set(Number(line.reception_ligne_id), (returned.get(Number(line.reception_ligne_id)) || 0) + Number(line.quantite || 0))
    }
  }

  return (row.lignes || []).map((line) => {
    const dejaRetourne = returned.get(Number(line.id)) || 0
    const recu = Number(line.quantite || 0)
    const commandeLine = line.commande_ligne || line.commandeLigne || {}
    const product = commandeLine.produit || {}
    return {
      reception_ligne_id: line.id,
      reference: commandeLine.reference || product.reference || '',
      designation: commandeLine.designation || product.libelle || 'Produit',
      recu,
      deja_retourne: dejaRetourne,
      disponible: Math.max(0, recu - dejaRetourne),
      quantite: 0,
    }
  }).filter((line) => line.disponible > 0.0001)
}

async function saveReturn() {
  if (!canReturn.value) return toast.error('Vous n’avez pas le droit de valider un retour fournisseur.')

  const lignes = returnForm.lignes
    .filter((line) => Number(line.quantite || 0) > 0)
    .map((line) => ({ reception_ligne_id: line.reception_ligne_id, quantite: Number(line.quantite) }))

  if (!lignes.length) return toast.error('Saisissez au moins une quantité à retourner.')

  saving.value = true
  try {
    await api.post(`/achats/receptions/${reception.value.id}/retours`, {
      date_retour: returnForm.date_retour,
      motif: returnForm.motif,
      litige_statut: returnForm.litige_statut || 'ouvert',
      avoir_attendu: returnForm.litige_statut !== 'clos',
      notes: returnForm.notes || null,
      lignes,
    })
    toast.success('Retour fournisseur enregistré et stock corrigé.')
    await goBack()
  } catch (error) {
    toast.error(Object.values(error.response?.data?.errors || {})[0]?.[0] || error.response?.data?.message || 'Retour impossible.')
  } finally {
    saving.value = false
  }
}

function goBack() {
  return router.push({ name: 'achat-commande-detail', params: { id: route.params.commandeId }, query: { tab: 'fiche' } })
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
.return-kpi {
  border: 1px solid color-mix(in srgb, var(--saytu-primary, #0ea5e9) 16%, var(--saytu-border, #bae6fd));
  border-radius: 1rem;
  background: color-mix(in srgb, var(--saytu-surface, #ffffff) 90%, var(--saytu-primary, #0ea5e9) 10%);
  padding: 0.9rem;
}

.return-kpi span {
  display: block;
  color: color-mix(in srgb, var(--saytu-shell-text, #0f172a) 62%, var(--saytu-primary, #0ea5e9));
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.return-kpi strong {
  display: block;
  margin-top: 0.35rem;
  color: var(--saytu-shell-text, #0f172a);
  font-size: 1rem;
  font-weight: 950;
}
</style>
