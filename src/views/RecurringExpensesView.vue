<template>
  <div class="space-y-5">
    <section class="rounded-xl border bg-white p-5">
      <button class="app-back-button" @click="router.push('/agenda')"><span class="app-back-button__arrow">←</span>Retour à l’agenda</button>
      <div class="mt-4 flex flex-wrap items-center justify-between gap-3"><div><h1 class="text-xl font-bold">Dépenses récurrentes</h1><p class="mt-1 text-sm text-slate-600">Internet, eau, loyer et abonnements : vos échéances et rappels dans l’application.</p></div><button class="btn-primary" @click="create">+ Dépense récurrente</button></div>
    </section>
    <p v-if="error" role="alert" class="rounded-lg bg-red-50 p-3 text-red-800">{{ error }}</p>
    <section v-if="editing" class="rounded-xl border bg-white p-5">
      <h2 class="mb-4 text-lg font-bold">{{ form.id ? 'Modifier la dépense' : 'Nouvelle dépense récurrente' }}</h2>
      <form class="grid gap-4 md:grid-cols-2" @submit.prevent="save">
        <label class="block">Libellé *<input v-model="form.title" required maxlength="191" class="input mt-1" placeholder="Ex. Connexion internet" /></label>
        <label class="block">Fournisseur<input v-model="form.supplier" maxlength="191" class="input mt-1" placeholder="Ex. Opérateur internet" /></label>
        <label class="block">Montant indicatif ({{ currency }})<input v-model="form.amount" type="number" min="0" step="0.01" class="input mt-1" placeholder="Laisser vide si variable" /></label>
        <label class="block">Première échéance *<input v-model="form.first_due_date" :disabled="form.payments_count > 0" type="date" required min="2000-01-01" max="2100-12-31" class="input mt-1" /></label>
        <label class="block">Périodicité *<select v-model.number="form.interval_months" :disabled="form.payments_count > 0" class="input mt-1"><option v-for="p in periods" :key="p.value" :value="p.value">{{ p.label }}</option></select></label>
        <label class="block">Rappel avant l’échéance (jours) *<input v-model.number="form.reminder_days" type="number" min="0" max="90" required class="input mt-1" /><span class="mt-1 block text-xs text-slate-500">0 = le jour même. L’alerte reste visible jusqu’au paiement.</span></label>
        <label class="block md:col-span-2">Notes<textarea v-model="form.notes" maxlength="2000" rows="2" class="input mt-1" /></label>
        <label class="flex items-center gap-2"><input v-model="form.is_active" type="checkbox" />Activer les échéances et les rappels</label>
        <p v-if="form.payments_count" class="text-xs text-slate-500">Pour changer les dates ou la périodicité après un paiement, désactivez cette série et créez-en une nouvelle.</p>
        <div class="flex justify-end gap-2 md:col-span-2"><button type="button" class="btn-secondary" @click="editing = false">Annuler</button><button :disabled="saving" type="submit" class="btn-primary">{{ saving ? 'Enregistrement…' : 'Enregistrer' }}</button></div>
      </form>
    </section>
    <section class="rounded-xl border bg-white p-5">
      <div class="flex flex-wrap items-center justify-between gap-3"><h2 class="text-lg font-bold">Échéances du mois</h2><label>Mois <input v-model="month" type="month" class="input" @change="load" /></label></div>
      <p v-if="loading" class="py-5 text-slate-500">Chargement…</p>
      <p v-else-if="!occurrences.length" class="py-5 text-slate-500">Aucune échéance pour ce mois.</p>
      <div v-else class="mt-4 space-y-3">
        <article v-for="row in occurrences" :key="row.expense_id + row.date" class="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
          <div><strong>{{ row.title }}</strong><p class="text-sm text-slate-600">{{ formatDate(row.date) }}<span v-if="row.supplier"> · {{ row.supplier }}</span></p><span class="text-sm font-semibold" :class="row.paid ? 'text-green-700' : row.status === 'retard' ? 'text-red-700' : 'text-amber-700'">{{ row.paid ? 'Payée le ' + formatDate(row.paid_on) : row.status === 'retard' ? 'En retard' : 'À payer' }}</span></div>
          <div class="flex flex-wrap items-center gap-3"><strong>{{ row.amount === null ? 'Montant variable' : money(row.amount) }}</strong><button v-if="!row.paid" class="btn-primary" @click="payment = { ...row, paid_on: today, amount: row.amount ?? '' }">Marquer payée</button><button v-else class="btn-secondary" :disabled="saving" @click="undo(row)">Annuler le paiement</button></div>
        </article>
      </div>
      <p class="mt-4 text-xs text-slate-500">Le suivi des paiements dans l’agenda est distinct de la saisie comptable dans Dépenses.</p>
    </section>
    <section class="rounded-xl border bg-white p-5"><h2 class="text-lg font-bold">Mes dépenses récurrentes</h2><p v-if="!items.length && !loading" class="py-5 text-slate-500">Ajoutez votre première dépense récurrente.</p>
      <div class="mt-4 grid gap-3 lg:grid-cols-2"><article v-for="item in items" :key="item.id" class="rounded-lg border p-4"><div class="flex items-start justify-between gap-3"><strong>{{ item.title }}</strong><span class="text-xs" :class="item.is_active ? 'text-green-700' : 'text-slate-500'">{{ item.is_active ? 'Active' : 'Désactivée' }}</span></div><p class="mt-1 text-sm text-slate-600">{{ periodLabel(item.interval_months) }} · Rappel {{ item.reminder_days }} jour(s) avant</p><p class="mt-1 text-sm">Prochaine échéance non payée : {{ formatDate(item.next_due_date) }}</p><button class="btn-secondary mt-3" @click="edit(item)">Modifier</button></article></div>
    </section>
    <AppModal :model-value="!!payment" title="Confirmer le paiement" @update:model-value="value => { if (!value) payment = null }">
      <form v-if="payment" class="space-y-4" @submit.prevent="pay"><p>{{ payment.title }} · échéance du {{ formatDate(payment.date) }}</p><label class="block">Date du paiement<input v-model="payment.paid_on" type="date" required :max="today" class="input mt-1" /></label><label class="block">Montant payé ({{ currency }})<input v-model="payment.amount" type="number" min="0" step="0.01" required class="input mt-1" /></label><p v-if="paymentError" role="alert" class="text-red-700">{{ paymentError }}</p><button :disabled="saving" type="submit" class="btn-primary">Confirmer le paiement</button></form>
    </AppModal>
  </div>
