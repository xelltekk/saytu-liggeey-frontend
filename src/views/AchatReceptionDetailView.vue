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
              Réception fournisseur
            </h1>
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
        </div>
      </div>
    </div>

    <div v-if="loading" class="rounded-2xl border border-cyan-200 bg-white p-10 text-center text-slate-500 shadow-sm">
      Chargement...
    </div>

    <form v-else class="rounded-2xl border border-cyan-200 bg-white p-4 shadow-sm" @submit.prevent="saveReception">
      <div v-if="referentielsError" class="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        {{ referentielsError }}
      </div>

      <section v-if="commande" class="mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div class="reception-kpi">
          <span>Commande</span>
          <strong>{{ commande.numero }}</strong>
        </div>
        <div class="reception-kpi">
          <span>Fournisseur</span>
          <strong>{{ commande.fournisseur?.nom || '—' }}</strong>
        </div>
        <div class="reception-kpi">
          <span>Total TTC</span>
          <strong>{{ money(commande.total_ttc) }}</strong>
        </div>
        <div class="reception-kpi">
          <span>Lignes à recevoir</span>
          <strong>{{ receptionForm.lignes.length }}</strong>
        </div>
      </section>

      <section class="mb-5 rounded-2xl border border-cyan-100 bg-cyan-50/60 p-4">
        <p class="text-xs font-black uppercase tracking-[0.2em] text-cyan-700">Informations réception</p>
        <div class="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <label class="field-label">Entrepôt
            <select v-model.number="receptionForm.entrepot_id" class="input" required @change="receptionForm.emplacement_id = null">
              <option :value="null">{{ loadingReferentiels ? 'Chargement...' : 'Choisir' }}</option>
              <option v-for="warehouse in referentiels.entrepots" :key="warehouse.id" :value="warehouse.id">
                {{ warehouse.code }} - {{ warehouse.libelle }}
              </option>
            </select>
          </label>
          <label class="field-label">Emplacement
            <select v-model.number="receptionForm.emplacement_id" class="input">
              <option :value="null">Sans emplacement</option>
              <option v-for="location in receptionEmplacements" :key="location.id" :value="location.id">
                {{ location.label }}
              </option>
            </select>
          </label>
          <label class="field-label">Date réception
            <input v-model="receptionForm.date_reception" type="date" class="input" required />
          </label>
          <label class="field-label">N° BL fournisseur
            <input v-model="receptionForm.reference_bl" class="input" placeholder="Ex: BL-2026-001" />
          </label>
          <label class="field-label">Contrôle qualité
            <select v-model="receptionForm.controle_qualite" class="input">
              <option value="conforme">Conforme</option>
              <option value="reserve">Avec réserve</option>
              <option value="non_conforme">Non conforme</option>
            </select>
          </label>
          <label class="field-label">Notes
            <input v-model="receptionForm.notes" class="input" placeholder="Observation rapide..." />
          </label>
          <label class="field-label md:col-span-2 xl:col-span-3">Réserve réception
            <textarea v-model="receptionForm.reserve_reception" rows="2" class="input" placeholder="Décrire l’écart, produit abîmé, quantité litigieuse..."></textarea>
          </label>
        </div>
      </section>

      <section class="overflow-hidden rounded-2xl border border-slate-200">
        <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3">
          <div>
            <h2 class="font-black text-slate-900">Produits à réceptionner</h2>
            <p class="text-sm text-slate-500">Saisissez la quantité réellement reçue pour chaque reliquat.</p>
          </div>
          <span class="rounded-full bg-cyan-100 px-3 py-1 text-xs font-black text-cyan-700">
            Total à recevoir : {{ number(totalARecevoir) }}
          </span>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full min-w-[840px]">
            <thead>
              <tr>
                <th>Produit</th>
                <th class="text-right">Commandé</th>
                <th class="text-right">Déjà reçu</th>
                <th class="text-right">Reliquat</th>
                <th class="text-right">À recevoir</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="line in receptionForm.lignes" :key="line.ligne_id">
                <td>
                  <strong>{{ line.designation }}</strong>
                  <p class="text-xs text-slate-500">{{ line.reference || '—' }}</p>
                </td>
                <td class="text-right">{{ number(line.commande) }}</td>
                <td class="text-right">{{ number(line.deja_recu) }}</td>
                <td class="text-right">{{ number(line.restant) }}</td>
                <td>
                  <input v-model.number="line.quantite" type="number" min="0" :max="line.restant" step="0.001" class="input ml-auto w-32 text-right" />
                </td>
              </tr>
              <tr v-if="!receptionForm.lignes.length">
                <td colspan="5" class="py-10 text-center text-sm text-slate-400">
                  Cette commande n’a plus de reliquat à réceptionner.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <div class="mt-4 flex flex-wrap justify-end gap-2">
        <button type="button" class="btn-secondary" @click="goBack">Annuler</button>
        <button class="btn-primary" :disabled="saving || !receptionForm.lignes.length || !canReceive">
          {{ saving ? 'Enregistrement...' : 'Enregistrer la réception' }}
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
const loadingReferentiels = ref(false)
const referentielsError = ref('')
const referentiels = reactive({ entrepots: [] })
const receptionForm = reactive({
  entrepot_id: null,
  emplacement_id: null,
  date_reception: new Date().toISOString().slice(0, 10),
  reference_bl: '',
  controle_qualite: 'conforme',
  reserve_reception: '',
  notes: '',
  lignes: [],
})

