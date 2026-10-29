<template>
  <section class="mt-6 rounded-xl border border-cyan-200 bg-cyan-50 p-4 print-actions">
    <h3 class="text-lg font-bold">Créer la facture de consommation</h3>
    <p class="mt-2 text-sm">Facture brouillon, sans envoi au client ni mouvement de stock. Loyer, forfaits et grands formats non inclus.</p>
    <p v-if="!allowed" class="mt-3">Vous devez disposer des droits de création et de consultation des factures.</p>
    <form v-else @submit.prevent="createInvoice" class="mt-4">
      <fieldset :disabled="saving || !!invoice">
        <label class="block font-semibold">Client à facturer</label>
        <ClientSearchSelect v-model="clientId" :clients="clientOptions" required />
        <label class="mt-3 block font-semibold">TVA (%) — à vérifier avant création
          <input v-model="tva" class="input mt-1" type="number" min="0" max="100" step="0.01" required />
        </label>
        <p class="mt-3 font-bold">Total TTC estimé : {{ format(totalTtc) }} CFA</p>
        <label class="mt-3 flex gap-2"><input v-model="confirmed" type="checkbox" required />Je confirme le client, les consommations et la TVA.</label>
        <button class="btn-primary mt-4" :disabled="!confirmed || !clientId || saving || !!invoice || result.black + result.color === 0">
          {{ saving ? 'Création en cours…' : 'Créer la facture brouillon' }}
        </button>
      </fieldset>
    </form>
    <p v-if="error" class="mt-3 text-red-800" role="alert">{{ error }}</p>
    <div v-if="invoice" class="mt-4 rounded-lg border border-green-300 bg-white p-3" role="status">
      <p>{{ existing ? 'Cette période est déjà facturée :' : 'Facture créée :' }} {{ invoice.numero }}</p>
      <RouterLink :to="{ name: 'facture-detail', params: { id: invoice.id } }" class="btn-primary mt-3 inline-block">Ouvrir la facture</RouterLink>
    </div>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import api from '@/services/api'
import ClientSearchSelect from '@/components/ClientSearchSelect.vue'
import { useAuthStore } from '@/stores/auth'
import { hasPermission } from '@/utils/access'
const props = defineProps({ result: { type: Object, required: true }, reports: { type: Array, required: true }, options: { type: Object, required: true }, client: { type: Object, default: null } })
const emit = defineEmits(['busy'])
const auth = useAuthStore()
const allowed = computed(() => hasPermission(auth.user, 'factures.create') && hasPermission(auth.user, 'factures.view'))
const clientId = ref(props.client?.id ? Number(props.client.id) : null), tva = ref(18), confirmed = ref(false)
const saving = ref(false), invoice = ref(null), error = ref(''), existing = ref(false)
const clientOptions = computed(() => props.client ? [props.client] : [])
const format = n => Number(n).toLocaleString('fr-FR', { maximumFractionDigits: 2 })
const totalTtc = computed(() => props.result.total + Math.round(props.result.blackAmount * Number(tva.value)) / 100 + Math.round(props.result.colorAmount * Number(tva.value)) / 100)
watch([clientId, tva], () => { confirmed.value = false })
watch(() => props.result, () => { invoice.value = null; error.value = ''; existing.value = false; confirmed.value = false })
async function createInvoice() {
  if (saving.value || invoice.value || !allowed.value || !clientId.value || !confirmed.value) return
  if (tva.value === '' || !Number.isFinite(Number(tva.value)) || Number(tva.value) < 0 || Number(tva.value) > 100) { error.value = 'Vérifiez le taux de TVA.'; return }
  saving.value = true; emit('busy', true); error.value = ''
  try {
    const { data } = await api.post('/leasing/comparaison/facture', {
      client_id: clientId.value, tva: Number(tva.value), reports: JSON.parse(JSON.stringify(props.reports)),
      blackPrice: Number(props.options.blackPrice), colorPrice: Number(props.options.colorPrice),
      largeColor: Number(props.options.largeColor), a4: props.options.a4, verified: props.options.verified,
    })
    if (!data?.facture?.id) throw Error('Réponse incomplète. Réessayez pour retrouver la facture créée.')
    invoice.value = data.facture; existing.value = !!data.already_exists
  } catch (e) {
    error.value = Object.values(e.response?.data?.errors || {}).flat().join(' ') || e.response?.data?.message || e.message || 'Création impossible. Réessayez sans changer de client ni de période.'
  } finally { saving.value = false; emit('busy', false) }
}
</script>
