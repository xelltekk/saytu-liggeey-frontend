<template>
  <div class="app-surface space-y-4">
    <section class="rounded-3xl border border-cyan-200 bg-cyan-50/80 p-5 shadow-sm">
      <button type="button" class="mb-4 text-sm font-black text-cyan-700 hover:text-cyan-900" @click="goBack">← Retour stock</button>
      <p class="text-xs font-black uppercase tracking-[0.22em] text-cyan-700">Stock</p>
      <h1 class="mt-2 text-2xl font-black text-slate-950">{{ mode === 'transfert' ? 'Transfert inter-entrepôts' : 'Déplacement de stock' }}</h1>
      <p class="mt-1 text-sm text-cyan-800">Saisie en page complète, sans fenêtre flottante.</p>
    </section>

    <section class="rounded-3xl border border-cyan-200 bg-white p-5 shadow-sm">
      <div v-if="loading" class="p-10 text-center text-slate-500">Chargement...</div>
      <form v-else-if="stock" class="space-y-4" @submit.prevent="submit">
        <div class="rounded-2xl border border-cyan-100 bg-cyan-50 p-4 text-sm text-cyan-900">
          <strong>{{ stock.produit?.reference || '' }} — {{ stock.produit?.libelle || 'Produit' }}</strong>
          <p class="mt-1">Quantité : {{ formatQte(stock.quantite) }} {{ stock.produit?.unite || '' }}</p>
          <p>Entrepôt : {{ stock.entrepot?.libelle || '-' }} · {{ emplacementLabel(stock.emplacement) }}</p>
          <p v-if="mode === 'transfert'" class="mt-1">Disponible : {{ formatQte(disponible) }} {{ stock.produit?.unite || '' }}</p>
        </div>

        <template v-if="mode === 'deplacement'">
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">Nouvel emplacement <span class="text-red-500">*</span></label>
            <select v-model.number="deplacement.emplacement_id" class="input" required>
              <option :value="null">— Sélectionnez —</option>
              <option v-for="emp in emplacementsSource" :key="emp.id" :value="emp.id">{{ emplacementLabel(emp) }}</option>
            </select>
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">Motif</label>
            <input v-model="deplacement.motif" class="input" placeholder="Rangement, correction d'emplacement..." />
          </div>
        </template>

        <template v-else>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">Entrepôt destination <span class="text-red-500">*</span></label>
            <select v-model.number="transfert.destination_entrepot_id" class="input" required @change="loadDestinationEmplacements">
              <option :value="null">— Sélectionnez —</option>
              <option v-for="entrepot in entrepotsDestination" :key="entrepot.id" :value="entrepot.id">{{ entrepot.libelle }}</option>
            </select>
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">Emplacement destination</label>
            <select v-model.number="transfert.destination_emplacement_id" class="input" :required="emplacementsDestination.length > 0" :disabled="destinationLoading || emplacementsDestination.length === 0">
              <option :value="null">{{ destinationLoading ? 'Chargement...' : emplacementsDestination.length ? '— Sélectionnez un emplacement —' : 'Aucun emplacement configuré' }}</option>
              <option v-for="emp in emplacementsDestination" :key="emp.id" :value="emp.id">{{ emplacementLabel(emp) }}</option>
            </select>
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">Quantité à transférer <span class="text-red-500">*</span></label>
            <input v-model.number="transfert.quantite" type="number" step="0.001" min="0.001" :max="disponible || undefined" class="input" required />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">Motif</label>
            <input v-model="transfert.motif" class="input" placeholder="Réapprovisionnement, transfert boutique, SAV..." />
          </div>
        </template>

        <div class="flex justify-end gap-2 border-t border-cyan-100 pt-4">
          <button type="button" class="btn-secondary" @click="goBack">Annuler</button>
          <button class="btn-primary" :disabled="saving">{{ saving ? 'Enregistrement...' : mode === 'transfert' ? 'Envoyer le transfert' : 'Déplacer le stock' }}</button>
        </div>
      </form>
      <div v-else class="rounded-2xl border border-dashed border-cyan-200 p-8 text-center text-sm text-slate-500">Ligne de stock introuvable.</div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'

