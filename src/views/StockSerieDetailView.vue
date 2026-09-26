<template>
  <div class="app-surface space-y-4">
    <section class="rounded-3xl border border-cyan-200 bg-cyan-50/80 p-5 shadow-sm">
      <button type="button" class="mb-4 text-sm font-black text-cyan-700 hover:text-cyan-900" @click="goBack">← Retour stock</button>
      <p class="text-xs font-black uppercase tracking-[0.22em] text-cyan-700">Stock</p>
      <h1 class="mt-2 text-2xl font-black text-slate-950">Ajouter une série / un lot</h1>
      <p class="mt-1 text-sm text-cyan-800">Saisie en page complète, sans fenêtre flottante.</p>
    </section>

    <section class="rounded-3xl border border-cyan-200 bg-white p-5 shadow-sm">
      <form class="space-y-4" @submit.prevent="saveSerie">
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700">Ligne de stock <span class="text-red-500">*</span></label>
          <select v-model.number="form.stock_id" class="input" required @change="syncProductFromStock">
            <option value="">— Sélectionnez une ligne —</option>
            <option v-for="stock in stockOptions" :key="stock.id" :value="stock.id">
              {{ stock.produit?.reference || '-' }} — {{ stock.produit?.libelle || 'Produit' }} · {{ stock.entrepot?.libelle || '-' }} · {{ emplacementLabel(stock.emplacement) }}
            </option>
          </select>
        </div>
        <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label class="block text-sm font-medium text-gray-700">
            Numéro de série
            <input v-model="form.serial_number" class="input mt-1" placeholder="SN, IMEI, clé..." />
          </label>
          <label class="block text-sm font-medium text-gray-700">
            Numéro de lot
            <input v-model="form.lot_number" class="input mt-1" placeholder="Lot, batch..." />
          </label>
        </div>
        <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label class="block text-sm font-medium text-gray-700">
            Statut
            <select v-model="form.statut" class="input mt-1">
              <option value="disponible">Disponible</option>
              <option value="reserve">Réservé</option>
              <option value="vendu">Vendu</option>
              <option value="sav">SAV</option>
              <option value="sorti">Sorti</option>
              <option value="perdu">Perdu</option>
            </select>
          </label>
          <label class="block text-sm font-medium text-gray-700">
            Garantie jusqu’au
            <input v-model="form.garantie_jusquau" type="date" class="input mt-1" />
          </label>
        </div>
        <label class="block text-sm font-medium text-gray-700">
          Notes
          <textarea v-model="form.notes" class="input mt-1 min-h-24" placeholder="État, provenance, remarque SAV..."></textarea>
        </label>
        <div class="flex justify-end gap-2 border-t border-cyan-100 pt-4">
          <button type="button" class="btn-secondary" @click="goBack">Annuler</button>
          <button class="btn-primary" :disabled="saving">{{ saving ? 'Enregistrement...' : 'Enregistrer' }}</button>
        </div>
      </form>
    </section>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const saving = ref(false)
const stockOptions = ref([])
const form = reactive({
  produit_id: '',
  stock_id: route.query.stock_id ? Number(route.query.stock_id) : '',
  serial_number: '',
  lot_number: '',
  statut: 'disponible',
  garantie_jusquau: '',
  notes: '',
})

onMounted(loadStockOptions)

async function loadStockOptions() {
  try {
    const { data } = await api.get('/stocks', { params: { per_page: 100 } })
    stockOptions.value = data.data || []
    syncProductFromStock()
  } catch (e) {
    stockOptions.value = []
  }
}

function syncProductFromStock() {
  const selected = stockOptions.value.find((stock) => Number(stock.id) === Number(form.stock_id))
  form.produit_id = selected?.produit_id || ''
}

async function saveSerie() {
  if (!form.produit_id && !form.stock_id) {
    toast.error('Sélectionnez une ligne de stock ou renseignez le produit.')
    return
  }
  if (!String(form.serial_number || '').trim() && !String(form.lot_number || '').trim()) {
    toast.error('Renseignez au moins un numéro de série ou un numéro de lot.')
    return
  }

  saving.value = true
  try {
    await api.post('/stocks/series', {
      produit_id: form.produit_id || undefined,
      stock_id: form.stock_id || undefined,
      serial_number: form.serial_number || undefined,
      lot_number: form.lot_number || undefined,
      statut: form.statut,
      garantie_jusquau: form.garantie_jusquau || undefined,
      notes: form.notes || undefined,
    })
    toast.success('Série / lot enregistré.')
    goBack()
  } catch (e) {
    const errors = e.response?.data?.errors || {}
    toast.error(Object.values(errors)?.[0]?.[0] || e.response?.data?.message || 'Enregistrement impossible.')
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

function goBack() {
  router.push({ name: 'stock', query: { tab: 'series' } })
}
</script>

