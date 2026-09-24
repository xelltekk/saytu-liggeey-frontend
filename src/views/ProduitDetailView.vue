<template>
  <div class="app-surface space-y-4">
    <div class="rounded-2xl border border-cyan-200 bg-white p-4 shadow-sm">
      <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <button type="button" class="mb-3 text-sm font-bold text-cyan-700 hover:text-cyan-900" @click="goBack">
            ← Retour liste
          </button>
          <div class="flex flex-wrap items-center gap-2">
            <h1 class="text-2xl font-black text-slate-950">
              {{ isCreate ? 'Nouveau produit' : produit?.reference || 'Produit' }}
            </h1>
            <span v-if="produit" class="badge text-xs" :class="produit.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'">
              {{ produit.is_active ? 'Actif' : 'Inactif' }}
            </span>
            <span v-if="produit" class="badge text-xs" :class="typeBadgeClass(produit.type)">
              {{ typeLabel(produit.type) }}
            </span>
          </div>
          <p class="mt-1 text-sm text-slate-600">
            <template v-if="isCreate">Saisie en page complète, sans fenêtre flottante.</template>
            <template v-else>
              {{ produit?.libelle || 'Produit non renseigné' }}
              <span v-if="produit?.categorie?.libelle"> · {{ produit.categorie.libelle }}</span>
            </template>
          </p>
        </div>

        <div v-if="produit" class="flex flex-wrap gap-2">
          <button type="button" class="btn-secondary" @click="setTab('saisie')">Modifier</button>
          <button type="button" class="btn-secondary" @click="goStock">Stock</button>
        </div>
      </div>
    </div>

    <div class="rounded-2xl border border-cyan-200 bg-white shadow-sm">
      <div class="flex flex-wrap gap-1 border-b border-cyan-100 px-3 pt-3">
        <button
          v-for="tab in visibleTabs"
          :key="tab.key"
          type="button"
          class="rounded-t-xl px-4 py-2 text-sm font-black transition"
          :class="activeTab === tab.key ? 'bg-cyan-100 text-cyan-900' : 'text-slate-600 hover:bg-cyan-50 hover:text-cyan-800'"
          @click="setTab(tab.key)"
        >
          {{ tab.label }}
        </button>
      </div>

      <div v-if="loading" class="p-10 text-center text-slate-500">Chargement...</div>

      <div v-else-if="activeTab === 'fiche' && produit" class="space-y-4 p-4">
        <section class="grid gap-4 lg:grid-cols-[220px_1fr]">
          <div class="flex h-52 items-center justify-center overflow-hidden rounded-3xl border border-cyan-100 bg-cyan-50 text-5xl text-cyan-200">
            <img v-if="imageUrl(produit.image)" :src="imageUrl(produit.image)" :alt="produit.libelle" class="h-full w-full object-cover" />
            <span v-else>▣</span>
          </div>

          <div class="rounded-3xl border border-cyan-100 bg-cyan-50/70 p-4">
            <p class="text-xs font-black uppercase tracking-[0.2em] text-cyan-700">Fiche produit</p>
            <h2 class="mt-2 text-2xl font-black text-slate-950">{{ produit.libelle }}</h2>
            <p class="mt-2 text-sm leading-6 text-slate-600">{{ produit.description || 'Aucune description renseignée.' }}</p>

            <div class="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div class="product-detail-kpi">
                <span>Prix HT</span>
                <strong>{{ formatPrice(produit.prix_vente_ht) }}</strong>
              </div>
              <div class="product-detail-kpi">
                <span>Prix TTC</span>
                <strong>{{ formatPrice(prixTtc(produit)) }}</strong>
              </div>
              <div class="product-detail-kpi">
                <span>TVA</span>
                <strong>{{ Number(produit.taux_tva || 0) }}%</strong>
              </div>
              <div class="product-detail-kpi">
                <span>{{ produit.type === 'pack' ? 'Composants' : 'Stock alerte' }}</span>
                <strong>{{ produit.type === 'pack' ? (produit.pack_items?.length || 0) : (produit.stock_alerte ?? 0) }}</strong>
              </div>
            </div>
          </div>
        </section>

        <section v-if="produit.type === 'pack'" class="rounded-3xl border border-cyan-100 bg-cyan-50/70 p-4">
          <div class="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p class="text-xs font-black uppercase tracking-[0.2em] text-cyan-700">Pack de vente</p>
              <h2 class="text-lg font-black text-slate-950">Composition du pack</h2>
            </div>
            <span class="rounded-full bg-white px-3 py-1 text-xs font-black text-cyan-700">
              Déduction automatique à la validation facture
            </span>
          </div>

          <div v-if="produit.pack_items?.length" class="overflow-x-auto rounded-2xl border border-cyan-100 bg-white">
            <table class="w-full text-sm">
              <thead class="bg-cyan-100/70 text-left text-xs uppercase tracking-wide text-cyan-900">
                <tr>
                  <th class="px-3 py-2">Composant</th>
                  <th class="px-3 py-2 text-right">Qté par pack</th>
                  <th class="px-3 py-2 text-right">Prix achat HT</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-cyan-100">
                <tr v-for="item in produit.pack_items" :key="item.id || item.composant_id">
                  <td class="px-3 py-3">
                    <strong>{{ item.composant?.libelle || 'Produit' }}</strong>
                    <p class="font-mono text-xs text-slate-500">{{ item.composant?.reference || '-' }}</p>
                  </td>
                  <td class="px-3 py-3 text-right font-mono font-bold">{{ number(item.quantite) }} {{ item.composant?.unite || '' }}</td>
                  <td class="px-3 py-3 text-right font-mono">{{ formatPrice(item.composant?.prix_achat_ht || 0) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p v-else class="rounded-2xl border border-dashed border-cyan-200 bg-white p-4 text-sm text-slate-500">
            Aucun composant renseigné pour ce pack.
          </p>
        </section>

        <section class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div class="product-info-card">
            <span>Référence</span>
            <strong>{{ produit.reference || '—' }}</strong>
          </div>
          <div class="product-info-card">
            <span>Code-barres</span>
            <strong>{{ produit.code_barre || '—' }}</strong>
          </div>
          <div class="product-info-card">
            <span>Catégorie</span>
            <strong>{{ produit.categorie?.libelle || '—' }}</strong>
          </div>
          <div class="product-info-card">
            <span>Marque / modèle</span>
            <strong>{{ [produit.marque, produit.modele].filter(Boolean).join(' · ') || '—' }}</strong>
          </div>
          <div class="product-info-card">
            <span>Nature</span>
            <strong>{{ produit.nature || '—' }}</strong>
          </div>
          <div class="product-info-card">
            <span>Unité</span>
            <strong>{{ produit.unite || '—' }}</strong>
          </div>
          <div class="product-info-card">
            <span>Garantie</span>
            <strong>{{ produit.garantie_mois ? `${produit.garantie_mois} mois` : '—' }}</strong>
          </div>
          <div class="product-info-card">
            <span>Stock géré</span>
            <strong>{{ produit.gere_stock ? 'Oui' : 'Non' }}</strong>
          </div>
        </section>
      </div>

      <div v-else class="p-4">
        <ProduitForm
          :produit="isCreate ? null : produit"
          @saved="onSaved"
          @cancel="goBack"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'
import ProduitForm from '@/components/ProduitForm.vue'
import { useToast } from '@/composables/useToast'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const produit = ref(null)
const loading = ref(false)
const activeTab = ref(String(route.query.tab || 'fiche'))

const isCreate = computed(() => route.name === 'produit-create')
const visibleTabs = computed(() => isCreate.value
  ? [{ key: 'saisie', label: 'Saisie produit' }]
  : [
      { key: 'fiche', label: 'Fiche' },
      { key: 'saisie', label: 'Saisie produit' },
    ])

onMounted(loadProduit)

watch(() => route.params.id, loadProduit)
watch(() => route.query.tab, (tab) => {
  const next = typeof tab === 'string' ? tab : (isCreate.value ? 'saisie' : 'fiche')
  if (visibleTabs.value.some((item) => item.key === next)) activeTab.value = next
}, { immediate: true })

async function loadProduit() {
  if (isCreate.value) {
    produit.value = null
    activeTab.value = 'saisie'
    return
  }

  if (route.name !== 'produit-detail' || !route.params.id) return

  loading.value = true
  try {
    const { data } = await api.get(`/produits/${route.params.id}`)
    produit.value = data
  } catch (error) {
    toast.error('Produit introuvable')
    router.replace({ name: 'produits' })
  } finally {
    loading.value = false
  }
}

function setTab(tab) {
  activeTab.value = tab
  router.replace({ query: { ...route.query, tab } })
}

function goBack() {
  router.push({ name: 'produits' })
}

function goStock() {
  if (!produit.value) return
  router.push({ path: '/stock', query: { search: produit.value.reference || produit.value.libelle } })
}

async function onSaved(saved) {
  produit.value = saved
  if (isCreate.value && saved?.id) {
    await router.replace({ name: 'produit-detail', params: { id: saved.id }, query: { tab: 'fiche' } })
  } else {
    activeTab.value = 'fiche'
    await router.replace({ query: { ...route.query, tab: 'fiche' } })
    await loadProduit()
  }
}

function prixTtc(row) {
  return Math.round(Number(row?.prix_vente_ht || 0) * (1 + Number(row?.taux_tva || 0) / 100))
}

function formatPrice(n) {
  return new Intl.NumberFormat('fr-FR').format(n || 0)
}

function number(n) {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 3 }).format(Number(n || 0))
}

