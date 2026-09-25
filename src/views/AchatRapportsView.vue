<template>
  <div class="app-surface space-y-4">
    <div class="rounded-2xl border border-cyan-200 bg-white p-4 shadow-sm">
      <button type="button" class="mb-3 text-sm font-bold text-cyan-700 hover:text-cyan-900" @click="goBack">
        ← Retour liste
      </button>
      <p class="text-xs font-black uppercase tracking-[0.2em] text-cyan-700">Rapports achats fournisseurs</p>
      <h1 class="mt-2 text-2xl font-black text-slate-950">États de contrôle achats</h1>
      <p class="mt-1 text-sm text-slate-600">
        Téléchargez les états de contrôle pour les achats, factures fournisseurs, retours et litiges.
      </p>
    </div>

    <section class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <button
        v-for="report in reportExports"
        :key="report.url"
        type="button"
        class="report-card"
        @click="downloadReport(report)"
      >
        <span>{{ report.label }}</span>
        <FileDown :size="22" />
      </button>
    </section>
  </div>
</template>

<script setup>
import { FileDown } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { useToast } from '@/composables/useToast'
import { ouvrirPDF } from '@/services/pdf'

const router = useRouter()
const toast = useToast()

const reportExports = [
  { label: 'Synthèse achats PDF', url: '/achats/rapport.pdf?type=synthese' },
  { label: 'Fournisseurs PDF', url: '/achats/rapport.pdf?type=fournisseurs' },
  { label: 'Factures impayées PDF', url: '/achats/rapport.pdf?type=factures' },
  { label: 'Retours & litiges PDF', url: '/achats/rapport.pdf?type=litiges' },
]

function goBack() {
  router.push({ name: 'achats' })
}

async function downloadReport(report) {
  try {
    await ouvrirPDF(report.url, `${report.label}.pdf`)
  } catch (error) {
    toast.error('Impossible de générer le rapport achats.')
  }
}
</script>

<style scoped>
.report-card {
  align-items: center;
  background: rgb(255 255 255 / 78%);
  border: 1px solid color-mix(in srgb, var(--saytu-primary, #0ea5e9) 16%, var(--saytu-border, #bae6fd));
  border-radius: 1rem;
  color: var(--saytu-shell-text, #0f172a);
  display: flex;
  gap: 1rem;
  justify-content: space-between;
  min-height: 7rem;
  padding: 1rem;
  text-align: left;
  transition: 0.18s ease;
}

.report-card:hover {
  border-color: var(--saytu-primary, #0ea5e9);
  box-shadow: 0 14px 30px rgb(14 165 233 / 0.12);
  transform: translateY(-1px);
}

.report-card span {
  font-size: 1rem;
  font-weight: 950;
}

.report-card svg {
  color: var(--saytu-primary, #0ea5e9);
  flex: 0 0 auto;
}
</style>
