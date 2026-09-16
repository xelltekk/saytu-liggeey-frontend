<template>
  <div class="space-y-4">
    <div class="stat-grid grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
      <div class="rounded-xl border border-cyan-100 bg-cyan-50/70 p-3 text-center">
        <div class="text-2xl font-bold text-xelltekk-700">{{ entrepot.zones?.length || 0 }}</div>
        <div class="text-xs uppercase text-gray-500">Zones</div>
      </div>
      <div class="rounded-xl border border-cyan-100 bg-cyan-50/70 p-3 text-center">
        <div class="text-2xl font-bold text-xelltekk-700">{{ totalEmplacements }}</div>
        <div class="text-xs uppercase text-gray-500">Emplacements</div>
      </div>
      <div class="rounded-xl border border-cyan-100 bg-cyan-50/70 p-3 text-center">
        <div class="text-2xl font-bold text-xelltekk-700">{{ occupationGlobalLabel }}</div>
        <div class="text-xs uppercase text-gray-500">Occupation</div>
      </div>
      <div class="rounded-xl border border-cyan-100 bg-cyan-50/70 p-3 text-center">
        <div class="text-2xl font-bold" :class="stockSansEmplacement.quantite > 0 ? 'text-orange-700' : 'text-emerald-700'">
          {{ formatQte(stockSansEmplacement.quantite) }}
        </div>
        <div class="text-xs uppercase text-gray-500">Sans emplacement</div>
      </div>
    </div>

    <div
      v-if="stockSansEmplacement.quantite > 0"
      class="rounded-xl border border-orange-200 bg-orange-50 p-3 text-sm text-orange-800"
    >
      <strong>{{ stockSansEmplacement.produits }} produit(s)</strong> ont encore du stock sans emplacement précis
      pour {{ formatQte(stockSansEmplacement.quantite) }} unité(s), soit environ {{ formatPrice(stockSansEmplacement.valeur) }}.
      Affectez ces lignes à un rayon pour fiabiliser le rangement.
    </div>

    <div>
      <div class="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h4 class="font-semibold text-gray-800">Zones</h4>
        <button v-if="canManage" @click="showZoneForm = !showZoneForm" class="btn-secondary text-xs">
          {{ showZoneForm ? 'Annuler' : '+ Ajouter une zone' }}
        </button>
      </div>

      <div v-if="showZoneForm && canManage" class="mb-3 rounded border border-gray-200 bg-gray-50 p-3">
        <div class="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <input v-model="newZone.code" type="text" class="input text-sm" placeholder="Code (ex: A1)" />
          <input v-model="newZone.libelle" type="text" class="input text-sm" placeholder="Libelle" />
          <select v-model="newZone.type" class="input text-sm">
            <option value="stockage">Stockage</option>
            <option value="reception">Reception</option>
            <option value="expedition">Expedition</option>
            <option value="quarantaine">Quarantaine</option>
            <option value="sav">SAV</option>
          </select>
        </div>
        <button @click="createZone" :disabled="savingZone" class="btn-primary mt-2 w-full text-sm">
          {{ savingZone ? 'Creation...' : 'Creer la zone' }}
        </button>
      </div>

      <div v-if="(entrepot.zones?.length || 0) === 0" class="py-4 text-center text-sm text-gray-400">
        Aucune zone. Ajoutez-en une.
      </div>

      <div v-for="zone in entrepot.zones" :key="zone.id" class="mb-2 rounded-lg border border-gray-200 p-3">
        <div class="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span class="font-semibold">{{ zone.libelle }}</span>
            <span class="ml-2 text-xs text-gray-500">[{{ zone.code }}]</span>
            <span class="badge ml-2 text-xs" :class="typeBadge(zone.type)">{{ typeLabel(zone.type) }}</span>
          </div>
          <div v-if="canManage" class="flex gap-1">
            <button @click="addEmplacementTo(zone.id)" class="btn-secondary text-xs">+ Empl.</button>
            <button @click="deleteZone(zone)" class="text-sm text-red-600 hover:text-red-800">Supprimer</button>
          </div>
        </div>

        <div v-if="newEmplacementZoneId === zone.id && canManage" class="mb-2 rounded bg-blue-50 p-2">
          <div class="grid grid-cols-1 gap-1 sm:grid-cols-3">
            <input v-model="newEmplacement.code" type="text" class="input text-xs" placeholder="Code" />
            <input v-model="newEmplacement.libelle" type="text" class="input text-xs" placeholder="Libellé optionnel" />
            <input v-model.number="newEmplacement.capacite_max" type="number" min="0" class="input text-xs" placeholder="Capacité max" />
            <input v-model="newEmplacement.allee" type="text" class="input text-xs" placeholder="Allee" />
            <input v-model="newEmplacement.rangee" type="text" class="input text-xs" placeholder="Rangee" />
            <input v-model="newEmplacement.niveau" type="text" class="input text-xs" placeholder="Niveau" />
          </div>
          <button @click="createEmplacement(zone.id)" :disabled="savingEmplacement" class="btn-primary mt-1 w-full text-xs">
            {{ savingEmplacement ? 'Creation...' : 'Creer' }}
          </button>
        </div>

        <div v-if="zone.emplacements?.length > 0" class="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
          <div
            v-for="emp in zone.emplacements"
            :key="emp.id"
            class="rounded-xl border p-3 text-xs"
            :class="occupationCardClass(emp)"
          >
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0">
                <p class="truncate font-mono font-black text-slate-900">{{ emp.code }}</p>
                <p v-if="emp.libelle" class="truncate text-slate-600">{{ emp.libelle }}</p>
                <p v-if="emp.allee || emp.rangee || emp.niveau" class="text-slate-500">
                  {{ [emp.allee && `Rayon ${emp.allee}`, emp.rangee && `Rangée ${emp.rangee}`, emp.niveau && `Niveau ${emp.niveau}`].filter(Boolean).join(' / ') }}
                </p>
              </div>
              <button v-if="canManage" @click="deleteEmplacement(emp)" class="rounded-full px-2 py-0.5 text-red-500 hover:bg-red-50 hover:text-red-700">x</button>
            </div>
            <div class="mt-3 h-1.5 overflow-hidden rounded-full bg-white/80">
              <div class="h-full rounded-full" :class="occupationBarClass(emp)" :style="{ width: occupationBarWidth(emp) }"></div>
            </div>
            <div class="mt-2 flex items-center justify-between gap-2">
              <span class="font-bold" :class="occupationTextClass(emp)">{{ occupationLabel(emp) }}</span>
              <span class="font-mono text-slate-700">{{ formatQte(occupation(emp).quantite) }} / {{ occupation(emp).capacite_max ? formatQte(occupation(emp).capacite_max) : '∞' }}</span>
            </div>
            <div class="mt-1 flex items-center justify-between gap-2 text-slate-500">
              <span>{{ occupation(emp).produits }} produit(s)</span>
              <span>{{ formatPrice(occupation(emp).valeur) }}</span>
            </div>
          </div>
        </div>
        <div v-else class="text-xs text-gray-400">Aucun emplacement</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'

