<script setup>
import { ref, watch } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import api from '@/services/api'
import { ouvrirPDF } from '@/services/pdf'

const props = defineProps({ invoiceId: { type: [Number, String], required: true } })
const emit = defineEmits(['changed'])
const data = ref(null), quantities = ref({}), error = ref(''), busy = ref(false), loading = ref(false)
const date = ref(new Date().toISOString().slice(0, 10)), requestId = ref(crypto.randomUUID())
let generation = 0
async function load() {
  const current = ++generation
  loading.value = true; error.value = ''; data.value = null
  try {
    const result = await api.get(`/factures/${props.invoiceId}/livraisons`)
    if (generation !== current) return
    data.value = result.data; quantities.value = {}; requestId.value = crypto.randomUUID()
  } catch (e) { if (generation === current) error.value = e.response?.data?.message || 'Chargement des livraisons impossible.' }
  finally { if (generation === current) loading.value = false }
}
async function deliver() {
  if (busy.value) return
  const lines = Object.entries(quantities.value).filter(([, q]) => Number(q) > 0).map(([id, q]) => ({ line_id: Number(id), quantite: String(q) }))
  if (!lines.length) { error.value = 'Saisissez au moins une quantité à livrer.'; return }
  if (!window.confirm('Valider cette livraison et déduire les quantités du stock ? Aucun paiement ni nouvelle facture ne sera créé.')) return
  busy.value = true; error.value = ''
  try {
    await api.post(`/factures/${props.invoiceId}/livraisons`, { request_id: requestId.value, date_livraison: date.value, lines })
    quantities.value = {}; await load(); emit('changed')
  } catch (e) { error.value = Object.values(e.response?.data?.errors || {}).flat().join(' · ') || e.response?.data?.message || 'Livraison impossible. Réessayez sans modifier les quantités si la connexion a été interrompue.' }
  finally { busy.value = false }
}
async function download(delivery) {
  busy.value = true; error.value = ''
  try { await ouvrirPDF(`/factures/${props.invoiceId}/livraisons/${delivery.id}/pdf`, `${delivery.reference}.pdf`) }
  catch { error.value = 'Téléchargement du BL impossible. Réessayez.' }
  finally { busy.value = false }
}
onBeforeRouteLeave(() => !busy.value && (!Object.values(quantities.value).some(q => Number(q) > 0) || window.confirm('Quitter sans enregistrer la livraison ?')))
watch(() => props.invoiceId, load, { immediate: true })
</script>

<template>
  <section class="space-y-4">
    <h2 class="text-lg font-bold text-slate-900">Livraisons et bons de livraison</h2>
    <p v-if="error" role="alert" class="rounded-xl bg-red-50 p-4 text-red-800">{{ error }}</p>
    <p v-if="loading">Chargement…</p>
    <template v-else-if="data">
      <p v-if="data.linked_order" class="rounded-xl bg-sky-50 p-4">Cette facture est liée à une commande. Effectuez les livraisons depuis cette commande pour éviter une double sortie de stock. <RouterLink v-if="data.order_id" :to="`/metier/commandes_clients/${data.order_id}`" class="font-bold underline">Ouvrir la commande</RouterLink></p>
      <p v-else-if="data.stock_mode !== 'livraison'" class="rounded-xl bg-amber-50 p-4">Facture historique ou vente en caisse : le stock suit son fonctionnement d’origine. Aucune nouvelle sortie n’est autorisée depuis ce formulaire.</p>
      <template v-else>
        <p>La facture et son paiement ne modifient pas le stock. Validez ici les quantités réellement remises au client.</p>
        <p v-if="!data.can_deliver" class="rounded-xl bg-amber-50 p-4">La facture doit être validée et votre compte doit disposer du droit de validation des factures.</p>
        <form @submit.prevent="deliver" class="space-y-4">
          <label class="block">Date de livraison<input v-model="date" type="date" required :max="new Date().toISOString().slice(0, 10)" :disabled="busy || !data.can_deliver" class="ml-3 rounded-lg border p-2"></label>
          <div class="overflow-auto"><table class="w-full text-left text-sm"><thead><tr><th class="p-3">Produit / service</th><th>Facturé</th><th>Livré</th><th>Reste</th><th>À livrer</th></tr></thead><tbody><tr v-for="line in data.lines" :key="line.id" class="border-b"><td class="p-3">{{ line.designation }}</td><td>{{ line.quantite }}</td><td>{{ line.livree }}</td><td>{{ line.reste }}</td><td><input v-model="quantities[line.id]" type="number" min="0" :max="line.reste" step="0.001" :aria-label="`Quantité à livrer : ${line.designation}`" :disabled="busy || !data.can_deliver || Number(line.reste) <= 0" class="w-28 rounded-lg border p-2"></td></tr></tbody></table></div>
          <button v-if="data.can_deliver && data.lines.some(l => Number(l.reste) > 0)" type="submit" :disabled="busy" class="rounded-xl bg-sky-700 px-4 py-3 font-bold text-white">{{ busy ? 'Enregistrement…' : 'Valider la livraison / Générer le BL' }}</button>
        </form>
      </template>
      <h3 class="font-bold">Bons de livraison enregistrés</h3>
      <p v-if="!data.deliveries.length">Aucun BL enregistré depuis cette facture.</p>
      <div v-for="delivery in data.deliveries" :key="delivery.id" class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-sky-200 p-4"><span>{{ delivery.reference }} · {{ delivery.date_livraison }}</span><button type="button" :disabled="busy" @click="download(delivery)" class="font-bold text-sky-800 underline">Télécharger le BL PDF</button></div>
    </template>
  </section>
</template>
