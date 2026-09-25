<template>
  <div class="app-surface space-y-4">
    <section class="rounded-3xl border border-cyan-200 bg-cyan-50/80 p-5 shadow-sm">
      <button
        type="button"
        class="mb-4 text-sm font-black text-cyan-700 hover:text-cyan-900"
        @click="goBack"
      >
        ← Retour liste
      </button>

      <p class="text-xs font-black uppercase tracking-[0.22em] text-cyan-700">Rapprochement trésorerie</p>
      <h1 class="mt-2 text-2xl font-black text-slate-950">
        {{ compte?.libelle || 'Compte de trésorerie' }}
      </h1>
      <p class="mt-1 text-sm text-cyan-800">
        Contrôle en page complète, sans fenêtre flottante.
      </p>
    </section>

    <section class="rounded-3xl border border-cyan-200 bg-white p-5 shadow-sm">
      <div class="mb-4 border-b border-cyan-100">
        <button
          type="button"
          class="-mb-px rounded-t-2xl border border-cyan-200 border-b-white bg-white px-5 py-3 text-sm font-black text-cyan-700"
        >
          Contrôle du solde
        </button>
      </div>

      <div v-if="loading" class="p-10 text-center text-slate-500">Chargement...</div>

      <form v-else class="space-y-4" @submit.prevent="saveRapprochement">
        <div class="rounded-2xl border border-cyan-100 bg-cyan-50 p-4 text-sm text-cyan-900">
          <div class="grid gap-3 md:grid-cols-3">
            <div>
              <span class="block text-xs font-black uppercase tracking-wide text-cyan-700">Compte</span>
              <strong>{{ compte?.code }} · {{ compte?.libelle }}</strong>
            </div>
            <div>
              <span class="block text-xs font-black uppercase tracking-wide text-cyan-700">Solde théorique</span>
              <strong class="font-mono">{{ formatPrice(compte?.solde_actuel) }}</strong>
            </div>
            <div>
              <span class="block text-xs font-black uppercase tracking-wide text-cyan-700">Écart prévu</span>
              <strong class="font-mono" :class="ecart === 0 ? 'text-slate-700' : ecart > 0 ? 'text-emerald-700' : 'text-red-700'">
                {{ formatPrice(ecart) }}
              </strong>
            </div>
          </div>
        </div>

        <div class="grid gap-4 md:grid-cols-2">
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">Date de contrôle</label>
            <input v-model="form.date_rapprochement" type="date" class="input" required />
            <p v-if="errors.date_rapprochement" class="mt-1 text-xs text-red-600">{{ errors.date_rapprochement }}</p>
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">Solde réel compté</label>
            <input v-model.number="form.solde_reel" type="number" step="0.01" class="input" required />
            <p v-if="errors.solde_reel" class="mt-1 text-xs text-red-600">{{ errors.solde_reel }}</p>
          </div>
          <div class="md:col-span-2">
            <label class="mb-1 block text-sm font-medium text-gray-700">Justification de l’écart</label>
            <textarea v-model="form.justification" class="input min-h-28" placeholder="Obligatoire s’il y a un écart."></textarea>
            <p v-if="errors.justification" class="mt-1 text-xs text-red-600">{{ errors.justification }}</p>
          </div>
        </div>

        <div class="flex justify-end gap-2 border-t border-cyan-100 pt-4">
          <button type="button" class="btn-secondary" @click="goBack">Annuler</button>
          <button type="submit" class="btn-primary" :disabled="saving">
            {{ saving ? 'Enregistrement...' : 'Enregistrer le contrôle' }}
          </button>
        </div>
      </form>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const loading = ref(true)
const saving = ref(false)
const compte = ref(null)
const errors = reactive({})
const form = reactive({
  date_rapprochement: new Date().toISOString().slice(0, 10),
  solde_reel: 0,
  justification: '',
})

const ecart = computed(() => Number(form.solde_reel || 0) - Number(compte.value?.solde_actuel || 0))

onMounted(loadCompte)

async function loadCompte() {
  loading.value = true
  try {
    const { data } = await api.get(`/tresorerie-comptes/${route.params.id}`)
    compte.value = data
    form.solde_reel = Number(data.solde_actuel || data.solde_initial || 0)
  } catch (error) {
    toast.error('Compte de trésorerie introuvable.')
    router.replace({ name: 'tresorerie-comptes' })
  } finally {
    loading.value = false
  }
}

async function saveRapprochement() {
  if (!compte.value) return
  saving.value = true
  Object.keys(errors).forEach((key) => delete errors[key])

  try {
    await api.post(`/tresorerie-comptes/${compte.value.id}/rapprochements`, { ...form })
    toast.success('Rapprochement enregistré.')
    goBack()
  } catch (err) {
    const data = err.response?.data || {}
    if (data.errors) {
      Object.entries(data.errors).forEach(([key, value]) => {
        errors[key] = Array.isArray(value) ? value[0] : value
      })
    }
    toast.error(data.message || 'Rapprochement impossible.')
  } finally {
    saving.value = false
  }
}

function goBack() {
  router.push({ name: 'tresorerie-comptes' })
}

function formatPrice(n) {
  return new Intl.NumberFormat('fr-FR').format(Math.round(Number(n || 0)))
}
</script>