const props = defineProps({
  entrepot: { type: Object, required: true },
  canManage: { type: Boolean, default: false },
})
const emit = defineEmits(['refresh'])
const toast = useToast()
const { confirm: askConfirm } = useConfirm()

const showZoneForm = ref(false)
const newZone = reactive({ code: '', libelle: '', type: 'stockage' })
const newEmplacementZoneId = ref(null)
const newEmplacement = reactive({ code: '', libelle: '', allee: '', rangee: '', niveau: '', capacite_max: null })
const savingZone = ref(false)
const savingEmplacement = ref(false)

const stats = computed(() => props.entrepot.stats || {})
const stockSansEmplacement = computed(() => stats.value.stock_sans_emplacement || { produits: 0, quantite: 0, valeur: 0 })
const occupationGlobalLabel = computed(() => {
  const taux = stats.value.taux_occupation
  return taux === null || taux === undefined ? 'N/A' : `${formatQte(taux)}%`
})

const totalEmplacements = computed(() => {
  return props.entrepot.zones?.reduce((s, z) => s + (z.emplacements?.length || 0), 0) || 0
})

async function createZone() {
  if (!newZone.code || !newZone.libelle) {
    toast.error('Code et libelle requis')
    return
  }

  savingZone.value = true
  try {
    await api.post(`/entrepots/${props.entrepot.id}/zones`, newZone)
    toast.success('Zone creee')
    showZoneForm.value = false
    Object.assign(newZone, { code: '', libelle: '', type: 'stockage' })
    emit('refresh')
  } catch (err) {
    toast.error(err.response?.data?.message || 'Erreur')
  } finally {
    savingZone.value = false
  }
}

