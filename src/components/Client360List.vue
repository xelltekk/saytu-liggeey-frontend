<template>
  <section class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <div class="mb-3 flex items-center justify-between gap-3">
      <h3 class="font-bold text-slate-900">{{ title }}</h3>
      <span class="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">
        {{ items.length }}
      </span>
    </div>

    <div v-if="items.length" class="space-y-2">
      <article
        v-for="item in items"
        :key="item.id || item.reference || item.numero"
        class="rounded-2xl border border-slate-100 bg-slate-50/80 p-3 transition hover:border-xelltekk-200 hover:bg-white"
      >
        <slot :item="item" />
      </article>
    </div>

    <div v-else class="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-400">
      {{ empty }}
    </div>
  </section>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  empty: { type: String, default: 'Aucun élément' },
  items: { type: Array, default: () => [] },
})
</script>
