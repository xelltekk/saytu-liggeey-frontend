<template>
  <div class="app-surface space-y-4">
    <section class="rounded-3xl border border-cyan-200 bg-cyan-50/80 p-5 shadow-sm">
      <button type="button" class="mb-4 text-sm font-black text-cyan-700 hover:text-cyan-900" @click="goBack">← Retour stock</button>
      <p class="text-xs font-black uppercase tracking-[0.22em] text-cyan-700">Stock</p>
      <h1 class="mt-2 text-2xl font-black text-slate-950">{{ title }}</h1>
      <p class="mt-1 text-sm text-cyan-800">Saisie en page complète, sans fenêtre flottante.</p>
    </section>

    <section class="rounded-3xl border border-cyan-200 bg-white p-5 shadow-sm">
      <div v-if="loading" class="p-10 text-center text-slate-500">Chargement...</div>
      <MouvementForm v-else :type="type" :entrepots="entrepots" @saved="onSaved" @cancel="goBack" />
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'
import MouvementForm from '@/components/MouvementForm.vue'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const entrepots = ref([])
const type = computed(() => ['entree', 'sortie', 'ajustement'].includes(route.params.type) ? route.params.type : 'entree')
const title = computed(() => ({
  entree: 'Entrée en stock',
  sortie: 'Sortie de stock',
  ajustement: 'Ajustement d’inventaire',
}[type.value]))

onMounted(async () => {
  try {
    const { data } = await api.get('/entrepots', { params: { actifs_seulement: 1 } })
    entrepots.value = Array.isArray(data) ? data : data.data || []
  } finally {
    loading.value = false
  }
})

function onSaved() {
  goBack()
}

function goBack() {
  router.push({ name: 'stock' })
}
</script>

