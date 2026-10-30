<template>
  <div v-if="payload?.reports?.length === 2" class="space-y-3">
    <div class="min-w-0">
      <table class="w-full table-fixed text-xs sm:text-sm">
        <thead class="bg-slate-50 text-left text-slate-600"><tr><th class="w-1/3 p-2 sm:p-3">Compteurs validés</th><th class="w-1/3 p-2 sm:p-3">Précédent</th><th class="w-1/3 p-2 sm:p-3">Récent</th></tr></thead>
        <tbody class="divide-y divide-slate-100">
          <tr><th class="p-2 text-left font-medium sm:p-3">Date</th><td v-for="(report, i) in payload.reports" :key="i" class="break-words p-2 sm:p-3">{{ report.date || '-' }}</td></tr>
          <tr><th class="p-2 text-left font-medium sm:p-3">Série</th><td v-for="(report, i) in payload.reports" :key="i" class="break-all p-2 sm:p-3">{{ report.serial || '-' }}</td></tr>
          <tr v-for="code in ['102', '409', '112']" :key="code"><th class="p-2 text-left font-medium sm:p-3">{{ code }}</th><td v-for="(report, i) in payload.reports" :key="i" class="break-words p-2 tabular-nums sm:p-3">{{ number(report.counters?.[code]) }}</td></tr>
        </tbody>
      </table>
    </div>
    <dl class="grid gap-3 border-y border-slate-200 py-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
      <div><dt class="text-slate-500">Noir HT / face</dt><dd class="font-semibold">{{ number(payload.blackPrice) }} FCFA</dd></div>
      <div><dt class="text-slate-500">Couleur HT / face</dt><dd class="font-semibold">{{ number(payload.colorPrice) }} FCFA</dd></div>
      <div><dt class="text-slate-500">Grand format couleur</dt><dd class="font-semibold">{{ number(payload.largeColor) }} face(s)</dd></div>
      <div><dt class="text-slate-500">Forfait HT / TVA</dt><dd class="font-semibold">{{ number(payload.rentalFee ?? 0) }} FCFA / {{ number(payload.tva) }} %</dd></div>
    </dl>
  </div>
  <p v-else class="py-3 text-sm text-amber-800">Source ancienne incomplète.</p>
</template>

<script setup>
defineProps({ payload: { type: Object, default: null } })
const number = value => value === null || value === undefined || value === '' ? '-' : Number(value).toLocaleString('fr-FR', { maximumFractionDigits: 2 })
</script>
