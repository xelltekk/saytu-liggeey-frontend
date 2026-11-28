<template>
  <section class="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-6 text-center sm:p-10">
    <LockKeyhole class="mx-auto mb-4 h-10 w-10 text-slate-400" aria-hidden="true" />
    <h1 class="text-xl font-semibold text-slate-900">Rubrique indisponible</h1>
    <p class="mt-3 text-sm leading-6 text-slate-600">Cette rubrique n’est pas activée ou n’est pas incluse dans l’abonnement de votre société. Vos données sont conservées.</p>
    <RouterLink v-if="canManage" to="/configuration/modules" class="mt-6 inline-flex rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white">Gérer les modules</RouterLink>
    <p v-else class="mt-5 text-sm text-slate-500">Contactez l’administrateur de votre société.</p>
  </section>
</template>
<script setup>
import { computed } from 'vue'
import { LockKeyhole } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { mayManageModules } from './modulePolicy.mjs'
const auth = useAuthStore()
const canManage = computed(() => mayManageModules(auth.user))
</script>
