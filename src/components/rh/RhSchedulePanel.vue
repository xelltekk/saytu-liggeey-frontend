<template>
  <div class="grid gap-4 xl:grid-cols-[400px_1fr]">
    <form class="rounded-lg border border-slate-200 bg-white p-4" @submit.prevent="save">
      <div class="flex items-center justify-between gap-2"><h3 class="font-bold text-slate-900">{{ form.id ? 'Modifier l’horaire' : 'Nouvel horaire' }}</h3><button v-if="form.id" type="button" class="text-sm text-slate-600" @click="reset">Annuler</button></div>
      <div class="mt-4 space-y-3">
        <label class="label">Libellé<input v-model="form.libelle" class="input" placeholder="Ex. Horaire général" required /></label>
        <label class="label">Portée<select v-model="form.portee" class="input" @change="clearTarget"><option value="general">Tous les employés</option><option value="departement">Un service</option><option value="employe">Un employé précis</option></select></label>
        <label v-if="form.portee === 'departement'" class="label">Service<select v-model.number="form.departement_id" class="input" required><option :value="null">Choisir un service</option><option v-for="d in departements" :key="d.id" :value="d.id">{{ d.libelle }}</option></select></label>
        <label v-if="form.portee === 'employe'" class="label">Employé<select v-model.number="form.employe_id" class="input" required><option :value="null">Choisir un employé</option><option v-for="e in employes" :key="e.id" :value="e.id">{{ nom(e) }}</option></select></label>
        <div class="grid grid-cols-2 gap-2"><label class="label">Arrivée attendue<input v-model="form.heure_arrivee" type="time" class="input" required /></label><label class="label">Départ indicatif<input v-model="form.heure_depart" type="time" class="input" /></label></div>
        <label class="label">Tolérance de retard (minutes)<input v-model.number="form.tolerance_retard_minutes" type="number" min="0" max="240" class="input" required /></label>
        <fieldset><legend class="label">Jours travaillés</legend><div class="mt-2 grid grid-cols-4 gap-2"><label v-for="j in jours" :key="j.id" class="flex items-center gap-2 rounded-md border border-slate-200 p-2 text-sm"><input v-model="form.jours_travailles" type="checkbox" :value="j.id" /> {{ j.label }}</label></div></fieldset>
        <label class="flex items-center gap-2 text-sm text-slate-700"><input v-model="form.is_active" type="checkbox" /> Horaire actif</label>
        <button class="btn-primary w-full">{{ form.id ? 'Mettre à jour' : 'Ajouter l’horaire' }}</button>
      </div>
    </form>

    <section class="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <div class="p-4"><h3 class="font-bold text-slate-900">Règles horaires</h3><p class="mt-1 text-sm text-slate-500">Priorité automatique : employé, puis service, puis règle générale.</p></div>
      <table class="w-full"><thead><tr><th>Règle</th><th>Portée</th><th>Jours</th><th>Arrivée</th><th>Départ</th><th>Tolérance</th><th>État</th><th></th></tr></thead><tbody>
        <tr v-for="h in horaires" :key="h.id"><td class="font-medium">{{ h.libelle }}</td><td>{{ portee(h) }}</td><td>{{ joursLabel(h.jours_travailles) }}</td><td>{{ h.heure_arrivee.slice(0, 5) }}</td><td>{{ h.heure_depart.slice(0, 5) || '-' }}</td><td>{{ h.tolerance_retard_minutes }} min</td><td><span class="badge" :class="h.is_active ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'">{{ h.is_active ? 'Actif' : 'Inactif' }}</span></td><td><div class="flex gap-2"><button class="text-blue-700" @click="edit(h)">Modifier</button><button class="text-red-700" @click="remove(h)">Supprimer</button></div></td></tr>
        <tr v-if="!horaires.length"><td colspan="8" class="py-10 text-center text-sm text-slate-400">Aucune règle enregistrée. Le système utilise lundi à vendredi, arrivée à 09:00.</td></tr>
      </tbody></table>
    </section>
  </div>
</template>
<script setup>
import { onMounted, reactive, ref } from 'vue'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'
defineProps({ employes: { type: Array, default: () => [] }, departements: { type: Array, default: () => [] } })
const toast = useToast(), horaires = ref([]), jours = [{ id: 1, label: 'Lun' }, { id: 2, label: 'Mar' }, { id: 3, label: 'Mer' }, { id: 4, label: 'Jeu' }, { id: 5, label: 'Ven' }, { id: 6, label: 'Sam' }, { id: 7, label: 'Dim' }]
const empty = () => ({ id: null, libelle: '', portee: 'general', departement_id: null, employe_id: null, heure_arrivee: '09:00', heure_depart: '17:00', tolerance_retard_minutes: 0, jours_travailles: [1, 2, 3, 4, 5], is_active: true }), form = reactive(empty())
function nom(e) { return `${e.prenom || ''} ${e.nom || ''}`.trim() } function clearTarget() { form.departement_id = null; form.employe_id = null } function reset() { Object.assign(form, empty()) }
function portee(h) { return h.employe ? `Employé : ${nom(h.employe)}` : h.departement ? `Service : ${h.departement?.libelle || '-'}` : 'Tous les employés' } function joursLabel(ids) { return jours.filter(j => ids.includes(j.id)).map(j => j.label).join(', ') }
async function load() { horaires.value = (await api.get('/rh/horaires')).data }
async function save() { try { const payload = { ...form }; delete payload.id; delete payload.portee; form.id ? await api.put(`/rh/horaires/${form.id}`, payload) : await api.post('/rh/horaires', payload); toast.success('Horaire enregistré.'); reset(); await load() } catch (e) { const validation = Object.values(e.response.data.errors || {})[0]?.[0]; toast.error(validation || (e.response.status === 500 ? 'Impossible d’enregistrer l’horaire : vérifiez que la migration des horaires RH a été exécutée sur le serveur.' : e.response.data.message) || 'Enregistrement impossible.') } }
function edit(h) { Object.assign(form, { ...h, heure_arrivee: h.heure_arrivee.slice(0, 5), heure_depart: h.heure_depart.slice(0, 5) || '', portee: h.employe_id ? 'employe' : h.departement_id ? 'departement' : 'general' }) }
async function remove(h) { if (!confirm(`Supprimer l’horaire « ${h.libelle} » `)) return; try { await api.delete(`/rh/horaires/${h.id}`); toast.success('Horaire supprimé.'); await load() } catch { toast.error('Suppression impossible.') } }
onMounted(load)
</script>
<style scoped>.label{@apply block space-y-1 text-sm font-medium text-slate-700}th{@apply whitespace-nowrap bg-slate-50 px-3 py-3 text-left text-xs uppercase text-slate-500}td{@apply whitespace-nowrap border-t border-slate-100 px-3 py-3 text-sm text-slate-700}</style>
