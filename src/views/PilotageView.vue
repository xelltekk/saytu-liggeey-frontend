<template>
  <div class="space-y-5">
    <section class="rounded-[2rem] border border-cyan-200 bg-cyan-50/80 p-5 shadow-sm">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p class="text-xs font-black uppercase tracking-[0.22em] text-cyan-700">Pilotage</p>
          <h1 class="mt-2 text-2xl font-black text-slate-950">Centre de pilotage</h1>
          <p class="mt-1 max-w-3xl text-sm font-semibold text-slate-600">
            Un seul espace pour la synthèse du jour, le pilotage gérant et le journal des activités.
          </p>
        </div>
      </div>

      <div class="mt-5 flex flex-wrap gap-2">
        <button
          v-for="tab in availableTabs"
          :key="tab.key"
          type="button"
          class="rounded-2xl border px-4 py-2 text-sm font-black transition"
          :class="activeTab === tab.key
            ? 'border-cyan-400 bg-white text-cyan-700 shadow-sm'
            : 'border-cyan-100 bg-cyan-100/60 text-slate-600 hover:border-cyan-300 hover:bg-white'"
          @click="selectTab(tab.key)"
        >
          {{ tab.label }}
        </button>
      </div>
    </section>

    <component :is="currentComponent" />
  </div>
</template>

<script setup>
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AujourdhuiView from '@/views/AujourdhuiView.vue'
import GerantPilotageView from '@/views/GerantPilotageView.vue'
import ActivitesView from '@/views/ActivitesView.vue'
import { useAuthStore } from '@/stores/auth'
import { hasAnyRole } from '@/utils/access'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const tabs = [
  { key: 'aujourdhui', label: "Aujourd'hui", component: AujourdhuiView, roles: ['admin', 'gerant', 'commercial', 'magasinier', 'comptable', 'caissier'] },
  { key: 'gerant', label: 'Gérant', component: GerantPilotageView, roles: ['admin', 'gerant'] },
  { key: 'activites', label: 'Activités', component: ActivitesView, roles: ['admin', 'gerant'] },
]

const availableTabs = computed(() => tabs.filter((tab) => hasAnyRole(auth.user, tab.roles)))
const activeTab = computed(() => {
  const requested = String(route.query.tab || 'aujourdhui')
  return availableTabs.value.some((tab) => tab.key === requested) ? requested : (availableTabs.value[0]?.key || 'aujourdhui')
})
const currentComponent = computed(() => tabs.find((tab) => tab.key === activeTab.value)?.component || AujourdhuiView)

function selectTab(tab) {
  router.replace({ name: 'pilotage', query: tab === 'aujourdhui' ? {} : { tab } })
}

watch(
  () => route.query.tab,
  () => {
    const requested = String(route.query.tab || 'aujourdhui')
    if (!availableTabs.value.some((tab) => tab.key === requested)) {
      selectTab(activeTab.value)
    }
  },
  { immediate: true }
)
</script>
