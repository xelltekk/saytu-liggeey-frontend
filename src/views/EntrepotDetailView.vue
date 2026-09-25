<template>
  <div class="app-surface space-y-4">
    <section class="rounded-3xl border border-cyan-200 bg-cyan-50/80 p-5 shadow-sm">
      <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <button
            type="button"
            class="mb-4 text-sm font-black text-cyan-700 hover:text-cyan-900"
            @click="goBack"
          >
            ← Retour liste
          </button>

          <p class="text-xs font-black uppercase tracking-[0.22em] text-cyan-700">Entrepôt</p>
          <div class="mt-2 flex flex-wrap items-center gap-2">
            <h1 class="text-2xl font-black text-slate-950">
              {{ isCreate ? 'Nouvel entrepôt' : entrepot?.libelle || 'Entrepôt' }}
            </h1>
            <span
              v-if="entrepot"
              class="rounded-full px-3 py-1 text-xs font-black"
              :class="entrepot.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'"
            >
              {{ entrepot.is_active ? 'Actif' : 'Inactif' }}
            </span>
          </div>
          <p class="mt-1 text-sm text-cyan-800">
            <template v-if="isCreate">Saisie en page complète, sans fenêtre flottante.</template>
            <template v-else>
              {{ entrepot?.code || 'Code non renseigné' }} · {{ locationLabel(entrepot) }}
            </template>
          </p>
        </div>

        <button v-if="entrepot && canManage" type="button" class="btn-secondary" @click="setTab('saisie')">
          Modifier
        </button>
      </div>
    </section>

    <section class="rounded-3xl border border-cyan-200 bg-white shadow-sm">
      <div class="flex flex-wrap gap-1 border-b border-cyan-100 px-4 pt-3">
        <button
          v-for="tab in visibleTabs"
          :key="tab.key"
          type="button"
          class="rounded-t-2xl px-5 py-3 text-sm font-black transition"
          :class="activeTab === tab.key ? 'border border-cyan-200 border-b-white bg-white text-cyan-700' : 'text-slate-600 hover:bg-cyan-50 hover:text-cyan-800'"
          @click="setTab(tab.key)"
        >
          {{ tab.label }}
        </button>
      </div>

      <div v-if="loading" class="p-10 text-center text-slate-500">Chargement...</div>

      <div v-else-if="activeTab === 'fiche' && entrepot" class="p-5">
        <EntrepotDetails
          :entrepot="entrepot"
          :can-manage="canManage"
          @refresh="loadEntrepot"
        />
      </div>

      <div v-else class="p-5">
        <EntrepotForm
          :entrepot="isCreate ? null : entrepot"
          @saved="onSaved"
          @cancel="goBack"
        />
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'
import EntrepotDetails from '@/components/EntrepotDetails.vue'
import EntrepotForm from '@/components/EntrepotForm.vue'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { hasAnyRole } from '@/utils/access'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const toast = useToast()

const entrepot = ref(null)
const loading = ref(true)
const activeTab = ref(String(route.query.tab || 'fiche'))

const canManage = computed(() => hasAnyRole(auth.user, ['admin', 'magasinier']))
const isCreate = computed(() => route.name === 'entrepot-create')
const visibleTabs = computed(() => isCreate.value
  ? [{ key: 'saisie', label: 'Saisie entrepôt' }]
  : [
      { key: 'fiche', label: 'Fiche' },
      { key: 'saisie', label: 'Saisie entrepôt' },
    ])

onMounted(loadEntrepot)
watch(() => route.params.id, loadEntrepot)
watch(() => route.query.tab, (tab) => {
  const next = typeof tab === 'string' ? tab : (isCreate.value ? 'saisie' : 'fiche')
  if (visibleTabs.value.some((item) => item.key === next)) activeTab.value = next
}, { immediate: true })

async function loadEntrepot() {
  if (isCreate.value) {
    entrepot.value = null
    activeTab.value = 'saisie'
    loading.value = false
    return
  }

  if (!route.params.id) return

  loading.value = true
  try {
    const { data } = await api.get(`/entrepots/${route.params.id}`)
    entrepot.value = { ...data.entrepot, stats: data.stats || {} }
  } catch (error) {
    toast.error('Entrepôt introuvable.')
    router.replace({ name: 'entrepots' })
  } finally {
    loading.value = false
  }
}

function setTab(tab) {
  activeTab.value = tab
  router.replace({ query: { ...route.query, tab } })
}

function goBack() {
  router.push({ name: 'entrepots' })
}

async function onSaved(saved) {
  if (isCreate.value && saved?.id) {
    await router.replace({ name: 'entrepot-detail', params: { id: saved.id }, query: { tab: 'fiche' } })
  } else {
    activeTab.value = 'fiche'
    await router.replace({ query: { ...route.query, tab: 'fiche' } })
    await loadEntrepot()
  }
}

function locationLabel(row) {
  const location = [row?.ville, row?.pays].filter(Boolean).join(', ')
  return location || 'Localisation non renseignée'
}
</script>
