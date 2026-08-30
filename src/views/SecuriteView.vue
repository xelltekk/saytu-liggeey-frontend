<template>
  <div class="space-y-4">
    <section class="theme-hero-card rounded-2xl p-5">
      <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p class="text-xs font-bold uppercase tracking-[0.18em] opacity-80">Administration</p>
          <h1 class="mt-1 text-2xl font-black">Sécurité & sauvegarde</h1>
          <p class="mt-1 max-w-2xl text-sm opacity-85">
            Contrôlez les connexions, les sessions actives et récupérez une sauvegarde complète de la base.
          </p>
        </div>

        <div class="flex flex-wrap gap-2">
          <button type="button" class="btn-secondary bg-white/90" :disabled="loading" @click="loadOverview">
            <RefreshCw class="h-4 w-4" />
            Actualiser
          </button>
          <button type="button" class="btn-primary" :disabled="backupLoading" @click="downloadBackup">
            <Download class="h-4 w-4" />
            {{ backupLoading ? 'Préparation...' : 'Sauvegarde DB' }}
          </button>
        </div>
      </div>
    </section>

    <section class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <article v-for="card in cards" :key="card.label" class="rounded-2xl border border-[color:var(--saytu-border,#e2e8f0)] bg-[color:var(--saytu-surface,#ffffff)] p-4 shadow-sm">
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--saytu-muted,#64748b)]">{{ card.label }}</p>
            <p class="mt-2 text-2xl font-black text-[color:var(--saytu-shell-text,#0f172a)]">{{ card.value }}</p>
            <p class="mt-1 text-xs text-[color:var(--saytu-muted,#64748b)]">{{ card.hint }}</p>
          </div>
          <span class="grid h-10 w-10 place-items-center rounded-2xl bg-[color:var(--saytu-primary-soft,#dbeafe)] text-[color:var(--saytu-primary,#2563eb)]">
            <component :is="card.icon" class="h-5 w-5" />
          </span>
        </div>
      </article>
    </section>

    <section class="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
      <article class="rounded-2xl border border-[color:var(--saytu-border,#e2e8f0)] bg-[color:var(--saytu-surface,#ffffff)] shadow-sm">
        <div class="flex items-center justify-between border-b border-[color:var(--saytu-border,#e2e8f0)] px-4 py-3">
          <div>
            <h2 class="font-black text-[color:var(--saytu-shell-text,#0f172a)]">Sessions actives</h2>
            <p class="text-xs text-[color:var(--saytu-muted,#64748b)]">Jetons connectés actuellement ou récemment utilisés.</p>
          </div>
          <span class="rounded-full bg-[color:var(--saytu-primary-soft,#dbeafe)] px-3 py-1 text-xs font-bold text-[color:var(--saytu-primary,#2563eb)]">
            {{ activeTokens.length }}
          </span>
        </div>

        <div v-if="loading" class="p-6 text-sm text-[color:var(--saytu-muted,#64748b)]">Chargement...</div>
        <div v-else-if="!activeTokens.length" class="p-6 text-sm text-[color:var(--saytu-muted,#64748b)]">Aucune session active détectée.</div>
        <div v-else class="divide-y divide-[color:var(--saytu-border,#e2e8f0)]">
          <div v-for="token in activeTokens" :key="token.id" class="flex flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between">
            <div class="min-w-0">
              <p class="truncate font-bold text-[color:var(--saytu-shell-text,#0f172a)]">{{ token.user_name || 'Utilisateur' }}</p>
              <p class="truncate text-xs text-[color:var(--saytu-muted,#64748b)]">{{ token.name || 'Session API' }}</p>
              <p class="mt-1 text-xs text-[color:var(--saytu-muted,#64748b)]">
                Créée {{ formatDateTime(token.created_at) }} · Dernière activité {{ formatDateTime(token.last_used_at) }}
              </p>
            </div>
            <button type="button" class="btn-secondary border-red-200 text-red-700 hover:bg-red-50" @click="revoquerSession(token)">
              <LogOut class="h-4 w-4" />
              Déconnecter
            </button>
          </div>
        </div>
      </article>

      <article class="rounded-2xl border border-[color:var(--saytu-border,#e2e8f0)] bg-[color:var(--saytu-surface,#ffffff)] shadow-sm">
        <div class="border-b border-[color:var(--saytu-border,#e2e8f0)] px-4 py-3">
          <h2 class="font-black text-[color:var(--saytu-shell-text,#0f172a)]">Journal de sécurité</h2>
          <p class="text-xs text-[color:var(--saytu-muted,#64748b)]">Dernières connexions, échecs et actions sensibles.</p>
        </div>

        <div class="space-y-3 p-4">
          <div class="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
            <div class="flex items-center gap-2 font-bold">
              <CheckCircle2 class="h-4 w-4" />
              Connexions 24h
            </div>
            <p class="mt-1 text-2xl font-black">{{ overview.stats.connexions_24h || 0 }}</p>
          </div>
          <div class="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-900">
            <div class="flex items-center gap-2 font-bold">
              <AlertTriangle class="h-4 w-4" />
              Échecs de connexion 24h
            </div>
            <p class="mt-1 text-2xl font-black">{{ overview.stats.echecs_24h || 0 }}</p>
          </div>
          <div class="rounded-2xl border border-[color:var(--saytu-border,#e2e8f0)] bg-[color:var(--saytu-shell-bg,#f8fafc)] p-3">
            <p class="text-sm font-bold text-[color:var(--saytu-shell-text,#0f172a)]">Tables sauvegardables</p>
            <p class="mt-1 text-xs text-[color:var(--saytu-muted,#64748b)]">
              {{ overview.stats.tables_sauvegardables || 0 }} tables seront exportées au format JSONL avec les colonnes sensibles masquées.
            </p>
          </div>
        </div>
      </article>
    </section>

    <section class="rounded-2xl border border-[color:var(--saytu-border,#e2e8f0)] bg-[color:var(--saytu-surface,#ffffff)] shadow-sm">
      <div class="border-b border-[color:var(--saytu-border,#e2e8f0)] px-4 py-3">
        <h2 class="font-black text-[color:var(--saytu-shell-text,#0f172a)]">Dernières traces</h2>
        <p class="text-xs text-[color:var(--saytu-muted,#64748b)]">Résumé rapide des événements de connexion disponibles.</p>
      </div>
      <div class="overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead class="bg-[color:var(--saytu-shell-bg,#f8fafc)] text-left text-xs uppercase tracking-[0.12em] text-[color:var(--saytu-muted,#64748b)]">
            <tr>
              <th class="px-4 py-3">Date</th>
              <th class="px-4 py-3">Utilisateur</th>
              <th class="px-4 py-3">Événement</th>
              <th class="px-4 py-3">IP</th>
              <th class="px-4 py-3">Statut</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[color:var(--saytu-border,#e2e8f0)]">
            <tr v-for="row in recentSessions" :key="row.id || `${row.event}-${row.created_at}`">
              <td class="px-4 py-3">{{ formatDateTime(row.created_at) }}</td>
              <td class="px-4 py-3 font-semibold">{{ row.user_name || row.email || '-' }}</td>
              <td class="px-4 py-3">{{ row.event_label || row.event || '-' }}</td>
              <td class="px-4 py-3 font-mono text-xs">{{ row.ip_address || '-' }}</td>
              <td class="px-4 py-3">
                <span class="rounded-full px-2 py-1 text-xs font-bold" :class="row.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'">
                  {{ row.status === 'failed' ? 'Échec' : 'OK' }}
                </span>
              </td>
            </tr>
            <tr v-if="!recentSessions.length">
              <td colspan="5" class="px-4 py-8 text-center text-[color:var(--saytu-muted,#64748b)]">Aucune trace récente.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  Download,
  KeyRound,
  LockKeyhole,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Users,
} from 'lucide-vue-next'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'

const toast = useToast()
const { confirm: askConfirm } = useConfirm()
const loading = ref(false)
const backupLoading = ref(false)
const overview = ref(defaultOverview())

const activeTokens = computed(() => overview.value.active_tokens || [])
const recentSessions = computed(() => overview.value.recent_sessions || [])

const cards = computed(() => [
  {
    label: 'Sessions actives',
    value: overview.value.stats.sessions_actives || 0,
    hint: 'À déconnecter si besoin',
    icon: KeyRound,
  },
  {
    label: 'Utilisateurs actifs',
    value: overview.value.stats.utilisateurs_actifs || 0,
    hint: 'Comptes autorisés',
    icon: Users,
  },
  {
    label: 'Connexions 24h',
    value: overview.value.stats.connexions_24h || 0,
    hint: 'Activité récente',
    icon: ShieldCheck,
  },
  {
    label: 'Sauvegarde',
    value: overview.value.stats.tables_sauvegardables || 0,
    hint: 'Tables exportables',
    icon: Database,
  },
])

function defaultOverview() {
  return {
    stats: {
      connexions_24h: 0,
      echecs_24h: 0,
      sessions_actives: 0,
      utilisateurs_actifs: 0,
      tables_sauvegardables: 0,
    },
    recent_sessions: [],
    active_tokens: [],
    tables: [],
  }
}

async function loadOverview() {
  loading.value = true
  try {
    const { data } = await api.get('/admin/security')
    overview.value = {
      ...defaultOverview(),
      ...(data || {}),
      stats: {
        ...defaultOverview().stats,
        ...(data?.stats || {}),
      },
    }
  } catch (e) {
    toast.error(e.response?.data?.message || 'Chargement sécurité impossible')
  } finally {
    loading.value = false
  }
}

async function downloadBackup() {
  const confirmed = await askConfirm({
    title: 'Télécharger une sauvegarde',
    message: 'La sauvegarde contient les données de la base avec les champs sensibles masqués.',
    confirmLabel: 'Télécharger',
    tone: 'primary',
  })
  if (!confirmed) return

  backupLoading.value = true
  try {
    const { data, headers } = await api.get('/admin/security/backup', { responseType: 'blob' })
    const disposition = headers?.['content-disposition'] || ''
    const filenameMatch = disposition.match(/filename="?([^"]+)"?/i)
    const filename = filenameMatch?.[1] || `sauvegarde-saytu-${new Date().toISOString().slice(0, 10)}.jsonl`
    const url = window.URL.createObjectURL(data)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
    toast.success('Sauvegarde téléchargée')
  } catch (e) {
    toast.error(e.response?.data?.message || 'Sauvegarde impossible')
  } finally {
    backupLoading.value = false
  }
}

async function revoquerSession(token) {
  const confirmed = await askConfirm({
    title: 'Déconnecter cette session ?',
    message: `La session de ${token.user_name || 'cet utilisateur'} sera immédiatement révoquée.`,
    confirmLabel: 'Déconnecter',
    tone: 'danger',
  })
  if (!confirmed) return

  try {
    await api.delete(`/admin/security/tokens/${token.id}`)
    toast.success('Session déconnectée')
    await loadOverview()
  } catch (e) {
    toast.error(e.response?.data?.message || 'Déconnexion impossible')
  }
}

function formatDateTime(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'

  return date.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

onMounted(loadOverview)
</script>