async function deleteZone(zone) {
  if (!await askConfirm({ message: `Supprimer la zone "${zone.libelle}" ?`, tone: 'danger', confirmLabel: 'Supprimer' })) return
  try {
    await api.delete(`/zones/${zone.id}`)
    toast.success('Zone supprimee')
    emit('refresh')
  } catch (err) {
    toast.error(err.response?.data?.message || 'Erreur de suppression')
  }
}

function addEmplacementTo(zoneId) {
  newEmplacementZoneId.value = newEmplacementZoneId.value === zoneId ? null : zoneId
  Object.assign(newEmplacement, { code: '', libelle: '', allee: '', rangee: '', niveau: '', capacite_max: null })
}

async function createEmplacement(zoneId) {
  if (!newEmplacement.code) {
    toast.error('Code requis')
    return
  }

  savingEmplacement.value = true
  try {
    await api.post(`/zones/${zoneId}/emplacements`, {
      ...newEmplacement,
      capacite_max: newEmplacement.capacite_max === '' || newEmplacement.capacite_max === null ? null : Number(newEmplacement.capacite_max),
    })
    toast.success('Emplacement cree')
    newEmplacementZoneId.value = null
    emit('refresh')
  } catch (err) {
    toast.error(err.response?.data?.message || 'Erreur')
  } finally {
    savingEmplacement.value = false
  }
}

async function deleteEmplacement(emp) {
  if (!await askConfirm({ message: `Supprimer l'emplacement "${emp.code}" ?`, tone: 'danger', confirmLabel: 'Supprimer' })) return
  try {
    await api.delete(`/emplacements/${emp.id}`)
    toast.success('Emplacement supprime')
    emit('refresh')
  } catch (err) {
    toast.error(err.response?.data?.message || 'Erreur')
  }
}

function typeLabel(type) {
  return {
    stockage: 'Stockage',
    reception: 'Reception',
    expedition: 'Expedition',
    quarantaine: 'Quarantaine',
    sav: 'SAV',
  }[type] || type
}

function typeBadge(type) {
  return {
    stockage: 'bg-blue-100 text-blue-700',
    reception: 'bg-green-100 text-green-700',
    expedition: 'bg-purple-100 text-purple-700',
    quarantaine: 'bg-yellow-100 text-yellow-700',
    sav: 'bg-orange-100 text-orange-700',
  }[type] || 'bg-gray-100'
}

function occupation(emp) {
  return emp.occupation || {
    produits: 0,
    quantite: 0,
    valeur: 0,
    capacite_max: emp.capacite_max || null,
    taux_occupation: null,
    statut: 'vide',
  }
}

function occupationLabel(emp) {
  const occ = occupation(emp)
  return {
    vide: 'Vide',
    ok: `${formatQte(occ.taux_occupation)}% occupé`,
    charge: `${formatQte(occ.taux_occupation)}% chargé`,
    sature: `${formatQte(occ.taux_occupation)}% saturé`,
    sans_capacite: 'Capacité non définie',
  }[occ.statut] || 'À vérifier'
}

function occupationCardClass(emp) {
  return {
    vide: 'border-slate-200 bg-slate-50',
    ok: 'border-cyan-200 bg-cyan-50/70',
    charge: 'border-orange-200 bg-orange-50',
    sature: 'border-red-200 bg-red-50',
    sans_capacite: 'border-sky-200 bg-sky-50',
  }[occupation(emp).statut] || 'border-slate-200 bg-slate-50'
}

function occupationBarClass(emp) {
  return {
    vide: 'bg-slate-300',
    ok: 'bg-cyan-500',
    charge: 'bg-orange-500',
    sature: 'bg-red-500',
    sans_capacite: 'bg-sky-400',
  }[occupation(emp).statut] || 'bg-slate-300'
}

function occupationTextClass(emp) {
  return {
    vide: 'text-slate-500',
    ok: 'text-cyan-700',
    charge: 'text-orange-700',
    sature: 'text-red-700',
    sans_capacite: 'text-sky-700',
  }[occupation(emp).statut] || 'text-slate-500'
}

function occupationBarWidth(emp) {
  const occ = occupation(emp)
  if (occ.taux_occupation === null || occ.taux_occupation === undefined) {
    return occ.quantite > 0 ? '100%' : '0%'
  }

  return `${Math.min(100, Math.max(0, Number(occ.taux_occupation || 0)))}%`
}

function formatQte(value) {
  return Number(value || 0).toLocaleString('fr-FR', { maximumFractionDigits: 3 })
}

function formatPrice(value) {
  return new Intl.NumberFormat('fr-FR').format(Math.round(Number(value || 0)))
}
</script>