function imageUrl(image) {
  if (!image) return ''
  if (String(image).startsWith('http') || String(image).startsWith('data:') || String(image).startsWith('blob:')) return image
  return String(image).startsWith('/') ? image : `/${image}`
}

function typeLabel(type) {
  return { produit: 'Produit', service: 'Service', pack: 'Pack de vente' }[type] || type || '—'
}

function typeBadgeClass(type) {
  return {
    produit: 'bg-blue-100 text-blue-800',
    service: 'bg-purple-100 text-purple-800',
    pack: 'bg-cyan-100 text-cyan-800',
  }[type] || 'bg-slate-100 text-slate-600'
}
</script>

<style scoped>
.product-detail-kpi,
.product-info-card {
  border: 1px solid color-mix(in srgb, var(--saytu-primary, #0ea5e9) 16%, var(--saytu-border, #bae6fd));
  border-radius: 1rem;
  background: rgb(255 255 255 / 72%);
  padding: 0.85rem;
}

.product-detail-kpi span,
.product-info-card span {
  display: block;
  color: color-mix(in srgb, var(--saytu-shell-text, #0f172a) 62%, var(--saytu-primary, #0ea5e9));
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.product-detail-kpi strong,
.product-info-card strong {
  display: block;
  margin-top: 0.35rem;
  color: var(--saytu-shell-text, #0f172a);
  font-size: 1rem;
  font-weight: 950;
}
</style>
