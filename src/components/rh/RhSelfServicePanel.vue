<template>
  <div v-if="notLinked" class="rounded-lg border border-orange-200 bg-orange-50 p-5 text-sm text-orange-800">
    Votre compte n'est pas encore lie a une fiche employe. Demandez au gerant d'effectuer cette liaison depuis l'onglet Personnel.
  </div>

  <div v-else class="space-y-4">
    <section class="rounded-lg border border-slate-200 bg-white p-4">
      <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 class="text-lg font-bold text-slate-900">{{ nom(data.profil) }}</h3>
          <p class="text-sm text-slate-500">
            {{ data.profil.matricule || '-' }} - {{ data.profil.poste?.libelle || 'Poste non affecte' }} - {{ data.profil.departement?.libelle || 'Service non affecte' }}
          </p>
        </div>
        <span class="badge bg-green-100 text-green-800">{{ data.profil.statut || 'actif' }}</span>
      </div>
    </section>

    <div class="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-7">
      <div v-for="card in cards" :key="card.label" class="rounded-lg border border-slate-200 bg-white p-3">
        <p class="text-xs uppercase text-slate-500">{{ card.label }}</p>
        <strong class="mt-1 block text-xl text-slate-900">{{ card.value }}</strong>
      </div>
    </div>

    <div class="grid gap-4 xl:grid-cols-[1fr_360px]">
      <form class="rounded-lg border border-slate-200 bg-white p-4" @submit.prevent="save">
        <h3 class="font-bold text-slate-900">Mes coordonnees personnelles</h3>
        <p class="mt-1 text-sm text-slate-500">Les informations contractuelles restent gerees par le responsable RH.</p>
        <div class="mt-4 grid gap-3 sm:grid-cols-2">
          <label class="label">Email personnel<input v-model="form.email" type="email" class="input" /></label>
          <label class="label">Telephone<input v-model="form.telephone" type="tel" data-phone-input class="input" placeholder="77 123 45 67" /></label>
          <label class="label sm:col-span-2">Adresse<input v-model="form.adresse" class="input" /></label>
          <label class="label">Date de naissance<input v-model="form.date_naissance" type="date" class="input" /></label>
          <label class="label">Contact d'urgence<input v-model="form.contact_urgence" class="input" /></label>
          <div class="sm:col-span-2"><button class="btn-primary">Enregistrer mes coordonnees</button></div>
        </div>
      </form>

      <section class="rounded-lg border border-slate-200 bg-white p-4">
        <h3 class="font-bold text-slate-900">Mon affectation</h3>
        <dl class="mt-3 space-y-3 text-sm">
          <div><dt class="text-slate-500">Matricule</dt><dd class="font-semibold">{{ data.profil.matricule || '-' }}</dd></div>
          <div><dt class="text-slate-500">Service</dt><dd class="font-semibold">{{ data.profil.departement?.libelle || '-' }}</dd></div>
          <div><dt class="text-slate-500">Poste</dt><dd class="font-semibold">{{ data.profil.poste?.libelle || '-' }}</dd></div>
          <div><dt class="text-slate-500">Responsable</dt><dd class="font-semibold">{{ nom(data.profil.manager) }}</dd></div>
          <div><dt class="text-slate-500">Contrat</dt><dd class="font-semibold uppercase">{{ data.profil.type_contrat || '-' }}</dd></div>
          <div><dt class="text-slate-500">Date d'embauche</dt><dd class="font-semibold">{{ date(data.profil.date_embauche) }}</dd></div>
        </dl>
      </section>
    </div>

    <div class="grid gap-4 xl:grid-cols-3">
      <section class="panel-card">
        <h3 class="font-bold text-slate-900">Mes soldes de conges</h3>
        <div class="mt-3 space-y-3">
          <div v-for="s in data.soldes_conges" :key="s.type_conge_id" class="rounded-md border border-slate-200 p-3 text-sm">
            <div class="flex items-center justify-between gap-3">
              <strong>{{ s.libelle }}</strong>
              <span class="badge" :style="{ backgroundColor: `${s.couleur || '#2563eb'}20`, color: s.couleur || '#2563eb' }">{{ s.annee }}</span>
            </div>
            <div v-if="s.illimite" class="mt-3 rounded bg-slate-50 px-3 py-2 font-semibold text-slate-700">Sans plafond annuel</div>
            <template v-else>
              <div class="mt-3 h-2 overflow-hidden rounded bg-slate-100"><div class="h-full rounded bg-blue-600" :style="{ width: soldeWidth(s) + '%' }"></div></div>
              <div class="mt-2 grid grid-cols-3 gap-2 text-xs text-slate-600">
                <div><span class="block uppercase text-slate-400">Annuel</span><strong class="text-slate-900">{{ jours(s.annuel) }}</strong></div>
                <div><span class="block uppercase text-slate-400">Utilise</span><strong class="text-slate-900">{{ jours(s.utilise) }}</strong></div>
                <div><span class="block uppercase text-slate-400">Dispo</span><strong class="text-green-700">{{ jours(s.disponible) }}</strong></div>
              </div>
              <p v-if="Number(s.en_attente || 0) > 0" class="mt-2 text-xs text-orange-700">{{ jours(s.en_attente) }} jour(s) en attente.</p>
            </template>
          </div>
          <p v-if="!data.soldes_conges.length" class="empty-line">Aucun type de conge configure.</p>
        </div>
      </section>

      <section class="panel-card">
        <h3 class="font-bold text-slate-900">Mes prochains conges</h3>
        <div class="mt-3 divide-y divide-slate-100">
          <div v-for="c in data.prochains_conges" :key="c.id" class="py-3 text-sm">
            <strong>{{ c.type_conge?.libelle || 'Conge' }}</strong>
            <p class="mt-1 text-slate-500">{{ date(c.date_debut) }} au {{ date(c.date_fin) }}</p>
          </div>
          <p v-if="!data.prochains_conges.length" class="empty-line">Aucun conge planifie.</p>
        </div>
      </section>

      <section class="panel-card">
        <h3 class="font-bold text-slate-900">Mes objectifs recents</h3>
        <div class="mt-3 space-y-3">
          <div v-for="o in data.objectifs" :key="o.id" class="rounded-md border border-slate-200 p-3 text-sm">
            <div class="flex justify-between gap-2"><strong>{{ o.titre }}</strong><span>{{ o.realise }} / {{ o.cible }} {{ o.unite }}</span></div>
            <div class="mt-2 h-2 overflow-hidden rounded bg-slate-100"><div class="h-full rounded bg-blue-600" :style="{ width: progression(o) + '%' }"></div></div>
          </div>
          <p v-if="!data.objectifs.length" class="empty-line">Aucun objectif enregistre.</p>
        </div>
      </section>
    </div>

    <div class="grid gap-4 xl:grid-cols-2">
      <section class="panel-card">
        <div class="section-head"><h3>Mes documents partages</h3><span>{{ data.documents.length }}</span></div>
        <div class="mt-3 divide-y divide-slate-100">
          <div v-for="doc in data.documents" :key="doc.id" class="item-row">
            <div><strong>{{ doc.titre }}</strong><p>{{ doc.type }} - {{ date(doc.date_document) }}</p></div>
            <button class="btn-secondary" @click="download(`/rh/documents/${doc.id}/telecharger`, doc.nom_original || doc.titre)">Telecharger</button>
          </div>
          <p v-if="!data.documents.length" class="empty-line">Aucun document partage.</p>
        </div>
      </section>

      <section class="panel-card">
        <div class="section-head"><h3>Mes bulletins de paie</h3><span>{{ data.bulletins.length }}</span></div>
        <div class="mt-3 divide-y divide-slate-100">
          <div v-for="b in data.bulletins" :key="b.id" class="item-row">
            <div><strong>{{ b.periode_libelle || b.periode }}</strong><p>{{ b.nom_original || 'Bulletin de paie' }}</p></div>
            <button class="btn-secondary" @click="download(`/rh/paie/bulletins/${b.id}/telecharger`, b.nom_original || `bulletin-${b.periode}.pdf`)">Telecharger</button>
          </div>
          <p v-if="!data.bulletins.length" class="empty-line">Aucun bulletin publie.</p>
        </div>
      </section>

      <section class="panel-card">
        <div class="section-head"><h3>Mes formations</h3><span>{{ data.formations.length }}</span></div>
        <div class="mt-3 space-y-3">
          <div v-for="i in data.formations" :key="i.id" class="rounded-md border border-slate-200 p-3 text-sm">
            <div class="flex items-start justify-between gap-3"><strong>{{ i.formation.titre || '-' }}</strong><span class="badge bg-blue-50 text-blue-700">{{ i.statut }}</span></div>
            <p class="mt-1 text-slate-500">{{ i.formation.organisme || '-' }} - {{ date(i.formation.date_debut) }} au {{ date(i.formation.date_fin) }}</p>
            <div class="mt-2 h-2 overflow-hidden rounded bg-slate-100"><div class="h-full rounded bg-green-600" :style="{ width: Math.min(100, Number(i.progression || 0)) + '%' }"></div></div>
          </div>
          <p v-if="!data.formations.length" class="empty-line">Aucune formation assignee.</p>
        </div>
      </section>

      <section class="panel-card">
        <div class="section-head"><h3>Mes avantages sociaux</h3><span>{{ data.avantages.length }}</span></div>
        <div class="mt-3 space-y-3">
          <div v-for="a in data.avantages" :key="a.id" class="rounded-md border border-slate-200 p-3 text-sm">
            <div class="flex items-start justify-between gap-3"><strong>{{ a.avantage?.libelle || '-' }}</strong><span class="badge bg-green-50 text-green-700">{{ a.statut }}</span></div>
            <p class="mt-1 text-slate-500">{{ a.avantage?.prestataire || 'Sans prestataire' }} - depuis le {{ date(a.date_debut) }}</p>
            <p v-if="a.reference" class="mt-1 text-xs text-slate-500">Reference : {{ a.reference }}</p>
          </div>
          <p v-if="!data.avantages.length" class="empty-line">Aucun avantage actif.</p>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'