const props = defineProps({ mode: { type: String, required: true } })
const route = useRoute()
const router = useRouter()
const toast = useToast()
const loading = ref(true)
const saving = ref(false)
const destinationLoading = ref(false)
const stock = ref(null)
const entrepots = ref([])
const emplacementsSource = ref([])
const emplacementsDestination = ref([])
const deplacement = reactive({ emplacement_id: null, motif: 'Déplacement de stock' })
const transfert = reactive({ destination_entrepot_id: null, destination_emplacement_id: null, quantite: 1, motif: 'Transfert inter-entrepôts' })
const mode = computed(() => props.mode)
const disponible = computed(() => Math.max(0, Number(stock.value?.quantite || 0) - Number(stock.value?.quantite_reservee || 0)))
const entrepotsDestination = computed(() => entrepots.value.filter((entrepot) => Number(entrepot.id) !== Number(stock.value?.entrepot_id)))

onMounted(loadAll)

async function loadAll() {
  loading.value = true
  try {
    const [stockResp, entrepotsResp] = await Promise.all([
      api.get(`/stocks/${route.params.stockId}`),
      api.get('/entrepots', { params: { actifs_seulement: 1 } }),
    ])
    stock.value = stockResp.data
    entrepots.value = Array.isArray(entrepotsResp.data) ? entrepotsResp.data : entrepotsResp.data.data || []
    await loadSourceEmplacements()

    if (mode.value === 'transfert') {
      transfert.quantite = disponible.value >= 1 ? 1 : disponible.value
      transfert.destination_entrepot_id = entrepotsDestination.value[0]?.id || null
      if (transfert.destination_entrepot_id) await loadDestinationEmplacements()
    }
  } catch (e) {
    toast.error(e.response?.data?.message || 'Chargement impossible.')
  } finally {
    loading.value = false
  }
}

async function loadSourceEmplacements() {
  if (!stock.value?.entrepot_id) return
  const { data } = await api.get(`/entrepots/${stock.value.entrepot_id}`)
  emplacementsSource.value = (data.entrepot?.zones || []).filter(zone => zone.is_active !== false).flatMap(zone =>
    (zone.emplacements || []).filter(emp => emp.is_active !== false && Number(emp.id) !== Number(stock.value.emplacement_id)).map(emp => ({ ...emp, zone }))
  )
}

async function loadDestinationEmplacements() {
  emplacementsDestination.value = []
  transfert.destination_emplacement_id = null
  if (!transfert.destination_entrepot_id) return
  destinationLoading.value = true
  try {
    const { data } = await api.get(`/entrepots/${transfert.destination_entrepot_id}`)
    emplacementsDestination.value = (data.entrepot?.zones || []).filter(zone => zone.is_active !== false).flatMap(zone =>
      (zone.emplacements || []).filter(emp => emp.is_active !== false).map(emp => ({ ...emp, zone }))
    )
  } finally {
    destinationLoading.value = false
  }
}

async function submit() {
  if (!stock.value?.id) return
  saving.value = true
  try {
    if (mode.value === 'transfert') {
      await api.post(`/stocks/${stock.value.id}/transferer`, transfert)
      toast.success('Transfert envoyé. Il reste en attente de réception à destination.')
      router.push({ name: 'stock', query: { tab: 'transferts' } })
    } else {
      await api.post(`/stocks/${stock.value.id}/deplacer`, deplacement)
      toast.success('Stock déplacé vers le nouvel emplacement.')
      goBack()
    }
  } catch (e) {
    const errors = e.response?.data?.errors || {}
    toast.error(Object.values(errors)?.[0]?.[0] || e.response?.data?.message || 'Action impossible.')
  } finally {
    saving.value = false
  }
}

function emplacementLabel(emp) {
  if (!emp) return 'Sans emplacement'
  return [
    emp.allee && `Rayon ${emp.allee}`,
    emp.rangee && `Rangée ${emp.rangee}`,
    emp.niveau && `Niveau ${emp.niveau}`,
    emp.code,
  ].filter(Boolean).join(' / ')
}

function formatQte(n) {
  return parseFloat(n || 0).toLocaleString('fr-FR', { maximumFractionDigits: 3 })
}

function goBack() {
  router.push({ name: 'stock' })
}
</script>
