<template>
  <section class="space-y-4">
    <h2 class="text-xl font-bold">Accès au portail de {{ client.nom }}</h2>
    <p>Comptes externes séparés des employés. Chaque utilisateur peut consulter les tickets, commandes et contrats partagés de ce client.</p>
    <p v-if="url">Adresse du portail : <a :href="url" target="_blank" rel="noopener" class="font-bold underline">{{ url }}</a></p>
    <p v-if="notice" role="status">{{ notice }}</p><p v-if="error" role="alert" class="text-red-700">{{ error }}</p>
    <p v-if="pending" class="rounded-xl bg-amber-50 p-3">{{ pending }} email(s) du portail en attente pour votre entreprise. <button class="underline" :disabled="busy" @click="retry">Réessayer l’envoi</button></p>
    <form class="grid gap-3 md:grid-cols-3" @submit.prevent="invite()">
      <label>Nom du contact<input v-model.trim="name" required maxlength="191" class="w-full rounded-lg border p-3" /></label>
      <label>Email<input v-model.trim="email" type="email" required maxlength="191" class="w-full rounded-lg border p-3" /></label>
      <button class="btn-primary self-end" :disabled="busy">Inviter par email</button>
    </form>
    <p class="text-sm">Lien personnel valable 48 h. Pour réinitialiser un mot de passe, renvoyez une invitation. Aucun mot de passe n’est affiché.</p>
    <article v-for="u in users" :key="u.id" class="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4">
      <div><strong>{{ u.name }}</strong> · {{ u.email }}<p>{{ !u.is_active ? 'Désactivé' : u.activated ? 'Accès activé' : 'Invitation à accepter' }}</p></div>
      <div class="flex gap-3"><button v-if="u.is_active" class="btn-secondary" :disabled="busy" @click="invite(u)">Renvoyer l’invitation</button><button class="btn-secondary" :disabled="busy" @click="toggle(u)">{{ u.is_active ? 'Désactiver' : 'Réactiver' }}</button></div>
    </article>
    <p v-if="!users.length">Aucun accès portail pour ce client.</p>
    <ClientPriceRequests :key="client.id" :client-id="client.id" />
  </section>
</template>
<script setup>
import { ref, watch } from 'vue'
import api from '@/services/api'
import ClientPriceRequests from '@/components/ClientPriceRequests.vue'
const props = defineProps({ client: { type: Object, required: true } })
const name = ref(''), email = ref(props.client.email || ''), users = ref([]), pending = ref(0), url = ref(''), error = ref(''), notice = ref(''), busy = ref(false)
const explain = e => Object.values(e.response?.data?.errors || {}).flat().join(' · ') || e.response?.data?.message || 'Opération impossible.'
async function load() {
  try { const { data } = await api.get(`/clients/${props.client.id}/portal-users`); users.value = data.users; url.value = data.url; pending.value = data.pending_emails }
  catch (e) { error.value = explain(e) }
}
async function run(fn) { if (busy.value) return; busy.value = true; error.value = ''; try { const { data } = await fn(); notice.value = data.message; await load() } catch (e) { error.value = explain(e) } finally { busy.value = false } }
const invite = u => run(() => api.post(`/clients/${props.client.id}/portal-users`, { name: u?.name || name.value, email: u?.email || email.value }))
const toggle = u => run(() => api.patch(`/clients/${props.client.id}/portal-users/${u.id}`, { is_active: !u.is_active }))
const retry = () => run(() => api.post('/portal-admin/retry-emails'))
watch(() => props.client.id, load, { immediate: true })
</script>
