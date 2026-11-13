<template>
  <div class="space-y-5">
    <header class="rounded-xl border bg-white p-5">
      <RouterLink to="/prospection" class="app-back-button">← Retour à la prospection</RouterLink>
      <div class="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div><h1 class="text-2xl font-bold text-slate-900">{{ manager ? 'Suivi des commerciaux' : 'Mon activité commerciale' }}</h1><p class="mt-1 text-sm text-slate-600">Les tâches à traiter, les blocages et les résultats de votre {{ manager ? 'équipe' : 'activité' }}.</p></div>
        <RouterLink :to="{ name: 'prospection-action-create', query: { commercial_id: commercial || undefined, from: 'suivi' } }" class="btn-primary">+ Action</RouterLink>
      </div>
    </header>
    <p v-if="error" role="alert" class="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">{{ error }} <button class="underline" @click="reload">Réessayer</button></p>
    <section class="rounded-xl border bg-white p-5" aria-labelledby="team-heading">
      <div class="flex flex-wrap items-end justify-between gap-3"><h2 id="team-heading" class="text-lg font-bold">{{ manager ? 'Vue de l’équipe' : 'Mes résultats' }}</h2><div class="flex flex-wrap gap-3"><label class="text-sm">Du<input v-model="from" type="date" class="input mt-1" @change="loadSummary" /></label><label class="text-sm">Au<input v-model="to" type="date" class="input mt-1" @change="loadSummary" /></label></div></div>
      <p class="mt-3 text-sm text-slate-600">La période concerne le CA facturé TTC et les actions terminées selon leur date prévue. Les tâches ouvertes, prospects et devis en attente couvrent toutes les périodes.</p>
      <p v-if="loading" class="mt-4" role="status">Chargement...</p>
      <div class="mt-4 grid gap-4 xl:grid-cols-2">
        <article v-for="row in summary.items" :key="row.id" class="rounded-xl border border-slate-200 p-4">
          <div class="flex flex-wrap justify-between gap-2"><h3 class="font-bold">{{ row.name }} <span v-if="!row.active" class="text-sm text-slate-500">(inactif)</span></h3><button class="text-sm font-semibold text-blue-700 underline" @click="selectCommercial(row.id)">Voir les tâches</button></div>
          <dl class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div v-for="metric in metrics" :key="metric.key" class="rounded-lg bg-slate-50 p-3"><dt class="text-xs text-slate-600">{{ metric.label }}</dt><dd class="mt-1 text-xl font-bold" :class="row[metric.key] && ['retard','bloquees'].includes(metric.key) ? 'text-red-700' : 'text-slate-900'">{{ metric.key === 'ca' ? money(row.ca) : row[metric.key] }}</dd></div>
          </dl>
        </article>
      </div>
      <p v-if="!loading && !summary.items.length" class="mt-4 text-slate-500">Aucun commercial à afficher.</p>
      <button v-if="manager && summary.non_affectees" class="mt-4 rounded-lg bg-amber-50 p-3 text-amber-900 underline" @click="selectUnassigned">{{ summary.non_affectees }} tâche(s) ouverte(s) sans commercial : les affecter</button>
    </section>
    <section class="rounded-xl border bg-white p-5" aria-labelledby="tasks-heading">
      <h2 id="tasks-heading" class="text-lg font-bold">{{ manager ? 'Tâches de l’équipe' : 'Mes tâches' }}</h2>
      <div class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label v-if="manager" class="text-sm">Commercial<select v-model="commercial" class="input mt-1" @change="loadTasks(1)"><option value="">Tous les commerciaux</option><option value="unassigned">Sans commercial</option><option v-for="u in summary.items" :key="u.id" :value="String(u.id)">{{ u.name }}</option></select></label>
        <label class="text-sm">État<select v-model="status" class="input mt-1" @change="loadTasks(1)"><option value="pending">À traiter</option><option value="overdue">En retard</option><option value="planifiee">À faire</option><option value="en_cours">En cours</option><option value="bloquee">Bloquées</option><option value="effectuee">Terminées</option><option value="annulee">Annulées</option><option value="">Tous les états</option></select></label>
        <label class="text-sm">Priorité<select v-model="priority" class="input mt-1" @change="loadTasks(1)"><option value="">Toutes les priorités</option><option v-for="(label,key) in priorities" :key="key" :value="key">{{ label }}</option></select></label>
        <form @submit.prevent="loadTasks(1)"><label class="text-sm">Rechercher<input v-model="search" class="input mt-1" placeholder="Client ou action, puis Entrée" /></label></form>
      </div>
      <p class="mt-3 text-xs text-slate-500">Tri par date prévue, des plus anciennes aux plus récentes. Une tâche terminée ou annulée n’est plus comptée en retard.</p>
      <p v-if="taskLoading" role="status" class="mt-4">Chargement des tâches...</p>
      <div v-else class="mt-4 space-y-3">
        <article v-for="task in tasks.data" :key="task.id" class="rounded-lg border p-4">
          <div class="flex flex-wrap justify-between gap-3"><div class="min-w-0"><h3 class="break-words font-bold">{{ task.objet }}</h3><p class="mt-1 text-sm text-slate-600">{{ task.client?.nom }} · {{ task.commercial?.name || 'Sans commercial' }}</p></div><RouterLink :to="{name:'prospection-action-detail',params:{id:task.id},query:{from:'suivi'}}" class="btn-secondary">Ouvrir / traiter</RouterLink></div>
          <div class="mt-3 flex flex-wrap gap-3 text-sm"><span class="font-semibold">{{ statuses[task.statut] || task.statut }}</span><span :class="['haute','urgente'].includes(task.priorite)?'font-semibold text-amber-800':''">Priorité {{ priorities[task.priorite] || 'Normale' }}</span><span :class="late(task)?'font-semibold text-red-700':''">Prévue le {{ date(task.date_action) }}{{ late(task)?' · En retard':'' }}</span></div>
          <p v-if="task.statut==='bloquee' && task.blocage" class="mt-3 whitespace-pre-wrap rounded bg-amber-50 p-3 text-sm text-amber-900">Blocage : {{ task.blocage }}</p>
          <p v-if="task.compte_rendu" class="mt-3 whitespace-pre-wrap break-words text-sm"><strong>Compte rendu :</strong> {{ task.compte_rendu }}</p>
          <p v-if="task.note_gerant" class="mt-3 whitespace-pre-wrap break-words text-sm text-blue-900"><strong>Réponse du gérant :</strong> {{ task.note_gerant }}</p>
        </article>
        <p v-if="!tasks.data.length" class="py-6 text-center text-slate-500">Aucune tâche pour ces filtres.</p>
      </div>
      <div v-if="tasks.last_page>1" class="mt-4 flex flex-wrap items-center justify-between gap-3"><button class="btn-secondary" :disabled="tasks.current_page<=1 || taskLoading" @click="loadTasks(tasks.current_page-1)">Précédent</button><span class="text-sm">Page {{ tasks.current_page }} / {{ tasks.last_page }} · {{ tasks.total }} tâches</span><button class="btn-secondary" :disabled="tasks.current_page>=tasks.last_page || taskLoading" @click="loadTasks(tasks.current_page+1)">Suivant</button></div>
    </section>
  </div>