</template>
<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'
import AppModal from '@/components/AppModal.vue'
import { useToast } from '@/composables/useToast'
import { usePageReactivation } from '@/composables/usePageReactivation'
import { useConfirm } from '@/composables/useConfirm'
import { useNotificationsStore } from '@/stores/notifications'
import { formatMoney } from '@/composables/useCurrency'
const router=useRouter(), route=useRoute(), toast=useToast(), {confirm}=useConfirm(), notifications=useNotificationsStore()
const localDate=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
const today=localDate(), month=ref(route.query.month || today.slice(0,7)), currency=ref('XOF')
const items=ref([]),occurrences=ref([]),loading=ref(false),saving=ref(false),editing=ref(false),error=ref(''),payment=ref(null),paymentError=ref('')
const form=reactive({})
const periods=[{value:1,label:'Mensuelle'},{value:2,label:'Bimestrielle (tous les 2 mois)'},{value:3,label:'Trimestrielle'},{value:6,label:'Semestrielle'},{value:12,label:'Annuelle'},{value:24,label:'Tous les 2 ans'}]
const periodLabel=n=>periods.find(p=>p.value===n)?.label || `Tous les ${n} mois`
const money=n=>formatMoney(n)
const formatDate=d=>d?new Intl.DateTimeFormat('fr-FR').format(new Date(d.slice(0,10)+'T00:00:00')):'—'
const explain=e=>Object.values(e.response?.data?.errors||{}).flat().join(' ') || e.response?.data?.message || 'Opération impossible. Réessayez.'
async function load(){loading.value=true;error.value='';try{const {data}=await api.get('/agenda/depenses-recurrentes',{params:{month:month.value}});items.value=data.items;occurrences.value=data.occurrences}catch(e){error.value=explain(e)}finally{loading.value=false}}
function create(){Object.assign(form,{id:null,title:'',supplier:'',amount:'',first_due_date:today,interval_months:1,reminder_days:7,notes:'',is_active:true,payments_count:0});editing.value=true}
function edit(item){Object.assign(form,item,{amount:item.amount??''});editing.value=true;window.scrollTo({top:0,behavior:'smooth'})}
async function refresh(){await load();await Promise.all([notifications.fetchBadges({force:true}),notifications.fetchDetails({force:true})])}
async function save(){saving.value=true;error.value='';try{const payload={...form,amount:form.amount===''?null:Number(form.amount)};await (form.id?api.put('/agenda/depenses-recurrentes/'+form.id,payload):api.post('/agenda/depenses-recurrentes',payload));editing.value=false;toast.success('Dépense récurrente enregistrée.');await refresh()}catch(e){error.value=explain(e)}finally{saving.value=false}}
async function pay(){saving.value=true;paymentError.value='';try{await api.post(`/agenda/depenses-recurrentes/${payment.value.expense_id}/paiement`,{due_date:payment.value.date,paid_on:payment.value.paid_on,amount:Number(payment.value.amount)});payment.value=null;toast.success('Paiement confirmé dans l’agenda.');await refresh()}catch(e){paymentError.value=explain(e)}finally{saving.value=false}}
async function undo(row){if(!await confirm({message:'Annuler ce paiement dans l’agenda ? L’échéance sera de nouveau à payer.',tone:'danger'}))return;saving.value=true;try{await api.delete(`/agenda/depenses-recurrentes/${row.expense_id}/paiement`,{data:{due_date:row.date}});await refresh()}catch(e){error.value=explain(e)}finally{saving.value=false}}
watch(()=>route.query.month,value=>{if(value&&value!==month.value){month.value=value;load()}})
watch(payment,()=>{paymentError.value=''})
onMounted(()=>{load();api.get('/societe/identite').then(({data})=>{currency.value=data.devise_defaut||'XOF'}).catch(()=>{})})
usePageReactivation(load)
</script>
