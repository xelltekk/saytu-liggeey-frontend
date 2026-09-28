<template>
  <div class="space-y-5">
    <section class="rounded-[2rem] border border-cyan-200 bg-cyan-50/80 p-5 shadow-sm">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p class="text-xs font-black uppercase tracking-[0.22em] text-cyan-700">Pilotage</p>
          <h1 class="mt-2 text-2xl font-black text-slate-950">Centre de pilotage</h1>
          <p class="mt-1 max-w-3xl text-sm font-semibold text-slate-600">
            {{ activeDescription }}
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
          <span>{{ tab.label }}</span>
          <span
            v-if="tabBadge(tab.key) > 0"
            class="ml-2 inline-flex min-w-6 items-center justify-center rounded-full bg-cyan-600 px-2 py-0.5 text-[11px] font-black text-white"
          >
            {{ tabBadge(tab.key) > 99 ? '99+' : tabBadge(tab.key) }}
          </span>
        </button>
      </div>
    </section>

    <component :is="currentComponent" />
  </div>
</template>

<script setup>
import { computed, defineAsyncComponent, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useNotificationsStore } from '@/stores/notifications'
import { hasAnyRole } from '@/utils/access'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const notif = useNotificationsStore()

const AujourdhuiView = defineAsyncComponent(() => import('@/views/AujourdhuiView.vue'))
const GerantPilotageView = defineAsyncComponent(() => import('@/views/GerantPilotageView.vue'))
const ActivitesView = defineAsyncComponent(() => import('@/views/ActivitesView.vue'))

const tabs = [
  {
    key: 'aujourdhui',
    label: "Aujourd'hui",
    description: 'Synthèse des priorités du jour : encaissements, alertes, tâches et échéances.',
    component: AujourdhuiView,
    roles: ['admin', 'gerant', 'commercial', 'magasinier', 'comptable', 'caissier'],
  },
  {
    key: 'gerant',
    label: 'Gérant',
    description: 'Vue décisionnelle : validations, équipe, trésorerie, marges, objectifs et contrôle.',
    component: GerantPilotageView,
    roles: ['admin', 'gerant'],
  },
  {
    key: 'activites',
    label: 'Activités',
    description: 'Journal complet des actions importantes réalisées dans l’application.',
    component: ActivitesView,
    roles: ['admin', 'gerant'],
  },
]

const availableTabs = computed(() => tabs.filter((tab) => hasAnyRole(auth.user, tab.roles)))
const activeTab = computed(() => {
  const requested = String(route.query.tab || 'aujourdhui')
  return availableTabs.value.some((tab) => tab.key === requested) ? requested : (availableTabs.value[0]?.key || 'aujourdhui')
})
const currentComponent = computed(() => tabs.find((tab) => tab.key === activeTab.value)?.component || AujourdhuiView)
const activeDescription = computed(() => tabs.find((tab) => tab.key === activeTab.value)?.description || 'Un seul espace pour suivre et contrôler l’activité.')

function selectTab(tab) {
  router.replace({ name: 'pilotage', query: tab === 'aujourdhui' ? {} : { tab } })
}

function tabBadge(tab) {
  const badges = notif.badges || {}

  if (tab === 'aujourdhui') {
    return Number(notif.total || 0)
  }

  if (tab === 'gerant') {
    return Number(badges.demandes_validation || 0)
      + Number(badges.achats || 0)
      + Number(badges.stock_alerte || 0)
      + Number(badges.factures_retard || 0)
  }

  return 0
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

onMounted(() => {
  notif.fetchBadges()
})
</script>
