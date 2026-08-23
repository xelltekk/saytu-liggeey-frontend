<template>
  <div class="space-y-5">
    <section class="treasury-hero overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div class="min-w-0">
          <span class="inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.2em]">
            Trésorerie
          </span>
          <h1 class="mt-3 text-2xl font-black text-slate-950 dark:text-white">
            Vue d’ensemble financière
          </h1>
          <p class="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
            Suivez les soldes disponibles, les comptes actifs, les entrées, les sorties et les points de contrôle de la trésorerie.
          </p>
        </div>

        <button @click="openCreate" class="btn-primary whitespace-nowrap">
          + Nouveau compte
        </button>
      </div>
    </section>

    <section class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <article
        v-for="card in overviewCards"
        :key="card.key"
        class="treasury-kpi rounded-3xl border bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:bg-slate-900"
        :style="{ '--kpi-accent': card.color }"
      >
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-xs font-bold uppercase tracking-wide">{{ card.label }}</p>
            <p class="mt-3 text-2xl font-black">{{ card.value }}</p>
            <p class="mt-1 text-xs">{{ card.sub }}</p>
          </div>
          <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-black">
            {{ card.short }}
          </span>
        </div>
      </article>
    </section>

    <section class="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div class="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 class="text-lg font-black text-slate-950 dark:text-white">Centre de contrôle</h2>
          <p class="text-sm text-slate-500 dark:text-slate-400">Les actions clés pour piloter la trésorerie au quotidien.</p>
        </div>
        <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          Temps réel
        </span>
      </div>

      <div class="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        <article
          v-for="module in treasuryModules"
          :key="module.key"
          class="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-[var(--saytu-primary)] hover:bg-white dark:border-slate-800 dark:bg-slate-950/40 dark:hover:bg-slate-900"
        >
          <div class="flex items-start justify-between gap-3">
            <div>
              <h3 class="font-bold text-slate-900 dark:text-white">{{ module.title }}</h3>
              <p class="mt-1 text-sm leading-5 text-slate-500 dark:text-slate-400">{{ module.description }}</p>
            </div>
            <span class="rounded-full px-2.5 py-1 text-xs font-bold" :class="module.badgeClass">
              {{ module.status }}
            </span>
          </div>
        </article>
      </div>
    </section>

    <div class="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div class="flex flex-col gap-3 lg:flex-row">
        <input v-model="filters.search" @input="onSearchInput" type="search" placeholder="Code, libellé, banque, numéro..." class="input flex-1" />
        <select v-model="filters.type" @change="loadComptes(1)" class="input lg:w-52">
          <option value="">Tous types</option>
          <option v-for="(label, key) in types" :key="key" :value="key">{{ label }}</option>
        </select>
        <select v-model="filters.is_active" @change="loadComptes(1)" class="input lg:w-40">
          <option value="">Tous</option>
          <option value="1">Actifs</option>
          <option value="0">Inactifs</option>
        </select>
        <button @click="openCreate" class="btn-primary whitespace-nowrap">+ Nouveau compte</button>
      </div>
    </div>

    <div v-if="loading" class="rounded-3xl bg-white p-12 text-center text-gray-500 shadow-sm dark:bg-slate-900">Chargement...</div>

    <div v-else class="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <SortableTh column="code" :active="sort.key === 'code'" :icon="sortIcon('code')" @sort="toggleSort">Code</SortableTh>
              <SortableTh column="libelle" :active="sort.key === 'libelle'" :icon="sortIcon('libelle')" @sort="toggleSort">Libellé</SortableTh>
              <SortableTh column="type" :active="sort.key === 'type'" :icon="sortIcon('type')" align="center" @sort="toggleSort">Type</SortableTh>
              <SortableTh column="compte" :active="sort.key === 'compte'" :icon="sortIcon('compte')" align="center" @sort="toggleSort">Compte</SortableTh>
              <SortableTh column="journal" :active="sort.key === 'journal'" :icon="sortIcon('journal')" align="center" @sort="toggleSort">Journal</SortableTh>
              <SortableTh column="entrees" :active="sort.key === 'entrees'" :icon="sortIcon('entrees')" align="right" @sort="toggleSort">Entrées</SortableTh>
              <SortableTh column="sorties" :active="sort.key === 'sorties'" :icon="sortIcon('sorties')" align="right" @sort="toggleSort">Sorties</SortableTh>
              <SortableTh column="solde" :active="sort.key === 'solde'" :icon="sortIcon('solde')" align="right" @sort="toggleSort">Solde actuel</SortableTh>
              <SortableTh column="statut" :active="sort.key === 'statut'" :icon="sortIcon('statut')" align="center" @sort="toggleSort">Statut</SortableTh>
              <th class="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="compte in sortedComptes" :key="compte.id" class="hover:bg-gray-50">
              <td class="px-4 py-3 text-sm font-mono font-semibold text-gray-700">{{ compte.code }}</td>
              <td class="px-4 py-3">
                <div class="text-sm font-medium text-gray-900">{{ compte.libelle }}</div>
                <div class="text-xs text-gray-500">{{ compte.banque_nom || compte.numero_compte || compte.telephone || '-' }}</div>
              </td>
              <td class="px-4 py-3 text-center">
                <span class="badge text-xs" :class="typeBadge(compte.type)">{{ typeLabel(compte.type) }}</span>
              </td>
              <td class="px-4 py-3 text-center text-xs text-gray-600">
                <div class="font-mono">{{ compte.compte?.numero || '-' }}</div>
                <div>{{ compte.compte?.libelle || '-' }}</div>
              </td>
              <td class="px-4 py-3 text-center text-xs text-gray-600">
                <span class="font-mono">{{ compte.journal?.code || '-' }}</span>
              </td>
              <td class="px-4 py-3 text-right font-mono text-sm text-green-700">{{ formatPrice(compte.total_debit) }}</td>
              <td class="px-4 py-3 text-right font-mono text-sm text-red-700">{{ formatPrice(compte.total_credit) }}</td>
              <td class="px-4 py-3 text-right">
                <div class="font-mono font-semibold text-slate-900">{{ formatPrice(compte.solde_actuel) }}</div>
                <div class="text-[11px] text-gray-400">Initial {{ formatPrice(compte.solde_initial) }}</div>
              </td>
              <td class="px-4 py-3 text-center">
                <div class="flex flex-col items-center gap-1">
                  <span class="badge text-xs" :class="compte.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'">
                    {{ compte.is_active ? 'Actif' : 'Inactif' }}
                  </span>
                  <span v-if="compte.is_default" class="text-[11px] font-semibold text-blue-700">Par défaut</span>
                </div>
              </td>
              <td class="px-4 py-3 text-right">
                <div class="flex justify-end gap-2">
                  <button @click="openEdit(compte)" class="text-sm text-blue-700 hover:text-blue-900">Modifier</button>
                  <button v-if="!compte.is_default && compte.is_active" @click="setDefault(compte)" class="text-sm text-green-700 hover:text-green-900">Défaut</button>
                  <button v-if="compte.is_active" @click="desactiver(compte)" class="text-sm text-red-600 hover:text-red-800">Désactiver</button>
                </div>
              </td>
            </tr>
            <tr v-if="comptes.length === 0">
              <td colspan="10" class="px-4 py-12 text-center text-gray-400 text-sm">Aucun compte de trésorerie</td>
            </tr>
          </tbody>
        </table>
      </div>
      <AppPagination v-if="meta.total > 0" :meta="meta" label="comptes" @page="loadComptes" />
    </div>

    <AppModal v-model="showModal" :title="editing ? 'Modifier compte de trésorerie' : 'Nouveau compte de trésorerie'" size="lg">
      <form class="space-y-4" @submit.prevent="saveCompte">
        <div class="grid gap-4 md:grid-cols-2">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Code</label>
            <input v-model="form.code" class="input" required placeholder="Ex: ORABANK, CAISSE01, WAVE01" />
            <p v-if="errors.code" class="mt-1 text-xs text-red-600">{{ errors.code }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select v-model="form.type" class="input" required @change="syncModeFromType">
              <option v-for="(label, key) in types" :key="key" :value="key">{{ label }}</option>
            </select>
          </div>
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-1">Libellé</label>
            <input v-model="form.libelle" class="input" required placeholder="Ex: Compte Orabank principal" />
            <p v-if="errors.libelle" class="mt-1 text-xs text-red-600">{{ errors.libelle }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Mode de paiement lié</label>
            <select v-model="form.mode_paiement" class="input" required>
              <option value="virement">Virement</option>
              <option value="cheque">Chèque</option>
              <option value="especes">Espèces</option>
              <option value="carte_bancaire">Carte bancaire</option>
              <option value="wave">Wave</option>
              <option value="orange_money">Orange Money</option>
              <option value="free_money">Free Money</option>
              <option value="mobile_money">Mobile money</option>
              <option value="autre">Autre</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Solde initial</label>
            <input v-model.number="form.solde_initial" type="number" step="1" class="input" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Banque / Opérateur</label>
            <input v-model="form.banque_nom" class="input" placeholder="Ex: Orabank, Wave" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Numéro compte / wallet</label>
            <input v-model="form.numero_compte" class="input" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Titulaire</label>
            <input v-model="form.titulaire" class="input" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Telephone</label>
            <input v-model="form.telephone" type="tel" data-phone-input class="input" placeholder="77 123 45 67" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">IBAN</label>
            <input v-model="form.iban" class="input" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">BIC / SWIFT</label>
            <input v-model="form.bic_swift" class="input" />
          </div>
          <div class="md:col-span-2 flex flex-wrap gap-4">
            <label class="inline-flex items-center gap-2 text-sm text-gray-700">
              <input v-model="form.is_default" type="checkbox" class="rounded border-gray-300" />
              Compte par défaut pour ce mode de paiement
            </label>
            <label class="inline-flex items-center gap-2 text-sm text-gray-700">
              <input v-model="form.is_active" type="checkbox" class="rounded border-gray-300" />
              Actif
            </label>
          </div>
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea v-model="form.notes" class="input min-h-24"></textarea>
          </div>
        </div>

        <div class="flex justify-end gap-2 border-t pt-4">
          <button type="button" class="btn-secondary" @click="showModal = false">Annuler</button>
          <button type="submit" class="btn-primary" :disabled="saving">{{ saving ? 'Enregistrement...' : 'Enregistrer' }}</button>
        </div>
      </form>
    </AppModal>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import api from '@/services/api'
import AppModal from '@/components/AppModal.vue'
import AppPagination from '@/components/AppPagination.vue'
import SortableTh from '@/components/SortableTh.vue'
import { useToast } from '@/composables/useToast'
import { useTableSort } from '@/composables/useTableSort'

const toast = useToast()
const comptes = ref([])
const types = ref({})
const stats = reactive({ total: 0, actifs: 0, par_type: {}, solde_initial_total: 0, total_entrees: 0, total_sorties: 0, solde_actuel_total: 0 })
const filters = reactive({ search: '', type: '', is_active: '1' })
const meta = reactive({ current_page: 1, last_page: 1, total: 0, from: 0, to: 0 })
const errors = reactive({})
const loading = ref(false)
const saving = ref(false)
const showModal = ref(false)
const editing = ref(null)
const form = reactive(defaultForm())
const { sort, toggleSort, sortIcon, sortedRows } = useTableSort('created_at', 'desc')

const overviewCards = computed(() => [
  {
    key: 'solde',
    label: 'Solde disponible',
    value: formatPrice(stats.solde_actuel_total),
    sub: `${stats.actifs || 0} compte(s) actif(s)`,
    short: 'TR',
    color: 'var(--saytu-primary)',
  },
  {
    key: 'entrees',
    label: 'Entrées cumulées',
    value: formatPrice(stats.total_entrees),
    sub: 'Toutes les entrées enregistrées',
    short: '+',
    color: 'var(--saytu-secondary)',
  },
  {
    key: 'sorties',
    label: 'Sorties cumulées',
    value: formatPrice(stats.total_sorties),
    sub: 'Toutes les sorties enregistrées',
    short: '-',
    color: 'var(--saytu-danger)',
  },
  {
    key: 'banques',
    label: 'Comptes bancaires',
    value: stats.par_type?.banque || 0,
    sub: `${stats.total || 0} compte(s) au total`,
    short: 'BQ',
    color: 'var(--saytu-accent)',
  },
])

const treasuryModules = computed(() => [
  {
    key: 'comptes',
    title: 'Comptes',
    description: 'Banque, caisse, Wave, Orange Money, YAS et autres comptes de trésorerie.',
    status: `${stats.actifs || 0} actif(s)`,
    badgeClass: 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-200',
  },
  {
    key: 'mouvements',
    title: 'Mouvements',
    description: 'Lecture rapide des entrées et sorties liées aux paiements, dépenses et règlements.',
    status: 'Suivi',
    badgeClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200',
  },
  {
    key: 'virements',
    title: 'Virements internes',
    description: 'Prévu pour les transferts Banque → Caisse, Caisse → Wave, Wave → Banque.',
    status: 'À venir',
    badgeClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
  },
  {
    key: 'rapprochement',
    title: 'Rapprochement',
    description: 'Contrôler les soldes réels avec les écritures et les comptes de paiement.',
    status: 'Contrôle',
    badgeClass: 'bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-200',
  },
  {
    key: 'previsions',
    title: 'Prévisions',
    description: 'Anticiper les encaissements attendus et les sorties prochaines.',
    status: 'Planning',
    badgeClass: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200',
  },
  {
    key: 'alertes',
    title: 'Alertes',
    description: 'Repérer les soldes faibles, écarts et mouvements à vérifier.',
    status: 'Sécurité',
    badgeClass: 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-200',
  },
])

const sortedComptes = computed(() => sortedRows(comptes.value, {
  created_at: 'created_at',
  code: 'code',
  libelle: 'libelle',
  type: 'type',
  compte: (row) => row.compte?.numero || '',
  journal: (row) => row.journal?.code || '',
  entrees: (row) => parseFloat(row.total_debit || 0),
  sorties: (row) => parseFloat(row.total_credit || 0),
  solde: (row) => parseFloat(row.solde_actuel || row.solde_initial || 0),
  statut: (row) => row.is_active ? 1 : 0,
}))

let searchTimeout = null
function onSearchInput() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => loadComptes(1), 350)
}

