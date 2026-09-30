<template>
  <div class="space-y-4">
    <section class="theme-hero-card rounded-2xl p-5">
      <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p class="text-xs font-bold uppercase tracking-[0.18em] opacity-80">Administration</p>
          <h1 class="mt-1 text-2xl font-black">Sécurité & sauvegarde</h1>
          <p class="mt-1 max-w-2xl text-sm opacity-85">
            Contrôlez les connexions, les sessions actives, la santé système et récupérez une sauvegarde complète de la base.
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

    <section class="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
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

    <section class="rounded-2xl border border-[color:var(--saytu-border,#e2e8f0)] bg-[color:var(--saytu-surface,#ffffff)] shadow-sm">
      <div class="border-b border-[color:var(--saytu-border,#e2e8f0)] px-4 py-3">
        <h2 class="font-black text-[color:var(--saytu-shell-text,#0f172a)]">Santé système</h2>
        <p class="text-xs text-[color:var(--saytu-muted,#64748b)]">Contrôle rapide de la base, du journal d’audit, du stockage et de la sauvegarde.</p>
      </div>
      <div class="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-4">
        <article v-for="item in healthChecks" :key="item.key" class="rounded-2xl border p-4" :class="healthClass(item.state)">
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="text-xs font-black uppercase tracking-[0.14em] opacity-75">{{ item.label }}</p>
              <p class="mt-2 text-lg font-black">{{ item.value || '-' }}</p>
              <p class="mt-1 text-xs opacity-80">{{ item.detail || 'Aucun détail.' }}</p>
            </div>
            <span class="rounded-full px-2 py-1 text-[11px] font-black uppercase">
              {{ healthText(item.state) }}
            </span>
          </div>
        </article>
      </div>
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
              <div class="flex flex-wrap items-center gap-2">
                <p class="truncate font-bold text-[color:var(--saytu-shell-text,#0f172a)]">{{ token.user_name || 'Utilisateur' }}</p>
                <span v-if="token.is_current" class="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-black text-emerald-700">
                  Session actuelle
                </span>
              </div>
              <p class="truncate text-xs text-[color:var(--saytu-muted,#64748b)]">
                {{ token.user_email || 'Email non renseigné' }} · {{ token.name || 'Session API' }}
              </p>
              <p class="mt-1 text-xs text-[color:var(--saytu-muted,#64748b)]">
                Créée {{ formatDateTime(token.created_at) }} · Dernière activité {{ formatDateTime(token.last_used_at) }}
              </p>
            </div>
            <button
              type="button"
              class="btn-secondary"
              :class="token.is_current ? 'cursor-not-allowed border-slate-200 text-slate-400' : 'border-red-200 text-red-700 hover:bg-red-50'"
              :disabled="token.is_current"
              :title="token.is_current ? 'Impossible de déconnecter la session que vous utilisez actuellement.' : 'Déconnecter cette session'"
              @click="revoquerSession(token)"
            >
              <LogOut class="h-4 w-4" />
              {{ token.is_current ? 'Session actuelle' : 'Déconnecter' }}
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
              {{ overview.stats.tables_sauvegardables || 0 }} tables et {{ formatNumber(overview.stats.lignes_sauvegardables || 0) }} ligne(s) seront exportées au format JSONL avec les colonnes sensibles masquées.
            </p>
          </div>
        </div>
      </article>
    </section>

    <section class="grid gap-4 xl:grid-cols-2">
      <article class="rounded-2xl border border-[color:var(--saytu-border,#e2e8f0)] bg-[color:var(--saytu-surface,#ffffff)] shadow-sm">
        <div class="flex items-center justify-between border-b border-[color:var(--saytu-border,#e2e8f0)] px-4 py-3">
          <div>
            <h2 class="font-black text-[color:var(--saytu-shell-text,#0f172a)]">Actions sensibles récentes</h2>
            <p class="text-xs text-[color:var(--saytu-muted,#64748b)]">Validations, suppressions, paiements, droits, stock et sécurité.</p>
          </div>
          <RouterLink to="/activites?tab=activites" class="rounded-full bg-orange-50 px-3 py-1 text-xs font-black text-orange-700 hover:bg-orange-100">
            Voir audit
          </RouterLink>
        </div>
        <div class="divide-y divide-[color:var(--saytu-border,#e2e8f0)]">
          <div v-for="item in sensitiveActions" :key="`${item.date}-${item.event}-${item.reference}`" class="px-4 py-3">
            <div class="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <div class="min-w-0">
                <p class="truncate font-bold text-[color:var(--saytu-shell-text,#0f172a)]">{{ item.title || item.action || item.event || 'Action sensible' }}</p>
                <p class="mt-1 text-xs text-[color:var(--saytu-muted,#64748b)]">
                  {{ item.user_name || 'Système' }} · {{ item.audit_module || item.subject_module || item.category || '-' }} · {{ formatDateTime(item.date) }}
                </p>
              </div>
              <span class="rounded-full bg-orange-100 px-2 py-1 text-[11px] font-black text-orange-700">
                {{ item.sensitive_reason || 'Sensible' }}
              </span>
            </div>
          </div>
          <div v-if="!sensitiveActions.length" class="px-4 py-8 text-center text-sm text-[color:var(--saytu-muted,#64748b)]">
            Aucune action sensible récente.
          </div>
        </div>
      </article>

      <article class="rounded-2xl border border-[color:var(--saytu-border,#e2e8f0)] bg-[color:var(--saytu-surface,#ffffff)] shadow-sm">
        <div class="border-b border-[color:var(--saytu-border,#e2e8f0)] px-4 py-3">
          <h2 class="font-black text-[color:var(--saytu-shell-text,#0f172a)]">Sauvegardes & tables lourdes</h2>
          <p class="text-xs text-[color:var(--saytu-muted,#64748b)]">Historique des exports et tables qui pèsent le plus en lignes.</p>
        </div>
        <div class="grid gap-4 p-4 lg:grid-cols-2">
          <div>
            <p class="text-xs font-black uppercase tracking-[0.14em] text-[color:var(--saytu-muted,#64748b)]">Derniers exports</p>
            <div class="mt-2 space-y-2">
              <div v-for="item in backupHistory" :key="`${item.date}-${item.reference}`" class="rounded-2xl bg-[color:var(--saytu-shell-bg,#f8fafc)] p-3">
                <p class="truncate text-sm font-bold text-[color:var(--saytu-shell-text,#0f172a)]">{{ item.reference || 'Sauvegarde DB' }}</p>
                <p class="mt-1 text-xs text-[color:var(--saytu-muted,#64748b)]">{{ item.user_name || 'Système' }} · {{ formatDateTime(item.date) }}</p>
              </div>
              <p v-if="!backupHistory.length" class="rounded-2xl bg-[color:var(--saytu-shell-bg,#f8fafc)] p-3 text-sm text-[color:var(--saytu-muted,#64748b)]">
                Aucun export sauvegarde enregistré.
              </p>
            </div>
          </div>
          <div>
            <p class="text-xs font-black uppercase tracking-[0.14em] text-[color:var(--saytu-muted,#64748b)]">Tables principales</p>
            <div class="mt-2 space-y-2">
              <div v-for="table in largestTables.slice(0, 6)" :key="table.name" class="flex items-center justify-between gap-3 rounded-2xl bg-[color:var(--saytu-shell-bg,#f8fafc)] p-3">
                <span class="truncate font-mono text-xs font-bold text-[color:var(--saytu-shell-text,#0f172a)]">{{ table.name }}</span>
                <span class="shrink-0 rounded-full bg-white px-2 py-1 text-xs font-black text-[color:var(--saytu-primary,#2563eb)]">{{ formatNumber(table.rows) }}</span>
              </div>
              <p v-if="!largestTables.length" class="rounded-2xl bg-[color:var(--saytu-shell-bg,#f8fafc)] p-3 text-sm text-[color:var(--saytu-muted,#64748b)]">
                Aucune table à afficher.
              </p>
            </div>
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
            <tr v-for="row in recentSessions" :key="row.id || `${row.event}-${row.date || row.created_at}-${row.ip || row.ip_address}`">
              <td class="px-4 py-3">{{ formatDateTime(row.date || row.created_at) }}</td>
              <td class="px-4 py-3 font-semibold">{{ row.user_name || row.email || '-' }}</td>
              <td class="px-4 py-3">{{ row.event_label || row.event || '-' }}</td>
              <td class="px-4 py-3 font-mono text-xs">{{ row.ip_address || row.ip || '-' }}</td>
              <td class="px-4 py-3">
                <span class="rounded-full px-2 py-1 text-xs font-bold" :class="sessionStatusClass(row)">
                  {{ sessionStatusText(row) }}
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
const healthChecks = computed(() => overview.value.health || [])
const sensitiveActions = computed(() => overview.value.recent_sensitive_actions || [])
const backupHistory = computed(() => overview.value.backup_history || [])
const largestTables = computed(() => overview.value.largest_tables || [])

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
    label: 'Actions sensibles',
    value: overview.value.stats.actions_sensibles_24h || 0,
    hint: 'Sur les dernières 24h',
    icon: AlertTriangle,
  },
  {
    label: 'Sauvegarde',
    value: overview.value.stats.tables_sauvegardables || 0,
    hint: `${formatNumber(overview.value.stats.lignes_sauvegardables || 0)} ligne(s)`,
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
      lignes_sauvegardables: 0,
      actions_sensibles_24h: 0,
    },
    health: [],
    recent_sessions: [],
    recent_sensitive_actions: [],
    backup_history: [],
    active_tokens: [],
    tables: [],
    largest_tables: [],
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
  if (token.is_current) {
    toast.error('Impossible de déconnecter la session que vous utilisez actuellement.')
    return
  }

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

function formatNumber(value) {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Number(value || 0))
}

function healthText(state) {
  return {
    ok: 'OK',
    warning: 'À vérifier',
    danger: 'Erreur',
  }[state] || 'Info'
}

function healthClass(state) {
  return {
    ok: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    warning: 'border-orange-200 bg-orange-50 text-orange-900',
    danger: 'border-red-200 bg-red-50 text-red-900',
  }[state] || 'border-slate-200 bg-slate-50 text-slate-800'
}

function sessionStatusClass(row) {
  const failed = row.status === 'failed' || Number(row.status || 0) >= 400 || row.event === 'login_failed'
  return failed ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
}

function sessionStatusText(row) {
  const failed = row.status === 'failed' || Number(row.status || 0) >= 400 || row.event === 'login_failed'
  return failed ? 'Échec' : 'OK'
}

onMounted(loadOverview)
</script>