</template>
<script setup>
import {computed,onMounted,ref} from 'vue'
import {useAuthStore} from '@/stores/auth'
import {hasAnyRole} from '@/utils/access'
import {usePageReactivation} from '@/composables/usePageReactivation'
import api from '@/services/api'
const auth=useAuthStore(),manager=computed(()=>hasAnyRole(auth.user,['admin','gerant']))
const today=new Date(), localDate=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
const from=ref(localDate(new Date(today.getFullYear(),today.getMonth(),1))),to=ref(localDate(today))
const summary=ref({items:[],non_affectees:0}),tasks=ref({data:[],current_page:1,last_page:1,total:0})
const loading=ref(false),taskLoading=ref(false),error=ref(''),commercial=ref(''),status=ref('pending'),priority=ref(''),search=ref('')
const metrics=[{key:'a_faire',label:'À faire'},{key:'en_cours',label:'En cours'},{key:'bloquees',label:'Bloquées'},{key:'retard',label:'En retard'},{key:'terminees',label:'Terminées · période'},{key:'prospects',label:'Prospects suivis'},{key:'devis_attente',label:'Devis en attente'},{key:'ca',label:'CA TTC · période'}]
const priorities={basse:'Basse',normale:'Normale',haute:'Haute',urgente:'Urgente'},statuses={planifiee:'À faire',en_cours:'En cours',bloquee:'Bloquée',effectuee:'Terminée',annulee:'Annulée'}
let taskRequest=0,summaryRequest=0
async function loadSummary(){const token=++summaryRequest;if(!from.value||!to.value||from.value>to.value){loading.value=false;error.value='Choisissez une période valide.';return}loading.value=true;try{const {data}=await api.get('/prospection/suivi-equipe',{params:{date_from:from.value,date_to:to.value}});if(token===summaryRequest)summary.value=data}catch(e){error.value=e.response?.data?.message||'Impossible de charger le suivi.'}finally{if(token===summaryRequest)loading.value=false}}
async function loadTasks(page=1){const token=++taskRequest;taskLoading.value=true;try{const {data}=await api.get('/prospection/actions',{params:{page,per_page:15,worklist:1,commercial_id:commercial.value && commercial.value!=='unassigned'?commercial.value:undefined,unassigned:commercial.value==='unassigned'?1:undefined,pending:status.value==='pending'?1:undefined,overdue:status.value==='overdue'?1:undefined,statut:['pending','overdue'].includes(status.value)?undefined:status.value||undefined,priorite:priority.value||undefined,search:search.value||undefined}});if(token===taskRequest)tasks.value=data}catch(e){error.value=e.response?.data?.message||'Impossible de charger les tâches.'}finally{if(token===taskRequest)taskLoading.value=false}}
function selectCommercial(id){commercial.value=String(id);status.value='pending';loadTasks(1);document.getElementById('tasks-heading')?.scrollIntoView({behavior:'smooth'})}
function selectUnassigned(){commercial.value='unassigned';status.value='pending';loadTasks(1)}
function late(t){return !['effectuee','annulee'].includes(t.statut)&&new Date(t.date_action)<new Date()}
const date=d=>d?new Date(d).toLocaleString('fr-FR'):'-',money=n=>new Intl.NumberFormat('fr-FR',{maximumFractionDigits:0}).format(n)
async function reload(){error.value='';await Promise.all([loadSummary(),loadTasks()])}
onMounted(reload);usePageReactivation(reload)
</script>
