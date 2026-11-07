<template>
  <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
    <template v-if="kind === 'revenue'">
      <path d="M12 22h34l-6-6M46 22l-6 6M52 44H18l6 6M18 44l6-6" />
      <circle cx="32" cy="33" r="15" fill="var(--metric-fill)" />
      <path d="M28 40V26h9M28 32h7" stroke-width="3.5" />
      <path d="M12 22v13M52 44V31" />
    </template>
    <template v-else-if="kind === 'receipts'">
      <rect x="17" y="9" width="36" height="24" rx="4" fill="var(--metric-fill)" />
      <path d="M23 15h6M43 27h4" />
      <circle cx="35" cy="21" r="6" />
      <path d="M8 43l10-6h13c7 0 7 8 0 8h-6m9-1 12-5c7-2 10 4 5 8L34 57H18L8 52" fill="var(--metric-fill)" />
      <path d="M8 39v17" stroke-width="5" />
    </template>
    <template v-else-if="kind === 'outstanding'">
      <path d="m22 10 5 9h12l5-9c-8 3-14 3-22 0Z" fill="var(--metric-fill)" />
      <path d="M27 20C18 28 15 34 17 41c2 8 12 10 21 7 9-3 13-10 9-17-2-4-5-8-9-11" fill="var(--metric-fill)" />
      <path d="M30 38V27h7M30 32h5M25 20h16" />
      <circle cx="46" cy="46" r="12" fill="white" />
      <path d="M46 39v8l5 3" />
    </template>
    <template v-else>
      <path d="M14 6h24l12 12v35a4 4 0 0 1-4 4H14a4 4 0 0 1-4-4V10a4 4 0 0 1 4-4Z" fill="var(--metric-fill)" />
      <path d="M38 6v12h12M19 26h19M19 34h11M19 42h10M19 49h10" />
      <circle cx="46" cy="42" r="13" fill="white" />
      <path d="M46 35v8" stroke-width="4" />
      <circle cx="46" cy="49" r="1" fill="currentColor" stroke-width="1" />
    </template>
  </svg>
</template>

<script setup>
defineProps({ kind: { type: String, required: true } })
</script>
