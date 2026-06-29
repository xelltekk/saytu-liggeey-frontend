<template>
  <div class="border-t border-slate-200 bg-white/80 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/90">
    <div class="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
      <div class="text-slate-600 dark:text-slate-300">
        <strong>{{ meta.from || 0 }}</strong>-<strong>{{ meta.to || 0 }}</strong>
        sur <strong>{{ meta.total || 0 }}</strong>{{ label ? ` ${label}` : '' }}
      </div>
      <div class="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:flex">
        <button
          type="button"
          class="btn-secondary px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-40"
          :disabled="currentPage <= 1"
          @click="$emit('page', currentPage - 1)"
          aria-label="Afficher la page précédente"
        >
          <span class="sm:hidden">Prec.</span>
          <span class="hidden sm:inline">Précédent</span>
        </button>
        <span class="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-center text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
          Page {{ currentPage }} / {{ lastPage }}
        </span>
        <button
          type="button"
          class="btn-secondary px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-40"
          :disabled="currentPage >= lastPage"
          @click="$emit('page', currentPage + 1)"
          aria-label="Afficher la page suivante"
        >
          Suivant
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  meta: { type: Object, required: true },
  label: { type: String, default: '' },
})

defineEmits(['page'])

const currentPage = computed(() => Number(props.meta.current_page || 1))
const lastPage = computed(() => Math.max(Number(props.meta.last_page || 1), 1))
</script>