function defaultForm() {
  return {
    code: '',
    libelle: '',
    type: 'banque',
    mode_paiement: 'virement',
    solde_initial: 0,
    devise: 'XOF',
    banque_nom: '',
    numero_compte: '',
    iban: '',
    bic_swift: '',
    titulaire: '',
    telephone: '',
    is_default: false,
    is_active: true,
    notes: '',
  }
}

function resetForm() {
  Object.keys(errors).forEach((key) => delete errors[key])
  Object.assign(form, defaultForm())
  editing.value = null
}

async function loadComptes(page = 1) {
  loading.value = true
  try {
    const { data } = await api.get('/tresorerie-comptes', {
      params: {
        page,
        search: filters.search || undefined,
        type: filters.type || undefined,
        is_active: filters.is_active !== '' ? filters.is_active : undefined,
        per_page: 25,
      },
    })
    comptes.value = data.data
    Object.assign(meta, {
      current_page: data.current_page,
      last_page: data.last_page,
      total: data.total,
      from: data.from || 0,
      to: data.to || 0,
    })
  } catch (e) {
    toast.error('Erreur de chargement')
  } finally {
    loading.value = false
  }
}

async function loadTypes() {
  const { data } = await api.get('/tresorerie-comptes/types')
  types.value = data
}

async function loadStats() {
  try {
    const { data } = await api.get('/tresorerie-comptes/stats')
    Object.assign(stats, data)
  } catch (e) {}
}