const toast = useToast()
const notLinked = ref(false)
const data = reactive({
  profil: {},
  stats: {},
  prochains_conges: [],
  soldes_conges: [],
  objectifs: [],
  documents: [],
  bulletins: [],
  formations: [],
  avantages: [],
})
const form = reactive({ email: '', telephone: '', adresse: '', date_naissance: '', contact_urgence: '' })

const cards = computed(() => [
  { label: 'Pointages ce mois', value: data.stats.pointages_mois || 0 },
  { label: 'Conges en attente', value: data.stats.conges_en_attente || 0 },
  { label: 'Objectifs en cours', value: data.stats.objectifs_en_cours || 0 },
  { label: 'Formations en cours', value: data.stats.formations_en_cours || 0 },
  { label: 'Documents partages', value: data.stats.documents_partages || 0 },
  { label: 'Bulletins de paie', value: data.stats.bulletins_paie || 0 },
  { label: 'Parcours ouverts', value: data.stats.parcours_ouverts || 0 },
])

function nom(e) { return e ? `${e.prenom || ''} ${e.nom || ''}`.trim() || '-' : '-' }
function date(v) { return v ? new Date(v).toLocaleDateString('fr-FR') : '-' }
function progression(o) { return Math.min(100, Math.round(Number(o.realise || 0) * 100 / Math.max(1, Number(o.cible || 0)))) }
function jours(v) { return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(Number(v || 0)) }
function soldeWidth(s) { return Math.min(100, Math.round(Number(s.utilise || 0) * 100 / Math.max(1, Number(s.annuel || 0)))) }
function syncForm() {
  Object.assign(form, {
    email: data.profil.email || '',
    telephone: data.profil.telephone || '',
    adresse: data.profil.adresse || '',
    date_naissance: data.profil.date_naissance.slice(0, 10) || '',
    contact_urgence: data.profil.contact_urgence || '',
  })
}
async function load() {
  try {
    Object.assign(data, (await api.get('/rh/mon-espace')).data)
    syncForm()
  } catch (e) {
    if (e.response.status === 422) notLinked.value = true
    else toast.error('Impossible de charger votre espace RH.')
  }
}
async function save() {
  try {
    data.profil = (await api.put('/rh/mon-espace/profil', form)).data
    syncForm()
    toast.success('Coordonnees mises a jour.')
  } catch (e) {
    toast.error(e.response.data.message || Object.values(e.response.data.errors || {})[0]?.[0] || 'Mise a jour impossible.')
  }
}
async function download(url, filename) {
  try {
    const response = await api.get(url, { responseType: 'blob' })
    const blobUrl = URL.createObjectURL(response.data)
    const link = document.createElement('a')
    link.href = blobUrl
    link.download = filename || 'document-rh'
    link.click()
    URL.revokeObjectURL(blobUrl)
  } catch (e) {
    toast.error(e.response.data.message || 'Telechargement impossible.')
  }
}

onMounted(load)
</script>

<style scoped>
.label { @apply space-y-1 text-sm font-medium text-slate-700; }
.panel-card { @apply rounded-lg border border-slate-200 bg-white p-4; }
.empty-line { @apply py-5 text-sm text-slate-400; }
.section-head { @apply flex items-center justify-between gap-3; }
.section-head h3 { @apply font-bold text-slate-900; }
.section-head span { @apply rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600; }
.item-row { @apply flex items-center justify-between gap-3 py-3 text-sm; }
.item-row strong { @apply text-slate-900; }
.item-row p { @apply mt-1 text-xs text-slate-500; }
</style>