const canReceive = computed(() => hasAnyRole(auth.user, ['admin', 'gerant', 'magasinier']))
const receptionEmplacements = computed(() => {
  const warehouse = referentiels.entrepots.find((item) => Number(item.id) === Number(receptionForm.entrepot_id))
  return (warehouse?.zones || []).flatMap((zone) => (zone.emplacements || []).map((location) => ({
    id: location.id,
    label: `${zone.libelle} / ${location.code}${location.libelle ? ' - ' + location.libelle : ''}`,
  })))
})
const totalARecevoir = computed(() => receptionForm.lignes.reduce((sum, line) => sum + Number(line.quantite || 0), 0))

onMounted(async () => {
  await loadReferentiels()
  await loadCommande()
})

async function loadReferentiels() {
  loadingReferentiels.value = true
  referentielsError.value = ''
  try {
    const { data } = await api.get('/achats/referentiels')
    referentiels.entrepots = Array.isArray(data?.entrepots) ? data.entrepots : []
    if (!referentiels.entrepots.length) await loadEntrepotsFallback()
  } catch (error) {
    await loadEntrepotsFallback(error)
  } finally {
    loadingReferentiels.value = false
  }
}

async function loadEntrepotsFallback(error = null) {
  try {
    const { data } = await api.get('/entrepots', { params: { per_page: 500, actifs_seulement: 1 } })
    referentiels.entrepots = Array.isArray(data) ? data : (data?.data || [])
  } catch {
    referentielsError.value = error?.response?.data?.message || 'Impossible de charger les entrepôts.'
    toast.error(referentielsError.value)
  }
}

async function loadCommande() {
  loading.value = true
  try {
    const { data } = await api.get(`/achats/commandes/${route.params.id}`)
    commande.value = data
    fillReceptionForm(data)
  } catch (error) {
    toast.error(error.response?.data?.message || 'Bon de commande introuvable.')
    router.replace({ name: 'achats' })
  } finally {
    loading.value = false
  }
}

function fillReceptionForm(row) {
  receptionForm.entrepot_id = row.entrepot_id || referentiels.entrepots[0]?.id || null
  receptionForm.emplacement_id = null
  receptionForm.date_reception = new Date().toISOString().slice(0, 10)
  receptionForm.reference_bl = ''
  receptionForm.controle_qualite = 'conforme'
  receptionForm.reserve_reception = ''
  receptionForm.notes = ''
  receptionForm.lignes = (row.lignes || []).map((line) => {
    const restant = Math.max(0, Number(line.quantite) - Number(line.quantite_recue))
    return {
      ligne_id: line.id,
      reference: line.reference || line.produit?.reference || '',
      designation: line.designation || line.produit?.libelle || 'Produit',
      commande: Number(line.quantite),
      deja_recu: Number(line.quantite_recue),
      restant,
      quantite: restant,
    }
  }).filter((line) => line.restant > 0)
}

async function saveReception() {
  if (!canReceive.value) return toast.error('Vous n’avez pas le droit d’enregistrer une réception.')
  const lines = receptionForm.lignes
    .filter((line) => Number(line.quantite || 0) > 0)
    .map((line) => ({ ligne_id: line.ligne_id, quantite: Number(line.quantite) }))

  if (!lines.length) return toast.error('Saisissez au moins une quantité reçue.')

  saving.value = true
  try {
    await api.post(`/achats/commandes/${commande.value.id}/receptions`, {
      entrepot_id: receptionForm.entrepot_id,
      emplacement_id: receptionForm.emplacement_id || null,
      date_reception: receptionForm.date_reception,
      reference_bl: receptionForm.reference_bl || null,
      controle_qualite: receptionForm.controle_qualite || 'conforme',
      reserve_reception: receptionForm.reserve_reception || null,
      notes: receptionForm.notes || null,
      lignes: lines,
    })
    toast.success('Réception enregistrée et stock mis à jour.')
    await router.push({ name: 'achat-commande-detail', params: { id: commande.value.id }, query: { tab: 'fiche' } })
  } catch (error) {
    toast.error(Object.values(error.response?.data?.errors || {})[0]?.[0] || error.response?.data?.message || 'Réception impossible.')
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
.reception-kpi {
  border: 1px solid color-mix(in srgb, var(--saytu-primary, #0ea5e9) 16%, var(--saytu-border, #bae6fd));
  border-radius: 1rem;
  background: color-mix(in srgb, var(--saytu-surface, #ffffff) 90%, var(--saytu-primary, #0ea5e9) 10%);
  padding: 0.9rem;
}

.reception-kpi span {
  display: block;
  color: color-mix(in srgb, var(--saytu-shell-text, #0f172a) 62%, var(--saytu-primary, #0ea5e9));
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.reception-kpi strong {
  display: block;
  margin-top: 0.35rem;
  color: var(--saytu-shell-text, #0f172a);
  font-size: 1rem;
  font-weight: 950;
}
</style>