function openCreate() {
  resetForm()
  showModal.value = true
}

function openEdit(compte) {
  resetForm()
  editing.value = compte
  Object.assign(form, {
    code: compte.code,
    libelle: compte.libelle,
    type: compte.type,
    mode_paiement: compte.mode_paiement,
    solde_initial: parseFloat(compte.solde_initial || 0),
    devise: compte.devise || 'XOF',
    banque_nom: compte.banque_nom || '',
    numero_compte: compte.numero_compte || '',
    iban: compte.iban || '',
    bic_swift: compte.bic_swift || '',
    titulaire: compte.titulaire || '',
    telephone: compte.telephone || '',
    is_default: !!compte.is_default,
    is_active: !!compte.is_active,
    notes: compte.notes || '',
  })
  showModal.value = true
}

async function saveCompte() {
  saving.value = true
  Object.keys(errors).forEach((key) => delete errors[key])
  try {
    const payload = { ...form }
    if (editing.value) {
      await api.put(`/tresorerie-comptes/${editing.value.id}`, payload)
      toast.success('Compte mis à jour')
    } else {
      await api.post('/tresorerie-comptes', payload)
      toast.success('Compte créé')
    }
    showModal.value = false
    loadComptes(meta.current_page)
    loadStats()
  } catch (err) {
    const data = err.response.data
    if (data.errors) {
      Object.entries(data.errors).forEach(([key, value]) => { errors[key] = Array.isArray(value) ? value[0] : value })
    }
    toast.error(data.message || "Erreur lors de l'enregistrement")
  } finally {
    saving.value = false
  }
}

