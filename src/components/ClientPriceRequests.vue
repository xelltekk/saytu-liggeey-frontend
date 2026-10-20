<template>
  <section class="space-y-3 rounded-xl border border-cyan-200 p-4">
    <h3 class="text-lg font-bold">Demandes de prix du portail</h3>
    <p>Créez un devis brouillon à partir de la demande, puis complétez les prix et envoyez-le depuis la rubrique Devis.</p>
    <p v-if="error" role="alert" class="text-red-700">{{ error }}</p>
    <p v-if="notice" role="status">{{ notice }}</p>
    <p v-if="!rows.length">Aucune demande de prix.</p>
    <article v-for="r in rows" :key="r.id" class="rounded-xl border p-4">
      <h4 class="font-bold">{{ r.reference }} — {{ r.titre }}</h4><p class="whitespace-pre-wrap">{{ r.description }}</p>
      <ul><li v-for="(l, i) in JSON.parse(r.lines)" :key="i">{{ l.designation }} · {{ l.quantite }}</li></ul>
      <RouterLink v-if="r.devis_id" :to="`/devis/${r.devis_id}`" class="font-bold underline">Ouvrir le devis</RouterLink>
      <button v-else class="btn-primary" :disabled="busy" @click="convert(r)">Créer le devis à chiffrer</button>
    </article>
    <div v-if="pages > 1" class="flex gap-3"><button :disabled="busy || page <= 1" @click="load(page - 1)">Précédent</button><span>{{ page }} / {{ pages }}</span><button :disabled="busy || page >= pages" @click="load(page + 1)">Suivant</button></div>
  </section>
</template>
<script setup>
import { ref, watch } from 'vue'
import api from '@/services/api'
const props = defineProps({ clientId: Number })
const rows = ref([]), page = ref(1), pages = ref(1), busy = ref(false), error = ref(''), notice = ref('')
async function load(p = 1) { error.value = ''; try { const { data } = await api.get(`/clients/${props.clientId}/portal-prices`, { params: { page: p } }); rows.value = data.data; page.value = data.current_page; pages.value = data.last_page } catch (e) { error.value = e.response?.data?.message || 'Chargement impossible.' } }
async function convert(r) { if (busy.value) return; busy.value = true; try { const { data } = await api.post(`/clients/${props.clientId}/portal-prices/${r.id}/convert`); notice.value = data.message; await load(page.value) } catch (e) { error.value = e.response?.data?.message || 'Conversion impossible.' } finally { busy.value = false } }
watch(() => props.clientId, () => load(), { immediate: true })
</script>
