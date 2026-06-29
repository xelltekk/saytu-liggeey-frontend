<template>
  <div class="space-y-4">
    <section class="rounded-lg border border-slate-200 bg-white p-4">
      <div class="flex flex-col gap-3 md:flex-row md:items-center">
        <div class="flex items-center gap-2"><button class="btn-secondary" title="Mois précédent" @click="changeMonth(-1)">‹</button><h3 class="min-w-48 text-center font-bold capitalize text-slate-900">{{ monthLabel }}</h3><button class="btn-secondary" title="Mois suivant" @click="changeMonth(1)">›</button></div>
        <select v-if="canManage" v-model="departementId" class="input md:ml-auto md:w-64" @change="load"><option value="">Tous les services</option><option v-for="d in departements" :key="d.id" :value="d.id">{{ d.libelle }}</option></select>
      </div>
      <div class="mt-3 flex flex-wrap gap-3 text-xs text-slate-600"><span class="flex items-center gap-1"><i class="h-2.5 w-2.5 rounded-full bg-green-500"></i> Approuvé</span><span class="flex items-center gap-1"><i class="h-2.5 w-2.5 rounded-full bg-orange-400"></i> En attente</span></div>
    </section>

    <section class="overflow-x-auto rounded-lg border border-slate-200 bg-white p-3">
      <div class="min-w-[760px]">
        <div class="grid grid-cols-7"><div v-for="day in weekdays" :key="day" class="border-b border-slate-200 px-2 py-2 text-center text-xs font-bold uppercase text-slate-500">{{ day }}</div></div>
        <div class="grid grid-cols-7">
          <div v-for="cell in cells" :key="cell.key" class="min-h-28 border-b border-r border-slate-100 p-2" :class="cell.current ? 'bg-white' : 'bg-slate-50 text-slate-300'">
            <div class="text-right text-xs font-semibold" :class="cell.today ? 'text-blue-700' : 'text-slate-500'">{{ cell.date.getDate() }}</div>
            <div class="mt-1 space-y-1"><div v-for="c in absences(cell.date)" :key="c.id" class="rounded px-1.5 py-1 text-xs" :class="c.statut === 'approuve' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'" :title="`${nom(c.employe)} · ${c.type_conge?.libelle || 'Conge'}`"><strong class="block truncate">{{ nom(c.employe) }}</strong><span class="block truncate opacity-80">{{ c.type_conge?.libelle || 'Conge' }}</span></div></div>
          </div>
        </div>
      </div>
    </section>

    <section class="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table class="w-full"><thead><tr><th>Employé</th><th>Service</th><th>Type</th><th>Période</th><th>Jours</th><th>Statut</th></tr></thead><tbody><tr v-for="c in conges" :key="c.id"><td>{{ nom(c.employe) }}</td><td>{{ c.employe?.departement?.libelle || '-' }}</td><td>{{ c.type_conge?.libelle || 'Conge' }}</td><td>{{ date(c.date_debut) }} au {{ date(c.date_fin) }}</td><td>{{ c.nombre_jours }}</td><td><span class="badge" :class="c.statut === 'approuve' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'">{{ c.statut }}</span></td></tr><tr v-if="!conges.length"><td colspan="6" class="py-10 text-center text-sm text-slate-400">Aucune absence sur ce mois.</td></tr></tbody></table>
    </section>
  </div>
</template>
<script setup>
import { computed, onMounted, ref } from 'vue'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'
defineProps({ canManage: Boolean, departements: { type: Array, default: () => [] } })
const toast = useToast(), selected = ref(new Date()), departementId = ref(''), conges = ref([]), weekdays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const monthLabel = computed(() => selected.value.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }))
const cells = computed(() => { const first = new Date(selected.value.getFullYear(), selected.value.getMonth(), 1), offset = (first.getDay() + 6) % 7, start = new Date(first); start.setDate(first.getDate() - offset); return Array.from({ length: 42 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return { key: d.toISOString(), date: d, current: d.getMonth() === selected.value.getMonth(), today: d.toDateString() === new Date().toDateString() } }) })
function iso(d) { return new Date(d).toISOString().slice(0, 10) } function nom(e) { return e ? `${e.prenom || ''} ${e.nom || ''}`.trim() : '-' } function date(v) { return v ? new Date(v).toLocaleDateString('fr-FR') : '-' }
function absences(day) { const value = iso(day); return conges.value.filter(c => c.date_debut.slice(0, 10) <= value && c.date_fin.slice(0, 10) >= value) }
function changeMonth(delta) { selected.value = new Date(selected.value.getFullYear(), selected.value.getMonth() + delta, 1); load() }
async function load() { try { conges.value = (await api.get('/rh/conges/planning', { params: { mois: `${selected.value.getFullYear()}-${String(selected.value.getMonth() + 1).padStart(2, '0')}`, departement_id: departementId.value || undefined } })).data.conges } catch (e) { toast.error(e.response.data.message || 'Impossible de charger le planning des congés.') } }
onMounted(load)
</script>
<style scoped>th{@apply whitespace-nowrap bg-slate-50 px-3 py-3 text-left text-xs uppercase text-slate-500}td{@apply whitespace-nowrap border-t border-slate-100 px-3 py-3 text-sm text-slate-700}</style>
