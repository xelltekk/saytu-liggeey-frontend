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

      <p class="text-xs font-black uppercase tracking-[0.22em] text-cyan-700">Compte de trésorerie</p>
      <h1 class="mt-2 text-2xl font-black text-slate-950">
        {{ isEdit ? 'Modifier compte de trésorerie' : 'Nouveau compte de trésorerie' }}
      </h1>
      <p class="mt-1 text-sm text-cyan-800">Saisie en page complète, sans fenêtre flottante.</p>
    </section>

    <section class="rounded-3xl border border-cyan-200 bg-white p-5 shadow-sm">
      <div class="mb-4 border-b border-cyan-100">
        <button
          type="button"
          class="-mb-px rounded-t-2xl border border-cyan-200 border-b-white bg-white px-5 py-3 text-sm font-black text-cyan-700"
        >
          Informations compte
        </button>
      </div>

      <TresorerieCompteForm :compte-id="compteId" @saved="onSaved" @cancel="goBack" />
    </section>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import TresorerieCompteForm from '@/components/TresorerieCompteForm.vue'

const route = useRoute()
const router = useRouter()
const compteId = computed(() => route.params.id || null)
const isEdit = computed(() => Boolean(compteId.value))

function goBack() {
  router.push({ name: 'tresorerie-comptes' })
}

function onSaved() {
  goBack()
}
</script>
