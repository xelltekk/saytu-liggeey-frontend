<template>
  <div class="app-surface space-y-4">
    <section class="rounded-3xl border border-cyan-200 bg-cyan-50/80 p-5 shadow-sm">
      <button
        type="button"
        class="mb-4 text-sm font-black text-cyan-700 hover:text-cyan-900"
        @click="goBack"
      >
        ← Retour liste
      </button>

      <p class="text-xs font-black uppercase tracking-[0.22em] text-cyan-700">Catégorie produit</p>
      <div class="mt-2 flex flex-wrap items-center gap-2">
        <h1 class="text-2xl font-black text-slate-950">
          {{ isCreate ? 'Nouvelle catégorie' : category?.libelle || 'Catégorie' }}
        </h1>
        <span
          v-if="category"
          class="rounded-full px-3 py-1 text-xs font-black"
          :class="category.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'"
        >
          {{ category.is_active ? 'Actif' : 'Inactif' }}
        </span>
      </div>
      <p class="mt-1 text-sm text-cyan-800">
        <template v-if="isCreate">Saisie en page complète, sans fenêtre flottante.</template>
        <template v-else>{{ category?.code || 'Code non renseigné' }} · {{ category?.produits_count || 0 }} produit(s)</template>
      </p>
    </section>

    <section class="rounded-3xl border border-cyan-200 bg-white p-5 shadow-sm">
      <div class="mb-4 border-b border-cyan-100">
        <button
          type="button"
          class="-mb-px rounded-t-2xl border border-cyan-200 border-b-white bg-white px-5 py-3 text-sm font-black text-cyan-700"
        >
          Saisie catégorie
        </button>
      </div>

      <div v-if="loading" class="p-10 text-center text-slate-500">Chargement...</div>
      <CategorieProduitForm v-else :category="category" @saved="onSaved" @cancel="goBack" />
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'
import CategorieProduitForm from '@/components/CategorieProduitForm.vue'
import { useToast } from '@/composables/useToast'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const category = ref(null)
const loading = ref(true)
const isCreate = computed(() => route.name === 'categorie-produit-create')

onMounted(loadCategory)
watch(() => route.params.id, loadCategory)

async function loadCategory() {
  if (isCreate.value) {
    category.value = null
    loading.value = false
    return
  }

  if (!route.params.id) return

  loading.value = true
  try {
    const { data } = await api.get(`/categories-produits/${route.params.id}`)
    category.value = data
  } catch (error) {
    toast.error('Catégorie introuvable.')
    router.replace({ name: 'categories-produits' })
  } finally {
    loading.value = false
  }
}

function goBack() {
  router.push({ name: 'categories-produits' })
}

function onSaved() {
  goBack()
}
</script>