async function setDefault(compte) {
  try {
    await api.post(`/tresorerie-comptes/${compte.id}/default`)
    toast.success('Compte par défaut mis à jour')
    loadComptes(meta.current_page)
  } catch (e) {
    toast.error('Action impossible')
  }
}

async function desactiver(compte) {
  try {
    await api.delete(`/tresorerie-comptes/${compte.id}`)
    toast.success('Compte désactivé')
    loadComptes(meta.current_page)
    loadStats()
  } catch (e) {
    toast.error('Désactivation impossible')
  }
}

function syncModeFromType() {
  const map = {
    banque: 'virement',
    caisse: 'especes',
    wave: 'wave',
    orange_money: 'orange_money',
    free_money: 'free_money',
    mobile_money: 'mobile_money',
    carte_bancaire: 'carte_bancaire',
    autre: 'autre',
  }
  form.mode_paiement = map[form.type] || 'virement'
}

function typeLabel(type) { return types.value[type] || type || '-' }
function formatPrice(n) { return new Intl.NumberFormat('fr-FR').format(Math.round(n || 0))  }
function typeBadge(type) {
  return {
    banque: 'bg-blue-100 text-blue-800',
    caisse: 'bg-green-100 text-green-800',
    wave: 'bg-cyan-100 text-cyan-800',
    orange_money: 'bg-orange-100 text-orange-800',
    free_money: 'bg-indigo-100 text-indigo-800',
    mobile_money: 'bg-purple-100 text-purple-800',
    carte_bancaire: 'bg-slate-100 text-slate-800',
  }[type] || 'bg-gray-100 text-gray-700'
}

