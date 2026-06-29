<template>
  <div class="space-y-4">
    <section class="rounded-lg border border-slate-200 bg-white p-4">
      <div class="grid gap-2 md:grid-cols-[1fr_190px_150px_150px_auto]">
        <input v-model="filters.search" class="input" placeholder="Rechercher une action, une reference..." @keyup.enter="load" />
        <select v-model="filters.category" class="input" @change="load">
          <option value="">Tous les domaines RH</option>
          <option v-for="category in categories" :key="category" :value="category">{{ labelCategory(category) }}</option>
        </select>
        <input v-model="filters.date_from" type="date" class="input" />
        <input v-model="filters.date_to" type="date" class="input" />
        <div class="flex gap-2">
          <button class="btn-secondary" @click="load">Actualiser</button>
          <button class="btn-primary" @click="exportCsv">Exporter</button>
        </div>
      </div>
    </section>

    <section class="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <div v-if="!journal.writable" class="border-b border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800">
        Le serveur ne peut pas encore enregistrer les activites RH. Verifiez les droits du dossier <code>storage/logs</code>.
      </div>
      <div v-else-if="journal.source === 'database'" class="border-b border-green-100 bg-green-50 px-4 py-3 text-sm text-green-800">
        Historique connecte a la base de donnees. Les nouvelles actions RH seront conservees en ligne.
      </div>
      <div v-else-if="!activities.length" class="border-b border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
        Le journal fonctionne. Il commencera a afficher les nouvelles activites RH realisees apres son installation.
      </div>
      <table class="w-full">
        <thead><tr><th>Date</th><th>Domaine</th><th>Utilisateur</th><th>Action</th><th>Reference</th></tr></thead>
        <tbody>
          <tr v-for="item in activities" :key="`${item.date}-${item.category}-${item.subject_id}-${item.event}`">
            <td class="whitespace-nowrap">{{ formatDate(item.date) }}</td>
            <td><span class="badge bg-blue-50 text-blue-700">{{ labelCategory(item.category) }}</span></td>
            <td><strong>{{ item.user_name || 'Systeme' }}</strong><p class="text-xs text-slate-500">{{ item.user_role || '-' }}</p></td>
            <td><strong class="text-slate-900">{{ item.title || item.event }}</strong><p class="mt-1 text-xs text-slate-500">{{ item.description || '-' }}</p></td>
            <td class="font-mono text-xs">{{ item.reference || '-' }}</td>
          </tr>
          <tr v-if="!activities.length"><td colspan="5" class="py-12 text-center text-sm text-slate-400">Aucune activite RH pour ces filtres.</td></tr>
        </tbody>
      </table>
      <p class="border-t border-slate-100 px-4 py-3 text-xs text-slate-500">{{ activities.length }} activite(s) affichee(s). Journal conserve dans storage/logs.</p>
    </section>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'
const toast = useToast()
const activities = ref([]), categories = ref([])
const journal = reactive({ exists: false, readable: false, writable: true })
const filters = reactive({ search: '', category: '', date_from: '', date_to: '', limit: 300 })
const labels = { 'rh.personnel': 'Personnel', 'rh.conges': 'Conges', 'rh.presences': 'Presences', 'rh.horaires': 'Horaires', 'rh.documents': 'Documents', 'rh.paie': 'Paie', 'rh.materiels': 'Materiel', 'rh.configuration': 'Configuration' }
function labelCategory(value) { return labels[value] || String(value || '').replace('rh.', '') }
function formatDate(value) { return value ? new Date(value.replace(' ', 'T')).toLocaleString('fr-FR') : '-' }
async function load() { try { const { data } = await api.get('/rh/historique', { params: filters }); activities.value = data.data; categories.value = data.categories; Object.assign(journal, data.journal || {}) } catch (e) { toast.error(e.response.data.message || 'Impossible de charger l’historique RH.') } }
async function exportCsv() { try { const response = await api.get('/rh/historique/export', { params: filters, responseType: 'blob' }); const link = document.createElement('a'); link.href = URL.createObjectURL(response.data); link.download = `historique-rh-${new Date().toISOString().slice(0, 10)}.csv`; link.click(); URL.revokeObjectURL(link.href) } catch { toast.error('Export historique RH impossible.') } }
onMounted(load)
</script>

<style scoped>
th{@apply whitespace-nowrap bg-slate-50 px-3 py-3 text-left text-xs uppercase text-slate-500}
td{@apply border-t border-slate-100 px-3 py-3 text-sm text-slate-700}
</style>