onMounted(() => {
  loadTypes()
  loadComptes()
  loadStats()
})
</script>

<style scoped>
.treasury-hero {
  background:
    radial-gradient(circle at top right, color-mix(in srgb, var(--saytu-secondary) 22%, transparent), transparent 32rem),
    linear-gradient(135deg, color-mix(in srgb, var(--saytu-primary) 10%, white), white 62%);
}

.treasury-hero span {
  background: color-mix(in srgb, var(--saytu-primary) 12%, white);
  color: var(--saytu-primary);
}

.treasury-kpi {
  border-color: color-mix(in srgb, var(--kpi-accent) 30%, transparent);
  color: var(--kpi-accent);
  background:
    radial-gradient(circle at top right, color-mix(in srgb, var(--kpi-accent) 14%, transparent), transparent 12rem),
    color-mix(in srgb, var(--kpi-accent) 5%, white);
}

.treasury-kpi span {
  background: color-mix(in srgb, var(--kpi-accent) 14%, white);
  color: var(--kpi-accent);
}

.treasury-kpi p:last-child {
  color: color-mix(in srgb, var(--kpi-accent) 78%, #475569);
}

:global(.dark) .treasury-hero {
  background:
    radial-gradient(circle at top right, color-mix(in srgb, var(--saytu-secondary) 20%, transparent), transparent 28rem),
    linear-gradient(135deg, color-mix(in srgb, var(--saytu-sidebar-via) 82%, #020617), #020617 70%);
}

:global(.dark) .treasury-hero span {
  background: color-mix(in srgb, var(--saytu-primary) 20%, #020617);
  color: color-mix(in srgb, var(--saytu-primary) 78%, white);
}

:global(.dark) .treasury-kpi {
  background:
    radial-gradient(circle at top right, color-mix(in srgb, var(--kpi-accent) 18%, transparent), transparent 11rem),
    color-mix(in srgb, var(--kpi-accent) 8%, #020617);
}

:global(.dark) .treasury-kpi span {
  background: color-mix(in srgb, var(--kpi-accent) 18%, #020617);
}
</style>
